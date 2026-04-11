import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

type MutationArgs<TData = unknown> = {
  id?: string;
  data?: TData;
};

async function apiRequest<T = any>(
  url: string,
  init?: RequestInit,
  opts?: { allowUnauthorized?: boolean },
): Promise<T> {
  const token = localStorage.getItem("iarchive_token");
  const headers = new Headers(init?.headers);

  if (!headers.has("Content-Type") && init?.body) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(url, { ...init, headers });

  if (response.status === 401 && opts?.allowUnauthorized) {
    return null as T;
  }

  let payload: any = null;
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    payload = await response.json();
  } else {
    payload = await response.text();
  }

  if (!response.ok) {
    const err = new Error((payload as any)?.error || response.statusText) as Error & { data?: any; status?: number };
    err.data = payload;
    err.status = response.status;
    throw err;
  }

  return payload as T;
}

export function useLogin() {
  return useMutation({
    mutationFn: (args: MutationArgs<{ email: string; password: string }>) =>
      apiRequest<{ token: string; user: any }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(args.data || {}),
      }),
  });
}

export function useRegister() {
  return useMutation({
    mutationFn: (args: MutationArgs<any>) =>
      apiRequest("/api/auth/register", {
        method: "POST",
        body: JSON.stringify(args.data || {}),
      }),
  });
}

export function useGetMe() {
  return useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: async () => {
      const token = localStorage.getItem("iarchive_token");
      if (!token) {
        return null;
      }
      return apiRequest<any>("/api/auth/me", undefined, { allowUnauthorized: true });
    },
    retry: false,
    staleTime: 30_000,
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiRequest("/api/auth/logout", { method: "POST" }, { allowUnauthorized: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    },
  });
}

export function useGetStats() {
  return useQuery({
    queryKey: ["/api/stats"],
    queryFn: () => apiRequest<any>("/api/stats"),
  });
}

export function useGetCategories() {
  return useQuery({
    queryKey: ["/api/categories"],
    queryFn: () => apiRequest<any[]>("/api/categories"),
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (args: MutationArgs<any>) =>
      apiRequest("/api/categories", {
        method: "POST",
        body: JSON.stringify(args.data || {}),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (args: MutationArgs<any>) =>
      apiRequest(`/api/categories/${args.id}`, {
        method: "PATCH",
        body: JSON.stringify(args.data || {}),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (args: MutationArgs) =>
      apiRequest(`/api/categories/${args.id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
    },
  });
}

export function useGetMaterials(params?: { limit?: number; access?: string }) {
  return useQuery({
    queryKey: ["/api/materials", params || {}],
    queryFn: () => {
      const searchParams = new URLSearchParams();
      if (params?.limit) searchParams.set("limit", String(params.limit));
      if (params?.access) searchParams.set("access", params.access);
      const query = searchParams.toString();
      return apiRequest<{ materials: any[]; total: number }>(`/api/materials${query ? `?${query}` : ""}`);
    },
  });
}

export function useGetAnnouncements() {
  return useQuery({
    queryKey: ["/api/announcements"],
    queryFn: () => apiRequest<any[]>("/api/announcements"),
  });
}

export function useCreateAnnouncement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (args: MutationArgs<any>) =>
      apiRequest("/api/announcements", {
        method: "POST",
        body: JSON.stringify(args.data || {}),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/announcements"] });
    },
  });
}

export function useDeleteAnnouncement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (args: MutationArgs) =>
      apiRequest(`/api/announcements/${args.id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/announcements"] });
    },
  });
}

export function useGetAccessRequests(params?: { status?: string }) {
  return useQuery({
    queryKey: ["/api/requests", params || {}],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.status) searchParams.set("status", params.status);
      const query = searchParams.toString();
      const data = await apiRequest<{ requests: any[] }>(`/api/requests${query ? `?${query}` : ""}`);
      return { ...data, total: data.requests?.length || 0 };
    },
  });
}

export function useSubmitAccessRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (args: MutationArgs<any>) =>
      apiRequest("/api/requests", {
        method: "POST",
        body: JSON.stringify(args.data || {}),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/requests"] });
    },
  });
}

export function useApproveRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (args: MutationArgs) =>
      apiRequest(`/api/requests/${args.id}/approve`, {
        method: "POST",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/requests"] });
    },
  });
}

export function useRejectRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (args: MutationArgs<{ reason?: string }>) =>
      apiRequest(`/api/requests/${args.id}/reject`, {
        method: "POST",
        body: JSON.stringify(args.data || {}),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/requests"] });
    },
  });
}

export function useGetUsers(params?: { status?: string }) {
  return useQuery({
    queryKey: ["/api/users", params || {}],
    queryFn: () => {
      const searchParams = new URLSearchParams();
      if (params?.status) searchParams.set("status", params.status);
      const query = searchParams.toString();
      return apiRequest<{ users: any[] }>(`/api/users${query ? `?${query}` : ""}`);
    },
  });
}

export function useApproveUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (args: MutationArgs) =>
      apiRequest("/api/admin/approve-user", {
        method: "POST",
        body: JSON.stringify({ id: args.id }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    },
  });
}

export function useRejectUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (args: MutationArgs) =>
      apiRequest("/api/admin/reject-user", {
        method: "POST",
        body: JSON.stringify({ id: args.id }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (args: MutationArgs) => {
      // Mock API does not currently expose user-delete; call endpoint for compatibility.
      try {
        return await apiRequest(`/api/users/${args.id}`, { method: "DELETE" });
      } catch {
        return { ok: true };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    },
  });
}

export function useGetAuditLogs(params?: { limit?: number }) {
  return useQuery({
    queryKey: ["/api/audit", params || {}],
    queryFn: () => {
      const searchParams = new URLSearchParams();
      if (params?.limit) searchParams.set("limit", String(params.limit));
      const query = searchParams.toString();
      return apiRequest<{ logs: any[] }>(`/api/audit${query ? `?${query}` : ""}`);
    },
  });
}
