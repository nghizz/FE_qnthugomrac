// src/components/point/MapCRUDControls.tsx
import React, { useCallback, useState, useEffect } from "react";
import { Button, Dropdown, Menu, notification } from "antd";
import { AimOutlined } from "@ant-design/icons";
import { fromLonLat } from "ol/proj";
import MapOl from "ol/Map";
import Feature from "ol/Feature";
import { Point, Geometry } from "ol/geom";
import { useCollectionPointsContext } from "../../context/collectionContext";
import {
  handleAddPointByMapClick,
  handleFormSubmit,
  handleFormCancel,
} from "./createPoint";
import { handleUpdatePoint } from "./updatePoint";
import { handleDeletePoint } from "./deletePoint";
import InputPointForm from "../UI/input-form";
import type { PointPayload } from "../../api/collectionPoints";
import { getUserRole } from "../../utils/user";

// Định nghĩa kiểu cho giá trị form
interface FormValues {
  name: string;
  type: string;
  frequency: number;
}

interface MapCRUDControlsProps {
  map: MapOl | null;
  userLocation: { lat: number; lon: number } | null;
  userRole?: string;
}

const MapCRUDControls: React.FC<MapCRUDControlsProps> = ({
  map,
  userLocation,
  userRole,
}) => {
  const { addCollectionPoint, updateCollectionPoint, deleteCollectionPoint } =
    useCollectionPointsContext();

  notification.config({
    placement: "topRight",
    top: 80,
    duration: 5,
    maxCount: 3,
  });

  // Lấy role từ props nếu có, nếu không sử dụng hàm tiện ích getUserRole
  const initialRole = userRole || getUserRole();
  const [role, setRole] = useState<string>(initialRole);

  useEffect(() => {
    setRole(userRole || getUserRole());
  }, [userRole]);

  // State cho form và chế độ update
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState<Feature<Point> | null>(null);
  const [updateMode, setUpdateMode] = useState(false);

  // Di chuyển đến vị trí của tôi
  const moveToMyLocation = useCallback(() => {
    if (!map || !userLocation) {
      notification.warning({ message: "Chưa có thông tin vị trí!" });
      return;
    }
    map.getView().animate({
      center: fromLonLat([userLocation.lon, userLocation.lat]),
      zoom: 16,
      duration: 1000,
    });
  }, [map, userLocation]);

  // Chế độ Thêm điểm
  const onAddPointClick = useCallback(() => {
    setUpdateMode(false);
    handleAddPointByMapClick({
      map,
      role,
      setSelectedFeature,
      setIsFormVisible,
    });
  }, [map, role]);

  // Khi submit form ở chế độ thêm điểm
  const onAddFormSubmit = useCallback(
    async (feature: Feature<Point>) => {
      await handleFormSubmit({
        map,
        feature,
        addCollectionPoint,
        setIsFormVisible,
        setSelectedFeature,
      });
    },
    [map, addCollectionPoint]
  );

  // Wrapper onSubmit cho chế độ thêm: '_values' không dùng nhưng giữ đúng signature
  const handleInputFormSubmitAdd = useCallback(
    (feature: Feature<Geometry>, _values: unknown): void => {
      // Sử dụng void để "dùng" _values và tránh cảnh báo ESLint
      void _values;
      onAddFormSubmit(feature as Feature<Point>)
        .then(() => {
          // Không cần xử lý thêm
        })
        .catch((err) => {
          console.error(err);
        });
    },
    [onAddFormSubmit]
  );

  // Khi submit form ở chế độ cập nhật
  const handleInputFormSubmitUpdate = useCallback(
    (feature: Feature<Geometry>, values: FormValues): void => {
      const pointFeature = feature as Feature<Point>;
      const props = pointFeature.getProperties();
      const id = props.id;
      const payload: PointPayload = {
        name: values.name,
        type: values.type,
        frequency: values.frequency,
        srid: 4326,
        toadox: props.toadox,
        toadoy: props.toadoy,
      };
      updateCollectionPoint(id, payload)
        .then(() => {
          notification.success({ message: "Cập nhật điểm thành công!" });
        })
        .catch((err) => {
          console.error(err);
        })
        .finally(() => {
          setIsFormVisible(false);
          setSelectedFeature(null);
          setUpdateMode(false);
        });
    },
    [updateCollectionPoint]
  );

  // onCancel chung cho form
  const onFormCancel = useCallback(() => {
    handleFormCancel({
      map,
      setIsFormVisible,
      setSelectedFeature,
    });
    setUpdateMode(false);
  }, [map]);

  // Chế độ Sửa điểm: khi admin click "Sửa điểm"
  const onUpdatePointClick = useCallback(() => {
    setUpdateMode(true);
    handleUpdatePoint(map, (feature: Feature<Point>) => {
      setSelectedFeature(feature);
      setIsFormVisible(true);
    });
  }, [map]);

  // Chế độ Xoá điểm
  const onDeletePointClick = useCallback(() => {
    handleDeletePoint(map, deleteCollectionPoint);
  }, [map, deleteCollectionPoint]);

  // Chọn wrapper onSubmit dựa vào chế độ (update hoặc add)
  const handleInputFormSubmit = updateMode
    ? handleInputFormSubmitUpdate
    : handleInputFormSubmitAdd;

  // Menu dropdown
  const menuItems = (
    <Menu>
      {(role === "user" || role === "admin") && (
        <Menu.Item key="add" onClick={onAddPointClick}>
          Thêm điểm (click bản đồ)
        </Menu.Item>
      )}
      {role === "admin" && (
        <>
          <Menu.Item key="update" onClick={onUpdatePointClick}>
            Sửa điểm
          </Menu.Item>
          <Menu.Item key="delete" onClick={onDeletePointClick}>
            Xoá điểm
          </Menu.Item>
        </>
      )}
      {(!role || role === "") && (
        <Menu.Item disabled key="require-login">
          Vui lòng đăng nhập để thao tác
        </Menu.Item>
      )}
    </Menu>
  );

  return (
    <>
      <div style={{ position: "absolute", top: 70, right: 140, zIndex: 2 }}>
        <Dropdown overlay={menuItems} trigger={["click"]}>
          <Button style={{ background: "#fff", right: "15px" }}>
            Điểm thu gom
          </Button>
        </Dropdown>
      </div>

      <div style={{ position: "absolute", top: 70, right: 20, zIndex: 2 }}>
        <Button
          icon={<AimOutlined />}
          onClick={moveToMyLocation}
          style={{ background: "#fff" }}
        >
          Vị trí của tôi
        </Button>
      </div>

      <InputPointForm
        visible={isFormVisible}
        onCancel={onFormCancel}
        onSubmit={handleInputFormSubmit}
        feature={selectedFeature}
        mode={updateMode ? "update" : "add"}
      />
    </>
  );
};

export default MapCRUDControls;