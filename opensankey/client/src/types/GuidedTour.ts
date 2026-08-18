// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2025 TerriFlux
// ==================================================================================================
// Author        : Vincent LE DOZE & Vincent CLAVEL & Julien Alapetite for TerriFlux
// ==================================================================================================

// #1255 — Scénario de la visite guidée, extrait de Class_ApplicationData.setSteps().
//
// Principe : un tour COURT et ACTIF. L'ancien scénario énumérait une vingtaine de zones de
// l'interface (« voici le menu Fichier », « voici le menu Export ») ; l'utilisateur regardait des
// flèches pointer des menus et n'en retenait rien. Ici il FAIT les deux gestes fondamentaux —
// tracer un flux, lui donner une valeur — et le tour n'avance qu'ensuite (détection par scrutation,
// cf. _watch). Le reste de l'interface est résumé en quatre étapes.
//
// Deux modes selon l'état du diagramme AU LANCEMENT (figé dans `_started_empty` par buildSteps) :
//   - diagramme vide (cas nominal depuis l'écran d'accueil) : étapes 1 et 2 attendent le geste ;
//   - diagramme existant (relance depuis Aide) : étapes descriptives, aucune attente, aucun
//     contenu créé ni supprimé — on ne touche pas au travail de l'utilisateur.
//
// Règle de nettoyage : on ne retire QUE ce que le tour a créé lui-même (le flux de repli posé
// quand l'utilisateur passe l'étape sans tracer). Ce que l'utilisateur a tracé pendant le tour est
// son travail naissant et reste en place.
//
// #1243 — le panneau de configuration EST l'inspecteur : il dérive sa cible de la sélection. Le
// tour ne force donc plus de type ni d'élément (la matrice type×élément est déposée) ; il
// sélectionne l'élément à montrer et ouvre le panneau, qui suit.

import { StepType } from '@reactour/tour'

import type { Class_ApplicationData } from './ApplicationData'
import type { Class_LinkElement } from '../Elements/Link'
import { INSPECTOR_TAB_VALUE_ID } from './inspectorTabIds'

/**
 * Contrôle du tour, injecté par un composant monté SOUS le `TourProvider` (cf. `TourBridge` dans
 * App.tsx) : `setCurrentStep` n'est accessible que via le hook `useTour`, donc hors de portée du
 * modèle. Le modèle passe par ce slot pour faire avancer le tour quand il détecte un geste.
 */
export type Type_TourControl = {
  goToStep: (index: number) => void
}

/** Période de scrutation des gestes de l'utilisateur (ms). Actif seulement pendant l'étape. */
const WATCH_PERIOD_MS = 300

/** Valeur posée sur le flux de repli, quand l'utilisateur passe les étapes actives sans agir. */
const FALLBACK_LINK_VALUE = 100

export class Class_GuidedTour {

  private _app_data: Class_ApplicationData

  /** Contrôle du tour (React). Null tant que le TourProvider n'a pas monté son pont. */
  private _control: Type_TourControl | null = null

  /** Scrutateur du geste en cours. Toujours arrêté par l'`actionAfter` de l'étape qui l'a posé. */
  private _watch_timer: ReturnType<typeof setInterval> | null = null

  /** Diagramme vide au lancement : seul ce cas propose les gestes et crée un flux de repli. */
  private _started_empty = false

  /** Nœuds créés par le TOUR (flux de repli) — les seuls que le nettoyage retirera. */
  private _fallback_node_ids: string[] = []

  /** Tiroir de configuration déjà ouvert au lancement : si non, le tour le referme à la fin. */
  private _drawer_was_open = false

  /** Pop-up de config déjà épinglée au lancement : si non, le tour retire son épingle à la fin. */
  private _config_was_pinned = false

  constructor(app_data: Class_ApplicationData) {
    this._app_data = app_data
  }

  public set control(_: Type_TourControl | null) { this._control = _ }

  // LANCEMENT ========================================================================================

  /**
   * Point d'entrée unique du tour (écran d'accueil, menu Aide).
   *
   * Le scénario ne prend tout son sens que sur un diagramme vierge : l'utilisateur doit pouvoir
   * tracer SON premier flux. Si un diagramme est en cours, on demande donc la permission de le
   * supprimer — jamais sans, c'est son travail. S'il refuse, le tour se déroule quand même, mais
   * en mode descriptif sur le diagramme conservé (cf. `_started_empty`) : refuser d'effacer ne
   * doit pas priver de la visite.
   *
   * `openTour` est fourni par l'appelant car ouvrir le tour passe par `useTour`, hors de portée
   * du modèle.
   */
  public start(openTour: () => void): void {
    if (this._sankey.nodes_list.length > 0
      && window.confirm(this._app_data.t('guide.confirm_clear'))) {
      this._app_data.reset({})
      this._app_data.drawing_area.draw()
    }
    // Après le reset : `buildSteps` fige le mode sur le diagramme RÉSULTANT.
    this._app_data.setSteps()
    // Le TourProvider ne se démonte jamais et garde `currentStep` d'un lancement à l'autre (son
    // `startAt` n'est qu'une valeur initiale). Sans cette remise à zéro, relancer la visite la
    // rouvre sur la dernière étape atteinte — et sur un index qui n'existe même plus si le
    // scénario a raccourci entre-temps (le mode descriptif n'a pas le même nombre d'étapes).
    this._goToStep(0)
    openTour()
  }

  // GESTES ===========================================================================================

  /**
   * Scrute `predicate` jusqu'à ce qu'il soit vrai, puis exécute `on_fulfilled` une seule fois.
   *
   * La scrutation est préférée à un écouteur sur le modèle : un flux peut naître de trois gestes
   * différents (glisser depuis le fond, glisser depuis un nœud existant, menu contextuel) et une
   * valeur peut être saisie depuis l'inspecteur comme depuis le tableur. Scruter l'état final
   * couvre tous ces chemins sans instrumenter chaque site d'appel, et ne vit que le temps de
   * l'étape.
   */
  private _watch(predicate: () => boolean, on_fulfilled: () => void): void {
    this._stopWatch()
    this._watch_timer = setInterval(
      () => {
        if (!predicate()) return
        this._stopWatch()
        on_fulfilled()
      },
      WATCH_PERIOD_MS)
  }

  private _stopWatch(): void {
    if (this._watch_timer === null) return
    clearInterval(this._watch_timer)
    this._watch_timer = null
  }

  private _goToStep(index: number): void {
    this._control?.goToStep(index)
  }

  // ÉTAT DU DIAGRAMME ================================================================================

  private get _sankey() { return this._app_data.drawing_area.sankey }

  /** Le flux sur lequel portent les étapes « valeur » et « inspecteur » (le premier venu). */
  private _firstLink(): Class_LinkElement | undefined { return this._sankey.links_list[0] }

  private _hasLink(): boolean { return this._sankey.links_list.length > 0 }

  private _hasLinkValue(): boolean {
    const link = this._firstLink()
    return (link !== undefined) && ((link.valueCurrent ?? 0) > 0)
  }

  /**
   * Ouvre le panneau de configuration. Appelé dès la première étape : ses cibles doivent être dans
   * le DOM avant que leur étape ne devienne active (cf. buildSteps).
   */
  private _openConfigDrawer(): void {
    this._app_data.menu_configuration.openConfigMenu()
    // OS#321 — ouverte en pop-up NON ÉPINGLÉE, la config est congédiée par le premier clic posé
    // ailleurs… c'est-à-dire par le tracé même que l'étape 1 demande. Or un panneau fermé est
    // DÉMONTÉ : l'étape « valeur » viserait alors une cible absente et le masque griserait tout
    // l'écran. Épinglée, la pop-up survit aux gestes ; finish() rend l'épingle à son état
    // d'origine. Sans effet en barre latérale (setPinned ne concerne que les pop-ups).
    this._app_data.menu_configuration.panels.setPinned('config', true)
  }

  /** Passe la souris en mode édition pour que le geste « tracer un flux » soit possible. */
  private _setEditionMode(): void {
    const drawing_area = this._app_data.drawing_area
    if (drawing_area.isInEditionMode()) return
    drawing_area.setToModeEdition(true)
    this._app_data.menu_configuration.updateAllComponentsRelatedToToolbar()
  }

  /**
   * Crée le flux de repli (deux nœuds + un flux valué) quand l'utilisateur passe l'étape « tracer »
   * sans tracer : les étapes suivantes ont besoin d'un support concret. N'agit que sur un diagramme
   * vide, et mémorise ce qui a été créé pour pouvoir le retirer à la fin.
   */
  private _createFallbackFlow(): void {
    if (!this._started_empty || this._hasLink()) return
    const sankey = this._sankey
    const known_node_ids = new Set(sankey.nodes_list.map(node => node.id))
    const link = sankey.addNewDefaultLink()
    link.valueCurrent = FALLBACK_LINK_VALUE
    this._fallback_node_ids = sankey.nodes_list
      .filter(node => !known_node_ids.has(node.id))
      .map(node => node.id)
    sankey.draw()
    this._app_data.drawing_area.areaAutoFit()
  }

  /** Retire le flux de repli. Supprimer ses nœuds emporte le flux qui les relie. */
  private _removeFallbackFlow(): void {
    if (this._fallback_node_ids.length === 0) return
    const sankey = this._sankey
    this._fallback_node_ids.forEach(id => {
      const node = sankey.nodes_dict[id]
      if (node) sankey.deleteNode(node)
    })
    this._fallback_node_ids = []
    sankey.draw()
  }

  /**
   * Sélectionne le flux et ouvre le panneau. #1243 : on ne force plus de type ni d'élément —
   * l'inspecteur dérive sa cible de la sélection, il suffit donc de sélectionner.
   *
   * `requested_tab_id` sert à l'étape « valeur » : le champ de valeur du flux n'est dans le DOM
   * que si l'onglet Valeur est actif, or l'inspecteur ouvre sur Forme (son premier onglet). Sans
   * cette demande, l'étape viserait un élément absent.
   */
  private _inspectFirstLink(requested_tab_id: string | null = null): void {
    const link = this._firstLink()
    if (link === undefined) return
    const drawing_area = this._app_data.drawing_area
    const menu_configuration = this._app_data.menu_configuration
    // Tracer un flux laisse le flux ET ses deux nœuds sélectionnés : l'inspecteur cible alors une
    // sélection hétérogène (« 3 éléments »), alors que l'étape ne parle que du flux. On réduit au
    // flux seul — c'est lui le sujet.
    const is_link_alone = drawing_area.selected_elements_list.length === 1
      && drawing_area.selected_links_list[0] === link
    if (!is_link_alone) {
      drawing_area.purgeSelection()
      drawing_area.addElementToSelection(link)
      menu_configuration.ref_to_menu_config_updater.current?.()
    }
    menu_configuration.inspector_requested_tab_id = requested_tab_id
    this._openConfigDrawer()
    // Indispensable : openConfigMenu ne fait RIEN quand le tiroir est déjà ouvert — et il l'est,
    // le tracé du flux l'ayant ouvert. Sans ce re-render, l'inspecteur ne verrait ni la sélection
    // réduite ni l'onglet demandé, et resterait sur son premier onglet (Forme).
    menu_configuration.updateInspector()
  }

  // FIN DU TOUR ======================================================================================

  /**
   * Appelé par le `beforeClose` du TourProvider : couvre AUSSI bien la dernière étape que l'abandon
   * en cours de route (croix, ESC, clic sur le masque), puisque le tour se démonte dans tous ces cas.
   */
  public finish(): void {
    this._stopWatch()
    this._removeFallbackFlow()
    this._app_data.menu_configuration.inspector_requested_tab_id = null
    // L'épingle posée par le tour (cf. _openConfigDrawer) n'est pas un choix de l'utilisateur :
    // on la retire — sauf s'il l'avait posée lui-même avant. Fermer efface l'épingle de toute
    // façon, mais le panneau peut rester ouvert (tiroir déjà ouvert au lancement).
    if (!this._config_was_pinned) {
      this._app_data.menu_configuration.panels.setPinned('config', false)
    }
    if (!this._drawer_was_open) {
      this._app_data.menu_configuration.closeConfigMenu()
    }
  }

  // SCÉNARIO =========================================================================================

  /**
   * Construit le scénario. Appelé à CHAQUE lancement (cf. Class_ApplicationData.setSteps) : c'est
   * là qu'on fige le mode (diagramme vide ou non) et l'état initial du tiroir de config.
   */
  public buildSteps(): StepType[] {
    const t = (key: string) => this._app_data.t(key)

    this._started_empty = this._sankey.nodes_list.length === 0
    this._fallback_node_ids = []
    this._drawer_was_open = this._app_data.menu_configuration.ref_menu_opened.current?.[0] === true
    this._config_was_pinned = this._app_data.menu_configuration.panels.isPinned('config')

    // Le panneau de config est ouvert DÈS la première étape, même si elle se passe sur la zone de
    // dessin. Ce n'est pas cosmétique : @reactour mesure la cible d'une étape au moment où elle
    // devient active, et son `mutationObservables` ne rattrape pas une cible qui apparaît après —
    // il ne teste que les nœuds AJOUTÉS (`node.matches`), or Chakra monte le tiroir dans un Portal
    // dont le nœud ajouté est le conteneur, pas le panneau. Une cible qui n'existe pas encore est
    // donc mesurée à 0×0 et l'infobulle part dans le coin de l'écran. Toutes les cibles du
    // scénario doivent exister avant leur étape.
    this._openConfigDrawer()

    const steps: StepType[] = [
      // 1 — Tracer son premier flux (le geste fondamental de l'outil).
      {
        selector: '#g_drawing',
        stepInteraction: true,
        content: this._started_empty ? t('guide.first_flow') : t('guide.drawing_area'),
        action: () => {
          this._openConfigDrawer()
          if (!this._started_empty) return
          this._setEditionMode()
          this._watch(() => this._hasLink(), () => this._goToStep(1))
        },
        actionAfter: () => this._stopWatch(),
      },
      // 2 — Donner une valeur au flux : c'est la valeur qui fait l'épaisseur.
      //
      // La cible est le PANNEAU, pas le champ lui-même : le champ n'apparaît qu'avec l'onglet
      // Valeur, donc après le début de l'étape (cf. la limite de mesure ci-dessus). On ouvre
      // l'onglet pour poser le champ en haut du panneau, et le texte y renvoie.
      // OS#300 a remplacé le Drawer (`.drawer_menu_config`) par le PanelShell : le repère stable
      // dans ses deux modes (pop-up, barre latérale) est son attribut data-panel-id.
      {
        selector: '[data-panel-id="config"]',
        stepInteraction: true,
        content: this._started_empty ? t('guide.first_value') : t('guide.link_value'),
        action: () => {
          // Repli : l'utilisateur a passé l'étape précédente sans tracer. On ne crée le support
          // qu'ici, en ARRIVANT sur l'étape — le faire dans l'`actionAfter` de l'étape 1 le
          // créerait aussi quand l'utilisateur abandonne le tour (l'`actionAfter` se déclenche
          // au démontage).
          this._createFallbackFlow()
          this._inspectFirstLink(INSPECTOR_TAB_VALUE_ID)
          if (!this._started_empty) return
          this._watch(() => this._hasLinkValue(), () => this._goToStep(2))
        },
        actionAfter: () => {
          this._stopWatch()
          // L'utilisateur reprend la main sur les onglets dès qu'on quitte l'étape.
          this._app_data.menu_configuration.inspector_requested_tab_id = null
          // Repli : sans valeur, les étapes suivantes montreraient un flux d'épaisseur nulle.
          // Réservé au flux de repli — on ne réécrit jamais la donnée de l'utilisateur.
          if (this._fallback_node_ids.length === 0) return
          const link = this._firstLink()
          if (link && !this._hasLinkValue()) link.valueCurrent = FALLBACK_LINK_VALUE
        },
      },
      // 3 — L'inspecteur et son fil d'Ariane : la sélection choisit la cible. Étape de repérage
      // pure — le texte dit explicitement qu'il n'y a rien à y faire.
      {
        selector: '.inspector_breadcrumb',
        content: t('guide.inspector'),
        action: () => this._openConfigDrawer(),
        actionAfter: () => {
          if (!this._drawer_was_open) this._app_data.menu_configuration.closeConfigMenu()
        },
      },
    ]

    // 5 — Sauvegarder et exporter. 6 — Où trouver l'aide. Les deux boutons sont conditionnés par
    // la configuration de l'application (barre du haut, licence) : on n'ajoute l'étape que si sa
    // cible est réellement dans le DOM, sinon le masque se mesurerait dans le vide.
    if (document.querySelector('.topbar_button_save_in_cache') !== null) {
      steps.push({
        selector: '.topbar_button_save_in_cache',
        content: t('guide.save_and_export'),
      })
    }
    if (document.querySelector('.menutop_button_aide') !== null) {
      steps.push({
        selector: '.menutop_button_aide',
        content: t('guide.help_and_more'),
      })
    }

    return steps
  }
}
