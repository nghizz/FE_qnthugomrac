import React, { useEffect, useState } from "react";
import { Card, List, Button, Space, Tag, Badge, message } from "antd";
import {
  EnvironmentOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import "./popup.css";
import {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
} from "../../../../api/endpoints/notifications/index";
import { Notification } from "../../../../types/models/notification";
import { getCurrentUser } from "../../../../utils/user";

interface UserNotificationsPopupProps {
  visible: boolean;
  onClose: () => void;
  onUpdateUnreadCount?: () => Promise<void>; // Added the missing prop
}

const UserNotificationsPopup: React.FC<UserNotificationsPopupProps> = ({
  visible,
  onClose,
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const userId = getCurrentUser()?.id; // Lấy userId từ hàm getCurrentUser
  const loadNotifs = async (p: number, l: number) => {
    setLoading(true);
    try {
      if (!userId) {
        throw new Error("User ID is undefined");
      }
      const resp = await getMyNotifications(userId, p, l);
      setNotifications(resp.data);
      setTotal(resp.total);
      setPage(resp.page);
      setLimit(resp.limit);
    } catch (error) {
      console.error("Error loading notifications:", error); // Log lỗi nếu có
      message.error("Không thể tải thông báo");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible) {
      loadNotifs(page, limit);
    }
  }, [visible, page, limit]);

  const handleMarkAsRead = async (id: number) => {
    try {
      await markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, status: true } : n))
      );
      message.success("Đã đánh dấu là đã đọc");
    } catch {
      message.error("Đánh dấu thất bại");
    }
  };

  const handleMarkAll = async () => {
    try {
      await markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, status: true })));
      message.success("Đã đánh dấu tất cả là đã đọc");
    } catch {
      message.error("Đánh dấu tất cả thất bại");
    }
  };

  const renderStatusTag = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Tag icon={<ClockCircleOutlined />} color="orange">
            Đang chờ duyệt
          </Tag>
        );
      case "approved":
        return (
          <Tag icon={<CheckCircleOutlined />} color="green">
            Đã được duyệt
          </Tag>
        );
      case "rejected":
        return (
          <Tag icon={<ClockCircleOutlined />} color="red">
            Đã bị từ chối
          </Tag>
        );
      default:
        return <Tag>{status}</Tag>;
    }
  };

  if (!visible) return null;

  return (
    <div className="popup-container">
      <Card
        title={
          <Space>
            Thông báo của bạn
            <Badge count={total} />
          </Space>
        }
        extra={
          <Button type="text" onClick={onClose}>
            ✕
          </Button>
        }
        className="popup-card"
      >
        <List
          loading={loading}
          dataSource={notifications}
          renderItem={(notif) => {
            return (
              <List.Item
                key={notif.id}
                actions={[
                  !notif.status && (
                    <Button
                      type="text"
                      onClick={() => handleMarkAsRead(notif.id)}
                    >
                      Đánh dấu đã đọc
                    </Button>
                  ),
                ]}
              >
                <List.Item.Meta
                  avatar={<EnvironmentOutlined />}
                  title={notif.message}
                  description={
                    <Space direction="vertical">
                      {notif.collectionPoint &&
                        renderStatusTag(notif.collectionPoint.status)}
                      {notif.collectionPoint && (
                        <div className="coordinates">
                          ({notif.collectionPoint.toadoy?.toFixed(6)},{" "}
                          {notif.collectionPoint.toadox?.toFixed(6)})
                        </div>
                      )}
                      <div>{new Date(notif.created_at).toLocaleString()}</div>
                    </Space>
                  }
                />
              </List.Item>
            );
          }}
          pagination={{
            current: page,
            pageSize: limit,
            total,
            onChange: (p, l) => {
              setPage(p);
              setLimit(l || limit);
            },
            showSizeChanger: true,
            pageSizeOptions: ["5", "10", "20"],
          }}
        />

        <div className="footer-actions">
          <Button onClick={handleMarkAll}>Đánh dấu tất cả đã đọc</Button>
        </div>
      </Card>
    </div>
  );
};

export default UserNotificationsPopup;
