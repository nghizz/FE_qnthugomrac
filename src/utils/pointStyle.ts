import { Style, Circle as CircleStyle, Fill, Stroke } from "ol/style";

export function getPointStyle(status: string): Style {
  const colorMap: Record<string, string> = {
    approved: "green",
    pending: "orange",
    rejected: "red",
  };

  const color = colorMap[status] || "#666"; // fallback màu xám nếu không hợp lệ

  return new Style({
    image: new CircleStyle({
      radius: 4,
      fill: new Fill({ color }),
      stroke: new Stroke({ color: "#000", width: 1.5 }),
    }),
  });
}