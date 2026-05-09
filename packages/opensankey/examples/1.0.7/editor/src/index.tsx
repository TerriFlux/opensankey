import { FunctionComponent, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { createRoot } from "react-dom/client";
import { SpreadSheet } from "open-sankey/dist/components/spreadsheet/SpreadSheet";
import { Button, Stack, HStack, Center } from "@chakra-ui/react";
import { Class_ApplicationData } from "open-sankey/dist/types/ApplicationData";
import { initial_data } from "./example.js";

const SpreadSheetWrapper: FunctionComponent<{
  app_data: Class_ApplicationData;
}> = ({ app_data }) => {
  // Appeler createNewMenuConfiguration au niveau de ce composant
  if (typeof app_data.createNewMenuConfiguration === "function") {
    app_data.createNewMenuConfiguration();
  }

  return <SpreadSheet app_data={app_data} />;
};

/*************************************************************************************************/
/**
 * Define type properties for Sankey JSON Saving format
 * @type Type_JSON
 */
type Type_JSON = {
  [_: string]: boolean | number | string | string[] | Type_JSON;
};

const SpreadSheetWithLayoutSankeyApp: FunctionComponent<{
  initial_layout: Type_JSON;
}> = ({ initial_layout }) => {
  const translation = useTranslation("translation", { useSuspense: false });
  // Initialiser dataApp directement avec une fonction
  const [dataApp, setDataApp] = useState<Class_ApplicationData>(() => {
    const newDataApp = new Class_ApplicationData(false);
    newDataApp.t = translation.t;
    newDataApp.i18n = translation.i18n;
    return newDataApp;
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    dataApp.fromJSON(initial_layout);
    dataApp.sendWaitingToast(() => setIsLoading(false));
  }, []);

  return (
    <Stack>
      <Center>
        <HStack>
          <Button
            variant="plain"
            onClick={() => {
              dataApp.drawing_area.sankey.links_dict[
                "Node 0 --> Node 1"
              ].valueCurrent = 20000;
              dataApp.drawing_area.sankey.links_dict[
                "Node 2 --> Node 1"
              ].valueCurrent = 10000;
              dataApp.drawing_area.sankey.links_dict[
                "Node 1 --> Node 3"
              ].valueCurrent = 3000;
              dataApp.drawing_area.sankey.links_dict[
                "Node 1 --> Node 4"
              ].valueCurrent = 15000;
              dataApp.drawing_area.sankey.links_dict[
                "Node 1 --> Node 5"
              ].valueCurrent = 2000;
              dataApp.drawing_area.sankey.links_dict[
                "Revenues --> Node 6"
              ].valueCurrent = 5000;
              dataApp.drawing_area.sankey.links_dict[
                "Revenues --> Node 7"
              ].valueCurrent = 22000;
              dataApp.drawing_area.sankey.links_dict[
                "Revenues --> Node 8"
              ].valueCurrent = 5000;
              dataApp.menu_configuration.ref_to_spreadsheet.current();
            }}
          >
            Remplir
          </Button>
          <SpreadSheetWrapper app_data={dataApp} />
        </HStack>
      </Center>
      <div id="sankey_app" />
    </Stack>
  );
};

const container = document.getElementById("root") as Element | DocumentFragment;
const root = createRoot(container);

root.render(<SpreadSheetWithLayoutSankeyApp initial_layout={initial_data} />);
