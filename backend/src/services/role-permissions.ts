import {
  applySuperAdminLock,
  defaultPermissionsForRole,
  isPermission,
  mergePermissions,
  type Permission,
} from "../constants/permissions.js";
import { Role } from "../models/role.model.js";

const CACHE_TTL_MS = 2_000;

type CacheEntry = {
  permissions: Permission[];
  updatedAt: number;
  expiresAt: number;
};

const cache = new Map<string, CacheEntry>();

export function invalidateRolePermissionCache(slug?: string): void {
  if (slug) {
    cache.delete(slug);
    return;
  }
  cache.clear();
}

function storeCache(slug: string, permissions: Permission[], updatedAt: Date | number = Date.now()): Permission[] {
  cache.set(slug, {
    permissions,
    updatedAt: typeof updatedAt === "number" ? updatedAt : updatedAt.getTime(),
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
  return permissions;
}

async function loadRolePermissions(slug: string): Promise<Permission[]> {
  const role = await Role.findOne({ slug }).select("permissions updatedAt");
  if (!role) {
    return storeCache(slug, defaultPermissionsForRole(slug));
  }
  return storeCache(slug, role.permissions.filter(isPermission), role.updatedAt);
}

export async function getStoredRolePermissions(role: string): Promise<Permission[]> {
  const hit = cache.get(role);
  if (hit && hit.expiresAt > Date.now()) {
    return hit.permissions;
  }
  return loadRolePermissions(role);
}

export async function getStoredRolePermissionsMap(roles: string[]): Promise<Map<string, Permission[]>> {
  const unique = [...new Set(roles.filter(Boolean))];
  const result = new Map<string, Permission[]>();
  const missing: string[] = [];

  for (const slug of unique) {
    const hit = cache.get(slug);
    if (hit && hit.expiresAt > Date.now()) {
      result.set(slug, hit.permissions);
    } else {
      missing.push(slug);
    }
  }

  if (missing.length > 0) {
    const docs = await Role.find({ slug: { $in: missing } }).select("slug permissions updatedAt");
    const found = new Set<string>();
    for (const doc of docs) {
      found.add(doc.slug);
      result.set(doc.slug, storeCache(doc.slug, doc.permissions.filter(isPermission), doc.updatedAt));
    }
    for (const slug of missing) {
      if (!found.has(slug)) {
        result.set(slug, storeCache(slug, defaultPermissionsForRole(slug)));
      }
    }
  }

  return result;
}

export async function resolveStoredRolePermissions(role: string, extra: readonly string[] = []): Promise<Permission[]> {
  const stored = await getStoredRolePermissions(role);
  return applySuperAdminLock(role, mergePermissions(stored, extra));
}
