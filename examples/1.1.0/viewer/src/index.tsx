import { createRoot } from "react-dom/client";
import { FunctionComponent, useEffect, useState } from "react";
import * as Chakra from "@chakra-ui/react";
import i18n from "i18next";
import { I18nextProvider, initReactI18next, useTranslation } from "react-i18next";
import { Class_ApplicationData } from "open-sankey/dist/types/ApplicationData";
import { Type_JSON } from "open-sankey/dist/types/Utils";
import initial_data from "./example.json";

i18n.use(initReactI18next).init({
  resources: { en: { translation: {} } },
  lng: "en",
  fallbackLng: "en",
  interpolation: { escapeValue: false },
});

const ViewerOpenSankeyApp: FunctionComponent = () => {
  const { t, i18n: i18n_instance } = useTranslation();

  const [app_data] = useState<Class_ApplicationData>(() => {
    window.sankey = { publish: true };
    const data = new Class_ApplicationData(true);
    data.t = t;
    data.i18n = i18n_instance;
    return data;
  });

  useEffect(() => {
    app_data.createNewMenuConfiguration();
    app_data.fromJSON(initial_data as unknown as Type_JSON);
  }, [app_data]);

  return <div id="sankey_app" />;
};

const root = createRoot(document.getElementById("root") as HTMLElement);
root.render(
  <Chakra.ChakraProvider>
    <I18nextProvider i18n={i18n}>
      <ViewerOpenSankeyApp />
    </I18nextProvider>
  </Chakra.ChakraProvider>
);
