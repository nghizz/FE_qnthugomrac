import React, { useEffect, useRef, useState } from "react";
import { MapContext } from "../../../context/mapContext";
import MapOl from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import { OSM } from "ol/source";
import { fromLonLat } from "ol/proj";
import "./styles/Map.css";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import Feature from "ol/Feature";
import OlPoint from "ol/geom/Point";
import Style from "ol/style/Style";
import Icon from "ol/style/Icon";
import { getUserRole } from "../../../utils/user";
import TileWMS from "ol/source/TileWMS";
import { GEOSERVER_URL, DEFAULT_CENTER, DEFAULT_ZOOM, USER_ICON_URL, USER_ICON_SCALE, USER_FEATURE_ID } from "../../../constants";
/**
 * Props interface for the Map component
 */
type MapProps = React.PropsWithChildren & {
  userLocation?: { lat: number; lon: number } | null;
  onMapReady?: (mapInstance: MapOl) => void;
};

/**
 * Map component that displays OpenStreetMap with collection points
 * and user location
 */
const Map: React.FC<MapProps> = ({ children, userLocation, onMapReady }) => {
  const userRole = getUserRole();
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<MapOl | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);

  /**
   * User location layer configuration
   */
  const [userLayer] = useState(() =>
    new VectorLayer({
      source: new VectorSource(),
      style: new Style({
        image: new Icon({
          src: USER_ICON_URL,
          scale: USER_ICON_SCALE,
        }),
      }),
      zIndex: 10,
      visible: true,
    })
  );

  /**
   * WMS layer configuration for collection points
   */
  const [wmsLayer] = useState(() =>
    new TileLayer({
      source: new TileWMS({
        url: GEOSERVER_URL,
        params: {
          LAYERS: "gdt:collection_points",
          TILED: true,
          CQL_FILTER: userRole !== "admin" ? "status='approved'" : undefined,
        },
        serverType: "geoserver",
      }),
      zIndex: 5,
      visible: true,
    })
  );

  /**
   * Update WMS layer filter based on user role
   */
  useEffect(() => {
    if (!wmsLayer) return;
    const source = wmsLayer.getSource();
    if (source && typeof source.updateParams === "function") {
      const params = source.getParams();
      if (userRole !== "admin") {
        params.CQL_FILTER = "status='approved'";
      } else {
        delete params.CQL_FILTER;
      }
      source.updateParams(params);
    }
  }, [userRole, wmsLayer]);

  /**
   * Initialize map and layers
   */
  useEffect(() => {
    const mapInstance = new MapOl({
      view: new View({
        center: fromLonLat(DEFAULT_CENTER),
        zoom: DEFAULT_ZOOM,
        projection: "EPSG:3857",
      }),
      controls: [],
      layers: [
        new TileLayer({
          source: new OSM(),
          zIndex: 1,
          visible: true,
        }),
        wmsLayer,
        userLayer,
      ],
    });

    mapInstance.setTarget(mapRef.current!);
    setMap(mapInstance);

    mapInstance.once("rendercomplete", () => {
      setIsMapReady(true);
    });

    if (onMapReady) {
      onMapReady(mapInstance);
    }

    const updateMapSize = () => mapInstance.updateSize();
    window.addEventListener("resize", updateMapSize);

    return () => {
      window.removeEventListener("resize", updateMapSize);
      mapInstance.setTarget(undefined);
    };
  }, [onMapReady, userLayer, wmsLayer]);

  /**
   * Update user location on the map
   */
  useEffect(() => {
    if (!map || !userLayer) return;
    const source = userLayer.getSource();
    if (!source) return;

    if (!userLocation) {
      const existing = source.getFeatureById(USER_FEATURE_ID);
      if (existing) source.removeFeature(existing);
      return;
    }

    const newPoint = new OlPoint(fromLonLat([userLocation.lon, userLocation.lat]));
    let userFeature = source.getFeatureById(USER_FEATURE_ID);
    if (!userFeature) {
      userFeature = new Feature({ geometry: newPoint });
      userFeature.setId(USER_FEATURE_ID);
      source.addFeature(userFeature);
    } else {
      userFeature.setGeometry(newPoint);
    }

    map.render();
  }, [userLocation, map, userLayer]);
  return (
    <MapContext.Provider value={{ map }}>
      <div ref={mapRef} className="map-container">
        {isMapReady && children}
      </div>
    </MapContext.Provider>
  );
};

export default Map;
