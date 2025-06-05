/* eslint-disable @typescript-eslint/no-explicit-any */
/* src/hooks/useChatSocket.ts */
import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { io, Socket, ManagerOptions, SocketOptions } from 'socket.io-client';
import { SOCKET_URL } from '../constants';
import { getAuthenToken, refreshToken } from '../authProvider';

export interface ConversationUser {
  id: number;
  username: string;
  avatar?: string;
}

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
      console.warn('[WS] No token found, disconnecting socket');
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
    console.log('[WS] Cleaning up previous socket connection');
    socketRef.current?.off();
    socketRef.current?.disconnect();
    socketRef.current = null;
    setIsConnected(false);

    // Initialize socket
    console.log(`[WS] Attempting to connect to ${SOCKET_URL}/chat`);
    const socket = io(`${SOCKET_URL}/chat`, {
      path: '/socket.io',
      transports: ['polling', 'websocket'],
      auth: { token },
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    } as Partial<SocketOptions & ManagerOptions>);

    socket.on('connect', () => {
      setIsConnected(true);
      console.log('[WS] Connected');
    });
    socket.on('disconnect', (reason) => {
      setIsConnected(false);
      console.log(`[WS] Disconnected: ${reason}`);
    });

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
    socket.on('message', (msg: Message) => {
      console.log('[WS] Received message:', msg);
      msgHandlerRef.current(msg);
    });
    socket.on('conversations', (users: ConversationUser[]) => {
      console.log('[WS] Received conversations:', users);
      convHandlerRef.current?.(users);
    });
    socket.on('conversationHistory', (msgs: Message[]) => {
      console.log('[WS] Received conversationHistory:', msgs.length, 'messages');
      histHandlerRef.current?.(msgs);
    });
    socket.on('userConversationHistory', (msgs: Message[]) => {
      console.log('[WS] Received userConversationHistory:', msgs.length, 'messages');
      userHistHandlerRef.current?.(msgs);
    });

    socketRef.current = socket;
    return () => {
      console.log('[WS] Cleaning up socket on effect cleanup');
      socket.off();
      socket.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    };
  }, [token]);

  // Exposed methods with stable references
  const sendMessage = useCallback((data: { receiverId: number; content: string }) => {
    console.log('[WS] Attempting to send message:', data);
    if (socketRef.current?.connected) {
      console.log('[WS] Socket connected, emitting message', data);
      socketRef.current.emit('message', data);
    } else {
      console.warn('[WS] Socket not connected, cannot send message', data);
    }
  }, []);

  const getConversations = useCallback(() => {
    console.log('[WS] Attempting to get conversations');
    if (socketRef.current?.connected) {
      console.log('[WS] Socket connected, emitting getConversations');
      socketRef.current.emit('getConversations');
    } else {
      console.warn('[WS] Socket not connected, cannot get conversations');
    }
  }, []);

  const loadConversation = useCallback((userId: number) => {
    console.log(`[WS] Attempting to load conversation with user ${userId}`);
    if (socketRef.current?.connected) {
      console.log(`[WS] Socket connected, emitting loadConversation for user ${userId}`, { userId });
      socketRef.current.emit('loadConversation', { userId });
    } else {
      console.warn(`[WS] Socket not connected, cannot load conversation for user ${userId}`);
    }
  }, []);

  // Memoize return to prevent re-renders
  return useMemo(
    () => ({ sendMessage, getConversations, loadConversation, isConnected, socket: socketRef.current }),
    [sendMessage, getConversations, loadConversation, isConnected, socketRef.current]
  );
}