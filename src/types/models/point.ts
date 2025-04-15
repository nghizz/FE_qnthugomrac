// src/types/models/point.ts

export type PointStatus = 'pending' | 'approved' | 'rejected';
export interface Point {
  id: number;
  name: string;
  type: string;
  status: PointStatus;
  toadox?: number;
  toadoy?: number;
  srid: number;
  frequency?: number;
  geom?: string;
  created_by: number;
  // only present in paginated “find”:
  createdBy?: {
    id: number;
    username: string;
  };
  created_at: string;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface PointResponse extends Point {}

// what you send when creating:
export interface PointCreate {
  name: string;
  type: string;
  toadox?: number;
  toadoy?: number;
  frequency?: number;
  // srid optional; we default to 4326
  srid?: number;
  created_by: number;
  created_at: string;
}

// what you send when updating:
export interface PointUpdate {
  name?: string;
  type?: string;
  toadox?: number;
  toadoy?: number;
  frequency?: number;
  srid?: number;
  status?: 'pending' | 'approved' | 'rejected';
}

// paginated response wrapper:
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
