import React, { useEffect, useState } from "react";
import { Vector as VectorLayer } from "ol/layer";
import { Vector as VectorSource } from "ol/source";
import { Feature } from "ol";
import { Geometry, Point } from "ol/geom";
//import { Style, Circle as CircleStyle, Fill, Stroke } from "ol/style";
import { fromLonLat } from "ol/proj";
import { useMapContext } from "../../context/mapContext";
import { useCollectionPointsContext } from "../../context/collectionContext";
import { LAYER_NAME, LAYER_Z_INDEX } from "../../constants";
import { getPointStyle } from "../../utils/pointStyle";
import { getUserRole } from "../../utils/user";

const PointsLayer: React.FC = () => {
  const { map } = useMapContext();
  const { points } = useCollectionPointsContext();
  const [pointsLayer] = useState(() => {
    const layer = new VectorLayer({
      source: new VectorSource(),
      style: (feature) => {
        const status = feature.get('status') || 'pending';
        return getPointStyle(status);
      },
      zIndex: LAYER_Z_INDEX + 1,
    });
    layer.set("name", LAYER_NAME);
    return layer;
  });

  // Add layer to map once and maintain it
  useEffect(() => {
    if (!map) return;

    // Check if layer already exists in map
    const existingLayer = map.getLayers().getArray().find(l => l.get('name') === LAYER_NAME);
    
    // If layer exists but is not our layer, remove it
    if (existingLayer && existingLayer !== pointsLayer) {
      map.removeLayer(existingLayer);
    }

    // If our layer is not in map, add it
    if (!map.getLayers().getArray().includes(pointsLayer)) {
      console.log("Adding points layer to map");
      map.addLayer(pointsLayer);
    }

    // Do not remove layer on cleanup
    return;
  }, [map, pointsLayer]);

  // Update features when points change
  useEffect(() => {
    if (!pointsLayer) return;
    
    const source = pointsLayer.getSource();
    if (!source || !points) return;
    
    console.log("Updating features with points:", points);
    
    // Clear existing features
    source.clear();

    // Get user role using utility function
    const userRole = getUserRole();
    
    // Add new features
    if (Array.isArray(points)) {
      const features = points
        .filter(point => {
          // Nếu là admin, hiển thị tất cả điểm
          if (userRole === 'admin') return true;
          // Nếu không phải admin, chỉ hiển thị điểm đã approved
          return point.status === 'approved';
        })
        .map(pt => {
          if (pt.toadox && pt.toadoy) {
            const coordinates = fromLonLat([pt.toadoy, pt.toadox]);
            const feature = new Feature({
              geometry: new Point(coordinates),
              ...pt,
            });
            feature.setId(pt.id);
            return feature;
          }
          return null;
        })
        .filter(Boolean);

      // Add all features at once for better performance
      source.addFeatures(features as Feature<Geometry>[]);
    }

    // Force layer update
    pointsLayer.changed();
    if (map) map.render();
  }, [points, pointsLayer, map]);

  return null;
};

export default PointsLayer;
