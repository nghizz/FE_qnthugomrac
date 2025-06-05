// src/api/endpoints/message.ts
import { apiRequest } from "../../apiService";

export const getConversation = (otherId: number) =>
  apiRequest(`/message/conversation/${otherId}`, {
    auth: true,
    method: "GET",
  });

export const sendMessage = (data: { receiverId: number; content: string }) =>
  apiRequest(`/message`, {
    auth: true,
    method: "POST",
    body: JSON.stringify(data),
  });

export const getConversationsList = () =>
  apiRequest(`/message/conversations`, {
    auth: true,
    method: "GET",
  });

export const patchMessageRead = (messageId: number) =>
  apiRequest(`/message/${messageId}`, {
    auth: true,
    method: "PATCH",
    body: JSON.stringify({ isRead: true }),
  });
