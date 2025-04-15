// src/pages/Home.tsx
import React, { useCallback, useState } from "react";
import Navbar from "../components/features/navbar/navbar";
import MapComponent from "../components/features/map/Map";
import PopupDetail from "../components/features/notifications/detail/popup";
import Search from "../components/common/UI/search/search";
import MapCRUDControls from "../components/features/point/mapControl";
import PointsLayer from "../components/layer/points";
import { fromLonLat } from "ol/proj";
import MapOl from "ol/Map";
import "./index.css";
import { useUserLocation } from "../hooks/useLocation";
import { CollectionPointsProvider } from "../context/collectionContext";
import { MapProvider } from "../context/mapContext";
import { getCurrentUser } from "../utils/user";

interface Point {
  id: string;
  name: string;
  type: string;
  lat: number;
  lon: number;
}

const Home: React.FC = () => {
  const [map, setMap] = useState<MapOl | null>(null);
  const userLocation = useUserLocation();

  const currentUser = getCurrentUser();
  const userRole = currentUser?.role || "user";

  const handleMapReady = useCallback((mapInstance: MapOl) => {
    setMap(mapInstance);
  }, []);

  const handleMoveToPoint = (point: Point) => {
    if (!map) return;
    map.getView().animate({
      center: fromLonLat([point.lon, point.lat]),
      zoom: 16,
      duration: 1000,
    });
  };

  return (
    <CollectionPointsProvider>
      <MapProvider value={{ map }}>
        <div className="home-container">
          <Navbar />

          <MapCRUDControls
            map={map}
            userLocation={userLocation}
            userRole={userRole}
          />

          <div style={{ position: "absolute", top: 70, left: 20, zIndex: 9999 }}>
            <Search onMoveToPoint={handleMoveToPoint} />
          </div>

          <MapComponent
            userLocation={userLocation}
            onMapReady={handleMapReady}
          >
            <PointsLayer />
            {map && <PopupDetail />}
          </MapComponent>
        </div>
      </MapProvider>
    </CollectionPointsProvider>
  );
};

export default Home;
