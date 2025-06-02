// src/components/features/message/messageInput.tsx
import React from 'react';
import { Input, Button } from 'antd';
import { SendOutlined } from '@ant-design/icons';

export interface MessageInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSend: () => void;
  disabled?: boolean;
}

export default function MessageInput({
  value,
  onChange,
  onSend,
  disabled = false,
}: MessageInputProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !disabled && value.trim()) {
      onSend();
    }
  };

  return (
    <div style={{
      padding: 12,
      borderTop: '1px solid #eee',
      display: 'flex',
      alignItems: 'center',
    }}>
      <Input
        disabled={disabled}
        value={value}
        onChange={onChange}
        onPressEnter={handleKeyDown}
        style={{ flex: 1, marginRight: 8 }}
        placeholder={disabled ? 'Đang kết nối...' : 'Nhập tin nhắn...'}
      />
      <Button
        type="primary"
        icon={<SendOutlined />}
        disabled={disabled || !value.trim()}
        onClick={onSend}
      >
        Gửi
      </Button>
    </div>
  );
}
