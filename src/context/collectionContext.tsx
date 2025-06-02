import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import {
  getCollectionPoints,
  getCollectionPoint,
  createCollectionPoint,
  updateCollectionPoint,
  deleteCollectionPoint,
  reviewCollectionPoint,
  getAllCollectionPoints,
} from '../api/endpoints/points';
import { Point, PointCreate, PointUpdate } from '../types/models/point';

export interface CollectionPointsContextProps {
  points: Point[];
  totalPoints: number;
  currentPage: number;
  pageSize: number;
  loading: boolean;
  reloadPoints: () => Promise<void>;
  reloadPointsPeding: (page?: number, limit?: number, status?: string) => Promise<void>;
  getPointById: (id: number) => Promise<Point>;
  createPoint: (payload: PointCreate) => Promise<void>;
  updatePoint: (id: number, payload: PointUpdate) => Promise<void>;
  deletePoint: (id: number) => Promise<void>;
  approvePoint: (id: number) => Promise<void>;
  rejectPoint: (id: number) => Promise<void>;
}

const CollectionPointsContext = createContext<CollectionPointsContextProps | undefined>(undefined);

export const CollectionPointsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [points, setPoints] = useState<Point[]>([]);
  const [totalPoints, setTotalPoints] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(false);

  // Reload points based on status, page and limit
  const reloadPointsPeding = useCallback(async (page = currentPage, limit = pageSize, status?: string) => {
    setLoading(true);
    try {
      const resp = await getCollectionPoints(page, limit, status);
      setPoints(resp.data);
      setTotalPoints(resp.total);
      setCurrentPage(resp.page);
      setPageSize(resp.limit);
    } catch (error) {
      console.error("Error fetching pending points:", error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize]);

  // Reload all points
  const reloadPoints = useCallback(async () => {
    setLoading(true);
    try {
      const points = await getAllCollectionPoints();
      setPoints(points);
      console.log("Dữ liệu points từ API:", points);
    } catch (error) {
      console.error("Error fetching all points:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Get point by ID
  const getPointById = useCallback(async (id: number) => {
    setLoading(true);
    try {
      return await getCollectionPoint(id);
    } catch (error) {
      console.error(`Error fetching point with ID ${id}:`, error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Create new point
  const createPoint = useCallback(async (payload: PointCreate) => {
    setLoading(true);
    try {
      await createCollectionPoint(payload);
      await reloadPoints();
    } catch (error) {
      console.error("Error creating point:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [reloadPoints]);

  // Update existing point
  const updatePoint = useCallback(async (id: number, payload: PointUpdate) => {
    setLoading(true);
    try {
      await updateCollectionPoint(id, payload);
      await reloadPoints();
    } catch (error) {
      console.error(`Error updating point with ID ${id}:`, error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [reloadPoints]);

  // Delete point
  const deletePoint = useCallback(async (id: number) => {
    setLoading(true);
    try {
      await deleteCollectionPoint(id);
      await reloadPoints();
    } catch (error) {
      console.error(`Error deleting point with ID ${id}:`, error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [reloadPoints]);

  // Approve point
  const approvePoint = useCallback(async (id: number) => {
    setLoading(true);
    try {
      await reviewCollectionPoint(id, 'approved');
      await reloadPoints();
    } catch (error) {
      console.error(`Error approving point with ID ${id}:`, error);
    } finally {
      setLoading(false);
    }
  }, [reloadPoints]);

  // Reject point
  const rejectPoint = useCallback(async (id: number) => {
    setLoading(true);
    try {
      await reviewCollectionPoint(id, 'rejected');
      await reloadPoints();
    } catch (error) {
      console.error(`Error rejecting point with ID ${id}:`, error);
    } finally {
      setLoading(false);
    }
  }, [reloadPoints]);

  useEffect(() => {
    reloadPoints();
  }, [reloadPoints]);

  return (
    <CollectionPointsContext.Provider
      value={{
        points,
        totalPoints,
        currentPage,
        pageSize,
        loading,
        reloadPoints,
        reloadPointsPeding,
        getPointById,
        createPoint,
        updatePoint,
        deletePoint,
        approvePoint,
        rejectPoint,
      }}
    >
      {children}
    </CollectionPointsContext.Provider>
  );
};

export const useCollectionPointsContext = () => {
  const ctx = useContext(CollectionPointsContext);
  if (!ctx)
    throw new Error('useCollectionPointsContext must be used within CollectionPointsProvider');
  return ctx;
};
