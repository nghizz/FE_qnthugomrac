import { User } from "../types/models";

export const getCurrentUser = (): User | null => {
  const storedUser = localStorage.getItem("user");
  if (storedUser) {
    try {
      return JSON.parse(storedUser) as User;
    } catch (error) {
      console.error("Error parsing user from localStorage:", error);
      return null;
    }
  }
  return null;
};

export const getUserRole = (): "admin" | "user" => {
  const currentUser = getCurrentUser();
  return currentUser?.role || "user";
};

export const getIDUser = (): number | null => {
  const storedUser = localStorage.getItem("user");
  if (storedUser) {
    try {
      const user = JSON.parse(storedUser);
      return user.id || null;
    } catch (error) {
      console.error("Error parsing user from localStorage:", error);
      return null;
    }
  }
  return null;
};
