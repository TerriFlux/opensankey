import { createRoot } from "react-dom/client";
import { ViewerSankeyApplication } from "@terriflux/sankeyapplication/dist/ViewAppSA";
import { Type_AnyJSON } from "@terriflux/sankeyapplication/dist/deps/OpenSankey+/deps/OpenSankey/types/Utils";
import initial_data from "./example2.json";

// ============================================================================
// ViewerSankeyApplication — toutes les options
// ----------------------------------------------------------------------------
// Les props correspondent 1:1 aux clés de `window.sankey` du mode publish/static.
// Les props ont priorité sur `window.sankey` quand les deux sont définis.
// `publish: true` est toujours forcé par le Viewer.
// ============================================================================

const root = createRoot(document.getElementById("root") as HTMLElement);
root.render(
  <ViewerSankeyApplication
    // ------------------------------------------------------------------------
    // Données
    // ------------------------------------------------------------------------
    initial_data={initial_data as Type_AnyJSON}
    // diagram="diagram.json"                  // URL d'un JSON à charger (alternative à initial_data)
    // diagram_layout="layout.json"            // URL d'un layout à surimprimer
    // diagram_layout_options={["nodes", "links"]}  // options du layout

    // ------------------------------------------------------------------------
    // Mode édition (override du mode publish forcé)
    // ------------------------------------------------------------------------
    // editable={false}                        // true => réactive édition + menus de configuration

    // ------------------------------------------------------------------------
    // Layout / chrome
    // ------------------------------------------------------------------------
    // topbar={true}                           // default true  — afficher la barre supérieure
    // footer={false}                          // default false — afficher le pied de page
    // toolbar={false}                         // default false — afficher la barre d'outils
    // embedded={false}                        // default false — true => hauteur 100% (sinon innerHeight)
    // recenter={true}                         // default true  — auto-recenter à l'ouverture

    // ------------------------------------------------------------------------
    // Branding
    // ------------------------------------------------------------------------
    // logo="logo-socle.png"                   // chemin du logo affiché dans la topbar
    // header="<h1>Mon titre</h1>"             // HTML brut injecté en haut

    // ------------------------------------------------------------------------
    // Filtres dans la topbar
    // ------------------------------------------------------------------------
    // data_type={true}                        // default true  — afficher le filtre type de données
    // data_type_intervals={true}              // default true  — afficher le filtre intervalles
    // value_filter={true}                     // default true  — afficher le filtre valeurs

    // ------------------------------------------------------------------------
    // Multi-diagrammes (dropdown dans la topbar)
    // ----------------------------------------------------------------------------
    // Clé = libellé affiché, valeur = URL relative du JSON (.json.gz chargé automatiquement).
    // Une clé "categorie/nom" active un second dropdown groupé par catégorie.
    // `diagrams_list` remplace l'ancien `sous_filieres` (toujours accepté en alias).
    // ------------------------------------------------------------------------
    // diagrams_list={{
    //   "Energie": "diagram_energie",
    //   "Eau":     "diagram_eau",
    //   "Climat/CO2":  "diagram_co2",
    //   "Climat/CH4":  "diagram_ch4",
    // }}

    // ------------------------------------------------------------------------
    // Configs par diagramme (clé = même libellé que dans diagrams_list)
    // ----------------------------------------------------------------------------
    // Appliquées au moment du changement de diagramme via le dropdown.
    // Clés supportées actuellement :
    //   - data_type : boolean — surcharge l'option data_type pour ce diagramme
    // (Toute autre clé est conservée dans window.sankey[<nom>] mais n'a pas d'effet runtime.)
    // ------------------------------------------------------------------------
    // diagrams_config={{
    //   "Energie": { data_type: true },
    //   "Eau":     { data_type: false },
    // }}
  />
);
