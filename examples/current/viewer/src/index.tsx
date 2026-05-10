import { createRoot } from "react-dom/client";
import { ViewerSankeyApplication } from "@terriflux/sankeyapplication/dist/ViewAppSA";
import { Type_JSON } from "@terriflux/sankeyapplication/dist/deps/OpenSankey+/deps/OpenSankey/types/Utils";
import initial_data from "./example.json";

const root = createRoot(document.getElementById("root") as HTMLElement);
root.render(<ViewerSankeyApplication initial_data={initial_data as Type_JSON} />);
