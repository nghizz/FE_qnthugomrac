// src/map/handleDeletePoint.ts
import { notification, Modal } from "antd";
import { Map as MapOl } from "ol";
import { Select } from "ol/interaction";
import VectorLayer from "ol/layer/Vector";
import { Style, Circle, Fill, Stroke } from 'ol/style';
import { SelectEvent } from 'ol/interaction/Select';
import { LAYER_NAME } from "../../../../constants";
import { getPointStyle } from "../../../../utils/pointStyle";

type DeleteFn = (id: number) => Promise<void>;

// Style cho điểm được chọn để xóa
const deleteStyle = new Style({
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

/**
 * Bật chế độ xoá điểm trên bản đồ, gọi lại deletePoint từ context
 * @param map - OpenLayers Map instance
 * @param deletePoint - Hàm deletePoint(id) lấy từ context
 */
export function handleDeletePoint(map: MapOl | null, deletePoint: DeleteFn) {
  if (!map) {
    console.warn("Map is null in handleDeletePoint");
    return;
  }

  // Tìm layer chính
  const layer = map
    .getLayers()
    .getArray()
    .find((l) => l instanceof VectorLayer && l.get("name") === LAYER_NAME) as VectorLayer;

  if (!layer) {
    notification.warning({
      message: `Không tìm thấy layer '${LAYER_NAME}'`,
      description: "Bạn cần có layer này để xoá điểm.",
    });
    return;
  }

  // Áp dụng style cho layer dựa trên trạng thái của từng điểm
  layer.setStyle((feature) => {
    const status = feature.get('status') || 'pending';
    return getPointStyle(status);
  });

  // Tạo select interaction
  const select = new Select({ 
    layers: [layer],
    hitTolerance: 10,
    style: deleteStyle
  });
  
  map.addInteraction(select);

  notification.info({
    key: "delete-mode",
    message: "Chế độ xoá điểm",
    description: "Click vào điểm muốn xoá",
    duration: 5,
  });

  // Xử lý sự kiện select với type casting
  select.on('select', (evt) => {
    const selectEvent = evt as SelectEvent;
    const features = selectEvent.selected;
    const deselectedFeatures = selectEvent.deselected;

    // Xử lý bỏ chọn
    if (deselectedFeatures?.length > 0) {
      console.log("Feature unselected for delete");
    }

    // Xử lý chọn mới
    if (features?.length > 0) {
      const feature = features[0];
      const featureProperties = feature.getProperties();
      console.log("Selected feature for delete, properties:", featureProperties);

      const id = feature.get("id");
      if (!id) {
        notification.error({
          message: "Không thể xác định ID của điểm cần xoá",
          description: "Vui lòng chọn lại điểm khác.",
        });
        return;
      }

      Modal.confirm({
        title: "Xác nhận xoá điểm?",
        content: `Bạn có chắc chắn muốn xoá điểm "${featureProperties.name || 'không tên'}" không?`,
        onOk: async () => {
          try {
            // Xóa điểm từ API
            await deletePoint(id);

            // Xóa feature khỏi source và refresh toàn bộ features
            const source = layer.getSource();
            if (source) {
              // Lưu lại danh sách features hiện tại (trừ feature cần xóa)
              const currentFeatures = source.getFeatures().filter(f => f.get('id') !== id);
              
              // Clear source
              source.clear();
              
              // Thêm lại tất cả features và áp dụng style
              currentFeatures.forEach(f => {
                source.addFeature(f);
              });
              
              // Force refresh
              source.refresh();
              layer.changed();
              
              // Force map to render and update
              map.render();
              map.updateSize();
            }

            // Clear selection
            select.getFeatures().clear();

            notification.success({ message: "Xoá điểm thành công!" });
          } catch (err) {
            notification.error({
              message: "Lỗi khi xoá điểm",
              description: err instanceof Error ? err.message : "Đã có lỗi xảy ra.",
            });
          } finally {
            map.removeInteraction(select);
            notification.destroy("delete-mode");
          }
        },
        onCancel: () => {
          // Clear selection
          select.getFeatures().clear();
          map.removeInteraction(select);
          notification.destroy("delete-mode");
        },
      });
    }
  });
}

