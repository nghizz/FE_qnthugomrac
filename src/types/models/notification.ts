import { Point } from './point';

export interface Notification {
  id: number;
  userId: number;
  collectionPointId: number;
  message: string;
  status: boolean;
  created_at: string;
  collectionPoint?: Point;
}

export interface NotificationCreate {
  userId: number;
  collectionPointId: number;
  message: string;
}

export interface NotificationUpdate {
  status?: boolean;
  message?: string;
} 