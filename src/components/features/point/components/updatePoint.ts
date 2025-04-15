import { notification } from "antd";
import { Map as MapOl } from "ol";
import { Select, Modify } from "ol/interaction";
import { Feature } from "ol";
import { Point } from "ol/geom";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";

/**
 * Handles the point update process on the map
 * @param map - OpenLayers Map instance
 * @param onFeatureUpdate - Callback function to handle feature updates
 */
export function handleUpdatePoint(
  map: MapOl | null,
  onFeatureUpdate: (feature: Feature<Point>) => void
) {
  if (!map) return;

  // Find the Vector layer containing collection points
  const vectorLayer = map
    .getLayers()
    .getArray()
    .find(
      (layer) =>
        layer instanceof VectorLayer && layer.get("name") === "collectionPoints"
    ) as VectorLayer<VectorSource<Feature<Point>>>;

  if (!vectorLayer) {
    notification.warning({
      message: "Không tìm thấy Vector layer",
      description:
        "Bạn cần Vector layer chứa các điểm thu gom để thực hiện thao tác sửa.",
    });
    return;
  }

  // Add select interaction for feature selection
  const selectInteraction = new Select({
    layers: [vectorLayer],
  });

  // Handle feature selection
  selectInteraction.on("select", (evt) => {
    if (evt.selected.length > 0) {
      // Call callback when a feature is selected
      onFeatureUpdate(evt.selected[0] as Feature<Point>);
      // Remove interactions to prevent duplicates
      map.removeInteraction(selectInteraction);
      map.removeInteraction(modifyInteraction);
    }
  });
  map.addInteraction(selectInteraction);

  // Add modify interaction for feature dragging
  const modifyInteraction = new Modify({
    features: selectInteraction.getFeatures(),
  });
  map.addInteraction(modifyInteraction);

  // Notify user about update mode
  notification.info({
    message: "Chế độ sửa điểm",
    description: "Nhập thông tin cập nhật điểm !",
  });

  // Handle feature modification (dragging)
  modifyInteraction.on("modifyend", (evt) => {
    evt.features.forEach((feature) => {
      const pointFeature = feature as Feature<Point>;
      onFeatureUpdate(pointFeature);
      map.removeInteraction(selectInteraction);
      map.removeInteraction(modifyInteraction);
    });
  });
}