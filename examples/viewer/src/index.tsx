import { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { ViewerOpenSankeyApp } from "@terriflux/opensankey/src/ViewApp";
import type { Type_AnyJSON } from "@terriflux/opensankey/src/types/Utils";
import business_simple from "./business_simple.json";
import transport_with_views from "./transport_dispatch_with_views.json";

// ============================================================================
// Exemple canonique d'integration du viewer OpenSankey (paquet MIT) dans une
// app React.
// ----------------------------------------------------------------------------
// Ce que l'exemple montre :
//   1. deux diagrammes EMBARQUES, choisis par un selecteur de fichier ;
//   2. un selecteur de vue, alimente par les vues du fichier lui-meme ;
//   3. la liste COMPLETE des options de ViewerOpenSankeyApp (bloc « OPTIONS »
//      plus bas), avec, pour chacune, ce qu'elle fait REELLEMENT dans ce paquet.
//
// Les diagrammes sont embarques (`./*.json`) et non telecharges : ni requete
// reseau, ni CORS, ni attente. Un exemple doit demarrer.
//
// Pour charger un diagramme distant, remplacer l'import par le resultat d'un
// fetch. Deux details du serveur open-sankey.fr valent alors d'etre connus :
// les JSON y sont servis en gzip BRUT (sans en-tete Content-Encoding), donc a
// decompresser soi-meme via DecompressionStream ; et certains modeles portent
// des images en base64 qui les font peser plusieurs Mo — de quoi asphyxier un
// bac a sable en ligne.
// ============================================================================

// ----------------------------------------------------------------------------
// Les diagrammes proposes par le selecteur de fichier. Ce sont deux modeles
// livres avec OpenSankey ; « Transport flows with views » porte plusieurs vues,
// c'est lui qui alimente le selecteur de vue.
// ----------------------------------------------------------------------------
const DIAGRAMS: Array<{ key: string; label: string; json: Type_AnyJSON }> = [
  {
    key: "business_simple",
    label: "Simple business accounting",
    json: business_simple as unknown as Type_AnyJSON,
  },
  {
    key: "transport_with_views",
    label: "Transport flows with views",
    json: transport_with_views as unknown as Type_AnyJSON,
  },
];

// ----------------------------------------------------------------------------
// Vues d'un diagramme : elles sont ecrites en clair dans le fichier, sous la
// cle `views` ({ id : { name, ... } }), et le fichier memorise la vue ouverte
// dans `current_view`. Un hote peut donc construire son propre selecteur sans
// rien demander au viewer — c'est ce que fait la fonction ci-dessous.
// (Un fichier sans vues renvoie une liste vide : le selecteur se desactive.)
// ----------------------------------------------------------------------------
type ViewEntry = { id: string; name: string };

const viewsOf = (json: Type_AnyJSON): ViewEntry[] => {
  const views = json["views"] as { [id: string]: { name?: string } } | undefined;
  if (!views) return [];
  return Object.keys(views).map((id) => ({ id, name: views[id]?.name ?? id }));
};

// Vue affichee a l'ouverture : celle memorisee dans le fichier si elle existe
// encore, sinon la premiere. En mode publie, le viewer ne s'arrete jamais sur
// le sankey maitre d'un fichier a vues : il ouvre la premiere vue.
const defaultViewOf = (json: Type_AnyJSON): string => {
  const views = viewsOf(json);
  if (views.length === 0) return "";
  const saved = json["current_view"] as string | undefined;
  return views.some((v) => v.id === saved) ? (saved as string) : views[0].id;
};

// Changer de vue = rouvrir le fichier sur une autre vue. Le viewer du paquet
// MIT n'expose pas (encore) de commande imperative « aller a la vue X » : on
// lui redonne donc le meme JSON avec `current_view` positionne, et on force un
// remontage via la prop `key`. C'est le cout d'un rechargement complet du
// diagramme — invisible sur ces modeles, a mesurer sur un gros fichier.
// A noter : `data_tag_selection`, `view_tag_selection` et `position_mode` sont,
// eux, REACTIFS (voir le bloc OPTIONS) : ils se changent sans remonter le
// composant, donc sans rechargement.
const withView = (json: Type_AnyJSON, view_id: string): Type_AnyJSON =>
  view_id ? { ...json, current_view: view_id } : json;

const App = () => {
  const [diagram_key, setDiagramKey] = useState(DIAGRAMS[0].key);
  const diagram = DIAGRAMS.find((d) => d.key === diagram_key) ?? DIAGRAMS[0];

  const views = useMemo(() => viewsOf(diagram.json), [diagram]);
  const [view_id, setViewId] = useState(() => defaultViewOf(DIAGRAMS[0].json));

  const onDiagramChange = (key: string) => {
    const next = DIAGRAMS.find((d) => d.key === key) ?? DIAGRAMS[0];
    setDiagramKey(key);
    setViewId(defaultViewOf(next.json));
  };

  const data = useMemo(() => withView(diagram.json, view_id), [diagram, view_id]);

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      <div
        style={{
          display: "flex",
          gap: "1.5rem",
          alignItems: "center",
          padding: "0.5rem 1rem",
          borderBottom: "1px solid #d7d7d7",
          font: "14px system-ui, sans-serif",
        }}
      >
        <label>
          Diagramme{" "}
          <select
            value={diagram_key}
            onChange={(e) => onDiagramChange(e.target.value)}
          >
            {DIAGRAMS.map((d) => (
              <option key={d.key} value={d.key}>
                {d.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          Vue{" "}
          <select
            value={view_id}
            disabled={views.length === 0}
            onChange={(e) => setViewId(e.target.value)}
          >
            {views.length === 0 ? (
              <option value="">(ce diagramme n'a pas de vues)</option>
            ) : (
              views.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))
            )}
          </select>
        </label>
      </div>

      {/* Le conteneur du viewer doit avoir une hauteur reelle : avec
          `embedded`, le diagramme est cadre sur le clientHeight de CE div.
          `minHeight: 0` est indispensable dans un flex, sinon l'enfant refuse
          de descendre sous sa hauteur intrinseque. */}
      <div style={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
        <ViewerOpenSankeyApp
          // Remontage explicite a chaque changement de diagramme ou de vue
          // (cf. `withView` ci-dessus).
          key={`${diagram.key}:${view_id}`}
          initial_data={data}
          // ==================================================================
          // OPTIONS de ViewerOpenSankeyApp (paquet @terriflux/opensankey 1.2.1)
          // ------------------------------------------------------------------
          // Le type complet est `ViewerSankeyOptions`
          // (@terriflux/opensankey/src/types/PublishOptions) ; ce sont les
          // memes cles que les options `window.sankey` d'une page publiee.
          // Toutes sont listees ici, y compris celles qu'on ne passe pas :
          // beaucoup n'ont d'effet que dans le viewer de l'application
          // complete (@terriflux/sankeyapplication), qui embarque la barre du
          // haut, le tiroir de filtres et le pied de page. Le paquet MIT, lui,
          // ne rend AUCUN chrome : juste le diagramme. L'hote fait sa propre
          // interface — comme les deux selecteurs ci-dessus.
          //
          // --- 1. Effectives dans ce paquet ---------------------------------
          embedded={true}
          // embedded (defaut false) : true => le viewer remplit 100 % du
          //   conteneur hote ; false => il se dimensionne sur window.innerHeight.
          //   Dans une page qui n'est pas plein ecran, c'est toujours true.
          topbar={false}
          // topbar (defaut true) : ici, uniquement la hauteur RESERVEE en haut
          //   du dessin (le paquet MIT ne rend pas de barre). Laisse a true, un
          //   bandeau vide est reserve pour rien : le mettre a false des que
          //   l'hote fournit sa propre barre, comme dans cet exemple.
          lock_zoom={false}
          // lock_zoom (defaut false) : true bloque le zoom molette/pincement.
          //   Le pan (bouton du milieu) reste actif.
          editable={false}
          // editable (defaut false) : true reactive les interactions d'edition
          //   malgre le mode publie. A laisser a false pour un viewer.
          // position_mode : 'absolute' | 'proportional' | 'scale_adapted' —
          //   impose le mode de positionnement, a l'ouverture ET a chaud.
          // data_tag_selection : { groupe : etiquette } (id OU nom) — la
          //   selection de donnees a afficher (l'equivalent du selecteur de
          //   data tags). Applique a l'ouverture, puis REACTIF : le changer ne
          //   remonte pas le viewer et ne recharge pas le diagramme.
          // view_tag_selection : { groupe : valeur } — meme mecanique, sur les
          //   etiquettes de vue (filtre de visibilite). Dans le paquet MIT la
          //   valeur est une ETIQUETTE ; la resolution « valeur = nom ou id
          //   d'une VUE » est propre a l'application complete — d'ou le
          //   selecteur de vue par remontage utilise ici.
          // logo : chemin d'un logo substitue a celui d'OpenSankey.
          //
          // --- 2. Lues seulement par l'application complete -----------------
          //     (aucun effet ici : le chrome correspondant n'existe pas)
          // footer (false), toolbar (false), fit_toolbar (false),
          // fullscreen (true), filter_bar (true), recenter (true),
          // edit_button (true), unitary (false), navigation_help (false),
          // badge (true), header, header_i18n, language,
          // data_type (true), data_type_intervals (true), value_filter (true),
          // view_filter (true), level_filter (true), node_filter (true),
          // data_filter (true).
          // doc (false) : demande l'ouverture du panneau documentation ; le
          //   panneau lui-meme est rendu par l'application complete.
          //
          // --- 3. Chargement par URL — sans objet ici -----------------------
          // diagram, diagram_layout, diagram_layout_options, diagrams_list,
          // diagrams_config, sous_filieres (deprecie, alias de diagrams_list) :
          // c'est l'application complete qui telecharge un diagramme et gere le
          // menu multi-diagrammes. Le paquet MIT n'a pas de chargeur : on lui
          // passe un JSON deja lu, via `initial_data`.
          //
          // --- 4. Retiree ---------------------------------------------------
          // tooltip_on_hover : sans effet depuis OS#305. Le declencheur des
          // info-bulles est devenu un attribut de STYLE par element
          // (`tooltip_trigger`), regle par l'auteur du diagramme.
          // ==================================================================
        />
      </div>
    </div>
  );
};

const root = createRoot(document.getElementById("root") as HTMLElement);
root.render(<App />);
