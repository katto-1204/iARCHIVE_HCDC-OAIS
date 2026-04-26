import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getActivityFeed } from "@/data/storage";
import { firebaseAuth } from "@/lib/firebase-client";
import { signOut } from "firebase/auth";

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
    mutationFn: async (args: MutationArgs<{ email: string; password: string }>) => {
      const email = args.data?.email || "";
      const password = args.data?.password || "";

      // All logins go through the backend API — no client-side Firebase Auth needed.
      // The backend handles Firebase Admin SDK auth, demo accounts, and fallbacks.
      try {
        return await apiRequest<{ token: string; user: any }>("/api/auth/login", {
          method: "POST",
          body: JSON.stringify({ email, password }),
        });
      } catch (err: any) {
        // Parse backend error into user-friendly message
        const raw = err?.data?.error || err?.message || "";
        const rejectionReason = err?.data?.rejectionReason || "";
        if (/rejected/i.test(raw)) {
          const msg = rejectionReason
            ? `Your account application has been rejected. Reason: "${rejectionReason}"`
            : "Your account application has been rejected by an administrator.";
          throw new Error(msg);
        }
        if (/not active|approval|pending/i.test(raw)) {
          throw new Error("Your account is pending approval. Please wait for an administrator to activate your account.");
        }
        if (/not found|no user|invalid login/i.test(raw)) {
          throw new Error("No account found with that email. Please register first.");
        }
        if (/invalid credentials|wrong password|INVALID_PASSWORD/i.test(raw)) {
          throw new Error("Incorrect password. Please try again.");
        }
        if (/INVALID_LOGIN_CREDENTIALS/i.test(raw)) {
          throw new Error("Invalid email or password. Please check your credentials and try again.");
        }
        if (/too many/i.test(raw)) {
          throw new Error("Too many login attempts. Please wait a few minutes and try again.");
        }
        if (/EMAIL_NOT_FOUND/i.test(raw)) {
          throw new Error("No account found with that email. Please register first.");
        }
        throw new Error(raw || "Login failed. Please try again.");
      }
    },
  });
}

export function useRegister() {
  return useMutation({
    mutationFn: async (args: MutationArgs<any>) => {
      const payload = args.data || {};
      const email = payload.email || "";
      const password = payload.password || "";
      
      try {
        await apiRequest("/api/auth/register", {
          method: "POST",
          body: JSON.stringify({
            name: payload.name,
            email,
            password,
            role: payload.role,
            institution: payload.institution,
            purpose: payload.purpose,
          }),
        });
        return { ok: true };
      } catch (err: any) {
        const msg = err?.data?.error || err?.message || "";
        if (msg.includes("already registered") || msg.includes("email-already-in-use")) {
          throw new Error("Email already registered");
        }
        throw err;
      }
    },
  });
}

export function useGetMe() {
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem("iarchive_token") : null;
  return useQuery({
    queryKey: ["/api/auth/me", token],
    queryFn: async () => {
      if (!token) {
        return null;
      }
      return apiRequest<any>("/api/auth/me", undefined, { allowUnauthorized: true });
    },
    retry: false,
    staleTime: 30_000,
    enabled: !!token,
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: MutationArgs<any>) =>
      apiRequest("/api/auth/profile", {
        method: "PATCH",
        body: JSON.stringify(args.data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/auth/me"] });
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      try {
        await signOut(firebaseAuth);
      } catch {
        // Ignore client sign-out errors.
      }
      return apiRequest("/api/auth/logout", { method: "POST" }, { allowUnauthorized: true });
    },
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

export function useGetMaterials(params?: { limit?: number; access?: string; search?: string; category?: string; page?: number }) {
  return useQuery({
    queryKey: ["/api/materials", params || {}],
    queryFn: () => {
      const searchParams = new URLSearchParams();
      if (params?.limit) searchParams.set("limit", String(params.limit));
      if (params?.access) searchParams.set("access", params.access);
      if (params?.search) searchParams.set("search", params.search);
      if (params?.category) searchParams.set("category", params.category);
      if (params?.page) searchParams.set("page", String(params.page));
      const query = searchParams.toString();
      return apiRequest<{ materials: any[]; total: number; totalPages: number }>(`/api/materials${query ? `?${query}` : ""}`);
    },
  });
}

export function useGetMaterial(id: string | undefined | null) {
  return useQuery({
    queryKey: ["/api/materials", id],
    queryFn: async () => {
      if (!id) return null;
      return apiRequest<any>(`/api/materials/${id}`);
    },
    enabled: !!id,
  });
}

export function useDeleteMaterial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiRequest<any>(`/api/materials/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/materials"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
    },
  });
}

export function useCreateMaterial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (args: MutationArgs<any>) =>
      apiRequest("/api/materials", {
        method: "POST",
        body: JSON.stringify(args.data || {}),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/materials"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
    },
  });
}

export function useUpdateMaterial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (args: MutationArgs<any>) =>
      apiRequest(`/api/materials/${args.id}`, {
        method: "PUT",
        body: JSON.stringify(args.data || {}),
      }),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/materials"] });
      queryClient.setQueryData(["/api/materials", data.id], data);
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

// =====================
// Ingest Requests Hooks
// =====================

export function useGetIngestRequests(params?: { status?: string }) {
  return useQuery({
    queryKey: ["/api/ingest-requests", params || {}],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.status) searchParams.set("status", params.status);
      const query = searchParams.toString();
      const data = await apiRequest<{ requests: any[] }>(`/api/ingest-requests${query ? `?${query}` : ""}`);
      return data.requests;
    },
  });
}

export function useSubmitIngestRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (args: MutationArgs<any>) =>
      apiRequest("/api/ingest-requests", {
        method: "POST",
        body: JSON.stringify(args.data || {}),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ingest-requests"] });
    },
  });
}

export function useApproveIngestRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (args: MutationArgs) =>
      apiRequest(`/api/ingest-requests/${args.id}/approve`, {
        method: "POST",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ingest-requests"] });
    },
  });
}

export function useRejectIngestRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (args: MutationArgs) =>
      apiRequest(`/api/ingest-requests/${args.id}/reject`, {
        method: "POST",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ingest-requests"] });
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
      apiRequest(`/api/users/${args.id}/approve`, { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    },
  });
}

export function useRejectUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (args: MutationArgs<{ reason?: string }>) =>
      apiRequest(`/api/users/${args.id}/reject`, {
        method: "POST",
        body: JSON.stringify({ reason: args.data?.reason || "" }),
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
        if (import.meta.env.DEV) return { ok: true };
        throw new Error("Failed to delete user");
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
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.limit) searchParams.set("limit", String(params.limit));
      const query = searchParams.toString();

      const feed = getActivityFeed();
      const localLogs = feed.map((entry) => ({
        id: entry.id,
        createdAt: entry.timestamp,
        userName: entry.user,
        action: entry.actionType,
        entityType: "material",
        entityId: entry.materialId || "-",
        details: entry.description,
      }));

      let apiLogs: any[] = [];
      try {
        const apiResp = await apiRequest<{ logs: any[] }>(`/api/audit${query ? `?${query}` : ""}`);
        apiLogs = apiResp?.logs || [];
      } catch {
        apiLogs = [];
      }

      const merged = [...apiLogs, ...localLogs]
        .filter((log) => log && log.createdAt)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      const limited = params?.limit ? merged.slice(0, params.limit) : merged;
      return { logs: limited };
    },
  });
}

export function useGetFeedbacks() {
  return useQuery({
    queryKey: ["/api/feedback"],
    queryFn: () => apiRequest<any[]>("/api/feedback"),
  });
}

export function useSubmitFeedback() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (args: MutationArgs<any>) =>
      apiRequest("/api/feedback", {
        method: "POST",
        body: JSON.stringify(args.data || {}),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/feedback"] });
    },
  });
}

export function useMarkFeedbackRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (args: MutationArgs) =>
      apiRequest(`/api/feedback/${args.id}/read`, {
        method: "PATCH",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/feedback"] });
    },
  });
}

export function useDeleteFeedback() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (args: MutationArgs) =>
      apiRequest(`/api/feedback/${args.id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/feedback"] });
    },
  });
}
