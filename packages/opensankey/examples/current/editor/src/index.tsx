import { createRoot } from "react-dom/client";
import { FunctionComponent, useEffect, useState } from "react";
import * as Chakra from "@chakra-ui/react";
import i18n from "i18next";
import { I18nextProvider, initReactI18next, useTranslation } from "react-i18next";
import { Class_ApplicationData } from "open-sankey/dist/types/ApplicationData";
import { Type_JSON } from "open-sankey/dist/types/Utils";
import { SpreadSheet } from "open-sankey/dist/components/spreadsheet/SpreadSheet";
import initial_data from "./example.json";

i18n.use(initReactI18next).init({
  resources: { en: { translation: {} } },
  lng: "en",
  fallbackLng: "en",
  interpolation: { escapeValue: false },
});

const SpreadSheetWrapper: FunctionComponent<{
  app_data: Class_ApplicationData;
}> = ({ app_data }) => {
  if (typeof app_data.createNewMenuConfiguration === "function") {
    app_data.createNewMenuConfiguration();
  }
  return <SpreadSheet app_data={app_data} />;
};

const SpreadSheetWithLayoutSankeyApp: FunctionComponent = () => {
  const { t, i18n: i18n_instance } = useTranslation();

  const [app_data] = useState<Class_ApplicationData>(() => {
    const data = new Class_ApplicationData(false);
    data.t = t;
    data.i18n = i18n_instance;
    return data;
  });

  useEffect(() => {
    app_data.fromJSON(initial_data as unknown as Type_JSON);
  }, [app_data]);

  const fillValues = () => {
    const links = app_data.drawing_area.sankey.links_dict;
    links["Node 0 --> Node 1"].valueCurrent = 20000;
    links["Node 2 --> Node 1"].valueCurrent = 10000;
    links["Node 1 --> Node 3"].valueCurrent = 3000;
    links["Node 1 --> Node 4"].valueCurrent = 15000;
    links["Node 1 --> Node 5"].valueCurrent = 2000;
    links["Revenues --> Node 6"].valueCurrent = 5000;
    links["Revenues --> Node 7"].valueCurrent = 22000;
    links["Revenues --> Node 8"].valueCurrent = 5000;
    app_data.menu_configuration.ref_to_spreadsheet.current();
  };

  return (
    <Chakra.Stack>
      <Chakra.Center>
        <Chakra.HStack>
          <Chakra.Button variant="plain" onClick={fillValues}>
            Remplir
          </Chakra.Button>
          <SpreadSheetWrapper app_data={app_data} />
        </Chakra.HStack>
      </Chakra.Center>
      <div id="sankey_app" />
    </Chakra.Stack>
  );
};

const root = createRoot(document.getElementById("root") as HTMLElement);
root.render(
  <Chakra.ChakraProvider>
    <I18nextProvider i18n={i18n}>
      <SpreadSheetWithLayoutSankeyApp />
    </I18nextProvider>
  </Chakra.ChakraProvider>
);
