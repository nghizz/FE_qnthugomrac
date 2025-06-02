// src/api/endpoints/message.ts
import { MESSAGE_ENDPOINT } from "../../../constants";
import { apiRequest } from "../../apiService";

export const getConversation = (otherId: number) =>
  apiRequest(`${MESSAGE_ENDPOINT}/conversation/${otherId}`, {
    auth: true,
    method: "GET",
  });

export const sendMessage = (data: { receiverId: number; content: string }) =>
  apiRequest(`${MESSAGE_ENDPOINT}`, {
    auth: true,
    method: "POST",
    body: JSON.stringify(data),
  });

export const getConversationsList = () =>
  apiRequest(`${MESSAGE_ENDPOINT}/conversations`, {
    auth: true,
    method: "GET",
  });

export const patchMessageRead = (messageId: number) =>
  apiRequest(`${MESSAGE_ENDPOINT}/${messageId}`, {
    auth: true,
    method: "PATCH",
    body: JSON.stringify({ isRead: true }),
  });
