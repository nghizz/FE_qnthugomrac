// src/api/point.ts
import { apiRequest } from "../../apiService";
import {
  PaginatedResponse,
  Point,
  PointResponse,
  PointCreate,
  PointUpdate,
} from "../../../types/models/point";

/** Lấy danh sách phân trang, có thể filter theo status 
 *  -> Không cần token, vì Controller GET('/find') không dùng guard
 */
export const getCollectionPoints = async (
  page = 1,
  limit = 10,
  status?: string
): Promise<PaginatedResponse<Point>> =>
  apiRequest<PaginatedResponse<Point>>(
    `/collection-point/find`,
    {
      // Không cần auth vì endpoint này không được bảo vệ
      method: "GET",
      params: { page, limit, ...(status ? { status } : {}) },
    }
  );

/** Lấy danh sách tất cả các điểm (không phân trang)
 *  -> Không cần token
 */
export const getAllCollectionPoints = async (): Promise<Point[]> =>
  apiRequest<Point[]>("/collection-point", {
    // Không đặt auth:true ở đây bởi vì GET /collection-point không có guard
    method: "GET",
  });

/** Lấy chi tiết 1 điểm (theo id) 
 *  -> Không yêu cầu token (GET :id) 
 */
export const getCollectionPoint = async (
  id: number
): Promise<PointResponse> =>
  apiRequest<PointResponse>(`/collection-point/${id}`, {
    method: "GET",
  });

/** Tìm kiếm theo tên
 *  -> Cần token, vì GET('/search') được bảo vệ
 */
export const searchCollectionPoints = async (
  name: string
): Promise<Point[]> =>
  apiRequest<Point[]>(`/collection-point/search`, {
    auth: true,
    method: "GET",
    params: { name },
  });
/** Lấy danh sách pending phân trang */
export const fetchPendingPointsPaginated = async (
  page = 1,
  limit = 10
): Promise<PaginatedResponse<Point>> =>
  getCollectionPoints(page, limit, "pending");

/** Tạo mới (POST)
 *  -> Cần token
 */
export const createCollectionPoint = async (
  payload: PointCreate
): Promise<PointResponse> =>
  apiRequest<PointResponse>("/collection-point", {
    auth: true,
    method: "POST",
    body: JSON.stringify({
      ...payload,
      srid: payload.srid ?? 4326,
    }),
  });

/** Cập nhật (PATCH)
 *  -> Cần token
 */
export const updateCollectionPoint = async (
  id: number,
  payload: PointUpdate
): Promise<PointResponse> =>
  apiRequest<PointResponse>(`/collection-point/${id}`, {
    auth: true,
    method: "PATCH",
    body: JSON.stringify(payload),
  });

/** Xóa (DELETE)
 *  -> Cần token
 */
export const deleteCollectionPoint = async (
  id: number
): Promise<void> =>
  apiRequest<void>(`/collection-point/${id}`, {
    auth: true,
    method: "DELETE",
  });

/** Phê duyệt / từ chối (PATCH review)
 *  -> Cần token
 */
export const reviewCollectionPoint = async (
  id: number,
  status: "approved" | "rejected"
): Promise<PointResponse> =>
  apiRequest<PointResponse>(`/collection-point/${id}/review`, {
    auth: true,
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
