import { AuthBindings } from "@refinedev/core";
import { axiosInstance } from "./dataProvider";
import { API_URL } from "./constants";
import dayjs from "dayjs";
import { User } from "./types/models";

// Constants for localStorage keys
export const TOKEN_KEY = "qnthugomrac-auth";
export const USER_KEY = "user";

// Variables for token refresh management
let refreshTimeoutId: ReturnType<typeof setTimeout> | null = null;
let isRefreshing = false;

/**
 * Retrieves the authentication token from localStorage
 * @returns Object containing accessToken and expiresAt, or null if not found
 */
export const getAuthenToken = (): {
  accessToken: string;
  expiresAt: string;
} | null => {
  const auth = localStorage.getItem(TOKEN_KEY);
  return auth ? JSON.parse(auth) : null;
};

/**
 * Saves authentication token and user data to localStorage
 * @param data Object containing accessToken, expiresAt and optional user data
 */
export const saveAuthenToken = (data: {
  accessToken: string;
  expiresAt: string;
  user?: User;
}) => {
  localStorage.setItem(
    TOKEN_KEY,
    JSON.stringify({ accessToken: data.accessToken, expiresAt: data.expiresAt })
  );
  if (data.user) {
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
  }
  axiosInstance.defaults.headers.common["Authorization"] = `Bearer ${data.accessToken}`;
};

/**
 * Removes authentication token and user data from localStorage
 */
export const removeAuthenToken = () => {
  axiosInstance.defaults.headers.common["Authorization"] = undefined;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

/**
 * Refreshes the authentication token
 * @returns New token data or null if refresh failed
 */
export const refreshToken = async () => {
  if (isRefreshing) return null;
  isRefreshing = true;
  try {
    const { data } = await axiosInstance.post(
      `${API_URL}/auth/refresh-token`,
      {},
      { withCredentials: true }
    );
    if (data?.accessToken && data?.expiresAt) {
      saveAuthenToken(data);
      setRefreshTimeout(data.expiresAt);
      return data;
    }
  } catch (error) {
    console.error("Refresh token failed:", error);
    removeAuthenToken();
  } finally {
    isRefreshing = false;
  }
  return null;
};

/**
 * Sets up a timeout to refresh the token before it expires
 * @param expiresAt Token expiration timestamp
 */
const setRefreshTimeout = (expiresAt: string) => {
  if (refreshTimeoutId) clearTimeout(refreshTimeoutId);
  const timeoutDuration = dayjs(expiresAt).diff(dayjs()) - 10_000;
  if (timeoutDuration > 0) {
    refreshTimeoutId = setTimeout(async () => {
      const data = await refreshToken();
      if (data) {
        setRefreshTimeout(data.expiresAt);
      }
    }, timeoutDuration);
  }
};

/**
 * Auth provider implementation for Refine
 */
export const authProvider: AuthBindings = {
  login: async ({ username, password }) => {
    try {
      if (!username || !password) {
        return {
          success: false,
          error: {
            name: "LoginError",
            message: "Vui lòng nhập tên đăng nhập và mật khẩu",
          },
        };
      }
      const { data } = await axiosInstance.post(
        `${API_URL}/auth/login`,
        { username, password },
        { withCredentials: true }
      );
      if (data?.accessToken && data?.expiresAt) {
        saveAuthenToken(data);
        setRefreshTimeout(data.expiresAt);
        return { success: true, redirectTo: "/ban-do" };
      }
    } catch (error) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      return {
        success: false,
        error: {
          name: "LoginError",
          message: axiosError.response?.data?.message || "Đăng nhập thất bại",
        },
      };
    }
    return {
      success: false,
      error: {
        name: "LoginError",
        message: "Thông tin đăng nhập không hợp lệ",
      },
    };
  },

  logout: async () => {
    try {
      const storedUser = localStorage.getItem(USER_KEY);
      let userId = null;
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        userId = parsed.id;
      }
      await axiosInstance.post(
        `${API_URL}/auth/logout`,
        { userId },
        { withCredentials: true }
      );
    } catch (error) {
      console.error("Logout failed:", error);
    }
    removeAuthenToken();
    return { success: true, redirectTo: "/ban-do" };
  },

  check: async () => {
    const auth = getAuthenToken();
    if (auth) {
      if (dayjs(auth.expiresAt).isAfter(dayjs())) {
        setRefreshTimeout(auth.expiresAt);
        return { authenticated: true };
      }
      const data = await refreshToken();
      if (data) {
        setRefreshTimeout(data.expiresAt);
        return { authenticated: true };
      }
      removeAuthenToken();
    }
    return { authenticated: false, redirectTo: "/ban-do" };
  },

  register: async ({ username, password }) => {
    try {
      delete axiosInstance.defaults.headers.common["Authorization"];
      if (!username || !password) {
        return {
          success: false,
          error: {
            name: "RegisterError",
            message: "Vui lòng nhập đầy đủ thông tin",
          },
        };
      }
      const { data } = await axiosInstance.post(`${API_URL}/auth/register`, {
        username,
        password,
      });
      if (data) {
        return { success: true, redirectTo: "/login" };
      }
    } catch (error) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      return {
        success: false,
        error: {
          name: "RegisterError",
          message:
            axiosError.response?.data?.message ||
            "Đăng ký thất bại, vui lòng thử lại",
        },
      };
    }
    return {
      success: false,
      error: { name: "RegisterError", message: "Đăng ký thất bại" },
    };
  },

  getPermissions: async () => {
    try {
      const { data } = await axiosInstance.get(
        `${API_URL}/users/me/permissions`
      );
      return data || [];
    } catch (error) {
      console.error("Error getting permissions:", error);
      return [];
    }
  },

  getIdentity: async () => {
    const storedUser = localStorage.getItem(USER_KEY);
    if (!storedUser) return null;
    return JSON.parse(storedUser);
  },

  onError: async (error) => {
    console.error("Auth error:", error);
    return { error };
  },
};

export { axiosInstance };
