import { apiRequest } from "../../apiService";
import { Notification } from "../../../types/models/notification";
import { PaginatedResponse } from "../../../types/api";

/** Lấy phân trang thông báo của user hiện tại */
export const getMyNotifications = async (
  userId: number,
  page = 1,
  limit = 5
): Promise<PaginatedResponse<Notification>> => {
  return apiRequest<PaginatedResponse<Notification>>(
    `/notifications/my-notifications`,
    {
      auth: true,
      method: "GET",
      params: { userId, page, limit },
    }
  );
};

/** Lấy số thông báo chưa đọc */
export const getMyUnreadCount = async (): Promise<number> =>
  apiRequest<number>(`/notifications/my-unread-count`, {
    auth: true,
    method: "GET",
  });

/** Lấy thông báo theo status điểm (pending/approved/rejected) */
export const getMyNotificationsByPointStatus = async (
  status: "pending" | "approved" | "rejected"
): Promise<Notification[]> =>
  apiRequest<Notification[]>(
    `/notifications/my-notifications/by-status/${status}`,
    {
      auth: true,
      method: "GET",
    }
  );

/** Đánh dấu 1 thông báo đã đọc */
export const markAsRead = async (id: number): Promise<Notification> =>
  apiRequest<Notification>(`/notifications/${id}/mark-read`, {
    auth: true,
    method: "PATCH",
  });

/** Đánh dấu tất cả thông báo đã đọc */
export const markAllAsRead = async (): Promise<void> =>
  apiRequest<void>(`/notifications/mark-all-read`, {
    auth: true,
    method: "POST",
  });

/** Lấy N thông báo mới nhất */
export const getMyLatestNotifications = async (
  limit = 5
): Promise<Notification[]> =>
  apiRequest<Notification[]>(`/notifications/my-latest`, {
    auth: true,
    method: "GET",
    params: { limit },
  });

/** (Admin) Lấy phân trang thông báo của bất kỳ user */
export const getUserNotifications = async (
  userId: number,
  page = 1,
  limit = 10
): Promise<PaginatedResponse<Notification>> =>
  apiRequest<PaginatedResponse<Notification>>(
    `/notifications/user/${userId}`,
    {
      auth: true,
      method: "GET",
      params: { page, limit },
    }
  );

/** (Admin) Lấy số thông báo chưa đọc của bất kỳ user */
export const getUserUnreadCount = async (userId: number): Promise<number> =>
  apiRequest<number>(`/notifications/user/${userId}/unread-count`, {
    auth: true,
    method: "GET",
  });

/** (Admin) Lấy thông báo theo status điểm của bất kỳ user */
export const getUserNotificationsByStatus = async (
  userId: number,
  status: "pending" | "approved" | "rejected"
): Promise<Notification[]> =>
  apiRequest<Notification[]>(
    `/notifications/user/${userId}/by-status/${status}`,
    {
      auth: true,
      method: "GET",
    }
  );
