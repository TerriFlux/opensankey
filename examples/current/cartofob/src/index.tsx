import { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { ViewerSankeyApplication } from "@terriflux/sankeyapplication/dist/ViewAppSA";
//import { Type_AnyJSON } from "@terriflux/sankeyapplication/dist/deps/OpenSankey+/deps/OpenSankey/types/Utils";
//import initial_data from "./example3.json";

// ============================================================================
// Viewer CARTOFOB — topbar personnalisée avec 2 sélecteurs
// ----------------------------------------------------------------------------
// - Région  => data tag "region"  (data_tag_selection). On AFFICHE le long_name
//              (ex. "Auvergne-Rhône-Alpes") et on PASSE le code (ex. "84").
// - Essence => sélecteur de VUES (view_tag_selection). Chaque option est une VUE
//              du diagramme (comme le sélecteur de vue de la topbar OS+) :
//                * le maître « Agrégées » (toutes essences, sans filtre),
//                * les vues light générées par essence (Feuillus, Chêne, …),
//                * les vues heavy (géométrie propre, ex. « Toutes essences »).
//              On PASSE l'id de la vue ; view_tag_selection sait ouvrir n'importe
//              quelle vue (light OU heavy) exactement comme le sélecteur de vue.
//
// Les listes des sélecteurs sont lues DYNAMIQUEMENT depuis CARTOFOB.json
// (dataTags.region / views) : elles restent synchronisées avec la donnée.
//
// data_tag_selection / view_tag_selection sont ré-appliqués RÉACTIVEMENT par le
// viewer quand les props changent (in-place, chemin léger des sélecteurs natifs) :
// PAS de remount, donc pas de rechargement/re-parse du diagramme à chaque
// sélection. On garde donc la MÊME instance du viewer.
// ============================================================================

const DIAGRAM = "CARTOFOB.json.gz"; // JSON sankey autonome gzippe (layout + valeurs, cf. scripts/build_cartofob_json.py)
const DEFAULT_REGION = "84"; // Auvergne-Rhône-Alpes
const ESSENCE_GROUP = "essence"; // groupe de view tag (hypothèse : un seul groupe)
const MASTER_VIEW_ID = "sankey_maitre"; // vue maître = « Agrégées »
const DEFAULT_VIEW = MASTER_VIEW_ID; // ouverture sur le maître (toutes essences agrégées)

type Option = { value: string; label: string };

/** Charge un JSON, en décompressant à la volée si l'URL est un .gz.
 *  Le viewer décompresse déjà le diagram .gz de son côté ; ici on lit le même
 *  fichier juste pour en extraire les listes des sélecteurs, d'où cette reprise.
 *  DecompressionStream('gzip') est natif dans les navigateurs modernes. */
async function fetchJson(url: string): Promise<any> {
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`HTTP ${resp.status} sur ${url}`);
  if (url.endsWith(".gz")) {
    const stream = resp.body!.pipeThrough(new DecompressionStream("gzip"));
    return JSON.parse(await new Response(stream).text());
  }
  return resp.json();
}

/** Lit un groupe de data tags ({name, long_name, tags_order, tags}) et en fait
 *  une liste d'options ordonnée. `labelKey` = quel champ afficher. */
function tagsToOptions(
  group: any,
  labelKey: "name" | "long_name"
): Option[] {
  if (!group?.tags) return [];
  const order: string[] = group.tags_order ?? Object.keys(group.tags);
  return order
    .filter((k) => group.tags[k])
    .map((k) => {
      const t = group.tags[k];
      return { value: k, label: t[labelKey] || t.name || k };
    });
}

/** Liste les VUES du diagramme comme le sélecteur de vue : maître « Agrégées »
 *  en tête, puis toutes les vues (light + heavy) dans l'ordre du fichier.
 *  value = id de vue (ce qu'on passe à view_tag_selection), label = nom de vue. */
function viewsToOptions(d: any): Option[] {
  const opts: Option[] = [
    { value: MASTER_VIEW_ID, label: d?.master_view_name || "Agrégées" },
  ];
  const views = d?.views;
  if (views && typeof views === "object") {
    for (const [id, v] of Object.entries<any>(views)) {
      if (id === MASTER_VIEW_ID || !v?.name) continue;
      opts.push({ value: id, label: v.name as string });
    }
  }
  return opts;
}

function App() {
  const [regions, setRegions] = useState<Option[]>([]);
  const [views, setViews] = useState<Option[]>([]);
  const [region, setRegion] = useState(DEFAULT_REGION);
  const [view, setView] = useState(DEFAULT_VIEW);

  // Charge les listes des sélecteurs depuis le diagramme (une seule fois).
  useEffect(() => {
    // URL relative : le viewer fetch DIAGRAM de la même façon depuis /public.
    fetchJson(DIAGRAM)
      .then((d) => {
        setRegions(tagsToOptions(d?.dataTags?.region, "long_name"));
        setViews(viewsToOptions(d));
      })
      .catch((e) => console.warn(`Lecture des listes de ${DIAGRAM} impossible :`, e));
  }, []);

  // Sélection de vue via view_tag_selection : la valeur est un id de vue (light ou
  // heavy) résolu et ouvert comme le sélecteur de vue (setCurrentView).
  const viewTagSelection = useMemo(
    () => ({ [ESSENCE_GROUP]: view }),
    [view]
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", width: "100vw", overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "20px", padding: "5px 10px", background: "#f5f5f5", borderBottom: "1px solid #ddd", flex: "0 0 auto", fontFamily: "sans-serif" }}>
        <label style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "6px" }}>
          <span style={{ fontSize: "10px", fontWeight: 600, color: "#444", textTransform: "uppercase", letterSpacing: "0.03em" }}>Région</span>
          <select
            style={{ minWidth: "150px", padding: "2px 4px", fontSize: "12px", border: "1px solid #bbb", borderRadius: "3px", background: "#fff" }}
            value={region}
            onChange={(e) => setRegion(e.target.value)}
          >
            {regions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>

        <label style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "6px" }}>
          <span style={{ fontSize: "10px", fontWeight: 600, color: "#444", textTransform: "uppercase", letterSpacing: "0.03em" }}>Essence</span>
          <select
            style={{ minWidth: "150px", padding: "2px 4px", fontSize: "12px", border: "1px solid #bbb", borderRadius: "3px", background: "#fff" }}
            value={view}
            onChange={(e) => setView(e.target.value)}
          >
            {views.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div style={{ flex: "1 1 auto", minHeight: 0, position: "relative" }}>
        <ViewerSankeyApplication
          // Pas de `key` : le viewer ré-applique data_tag_selection / view_tag_selection
          // à chaque changement de prop, sans remonter ni recharger le diagramme.
          // --------------------------------------------------------------------
          // Données
          // --------------------------------------------------------------------
          //initial_data={initial_data as Type_AnyJSON}
          diagram={DIAGRAM}
          edit_button={false} // masque "Editer dans OpenSankey"
          editable={false} // true => réactive édition + menus de configuration
          // --------------------------------------------------------------------
          // Layout / chrome
          // --------------------------------------------------------------------
          embedded={true} // hauteur 100% du conteneur (sous notre topbar)
          topbar={false} // barre supérieure du viewer
          filter_bar={false}
          footer={true}
          toolbar={false}
          fit_toolbar={false}
          // --------------------------------------------------------------------
          // Branding
          // --------------------------------------------------------------------
          logo=""
          header="<h1>Cartographie des flux de la filière forêt bois</h1>"
          // --------------------------------------------------------------------
          // État initial
          // --------------------------------------------------------------------
          position_mode="scale_adapted"
          // Région (data tag) : { groupe : code }, ex. { region: "84" }
          data_tag_selection={{ region }}
          // Essence : { groupe : id de vue } — ouvre la vue (light OU heavy) comme
          // le sélecteur de vue. Le maître "sankey_maitre" = toutes essences agrégées.
          view_tag_selection={viewTagSelection}
          // --------------------------------------------------------------------
          // Interaction
          // --------------------------------------------------------------------
          lock_zoom={true} // bloque le zoom molette/scale (le pan au bouton milieu reste possible)
          tooltip_on_hover={true} // tooltips au simple survol, sans maintenir Shift
          // --------------------------------------------------------------------
          // Filtres dans la topbar du viewer
          // --------------------------------------------------------------------
          data_type={false}
          value_filter={false}
        />
      </div>
    </div>
  );
}

const root = createRoot(document.getElementById("root") as HTMLElement);
root.render(<App />);
