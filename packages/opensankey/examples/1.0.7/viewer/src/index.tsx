import { createRoot } from "react-dom/client";
import { FunctionComponent, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Class_ApplicationData } from "open-sankey/dist/types/ApplicationData";
import { initial_data } from "./example.js";

export type Type_JSON = {
  [_: string]: boolean | number | string | string[] | Type_JSON;
};

const SankeyViewerWrapper: FunctionComponent<{
  app_data: Class_ApplicationData;
}> = ({ app_data }) => {
  if (typeof app_data.createNewMenuConfiguration === "function") {
    app_data.createNewMenuConfiguration();
  }

  useEffect(() => {
    app_data.draw();
  }, [app_data]);

  return <div id="sankey_app" />;
};

export const ViewerOpenSankeyApp: FunctionComponent<{
  initial_data: Type_JSON;
}> = ({ initial_data }) => {
  const translation = useTranslation("translation", { useSuspense: false });

  const [dataApp] = useState<Class_ApplicationData>(() => {
    const newDataApp = new Class_ApplicationData(true);
    newDataApp.t = translation.t;
    newDataApp.i18n = translation.i18n;
    return newDataApp;
  });

  useEffect(() => {
    dataApp.fromJSON(initial_data);
    (window as any).sankey = { publish: true };
  }, [dataApp]);

  return <SankeyViewerWrapper app_data={dataApp} />;
};

const container = document.getElementById("root") as Element | DocumentFragment;
const root = createRoot(container);

root.render(<ViewerOpenSankeyApp initial_data={initial_data} />);
