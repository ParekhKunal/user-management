import crypto from "node:crypto";

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function randomToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString("hex");
}

export function isObjectId(value: string): boolean {
  return /^[a-fA-F0-9]{24}$/.test(value);
}

export function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function toId(value: unknown): string {
  if (value && typeof value === "object" && "toString" in value) {
    return String(value);
  }
  return String(value ?? "");
}
