import nestjsxCrudDataProvider, {
  axiosInstance,
} from "@refinedev/nestjsx-crud";
import { getAuthenToken, saveAuthenToken, refreshToken } from "./authProvider";

// Base API URL
const apiUrl = "/api";

// Configure axios instance
axiosInstance.defaults.withCredentials = true;

// Create dataProvider from nestjsx-crud
const dataProvider = nestjsxCrudDataProvider(apiUrl, axiosInstance);

/**
 * List of endpoints that do not require authentication
 * or do not need token refresh on 401 errors
 */
const PUBLIC_ENDPOINTS = ["/auth/register", "/auth/login"];

/**
 * Checks if a URL belongs to public endpoints
 * @param url The URL to check
 * @returns boolean indicating if the URL is a public endpoint
 */
const isPublicEndpoint = (url?: string): boolean => {
  if (!url) return false;
  return PUBLIC_ENDPOINTS.some((endpoint) => url.endsWith(endpoint));
};

/**
 * Request interceptor to add authentication token to requests
 */
axiosInstance.interceptors.request.use(
  (config) => {
    const auth = getAuthenToken();
    if (auth?.accessToken) {
      config.headers = config.headers ?? {};
      config.headers["Authorization"] = `Bearer ${auth.accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Response interceptor to handle token refresh on 401 errors
 */
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Skip refresh logic for public endpoints
    if (isPublicEndpoint(error.config?.url)) {
      return Promise.reject(error);
    }

    // Skip if not a 401 error
    if (error.response?.status !== 401) {
      return Promise.reject(error);
    }

    // Attempt to refresh token
    const originalRequest = error.config;
    try {
      const newData = await refreshToken();
      if (!newData?.accessToken) {
        throw new Error("Refresh token failed");
      }
      saveAuthenToken(newData);
      originalRequest.headers["Authorization"] = `Bearer ${newData.accessToken}`;
      return axiosInstance(originalRequest);
    } catch (refreshError) {
      return Promise.reject(refreshError);
    }
  }
);

export default dataProvider;
export { axiosInstance, apiUrl };
