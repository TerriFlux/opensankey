import { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
// Import a EFFET DE BORD : ce module initialise i18next et enregistre les
// traductions du viewer. Le point d'entree du paquet, lui, n'exporte rien et ne
// fait rien (c'est ecrit dans son index.d.ts) — sans cette ligne, i18next n'a
// aucune ressource et `t('cle')` renvoie la CLE. Ca se voyait dans la legende :
// « scale : 0.149 Mm3/an » au lieu de « Echelle : 0.149 Mm3/an ».
import "@terriflux/opensankey/src/traductions/traduction";
import { ViewerOpenSankeyApp } from "@terriflux/opensankey/src/ViewApp";
import type { Type_AnyJSON } from "@terriflux/opensankey/src/types/Utils";

// ============================================================================
// CARTOFOB — un diagramme reel, charge par URL, pilote par deux selecteurs.
// ----------------------------------------------------------------------------
// L'exemple complementaire de `examples/viewer` : la ou celui-ci embarque des
// petits modeles dans le bundle, celui-ci fait ce que fait une vraie
// application — il TELECHARGE son diagramme, et il est gros (7,7 Mo de JSON,
// 194 noeuds, 1608 flux, 646 Ko une fois gzippe).
//
// Il reprend la structure de l'application cartofob-sankey (cartographie des
// flux de la filiere foret-bois, TerriFlux pour l'IGN), a ceci pres qu'elle
// utilise le paquet complet SankeyApplication la ou cet exemple n'utilise que
// le viewer MIT.
//
// Trois choses a en retenir :
//
//   1. LE .gz EST SERVI BRUT. Le fichier est dans `public/`, donc servi tel
//      quel, SANS en-tete `Content-Encoding: gzip` — c'est aussi la regle sur
//      open-sankey.fr. C'est a l'hote de le decompresser (`DecompressionStream`
//      ci-dessous). Si le serveur declarait l'en-tete, le navigateur
//      decompresserait de son cote et on lirait du JSON en clair : la
//      decompression exploserait sur « incorrect header check ».
//
//   2. LE PAQUET MIT N'A PAS DE CHARGEUR. `ViewerOpenSankeyApp` prend un JSON
//      deja lu (`initial_data`) ; les options `diagram` / `diagrams_list` ne
//      sont honorees que par l'application complete. On fait donc le fetch
//      soi-meme — et on en profite : le meme JSON alimente les selecteurs.
//
//   3. LES SELECTEURS NE REMONTENT PAS LE VIEWER. `data_tag_selection` et
//      `view_tag_selection` sont REACTIFS : le viewer les re-applique en place
//      quand les props changent. Sur un diagramme de cette taille, la
//      difference avec un remontage (prop `key`) se compte en secondes.
// ============================================================================

// Chemin RELATIF : le fichier est servi a cote de la page, en dev comme dans le
// build (`homepage: "."`). Pour pointer un fichier distant, mettre ici une URL
// absolue — le serveur doit alors autoriser le CORS (open-sankey.fr renvoie
// `Access-Control-Allow-Origin: *` sur ses modeles).
const DIAGRAM_URL = "CARTOFOB.json.gz";

// Groupes du fichier. « region » est un groupe de DATA tags (il choisit quelle
// serie de valeurs est affichee) ; « essence » est un groupe d'etiquettes de
// VUE (il choisit ce qui est visible).
const REGION_GROUP = "region";
const ESSENCE_GROUP = "essence";

const DEFAULT_REGION = "84"; // Auvergne-Rhone-Alpes

// Mot-cle reconnu par le viewer : eteint le filtre du groupe, donc toutes les
// essences redeviennent visibles — l'equivalent de la vue agregee. (« none » et
// « * » font la meme chose.)
const ALL_ESSENCES = "all";

// Prefixe des choix qui designent une VUE et non une etiquette. Les deux ne se
// pilotent pas par la meme prop : `view_tag_selection` FILTRE la vue courante par
// une etiquette, `view` OUVRE une vue nommee (sa#397). Confondre les deux revient
// a afficher une vue en croyant en afficher une autre.
const VUE_PREFIX = "vue:";

// Identifiant de la vue maitre dans le format de fichier.
const VUE_MAITRE = "sankey_maitre";

type Option = { value: string; label: string };

/**
 * Telecharge un JSON, en le decompressant si l'URL finit par `.gz`.
 * `DecompressionStream('gzip')` est natif (Chrome 80+, Safari 16.4+,
 * Firefox 113+) : aucune dependance a ajouter pour lire un diagramme gzippe.
 */
async function fetchJson(url: string): Promise<Type_AnyJSON> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status} sur ${url}`);
  if (!url.endsWith(".gz")) return response.json();
  const stream = response.body!.pipeThrough(new DecompressionStream("gzip"));
  return JSON.parse(await new Response(stream).text());
}

/**
 * Transforme un groupe d'etiquettes du fichier ({ name, tags_order, tags })
 * en liste d'options ordonnee. Les listes sont donc TOUJOURS synchrones avec
 * la donnee : ajouter une region au diagramme suffit a la voir apparaitre.
 *
 * `label_key` dit quel champ afficher. Les regions portent leur code en `name`
 * (« 84 ») et leur intitule en `long_name` (« Auvergne-Rhone-Alpes ») : on
 * AFFICHE le long_name et on PASSE la cle au viewer.
 */
function tagsToOptions(group: any, label_key: "name" | "long_name"): Option[] {
  if (!group?.tags) return [];
  const order: string[] = group.tags_order ?? Object.keys(group.tags);
  return order
    .filter((key) => group.tags[key])
    .map((key) => {
      const tag = group.tags[key];
      return { value: key, label: tag[label_key] || tag.name || key };
    });
}

const select_style = {
  minWidth: "180px",
  padding: "2px 4px",
  fontSize: "13px",
  border: "1px solid #bbb",
  borderRadius: "3px",
  background: "#fff",
};

const label_style = {
  fontSize: "10px",
  fontWeight: 600,
  color: "#444",
  textTransform: "uppercase" as const,
  letterSpacing: "0.03em",
};

const App = () => {
  const [diagram, setDiagram] = useState<Type_AnyJSON | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [region, setRegion] = useState(DEFAULT_REGION);
  const [essence, setEssence] = useState(ALL_ESSENCES);

  useEffect(() => {
    fetchJson(DIAGRAM_URL)
      .then(setDiagram)
      .catch((e) => setError(String(e)));
  }, []);

  // Les deux listes sont lues dans le fichier lui-meme, une fois charge.
  const regions = useMemo(
    () => tagsToOptions((diagram as any)?.dataTags?.[REGION_GROUP], "long_name"),
    [diagram]
  );
  // Le premier choix eteint le filtre : on retombe sur la vue MAITRE, dont le
  // fichier porte le nom (`master_view_name`, « Agregees » ici). Il ne faut pas
  // l'appeler « Toutes essences » : c'est le nom d'une AUTRE vue du fichier
  // (`view_noo1b`), lourde, avec sa geometrie propre, ou les onze essences sont
  // dessinees cote a cote. Le viewer MIT ne sait pas l'ouvrir — `view_tag_selection`
  // y filtre la vue COURANTE par une etiquette, il ne change pas de vue (cf.
  // l'en-tete de ce fichier). Confondre les deux libelles laissait croire qu'on
  // l'affichait.
  // Les vues AUTONOMES du fichier : celles qui ne sont pas engendrees depuis le
  // groupe d'etiquettes, donc qui ont leur propre geometrie. « Toutes essences »
  // en est une — les onze essences dessinees cote a cote. On ne code aucun
  // identifiant en dur : une vue est autonome quand `generated_from_group_id`
  // manque, et son nom se lit soit a plat, soit dans le delta de vue
  // (`__patch.name.$set`, encodage introduit avec `format_version: 3`).
  const vues_autonomes = useMemo(() => {
    const views = ((diagram as any)?.views || {}) as Record<string, any>;
    return Object.entries(views)
      .filter(([, v]) => v && !v.generated_from_group_id)
      .map(([id, v]) => ({
        id,
        label: v.name ?? v.__patch?.name?.$set ?? id,
      }));
  }, [diagram]);

  // Trois familles dans un seul selecteur, et elles ne se pilotent PAS pareil :
  //  - la vue MAITRE : on eteint le filtre d'etiquettes (`all`) ;
  //  - une vue AUTONOME : on la fait OUVRIR, cf. `initial_data` plus bas ;
  //  - une essence : on filtre la vue courante par son etiquette.
  // Le libelle du premier choix est celui que porte le fichier
  // (`master_view_name`, « Agregees » ici) : il ne faut surtout pas l'appeler
  // « Toutes essences », qui est le nom d'une AUTRE vue — la confusion a fait
  // croire un temps qu'on affichait celle-ci alors qu'on filtrait le maitre.
  const essences = useMemo(
    () => [
      { value: ALL_ESSENCES, label: (diagram as any)?.master_view_name || "Agregees" },
      ...vues_autonomes.map((v) => ({ value: VUE_PREFIX + v.id, label: v.label })),
      ...tagsToOptions((diagram as any)?.viewTags?.[ESSENCE_GROUP], "name"),
    ],
    [diagram, vues_autonomes]
  );

  // Objets memoises : les props de selection sont comparees par valeur
  // serialisee cote viewer, mais autant ne pas recreer un objet a chaque rendu.
  const data_tag_selection = useMemo(() => ({ [REGION_GROUP]: region }), [region]);

  // Une vue autonome demandee ? Sinon on reste sur le maitre, filtre par etiquette.
  const vue_ouverte = essence.startsWith(VUE_PREFIX)
    ? essence.slice(VUE_PREFIX.length)
    : VUE_MAITRE;

  // Sur une vue autonome le filtre d'etiquettes n'a pas de sens : elle porte
  // deja sa propre selection. On l'eteint.
  const view_tag_selection = useMemo(
    () => ({ [ESSENCE_GROUP]: vue_ouverte === VUE_MAITRE ? essence : ALL_ESSENCES }),
    [essence, vue_ouverte]
  );

  // Mode de positionnement, pilote depuis la topbar. Reactif lui aussi.
  const [mode, setMode] = useState<"scale_adapted" | "absolute">("scale_adapted");

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        overflow: "hidden",
        font: "14px system-ui, sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "24px",
          padding: "6px 12px",
          background: "#f5f5f5",
          borderBottom: "1px solid #ddd",
          flex: "0 0 auto",
        }}
      >
        <strong style={{ fontSize: "13px" }}>
          Cartographie des flux de la filiere foret-bois
        </strong>

        <label style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={label_style}>Region</span>
          <select
            style={select_style}
            value={region}
            disabled={!diagram}
            onChange={(e) => setRegion(e.target.value)}
          >
            {regions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>

        <label style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={label_style}>Essence</span>
          <select
            style={select_style}
            value={essence}
            disabled={!diagram}
            onChange={(e) => setEssence(e.target.value)}
          >
            {essences.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>

        <label style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={label_style}>Echelle</span>
          <select
            style={select_style}
            value={mode}
            disabled={!diagram}
            onChange={(e) => setMode(e.target.value as typeof mode)}
          >
            <option value="scale_adapted">Adaptee a la selection</option>
            <option value="absolute">Absolue (comparable)</option>
          </select>
        </label>
      </div>

      {/* Le conteneur du viewer doit avoir une hauteur reelle : avec `embedded`,
          le diagramme est cadre sur le clientHeight de CE div. `minHeight: 0`
          est indispensable dans un flex, sinon l'enfant refuse de descendre
          sous sa hauteur intrinseque. */}
      <div style={{ flex: 1, minHeight: 0, position: "relative" }}>
        {error && (
          <p style={{ padding: "1rem", color: "#a00" }}>
            Chargement de {DIAGRAM_URL} impossible : {error}
          </p>
        )}
        {!error && !diagram && (
          <p style={{ padding: "1rem" }}>Chargement du diagramme (646 Ko compresses)...</p>
        )}
        {diagram && (
          <ViewerOpenSankeyApp
            // Pas de prop `key` : changer de region ou d'essence ne doit PAS
            // remonter le viewer. Les deux selections ci-dessous sont
            // re-appliquees en place par le viewer (cf. ViewApp), sans relire
            // ni redessiner tout le diagramme.
            initial_data={diagram}
            // Region : { groupe : etiquette } sur les DATA tags — quelle serie
            // de valeurs afficher.
            data_tag_selection={data_tag_selection}
            // Vue OUVERTE (id ou nom, sa#397). C'est ce qui permet d'afficher
            // « Toutes essences », vue autonome a la geometrie propre, qu'aucun
            // filtre d'etiquette ne saurait reconstituer. `sankey_maitre` ramene
            // au maitre. Reactif : pas de remontage.
            view={vue_ouverte}
            // Essence : { groupe : etiquette } sur les etiquettes de VUE — ce
            // qui est visible. Attention, dans le paquet MIT la valeur est une
            // ETIQUETTE (ou « all » pour eteindre le filtre) ; la resolution
            // « valeur = nom ou id d'une VUE », qu'utilise l'application
            // cartofob-sankey, est propre au paquet SankeyApplication.
            // Ici les 11 vues du fichier sont des vues « light » engendrees
            // depuis ce meme groupe d'etiquettes : filtrer sur l'etiquette
            // donne exactement le meme resultat qu'ouvrir la vue.
            view_tag_selection={view_tag_selection}
            // Mode de positionnement, pilote par le troisieme selecteur.
            // « Echelle adaptee » recalcule l'echelle pour la selection courante
            // (une region peu boisee reste lisible) ; « Absolu » garde l'echelle
            // du fichier, donc les regions se comparent entre elles. Reactif.
            position_mode={mode}
            embedded={true}
            topbar={false}
            // Le diagramme est cadre a l'ouverture ; laisser le zoom molette
            // libre sur un dessin de cette taille desoriente vite.
            lock_zoom={true}
          />
        )}
      </div>
    </div>
  );
};

const root = createRoot(document.getElementById("root") as HTMLElement);
root.render(<App />);
