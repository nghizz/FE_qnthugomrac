// src/pages/Home.tsx
import React, { useCallback, useState, useMemo } from "react";
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
import ChatWrapper from "../components/features/message/user/ChatUser";
import ChatIconButton from "../components/common/app-icon/ChatIconButton";
import { useGetIdentity } from "@refinedev/core";
import AdminMessageBox from "../components/features/message/admin/AdminMessageBox";

interface UserIdentity {
  id: number;
  username: string;
  roles?: string[];
  isAdmin?: boolean;
  role?: string; // dùng cho admin check phía ChatWrapper
  token?: string;
}

interface Point {
  id: string;
  name: string;
  type: string;
  lat: number;
  lon: number;
}

const Home: React.FC = () => {
  const [map, setMap] = useState<MapOl | null>(null);
  const [openChat, setOpenChat] = useState(false);
  const userLocation = useUserLocation();

  const { data: userIdentity, isLoading: isIdentityLoading } =
    useGetIdentity<UserIdentity>();

  const isAdmin = useMemo(
    () => {
      const admin = userIdentity?.roles?.includes("admin") ||
        userIdentity?.isAdmin ||
        userIdentity?.role === "admin";
      console.log('User identity:', userIdentity);
      console.log('Is admin:', admin);
      return admin;
    },
    [userIdentity]
  );

  const ADMIN_USER_ID = 2;

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

  if (isIdentityLoading) {
    return (
      <div
        className="home-container"
        style={{ padding: "2rem", textAlign: "center" }}
      >
        <p>Đang tải thông tin người dùng...</p>
      </div>
    );
  }

  return (
    <CollectionPointsProvider>
      <MapProvider value={{ map }}>
        <div className="home-container">
          <Navbar />

          <MapCRUDControls
            map={map}
            userLocation={userLocation}
            userRole={isAdmin ? "admin" : "user"}
          />

          <div
            style={{ position: "absolute", top: 70, left: 20, zIndex: 9999 }}
          >
            <Search onMoveToPoint={handleMoveToPoint} />
          </div>

          <MapComponent userLocation={userLocation} onMapReady={handleMapReady}>
            <PointsLayer />
            {map && <PopupDetail />}
          </MapComponent>

          {userIdentity && (
            <>
              <ChatIconButton onClick={() => {
                setOpenChat(true);
              }} />
              {openChat && (
                isAdmin ? (
                  <AdminMessageBox onClose={() => setOpenChat(false)} />
                ) : (
                  <ChatWrapper
                    adminId={ADMIN_USER_ID}
                    onClose={() => setOpenChat(false)}
                  />
                )
              )}
            </>
          )}
        </div>
      </MapProvider>
    </CollectionPointsProvider>
  );
};

export default Home;
