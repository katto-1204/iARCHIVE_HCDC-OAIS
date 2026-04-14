import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getActivityFeed } from "@/data/storage";
import { firebaseAuth } from "@/lib/firebase-client";
import { signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword } from "firebase/auth";

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
      const demoEmails = new Set([
        "admin@hcdc.edu.ph",
        "archivist@hcdc.edu.ph",
        "student@hcdc.edu.ph",
      ]);
      if (demoEmails.has(email.toLowerCase()) && password === "admin123") {
        return apiRequest<{ token: string; user: any }>("/api/auth/login", {
          method: "POST",
          body: JSON.stringify({ email, password }),
        });
      }

      try {
        const cred = await signInWithEmailAndPassword(firebaseAuth, email, password);
        const idToken = await cred.user.getIdToken();
        return apiRequest<{ token: string; user: any }>("/api/auth/login", {
          method: "POST",
          body: JSON.stringify({ idToken, email, password }),
        });
      } catch (err: any) {
        if (import.meta.env.VITE_USE_REAL_API === "true") {
           try {
             return await apiRequest<{ token: string; user: any }>("/api/auth/login", {
               method: "POST",
               body: JSON.stringify({ email, password }),
             });
           } catch (apiErr) {
             // Fall through to existing error handlers if api also fails
           }
        }

        const code = err?.code || "";
        if (code === "auth/user-not-found") {
          throw new Error("Account not found");
        }
        if (code === "auth/wrong-password" || code === "auth/invalid-credential") {
          throw new Error("Invalid credentials");
        }
        if (code === "auth/too-many-requests") {
          throw new Error("Too many attempts. Please try again later.");
        }
        throw err;
      }
    },
  });
}

export function useUpdateMe() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name?: string; institution?: string; purpose?: string }) =>
      apiRequest("/api/auth/me", {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
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
        // Attempt client-side Firebase registration first
        const cred = await createUserWithEmailAndPassword(firebaseAuth, email, password);
        const idToken = await cred.user.getIdToken();
        await apiRequest("/api/auth/register", {
          method: "POST",
          body: JSON.stringify({
            idToken,
            name: payload.name,
            email,
            role: payload.role,
            institution: payload.institution,
            purpose: payload.purpose,
            password: password,
          }),
        });
        await signOut(firebaseAuth);
        return { ok: true };
      } catch (err: any) {
        // If it's a known Firebase error that suggests we should try local registration
        // (like 400 Bad Request, auth/operation-not-allowed, etc.)
        // or if VITE_USE_REAL_API is true, we attempt the backend call directly.
        const isFirebaseError = err?.code?.startsWith("auth/");
        const isRealApi = import.meta.env.VITE_USE_REAL_API === "true";

        if (isRealApi && (isFirebaseError || !err.code)) {
           try {
             return await apiRequest("/api/auth/register", {
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
           } catch (apiErr: any) {
             throw apiErr;
           }
        }
        
        const code = err?.code || "";
        if (code === "auth/email-already-in-use") {
          throw new Error("Email already registered");
        }
        if (code === "auth/invalid-email") {
          throw new Error("Invalid email address");
        }
        if (code === "auth/weak-password") {
          throw new Error("Password is too weak");
        }
        throw err;
      }
    },
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
      apiRequest(`/api/users/${args.id}/approve`, {
        method: "POST",
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
      apiRequest(`/api/users/${args.id}/reject`, {
        method: "POST",
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

export function useGetAuditLogs(params?: { limit?: number }, options?: any) {
  return useQuery<{ logs: any[] }>({
    queryKey: ["/api/audit", params || {}],
    ...options,
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
