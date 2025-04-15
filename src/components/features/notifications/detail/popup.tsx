/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useRef } from "react";
import { useMapContext } from "../../../../context/mapContext";
import Overlay from "ol/Overlay";
import { fromLonLat, toLonLat } from "ol/proj";
import { toStringHDMS } from "ol/coordinate";
import { TileWMS } from "ol/source";
import TileLayer from "ol/layer/Tile";
import MapBrowserEvent from "ol/MapBrowserEvent";


declare global {
  interface Window {
    openDetailPopup?: (lon: number, lat: number, name: string, type: string) => void;
  }
}

const PopupDetail: React.FC = () => {
  const { map } = useMapContext();
  const overlayRef = useRef<Overlay | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!map) {
      console.warn("Map is not initialized yet");
      return;
    }

    let container = document.getElementById("popup") as HTMLDivElement;
    if (!container) {
      container = document.createElement("div");
      container.id = "popup";
      container.style.display = "none";
      container.innerHTML = `
        <div class="ant-card ant-card-bordered" style="background-color: #fff; width: 300px; padding: 8px 16px; position: relative;">
          <div class="ant-card-head">
            <div class="ant-card-head-wrapper">
              <div class="ant-card-head-title">Thông tin</div>
            </div>
          </div>
          <div class="ant-card-body" id="popup-content"></div>
          <button id="popup-closer" class="ant-btn ant-btn-link" style="position: absolute; top: 8px; right: 8px;">
            Đóng
          </button>
        </div>
      `;
      document.body.appendChild(container);
    }
    containerRef.current = container;

    const overlay = new Overlay({
      element: container,
      autoPan: { animation: { duration: 250 } },
    });
    map.addOverlay(overlay);
    overlayRef.current = overlay;

    const closer = container.querySelector("#popup-closer") as HTMLButtonElement;
    closer.onclick = function () {
      overlay.setPosition(undefined);
      container.style.display = "none";
      closer.blur();
      return false;
    };

    function openDetailPopup(lon: number, lat: number, name: string, type: string) {
      if (!overlayRef.current || !containerRef.current) return;
      const coordinate = fromLonLat([lon, lat]);
      const hdms = toStringHDMS(toLonLat(coordinate));
      const contentHtml = `<p><b>Bạn vừa chọn điểm:</b></p>
        <code>${hdms}</code>
        <p><b>Thông tin điểm:</b></p>
        <ul>
          <li><b>Tên:</b> ${name}</li>
          <li><b>Loại:</b> ${type}</li>
        </ul>`;
      containerRef.current.querySelector("#popup-content")!.innerHTML = contentHtml;
      overlayRef.current.setPosition(coordinate);
      containerRef.current.style.display = "block";
    }
    window.openDetailPopup = openDetailPopup;

    const handleSingleClick = async (evt: MapBrowserEvent<any>) => {
      const view = map.getView();
      const resolution = view.getResolution();
      if (!resolution) return;

      let wmsSource: TileWMS | null = null as TileWMS | null;
      map.getLayers().forEach((layer) => {
        if (layer instanceof TileLayer) {
          const src = layer.getSource();
          if (src && typeof src.getParams === "function") {
            const params = src.getParams();
            if (params.LAYERS === "gdt:collection_points") {
              wmsSource = src as TileWMS;
            }
          }
        }
      });

      if (!wmsSource) {
        console.error("WMS Source not found!");
        return;
      }

      const url = (wmsSource as TileWMS).getFeatureInfoUrl(evt.coordinate, resolution, "EPSG:3857", {
        INFO_FORMAT: "application/json",
        FEATURE_COUNT: 1,
      });

      if (url) {
        try {
          const response = await fetch(url);
          const data = await response.json();

          if (data.features && data.features.length > 0) {
            const props = data.features[0].properties;
            const hdms = toStringHDMS(toLonLat(evt.coordinate));
            const contentHtml = `<p><b>Bạn vừa click vào:</b></p>
              <code>${hdms}</code>
              <p><b>Thông tin điểm:</b></p>
              <ul>
                <li><b>Tên:</b> ${props.name || "N/A"}</li>
                <li><b>Loại:</b> ${props.type || "N/A"}</li>
              </ul>`;

            containerRef.current!.querySelector("#popup-content")!.innerHTML = contentHtml;
            overlay.setPosition(evt.coordinate);
            container.style.display = "block";
          } else {
            overlay.setPosition(undefined);
            container.style.display = "none";
          }
        } catch (error) {
          console.error("GetFeatureInfo error:", error);
          overlay.setPosition(undefined);
          container.style.display = "none";
        }
      } else {
        overlay.setPosition(undefined);
        container.style.display = "none";
      }
    };

    map.on("singleclick", handleSingleClick);

    return () => {
      map.un("singleclick", handleSingleClick);
      map.removeOverlay(overlay);
      if (document.body.contains(container)) {
        document.body.removeChild(container);
      }
      delete window.openDetailPopup;
    };
  }, [map]);

  return null;
};

export default PopupDetail;
