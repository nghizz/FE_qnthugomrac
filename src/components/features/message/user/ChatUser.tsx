import React, { useState, useCallback, useMemo, useEffect } from "react";
import { Card, Button } from "antd";
import { CloseOutlined } from "@ant-design/icons";
import MessageList from "../form/messageList";
import MessageInput from "../form/messageInput";
import { useChatSocket, Message } from "../../../../hooks/useChatSocket";
import { useGetIdentity } from "@refinedev/core";
import { addIsMine } from "../../../../utils/addIsMine";

interface UserIdentity {
  id: number;
  username: string;
  role?: string;
}

interface ChatWrapperProps {
  adminId: number;
  onClose: () => void;
}

export default function ChatWrapper({ adminId, onClose }: ChatWrapperProps) {
  const { data: userIdentity, isLoading: isIdentityLoading } =
    useGetIdentity<UserIdentity>();
  const currentUserId = userIdentity?.id; // Lấy ID của người dùng hiện tại (user thường)
  const isAdmin = useMemo(() => userIdentity?.role === "admin", [userIdentity]);

  const [userMessages, setUserMessages] = useState<Message[]>([]);
  const [userNewMessageContent, setUserNewMessageContent] = useState("");

  // Handlers for socket events
  const handleNewMessage = useCallback(
    (msg: Message) => {
      // Check if the message is relevant to this user's chat with admin
      if (
        currentUserId !== undefined &&
        adminId !== undefined &&
        adminId !== null &&
        ((msg.senderId === currentUserId && msg.receiverId === adminId) ||
          (msg.senderId === adminId && msg.receiverId === currentUserId))
      ) {
        const messageWithIsMine = addIsMine(msg, currentUserId);
        setUserMessages((prev) => [...prev, messageWithIsMine]);
      }
    },
    [currentUserId, adminId]
  );

  // >>> START: Chỉnh sửa callback xử lý lịch sử chat cho user thường <<<
  const handleUserConversationHistory = useCallback(
    (history: Message[]) => {
      const historyWithIsMine = history.map((msg) => {
        const messageWithIsMine = addIsMine(msg, currentUserId);
        return messageWithIsMine;
      });
      setUserMessages(historyWithIsMine);
    },
    [currentUserId]
  );
  // >>> END: Chỉnh sửa callback xử lý lịch sử chat cho user thường <<<

  const userChatSocket = useChatSocket({
    onMessage: handleNewMessage, // Giữ nguyên handler tin nhắn mới
    onConversations: undefined, // User thường không cần list conversations
    onConversationHistory: undefined, // Bỏ lắng nghe sự kiện cũ cho lịch sử admin
    onUserConversationHistory: handleUserConversationHistory, // Lắng nghe sự kiện lịch sử user mới
  });

  useEffect(() => {
    // >>> START: Cập nhật gọi sự kiện yêu cầu lịch sử chat mới <<<
    // Load history only if not admin, connected, and both user and admin IDs are available
    if (
      !isAdmin &&
      userChatSocket.isConnected &&
      currentUserId !== undefined &&
      currentUserId !== null &&
      adminId !== undefined &&
      adminId !== null
    ) {
      console.log(
        "User socket connected, requesting history with admin:",
        adminId
      );
      // Gửi sự kiện mới mà backend lắng nghe cho user thường
      userChatSocket.socket?.emit("getUserConversationWithAdmin");
    }

    // Clear messages if user is admin or identity not available
    if (!userIdentity || isAdmin) {
      setUserMessages([]);
      setUserNewMessageContent("");
    }
  }, [
    userChatSocket.isConnected,
    userIdentity,
    adminId,
    isAdmin,
    userChatSocket.loadConversation,
    currentUserId,
  ]); // Giữ nguyên dependencies, loadConversation không còn dùng trực tiếp ở đây nhưng có thể cần trong hook

  const handleSendUserMessage = useCallback(() => {
    if (
      !userChatSocket.isConnected ||
      !userNewMessageContent.trim() ||
      currentUserId === undefined ||
      currentUserId === null ||
      adminId === undefined ||
      adminId === null
    ) {
      console.warn(
        "Cannot send message: socket not connected, message empty, or user/admin ID missing."
      );
      return;
    }

    userChatSocket.sendMessage({
      receiverId: adminId,
      content: userNewMessageContent.trim(),
    });
    setUserNewMessageContent("");
  }, [
    userChatSocket.isConnected,
    userNewMessageContent,
    currentUserId,
    adminId,
    userChatSocket.sendMessage,
  ]);

  if (isIdentityLoading || !userIdentity || isAdmin) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 32,
        right: 32,
        width: 360,
        maxHeight: 520,
        zIndex: 2000,
        boxShadow: "0 4px 24px rgba(0,0,0,0.18)",
      }}
    >
      <Card
        title="Chat với Admin"
        extra={
          <Button
            type="text"
            icon={<CloseOutlined />}
            onClick={onClose}
            size="small"
          />
        }
        bodyStyle={{
          padding: 0,
          display: "flex",
          flexDirection: "column",
          height: 420,
        }}
        headStyle={{ background: "#fafafa", borderBottom: "1px solid #eee" }}
        style={{ borderRadius: 8, overflow: "hidden" }}
      >
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            height: "100%",
          }}
        >
          <MessageList otherId={adminId} messages={userMessages} />
          <MessageInput
            onSend={handleSendUserMessage}
            disabled={
              !userChatSocket.isConnected ||
              currentUserId === undefined ||
              currentUserId === null ||
              adminId === undefined ||
              adminId === null
            }
            value={userNewMessageContent}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setUserNewMessageContent(e.target.value)
            }
          />
        </div>
      </Card>
    </div>
  );
}
