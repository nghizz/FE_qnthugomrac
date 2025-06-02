import React, { useEffect, useRef, useMemo } from 'react';
import { patchMessageRead } from '../../../../api/endpoints/message';
import { getConversation } from '../../../../api/endpoints/message';

interface Message {
  id: number;
  content: string;
  senderId: number;
  receiverId: number;
  isRead: boolean;
  createdAt: string;
  isMine?: boolean;
}

interface MessageListProps {
  otherId: number;
  messages: Message[];
}

interface ConversationResponse {
  data?: Message[];
}

export function useMessageList(otherId: number) {
  const [initialMessages, setInitialMessages] = React.useState<Message[]>([]);

  useEffect(() => {
    getConversation(otherId)
      .then((res: unknown) => {
        const msgs = Array.isArray(res) ? res : (res as ConversationResponse)?.data;
        if (!Array.isArray(msgs)) {
          console.error('❌ getConversation() trả về không phải mảng:', res);
          return;
        }
        setInitialMessages(msgs);
        const unread = msgs.filter(m => !m.isRead && !m.isMine);
        unread.forEach(msg => patchMessageRead(msg.id));
      })
      .catch(err => {
        console.error('❌ Lỗi khi load messages:', err);
      });
  }, [otherId]);

  return initialMessages;
}

export default function MessageList({ otherId, messages }: MessageListProps) {
  const initialMessages = useMessageList(otherId);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [initialMessages, messages]);

  const allMessages = useMemo(() => {
    const messageMap = new Map<number, Message>();
    initialMessages.forEach(msg => messageMap.set(msg.id, msg));
    messages.forEach(msg => messageMap.set(msg.id, msg));
    return Array.from(messageMap.values()).sort((a, b) => {
      if (a.createdAt < b.createdAt) return -1;
      if (a.createdAt > b.createdAt) return 1;
      return 0;
    });
  }, [initialMessages, messages]);

  return (
    <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column' }}>
      {allMessages.map(msg => (
        <div
          key={msg.id}
          style={{
            marginBottom: 8,
            display: 'flex',
            justifyContent: msg.isMine ? 'flex-end' : 'flex-start',
          }}
        >
          <div
            style={{
              background: msg.isMine ? '#e6f7ff' : '#f5f5f5',
              borderRadius: 8,
              padding: '8px 12px',
              maxWidth: '70%',
              wordBreak: 'break-word',
              position: 'relative',
            }}
          >
            <div>{msg.content}</div>
            <div
              style={{
                fontSize: 10,
                color: '#999',
                marginTop: 4,
                textAlign: msg.isMine ? 'right' : 'left',
              }}
            >
              {msg.isMine && msg.isRead && (
                <span style={{ marginRight: 8 }}>✓✓</span>
              )}
              {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}