import { createRoot } from "react-dom/client";
import { FunctionComponent, useEffect, useState } from "react";
import { Button, ChakraProvider, Center, HStack, Stack } from "@chakra-ui/react";
import { I18nextProvider, useTranslation } from "react-i18next";
import { Class_ApplicationData } from "open-sankey/dist/types/ApplicationData";
import { Type_JSON } from "open-sankey/dist/types/Utils";
import { SpreadSheet } from "open-sankey/dist/components/spreadsheet/SpreadSheet";
import i18n from "./traduction.js";
import initial_data from "./example.json";

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
    <Stack>
      <Center>
        <HStack>
          <Button variant="plain" onClick={fillValues}>
            Remplir
          </Button>
          <SpreadSheetWrapper app_data={app_data} />
        </HStack>
      </Center>
      <div id="sankey_app" />
    </Stack>
  );
};

const root = createRoot(document.getElementById("root") as HTMLElement);
root.render(
  <ChakraProvider>
    <I18nextProvider i18n={i18n}>
      <SpreadSheetWithLayoutSankeyApp />
    </I18nextProvider>
  </ChakraProvider>
);
