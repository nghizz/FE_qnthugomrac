import React from "react";
import { Card, List, Button, Space, Tag, Badge } from "antd";
import { CheckOutlined, CloseOutlined, EnvironmentOutlined } from "@ant-design/icons";
import "./popup.css";

interface PopupNotificationProps {
  visible: boolean;
  onClose: () => void;
  points: { 
    id: string; 
    name: string; 
    lat: number; 
    lng: number;
    createdBy?: {
      id: number;
      username: string;
    };
  }[];
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
  onAcceptAll: () => void;
  onRejectAll: () => void;
  onPointHover: (lat: number, lng: number) => void;
  onPointClick?: (point: { id: string; name: string; lat: number; lng: number }) => void;
  // Phân trang
  page: number;
  limit: number;
  total: number;
  onPageChange: (newPage: number, newPageSize: number) => void;
}

const PopupNotification: React.FC<PopupNotificationProps> = ({
  visible,
  onClose,
  points,
  onAccept,
  onReject,
  onAcceptAll,
  onRejectAll,
  onPointHover,
  onPointClick,
  page,
  limit,
  total,
  onPageChange,
}) => {
  if (!visible) return null;

  return (
    <div className="popup-container">
      <Card
        title={
          <Space>
            Điểm chờ duyệt
            <Badge count={total} style={{ backgroundColor: '#52c41a' }} />
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
          dataSource={points}
          renderItem={(point) => (
            <List.Item
              key={point.id}
              className="list-item"
              onMouseEnter={() => onPointHover(point.lat, point.lng)}
              actions={[
                <Button
                  type="text"
                  icon={<CheckOutlined />}
                  onClick={() => onAccept(point.id)}
                  className="approve-button"
                >
                  Duyệt
                </Button>,
                <Button
                  type="text"
                  danger
                  icon={<CloseOutlined />}
                  onClick={() => onReject(point.id)}
                  className="reject-button"
                >
                  Từ chối
                </Button>,
              ]}
            >
              <List.Item.Meta
                avatar={
                  <EnvironmentOutlined 
                    style={{ fontSize: '20px', color: '#595959' }} 
                  />
                }
                title={
                  <a 
                    onClick={() => onPointClick?.(point)} 
                    className="point-name"
                  >
                    {point.name}
                  </a>
                }
                description={
                  <Space direction="vertical" size={4}>
                    <Tag color="orange">Đang chờ duyệt</Tag>
                    <div className="coordinates">
                      Tọa độ: ({point.lng.toFixed(6)}, {point.lat.toFixed(6)})
                    </div>
                    {point.createdBy && (
                      <div className="creator-info">
                        Do người dùng có tên: <b>"{point.createdBy.username}"</b> thêm vào Map !
                      </div>
                    )}
                  </Space>
                }
              />
            </List.Item>
          )}
          pagination={{
            current: page,
            pageSize: limit,
            total: total,
            onChange: (newPage, newSize) => onPageChange(newPage, newSize || limit),
            showSizeChanger: true,
            pageSizeOptions: ["5", "10", "20"],
            className: "pagination"
          }}
        />
        <div className="footer-actions">
          <Button onClick={onRejectAll} className="reject-all-button">
            Từ chối tất cả
          </Button>
          <Button type="primary" onClick={onAcceptAll} className="approve-all-button">
            Duyệt tất cả
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default PopupNotification;
