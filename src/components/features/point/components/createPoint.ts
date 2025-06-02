// src/components/features/point/components/createPoint.tsx
import { notification } from "antd";
import { Map as MapOl } from "ol";
import { Feature } from "ol";
import { Point } from "ol/geom";
import VectorSource from "ol/source/Vector";
import VectorLayer from "ol/layer/Vector";
import { Draw as DrawInteraction } from "ol/interaction";
import { toLonLat } from "ol/proj";
import { getIDUser } from "../../../../utils/user";
import { PointCreate } from "../../../../types/models/point";

export interface CreatePointOptions {
  map: MapOl | null;
  role: string;
  setSelectedFeature: React.Dispatch<
    React.SetStateAction<Feature<Point> | null>
  >;
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

  // Remove any existing temporary layers and interactions
  const existingInteractions = map.getInteractions().getArray();
  existingInteractions
    .filter(i => i instanceof DrawInteraction || i.get('type') === 'draw')
    .forEach(i => map.removeInteraction(i));

  const existingLayers = map.getLayers().getArray();
  existingLayers
    .filter(l => l instanceof VectorLayer && l.get('temporary') === true)
    .forEach(l => map.removeLayer(l));

  // Create new temporary layer
  const drawSource = new VectorSource();
  const drawLayer = new VectorLayer({ 
    source: drawSource,
    zIndex: 1000 // Make sure it's on top
  });
  drawLayer.set('temporary', true);
  map.addLayer(drawLayer);

  // Create draw interaction
  const drawInteraction = new DrawInteraction({
    source: drawSource,
    type: "Point",
  });
  drawInteraction.set('type', 'draw');
  map.addInteraction(drawInteraction);

  notification.info({
    message: "Chế độ thêm điểm",
    description: "Click lên bản đồ để thêm điểm thu gom mới",
  });

  drawInteraction.on("drawend", (evt) => {
    const newFeature = evt.feature as Feature<Point>;
    setSelectedFeature(newFeature);
    setIsFormVisible(true);
    
    // Cleanup
    map.removeInteraction(drawInteraction);
    map.removeLayer(drawLayer);
    
    // Force map render
    map.render();
  });

  // Handle abort/cancel
  drawInteraction.on("drawabort", () => {
    map.removeInteraction(drawInteraction);
    map.removeLayer(drawLayer);
    map.render();
  });
}

export interface FormSubmitOptions {
  map: MapOl | null;
  feature: Feature<Point>;
  values: {
    name: string;
    type: string;
    frequency: number;
  };
  addCollectionPoint: (payload: PointCreate) => Promise<void>;
  reloadCollectionPoints: () => Promise<void>;
  setIsFormVisible: React.Dispatch<React.SetStateAction<boolean>>;
  setSelectedFeature: React.Dispatch<
    React.SetStateAction<Feature<Point> | null>
  >;
}

export async function handleFormSubmit({
  map,
  feature,
  values,
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
      name: values.name,
      type: values.type,
      frequency: values.frequency,
      toadox: lat,
      toadoy: lon,
      srid: 4326,
      created_by: userId,
      created_at: new Date().toISOString(),
    };

    await addCollectionPoint(payload);
    await reloadCollectionPoints();
    notification.success({ message: "Thêm điểm thu gom thành công!" });
  } catch (err: unknown) {
    const errorMessage =
      err instanceof Error ? err.message : "Đã có lỗi xảy ra.";
    notification.error({
      message: "Lỗi khi thêm điểm!",
      description: errorMessage,
    });
    throw err;
  } finally {
    setIsFormVisible(false);
    setSelectedFeature(null);
    // Cleanup any leftover draw interactions/layers
    if (map) {
      // Remove all draw interactions
      map
        .getInteractions()
        .getArray()
        .filter((i) => i instanceof DrawInteraction)
        .forEach((i) => map.removeInteraction(i));

      // Remove all temporary layers
      map
        .getLayers()
        .getArray()
        .filter((l) => l instanceof VectorLayer && l.get('temporary') === true)
        .forEach((l) => map.removeLayer(l));

      // Force map to render and update
      map.render();
      map.updateSize();
    }
  }
}

export interface FormCancelOptions {
  map: MapOl | null;
  setIsFormVisible: React.Dispatch<React.SetStateAction<boolean>>;
  setSelectedFeature: React.Dispatch<
    React.SetStateAction<Feature<Point> | null>
  >;
}

export function handleFormCancel({
  map,
  setIsFormVisible,
  setSelectedFeature,
}: FormCancelOptions) {
  setIsFormVisible(false);
  setSelectedFeature(null);

  if (map) {
    // Remove draw interactions
    const interactions = map.getInteractions().getArray();
    interactions
      .filter(i => i instanceof DrawInteraction || i.get('type') === 'draw')
      .forEach(i => map.removeInteraction(i));

    // Remove temporary layers
    const layers = map.getLayers().getArray();
    layers
      .filter(l => l instanceof VectorLayer && l.get('temporary') === true)
      .forEach(l => map.removeLayer(l));

    // Force map render to refresh
    map.render();
  }
}
