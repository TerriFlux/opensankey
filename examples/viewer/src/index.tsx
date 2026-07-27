import { createRoot } from "react-dom/client";
import { ViewerOpenSankeyApp } from "@terriflux/opensankey/src/ViewApp";
import type { Type_AnyJSON } from "@terriflux/opensankey/src/types/Utils";
import diagram from "./example.json";

// ============================================================================
// Exemple canonique d'integration du viewer OpenSankey dans une app React.
// ----------------------------------------------------------------------------
// Le diagramme — un bilan comptable simple, repris des modeles d'OpenSankey —
// est EMBARQUE (`./example.json`, 12 ko). C'est delibere : ni requete reseau,
// ni CORS, ni attente. Un exemple doit demarrer.
//
// Pour charger un diagramme distant, remplacer `diagram` par le resultat d'un
// fetch. Deux details du serveur open-sankey.fr valent alors d'etre connus :
// les JSON y sont servis en gzip BRUT (sans en-tete Content-Encoding), donc a
// decompresser soi-meme via DecompressionStream ; et certains modeles portent
// des images en base64 qui les font peser plusieurs Mo — de quoi asphyxier un
// bac a sable en ligne.
//
// Les props ci-dessous correspondent 1:1 aux options `window.sankey` du mode
// publie (cf. types/PublishOptions dans le paquet).
// ============================================================================

const root = createRoot(document.getElementById("root") as HTMLElement);

root.render(
  <div style={{ height: "100vh", width: "100vw", overflow: "hidden" }}>
    <ViewerOpenSankeyApp
      initial_data={diagram as unknown as Type_AnyJSON}
      embedded={true}         // occupe 100 % du conteneur
      topbar={false}          // barre superieure du viewer
      filter_bar={false}      // tiroir de filtres a gauche
      footer={true}
      edit_button={false}     // masque « Editer dans OpenSankey »
      tooltip_on_hover={true} // infobulles au survol, sans maintenir Shift
    />
  </div>
);
