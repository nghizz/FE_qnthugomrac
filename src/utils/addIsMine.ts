// utils/addIsMine.ts
import { Message } from '../hooks/useChatSocket';

export function addIsMine(msg: Message, userId?: number): Message {
  return {
    ...msg,
    isMine: userId !== undefined ? msg.senderId === userId : undefined,
  };
}
