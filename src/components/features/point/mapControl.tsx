// src/components/features/point/mapControl.tsx
import React, { useCallback, useEffect, useState } from "react";
import { Button, Dropdown, Space, notification } from "antd"; // Giữ nguyên antd imports gốc
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  AimOutlined,
} from "@ant-design/icons";
import { fromLonLat, toLonLat } from "ol/proj";
import MapOl from "ol/Map";
import Feature from "ol/Feature";
import { Point as OlPoint } from "ol/geom";

import { useUserLocation } from "../../../hooks/useLocation";
import { useCollectionPointsContext } from "../../../context/collectionContext";
import InputPointForm, {
  InputPointFormValues,
} from "../../common/UI/input-form/form"; // Giữ nguyên import form gốc
import { getUserRole } from "../../../utils/user";

// static imports of handlers
import {
  handleAddPointByMapClick,
  handleFormSubmit,
  handleFormCancel,
} from "./components/createPoint";
// *** THAY ĐỔI IMPORT ***
import { handleSelectPointForUpdate } from "./components/updatePoint"; // Import hàm mới
import { handleDeletePoint } from "./components/deletePoint";

interface MapCRUDControlsProps {
  map: MapOl | null;
  userRole: "admin" | "user";
  userLocation: { lat: number; lon: number } | null;
}

// Giữ nguyên cấu trúc component gốc
const MapCRUDControls: React.FC<MapCRUDControlsProps> = ({ map }) => {
  const { createPoint, updatePoint, deletePoint, reloadPoints } =
    useCollectionPointsContext();
  const userLocation = useUserLocation();
  const role = getUserRole();

  const [isFormVisible, setIsFormVisible] = useState(false);
  const [selectedFeature, setSelectedFeature] =
    useState<Feature<OlPoint> | null>(null);
  // *** THAY ĐỔI STATE MODE ***
  const [mode, setMode] = useState<"add" | "update" | null>(null); // Cho phép null

  useEffect(() => {
    notification.config({ placement: "topRight", top: 80, duration: 5 });
  }, []);

  const moveToMyLocation = useCallback(() => {
    // Giữ nguyên logic gốc
    if (!map || !userLocation) {
      notification.warning({ message: "Chưa có thông tin vị trí!" });
      return;
    }
    map.getView().animate({
      center: fromLonLat([userLocation.lon, userLocation.lat]),
      zoom: 16,
      duration: 800,
    });
  }, [map, userLocation]);

  const dispatchCRUDEvent = (type: 'start' | 'end') => {
    const event = new Event(type === 'start' ? 'startCRUDOperation' : 'endCRUDOperation');
    document.dispatchEvent(event);
  };

  const onFormCancelCb = useCallback(() => {
    handleFormCancel({ map, setIsFormVisible, setSelectedFeature });
    setMode(null);
    dispatchCRUDEvent('end');
    // Reload points after cancel to ensure layer is up to date
    reloadPoints();
  }, [map, setIsFormVisible, setSelectedFeature, reloadPoints]);

  const cleanupCurrentOperation = useCallback(() => {
    if (map) {
      // Remove any existing interactions
      const interactions = map.getInteractions().getArray();
      interactions.forEach(interaction => {
        if (interaction.get('type') === 'select' || interaction.get('type') === 'modify') {
          map.removeInteraction(interaction);
        }
      });
    }
    setSelectedFeature(null);
    setIsFormVisible(false);
  }, [map]);

  // Cleanup before starting new operation
  const startNewOperation = useCallback((newMode: "add" | "update" | null) => {
    cleanupCurrentOperation();
    dispatchCRUDEvent('start');
    setMode(newMode);
  }, [cleanupCurrentOperation]);

  const onAdd = useCallback(() => {
    startNewOperation("add");
    handleAddPointByMapClick({
      map,
      role: role || "",
      setSelectedFeature,
      setIsFormVisible,
    });
  }, [map, role, setSelectedFeature, setIsFormVisible, startNewOperation]);

  const onUpdate = useCallback(() => {
    startNewOperation("update");
    handleSelectPointForUpdate(map, setSelectedFeature, setIsFormVisible);
  }, [map, setSelectedFeature, setIsFormVisible, startNewOperation]);

  const onDelete = useCallback(() => {
    startNewOperation(null);
    handleDeletePoint(map, deletePoint);
  }, [map, deletePoint, startNewOperation]);

  const onFormSubmitCb = useCallback(
    async (feature: Feature<OlPoint>, values: InputPointFormValues) => {
      if (!feature) {
        notification.error({message: "Lỗi", description: "Không có thông tin điểm để xử lý."});
        setMode(null);
        dispatchCRUDEvent('end');
        return;
      }

      try {
        if (mode === "add") {
          await handleFormSubmit({
            map,
            feature,
            values,
            addCollectionPoint: createPoint,
            reloadCollectionPoints: reloadPoints,
            setIsFormVisible,
            setSelectedFeature,
          });
        } else if (mode === "update") {
          const id = feature.get("id") as number;
          if (id === undefined || id === null) {
            notification.error({ message: "Lỗi", description: "Không thể cập nhật điểm thiếu ID."});
            return;
          }
          const coords = feature.getGeometry()?.getCoordinates();
          if (!coords) {
            notification.error({ message: "Lỗi", description: "Không thể lấy tọa độ của điểm cần cập nhật."});
            return;
          }
          const [lon, lat] = toLonLat(coords);

          await updatePoint(id, {
            name: values.name,
            type: values.type,
            frequency: values.frequency,
            toadox: lat,
            toadoy: lon,
            srid: 4326,
          });
          notification.success({ message: "Cập nhật thành công!" });
        }
      } catch (err) {
        notification.error({
          message: "Lỗi khi xử lý!",
          description: err instanceof Error ? err.message : "Đã có lỗi xảy ra.",
        });
      } finally {
        setMode(null);
        setIsFormVisible(false);
        setSelectedFeature(null);
        dispatchCRUDEvent('end');
      }
    },
    [mode, map, createPoint, updatePoint, reloadPoints]
  );

  // --- PHẦN RENDER GIỮ NGUYÊN CẤU TRÚC GỐC ---
  const menuItems = (
    // Giữ nguyên cấu trúc Space và Button gốc
    <Space direction="vertical" size="middle">
      <Button icon={<PlusOutlined />} onClick={onAdd}>
        Thêm điểm thu gom
      </Button>
      {role === "admin" && (
        <>
          <Button icon={<EditOutlined />} onClick={onUpdate}>
            Sửa điểm thu gom
          </Button>
          <Button icon={<DeleteOutlined />} danger onClick={onDelete}>
            Xóa điểm thu gom
          </Button>
        </>
      )}
    </Space>
  );

  return (
    <>
      {/* Giữ nguyên cấu trúc Space và các nút gốc */}
      <Space
        style={{ position: "absolute", top: 70, right: 20, zIndex: 2 }}
        size="middle"
      >
        <Dropdown overlay={menuItems} trigger={["click"]}>
          <Button>
            Điểm thu gom
          </Button>
        </Dropdown>
        <Button icon={<AimOutlined />} onClick={moveToMyLocation}>
          Vị trí của tôi
        </Button>
      </Space>

      {/* Giữ nguyên component Form gốc */}
      <InputPointForm
        visible={isFormVisible}
        feature={selectedFeature}
        mode={mode as "add" | "update"}
        onSubmit={onFormSubmitCb}
        onCancel={onFormCancelCb}
      />
    </>
  );
};

export default MapCRUDControls;