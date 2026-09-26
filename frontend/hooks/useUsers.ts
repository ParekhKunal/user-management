"use client";

import { useCallback, useEffect, useState } from "react";
import { api, getApiErrorMessage } from "@/lib/api";
import type { DashboardStats, User, UserRole, UserStatus, UsersResponse } from "@/types/user";

interface UseUsersOptions {
  page?: number;
  limit?: number;
  search?: string;
  role?: UserRole | "";
  status?: UserStatus | "";
}

export function useUsers(options: UseUsersOptions) {
  const [data, setData] = useState<UsersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get("/users", {
        params: {
          page: options.page ?? 1,
          limit: options.limit ?? 10,
          search: options.search || undefined,
          role: options.role || undefined,
          status: options.status || undefined,
        },
      });
      setData(response.data.data);
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to load users"));
    } finally {
      setLoading(false);
    }
  }, [options.page, options.limit, options.search, options.role, options.status]);

  useEffect(() => {
    void load();
  }, [load]);

  return { data, loading, error, reload: load };
}

export function usePendingUsers(enabled = true) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(enabled);

  const load = useCallback(async () => {
    if (!enabled) {
      return;
    }
    setLoading(true);
    try {
      const response = await api.get("/users/pending");
      setUsers(response.data.data);
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    void load();
  }, [load]);

  return { users, loading, reload: load };
}

export function useDashboardStats(enabled = true) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(enabled);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    api
      .get("/users/stats")
      .then((response) => {
        if (!cancelled) {
          setStats(response.data.data);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return { stats, loading };
}
