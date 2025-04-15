import React, { useState, useEffect } from "react";
import { SearchOutlined } from "@ant-design/icons";
import { Button, Tooltip, notification } from "antd";
import SearchPopup, { SearchPoint } from "./seachPopup";
import { getUserRole } from "../../../../utils/user";
import { openDetailPopup } from "../../../features/notifications/detail";
import { Point as ModelPoint, PointStatus } from "../../../../types/models/point";

// Constants
const GEOSERVER_URL = "http://localhost:8080/geoserver/gdt/wfs";
const NEARBY_RADIUS = 1000; // meters

interface GeoJSONFeature {
  id: string;
  properties: {
    name: string;
    type: string;
    status?: string;
    [key: string]: unknown;
  };
  geometry: {
    coordinates: [number, number];
  };
}

type SearchProps = {
  onMoveToPoint: (point: SearchPoint) => void;
};

const Search: React.FC<SearchProps> = ({ onMoveToPoint }) => {
  const [popupVisible, setPopupVisible] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchPoint[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const userRole = getUserRole();

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
        () => notification.error({ message: "Không thể lấy vị trí của bạn!" })
      );
    }
  }, []);

  const convertFeaturesToPoints = (features: GeoJSONFeature[]): SearchPoint[] =>
    features
      .filter((f) =>
        userRole === "admin" ? true : f.properties.status?.toLowerCase() === "approved"
      )
      .map((f) => ({
        id: f.id,
        name: String(f.properties.name || ""),
        type: String(f.properties.type || ""),
        lat: f.geometry.coordinates[1],
        lon: f.geometry.coordinates[0],
      }));

  const handleSearch = async (keyword: string, pointType: string) => {
    setIsLoading(true);
    try {
      const cql: string[] = [];
      if (keyword) cql.push(`name ILIKE '%${keyword}%'`);
      if (pointType !== "all") cql.push(`type='${pointType}'`);
      const filter = cql.length ? cql.join(" AND ") : "INCLUDE";
      const url = `${GEOSERVER_URL}?service=WFS&version=1.1.0&request=GetFeature&typeName=gdt:collection_points&outputFormat=application/json&CQL_FILTER=${encodeURIComponent(filter)}`;

      const res = await fetch(url);
      const json = await res.json();
      setSearchResults(convertFeaturesToPoints(json.features));
    } catch {
      notification.error({ message: "Lỗi khi tải dữ liệu từ GeoServer!" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchNearby = async (pointType: string) => {
    if (!userLocation) {
      notification.error({ message: "Vui lòng bật vị trí để tìm điểm gần nhất!" });
      return;
    }
    setIsLoading(true);
    try {
      const cql: string[] = [];
      if (pointType !== "all") cql.push(`type='${pointType}'`);
      cql.push(`DWITHIN(geom, POINT(${userLocation.lon} ${userLocation.lat}), ${NEARBY_RADIUS}, meters)`);
      const filter = cql.join(" AND ");
      const url = `${GEOSERVER_URL}?service=WFS&version=1.1.0&request=GetFeature&typeName=gdt:collection_points&outputFormat=application/json&CQL_FILTER=${encodeURIComponent(filter)}`;

      const res = await fetch(url);
      const json = await res.json();
      setSearchResults(convertFeaturesToPoints(json.features));
    } catch {
      notification.error({ message: "Lỗi khi tải dữ liệu gần nhất từ GeoServer!" });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePointSelect = (pt: SearchPoint) => {
    onMoveToPoint(pt);

    const detailPoint: ModelPoint = {
      id: Number(pt.id),
      name: pt.name,
      type: pt.type,
      status: "approved" as PointStatus,
      toadox: pt.lat,
      toadoy: pt.lon,
      srid: 4326,
      frequency: 0,
      geom: `POINT(${pt.lon} ${pt.lat})`,
      created_by: 0,
      created_at: new Date().toISOString(),
    };

    openDetailPopup({
      point: detailPoint,
      onClose: () => {},
    });    
  };

  return (
    <>
      <Tooltip title="Tìm kiếm">
        <Button
          shape="circle"
          icon={<SearchOutlined />}
          onClick={() => setPopupVisible(true)}
        />
      </Tooltip>

      {popupVisible && (
        <SearchPopup
          onClose={() => setPopupVisible(false)}
          onSearch={handleSearch}
          onSearchNearby={handleSearchNearby}
          searchResults={searchResults}
          isLoading={isLoading}
          onSelectPoint={handlePointSelect}
        />
      )}
    </>
  );
};

export default Search;
