/* eslint-disable @typescript-eslint/no-explicit-any */
/* src/hooks/useChatSocket.ts */
import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { io, Socket, ManagerOptions, SocketOptions } from 'socket.io-client';
import { SOCKET_URL } from '../constants';
import { getAuthenToken, refreshToken } from '../authProvider';

// Import the ConversationUser interface from AdminMessageBox
import { ConversationUser } from '../components/features/message/AdminMessageBox';

export interface Message {
  id: number;
  content: string;
  senderId: number;
  receiverId: number;
  isRead: boolean;
  createdAt: string;
  isMine?: boolean;
}

interface UseChatSocketProps {
  onMessage: (msg: Message) => void;
  onConversations?: (users: ConversationUser[]) => void;
  onConversationHistory?: (msgs: Message[]) => void;
  onUserConversationHistory?: (msgs: Message[]) => void;
}

export function useChatSocket({ onMessage, onConversations, onConversationHistory, onUserConversationHistory }: UseChatSocketProps) {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Stable refs for callbacks
  const msgHandlerRef = useRef(onMessage);
  const convHandlerRef = useRef(onConversations);
  const histHandlerRef = useRef(onConversationHistory);
  const userHistHandlerRef = useRef(onUserConversationHistory);

  useEffect(() => { msgHandlerRef.current = onMessage; }, [onMessage]);
  useEffect(() => { convHandlerRef.current = onConversations; }, [onConversations]);
  useEffect(() => { histHandlerRef.current = onConversationHistory; }, [onConversationHistory]);
  useEffect(() => { userHistHandlerRef.current = onUserConversationHistory; }, [onUserConversationHistory]);

  const token = getAuthenToken()?.accessToken;

  useEffect(() => {
    let refreshing = false;
    // If no token, teardown socket
    if (!token) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      setIsConnected(false);
      return;
    }
    // If same token and already connected, skip
    if (socketRef.current && socketRef.current.connected) {
      const existing = (socketRef.current.io.opts as any).auth?.token;
      if (existing === token) return;
    }
    // Cleanup previous
    socketRef.current?.off();
    socketRef.current?.disconnect();
    socketRef.current = null;
    setIsConnected(false);

    // Initialize socket
    const socket = io(`${SOCKET_URL}/chat`, {
      path: '/socket.io',
      transports: ['polling', 'websocket'],
      auth: { token },
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    } as Partial<SocketOptions & ManagerOptions>);

    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));

    socket.on('connect_error', async (err: Error & { message: string }) => {
      console.error('[WS] connect_error', err.message);
      setIsConnected(false);
      if (err.message.includes('jwt expired') && !refreshing) {
        refreshing = true;
        const data = await refreshToken();
        if (data?.accessToken) {
          socket.disconnect(); // will retrigger effect
        } else {
          window.location.href = '/login';
        }
      }
    });

    // Register handlers
    socket.on('message', (msg: Message) => msgHandlerRef.current(msg));
    socket.on('conversations', (users: ConversationUser[]) => convHandlerRef.current?.(users));
    socket.on('conversationHistory', (msgs: Message[]) => histHandlerRef.current?.(msgs));
    socket.on('userConversationHistory', (msgs: Message[]) => userHistHandlerRef.current?.(msgs));

    socketRef.current = socket;
    return () => {
      socket.off();
      socket.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    };
  }, [token]);

  // Exposed methods with stable references
  const sendMessage = useCallback((data: { receiverId: number; content: string }) => {
    if (socketRef.current?.connected) socketRef.current.emit('message', data);
  }, []);

  const getConversations = useCallback(() => {
    if (socketRef.current?.connected) socketRef.current.emit('getConversations');
  }, []);

  const loadConversation = useCallback((userId: number) => {
    if (socketRef.current?.connected) socketRef.current.emit('loadConversation', { userId });
  }, []);

  // Memoize return to prevent re-renders
  return useMemo(
    () => ({ sendMessage, getConversations, loadConversation, isConnected, socket: socketRef.current }),
    [sendMessage, getConversations, loadConversation, isConnected, socketRef.current]
  );
}