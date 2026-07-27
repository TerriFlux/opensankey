import { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { ViewerOpenSankeyApp } from "@terriflux/opensankey/src/ViewApp";
import type { Type_AnyJSON } from "@terriflux/opensankey/src/types/Utils";

// ============================================================================
// Exemple canonique d'integration du viewer OpenSankey dans une app React.
// Modele : l'application reelle cartofob-sankey/viewer (consommateur du paquet
// npm @terriflux publie sur le registre GitLab du groupe su-model).
// ----------------------------------------------------------------------------
// - Le diagramme est un JSON d'exemple de SankeyData, servi publiquement par
//   open-sankey.fr (route `/opensankey/menus/templates_asset/...`, CORS `*`).
//   Le serveur repond en gzip brut (sans Content-Encoding) : on sniffe le
//   magic gzip et on decompresse via DecompressionStream (natif navigateur).
// - Multi-vues : ce diagramme embarque plusieurs VUES (cle `views` du JSON,
//   chaque vue est un JSON autonome). La topbar custom propose un selecteur ;
//   chaque selection remonte un <ViewerOpenSankeyApp key=...> neuf avec le
//   JSON de la vue en `initial_data` (fromJSON + draw au montage).
// - Les autres props (topbar, footer, lock_zoom, ...) correspondent 1:1 aux
//   options `window.sankey` du mode publish (cf. types/PublishOptions).
// ============================================================================

const DIAGRAM_URL =
  "https://open-sankey.fr/opensankey/menus/templates_asset/templates/web/data/Energie.json";

type ViewOption = { id: string; name: string; json: Type_AnyJSON };

/** Charge un JSON, en le decompressant a la volee s'il est servi en gzip brut
 *  (magic bytes 1f 8b, pas de Content-Encoding). */
async function fetchDiagram(url: string): Promise<Type_AnyJSON> {
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`HTTP ${resp.status} sur ${url}`);
  const buf = await resp.arrayBuffer();
  const bytes = new Uint8Array(buf);
  if (bytes.length > 2 && bytes[0] === 0x1f && bytes[1] === 0x8b) {
    const stream = new Blob([buf])
      .stream()
      .pipeThrough(new DecompressionStream("gzip"));
    return JSON.parse(await new Response(stream).text());
  }
  return JSON.parse(new TextDecoder().decode(buf));
}

/** Le diagramme principal + chacune de ses vues, comme options du selecteur.
 *  Chaque vue de `views` est un JSON OpenSankey autonome (avec sa `version`). */
function diagramToOptions(d: Type_AnyJSON): ViewOption[] {
  const opts: ViewOption[] = [];
  const root_nodes = Object.keys((d as { nodes?: object })?.nodes ?? {}).length;
  if (root_nodes > 0) opts.push({ id: "root", name: "Principal", json: d });
  const views = (d as { views?: Record<string, Type_AnyJSON> })?.views ?? {};
  for (const [id, v] of Object.entries(views)) {
    const name = (v as { name?: string })?.name || id;
    opts.push({ id, name, json: v });
  }
  if (opts.length === 0) opts.push({ id: "root", name: "Principal", json: d });
  return opts;
}

function App() {
  const [options, setOptions] = useState<ViewOption[]>([]);
  const [selected_id, setSelectedId] = useState<string>("");
  const [error, setError] = useState<string>("");

  useEffect(() => {
    fetchDiagram(DIAGRAM_URL)
      .then((d) => {
        const opts = diagramToOptions(d);
        setOptions(opts);
        // Vue par defaut : la premiere qui contient des noeuds.
        const first_with_nodes = opts.find(
          (o) => Object.keys((o.json as { nodes?: object })?.nodes ?? {}).length > 0
        );
        setSelectedId((first_with_nodes ?? opts[0]).id);
      })
      .catch((e) => setError(String(e)));
  }, []);

  const selected = useMemo(
    () => options.find((o) => o.id === selected_id),
    [options, selected_id]
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", width: "100vw", overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "20px", padding: "5px 10px", background: "#f5f5f5", borderBottom: "1px solid #ddd", flex: "0 0 auto", fontFamily: "sans-serif" }}>
        <strong style={{ fontSize: "13px" }}>OpenSankey viewer — exemple React</strong>
        <label style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "6px" }}>
          <span style={{ fontSize: "10px", fontWeight: 600, color: "#444", textTransform: "uppercase", letterSpacing: "0.03em" }}>Vue</span>
          <select
            style={{ minWidth: "180px", padding: "2px 4px", fontSize: "12px", border: "1px solid #bbb", borderRadius: "3px", background: "#fff" }}
            value={selected_id}
            onChange={(e) => setSelectedId(e.target.value)}
          >
            {options.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
        </label>
        {error !== "" && <span style={{ color: "#b00", fontSize: "12px" }}>{error}</span>}
      </div>

      <div style={{ flex: "1 1 auto", minHeight: 0, position: "relative" }}>
        {selected && (
          <ViewerOpenSankeyApp
            // `key` force un remontage complet par vue : chaque montage recree
            // l'application, applique les options viewer puis fromJSON + draw.
            key={selected.id}
            // ----------------------------------------------------------------
            // Donnees : le JSON de la vue selectionnee, deja telecharge.
            // ----------------------------------------------------------------
            initial_data={selected.json}
            // ----------------------------------------------------------------
            // Layout / chrome : topbar custom au-dessus, viewer nu en dessous.
            // ----------------------------------------------------------------
            embedded={true}       // hauteur 100 % du conteneur (sous notre topbar)
            topbar={false}        // barre superieure du viewer
            filter_bar={false}    // drawer de filtres a gauche
            footer={true}
            edit_button={false}   // masque "Editer dans OpenSankey"
            // ----------------------------------------------------------------
            // Interaction
            // ----------------------------------------------------------------
            tooltip_on_hover={true} // tooltips au survol, sans maintenir Shift
          />
        )}
      </div>
    </div>
  );
}

const root = createRoot(document.getElementById("root") as HTMLElement);
root.render(<App />);
