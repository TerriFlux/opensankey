// Standard libs
import React, { ChangeEvent, FC, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Draggable, { DraggableProps } from 'react-draggable'
import { Box, Button, ButtonGroup, CloseButton, HStack, IconButton, Select, Spinner, Text, useToast } from '@chakra-ui/react'
import { ExternalLinkIcon } from '@chakra-ui/icons'

// react-draggable : typings embarqués optionnels vs @types requis (cf. SankeyPlusViews).
const DraggableComponent = Draggable as unknown as React.ComponentClass<Partial<DraggableProps>>

// OpenSankey / OpenSankey+ libs
import { useModelBinding } from '@terriflux/opensankey/src/hooks/useModelBinding'
import { Class_NodeElement } from '@terriflux/opensankey/src/Elements/Node'
import { Class_LinkElement } from '@terriflux/opensankey/src/Elements/Link'
import { makeId, Type_JSON } from '@terriflux/opensankey/src/types/Utils'
import { mainZoneUnitaryRect } from '@terriflux/opensankey/src/components/spreadsheet/MainZoneTabs'
import { LocalizedFileInput } from '@terriflux/opensankey/src/components/configmenus/MenuCommon'
import { Class_ApplicationDataOSP } from '../types/ApplicationDataOSP'
import { Class_DrawingAreaOSP, DrawingAreaPersistenceOSP } from '../types/DrawingAreaOSP'
import { createUnitarySankeyDetached, refocusUnitaryDrawingArea, UnitaryValueMode } from './UnitaryBoard'
import { loadExcelFileAsSankeyJSON } from './SankeyPlusViews'
import { drawNodeDonutOnGroup, drawNodeBarsOnGroup } from '@terriflux/opensankey/src/Charts/NodeStatsCharts'
import { drawAnalysisChart } from './AnalysisChartRender'
import { buildAnalysisChartData, deduceRepr } from './AnalysisChartData'
import { Type_AnalysisDescriptor } from '@terriflux/opensankey/src/Charts/AnalysisDescriptor'

// Conteneur DOM (id fixe) de la zone de dessin du panneau unitaire singleton.
const UNITARY_MODAL_CONTAINER_ID = 'unitary_sankey_app_singleton'

type SourceMode = 'local' | 'excel'

// ===========================================================================
// Panneau « Sankey unitaire » (singleton) — fusion local + Excel
// ---------------------------------------------------------------------------
// Point d'entrée unique des sankeys unitaires (bouton « Unit. » de la bannière +
// clic droit sur un nœud). Remplace l'ancien mécanisme « vue unitaire » : ici le
// sankey unitaire est rendu comme un SECOND diagramme indépendant, EN PLUS du
// diagramme principal (rendu simultané via DrawingArea.container_selector). Il ne
// crée PLUS de vue persistante.
//
// Le panneau est un membre de la « grande zone » (cf. MainZoneTabs OS base, à côté de
// Diagramme/Tableur/Doc) : son affichage suit menu_configuration.main_zone_show_unitary
// et il est DOCKÉ dans le bloc réservé de la colonne droite. Le contenu reste porté vers
// document.body (createPortal) — hors #sankey_app, sinon le redraw du diagramme principal
// effacerait son SVG (cf. DrawingArea._initDraw : selectAll('#draw_zoom').remove() scopé
// au container) — mais positionné EXACTEMENT sur mainZoneUnitaryRect (géométrie partagée
// avec MainZoneTabs, qui réserve/empile l'espace côté OS base).
//
// Deux sources :
//  - Local : le nœud central est choisi dans le diagramme courant (app_data).
//  - Excel : on importe un/des fichier(s) .xlsx (conversion serveur, cf.
//    SankeyExcelParser), chargés dans un app_data temporaire ; le nœud central est
//    alors choisi dans le sankey importé. Le rendu détaché est identique.
// ===========================================================================

export const ModalUnitarySankeyOSP: FC<{ app_data: Class_ApplicationDataOSP }> = ({ app_data }) => {
  const { t } = app_data
  // Affichage du panneau = membre de la grande zone (persisté, piloté par la topbar / le clic droit).
  const open = app_data.menu_configuration.main_zone_show_unitary
  // Nœud central courant (appartient au sankey de la source active).
  const [node, setNode] = useState<Class_NodeElement | null>(null)
  // Mode d'affichage des valeurs de flux : pourcentage (défaut), valeur brute, ou
  // normalisé (un flux de référence fixé à 1). Reconstruit l'unitaire à chaque changement.
  const [value_mode, setValueMode] = useState<UnitaryValueMode>('percent')
  // Flux de référence (id) pour le mode normalisé.
  const [normalize_link_id, setNormalizeLinkId] = useState<string | null>(null)

  // En mode publication (lecture seule), pas de choix de source ni d'import Excel : le sankey
  // unitaire se construit uniquement depuis le diagramme local (cf. is_editable).
  const editable = app_data.is_editable

  // Source des données : diagramme courant ou import Excel.
  const [source_mode, setSourceMode] = useState<SourceMode>('local')

  // --- État de l'import Excel ------------------------------------------------
  // app_data temporaire portant le sankey importé (jamais rendu directement : sert
  // de SOURCE à createUnitarySankeyDetached, qui en copie le diagramme).
  const local_app_data = useRef<Class_ApplicationDataOSP>(new Class_ApplicationDataOSP(false))
  // Sources chargées : { id -> { name, data(JSON) } }.
  const list_data = useRef<{ [x: string]: { name: string, data: Type_JSON } }>({})
  const [pending_files, setPendingFiles] = useState<File[]>([])
  const [is_processing, setIsProcessing] = useState(false)
  const [current_file_name, setCurrentFileName] = useState('')
  const [processed_count, setProcessedCount] = useState(0)
  const [total_to_process, setTotalToProcess] = useState(0)
  const [selected_data_id, setSelectedDataId] = useState('')
  // #247 — re-render forcé d'identité stable (list_data est un ref → ne déclenche pas de rendu
  // seul). Abonnements grande zone + resize relâchés au démontage.
  const forceUpdate = useModelBinding(undefined, refresh => {
    const off = app_data.menu_configuration.addMainZoneListener(refresh)
    window.addEventListener('resize', refresh)
    return () => { off(); window.removeEventListener('resize', refresh) }
  })
  // Compteur de RECONSTRUCTION : incrémenté quand les valeurs de la source changent
  // (changement de data tag sélectionné via la topbar). Ajouté aux deps de l'effet de
  // construction pour forcer un toJSON/fromJSON de la source mise à jour.
  const [rebuild_count, setRebuildCount] = useState(0)

  // (Le re-rendu ci-dessus repositionne le panneau sur mainZoneUnitaryRect quand la grande zone
  // change — toggle, ratios, layout doc, tableur… — ou que la fenêtre est redimensionnée : porté
  // vers document.body, il ne suit pas naturellement la mise en page de MainZoneTabs.)

  // Ref du conteneur draggable (mode détaché en dialogue flottant).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const nodeRef = useRef<any>(null)
  const da_ref = useRef<Class_DrawingAreaOSP | null>(null)
  // Nœud central déjà affiché par la DA détachée courante : permet à l'effet de
  // re-focalisation (léger) de ne rien faire quand la construction (lourde) vient
  // justement de poser ce nœud, et inversement.
  const built_for_node = useRef<string | undefined>(undefined)
  // Lecture « live » du nœud courant pour l'effet de construction, qui ne dépend PAS
  // de node_id (sinon il reconstruirait tout à chaque changement de nœud).
  const node_live = useRef<Class_NodeElement | null>(null)
  node_live.current = node

  // Initialiser le menu config de l'app_data temporaire (requis par fromJSON/dessin).
  // La config ne dépend plus de hooks React ; on lui injecte le toast Chakra acquis ici
  // (useToast, hook → corps du composant).
  const toast = useToast()
  local_app_data.current.createNewMenuConfiguration(toast)

  // app_data de la source active (diagramme courant ou import Excel).
  const source_app_data = source_mode === 'local' ? app_data : local_app_data.current

  // Nœuds candidats comme centre unitaire = nœuds visibles de la source, MOINS les
  // nœuds d'échange (import/export, tag `echange`). Ces derniers sont des extrémités à
  // flux unique (un seul flux entrant/sortant vers le nœud d'échange parent) : ils n'ont
  // pas de sens comme nœud central d'un sankey unitaire et ne doivent donc pas être
  // proposés (ni dans le sélecteur, ni comme nœud par défaut).
  const centralCandidates = (sad: Class_ApplicationDataOSP): Class_NodeElement[] => {
    const sankey = (sad.drawing_area as Class_DrawingAreaOSP).sankey
    const echangeTag = sankey.node_taggs_dict['type de noeud']?.tags_dict['echange']
    return (sankey.visible_nodes_list_sorted as Class_NodeElement[])
      .filter(n => !(echangeTag && n.hasGivenTag(echangeTag)))
  }

  // Reconstruction du board quand les valeurs de la source changent (changement de
  // data tag sélectionné via la topbar). Ne concerne que la source locale (l'import
  // Excel est indépendant du data tag du diagramme principal).
  app_data.menu_configuration_osp.ref_to_unitary_board_data_tag_updater.current = () => {
    if (source_mode === 'local') setRebuildCount(c => c + 1)
  }

  // Ouverture depuis le bouton « Unit. » (sans nœud) ou le clic droit (avec nœud).
  app_data.menu_configuration_osp.ref_open_unitary_sankey_modal.current = (n: Class_NodeElement | null) => {
    setSourceMode('local')
    if (n) setNode(n)
    app_data.menu_configuration.main_zone_show_unitary = true
  }

  // Bouton « Unit. » de la topbar (cf. UnitaryTabButton, OS base) + points d'entrée OS+ (clic droit,
  // onglet tooltip) : toggle l'affichage du panneau dans la grande zone. Assigné à chaque rendu
  // (idempotent), même panneau fermé, pour rester câblé. La disponibilité et le surlignage du bouton
  // suivent désormais has_sankey_plus / main_zone_show_unitary (le setter notifie la grande zone).
  app_data.menu_configuration.toggleUnitaryTab = () => {
    app_data.menu_configuration.main_zone_show_unitary = !app_data.menu_configuration.main_zone_show_unitary
  }
  useEffect(() => {
    app_data.menu_configuration.unitary_tab_available = app_data.has_sankey_plus
    app_data.menu_configuration.notifyMainZone()
  }, [app_data.has_sankey_plus])

  // Hook consommé par l'onglet « Sankey unitaire » du tooltip de nœud (OS) : dessine
  // un sankey unitaire détaché focalisé sur `n` dans le conteneur DOM passé, EN PLUS
  // du diagramme principal. Renvoie un handle (redraw au resize + cleanup à la fermeture).
  app_data.draw_unitary_in_container = (n: Class_NodeElement, container_selector: string) => {
    const da = createUnitarySankeyDetached(app_data, n, container_selector)
    // Pare-feu : resync du DOM du diagramme principal après construction (cf. useEffect).
    app_data.drawing_area.draw()
    return {
      redraw: () => da.draw(),
      cleanup: () => { da.unDraw(); da.delete() }
    }
  }

  // Hook consommé par l'onglet « Analyse » du tooltip de nœud (OS#1278) : dessine
  // le graphique décrit par l'attribut analysis_descriptor du nœud (couronne /
  // histogramme) dans le conteneur DOM passé. Redessin léger (pas de reconstruction).
  app_data.draw_analysis_in_container = (element: Class_NodeElement | Class_LinkElement, container_selector: string) => {
    const el = document.querySelector(container_selector) as HTMLElement | null
    if (!el) return
    const descriptor = element.getElementProperty('analysis_descriptor') as Type_AnalysisDescriptor | undefined
    if (!descriptor) return
    const subject = element instanceof Class_NodeElement
      ? { kind: 'node' as const, node: element }
      : { kind: 'flux' as const, link: element as Class_LinkElement }
    const draw = () => drawAnalysisChart(el, subject, descriptor, {
      others_label: app_data.t('view.unit_chart_others'),
      empty_label: app_data.t('view.unit_chart_empty')
    })
    draw()
    return { redraw: draw, cleanup: () => { el.innerHTML = '' } }
  }

  // Hook consommé par NodeDrawShape (OS#1278) : dessine le nœud EN COURONNE ou EN
  // HISTOGRAMME selon le choix de la fenêtre d'analyse (descripteur). Peut porter
  // sur les dataTags (comparaison → barres) autant que sur une décomposition.
  // Couleurs TOUJOURS du modèle.
  // Renvoie true si un graphique a été dessiné ; false → NodeDrawShape retombe sur
  // la forme normale (sinon un descripteur pointant une dimension/tag supprimé
  // laisserait le nœud invisible).
  app_data.draw_node_analysis_overlay = (node: Class_NodeElement, group_el: SVGGElement, width: number, height: number) => {
    const descriptor = node.getElementProperty('analysis_descriptor') as Type_AnalysisDescriptor | undefined
    if (!descriptor || (!descriptor.decompose && !descriptor.compare)) return false
    const data = buildAnalysisChartData({ kind: 'node', node }, descriptor)
    // Offset de marge : la forme normale du nœud est translatée de (-margin_left,
    // -margin_top) ; le graphique reprend ce calage pour rester dans ses bornes.
    const geom = { width, height, ox: -node.shape_margin_left, oy: -node.shape_margin_top }
    // Couronne seulement pour une décomposition pure sans override barres ; sinon
    // histogramme (comparaison pure, croisement, ou override).
    if (deduceRepr(descriptor) === 'donut') {
      return drawNodeDonutOnGroup(group_el, data.series[0]?.parts ?? [], geom)
    }
    return drawNodeBarsOnGroup(group_el, data.series, geom)
  }

  const node_id = node?.id

  // Nœud par défaut : à l'ouverture / au changement de source / de fichier, on
  // (re)pointe le nœud central sur le 1er nœud visible de la source active si le
  // nœud courant est absent ou n'appartient pas à cette source.
  useEffect(() => {
    if (!open) return
    const nodes = centralCandidates(source_app_data)
    if (nodes.length === 0) {
      if (node) setNode(null)
      return
    }
    if (!node || !nodes.some(n => n.id === node.id)) {
      setNode(nodes[0] as Class_NodeElement)
    }
    // node volontairement hors deps (évite une boucle ; lu en lecture seule).
  }, [open, source_mode, selected_data_id])

  // CONSTRUCTION (lourde) du sankey unitaire détaché. Ne dépend QUE de la source et du
  // mode d'affichage : la copie JSON, le fromJSON et la création des ViewTagGroups (un
  // tag par nœud) sont indépendants du nœud choisi. Le changement de nœud passe par
  // l'effet de re-focalisation ci-dessous (léger). node est lu en live (hors deps) pour
  // la focalisation initiale ; une focalisation incorrecte serait de toute façon corrigée
  // par l'effet de refocus juste après.
  useEffect(() => {
    if (!open) return
    const src = source_app_data
    const nodes = centralCandidates(src)
    if (nodes.length === 0) return
    const wanted = node_live.current
    const focus = (wanted && nodes.some(n => n.id === wanted.id))
      ? wanted
      : (nodes[0] as Class_NodeElement)
    // Construction protégée : une exception ici casserait le composant (React Refresh
    // peut rester bloqué en erreur). On garantit l'ouverture ; le détail va en console.
    try {
      const da = createUnitarySankeyDetached(
        app_data, focus, '#' + UNITARY_MODAL_CONTAINER_ID, value_mode, normalize_link_id, src
      )
      da_ref.current = da
      built_for_node.current = focus.id
      // Pare-feu : redessiner le diagramme principal depuis son modèle (intact) après
      // construction de l'unitaire, pour resynchroniser son DOM. Sûr car le modal est
      // rendu hors de #sankey_app (portal). Une seule fois (à la construction), plus à
      // chaque changement de nœud.
      app_data.drawing_area.draw()
    } catch (e) {
      console.error('[unitary] construction du sankey unitaire échouée:', e)
    }

    // Recadrage sur redimensionnement du conteneur. Le panneau étant DOCKÉ (taille pilotée par le
    // flex de la colonne droite), sa taille change : (a) à l'ouverture, une fois la mise en page flex
    // résolue — le draw() synchrone ci-dessus a pu tomber sur un conteneur de taille nulle, donc fitté
    // à la fenêtre ; (b) au resize de fenêtre ; (c) au déplacement du séparateur tableur/doc ↔ unitaire.
    // On redessine à CHAQUE changement de taille non nul (pas de skip du 1er callback : avec le flex la
    // 1re taille réelle EST ce callback, et la sauter laissait le board fitté à la fenêtre).
    const el = document.getElementById(UNITARY_MODAL_CONTAINER_ID)
    let ro: ResizeObserver | null = null
    let raf = 0
    let prev_w = 0
    let prev_h = 0
    if (el && typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => {
        const w = el.clientWidth
        const h = el.clientHeight
        if (w <= 0 || h <= 0 || (w === prev_w && h === prev_h)) return
        prev_w = w
        prev_h = h
        if (raf) cancelAnimationFrame(raf)
        raf = requestAnimationFrame(() => { da_ref.current?.draw() })
      })
      ro.observe(el)
    }

    return () => {
      if (raf) cancelAnimationFrame(raf)
      ro?.disconnect()
      da_ref.current?.unDraw()
      da_ref.current?.delete()
      da_ref.current = null
      built_for_node.current = undefined
    }
    // normalize_link_id VOLONTAIREMENT hors deps : il change à CHAQUE nœud (flux de
    // référence par défaut, cf. effet plus bas) et le remettre ici reconstruisait tout le
    // diagramme (toJSON/fromJSON) à chaque changement de nœud — par-dessus le refocus léger,
    // d'où la lenteur. Le mode normalisé est mis à jour par l'effet léger dédié ci-dessous.
  }, [open, value_mode, source_mode, selected_data_id, rebuild_count])

  // MODE NORMALISÉ — MAJ LÉGÈRE du flux de référence sans reconstruction. Seul
  // sankey.normalised_link dépend de normalize_link_id (les types d'unité des styles sont
  // posés à la construction selon value_mode). On le met à jour puis on redessine, au lieu
  // de reconstruire toute la DA. No-op hors mode normalisé.
  useEffect(() => {
    if (!open || value_mode !== 'normalized') return
    const da = da_ref.current
    if (!da) return
    da.sankey.normalised_link = normalize_link_id
      ? da.sankey.links_dict[normalize_link_id]
      : undefined
    da.draw()
  }, [normalize_link_id, value_mode])

  // RECADRAGE piloté par la GÉOMÉTRIE du bloc réservé (mainZoneUnitaryRect). Le panneau étant docké,
  // sa taille change avec la fenêtre, le ratio du séparateur tableur/doc ↔ unitaire, le toggle du
  // tableur/doc, etc. — tous reflétés dans le rect. On redessine (areaAutoFit refit dans draw()) à
  // chaque changement de dimensions, via rAF (après la mise en page). Complète le ResizeObserver (qui
  // ne capte que les variations propres au conteneur) et garantit le refit même quand React repositionne
  // le panneau sans que le conteneur ne déclenche l'observer au bon moment.
  const geom_rect = open ? mainZoneUnitaryRect(app_data) : null
  const geom_key = geom_rect ? Math.round(geom_rect.width) + 'x' + Math.round(geom_rect.height) : ''
  useEffect(() => {
    if (!open) return
    const id = requestAnimationFrame(() => da_ref.current?.draw())
    return () => cancelAnimationFrame(id)
  }, [open, geom_key])

  // RE-FOCALISATION (légère) au changement de nœud : re-sélectionne le tag unitaire du
  // nouveau nœud sur la DA déjà construite, sans refaire toJSON/fromJSON. C'est ce qui
  // rend le survol/parcours « instantané ».
  useEffect(() => {
    if (!open || !node) return
    const da = da_ref.current
    // Pas encore construite → l'effet de construction s'en charge (focalisation initiale).
    if (!da) return
    // Déjà affiché ce nœud (construction qui vient de tomber) → rien à faire.
    if (built_for_node.current === node.id) return
    const src = source_app_data
    const nodes = centralCandidates(src)
    if (!nodes.some(n => n.id === node.id)) return
    try {
      refocusUnitaryDrawingArea(da, node)
      da.draw()
      built_for_node.current = node.id
    } catch (e) {
      console.error('[unitary] re-focalisation du sankey unitaire échouée:', e)
    }
  }, [node_id])

  // Flux de référence par défaut : au changement de nœud central (ou de source), on
  // restaure le flux mémorisé sur le nœud s'il est encore visible, sinon le 1er flux
  // visible. Garantit que le dropdown reste cohérent avec le sankey unitaire affiché.
  useEffect(() => {
    if (!open || !node) return
    const links = [
      ...(node.input_links_list as Class_LinkElement[]),
      ...(node.output_links_list as Class_LinkElement[])
    ].filter(l => l.is_visible)
    const stored = node.unitary_ref_link_id
    const valid = stored && links.some(l => l.id === stored)
    setNormalizeLinkId(valid ? stored : (links[0]?.id ?? null))
  }, [node_id, source_mode, selected_data_id])

  // --- Import Excel : upload + poll + récupération (cf. SankeyPlusViews) -------
  const loadDataSource = (key: string) => {
    const entry = list_data.current[key]
    if (!entry) return
    DrawingAreaPersistenceOSP.fromJSON(local_app_data.current.drawing_area as Class_DrawingAreaOSP, entry.data)
    setSelectedDataId(key)
  }

  const processOneFile = async (file: File): Promise<void> => {
    setCurrentFileName(file.name)
    // Conversion serveur via la séquence robuste partagée (convert/launch +
    // poll + retrieve_result) : elle envoie les input/output_options par défaut
    // (sans quoi le parse échoue sur les checks symétriques et output.json n'est
    // jamais écrit → retrieve_result 404) et rejette proprement sur statut
    // 'failed' au lieu d'appeler retrieve_result sur un fichier absent.
    try {
      const jsonData = await loadExcelFileAsSankeyJSON(app_data, file)
      jsonData['version'] = local_app_data.current.version
      list_data.current[makeId('data_src_')] = { name: file.name, data: jsonData }
    } catch (e) {
      console.error('[unitary] import Excel échoué:', e)
    }
  }

  const processQueue = async (files: File[]) => {
    setIsProcessing(true)
    setTotalToProcess(files.length)
    setProcessedCount(0)
    for (let i = 0; i < files.length; i++) {
      await processOneFile(files[i])
      setProcessedCount(i + 1)
    }
    setIsProcessing(false)
    setCurrentFileName('')
    setPendingFiles([])
    // Sélectionner la 1re source chargée si aucune ne l'est encore.
    const keys = Object.keys(list_data.current)
    if (keys.length > 0 && !(selected_data_id in list_data.current)) {
      loadDataSource(keys[0])
    } else {
      forceUpdate()
    }
  }

  const removeDataSource = (key: string) => {
    delete list_data.current[key]
    if (key === selected_data_id) {
      const remaining = Object.keys(list_data.current)
      if (remaining.length > 0) loadDataSource(remaining[0])
      else setSelectedDataId('')
    }
    forceUpdate()
  }

  if (!app_data.has_sankey_plus || !open) return <></>

  // Nœuds sélectionnables comme centre (source active), hors nœuds d'échange.
  const selectable_nodes = centralCandidates(source_app_data)

  // Répartition en trois groupes par type de nœud (tag du groupe « type de noeud ») :
  //  - produits  → « Processus de marché »
  //  - secteurs  → « Processus de transformation »
  //  - le reste  → « Indifférenciés »
  const node_type_tagg = (source_app_data.drawing_area as Class_DrawingAreaOSP)
    .sankey.node_taggs_dict['type de noeud']
  const product_tag = node_type_tagg?.tags_dict['produit']
  const sector_tag = node_type_tagg?.tags_dict['secteur']
  const node_groups: { key: string, label: string, nodes: Class_NodeElement[] }[] = [
    { key: 'products', label: t('view.unit_group_products'), nodes: [] },
    { key: 'sectors', label: t('view.unit_group_sectors'), nodes: [] },
    { key: 'other', label: t('view.unit_group_other'), nodes: [] }
  ]
  for (const n of selectable_nodes) {
    if (product_tag && n.hasGivenTag(product_tag)) node_groups[0].nodes.push(n)
    else if (sector_tag && n.hasGivenTag(sector_tag)) node_groups[1].nodes.push(n)
    else node_groups[2].nodes.push(n)
  }

  // Flux du nœud central VISIBLES (entrées + sorties) = exactement les flux affichés
  // dans le sankey unitaire courant → seuls candidats valides comme flux de référence
  // du mode normalisé. Les ids sont préservés par la copie JSON (résolus côté unitaire).
  const central_links = node ? [
    ...(node.input_links_list as Class_LinkElement[]),
    ...(node.output_links_list as Class_LinkElement[])
  ].filter(l => l.is_visible) : []
  const link_label = (l: Class_LinkElement) => l.source.name + ' → ' + l.target.name

  const handleModeChange = (mode: UnitaryValueMode) => setValueMode(mode)

  // Sélection du nœud central AU CLIC uniquement. L'ancienne présélection au survol
  // (débounce 120 ms) refocalisait le board au moindre passage de souris sur la liste
  // → affichage instable et sélections accidentelles.
  const pickNode = (n: Class_NodeElement) => setNode(n)

  // Choix d'un flux de référence : on le mémorise SUR le nœud central (restauré quand
  // on revient sur ce nœud, cf. effet « ref par défaut »), en plus de l'état local.
  const handleRefChange = (id: string | null) => {
    setNormalizeLinkId(id)
    if (node) node.unitary_ref_link_id = id
  }

  const nb_loaded = Object.keys(list_data.current).length

  const sourceButton = (mode: SourceMode, label: string) => (
    <Button
      size='sm'
      variant={source_mode === mode
        ? 'menuconfigpanel_option_button_activated'
        : 'menuconfigpanel_option_button'}
      onClick={() => setSourceMode(mode)}
    >
      {label}
    </Button>
  )

  const modeButton = (mode: UnitaryValueMode, label: string) => (
    <Button
      size='sm'
      variant={value_mode === mode
        ? 'menuconfigpanel_option_button_activated'
        : 'menuconfigpanel_option_button'}
      onClick={() => handleModeChange(mode)}
    >
      {label}
    </Button>
  )

  const detached = app_data.menu_configuration.main_zone_unitary_detached
  // Géométrie du bloc réservé (mode docké, partagée avec MainZoneTabs). En détaché, pas de rect :
  // le panneau est rendu en dialogue flottant draggable.
  const rect = detached ? null : mainZoneUnitaryRect(app_data)
  const toggleDetach = () => { app_data.menu_configuration.main_zone_unitary_detached = !detached }

  // Contenu commun aux deux modes (docké / dialogue flottant) : en-tête (poignée de drag + boutons
  // détacher/rattacher et fermer) puis barre de contrôle + sélecteur de nœud + zone de dessin.
  const panelContent = (
    <>
      {/* En-tête : titre (nœud central) + détacher/rattacher + fermeture. Classe de poignée de drag
          utilisée par react-draggable en mode détaché. */}
      <Box
        className='unitary_drag_handle'
        display='flex'
        alignItems='center'
        justifyContent='space-between'
        gap='0.5rem'
        padding='0.3rem 0.6rem'
        borderBottom='1px solid'
        borderColor='gray.200'
        flex='0 0 auto'
        cursor={detached ? 'move' : 'default'}
      >
        <Text fontSize='0.8rem' fontWeight='600' color='gray.700' isTruncated>
          {t('view.unit')}{node ? ' — ' + node.name : ''}
        </Text>
        <HStack spacing='1' flexShrink={0}>
          <IconButton
            size='sm'
            variant='ghost'
            aria-label='detach-unitary'
            icon={<ExternalLinkIcon boxSize='0.9rem' />}
            onClick={toggleDetach}
            title={detached ? 'Rattacher le panneau dans la grande zone' : 'Détacher en dialogue flottant'}
          />
          <CloseButton
            size='sm'
            onClick={() => { app_data.menu_configuration.main_zone_show_unitary = false }}
          />
        </HStack>
      </Box>
      <Box display='flex' flexDirection='column' flex='1 1 0' minHeight={0} padding='0.5rem'>
        {/* Barre de contrôle : source + (import Excel) + mode d'affichage des valeurs.
              flex '0 1 auto' + maxHeight + scroll : ne mange pas tout le panneau quand il est court. */}
        <Box
          flex='0 1 auto'
          maxHeight='55%'
          overflowY='auto'
          marginBottom='2'
          padding='2'
          borderRadius='md'
          border='1px solid'
          borderColor='gray.200'
          bg='gray.50'
          display='grid'
          gridRowGap='2.5'
        >
          {/* Source des données : diagramme courant ou import Excel. Masqué en lecture seule
                (publication) : seule la source locale est disponible, pas d'import. */}
          {editable && (
            <HStack gap='3' flexWrap='wrap'>
              <Text fontSize='sm' fontWeight='600' color='gray.600' minWidth='6rem'>
                {t('Menu.Transformation.sourceType')}
              </Text>
              <ButtonGroup size='sm' spacing='1'>
                {sourceButton('local', t('view.unit_tab_local'))}
                {sourceButton('excel', t('view.unit_tab_excel'))}
              </ButtonGroup>
            </HStack>
          )}

          {/* Import Excel : sélection de fichier + liste des sources chargées. */}
          {editable && source_mode === 'excel' && (
            <Box paddingBottom='2' display='grid' gridRowGap='0.4rem'>
              <Box display='grid' gridTemplateColumns='1fr auto' gap='0.4rem' alignItems='center'>
                <LocalizedFileInput
                  accept='.xlsx'
                  multiple
                  disabled={is_processing}
                  currentFileName={pending_files.length ? pending_files.map((f) => f.name).join(', ') : ''}
                  onChange={(evt: ChangeEvent<HTMLInputElement>) => {
                    const files = (evt.target as HTMLInputElement).files
                    setPendingFiles(files ? Array.from(files) : [])
                  }}
                />
                <Button
                  size='sm'
                  height='1.9rem'
                  colorScheme='blue'
                  isDisabled={is_processing || pending_files.length === 0}
                  onClick={() => processQueue(pending_files)}
                >
                  {is_processing
                    ? `${processed_count}/${total_to_process}`
                    : pending_files.length > 1
                      ? `${t('Menu.ouvrir')} (${pending_files.length})`
                      : t('Menu.ouvrir')}
                </Button>
              </Box>
              {is_processing && (
                <Box display='flex' alignItems='center' gap='0.4rem' fontSize='sm' color='gray.600'>
                  <Spinner size='xs' /><Text>{current_file_name}</Text>
                </Box>
              )}
              {nb_loaded > 0 && (
                <Box border='1px solid' borderColor='gray.200' borderRadius='4px' overflow='hidden'>
                  {Object.entries(list_data.current).map(([key, data], idx, arr) => {
                    const is_active = key === selected_data_id
                    return <Box
                      key={key}
                      display='grid'
                      gridTemplateColumns='1fr auto'
                      alignItems='center'
                      padding='0.15rem 0.4rem'
                      gap='0.4rem'
                      borderBottom={idx < arr.length - 1 ? '1px solid' : 'none'}
                      borderBottomColor='gray.100'
                      bg={is_active ? 'openSankey.50' : 'transparent'}
                      cursor='pointer'
                      _hover={{ bg: is_active ? 'openSankey.50' : 'gray.50' }}
                      onClick={() => { if (key !== selected_data_id) loadDataSource(key) }}
                    >
                      <Text fontSize='sm' fontWeight={is_active ? '600' : '400'} isTruncated>{data.name}</Text>
                      <CloseButton size='sm' onClick={(e) => { e.stopPropagation(); removeDataSource(key) }} />
                    </Box>
                  })}
                </Box>
              )}
            </Box>
          )}

          {/* Mode d'affichage des valeurs de flux : pourcentage (défaut), valeur brute,
                ou normalisé (un flux de référence fixé à 1, choisi dans le dropdown).
                (Les graphiques couronne/histogramme sont désormais dans l'onglet
                Analyse de l'inspecteur, cf. OS#1278.) */}
          <HStack gap='3' flexWrap='wrap'>
            <Text fontSize='sm' fontWeight='600' color='gray.600' minWidth='6rem'>
              {t('view.choose_link_ref_sankey_unit')}
            </Text>
            <ButtonGroup size='sm' spacing='1'>
              {modeButton('percent', t('view.unit_value_mode_percent'))}
              {modeButton('value', t('view.unit_value_mode_value'))}
              {modeButton('normalized', t('view.unit_value_mode_normalized'))}
            </ButtonGroup>
            {value_mode === 'normalized' && (
              <Select
                size='sm'
                maxWidth='18rem'
                bg='white'
                value={normalize_link_id ?? ''}
                onChange={(e) => handleRefChange(e.target.value || null)}
                placeholder={t('view.unit_value_mode_ref')}
              >
                {central_links.map((l) => (
                  <option key={l.id} value={l.id}>{link_label(l)}</option>
                ))}
              </Select>
            )}
          </HStack>
        </Box>

        {/* Sélecteur de nœud central À GAUCHE de la zone de dessin (flex row, remplit la
              hauteur restante). Sélection au CLIC uniquement (pas de présélection au
              survol : refocalisations intempestives). */}
        <Box display='flex' flexDirection='row' alignItems='stretch' gap='2' flex='1 1 0' minHeight={0}>
          <Box
            width='12rem'
            minWidth='9rem'
            maxWidth='45%'
            height='100%'
            overflowY='auto'
            borderRight='1px solid var(--chakra-colors-gray-200, #e2e8f0)'
            paddingRight='1'
          >
            {node_groups.filter(g => g.nodes.length > 0).map((g) => (
              <Box key={g.key} marginBottom='1.5'>
                <Text
                  fontSize='xs'
                  fontWeight='700'
                  textTransform='uppercase'
                  letterSpacing='0.03em'
                  color='gray.500'
                  paddingX='2'
                  paddingY='0.5'
                >
                  {g.label}
                </Text>
                {g.nodes.map((n) => (
                  <Box
                    key={n.id}
                    onClick={() => pickNode(n as Class_NodeElement)}
                    cursor='pointer'
                    paddingX='2'
                    paddingY='1'
                    borderRadius='4px'
                    whiteSpace='nowrap'
                    overflow='hidden'
                    textOverflow='ellipsis'
                    fontWeight={n.id === node_id ? 'bold' : 'normal'}
                    background={n.id === node_id ? 'var(--chakra-colors-blue-100, #bee3f8)' : 'transparent'}
                    _hover={{ background: 'var(--chakra-colors-gray-100, #edf2f7)' }}
                  >
                    {n.name}
                  </Box>
                ))}
              </Box>
            ))}
          </Box>
          <div
            id={UNITARY_MODAL_CONTAINER_ID}
            style={{
              position: 'relative',
              flex: '1 1 0',
              minWidth: 0,
              minHeight: 0,
              overflow: 'hidden',
              background: 'white'
            }}
          />
        </Box>
      </Box>
    </>
  )

  // Portal sur document.body : le SVG unitaire NE doit PAS vivre dans #sankey_app (le redraw du
  // diagramme principal fait selectAll('#draw_zoom').remove() scopé au container, cf. _initDraw).
  //  - DÉTACHÉ : dialogue flottant draggable (poignée = en-tête), redimensionnable (resize CSS).
  //  - DOCKÉ : position fixe sur `rect` (bloc réservé de la colonne droite, cf. MainZoneTabs).
  if (detached) {
    return createPortal(
      <DraggableComponent
        nodeRef={nodeRef}
        handle='.unitary_drag_handle'
        defaultPosition={{ x: window.innerWidth / 4, y: window.innerHeight / 8 }}
      >
        <Box
          ref={nodeRef}
          position='fixed'
          top='0'
          left='0'
          zIndex={1500}
          width='46vw'
          height='62vh'
          minWidth='30rem'
          minHeight='22rem'
          background='white'
          borderRadius='md'
          boxShadow='lg'
          border='1px solid #e2e8f0'
          display='flex'
          flexDirection='column'
          overflow='hidden'
          resize='both'
        >
          {panelContent}
        </Box>
      </DraggableComponent>,
      document.body
    )
  }
  if (!rect) return <></>
  return createPortal(
    <Box
      position='fixed'
      top={`${rect.top}px`}
      left={`${rect.left}px`}
      width={`${rect.width}px`}
      height={`${rect.height}px`}
      zIndex={21}
      background='white'
      borderLeft='1px solid #e2e8f0'
      borderTop='1px solid #e2e8f0'
      boxShadow='-1px 0 4px rgba(0,0,0,0.06)'
      display='flex'
      flexDirection='column'
      overflow='hidden'
    >
      {panelContent}
    </Box>,
    document.body
  )
}
