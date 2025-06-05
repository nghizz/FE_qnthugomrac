// src/api/apiService.ts
import { API_URL } from "../constants";

/**
 * Lấy token từ localStorage theo key "qnthugomrac-auth"
 */
export const getAuthToken = (): string => {
  const storedAuth = localStorage.getItem("qnthugomrac-auth");
  if (!storedAuth) {
    console.warn("Không tìm thấy token trong localStorage (key: qnthugomrac-auth)");
    return "";
  }
  try {
    const parsed = JSON.parse(storedAuth);
    if (parsed && typeof parsed.accessToken === "string") {
      return parsed.accessToken;
    } else {
      console.warn("Cấu trúc token không hợp lệ:", parsed);
      return "";
    }
  } catch (error) {
    console.error("Error parsing storedAuth:", error);
    return "";
  }
};

interface ApiRequestOptions extends RequestInit {
  auth?: boolean;               // Nếu true: thêm header Authorization
  params?: Record<string, string | number | boolean>; // Query parameters
}

/**
 * Build URL với query params.
 */
const buildUrl = (base: string, params?: Record<string, string | number | boolean>): string => {
  if (!params) return base;
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.append(key, value.toString());
    }
  });
  const qs = searchParams.toString();
  return qs ? `${base}${base.includes("?") ? "&" : "?"}${qs}` : base;
};

/**
 * Kiểm tra endpoint có phải là URL đầy đủ không.
 */
const isFullUrl = (url: string): boolean => /^https?:\/\//i.test(url);

/**
 * Generic API request.
 */
export const apiRequest = async <T>(
  endpoint: string,
  options: ApiRequestOptions = {}
): Promise<T> => {
  const { auth, headers, params, ...rest } = options;
  
  // Nếu endpoint không phải là full URL, prefix với API_URL
  const base = isFullUrl(endpoint) ? endpoint : API_URL + endpoint;
  const url = buildUrl(base, params);
  
  const finalHeaders: Record<string, string> = { ...(headers as Record<string, string>) };

  // Nếu yêu cầu auth, thêm token vào header Authorization
  if (auth) {
    const token = getAuthToken();
    if (!token) {
      throw new Error("Bạn chưa đăng nhập");
    }
    finalHeaders["Authorization"] = `Bearer ${token}`;
  }

  // Set header Content-Type cho các method không phải GET
  if (rest.method && rest.method.toUpperCase() !== "GET") {
    finalHeaders["Content-Type"] = "application/json";
  }

  const res = await fetch(url, {
    headers: finalHeaders,
    ...rest,
  });

  if (!res.ok) {
    let msg = "Lỗi khi kết nối đến máy chủ";
    try {
      const err = await res.json();
      msg = err.message || msg;
    } catch (error) {
      console.error("Error parsing error response:", error);
    }
    throw new Error(msg);
  }

  if (res.status === 204) {
    return undefined as unknown as T;
  }

  return res.json();
};
