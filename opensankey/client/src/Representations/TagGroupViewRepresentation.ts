// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2026 TerriFlux
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction.
// ==================================================================================================
// Author        : TerriFlux
// ==================================================================================================

// sa#563 (lot 4) — LA « VUE » D'UN GROUPE D'ÉTIQUETTES EST UNE NATURE, et non plus une photo.
//
// CE QU'ELLE REMPLACE. `renderLegendTagGroupView` (SA#551) posait l'aperçu de cascade sur le
// diagramme VIVANT, le redessinait, CLONAIT son SVG en chaîne de caractères, puis rétablissait
// tout. Le résultat était une image : rien ne s'y déplaçait, rien ne s'y réglait, la colonne
// d'outils ne savait pas qu'elle existait — et le diagramme de l'auteur passait, l'espace d'une
// tâche, par deux dessins complets qu'il n'avait pas demandés.
//
// CE QU'ELLE EST. Le sujet est le DIAGRAMME ; le groupe n'est pas l'objet regardé, c'est la
// MANIÈRE de le regarder — donc un réglage de la nature (`tagg_id`), au même titre que l'axe
// d'une couronne. C'est aussi ce qui fait qu'il n'y a qu'UNE fenêtre de cette nature à la fois,
// comme il n'y a qu'un tableur : on ne change pas de fenêtre pour changer de groupe, on change
// le réglage, dans la colonne d'outils comme pour n'importe quelle figure.
//
// POURQUOI UNE COPIE DU DOCUMENT, et non le diagramme vivant mis en aperçu. Un document n'a
// qu'une zone de dessin, donc qu'un `#draw_zoom` : faire dessiner le document vivant dans la case
// de la vue le retirerait de la page. Et l'aperçu de cascade est un ÉTAT du modèle — le poser
// pour de bon sur le document vivant reviendrait à changer la mise en forme de l'auteur. La copie
// répond aux deux d'un coup, et c'est elle qui tient le point 5 de la recette : « le diagramme
// principal n'a pas bougé d'un pixel pendant l'opération ». Littéralement — il n'est ni lu en
// écriture, ni redessiné.
//
// LA COPIE NE S'ÉDITE PAS, et c'est une réponse et non un manque. Ses nœuds ne délèguent rien à
// ceux du diagramme (contrairement à l'étoile unitaire, os#1422, dont les proxys écrivent dans
// leur source) : ce qu'on y déplacerait ne reviendrait nulle part et se perdrait au premier
// redessin du parent. Mieux vaut une vue qu'on parcourt — on s'y déplace, on y zoome, on la
// détache, on l'ancre — qu'une vue qui accepte des gestes et les oublie.
//
// LE PATRON EST CELUI DE `mountStarDocument` (registerOSPRepresentations, os#1422) : reconstruire
// sur l'ÉPOQUE DE DESSIN de la source, ne dessiner que si la case mesure quelque chose, se
// démonter en disposant du document. Les commentaires qui justifient chacun de ces trois gestes
// sont là-bas ; on ne les recopie pas, on les applique.

import type { Class_ApplicationData } from '../types/ApplicationData'
import type { Class_TagGroup } from '../types/TagGroup'
import { DRAW_TOPIC } from '../types/EventBus'
import type {
  Type_RepresentationContext, Type_RepresentationMount
} from './RepresentationRegistry'

/** La clé de réglage qui nomme le groupe mis en forme. Écrite par la légende, lue ici. */
export const TAG_GROUP_VIEW_OPTION_KEY = 'tagg_id'

/**
 * Les groupes d'étiquettes qu'une vue peut prendre pour réglage : ceux de NŒUDS et ceux de FLUX,
 * les deux familles que la cascade des styles d'étiquette met en forme (`setTagStylePreview`).
 */
export const tagGroupsOf = (app_data: Class_ApplicationData): Class_TagGroup[] => {
  const sankey = app_data.drawing_area?.sankey
  if (!sankey) return []
  return [
    ...sankey.node_taggs_list, ...sankey.flux_taggs_list
  ] as unknown as Class_TagGroup[]
}

/**
 * Le groupe que ce contexte désigne : celui du réglage, ou — à défaut — le PREMIER du diagramme.
 *
 * Le repli n'est pas une commodité : une fenêtre ouverte sans réglage (un fichier ancien, le
 * sélecteur de nature de la barre du haut) doit montrer quelque chose plutôt qu'une case vide
 * qui n'explique pas ce qui lui manque. `undefined` seulement quand le diagramme n'a AUCUN
 * groupe, et la nature ne s'offre alors pas du tout (cf. `isAvailable`).
 */
export const tagGroupOfContext = (ctx: Type_RepresentationContext): Class_TagGroup | undefined => {
  const groups = tagGroupsOf(ctx.app_data)
  const wanted = ctx.options[TAG_GROUP_VIEW_OPTION_KEY]
  if (typeof wanted === 'string' && wanted !== '') {
    const found = groups.find(g => g.id === wanted)
    if (found) return found
  }
  return groups[0]
}

/**
 * sa#563 — LE DOCUMENT DE LA VUE : une copie du diagramme courant, dont seul `group_id` met en
 * forme. `null` si la copie retombait sur le document principal (garde ci-dessous).
 *
 * SÉPARÉ DU MONTAGE, et pas seulement pour les tests : ce qui fait la justesse de cette nature
 * — l'aperçu posé sur la copie, le groupe présenté développé, la source intouchée — se lit et se
 * vérifie sur un MODÈLE, sans conteneur, sans mesure de case et sans dessin. Le montage, lui, n'a
 * plus qu'à s'occuper du cycle de vie.
 *
 * Le document rendu est HORS ÉCRAN et non dessiné : c'est à l'appelant de lui donner un lieu
 * d'accueil (`showIn`) puis de le dessiner quand sa case mesure quelque chose.
 */
export const buildTagGroupViewDocument = (
  source: Class_ApplicationData, group_id: string | undefined
): Class_ApplicationData | null => {
  const doc = source.workspace.createDocument({ offscreen: true })
  // ⚠️ SÉRIALISER LA SOURCE LA REDESSINE, et ce serait une BOUCLE SANS FIN.
  //
  // `toSheetContentJSON` enveloppe son travail dans `withBypassRedraws`, dont la sortie
  // REDESSINE (`if (redraw && !previous) this.draw()`, DrawingArea) : un dessin complet de la
  // source, donc une époque de plus, donc une notification `DRAW_TOPIC` — celle-là même à
  // laquelle la vue s'abonne pour se reconstruire. La reconstruction déclencherait la suivante,
  // indéfiniment, et le premier clic sur « Vue » figerait la page.
  //
  // Le `withBypassRedraws(…, false)` extérieur ferme les deux robinets d'un coup : l'intérieur
  // voit `previous` déjà levé et ne redessine pas en sortant, et celui-ci ne redessine pas
  // davantage. C'est aussi ce qui rend littéralement vrai le point 5 de la recette — le
  // diagramme principal n'est ni relu en écriture, ni redessiné.
  //
  // `false` au `fromJSON` : on ne dessine PAS la copie au chargement. Sa zone n'a pas encore son
  // conteneur, et un dessin hors écran se cadrerait sur la fenêtre du navigateur (cf.
  // `drawWhenMeasured`).
  const json = source.drawing_area.withBypassRedraws(() => source.toSheetContentJSON(), false)
  doc.fromJSON(json, {}, false)
  // CEINTURE ET BRETELLES, celle de la fenêtre de feuille et de l'étoile : on ne repointe jamais
  // vers notre case une zone qui est celle du conteneur principal. Une case vide se voit et se
  // répare ; un diagramme disparu, non.
  if (doc === source || doc.drawing_area.is_in_main_container) {
    console.warn('sa#563 — vue de groupe refusée : son document est celui du conteneur principal.')
    try { doc.dispose() } catch { /* rien à défaire */ }
    return null
  }
  if (group_id !== undefined) {
    const sankey = doc.drawing_area.sankey
    sankey.setTagStylePreview(group_id)
    // Un groupe FERMÉ (« Appliquer les styles associés » décoché) n'a pas de bloc dans la
    // légende : sur la COPIE, on l'ouvre pour de bon — c'est une copie, le document de l'auteur
    // n'en garde rien, et la vue doit faire lire CE groupe.
    const group = [...sankey.node_taggs_list, ...sankey.flux_taggs_list]
      .find(g => g.id === group_id) as unknown as { use_colors?: boolean } | undefined
    if (group) group.use_colors = true
    // PAS DE `redrawForTagStylePreview` ICI, contrairement à SA#551, et c'est le bénéfice du
    // lot : là-bas il fallait repeindre le dessin vivant élément par élément puis rappeler
    // `legend.draw()`, parce qu'on modifiait un diagramme DÉJÀ dessiné. Ici rien n'est encore
    // dessiné — le dessin complet qui suivra peint les nœuds, les flux ET la légende, dans
    // l'état que l'aperçu vient de poser.
  }
  // LA COPIE NE S'ÉDITE PAS (cf. l'en-tête du module) : ses nœuds ne délèguent rien à ceux du
  // diagramme, donc ce qu'on y déplacerait se perdrait au premier redessin du parent.
  doc.edition_allowed = false
  return doc
}

/** Un identifiant de conteneur par montage (cf. `star_container_seq`, même piège de sélecteur). */
let view_container_seq = 0

/**
 * Dessine, dans le conteneur prêté, une COPIE du diagramme mise en forme par le seul groupe
 * désigné. Rend la poignée que l'hôte pilote (`redraw` / `cleanup`).
 */
export const mountTagGroupView = (
  container: HTMLElement, ctx: Type_RepresentationContext
): Type_RepresentationMount => {
  const source = ctx.app_data
  const group_id = tagGroupOfContext(ctx)?.id
  if (container.id === '') {
    view_container_seq += 1
    container.id = 'sa563_group_view_' + view_container_seq
  }
  const selector = '#' + container.id
  const owner_document = container.ownerDocument !== document ? container.ownerDocument : null

  let view: Class_ApplicationData | null = null
  let last_epoch = -1
  let last_w = -1
  let last_h = -1
  let draw_deferred = false

  const tileIsMeasured = (): boolean => container.clientWidth > 0 && container.clientHeight > 0

  const drawWhenMeasured = (doc: Class_ApplicationData): void => {
    if (!tileIsMeasured()) { draw_deferred = true; return }
    draw_deferred = false
    last_w = container.clientWidth
    last_h = container.clientHeight
    doc.drawing_area.draw()
  }

  const disposeView = (): void => {
    const doc = view
    view = null
    try { doc?.dispose() } catch { /* un document déjà disposé n'a rien à défaire */ }
  }

  /**
   * Vrai PENDANT une reconstruction. Ceinture, en plus des bretelles de
   * `buildTagGroupViewDocument` : reconstruire lit le document source de bout en bout, et tout
   * dessin qui en surgirait — le nôtre, celui d'un voisin — rentrerait par `refresh` pour
   * reconstruire pendant qu'on reconstruit. Un seul chemin de reconstruction à la fois.
   */
  let rebuilding = false

  const rebuild = (): void => {
    if (rebuilding) return
    rebuilding = true
    try {
      // Le document d'AVANT s'en va d'abord : deux copies vivantes du même diagramme tiendraient
      // toutes deux une zone de dessin, et la seconde prendrait le conteneur de la première.
      disposeView()
      const doc = buildTagGroupViewDocument(source, group_id)
      if (!doc) return
      view = doc
      doc.showIn(selector, owner_document)
      drawWhenMeasured(doc)
    } finally {
      rebuilding = false
      // L'époque est relue APRÈS, et jamais avant : si un dessin de la source a eu lieu en
      // chemin, la copie qu'on vient de bâtir en tient déjà compte — la retenir périmée
      // ferait reconstruire une seconde fois pour rien.
      last_epoch = source.draw_epoch
    }
  }

  const refresh = (): void => {
    if (rebuilding) return
    const epoch = source.draw_epoch
    const data_changed = epoch !== last_epoch
    const size_changed = container.clientWidth !== last_w || container.clientHeight !== last_h
    if (!data_changed && !size_changed && !draw_deferred) return
    // Le parent a dessiné : filtre, niveau, étiquette de données, réconciliation — la copie est
    // périmée et se refait. Sinon il n'y a rien à relire : la zone se recadre en se redessinant.
    if (data_changed) rebuild()
    else {
      last_epoch = epoch
      if (view && !view.disposed) drawWhenMeasured(view)
    }
  }

  // La première construction pose l'époque elle-même (cf. le `finally` de `rebuild`).
  rebuild()

  // L'ABONNEMENT AU BUS DE LA SOURCE, posé APRÈS la première construction : rien ne doit
  // reconstruire pendant qu'on construit.
  const unsubscribe = source.menu_configuration?.subscribe(DRAW_TOPIC, refresh) ?? null

  // La taille de la case, surveillée par la vignette elle-même : l'hôte n'observe pas toutes les
  // cases, et une fenêtre détachée vit dans un autre document (cf. os#1422, même précaution).
  const Observer = container.ownerDocument.defaultView?.ResizeObserver
  const resize_observer = Observer ? new Observer(() => refresh()) : null
  resize_observer?.observe(container)

  return {
    redraw: refresh,
    cleanup: () => {
      resize_observer?.disconnect()
      unsubscribe?.()
      disposeView()
      container.innerHTML = ''
    }
  }
}
