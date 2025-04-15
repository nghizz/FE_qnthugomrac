import { notification, Modal } from "antd";
import { Map as MapOl } from "ol";
import { Select } from "ol/interaction";

/**
 * Handles the point deletion process on the map
 * @param map - OpenLayers Map instance
 * @param deleteCollectionPoint - Function to delete a collection point by ID
 */
export function handleDeletePoint(
  map: MapOl | null,
  deleteCollectionPoint: (id: number) => Promise<void>
) {
  if (!map) return;

  // Add select interaction for point selection
  const selectInteraction = new Select();
  map.addInteraction(selectInteraction);

  // Notify user about delete mode
  notification.info({
    message: "Chế độ xoá điểm",
    description: "Click vào điểm muốn xoá",
  });

  // Handle point selection for deletion
  selectInteraction.on("select", async (evt) => {
    const selectedFeatures = evt.selected;
    if (selectedFeatures.length === 0) return;

    // Get point ID from selected feature
    const props = selectedFeatures[0].getProperties();
    const id = props.id;

    // Show confirmation modal
    Modal.confirm({
      title: "Xác nhận xoá điểm?",
      onOk: async () => {
        try {
          // Delete point and handle response
          await deleteCollectionPoint(id);
          notification.success({ message: "Xoá điểm thành công!" });
        } catch (error: unknown) {
          // Handle different types of errors
          if (error instanceof Error) {
            notification.error({
              message: "Lỗi khi xoá điểm!",
              description: error.message,
            });
          } else {
            notification.error({
              message: "Lỗi khi xoá điểm!",
              description: "Đã có lỗi xảy ra.",
            });
          }
        } finally {
          // Cleanup
          map.removeInteraction(selectInteraction);
        }
      },
      onCancel: () => {
        // Cleanup on cancel
        map.removeInteraction(selectInteraction);
      },
    });
  });
}