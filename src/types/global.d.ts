import { Point } from "./points";

declare global {
  interface Window {
    openDetailPopup?: (point: Point) => void;
  }
} 