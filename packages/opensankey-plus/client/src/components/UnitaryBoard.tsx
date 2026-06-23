import { updateUnitaryStyles } from '../deps/OpenSankey/Algorithms/UnitaryBoard'
import { elementStyleConfigs, node_exchanges_style, node_unitary_styles } from '../deps/OpenSankey/Elements/ElementStyle'
import { Class_NodeElement } from '../deps/OpenSankey/Elements/Node'
import { compressJSONToGzip } from '../deps/OpenSankey/Persistence/UniversalJSONCompression'
import { Class_Tag } from '../deps/OpenSankey/types/Tag'
import { Class_ViewTagGroup } from '../deps/OpenSankey/types/TagGroup'
import { makeId } from '../deps/OpenSankey/types/Utils'
import { Class_ApplicationDataOSP } from '../types/ApplicationDataOSP'
import { Class_DrawingAreaOSP, DrawingAreaPersistenceOSP } from '../types/DrawingAreaOSP'

/**
 * Retire toute la GÉOMÉTRIE d'un JSON de DrawingArea pour que le board unitaire se
 * charge comme un import neuf : positions de nœuds/liens supprimées (fromJSON
 * retombe sur le défaut 0), `node_pos_is_center` désactivé (sinon x/y serait
 * réinterprété comme un centre persistant), verrous/offsets de position retirés des
 * `local`, ANCRAGE des liens (verrous de côté + deltas d'accroche) et DROITURE des
 * flux (must_stay_straight / straight_mode / straight_include_children) remis à zéro.
 * Résultat : computeAutoSankey recalcule TOUTE la disposition à partir de la seule
 * topologie + valeurs, sans corrélation au diagramme source.
 */
const stripGeometryFromDrawingAreaJSON = (json: Record<string, unknown>) => {
  json.node_pos_is_center = false
  const POSITION_LOCAL_KEYS = [
    'shape_position_u_locked', 'shape_position_v_locked',
    'shape_position_dx', 'shape_position_dy'
  ]
  // Ancrage des flux sur les nœuds (champs niveau-lien, hors `local`) : côté verrouillé
  // + décalage d'accroche. Non touchés par resetAttributes/resetAnchorLocks au load.
  const LINK_ANCHOR_KEYS = [
    'source_side_locked', 'target_side_locked',
    'source_anchor_delta', 'target_anchor_delta'
  ]
  // Droiture des flux (valeurs de forme dans `local`) : marqueur « garder droit »,
  // mode d'ancrage de droiture et propagation aux enfants. C'est de la géométrie
  // imposée : laissée en place, elle forcerait computeAutoSankey à garder certains
  // flux droits → board corrélé au diagramme source. On la retire comme le reste.
  const LINK_STRAIGHTNESS_LOCAL_KEYS = [
    'shape_must_stay_straight', 'shape_straight_mode', 'shape_straight_include_children'
  ]
  const nodes = json.nodes as Record<string, Record<string, unknown>> | undefined
  if (nodes) {
    Object.values(nodes).forEach(n => {
      delete n.x
      delete n.y
      const local = n.local as Record<string, unknown> | undefined
      if (local) POSITION_LOCAL_KEYS.forEach(k => delete local[k])
    })
  }
  const links = json.links as Record<string, Record<string, unknown>> | undefined
  if (links) {
    Object.values(links).forEach(l => {
      delete l.x
      delete l.y
      LINK_ANCHOR_KEYS.forEach(k => delete l[k])
      const local = l.local as Record<string, unknown> | undefined
      if (local) {
        POSITION_LOCAL_KEYS.forEach(k => delete local[k])
        LINK_STRAIGHTNESS_LOCAL_KEYS.forEach(k => delete local[k])
      }
    })
  }
}

/**
 * Construit et configure une DrawingArea unitaire (copie du diagramme de base,
 * styles + ViewTagGroups unitaires, focalisation éventuelle sur node_ref) SANS
 * la dessiner, la recentrer ni la sauver comme vue. Partie commune au flux
 * « vue unitaire » (createUnitaryView) et au flux « sankey unitaire en modal »
 * (createUnitarySankeyDetached).
 */
/** Mode d'affichage des valeurs de flux sur le board unitaire (cf. sélecteur du modal). */
export type UnitaryValueMode = 'percent' | 'value' | 'normalized'

const buildUnitaryDrawingArea = (
  app_data: Class_ApplicationDataOSP,
  node_ref?: Class_NodeElement,
  value_mode: UnitaryValueMode = 'percent',
  normalize_link_id?: string | null,
  // app_data fournissant le diagramme SOURCE à copier. Vaut app_data par défaut
  // (source = diagramme courant). Pour un unitaire issu d'un import Excel, on passe
  // l'app_data temporaire qui porte le sankey importé : le nouveau board est créé dans
  // app_data (contexte de rendu/thème) mais copié depuis source_app_data.drawing_area.
  source_app_data: Class_ApplicationDataOSP = app_data
): Class_DrawingAreaOSP => {
  const base_drawing_area = source_app_data.drawing_area
  base_drawing_area.purgeSelection()

  // Create the new sankey
  const new_drawing_area = app_data.createNewDrawingArea(makeId('unitary_view')) as Class_DrawingAreaOSP
  new_drawing_area.is_unitary = true
  new_drawing_area.bypass_redraws = true

  // Copy current sankey
  const name = node_ref ? 'Unitary view of ' + node_ref.name : 'Board Unitary View'
  const id = new_drawing_area.id
  // keep_siblings:false → on NE copie PAS les nœuds import/export déjà splittés du
  // source : seul le nœud d'échange parent (« International ») est sérialisé (avec ses
  // liens réécrits sur lui). Le split est ensuite REJOUÉ par afterFromJSON() ci-dessous,
  // exactement comme au chargement du diagramme principal. Sinon (keep_siblings:true) le
  // parent restait non-splitté donc VISIBLE dans le board unitaire, alors qu'il doit
  // disparaître au profit de ses enfants import/export.
  const copy = DrawingAreaPersistenceOSP.toJSON(base_drawing_area as Class_DrawingAreaOSP, { keep_siblings: false })
  copy.id = id
  // Le board unitaire se construit comme un import « neuf » : on charge le JSON du
  // source MAIS débarrassé de toute GÉOMÉTRIE, puis computeAutoSankey décide tout.
  // Sinon la géométrie source persiste (positions, centre persisté via
  // node_pos_is_center, verrous de colonne/ligne) et le board reste corrélé au
  // diagramme principal (« bouger un nœud du source déplaçait celui du board »).
  // On nettoie DANS le JSON, avant fromJSON, pour ne jamais charger cet état (le
  // faire après fromJSON se bat avec l'état déjà posé et déstabilise l'orientation).
  stripGeometryFromDrawingAreaJSON(copy)
  DrawingAreaPersistenceOSP.fromJSON(new_drawing_area, copy)
  // Rejouer le post-traitement de chargement (split import/export). DrawingAreaPersistence
  // .fromJSON N'appelle PAS afterFromJSON (contrairement à ApplicationData.fromJSON du
  // diagramme principal) : sans cet appel, splitTrade() ne tourne pas et le nœud d'échange
  // « International » reste entier et visible. afterFromJSON() le resplitte en enfants
  // import/export (qui reprennent ses liens) et le passe invisible — comme dans le
  // diagramme principal.
  new_drawing_area.afterFromJSON()
  new_drawing_area.name = name

  // « From scratch » : la copie JSON ci-dessus a ramené le styles_dict du source
  // (dont le style 'default', référencé par tous les éléments en index 0, et ses
  // customisations : valeur sur les nœuds, cadres de label, couleurs...). Le board
  // unitaire ne doit pas en hériter → on remet le socle de styles aux valeurs usine.
  // Les styles custom assignés par élément sont retirés plus tard par removeAllStyles
  // (updateUnitaryStyles), et les styles unitaires sont appliqués par-dessus.
  new_drawing_area.sankey.resetBaseStylesToFactory()

  // Forcer le mode 'free' : le diagramme source est souvent en format papier (A3…),
  // or en mode papier le placement vertical REMPLIT la hauteur de la page (espacement
  // = hauteur_dispo / nb de nœuds) au lieu d'un écart fixe → écarts démesurés sur le
  // board unitaire, qui en plus suivent le redimensionnement de la zone. En 'free',
  // computeAutoSankey empile avec l'écart par défaut (compact).
  new_drawing_area.paper_format = 'free'

  // Neutraliser le verrou de taille (#1240) hérité du diagramme source via le JSON
  // copié : un aperçu unitaire DOIT toujours se recadrer (ouverture + redimensionnement
  // du tooltip/modal). Verrouillé, areaAutoFit reste inerte → le 1er rendu force un fit
  // vertical (labels qui débordent) et le resize réapplique un transform gelé (diagramme
  // tronqué). On le pose APRÈS fromJSON, sinon le chargement le réécrirait depuis le JSON.
  new_drawing_area.size_locked = false

  // DÉVERROUILLER la police pour l'aperçu unitaire. Police VERROUILLÉE (défaut) = taille ÉCRAN
  // constante quel que soit le zoom (compensation 1/k) : les labels ne rétrécissent pas avec le
  // board. Sur un conteneur ÉTROIT (ex. panneau docké dans la colonne droite), des labels longs
  // (« Production biologique », « Prélèvements ») gardent une largeur écran > largeur du panneau →
  // débordement que AUCUN cadrage ne peut résorber (le fit rapetisse les formes mais pas les labels).
  // Déverrouillée, la police suit l'échelle : areaAutoFit (avec la borne de largeur, cf. DrawingArea)
  // fait tenir formes + labels. Posé avant draw() : le setter no-op sur sélections d3 non créées.
  new_drawing_area.font_size_locked = false

  // Supprimer les containers
  new_drawing_area.sankey.containers_list.forEach(cont => {
    new_drawing_area.deleteContainer(cont)
  })

  // Créer les styles unitaires
  node_unitary_styles.forEach(style_id =>
    new_drawing_area.sankey.create_internal_style(style_id, elementStyleConfigs)
  )

  // Récupérer les tags de type de nœud existants
  const node_type = new_drawing_area.sankey.node_taggs_dict['type de noeud']
  const echangeTag = node_type?.tags_dict['echange']
  const productTag = node_type?.tags_dict['produit']
  const sectorTag = node_type?.tags_dict['secteur']

  // Filtrer les nœuds par type. Les nœuds d'échange (import/export) sont EXCLUS de
  // products_nodes/sector_nodes : ce sont des extrémités (un seul flux) qui ne doivent
  // pas devenir des nœuds centraux unitaires sélectionnables. On les filtre ici, avant
  // la conversion echange→sector ci-dessous (à ce stade ils portent encore le tag
  // `echange`), pour qu'ils ne reçoivent pas de tag view unitaire.
  const products_nodes = new_drawing_area.sankey.nodes_list.filter(n => n.hasGivenTag(productTag) && !n.hasGivenTag(echangeTag))
  const sector_nodes = new_drawing_area.sankey.nodes_list.filter(n => n.hasGivenTag(sectorTag) && !n.hasGivenTag(echangeTag))
  const exchange_nodes = new_drawing_area.sankey.nodes_list.filter(n => n.hasGivenTag(echangeTag))
  exchange_nodes.forEach(n => {
    node_exchanges_style.forEach(s => {
      n.removeStyleById(s)
      n.links_order.forEach(l => l.removeStyleById(s))
    })
    n.removeTag(echangeTag)
    n.addTag(sectorTag)
  })
  const other_nodes = new_drawing_area.sankey.nodes_list.filter(n =>
    !n.hasGivenTag(echangeTag) &&
    !n.hasGivenTag(productTag) &&
    !n.hasGivenTag(sectorTag)
  )

  // Créer les ViewTagGroup et établir les relations
  const unitary_tags_groups: Class_ViewTagGroup[] = []

  if (node_type && (sectorTag || productTag)) {
    // Cas avec distinction secteurs/produits
    const sector_unitary_tag_group = new_drawing_area.sankey.addViewTagGroup(
      'sector_unitary',
      'Sankey Unitaire Secteurs'
    )
    unitary_tags_groups.push(sector_unitary_tag_group)

    const product_unitary_tag_group = new_drawing_area.sankey.addViewTagGroup(
      'product_unitary',
      'Sankey Unitaire Produits'
    )
    unitary_tags_groups.push(product_unitary_tag_group)

    // Établir la relation de sibling entre les deux groupes
    sector_unitary_tag_group.addSibling(product_unitary_tag_group)

    // Déterminer quel groupe activer selon le node_ref
    let activate_sectors = true
    if (node_ref) {
      if (new_drawing_area.sankey.nodes_dict[node_ref.id].hasGivenTag(productTag)) {
        activate_sectors = false
      } else if (new_drawing_area.sankey.nodes_dict[node_ref.id].hasGivenTag(sectorTag)) {
        activate_sectors = true
      }
    }

    // Activer/désactiver les groupes
    sector_unitary_tag_group.activated = activate_sectors
    product_unitary_tag_group.activated = !activate_sectors

    // Ajouter les tags pour les secteurs
    sector_nodes.forEach(n => {
      const tag = sector_unitary_tag_group.addTag(n.name)
      n.addTag(tag as Class_Tag)
      // Si on crée une vue focalisée, seul le tag du node_ref est sélectionné
      // Si on crée un board, le premier tag est sélectionné par défaut
      if (node_ref) {
        tag.is_selected = n.id === node_ref.id
      } else {
        tag.is_selected = false
      }
    })

    // Ajouter les tags pour les produits
    products_nodes.forEach(n => {
      const tag = product_unitary_tag_group.addTag(n.name)
      n.addTag(tag as Class_Tag)
      if (node_ref) {
        tag.is_selected = n.id === node_ref.id
      } else {
        tag.is_selected = false
      }
    })

    // S'assurer qu'au moins un tag est sélectionné dans le groupe actif
    const active_group = activate_sectors ? sector_unitary_tag_group : product_unitary_tag_group
    if (active_group.selected_tags_list.length === 0 && active_group.tags_list.length > 0) {
      active_group.tags_list[0].is_selected = true
    }

  } else {
    // Cas simple : un seul groupe pour tous les nœuds
    const unitary_tag_group = new_drawing_area.sankey.addViewTagGroup(
      'unitary',
      'Sankey Unitaire'
    )
    unitary_tags_groups.push(unitary_tag_group)
    unitary_tag_group.activated = true

    // Ajouter les tags pour tous les nœuds (hors échange)
    other_nodes.forEach(n => {
      const tag = unitary_tag_group.addTag(n.name)
      n.addTag(tag as Class_Tag)
      if (node_ref) {
        tag.is_selected = n.id === node_ref.id
      } else {
        tag.is_selected = false
      }
    })

    // S'assurer qu'au moins un tag est sélectionné
    if (unitary_tag_group.selected_tags_list.length === 0 && unitary_tag_group.tags_list.length > 0) {
      unitary_tag_group.tags_list[0].is_selected = true
    }
  }

  // Configurer tous les groupes avec banner 'one'
  unitary_tags_groups.forEach(tagGroup => {
    tagGroup.banner = 'one'
  })

  // Configuration commune
  new_drawing_area.removeMinimumLinkThickness()
  new_drawing_area.removeMaximumLinkThickness()
  new_drawing_area.filter_label = 0
  new_drawing_area.filter_link_value = 0

  // Masquer la légende : le JSON copié du diagramme source ramène son état de
  // visibilité (cf. toJSON ci-dessus), donc une légende visible dans le diagramme
  // principal réapparaîtrait dans le sankey unitaire (vue comme infobulle détachée).
  new_drawing_area.legend.masked = true

  // Appliquer les styles unitaires + layout (computeAutoSankey). La géométrie ayant
  // été nettoyée dans le JSON (cf. stripGeometryFromDrawingAreaJSON), computeAutoSankey
  // repart de zéro comme sur un import neuf.
  updateUnitaryStyles(new_drawing_area)

  // Mode d'affichage des valeurs de flux. Par défaut 'percent' : les styles de flux
  // unitaires portent déjà value_label_unit_type '%ID'/'%OS' (% de la somme E/S du
  // nœud central). Les autres modes ne font que changer ce type d'unité ; le calcul
  // est ensuite assuré par format_value (cf. types/Utils.tsx).
  new_drawing_area.unitary_value_mode = value_mode
  if (value_mode !== 'percent') {
    const in_style = new_drawing_area.sankey.styles_dict['LinkInUnitaryStyle']
    const out_style = new_drawing_area.sankey.styles_dict['LinkOutUnitaryStyle']
    if (value_mode === 'value') {
      // Valeur brute (+ unité si un tag d'unité existe).
      if (in_style) in_style.value_label_unit_type = 'unit_tag'
      if (out_style) out_style.value_label_unit_type = 'unit_tag'
    } else {
      // Normalisé : ratio vs un flux de référence fixé à 1 (sankey.normalised_link).
      // Les styles unitaires forcent value_label_custom_digit + nb_digit=0 (entiers),
      // ce qui arrondirait les ratios (0,5 ; 1,33…) à l'entier. On repasse sur les
      // chiffres significatifs (toPrecision) pour conserver les décimales.
      ;[in_style, out_style].forEach(style => {
        if (!style) return
        style.value_label_unit_type = 'normalized'
        style.value_label_custom_digit = false
      })
      const ref = normalize_link_id ? new_drawing_area.sankey.links_dict[normalize_link_id] : undefined
      new_drawing_area.sankey.normalised_link = ref ?? undefined
    }
  }

  return new_drawing_area
}

/**
 * Re-focalise une DrawingArea unitaire DÉJÀ construite sur un nouveau nœud central,
 * sans refaire la copie JSON / le fromJSON / la reconstruction des ViewTagGroups
 * (tout ça ne dépend que de la SOURCE, pas du nœud choisi). On se contente de
 * re-sélectionner le tag unitaire du nouveau nœud (et d'activer le bon groupe
 * produit/secteur), puis updateUnitaryStyles re-pose styles + layout sur la seule
 * étoile visible. C'est le chemin « instantané » du survol/changement de nœud :
 * O(nœuds visibles) au lieu de O(graphe entier sérialisé) par changement.
 *
 * Le caller appelle ensuite da.draw() (draw() remet bypass_redraws à false).
 */
export const refocusUnitaryDrawingArea = (
  da: Class_DrawingAreaOSP,
  node_ref: Class_NodeElement
) => {
  const sankey = da.sankey
  const node_in_da = sankey.nodes_dict[node_ref.id]
  if (!node_in_da) return

  // Les groupes unitaires créés par buildUnitaryDrawingArea : 'unitary' (cas simple)
  // ou la paire siblings 'product_unitary'/'sector_unitary'.
  const groups = ['unitary', 'product_unitary', 'sector_unitary']
    .map(id => sankey.view_taggs_dict[id])
    .filter(Boolean) as Class_ViewTagGroup[]
  if (groups.length === 0) return

  // Repartir d'une sélection vide sur tous les groupes unitaires…
  groups.forEach(g => g.tags_list.forEach(tag => tag.setUnSelected()))
  // …puis sélectionner le tag du nouveau nœud central dans SON groupe et l'activer
  // (l'autre sibling produit/secteur est désactivé : updateUnitaryStyles ne retient
  // comme centre que les tags sélectionnés d'un groupe activé).
  groups.forEach(g => {
    const tag = node_in_da.tags_dict[g.id]
    if (tag && tag.group === g) {
      g.activated = true
      tag.setSelected()
    } else if (g.id === 'product_unitary' || g.id === 'sector_unitary') {
      g.activated = false
    }
  })

  updateUnitaryStyles(da)
}

/**
 * Crée une vue unitaire - soit un board avec tous les nœuds, soit une vue focalisée sur un nœud spécifique
 * @param app_data - L'application data
 * @param node_ref - Le nœud de référence (optionnel). Si fourni, crée une vue focalisée sur ce nœud
 */
export const createUnitaryView = (
  app_data: Class_ApplicationDataOSP,
  node_ref?: Class_NodeElement
) => {
  // If no view existed previously, we add the active sankey as master sankey
  if (!app_data.has_views && !app_data.master_drawing_area) {
    app_data.master_drawing_area = app_data.drawing_area
    app_data.drawing_area.sankey.setInvisible()
    app_data.drawing_area.purgeSelection()
    app_data.drawing_area.unDraw()
  }

  const new_drawing_area = buildUnitaryDrawingArea(app_data, node_ref)

  // Dessiner et centrer
  new_drawing_area.draw()
  new_drawing_area.to_recenter = true
  new_drawing_area.recenter()
  new_drawing_area.unDraw()

  // Sauvegarder la vue
  app_data.views_dict[new_drawing_area.id] = {
    'name': new_drawing_area.name,
    'json': compressJSONToGzip(DrawingAreaPersistenceOSP.toJSON(new_drawing_area))
  }
  app_data.heredited_attr[new_drawing_area.id] = {}
  app_data.pushViewIdInViewOrder(new_drawing_area.id)

  return new_drawing_area
}

/**
 * Crée une vue unitaire focalisée sur un nœud spécifique
 * @param app_data - L'application data
 * @param node_ref - Le nœud de référence
 */
export const createUnitaryNewView = (
  app_data: Class_ApplicationDataOSP,
  node_ref: Class_NodeElement
) => {
  return createUnitaryView(app_data, node_ref)
}

/**
 * Crée une DrawingArea unitaire destinée à être rendue dans un conteneur DOM
 * détaché (modal draggable avec zone de dessin), EN PLUS du diagramme principal
 * qui reste affiché. Ne touche pas master_drawing_area / la visibilité du
 * diagramme principal, et n'enregistre PAS de vue.
 *
 * @param app_data L'application data
 * @param node_ref Le nœud de référence (focalisation)
 * @param container_selector Sélecteur CSS du div hôte (zone de dessin du modal)
 * @returns la DrawingArea unitaire, déjà dessinée dans le conteneur
 */
export const createUnitarySankeyDetached = (
  app_data: Class_ApplicationDataOSP,
  node_ref: Class_NodeElement,
  container_selector: string,
  value_mode: UnitaryValueMode = 'percent',
  normalize_link_id?: string | null,
  // Source du diagramme à copier (cf. buildUnitaryDrawingArea). Défaut = app_data
  // (diagramme courant) ; pour un import Excel, l'app_data temporaire importé.
  source_app_data: Class_ApplicationDataOSP = app_data
): Class_DrawingAreaOSP => {
  const new_drawing_area = buildUnitaryDrawingArea(app_data, node_ref, value_mode, normalize_link_id, source_app_data)
  new_drawing_area.container_selector = container_selector
  // Lecture seule + pas de grille (la DA détachée est un aperçu, pas une zone d'édition).
  new_drawing_area.grid_visible = false
  // Mode sélection (curseur pointeur), pas édition : drawBackground() — appelé par
  // draw() — applique la classe CSS du curseur selon ce mode, donc on le fixe AVANT.
  new_drawing_area.setToModeEdition(false)
  // Rendu. Le cadrage + centrage sont faits par areaAutoFit (dans draw) : pour un
  // board unitaire (is_unitary) il centre désormais l'axe non-dominant. Pas de
  // recenter() ici (il décale les positions puis areaAutoFit recadre par-dessus →
  // conflit ; et il étendait la zone à la fenêtre, ce qui faisait « suivre » le resize).
  new_drawing_area.to_recenter = false
  new_drawing_area.draw()
  return new_drawing_area
}