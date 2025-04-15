import { FeatureCollection, Geometry, MultiPolygon, Feature, Point } from "geojson";
import { Feature as OlFeature } from "ol";
import Filter from "ol/format/filter/Filter";
import WFS, {
  FeatureType,
  WriteGetFeatureOptions,
  WriteTransactionOptions,
} from "ol/format/WFS";
import { useCallback, useState } from "react";
import axios from "axios";

const GIS_URL = "http://localhost:8080/geoserver";

export const gisAxios = axios.create({
  // baseURL: GEO_SERVER_URL,
  baseURL: GIS_URL,
});
const WORKSPACE = "gdt";
const SRSNAME = "EPSG:3857";
// if (usernameGis && passwordGis) {
//   instanceAxios.defaults.auth = {
//     username: varConfig.usernameGis,
//     password: varConfig.passwordGis,
//   };
// }

export type WFSVendorParameters = {
  cql_filter?: string;
  srsName?: string;
  strict?: string;
  namespace?: string;
  featureid?: string;
  propertyName?: string;
  request: "GetFeature";
  version: "1.1.0";
  typeName: string;
  outputFormat: "json" | "text/xml";
  service?: "wfs" | "wms";
  maxFeatures?: string;
  filter?: string;
  resultType?: string;
};

enum TransactionActions {
  insert,
  update,
  delete,
}
const options = {
  srsName: SRSNAME,
  featureNS: GIS_URL,
  featurePrefix: WORKSPACE,
};

export const gisProvider = {
  count: async (params?: {
    filter?: string;
    alias?: string;
    featureType?: string;
  }) => {
    const parameters: WFSVendorParameters = {
      request: "GetFeature",
      version: "1.1.0",
      service: "wfs",
      typeName: `${WORKSPACE}:${params?.featureType}`,
      outputFormat: "json",
      resultType: "hits",
    };
    if (params?.filter) {
      parameters.cql_filter = params.filter;
    }
    const searchParams = new URLSearchParams(parameters).toString();
    const { data } = await gisAxios.get<string>(`/wfs?${searchParams}`, {
      headers: { "Content-Type": "text/xml" },
    });
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(data, "text/xml");

    const featureCollection = xmlDoc.getElementsByTagName(
      "wfs:FeatureCollection"
    )[0];
    const numberOfFeatures = featureCollection.getAttribute("numberOfFeatures");
    return params?.alias
      ? { [params.alias]: numberOfFeatures }
      : numberOfFeatures;
  },
};

const useWriteTransaction = <
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  T extends Record<string, any>,
  P extends Geometry = Point
>(
  featureType: string
) => {
  const [formatWfs] = useState(new WFS());
  const { count } = gisProvider;
  const getFeatures = useCallback(
    async (
      params: {
        filter?: Filter;
        paginationOptions?: { featurePerPage: number; featureOffset: number };
        featureTypes?: (string | FeatureType)[];
        propertyNames?: Array<string>;
        viewParams?: string;
      } = {}
    ) => {
      try {
        const {
          filter,
          paginationOptions,
          featureTypes,
          propertyNames,
          viewParams,
        } = params;
        const writeGetFeatureOptions: WriteGetFeatureOptions = {
          ...options,
          featureTypes: [featureType],
          outputFormat: "application/json",
        };
        if (propertyNames) {
          writeGetFeatureOptions.propertyNames = propertyNames;
        }
        if (filter) {
          writeGetFeatureOptions.filter = filter;
        }
        if (viewParams) {
          writeGetFeatureOptions.viewParams = viewParams;
        }
        if (paginationOptions) {
          const { featurePerPage, featureOffset } = paginationOptions;
          writeGetFeatureOptions.maxFeatures = featurePerPage;
          writeGetFeatureOptions.startIndex = featureOffset;
        }
        if (featureTypes) {
          writeGetFeatureOptions.featureTypes.push(...featureTypes);
        }
        const featureRequest = formatWfs.writeGetFeature(
          writeGetFeatureOptions
        );

        const { data } = await gisAxios.post<FeatureCollection<P, T>>(
          "/wfs",
          new XMLSerializer().serializeToString(featureRequest),
          { headers: { "Content-Type": "text/xml" } }
        );
        return data;
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        throw Error("Đã xảy ra lỗi!");
      }
    },
    [featureType, formatWfs]
  );

  const getFeature = useCallback(
    async (
      fid: string,
      cql_filter?: { propertyName: string; litertal: string }
    ): Promise<Feature<MultiPolygon, T>> => {
      const parameters: WFSVendorParameters = {
        request: "GetFeature",
        version: "1.1.0",
        service: "wfs",
        typeName: `${WORKSPACE}:${featureType}`,
        outputFormat: "json",
        maxFeatures: "500",
        featureid: fid,
      };
      if (cql_filter) {
        parameters.filter = `(<Filter xmlns="http://www.opengis.net/ogc"><And><FeatureId fid="${fid}"/><PropertyIsEqualTo><PropertyName>${cql_filter.propertyName}</PropertyName><Literal>${cql_filter.litertal}</Literal></PropertyIsEqualTo></And></Filter>)`;
        delete parameters.featureid;
      }
      const search = new URLSearchParams(parameters).toString();
      const { data } = await gisAxios.get<FeatureCollection<MultiPolygon, T>>(
        `/wfs?${search}`,
        {
          headers: { "Content-Type": "text/xml" },
        }
      );
      const [feature] = data.features;
      return feature;
    },
    [featureType]
  );

  const writeTransaction = useCallback(
    async (features: Array<OlFeature>, type: TransactionActions) => {
      try {
        let featureRequest;
        const writeTransactionOptions: WriteTransactionOptions = {
          ...options,
          featureType: `${WORKSPACE}:${featureType}`,
          nativeElements: [],
          version: "1.1.0",
          gmlOptions: {
            featureNS: GIS_URL,
            featureType: `${WORKSPACE}:${featureType}`,
            srsName: SRSNAME,
          },
        };
        switch (type) {
          case TransactionActions.insert:
            featureRequest = formatWfs.writeTransaction(
              features,
              [],
              [],
              writeTransactionOptions
            );
            break;
          case TransactionActions.update:
            featureRequest = formatWfs.writeTransaction(
              [],
              features,
              [],
              writeTransactionOptions
            );
            break;
          case TransactionActions.delete:
            featureRequest = formatWfs.writeTransaction(
              [],
              [],
              features,
              writeTransactionOptions
            );
            break;
        }
        const xs = new XMLSerializer();
        const payload = xs.serializeToString(featureRequest);
        const { data } = await gisAxios.post<string>("/wfs", payload, {
          headers: { "Content-Type": "text/xml" },
        });
        return data;
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        throw Error("Error! An error occurred. Please try again later");
      }
    },
    [featureType, formatWfs]
  );

  const addFeatures = useCallback(
    async (features: Array<OlFeature>) => {
      const result = await writeTransaction(
        features,
        TransactionActions.insert
      );
      return result;
      // const jsonStringfy = xml2json(result, { compact: true });
      // const obj = JSON.parse(jsonStringfy);
      // let feature: Array<any> | Object = obj["wfs:TransactionResponse"]["wfs:InsertResults"]["wfs:Feature"];
      // const fts: Array<any> = feature instanceof Array ? feature : [feature];
      // return fts.map((ft: any) => ({
      //   fid: ft["ogc:FeatureId"]["_attributes"]["fid"],
      // }));
    },
    [writeTransaction]
  );

  const updateFeatures = useCallback(
    (features: Array<OlFeature>) => {
      return writeTransaction(features, TransactionActions.update);
    },
    [writeTransaction]
  );

  const deleteFeatures = useCallback(
    (features: Array<OlFeature>) => {
      return writeTransaction(features, TransactionActions.delete);
    },
    [writeTransaction]
  );

  const countFeature = useCallback(
    (filter?: string) => count({ featureType, filter }),
    [count, featureType]
  );

  return {
    getFeature,
    getFeatures,
    addFeatures,
    updateFeatures,
    deleteFeatures,
    countFeature,
  };
};

export default useWriteTransaction;
