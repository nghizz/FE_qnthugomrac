import { createContext, useContext, useState } from "react";
import { Notification } from "../types/models/notification";

type NotificationContextType = {
  notifications: [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  addNotification: (notification: any) => void;
  markAsRead: (id: number) => void;
};

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);
export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = (notification: Notification) => {
    setNotifications((prev) => [...prev, notification]);
  };
  const markAsRead = (id: number) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };
  return (
    <NotificationContext.Provider value={{ notifications: notifications as [], addNotification, markAsRead }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error("useNotification must be used within a NotificationProvider");
  return context;
};