# Mail du 15 avril 2026 — Évolutions OpenSankey / OpenSankey+ / SankeySuite

Bonjour,

Nous avons le plaisir de vous présenter les évolutions livrées sur OpenSankey,
OpenSankey+ et SankeySuite ces deux derniers mois.

## Essai gratuit OpenSankey+ : 30 jours

Vous pouvez désormais activer 30 jours d'OpenSankey+ en un clic, sans création
de compte ni informations bancaires. Une bannière en bas à droite de l'écran
vous propose d'activer l'essai et affiche les jours restants en permanence. À
l'expiration, vous revenez automatiquement à la version gratuite, aucune
mauvaise surprise.

## Version précédente toujours disponible

Si vous rencontrez un problème de compatibilité avec la nouvelle version
(notamment sur d'anciens fichiers de diagramme), la version précédente reste
accessible sur https://backup.open-sankey.fr. Dans ce cas, merci de nous
signaler le problème pour que nous puissions le corriger rapidement.

## OpenSankey (base)

- Visite guidée enrichie (~21 étapes) qui parcourt l'ensemble de l'interface,
  accessible depuis le bandeau du haut.
- Verrouillage d'axe au drag : maintenez Shift en glissant un nœud pour le
  contraindre à l'horizontale ou à la verticale.
- Mise en page automatique unifiée entre clic droit et import Excel : sélecteur
  Centrer les nœuds / Minimiser les croisements, écarts configurables, options
  pour épingler les sources à gauche et les puits à droite.
- Verrouillage colonne (u) / ligne (v) par nœud avec cadenas dans le menu
  d'apparence : épinglez certains nœuds tout en laissant l'algorithme placer
  les autres.
- Mode pinceau de style pour copier le style d'un élément vers un autre en
  deux clics.
- Copie d'éléments en lot depuis les menus contextuels.
- Commutateur paramétrique / absolu dédié dans la barre du bas.
- Nouvelle forme de nœud capsule horizontale.
- Flux dégradés (tapered) : valeurs distinctes en source et cible pour
  représenter pertes ou gains le long du flux.
- Mode d'affichage des totaux configurable sur le libellé d'un nœud
  (Σin / Σin→Σout / Σout) lorsque les flux entrants et sortants diffèrent.
- Réorganisation automatique des entrées/sorties d'un nœud à la fin d'un drag,
  annulable d'un coup.
- Règle de couleur automatique des flux revue (priorité aux tags couleur
  communs).
- Noms de styles par défaut traduits FR/EN selon la langue de l'interface.
- Refonte interne du mode paramétrique : rendu plus stable, drag plus
  prévisible.

## OpenSankey+ (premium)

- Mode d'affichage englobant (containers) : un nœud parent peut être affiché
  autour de ses enfants sous forme d'un rectangle pointillé, avec deux
  variantes de répartition des flux. Drag groupé du parent ; l'intérieur reste
  cliquable.
- Vues, héritage multi-sources : le modal Attributs hérités est refait,
  draggable, et permet à une vue d'hériter du sankey maître et/ou d'autres
  vues, avec raccourcis Aucun / Basiques / Tout.

## SankeySuite : MFA & réconciliation

- Intervalles, incertitude, min/max sur les flux (AFM) : nouveau type de
  données, panneau de configuration restructuré en onglets Basique / AFM,
  affichage [min – max] sur le diagramme.
- Séparation type de données / affichage des intervalles : deux sélecteurs
  indépendants dans la barre d'outils, permettant de visualiser les
  intervalles données ou résultats selon la source sélectionnée.
- Stocks et flux de recyclage : un nœud dont les entrées et sorties diffèrent
  affiche un libellé entrée → sortie mettant en évidence l'écart.
- Stocks (Δstock) intégrés au bilan matière : la feuille stocks accepte
  désormais uncert, min, max et participe à la réconciliation. Deux nouvelles
  feuilles de sortie stocks_results et stocks_analysis complètent results /
  analysis.

## Import / Export Excel

- Bloquer l'import sur nouveaux nœuds/flux inattendus via les options
  error_on_new_nodes et error_on_new_flux.
- Persistance Excel des positions u/v : nouvelles colonnes optionnelles
  Colonne u / Ligne v, sans casser les fichiers existants.
- Aperçu d'erreur limité aux 10 premiers éléments manquants pour rester
  lisible.

N'hésitez pas à nous remonter vos retours ou à nous signaler tout comportement
inattendu, vos remarques nous aident à orienter les prochaines versions.

Bonne exploration,

L'équipe Terriflux
