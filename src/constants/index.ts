export const API_URL = "http://localhost:5000";
export const COLLECTION_POINT_ENDPOINT = `${API_URL}/collection-point`;
export const NOTIFICATION_ENDPOINT = `${API_URL}/notifications`;
export const MESSAGE_ENDPOINT = `${API_URL}/messages`;
export const SOCKET_URL = API_URL;

/* Point */
export const POINT_TYPES = [
  { value: "all", label: "Tất cả" },
  { value: "Hữu Cơ", label: "Hữu Cơ" },
  { value: "Vô Cơ", label: "Vô Cơ" },
  { value: "Tái Chế", label: "Tái Chế" },
];

/* Layer */
export const LAYER_NAME = "collectionPoints";
export const LAYER_Z_INDEX = 20000;
export const DEFAULT_STATUS = "pending";

/* Map */
export const GEOSERVER_URL = "http://localhost:8080/geoserver/wms";
export const DEFAULT_CENTER = [109.189, 13.784];
export const DEFAULT_ZOOM = 14;
export const USER_ICON_URL = "https://cdn-icons-png.flaticon.com/512/64/64113.png";
export const USER_ICON_SCALE = 0.03;
export const USER_FEATURE_ID = "userLocation";

/* Pagination */
export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 5;
export const PROJECT_NAME = "Các điểm thu gom rác ở Quy Nhơn";

export const base64DataImg = "";

export default {
  WORKSPACE: "gdt",
  SRSNAME: "EPSG:3857",
  GEO_SERVER_URL: "/geoserver",
};
