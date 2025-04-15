import { useState, useEffect } from "react";
import { FeatureCollection } from "geojson";
import { notification } from "antd";
import {
  fetchCollectionPoints,
  addCollectionPoint,
  updateCollectionPoint,
  deleteCollectionPoint,
} from "../api/collectionPoints";

function useCollectionPoints() {
  const [collectionPoints, setCollectionPoints] = useState<FeatureCollection>({
    type: "FeatureCollection",
    features: [],
  });
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [version, setVersion] = useState(0);

  // Gọi API để lấy danh sách điểm và cập nhật state
  const getCollectionPoints = async () => {
    try {
      const data = await fetchCollectionPoints();
      setCollectionPoints({ ...data });
      setVersion((prev) => prev + 1); // update version để ép re-render
    } catch (error) {
      console.error("[DEBUG] Lỗi khi fetch collectionPoints:", error);
      notification.error({ message: "Lỗi khi tải điểm từ BE" });
    }
  };

  useEffect(() => {
    getCollectionPoints();
  }, []);

  return {
    collectionPoints,
    fetchCollectionPoints: getCollectionPoints,
    addCollectionPoint, // Sử dụng luôn hàm từ API
    updateCollectionPoint, // Sử dụng luôn hàm từ API
    deleteCollectionPoint, // Sử dụng luôn hàm từ API
  };
}

export default useCollectionPoints;