import React, { FC, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Dropdown, notification } from "antd";
import { LogoutOutlined } from "@ant-design/icons";
import { authProvider, removeAuthenToken } from "../../../authProvider";
import { getCurrentUser } from "../../../utils/user";
import UserNotificationsPopup from "../notifications/notification/user-notification";
import {
  reviewCollectionPoint,
  fetchPendingPointsPaginated,
} from "../../../api/endpoints/points";
import PopupNotification from "../notifications/notification/popup";

import "./Navbar.css";
import NotificationIcon from "../../common/app-icon/notification-icon";
import { DEFAULT_PAGE, DEFAULT_LIMIT, PROJECT_NAME } from "../../../constants";
import { useMapContext } from "../../../context/mapContext";
import { fromLonLat } from "ol/proj";
import { View } from "ol";
import openDetailPopup from "../notifications/detail/popup";
import { Point } from "../../../types/models/point";
import { getUserUnreadCount } from "../../../api/endpoints/notifications/index";

/**
 * Interface for user information
 */
interface UserInfo {
  username: string;
  role: string;
}

const Navbar: FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserInfo | null>(null);
  const { map } = useMapContext();

  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [pendingPoints, setPendingPoints] = useState<Point[]>([]);
  const [page, setPage] = useState(DEFAULT_PAGE);
  const [limit, setLimit] = useState(DEFAULT_LIMIT);
  const [total, setTotal] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);

  const handlePointHover = (lat: number, lng: number) => {
    if (!map) return;
    const coordinates = fromLonLat([lng, lat]);
    map.setView(new View({ center: coordinates, zoom: 18 }));
  };

  const loadPendingPoints = async (page: number, limit: number) => {
    try {
      const response = await fetchPendingPointsPaginated(page, limit);
      setPendingPoints(
        response.data.map((point) => ({
          ...point,
          srid: 4326,
          frequency:
            typeof point.frequency === "number" ? point.frequency : undefined,
          created_by: point.created_by,
          createdBy: {
            id: point.createdBy?.id ?? 0,
            username: point.createdBy?.username ?? "Unknown",
          },
          created_at: point.created_at || new Date().toISOString(),
        }))
      );
      setTotal(response.total);
      setPage(response.page);
      setLimit(response.limit);
    } catch (error) {
      console.error("Error loading pending points:", error);
    }
  };

  const userId = getCurrentUser()?.id; // Lấy userId từ hàm getCurrentUser
  const loadUnreadCount = async () => {
    try {
      if (!user) return; // Đảm bảo user đã được lấy
      if (userId !== undefined) {
        const unreadCount = await getUserUnreadCount(userId); // Gọi API với userId
        setUnreadCount(unreadCount);
      }
      setUnreadCount(unreadCount);
    } catch (error) {
      console.error("Error loading unread count:", error);
    }
  };

  const handleOpenNotification = () => {
    setShowAdminModal(true);
    loadPendingPoints(page, limit);
  };

  const handleOpenUserNotification = () => {
    setShowUserModal(true);
  };

  const handleAccept = async (id: string) => {
    try {
      await reviewCollectionPoint(Number(id), "approved");
      notification.success({ message: "Điểm đã được phê duyệt" });
      setPendingPoints((prev) => prev.filter((p) => p.id !== Number(id)));
      setTotal((prev) => prev - 1);
    } catch (error) {
      console.error("Error accepting point:", error);
    }
  };

  const handleReject = async (id: string) => {
    try {
      await reviewCollectionPoint(Number(id), "rejected");
      notification.success({ message: "Điểm đã bị từ chối" });
      setPendingPoints((prev) => prev.filter((p) => p.id !== Number(id)));
      setTotal((prev) => prev - 1);
    } catch (error) {
      console.error("Error rejecting point:", error);
    }
  };

  const handleAcceptAll = async () => {
    try {
      for (const point of pendingPoints) {
        await reviewCollectionPoint(point.id, "approved");
      }
      notification.success({ message: "Tất cả điểm đã được phê duyệt" });
      setPendingPoints([]);
      setTotal(0);
    } catch (error) {
      console.error("Error accepting all points:", error);
    }
  };

  const handleRejectAll = async () => {
    try {
      for (const point of pendingPoints) {
        await reviewCollectionPoint(point.id, "rejected");
      }
      notification.success({ message: "Tất cả điểm đã bị từ chối" });
      setPendingPoints([]);
      setTotal(0);
    } catch (error) {
      console.error("Error rejecting all points:", error);
    }
  };

  const handlePageChange = (newPage: number, newPageSize: number) => {
    setPage(newPage);
    setLimit(newPageSize);
    loadPendingPoints(newPage, newPageSize);
  };

  useEffect(() => {
    const currentUser = getCurrentUser();
    setUser(currentUser);
    if (currentUser) {
      loadUnreadCount();
    }
  }, []);

  const handleLogout = async () => {
    try {
      await authProvider.logout({});
      removeAuthenToken();
      localStorage.removeItem("user");
      setUser(null);
      navigate("/login");
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  const handlePointClick = (p: {
    id: string;
    name: string;
    lat: number;
    lng: number;
  }) => {
    const full = pendingPoints.find((pt) => pt.id.toString() === p.id);
    if (full) {
      openDetailPopup({
        point: full,
        onClose: () => {},
      });
    }
  };

  const menuItems = {
    items: [
      ...(user?.role === "admin"
        ? [
            {
              key: "admin-notification",
              label: (
                <div onClick={handleOpenNotification}>
                  Điểm chờ duyệt <NotificationIcon count={total} />
                </div>
              ),
            },
          ]
        : []),
      ...(user?.role !== "admin"
        ? [
            {
              key: "user-notification",
              label: (
                <div onClick={handleOpenUserNotification}>
                  Thông báo của tôi <NotificationIcon count={unreadCount} />
                </div>
              ),
            },
          ]
        : []),
      {
        key: "logout",
        label: (
          <div onClick={handleLogout}>
            Đăng xuất <LogoutOutlined />
          </div>
        ),
      },
    ],
  };

  return (
    <>
      <nav className="navbar">
        <div className="navbar-left">
          <div className="project-name">{PROJECT_NAME}</div>
        </div>
        <div className="navbar-right">
          {user ? (
            <Dropdown menu={menuItems} trigger={["click"]}>
              <Button type="text" className="auth-button">
                {user.username || "Người dùng"}
              </Button>
            </Dropdown>
          ) : (
            <>
              <Button
                type="text"
                className="auth-button"
                onClick={() =>
                  navigate(`/login?to=${encodeURIComponent("/ban-do")}`)
                }
              >
                Đăng Nhập
              </Button>
              <Button
                type="text"
                className="auth-button"
                onClick={() => navigate("/register")}
              >
                Đăng Ký
              </Button>
            </>
          )}
        </div>
      </nav>

      <PopupNotification
        visible={showAdminModal}
        onClose={() => setShowAdminModal(false)}
        points={pendingPoints
          .filter((p) => p.toadox !== undefined && p.toadoy !== undefined)
          .map((point) => ({
            id: point.id.toString(),
            name: point.name,
            lat: point.toadox as number,
            lng: point.toadoy as number,
            createdBy: point.createdBy,
          }))}
        onAccept={handleAccept}
        onReject={handleReject}
        onAcceptAll={handleAcceptAll}
        onRejectAll={handleRejectAll}
        onPointHover={handlePointHover}
        onPointClick={handlePointClick}
        page={page}
        limit={limit}
        total={total}
        onPageChange={handlePageChange}
      />

      <UserNotificationsPopup
        visible={showUserModal}
        onClose={() => setShowUserModal(false)}
        onUpdateUnreadCount={loadUnreadCount}
      />
    </>
  );
};

export default Navbar;
