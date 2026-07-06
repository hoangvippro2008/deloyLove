import { authRequest } from "@/lib/auth-client";

export type AdminListResponse<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

export type AdminUserStatus = "ACTIVE" | "BLOCKED" | "DELETED";
export type AdminUserRole = "USER" | "ADMIN";

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  status: AdminUserStatus;
  role: AdminUserRole;
  lastLoginAt: string | null;
  lastSeenAt: string | null;
  createdAt: string | null;
};

export type AdminUserRoom = {
  id: string;
  roomName: string;
  status: string;
  role: string;
  joinedAt: string | null;
};

export type AdminUserDetail = AdminUser & { rooms: AdminUserRoom[] };

export type AdminUserListQuery = {
  page?: number;
  pageSize?: number;
  q?: string;
  status?: AdminUserStatus | "";
  role?: AdminUserRole | "";
  sort?: string;
  order?: "asc" | "desc";
};

const toQueryString = (params: Record<string, unknown>) => {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      search.set(key, String(value));
    }
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
};

// ------- Users -------
export const adminListUsers = (query: AdminUserListQuery = {}) =>
  authRequest<AdminListResponse<AdminUser>>(`/admin/users${toQueryString(query)}`);

export const adminGetUser = (id: string) => authRequest<AdminUserDetail>(`/admin/users/${id}`);

export const adminSetUserStatus = (id: string, status: AdminUserStatus) =>
  authRequest<AdminUserDetail>(`/admin/users/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status })
  });

export const adminSetUserRole = (id: string, role: AdminUserRole) =>
  authRequest<AdminUserDetail>(`/admin/users/${id}/role`, {
    method: "PATCH",
    body: JSON.stringify({ role })
  });

export const adminResetUserPassword = (id: string) =>
  authRequest<{ tempPassword: string }>(`/admin/users/${id}/reset-password`, {
    method: "POST"
  });

// ------- Rooms -------
export type AdminRoom = {
  id: string;
  roomName: string;
  inviteCode: string;
  status: string;
  memberCount: number;
  createdAt: string | null;
};

export type AdminRoomMember = {
  userId: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  role: string;
  nickname: string | null;
  joinedAt: string | null;
};

export type AdminRoomDetail = {
  id: string;
  roomName: string;
  inviteCode: string;
  status: string;
  theme: string;
  anniversaryDate: string | null;
  ownerUserId: string;
  createdAt: string | null;
  members: AdminRoomMember[];
  counts: Record<string, number>;
};

export const adminListRooms = (query: { page?: number; q?: string; status?: string } = {}) =>
  authRequest<AdminListResponse<AdminRoom>>(`/admin/rooms${toQueryString(query)}`);

export const adminGetRoom = (id: string) => authRequest<AdminRoomDetail>(`/admin/rooms/${id}`);

export const adminRemoveRoomMember = (roomId: string, userId: string) =>
  authRequest<AdminRoomDetail>(`/admin/rooms/${roomId}/members/${userId}`, { method: "DELETE" });

// ------- Content oversight (read-only) -------
export type AdminContentType = { key: string; label: string };

export type AdminContentItem = {
  id: string;
  roomId: string;
  roomName: string;
  values: Record<string, unknown>;
};

export type AdminContentResponse = AdminListResponse<AdminContentItem> & {
  type: string;
  label: string;
  columns: string[];
};

export const adminListContentTypes = () => authRequest<AdminContentType[]>("/admin/content/types");

export const adminListContent = (type: string, query: { page?: number; q?: string; roomId?: string } = {}) =>
  authRequest<AdminContentResponse>(`/admin/content/${type}${toQueryString(query)}`);

// ------- Daily questions -------
export type AdminQuestion = {
  id: string;
  question: string;
  category: string | null;
  isActive: boolean;
  createdAt: string | null;
};

export const adminListQuestions = (query: { page?: number; q?: string; category?: string; isActive?: string } = {}) =>
  authRequest<AdminListResponse<AdminQuestion>>(`/admin/daily-questions${toQueryString(query)}`);

export const adminCreateQuestion = (input: { question: string; category?: string }) =>
  authRequest<AdminQuestion>("/admin/daily-questions", { method: "POST", body: JSON.stringify(input) });

export const adminUpdateQuestion = (id: string, input: { question: string; category?: string }) =>
  authRequest<AdminQuestion>(`/admin/daily-questions/${id}`, { method: "PATCH", body: JSON.stringify(input) });

export const adminSetQuestionActive = (id: string, isActive: boolean) =>
  authRequest<AdminQuestion>(`/admin/daily-questions/${id}/active`, {
    method: "PATCH",
    body: JSON.stringify({ isActive })
  });

export const adminDeleteQuestion = (id: string) =>
  authRequest<{ deleted: boolean }>(`/admin/daily-questions/${id}`, { method: "DELETE" });

// ------- Metrics -------
export type AdminMetrics = {
  users: { total: number; active: number; blocked: number; deleted: number; admins: number; onlineNow: number; new7d: number };
  rooms: { total: number; paired: number; waiting: number; pairingRate: number };
  content: { memories: number; songs: number; photos: number; letters: number; walletTotal: number };
  signups: { date: string; count: number }[];
};

export const adminGetMetrics = () => authRequest<AdminMetrics>("/admin/metrics");

// ------- Settings -------
export type AdminSetting = { key: string; value: unknown; updatedBy: string | null; updatedAt: string | null };

export const adminGetSettings = () => authRequest<AdminSetting[]>("/admin/settings");

export const adminSetSetting = (key: string, value: unknown) =>
  authRequest<{ key: string; value: unknown }>(`/admin/settings/${encodeURIComponent(key)}`, {
    method: "PUT",
    body: JSON.stringify({ value })
  });

// ------- Broadcast -------
export const adminBroadcast = (input: { title: string; content?: string }) =>
  authRequest<{ recipients: number }>("/admin/broadcast", { method: "POST", body: JSON.stringify(input) });

// ------- Audit -------
export type AdminAuditEntry = {
  id: string;
  adminUserId: string | null;
  adminName: string | null;
  adminEmail: string | null;
  action: string;
  targetType: string | null;
  targetId: string | null;
  detail: unknown;
  ip: string | null;
  createdAt: string | null;
};

export const adminListAudit = (query: { page?: number; q?: string } = {}) =>
  authRequest<AdminListResponse<AdminAuditEntry>>(`/admin/audit${toQueryString(query)}`);
