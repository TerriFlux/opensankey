import { createRoot } from "react-dom/client";
import { FunctionComponent, useEffect, useState } from "react";
import { ChakraProvider } from "@chakra-ui/react";
import i18n from "i18next";
import { I18nextProvider, initReactI18next, useTranslation } from "react-i18next";
import { Class_ApplicationData } from "open-sankey/dist/types/ApplicationData";
import initial_data from "./example.json";

i18n.use(initReactI18next).init({
  resources: { en: { translation: {} } },
  lng: "en",
  fallbackLng: "en",
  interpolation: { escapeValue: false },
});

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

const ViewerOpenSankeyApp: FunctionComponent = () => {
  const { t, i18n: i18n_instance } = useTranslation();

  const [app_data] = useState<Class_ApplicationData>(() => {
    (window as any).sankey = { publish: true };
    const data = new Class_ApplicationData(true);
    data.t = t;
    data.i18n = i18n_instance;
    return data;
  });

  useEffect(() => {
    app_data.fromJSON(initial_data as any);
  }, [app_data]);

  return <SankeyViewerWrapper app_data={app_data} />;
};

const root = createRoot(document.getElementById("root") as HTMLElement);
root.render(
  <ChakraProvider>
    <I18nextProvider i18n={i18n}>
      <ViewerOpenSankeyApp />
    </I18nextProvider>
  </ChakraProvider>
);
