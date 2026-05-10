import { createRoot } from "react-dom/client";
import { ViewerOpenSankeyApp } from "open-sankey/dist/ViewApp";
import { Type_JSON } from "open-sankey/dist/types/Utils";
import initial_data from "./example.json";

const root = createRoot(document.getElementById("root") as HTMLElement);
root.render(<ViewerOpenSankeyApp initial_data={initial_data as Type_JSON} />);
