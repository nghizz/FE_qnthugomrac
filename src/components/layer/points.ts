import React, { useEffect, useState } from "react";
import { Vector as VectorLayer } from "ol/layer";
import { Vector as VectorSource } from "ol/source";
import { Feature } from "ol";
import { Point as OlPointGeom } from "ol/geom";
import WKT from "ol/format/WKT";

import { getPointStyle } from "../../utils/pointStyle";
import { getUserRole } from "../../utils/user";
import { useCollectionPointsContext } from "../../context/collectionContext";
import { useMapContext } from "../../context/mapContext";
import { LAYER_NAME, LAYER_Z_INDEX, DEFAULT_STATUS } from "../../constants";

const PointsLayer: React.FC = () => {
  const { points } = useCollectionPointsContext();
  const { map } = useMapContext();
  const role = getUserRole();

  const [pointsLayer] = useState(() => {
    const layer = new VectorLayer({
      source: new VectorSource(),
      style: (feature) => {
        const status = (feature.get("status") ?? DEFAULT_STATUS).toString().toLowerCase();
        return getPointStyle(status);
      },
      zIndex: LAYER_Z_INDEX,
    });
    layer.set("name", LAYER_NAME);
    return layer;
  });

  useEffect(() => {
    if (!map) return;
    map.addLayer(pointsLayer);
    return () => {
      map.removeLayer(pointsLayer);
    };
  }, [map, pointsLayer]);

  useEffect(() => {
    const source = pointsLayer.getSource();
    if (!source || !points) return;

    source.clear();
    const wktFormat = new WKT();
    const features: Feature[] = [];

    points.forEach((pt) => {
      let geometry = null;

      // Dùng toadox/toadoy nếu hợp lệ
      if (
        typeof pt.toadox === "number" &&
        typeof pt.toadoy === "number" &&
        !isNaN(pt.toadox) &&
        !isNaN(pt.toadoy)
      ) {
        geometry = new OlPointGeom([pt.toadoy, pt.toadox]);
      } else if (pt.geom) {
        try {
          geometry = wktFormat.readGeometry(pt.geom, {
            dataProjection: "EPSG:4326",
            featureProjection: "EPSG:3857",
          });
        } catch (err) {
          console.warn(`❌ WKT error at point ${pt.id}:`, err);
        }
      }

      if (!geometry) {
        console.warn(`❌ Invalid geometry for point ${pt.id}, skipping`);
        return;
      }

      const feature = new Feature({ geometry });
      feature.setId(pt.id);
      feature.set("status", pt.status?.toLowerCase() ?? DEFAULT_STATUS);
      feature.setProperties(pt); // Gán full thông tin point vào feature

      features.push(feature);
    });

    // Nếu không phải admin → lọc theo "approved"
    const visibleFeatures =
      role !== "admin"
        ? features.filter((f) => f.get("status") === "approved")
        : features;

    console.log(
      role !== "admin"
        ? `🔍 Non-admin: showing approved points only: ${visibleFeatures.length}`
        : `🛠 Admin: showing all points: ${visibleFeatures.length}`
    );

    source.addFeatures(visibleFeatures);
    map?.render();
  }, [points, pointsLayer, role, map]);

  return null;
};

export default PointsLayer;
