// src/components/features/point/components/updatePoint.ts
import { notification } from "antd";
import { Map as MapOl } from "ol";
import { Select } from "ol/interaction";
import { Feature } from "ol";
import { Point as OlPoint } from "ol/geom";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import { SelectEvent } from "ol/interaction/Select";
import { Style, Circle, Fill, Stroke } from 'ol/style';

// Định nghĩa kiểu cho state setters từ React component (MapCRUDControls)
type SetSelectedFeature = React.Dispatch<
  React.SetStateAction<Feature<OlPoint> | null>
>;
type SetIsFormVisible = React.Dispatch<React.SetStateAction<boolean>>;

// Style cho điểm được chọn
const selectedStyle = new Style({
  image: new Circle({
    radius: 7,
    fill: new Fill({
      color: '#ff0000',
    }),
    stroke: new Stroke({
      color: '#ffffff',
      width: 2,
    }),
  }),
});

// Style cho điểm tạm thời (khi di chuột)
const tempStyle = new Style({
  image: new Circle({
    radius: 5,
    fill: new Fill({
      color: 'rgba(15, 29, 230, 0.5)',
    }),
    stroke: new Stroke({
      color: '#ffffff',
      width: 1,
    }),
  }),
});

/**
 * Kích hoạt chế độ chọn một điểm trên bản đồ để chuẩn bị sửa thông tin.
 * Sau khi chọn, sẽ cập nhật state để hiển thị form.
 */
export function handleSelectPointForUpdate(
  map: MapOl | null,
  setSelectedFeature: SetSelectedFeature,
  setIsFormVisible: SetIsFormVisible
): void {
  if (!map) {
    console.warn("Map instance is null in handleSelectPointForUpdate");
    return;
  }

  const vectorLayer = map
    .getLayers()
    .getArray()
    .find(
      (layer) =>
        layer instanceof VectorLayer && layer.get("name") === "collectionPoints"
    ) as VectorLayer<VectorSource<Feature<OlPoint>>> | undefined;

  if (!vectorLayer) {
    notification.warning({
      message: "Không tìm thấy layer 'collectionPoints'",
      description: "Cần có layer 'collectionPoints' để có thể sửa điểm.",
    });
    return;
  }

  console.log("Initializing Select interaction for Update mode...");

  // Tạo layer tạm thời để hiển thị vị trí chuột
  const tempSource = new VectorSource();
  const tempLayer = new VectorLayer({
    source: tempSource,
    zIndex: 1000,
  });
  tempLayer.set('temporary', true);
  map.addLayer(tempLayer);

  const select = new Select({
    layers: [vectorLayer],
    hitTolerance: 10,
    style: selectedStyle,
  });

  map.addInteraction(select);

  notification.info({
    key: "select-update-mode",
    message: "Chế độ sửa điểm",
    description: "Click chọn một điểm trên bản đồ để sửa thông tin.",
    duration: 5,
  });

  // Thêm sự kiện pointermove để hiển thị vị trí chuột
  map.on('pointermove', (evt) => {
    const coordinate = evt.coordinate;
    tempSource.clear();
    
    // Tạo feature tạm thời tại vị trí chuột
    const tempFeature = new Feature({
      geometry: new OlPoint(coordinate),
    });
    tempFeature.setStyle(tempStyle);
    tempSource.addFeature(tempFeature);
  });

  // Xử lý sự kiện select với type casting
  select.on('select', (evt) => {
    const selectEvent = evt as SelectEvent;
    const selectedFeatures = selectEvent.selected;
    const deselectedFeatures = selectEvent.deselected;

    // Xử lý bỏ chọn
    if (deselectedFeatures?.length > 0) {
      console.log("Feature unselected");
      setSelectedFeature(null);
      setIsFormVisible(false);
    }

    // Xử lý chọn mới
    if (selectedFeatures?.length > 0) {
      const feature = selectedFeatures[0] as Feature<OlPoint>;
      const featureId = feature.get("id");
      const featureProperties = feature.getProperties();

      console.log("Selected feature properties:", featureProperties);

      if (featureId !== undefined && featureId !== null) {
        setSelectedFeature(feature);
        setIsFormVisible(true);

        // Gỡ bỏ interaction và layer tạm thời sau khi chọn thành công
        map.removeInteraction(select);
        map.removeLayer(tempLayer);
        map.un('pointermove', () => {});
        notification.destroy("select-update-mode");
      } else {
        notification.error({
          message: "Lỗi",
          description: "Điểm được chọn không có thông tin ID hợp lệ.",
        });
        console.warn("Selected feature is missing an ID property.", feature);
      }
    }
  });
}
