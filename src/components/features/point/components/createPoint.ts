// src/components/features/point/components/createPoint.tsx
import React from "react";
import { Feature } from "ol";
import { Point } from "ol/geom";
import VectorSource from "ol/source/Vector";
import VectorLayer from "ol/layer/Vector";
import { toLonLat } from "ol/proj";
import { notification } from "antd";
import { Map as MapOl } from "ol";
import { Draw as DrawInteraction } from "ol/interaction";
import { getIDUser } from "../../../../utils/user";
import { PointCreate } from "../../../../types/models/point";

/**
 * Options for initiating a new-point draw on the map
 */
interface CreatePointOptions {
  map: MapOl | null;
  role: string;
  setSelectedFeature: React.Dispatch<React.SetStateAction<Feature<Point> | null>>;
  setIsFormVisible: React.Dispatch<React.SetStateAction<boolean>>;
}

export function handleAddPointByMapClick({
  map,
  role,
  setSelectedFeature,
  setIsFormVisible,
}: CreatePointOptions) {
  if (!role) {
    notification.warning({ message: "Bạn cần đăng nhập để thêm điểm!" });
    return;
  }
  if (!map) return;

  const drawSource = new VectorSource();
  const drawLayer = new VectorLayer({ source: drawSource });
  map.addLayer(drawLayer);

  const drawInteraction = new DrawInteraction({
    source: drawSource,
    type: "Point",
  });
  map.addInteraction(drawInteraction);

  drawInteraction.on("drawend", (evt) => {
    const newFeature = evt.feature as Feature<Point>;
    setSelectedFeature(newFeature);
    setIsFormVisible(true);

    // Cleanup interaction and layer
    map.removeInteraction(drawInteraction);
    map.removeLayer(drawLayer);
  });
}

/**
 * Options for submitting the “add point” form
 */
interface FormSubmitOptions {
  map: MapOl | null;
  feature: Feature<Point>;
  addCollectionPoint: (payload: PointCreate) => Promise<void>;
  reloadCollectionPoints: () => Promise<void>;
  setIsFormVisible: React.Dispatch<React.SetStateAction<boolean>>;
  setSelectedFeature: React.Dispatch<React.SetStateAction<Feature<Point> | null>>;
}

export async function handleFormSubmit({
  map,
  feature,
  addCollectionPoint,
  reloadCollectionPoints,
  setIsFormVisible,
  setSelectedFeature,
}: FormSubmitOptions) {
  try {
    const coords = feature.getGeometry()?.getCoordinates();
    if (!coords) throw new Error("Không có tọa độ");
    const [x, y] = coords;
    const [lon, lat] = toLonLat([x, y]);

    const userId = getIDUser() || 0;
    const payload: PointCreate = {
      name: feature.get("name") as string,
      type: feature.get("type") as string,
      toadox: lat,
      toadoy: lon,
      frequency: feature.get("frequency") as number,
      srid: 4326,
      created_by: userId,
      created_at: new Date().toISOString(),
    };

    await addCollectionPoint(payload);
    await reloadCollectionPoints();
    notification.success({ message: "Thêm điểm thu gom thành công!" });
  } catch (err) {
    const description = err instanceof Error ? err.message : "Đã có lỗi xảy ra.";
    notification.error({ message: "Lỗi khi thêm điểm!", description });
    throw err;
  } finally {
    setIsFormVisible(false);
    setSelectedFeature(null);

    if (map) {
      const drawInt = map
        .getInteractions()
        .getArray()
        .find((i) => i instanceof DrawInteraction);
      const drawLayer = map
        .getLayers()
        .getArray()
        .find((l) => l instanceof VectorLayer);

      if (drawInt) map.removeInteraction(drawInt);
      if (drawLayer) map.removeLayer(drawLayer);
    }
  }
}

/**
 * Options for cancelling the form
 */
interface FormCancelOptions {
  map: MapOl | null;
  setIsFormVisible: React.Dispatch<React.SetStateAction<boolean>>;
  setSelectedFeature: React.Dispatch<React.SetStateAction<Feature<Point> | null>>;
}

export function handleFormCancel({
  map,
  setIsFormVisible,
  setSelectedFeature,
}: FormCancelOptions) {
  setIsFormVisible(false);
  setSelectedFeature(null);

  if (map) {
    const drawInt = map
      .getInteractions()
      .getArray()
      .find((i) => i instanceof DrawInteraction);
    const drawLayer = map
      .getLayers()
      .getArray()
      .find((l) => l instanceof VectorLayer);

    if (drawInt) map.removeInteraction(drawInt);
    if (drawLayer) map.removeLayer(drawLayer);
  }
}
