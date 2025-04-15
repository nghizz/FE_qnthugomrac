import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import {
  getCollectionPoints,
  getCollectionPoint,
  createCollectionPoint,
  updateCollectionPoint,
  deleteCollectionPoint,
  reviewCollectionPoint,
} from '../api/endpoints/points';
import {
  Point,
  PointCreate,
  PointUpdate,
} from '../types/models/point';

export interface CollectionPointsContextProps {
  points: Point[];
  totalPoints: number;
  currentPage: number;
  pageSize: number;
  loading: boolean;
  reloadPoints: (page?: number, limit?: number, status?: string) => Promise<void>;
  getPointById: (id: number) => Promise<Point>;
  createPoint: (payload: PointCreate) => Promise<void>;
  updatePoint: (id: number, payload: PointUpdate) => Promise<void>;
  deletePoint: (id: number) => Promise<void>;
  approvePoint: (id: number) => Promise<void>;
  rejectPoint: (id: number) => Promise<void>;
}

const CollectionPointsContext = createContext<
  CollectionPointsContextProps | undefined
>(undefined);

export const CollectionPointsProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [points, setPoints] = useState<Point[]>([]);
  const [totalPoints, setTotalPoints] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(false);

  const reloadPoints = async (
    page = currentPage,
    limit = pageSize,
    status?: string
  ) => {
    setLoading(true);
    try {
      const resp = await getCollectionPoints(page, limit, status);
      setPoints(resp.data);
      setTotalPoints(resp.total);
      setCurrentPage(resp.page);
      setPageSize(resp.limit);
    } finally {
      setLoading(false);
    }
  };

  const getPointById = async (id: number) => {
    setLoading(true);
    try {
      return await getCollectionPoint(id);
    } finally {
      setLoading(false);
    }
  };

  const createPoint = async (payload: PointCreate) => {
    setLoading(true);
    try {
      await createCollectionPoint(payload);
      await reloadPoints();
    } finally {
      setLoading(false);
    }
  };

  const updatePoint = async (id: number, payload: PointUpdate) => {
    setLoading(true);
    try {
      await updateCollectionPoint(id, payload);
      await reloadPoints();
    } finally {
      setLoading(false);
    }
  };

  const deletePoint = async (id: number) => {
    setLoading(true);
    try {
      await deleteCollectionPoint(id);
      await reloadPoints();
    } finally {
      setLoading(false);
    }
  };

  const approvePoint = async (id: number) => {
    setLoading(true);
    try {
      await reviewCollectionPoint(id, 'approved');
      await reloadPoints();
    } finally {
      setLoading(false);
    }
  };

  const rejectPoint = async (id: number) => {
    setLoading(true);
    try {
      await reviewCollectionPoint(id, 'rejected');
      await reloadPoints();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reloadPoints();
  }, []);

  return (
    <CollectionPointsContext.Provider
      value={{
        points,
        totalPoints,
        currentPage,
        pageSize,
        loading,
        reloadPoints,
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
    throw new Error(
      'useCollectionPointsContext must be used within CollectionPointsProvider'
    );
  return ctx;
};
