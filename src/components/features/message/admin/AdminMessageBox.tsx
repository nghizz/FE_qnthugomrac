/* src/components/features/message/AdminMessageBox.tsx */
import { useState, useCallback, useEffect, useMemo } from 'react';
import { Button, List, Input, Card, Layout, Typography } from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import MessageList from '../form/messageList';
import MessageInput from '../form/messageInput';
import { useChatSocket, Message } from '../../../../hooks/useChatSocket';
import { useGetIdentity } from '@refinedev/core';
import { addIsMine } from '../../../../utils/addIsMine';

interface UserIdentity { id: number; username: string; role?: string }
export interface ConversationUser { id: number; username: string; }

export default function AdminMessageBox({ onClose }: { onClose: () => void }) {
  const { data: userIdentity, isLoading: isIdentityLoading } = useGetIdentity<UserIdentity>();
  const currentUserId = userIdentity?.id;

  const [conversations, setConversations] = useState<ConversationUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [search, setSearch] = useState('');
  const [newMsg, setNewMsg] = useState('');

  // Handlers
  const handleNew = useCallback((msg: Message) => {
    const messageWithIsMine = addIsMine(msg, currentUserId);

    setMessages(prev => prev.some(m => m.id === msg.id) ? prev : [...prev, messageWithIsMine]);
  }, [currentUserId]);

  // Update handler to process array of user objects
  const handleConvos = useCallback((users: ConversationUser[]) => {
    setConversations(users);
  }, []);

  const handleHistory = useCallback((hist: Message[]) => {
    const historyWithIsMine = hist.map(msg => addIsMine(msg, currentUserId));
    setMessages(historyWithIsMine);
  }, [currentUserId]);

  const { sendMessage, getConversations, loadConversation, isConnected } = useChatSocket({
    onMessage: handleNew,
    onConversations: handleConvos,
    onConversationHistory: handleHistory,
  });

  // Initial load
  useEffect(() => {
    if (isConnected && currentUserId) getConversations();
    if (!isConnected) {
      setConversations([]);
      setMessages([]);
      setSelectedUser(null);
    }
  }, [isConnected, currentUserId, getConversations]);

  // Load history when selecting
  useEffect(() => {
    if (isConnected && currentUserId != null && selectedUser != null) {
      loadConversation(selectedUser);
    }
    if (selectedUser == null) {
      setMessages([]);
    }
  }, [selectedUser, isConnected, currentUserId, loadConversation]);

  const filtered = useMemo(
    // Update filtering logic to search username or id
    () => conversations.filter(user => 
      // Add checks to ensure user and user.username are defined
      user && user.username && user.username.toLowerCase().includes(search.toLowerCase()) || 
      user && user.id && user.id.toString().includes(search)
    ),
    [conversations, search]
  );

  const handleSend = useCallback(() => {

    if (selectedUser != null && newMsg.trim()) {
      sendMessage({ receiverId: selectedUser, content: newMsg.trim() });
      setNewMsg('');
    }
  }, [selectedUser, newMsg, sendMessage]);

  if (isIdentityLoading) return <div>Loading...</div>;
  if (!currentUserId) return null;

  return (
    <Card
      title="Admin Chat"
      extra={<Button type="text" icon={<CloseOutlined />} onClick={onClose} />}
      style={{
        position: 'fixed',
        bottom: 32,
        right: 32,
        width: 800,
        height: 600,
        zIndex: 10000,
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        borderRadius: 8,
        overflow: 'hidden',
      }}
      bodyStyle={{ padding: 0, height: 'calc(100% - 56px)', display: 'flex' }}
    >
      <Layout style={{ flexDirection: 'row', height: '100%' }}>
        {/* Sidebar */}
        <Layout.Sider width={300} style={{ background: '#fff', borderRight: '1px solid #f0f0f0' }}>
          <Input
            placeholder="Tìm kiếm ID user..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ margin: 16, width: 'auto' }}
          />
          <List
            dataSource={filtered}
            renderItem={user => (
              <List.Item
                // Pass user.id to setSelectedUser
                onClick={() => setSelectedUser(user.id)}
                style={{
                  cursor: 'pointer',
                  // Highlight selected user by ID
                  background: selectedUser === user.id ? '#e6f7ff' : '',
                  padding: '12px 16px'
                }}
              >
                {/* Display username */}
                <Typography.Text>{user.username}</Typography.Text>
              </List.Item>
            )}
            style={{ flex: 1, overflowY: 'auto' }}
          />
        </Layout.Sider>

        {/* Chat */}
        <Layout.Content style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          {selectedUser != null ? (
            <>
              <div style={{ padding: 16, borderBottom: '1px solid #f0f0f0', background: '#fafafa' }}>
                {/* Display selected user's username */}
                <Typography.Text strong>{`Chat với ${conversations.find(u => u.id === selectedUser)?.username || selectedUser}`}</Typography.Text>
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
                <MessageList otherId={selectedUser} messages={messages} />
              </div>
              <MessageInput
                value={newMsg}
                onChange={e => setNewMsg(e.target.value)}
                onSend={handleSend}
                disabled={!isConnected || selectedUser === null}
              />
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888' }}>
              Chọn một user để chat
            </div>
          )}
        </Layout.Content>
      </Layout>
    </Card>
  );
}