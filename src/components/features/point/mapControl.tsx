// src/components/features/point/mapControl.tsx
import React, { useCallback, useEffect, useState, useMemo } from "react";
import { Button, Dropdown, Menu, notification, Modal } from "antd";
import { AimOutlined } from "@ant-design/icons";
import { fromLonLat, toLonLat } from "ol/proj";
import MapOl from "ol/Map";
import Feature from "ol/Feature";
import { Point as OlPoint } from "ol/geom";
import VectorSource from "ol/source/Vector";
import VectorLayer from "ol/layer/Vector";
import { Draw as DrawInteraction } from "ol/interaction";
import { useCollectionPointsContext } from "../../../context/collectionContext";
import InputPointForm from "../../common/UI/input-form";
import { PointCreate, PointUpdate } from "../../../types/models/point";
import { getUserRole, getIDUser } from "../../../utils/user";
import { InputPointFormValues } from "../../common/UI/input-form/form";

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
  const { createPoint, updatePoint, deletePoint, reloadPoints } =
    useCollectionPointsContext();

  const [role, setRole] = useState<string>(userRole || getUserRole());
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [selectedFeature, setSelectedFeature] =
    useState<Feature<OlPoint> | null>(null);
  const [updateMode, setUpdateMode] = useState(false);

  useEffect(() => {
    setRole(userRole || getUserRole());
  }, [userRole]);

  useEffect(() => {
    notification.config({
      placement: "topRight",
      top: 80,
      duration: 5,
      maxCount: 3,
    });
  }, []);

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

  const onAddPointClick = useCallback(() => {
    setUpdateMode(false);
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
      const feat = evt.feature as Feature<OlPoint>;
      const [x, y] = feat.getGeometry()!.getCoordinates() as [number, number];
      console.log("Drawend raw coords (EPSG:3857):", x, y);
      const [lon, lat] = toLonLat([x, y]);
      console.log("Drawend converted coords (EPSG:4326):", lon, lat);
      setSelectedFeature(feat);
      setIsFormVisible(true);
      map.removeInteraction(drawInteraction);
      map.removeLayer(drawLayer);
    });
  }, [map, role]);

  const onFormSubmit = useCallback(
    async (feature: Feature<OlPoint>, values: InputPointFormValues) => {
      try {
        const geom = feature.getGeometry();
        if (!geom) throw new Error("Không có tọa độ");
        const [x, y] = geom.getCoordinates() as [number, number];
        console.log("Form submit raw coords (EPSG:3857):", x, y);
        const [lon, lat] = toLonLat([x, y]);
        console.log("Form submit converted coords (EPSG:4326):", lon, lat);

        const payload: PointCreate = {
          name: values.name,
          type: values.type,
          toadox: lat,
          toadoy: lon,
          frequency: values.frequency,
          created_by: getIDUser() || 0,
          created_at: new Date().toISOString(),
        };
        console.log("Form submit payload:", payload);

        await createPoint(payload);
        notification.success({ message: "Thêm điểm thu gom thành công!" });
        setIsFormVisible(false);
        setSelectedFeature(null);
      } catch (err) {
        console.error(err);
        notification.error({ message: "Lỗi khi thêm điểm thu gom!" });
      } finally {
        reloadPoints();
      }
    },
    [createPoint, reloadPoints]
  );

  const onFormCancelClick = useCallback(() => {
    setIsFormVisible(false);
    setSelectedFeature(null);
  }, []);

  const onUpdatePoint = useCallback(
    async (feature: Feature<OlPoint>, values: InputPointFormValues) => {
      try {
        const id = feature.get("id") as number;
        const geom = feature.getGeometry();
        if (!geom) throw new Error("Không có tọa độ");
        const [x, y] = geom.getCoordinates() as [number, number];
        console.log("Update raw coords (EPSG:3857):", x, y);
        const [lon, lat] = toLonLat([x, y]);
        console.log("Update converted coords (EPSG:4326):", lon, lat);

        const payload: PointUpdate = {
          name: values.name,
          type: values.type,
          toadox: lat,
          toadoy: lon,
          frequency: values.frequency,
          srid: 4326,
        };
        console.log("Update payload:", payload);

        await updatePoint(id, payload);
        notification.success({ message: "Cập nhật thành công!" });
        setIsFormVisible(false);
        setSelectedFeature(null);
        setUpdateMode(false);
      } catch (err) {
        console.error(err);
        notification.error({ message: "Lỗi khi cập nhật!" });
      } finally {
        reloadPoints();
      }
    },
    [updatePoint, reloadPoints]
  );

  const onDeletePoint = useCallback(
    (feature: Feature<OlPoint>) => {
      const id = feature.get("id") as number;
      Modal.confirm({
        title: "Xác nhận xóa",
        content: "Bạn có chắc muốn xóa điểm thu gom này?",
        okText: "Xóa",
        okType: "danger",
        cancelText: "Hủy",
        onOk: async () => {
          try {
            await deletePoint(id);
            notification.success({ message: "Xóa thành công!" });
            setSelectedFeature(null);
          } catch (err) {
            console.error(err);
            notification.error({ message: "Lỗi khi xóa!" });
          } finally {
            reloadPoints();
          }
        },
      });
    },
    [deletePoint, reloadPoints]
  );

  const menu = useMemo(
    () => (
      <Menu>
        <Menu.Item key="add" onClick={onAddPointClick}>
          Thêm điểm thu gom
        </Menu.Item>
        {role === "admin" && selectedFeature && (
          <>
            <Menu.Item
              key="update"
              onClick={() => {
                setUpdateMode(true);
                setIsFormVisible(true);
              }}
            >
              Cập nhật điểm thu gom
            </Menu.Item>
            <Menu.Item
              key="delete"
              danger
              onClick={() => onDeletePoint(selectedFeature)}
            >
              Xóa điểm thu gom
            </Menu.Item>
          </>
        )}
      </Menu>
    ), [onAddPointClick, onDeletePoint, role, selectedFeature]
  );

  return (
    <div
      style={{
        position: "absolute",
        top: 80,
        right: 20,
        zIndex: 1000,
        background: "transparent",
        padding: "0px",
        boxShadow: "none",
        display: "flex",
        flexDirection: "row",
        gap: "10px",
      }}
    >
      <Dropdown overlay={menu} trigger={["click"]}>
        <Button type="default">Quản lý điểm thu gom</Button>
      </Dropdown>

      <Button type="default" icon={<AimOutlined />} onClick={moveToMyLocation}>
        Vị trí của tôi
      </Button>

      {isFormVisible && selectedFeature && (
        <InputPointForm
          visible={isFormVisible}
          onCancel={onFormCancelClick}
          onSubmit={(feature, values) =>
            updateMode ? onUpdatePoint(feature, values) : onFormSubmit(feature, values)
          }
          feature={selectedFeature}
          mode={updateMode ? "update" : "add"}
        />
      )}
    </div>
  );
};

export default MapCRUDControls;
