import { createContext, useContext, ReactNode } from "react";
import { Map } from "ol";

export type MapContextType = {
  map: Map | null;
};

// eslint-disable-next-line react-refresh/only-export-components
export const MapContext = createContext<MapContextType | undefined>(undefined);

interface MapProviderProps {
  children: ReactNode;
  value: MapContextType;
}

// Explicitly export MapProvider component
const MapProvider: React.FC<MapProviderProps> = ({ children, value }) => {
  return (
    <MapContext.Provider value={value}>
      {children}
    </MapContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useMapContext = () => {
  const context = useContext(MapContext);
  if (!context)
    throw new Error("useMapContext must be used within a MapProvider");
  return context;
};

export { MapProvider };

export default MapContext;
