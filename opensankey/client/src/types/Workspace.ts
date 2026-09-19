// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2025 TerriFlux
// ==================================================================================================
// Author        : Julien Alapetite & Vincent LE DOZE & Vincent CLAVEL for TerriFlux
// ==================================================================================================

import { CreateToastFnReturn } from '@chakra-ui/react'
import { TFunction, i18n } from 'i18next'

import { Class_MenuConfig, mainZoneSubjectSheet } from './MenuConfig'
import { Class_ApplicationData } from './ApplicationData'
import type { Type_ElementAnalysis, Type_TextForToastPromise } from './ApplicationData'
import type { Class_DrawingArea } from './DrawingArea'
import { ACTIVE_DOCUMENT_TOPIC, MAIN_ZONE_TOPIC } from './EventBus'
import { getPublishOptions, PublishOptions } from './PublishOptions'
import {
  default_toast_duration, default_toast_waiting_delay, randomId, toast_bypass, Type_JSON
} from './Utils'
import type { Class_NodeElement } from '../Elements/Node'
import type { Class_LinkElement } from '../Elements/Link'

/**
 * os#1385 — Conteneur de dessin d'un document HORS ÉCRAN : un sélecteur qui ne peut désigner
 * aucun élément réel de la page.
 *
 * Ce n'est pas une précaution de style. Une `Class_DrawingArea` naît avec
 * `container_selector = '#sankey_app'`, c'est-à-dire le conteneur du diagramme AFFICHÉ, et
 * tout chemin qui dessine commence par `selectAll('#draw_zoom').remove()` dedans : un document
 * hors écran qu'on laisserait avec le sélecteur par défaut EFFACERAIT le diagramme de
 * l'utilisateur au premier calcul de placement. Le board unitaire a payé ce défaut jusqu'en
 * septembre 2026 (cf. `UnitaryBoard.buildUnitaryDrawingArea`, « LE CONTENEUR, TOUT DE SUITE »),
 * au prix d'un redessin complet du diagramme principal après chaque vignette. On ne le refait pas.
 *
 * Le nom est volontairement imprononçable : aucune feuille de style, aucun composant ne peut
 * le poser par mégarde sur un vrai nœud du DOM. Il remplace les deux sélecteurs jumeaux
 * d'avant (`#os1386_sheet_snapshot_offscreen_never_in_dom` pour les instantanés de feuille,
 * `#os_detached_app_offscreen_never_in_dom` pour l'extraction unitaire) : il n'y a qu'une
 * notion, « ce document n'a pas d'écran », et elle se pose désormais par `detachOffscreen()`.
 */
export const OFFSCREEN_CONTAINER_SELECTOR = '#os1385_offscreen_document_never_in_dom'

/** Options de naissance d'un document (cf. `Class_Workspace.createDocument`). */
export type Type_DocumentOptions = {
  /**
   * Le document n'a pas d'écran : TOUTE zone de dessin qu'il créera naîtra dans
   * `OFFSCREEN_CONTAINER_SELECTOR`. Il n'est pas candidat à être le document `main`.
   */
  offscreen?: boolean
  /**
   * os#1385 (lot 2) — Identifiant IMPOSÉ du document, au lieu d'un `makeId('doc')`.
   *
   * Il n'a qu'un usage aujourd'hui, et c'est celui qui compte : l'application de lecture d'une
   * feuille (`sheetApplication`) le fixe à `'sheet:<id de feuille>'`, pour que l'emplacement de
   * cache d'une feuille soit STABLE d'un chargement d'instantané au suivant. Un identifiant
   * tiré au hasard donnerait une clé neuve à chaque invalidation, et le stockage local
   * accumulerait des documents morts.
   */
  id?: string
}

/**
 * os#1385 (lot 2) — LE PRESSE-PAPIERS, qui est de l'espace de travail et non du document.
 *
 * Il porte sa SOURCE, et pas seulement des identifiants : deux documents ouverts ont deux jeux
 * d'identifiants sans rapport, et coller dans B des `node_id` copiés dans A y désignerait au
 * mieux rien, au pire d'autres nœuds. Tant que la sérialisation du contenu n'est pas là (lot 3,
 * avec l'éditabilité d'un second document), coller HORS de sa source est refusé et dit.
 */
export type Type_Clipboard = {
  source: Class_ApplicationData
  node_ids: string[]
}

/**
 * os#1385 — L'ESPACE DE TRAVAIL : ce qui est UNIQUE quel que soit le nombre de documents ouverts.
 *
 * `Class_ApplicationData` est le DOCUMENT (un sankey, sa zone de dessin, ses vues, sa doc, ses
 * feuilles, sa sélection, son historique). Tout ce qui n'a de sens qu'en un exemplaire — la
 * licence du compte, la langue de l'interface, les logos, la file de toasts, les options de la
 * page publiée, les crochets que la couche OS+ injecte une fois, la configuration de menus de
 * l'hôte — vit ICI, et le document y accède par des accesseurs délégués. Les cinq cents sites
 * d'appel (`app_data.t`, `app_data.has_sankey_plus`, `app_data.publish_options`…) ne bougent
 * donc pas : seule la source de vérité change.
 *
 * AVANT, ces champs étaient posés sur l'application principale et RECOPIÉS À LA MAIN sur les
 * autres (instantané de feuille, source Excel unitaire, extraction de brique, application
 * fantôme des préférences) : la liste de ce que ces quatre applications devaient contourner
 * était exactement la liste de ce qui était mal placé (cf. NOTE-APPLI-D-APPLIS.md §1, fait 2).
 */
export class Class_Workspace {

  // PAGE ===============================================================================

  /**
   * Mode de PAGE : vrai dans un viewer de publication, faux dans l'éditeur. Source UNIQUE de
   * `Class_ApplicationData.is_static`, qui vivait jusqu'ici sur la zone de dessin — laquelle est
   * recréée à chaque `reset()`, d'où les réalignements à la main qui disparaissent avec ce champ.
   */
  public readonly published_mode: boolean

  /**
   * Options de la page publiée (`window.sankey`), lues UNE fois par espace de travail.
   *
   * Un seul objet, et c'est essentiel : les viewers React MUTENT ses champs
   * (`po.data_tag_selection = …`, cf. `useViewerAppData`) et attendent que la mutation soit
   * visible du document. Un getter qui reconstruirait l'objet à chaque lecture les perdrait.
   */
  public readonly publish_options: PublishOptions = getPublishOptions()

  /** Options d'instanciation de l'application (`no_key_event`…). */
  public readonly options: { [_: string]: boolean | string }

  // COMPTE =============================================================================
  // Licences BRUTES du compte : `is_static` n'entre PAS dans le calcul ici. C'est le document
  // qui mélange les deux (`has_sankey_plus => workspace.has_sankey_plus || is_static`), parce
  // que c'est lui qui sait s'il est affiché dans une page publiée.

  protected _has_sankey_dev: boolean = false
  protected _has_sankey_plus: boolean = false
  protected _has_sankey_afm: boolean = false

  public get has_sankey_dev(): boolean { return this._has_sankey_dev }
  public set has_sankey_dev(_: boolean) { this._has_sankey_dev = _ }
  public get has_sankey_plus(): boolean { return this._has_sankey_plus }
  public set has_sankey_plus(_: boolean) { this._has_sankey_plus = _ }
  public get has_sankey_afm(): boolean { return this._has_sankey_afm }
  public set has_sankey_afm(_: boolean) { this._has_sankey_afm = _ }

  // LANGUE DE L'INTERFACE ==============================================================

  //@ts-expect-error xxx
  protected _t: TFunction = () => null
  //@ts-expect-error xxx
  protected _i18n: i18n = () => null

  public get t(): TFunction { return this._t }
  public set t(_: TFunction) { this._t = _ }
  public get i18n(): i18n { return this._i18n }
  public set i18n(_: i18n) { this._i18n = _ }

  // TOASTS =============================================================================
  // File d'attente UNIQUE : deux documents qui enregistrent en même temps ne doivent pas se
  // voler leur spinner.

  protected _toast: CreateToastFnReturn | null = null
  public get toast(): CreateToastFnReturn | null { return this._toast }
  public set toast(_: CreateToastFnReturn | null) { this._toast = _ }

  /** Queue of waiting processes for toast */
  private _toast_processes: string[] = []

  /** Force bypassing waiting toast */
  private _toast_bypass: boolean = toast_bypass

  /** os#1359 — Ce qui a déjà été dit une fois n'est pas redit. Voir `notifyUser`. */
  private _notified_once: Set<string> = new Set()

  /**
   * Create a waiting toast and add function to waiting queue.
   * @param {() => void} funct
   * @param {Type_TextForToastPromise} [intake] Info text for loading, success or error
   */
  public sendWaitingToast(
    funct: () => void | Promise<void>,  // Accepte async
    intake?: Type_TextForToastPromise
  ) {
    const funct_id = randomId()
    this._toast_processes.push(funct_id)
    if (this._toast_bypass)
      funct()
    else
      this._sendWaitingToast(funct, funct_id, intake)
  }

  /**
   * Allows to create a waiting toast for given function.
   * Use a functions queue to ensure that all function that call always run in the calling order.
   */
  protected _sendWaitingToast(
    funct: () => void | Promise<void>,
    funct_id: string,
    intake?: Type_TextForToastPromise
  ) {
    if (this._toast_processes[0] !== funct_id) {
      setTimeout(() => this._sendWaitingToast(funct, funct_id, intake), default_toast_waiting_delay)
    } else {
      const task_promise = (async () => {
        try {
          await new Promise(r => setTimeout(r, 500)) // Attendre 500ms pour le spinner
          await funct()  // Attendre la fin de la fonction (sync ou async)
          return 200
        } finally {
          this._toast_processes.splice(0, 1)
        }
      })()
      this._toast!.promise(
        task_promise,
        {
          success: {
            title: intake?.success?.title ?? this.t('toast.default.success.title'),
            description: intake?.success?.desc ?? this.t('toast.default.success.desc'),
            duration: default_toast_duration
          },
          loading: {
            title: intake?.loading?.title ?? this.t('toast.default.loading.title'),
            description: intake?.loading?.desc ?? this.t('toast.default.loading.desc'),
            duration: default_toast_duration
          },
          // La raison du rejet était JETÉE : l'utilisateur voyait un titre
          // générique, la console ne montrait rien, et un échec survenu sur une
          // autre machine restait indiagnosticable — c'est exactement ce qui a
          // fait perdre une semaine sur l'export PNG. Chakra accepte une
          // fonction ici : on y récupère l'erreur, on la trace et on la montre.
          // L'erreur reste affichée (duration null) et refermable : c'est un
          // message que l'utilisateur doit pouvoir lire et recopier.
          error: (err: Error) => {
            console.error('[toast] tache en echec :', err)
            const detail = err?.message ? String(err.message) : ''
            const base = intake?.error?.desc
            const description = [base, detail].filter(Boolean).join(' — ')
            return {
              title: intake?.error?.title ?? this.t('toast.default.error.title'),
              description: description || this.t('toast.default.error.desc'),
              duration: detail ? null : default_toast_duration,
              isClosable: true
            }
          },
        }
      )
    }
  }

  /**
   * os#1359 — un mot bref, non bloquant, sur une conséquence que la saisie ne montre pas
   * d'elle-même (typiquement : quelle couche de données vient d'être écrite, et laquelle
   * vient d'être périmée).
   *
   * `once` vaut pour une règle de fonctionnement, qui ne change pas d'une saisie à l'autre :
   * la répéter à chaque valeur corrigée transformerait l'explication en gêne, et l'utilisateur
   * apprendrait surtout à ne plus lire les bandeaux. L'`id` dédoublonne aussi le reste, sans
   * quoi corriger vingt flux sélectionnés empilerait vingt fois le même message.
   *
   * Silencieux tant qu'aucun toast n'est monté (rendu hors React, tests, mode publié sans
   * ChakraProvider) : c'est un confort de lecture, jamais une condition d'exécution.
   */
  public notifyUser(
    id: string,
    title: string,
    description?: string,
    status: 'info' | 'warning' = 'info',
    once: boolean = false
  ): void {
    if (!this._toast) return
    if (once) {
      if (this._notified_once.has(id)) return
      this._notified_once.add(id)
    } else if (this._toast.isActive(id)) return
    this._toast({
      id,
      title,
      description,
      status,
      duration: default_toast_duration,
      isClosable: true
    })
  }

  // MARQUES ============================================================================

  /** Path to OpenSankey logo */
  protected _logo_opensankey: string = 'logos/logo_opensankey.png'
  /** Path to Terriflux logo (le chemin dépend du mode de page) */
  protected _logo_terriflux: string = 'logos/logo_terriflux.png'
  /** Width of logo */
  protected _logo_width: number = 100
  /** Application name */
  protected _app_name: string = 'MFASankey'
  /** Path prefix for backend server requests */
  protected _url_prefix: string = '/opensankey/'

  public get logo_opensankey(): string { return this._logo_opensankey }
  public get logo_terriflux(): string { return this._logo_terriflux }
  public get logo_width(): number { return this._logo_width }
  public set logo_width(value: number) { this._logo_width = value }
  public get app_name(): string { return this._app_name }
  public set app_name(value: string) { this._app_name = value }
  public get url_prefix(): string { return this._url_prefix }

  // RÉGLAGES DE SESSION ================================================================

  /**
   * Session-only horizontal spacing for auto-layout. `null` = use style default.
   * Shared between the auto-layout context menu widget and the Excel import dialog.
   */
  public layout_h_spacing: number | null = null

  /**
   * Session-only vertical spacing for auto-layout. `null` = use style default.
   * Shared between the auto-layout context menu widget and the Excel import dialog.
   */
  public layout_v_spacing: number | null = null

  /**
   * Session-only placement mode for nodes without incoming flows (auto-layout).
   * 'before_neighbor' = one column before the earliest successor (default),
   * 'left_extremity' = pinned to the leftmost column (index 0).
   */
  public layout_sources_mode: 'before_neighbor' | 'left_extremity' = 'before_neighbor'

  /**
   * Session-only placement mode for nodes without outgoing flows (auto-layout).
   * 'after_neighbor' = one column after the latest predecessor (default),
   * 'right_extremity' = pinned to the rightmost column.
   */
  public layout_sinks_mode: 'after_neighbor' | 'right_extremity' = 'after_neighbor'

  /**
   * Session-only mode for the auto-layout: whether to minimize link crossings.
   * `true` = "Minimiser les croisements", `false` = "Centrer les nœuds".
   * Used by the Excel import dialog; the right-click menu exposes the choice via two buttons instead.
   */
  public layout_optimize_crossing: boolean = true

  /** Attributes to transfer between sankeys (réglage de session du dialogue de transfert). */
  public data_var_to_update: string[] = []

  // CROCHETS INJECTÉS PAR OS+ ==========================================================
  // Posés UNE fois par la couche supérieure : un document secondaire en héritait jusqu'ici
  // par rien du tout, d'où des fenêtres muettes selon le document qu'elles regardaient.

  /** Called after applying a layout from an external source.
   * tmp_DA is the already-converted source DrawingArea.
   * json is the raw source file JSON (null for view sources).
   * mode overrides data_var_to_update when provided (e.g. when called from App.tsx with all attrs). */
  public post_apply_layout_callback?: (tmp_DA: Class_DrawingArea, json: Type_JSON | null, mode?: string[]) => void = undefined

  /** Hook injecté par OS+ : dessine le nœud EN CAMEMBERT (surface on_node, OS#1278)
   * dans le groupe SVG `group_el` du nœud, aux dimensions passées. Utilisé par
   * NodeDrawShape quand le descripteur du nœud a surfaces.on_node. Couleurs du
   * diagramme (le graphique fait partie du langage visuel). Absent hors OS+. */
  public draw_node_analysis_overlay?: (
    node: Class_NodeElement,
    group_el: SVGGElement,
    width: number,
    height: number,
    // os#1421 — le sac EFFECTIF de la figure posée sur le nœud (cf. le commentaire du document).
    figure_options?: { [key: string]: unknown }
  ) => boolean = undefined

  /** Hook injecté par OS+ : ANALYSES proposées pour UN élément dans sa pop-up
   * (colonne de boutons Unit. / Couronne / Barres). Chacune sait se dessiner dans un
   * conteneur DOM. Absent hors OS+ (pas de colonne d'analyses). */
  public element_analyses_for?: (
    element: Class_NodeElement | Class_LinkElement
  ) => Type_ElementAnalysis[] = undefined

  // CONFIGURATION DE MENUS HÔTE ========================================================

  /**
   * La configuration de menus de l'HÔTE : panneaux, colonne d'outils, dialogues, injections
   * de menus, ordre des menus du haut. Celle de chaque DOCUMENT lui est adossée
   * (`new Class_MenuConfig(host)`) et n'en porte que les emplacements liés au contenu.
   *
   * Stable pour la vie de l'espace de travail : `createNewMenuConfiguration(toast)` recrée
   * celle du document (c'est ce que `useMenuConfiguration` demande au montage), jamais celle-ci
   * — sans quoi les composants d'interface, abonnés au montage, deviendraient sourds.
   */
  public readonly menu_configuration: Class_MenuConfig

  /** Virtuelle : OS+ et la couche SaaS fournissent leur propre sous-classe. */
  protected createMenuConfiguration(): Class_MenuConfig { return new Class_MenuConfig() }

  // DOCUMENTS ==========================================================================

  protected _documents: Class_ApplicationData[] = []
  protected _main: Class_ApplicationData | null = null

  /** Les documents vivants de cet espace de travail, hors écran compris. */
  public get documents(): readonly Class_ApplicationData[] { return this._documents }

  /**
   * os#1385 (lot 3, D6) — LE DOCUMENT VIVANT qui porte cet identifiant, ou `null`.
   *
   * C'est l'annuaire que D6 demandait : une feuille ouverte dans une fenêtre est un document
   * de l'espace de travail (`'sheet:<id de feuille>'`), et la retrouver ne doit plus passer
   * par le document qui la porte. `null` ne veut pas dire « cette feuille n'existe pas » mais
   * « aucun document vivant ne la porte » : l'instantané, lui, est toujours là, et
   * `Class_ApplicationData.sheetApplication` sait le charger.
   */
  public document(id: string): Class_ApplicationData | null {
    return this._documents.find(doc => doc.document_id === id) ?? null
  }

  /**
   * Le document PRINCIPAL : le premier document affichable enregistré. C'est lui, et lui seul,
   * qui a le droit d'écrire la disposition de l'hôte (panneaux, langue de l'interface) et de
   * repeindre les menus — un document secondaire n'avait jusqu'ici qu'une configuration
   * orpheline, et ce qui suit reproduit ce comportement au lieu de le subir.
   */
  public get main(): Class_ApplicationData | null { return this._main }

  // DOCUMENTS DÉCLARÉS PAR LES FENÊTRES ================================================
  //
  // os#1422 (lot 6) — L'ANNUAIRE (fenêtre, vignette) → document, consulté par `active`.
  //
  // Pourquoi il existe : `active` ne savait résoudre qu'une FEUILLE (le sujet d'une fenêtre dit
  // quelle feuille elle regarde, cf. `mainZoneSubjectSheet`). Un document qui n'est pas une
  // feuille — le document d'étoile d'une vignette unitaire, qui ne s'enregistre jamais — ne
  // pouvait donc pas devenir l'actif, et tout ce qui s'adresse à l'actif (inspecteur, clavier,
  // Ctrl+Z, menus contextuels) parlait d'un autre document que celui qu'on regardait.
  //
  // LA CLÉ EST LE COUPLE (occupant, vignette), pas la seule fenêtre : une fenêtre d'élément
  // porte N vignettes — une étoile par nœud sélectionné — et chacune a son document.
  //
  // TRANSITOIRE, absolument : jamais sérialisé, jamais relu d'un fichier. Il décrit ce qui est
  // monté à l'écran maintenant, et c'est la fenêtre qui le pose (`bindWindowDocument`) et le
  // retire (`unbindWindowDocument`) — comme un `useEffect` pose et retire son abonnement.
  protected _window_documents: { [occupant_id: string]: { [pane_key: string]: Class_ApplicationData } } = {}

  /**
   * LA FENÊTRE (occupant, vignette) MONTRE CE DOCUMENT : il devient l'actif quand elle l'est.
   *
   * Idempotent : reposer le même document ne notifie rien (une vignette qui se redessine ne doit
   * pas faire croire à une bascule d'actif).
   */
  public bindWindowDocument(occupant_id: string, pane_key: string, doc: Class_ApplicationData): void {
    const by_key = this._window_documents[occupant_id] ?? (this._window_documents[occupant_id] = {})
    if (by_key[pane_key] === doc) return
    by_key[pane_key] = doc
    // Comme `registerDocument` / `forgetDocument` : ce qui change l'ensemble des documents
    // joignables peut changer l'actif, et l'actif ne s'annonce que par là.
    this.refreshActive()
  }

  /** La vignette n'est plus montée : son document n'est plus joignable par la grande zone. */
  public unbindWindowDocument(occupant_id: string, pane_key: string): void {
    const by_key = this._window_documents[occupant_id]
    if (!by_key || !(pane_key in by_key)) return
    delete by_key[pane_key]
    if (Object.keys(by_key).length === 0) delete this._window_documents[occupant_id]
    this.refreshActive()
  }

  /**
   * Le document déclaré par la vignette `pane_key` de la fenêtre `occupant_id`, ou `null`.
   *
   * `pane_key` est la vignette ACTIVE de la grande zone (`main_zone_active_pane_key`), qui vaut
   * `null` tant que l'utilisateur n'en a touché aucune. Dans ce cas — et dans ce cas seulement —
   * on retombe sur l'unique entrée de la fenêtre quand elle n'en a qu'une : c'est la convention
   * que la grande zone emploie déjà (« `null` = la première vignette de la fenêtre »), et une
   * fenêtre qui en porte plusieurs sans qu'aucune ait été touchée ne désigne rien.
   *
   * Un document `disposé` est IGNORÉ plutôt que rendu : une vignette en cours de démontage garde
   * sa référence le temps que l'effet se dénoue, et rendre actif un document démonté ferait lire
   * une zone de dessin qui n'existe plus.
   */
  public boundWindowDocument(occupant_id: string, pane_key: string | null): Class_ApplicationData | null {
    const by_key = this._window_documents[occupant_id]
    if (!by_key) return null
    const keys = Object.keys(by_key)
    if (keys.length === 0) return null
    const key = (pane_key !== null && pane_key in by_key)
      ? pane_key
      : (pane_key === null && keys.length === 1 ? keys[0] : null)
    if (key === null) return null
    const doc = by_key[key]
    return (doc && !doc.disposed) ? doc : null
  }

  /**
   * os#1385 (lot 2, D5) — LE DOCUMENT ACTIF : celui que l'utilisateur édite.
   *
   * RÉSOLU À L'APPEL, JAMAIS CAPTURÉ. C'est tout le contrat : une commande de l'espace de travail
   * (le clavier, un bouton de menu, l'inspecteur) demande « quel document, maintenant ? » au
   * moment où elle s'exécute. Une capture — un `app_data` mémorisé au montage d'un composant, une
   * closure passée à `onkeydown` — fige le document d'il y a deux minutes, et c'est très
   * exactement la panne que ce lot solde.
   *
   * COMMENT IL SE DÉSIGNE. Sans geste nouveau : la fenêtre active de la grande zone porte déjà
   * l'intention de l'utilisateur (un mousedown dans une fenêtre la rend active, os#1397 l'a même
   * rendu vrai pour le canevas principal), et le sujet d'une fenêtre dit quelle FEUILLE il
   * regarde. L'actif est donc le document qui possède ce sujet — celui de la feuille courante,
   * c'est-à-dire le `main`, ou l'application de lecture d'une autre feuille.
   *
   * EFFET DE BORD ASSUMÉ : `sheetApplication` charge paresseusement l'instantané, en O(feuille),
   * la PREMIÈRE fois. Lire `active` peut donc payer ce chargement. En pratique il est déjà payé —
   * une fenêtre ne devient active qu'après s'être affichée, donc après avoir demandé la même
   * application — et l'alternative (un actif mémorisé à la bascule) rouvrirait la porte à la
   * capture. Le fallback `?? main` couvre la feuille supprimée : une fenêtre orpheline ne doit
   * pas rendre l'espace de travail sans actif.
   *
   * os#1422 (lot 6) — LA VOIE DES FEUILLES N'EST PLUS LA SEULE, et c'est un ajout, pas une
   * correction : une fenêtre dont le sujet désigne une feuille continue de se résoudre
   * exactement comme ci-dessus. Mais toutes les fenêtres ne montrent pas une feuille — le
   * document d'étoile d'une vignette unitaire n'en est pas une, et n'en sera jamais une (il ne
   * s'enregistre pas). Une telle fenêtre DÉCLARE son document (`bindWindowDocument`), et cet
   * annuaire est consulté d'ABORD : sans lui, le document qu'on regarde ne peut pas devenir
   * l'actif, donc pas d'inspecteur, pas de clavier, pas de Ctrl+Z dessus.
   */
  public get active(): Class_ApplicationData | null {
    const main = this._main
    if (!main) return null
    // Un document en cours de construction n'a pas encore sa configuration de menus : le
    // constructeur BOOLÉEN appelle `registerDocument` avant `createNewMenuConfiguration`.
    const mc: Class_MenuConfig | undefined = main.menu_configuration
    if (mc === undefined) return main
    const active_id = mc.main_zone_active_id
    // os#1422 — l'annuaire AVANT la voie des feuilles (cf. en-tête). Une fenêtre qui n'a rien
    // déclaré n'y trouve rien, et la résolution par sujet reprend sans rien savoir de tout ceci.
    if (active_id !== null) {
      const bound = this.boundWindowDocument(active_id, mc.main_zone_active_pane_key)
      if (bound) return bound
    }
    const occupant = active_id === null ? undefined : mc.mainZoneOccupantById(active_id)
    const sheet = occupant ? mainZoneSubjectSheet(occupant.subject) : ''
    if (sheet === '' || sheet === main.current_sheet_id) return main
    return main.sheetApplication(sheet) ?? main
  }

  /** Dernière identité annoncée de l'actif — sert à ne notifier que les VRAIES bascules. */
  protected _last_active: Class_ApplicationData | null = null

  /** Verrou de ré-entrance, cf. `refreshActive`. */
  protected _refreshing_active: boolean = false

  /**
   * Recalcule l'actif et, si son identité a changé, l'annonce sur le bus de l'hôte.
   *
   * Appelé sur `MAIN_ZONE_TOPIC` (le setter de `main_zone_active_id` y notifie), et à chaque
   * document enregistré ou oublié — ouvrir le premier document, ou fermer celui qu'on regardait,
   * change l'actif sans passer par la grande zone.
   *
   * Tolérant à l'absence de `main` (espace de travail vide, document en construction) : cette
   * méthode est branchée sur un bus, et un bus ne doit jamais lever.
   *
   * RÉ-ENTRANCE, et ce n'est pas théorique : résoudre l'actif peut CHARGER un document
   * (`sheetApplication`, premier appel), dont l'enregistrement rappelle cette méthode — alors
   * que le cache d'instantané n'est posé qu'au retour. Sans verrou, la première activation
   * d'une fenêtre de feuille chargerait la feuille en boucle.
   */
  public refreshActive(): void {
    if (this._refreshing_active) return
    this._refreshing_active = true
    try {
      const next = this.active
      if (next === this._last_active) return
      this._last_active = next
      this.menu_configuration.notify(ACTIVE_DOCUMENT_TOPIC)
    } finally {
      this._refreshing_active = false
    }
  }

  // CLAVIER ============================================================================
  // os#1385 (lot 2, D7) — UN SEUL écouteur, posé par l'espace de travail, qui résout l'actif
  // À CHAQUE FRAPPE. Les quatre sites qui posaient `document.onkeydown =
  // app.keyboardEventListener(app)` capturaient l'application du moment : la frappe partait
  // toujours au même document, quelle que soit la fenêtre regardée.

  /**
   * Pose un écouteur clavier sur UN document et rend la fonction qui le retire (pour un
   * `useEffect`). Sans argument : la page, et le document ACTIF — c'est l'appel des quatre sites
   * de démarrage, inchangé.
   *
   * os#1385 — DEUX QUESTIONS, DEUX PARAMÈTRES : *où* j'écoute, et *pour qui*. Une fenêtre de
   * navigateur détachée (canevas d'une autre feuille posé sur un second écran) a son propre
   * `document` : l'écouteur de la page ne l'atteint jamais, d'où le premier paramètre. Mais elle
   * ne doit surtout pas router vers `active` — l'actif suit la dernière vignette touchée dans la
   * fenêtre PRINCIPALE, donc taper dans la fenêtre détachée piloterait le diagramme d'en face.
   * Ce qu'il lui faut, c'est le document qu'ELLE montre, d'où le second paramètre.
   *
   * @param host_document le document qui écoute (celui de la page par défaut)
   * @param resolve       le document métier que ses frappes pilotent (l'actif par défaut)
   */
  public installKeyboardListener(
    host_document: Document = document,
    resolve: () => Class_ApplicationData | null = () => this.active
  ): () => void {
    const listener = (evt: KeyboardEvent) => this.dispatchKeyboardEvent(evt, resolve)
    host_document.onkeydown = listener
    return () => { if (host_document.onkeydown === listener) host_document.onkeydown = null }
  }

  /**
   * Route une frappe vers le document ACTIF (le `main` tant qu'il n'y a pas d'autre fenêtre).
   *
   * On ne trie PAS ici les touches d'espace de travail (Tab, Échap, Ctrl+F, Ctrl+B) : elles
   * traversent le document comme les autres et atteignent l'hôte par la DÉLÉGATION de sa
   * configuration de menus (lot 1 — `ref_menu_opened`, `closeAllMenus`, `panels`,
   * `ref_toggle_search` sont des membres d'hôte, quel que soit le document qui les lit). La
   * séparation est donc structurelle, une fois pour toutes ; la dupliquer ici en ferait deux
   * listes à tenir d'accord.
   */
  public dispatchKeyboardEvent(
    evt: KeyboardEvent,
    resolve: () => Class_ApplicationData | null = () => this.active
  ): void {
    // Le repli sur le `main` vaut pour TOUTE résolution, y compris celle d'une fenêtre
    // détachée dont le document aurait été libéré (feuille redevenue courante) : une frappe
    // sans destinataire ne doit pas se perdre en silence.
    const doc = resolve() ?? this._main
    doc?.handleKeyboardEvent(evt)
  }

  // PRESSE-PAPIERS =====================================================================

  /**
   * Ce qui a été copié, avec le document d'où il vient (cf. `Type_Clipboard`). Vivait sur le
   * document (`_clipboard_node_ids`), où il n'avait aucun sens : copier dans A puis coller dans
   * B ne trouvait rien, sans un mot.
   */
  public clipboard: Type_Clipboard | null = null

  // BARRE D'ADRESSE ====================================================================
  // Il n'y a qu'UNE barre d'adresse pour toute la page : l'armement de la synchronisation est
  // donc de l'espace de travail, et seul l'ACTIF y écrit (cf. `Class_ApplicationData.syncUrlState`).

  protected _url_sync_enabled: boolean = false

  /**
   * Tant que l'état initial de l'URL n'a pas été appliqué, on n'écrit pas : sinon le premier
   * dessin écraserait les paramètres qu'on s'apprête tout juste à lire.
   */
  public get url_sync_enabled(): boolean { return this._url_sync_enabled }
  public set url_sync_enabled(_: boolean) { this._url_sync_enabled = _ }

  /** Arme la synchronisation sans rien appliquer (reprise du cache, page vierge, diagramme inline). */
  public enableUrlStateSync(): void { this._url_sync_enabled = true }

  /**
   * Fabrique LE geste normal : un document naît DANS un espace de travail, qui lui donne d'un
   * coup la langue, les licences, le mode de page, les logos, la file de toasts, les crochets
   * et la configuration de menus hôte. Plus aucune recopie à la main.
   */
  public createDocument(options: Type_DocumentOptions = {}): Class_ApplicationData {
    const doc = this.instantiateDocument()
    if (options.offscreen) {
      doc.detachOffscreen()
      // os#1385 (lot 3, D4) — UN DOCUMENT SANS ÉCRAN N'ÉDITE PAS. Le droit d'édition est une
      // propriété du DOCUMENT et non plus de sa place à l'écran ; un document qui naît hors
      // écran (instantané de feuille, source Excel unitaire, brique extraite) n'a personne
      // devant lui, donc rien à autoriser. C'est la phase B — celle qui lui donne un cadre
      // dans la grande zone — qui le repassera à vrai, et la fermeture de la fenêtre à faux.
      doc.edition_allowed = false
    }
    this.registerDocument(doc, options)
    return doc
  }

  /** Virtuelle : OS+ et la couche SaaS construisent leur propre sous-classe de document. */
  protected instantiateDocument(): Class_ApplicationData { return new Class_ApplicationData(this) }

  /**
   * Enregistre un document dans l'espace de travail. Appelé par `createDocument`, et aussi par
   * le constructeur BOOLÉEN du document (`new Class_ApplicationData(true)`), qui se crée un
   * espace de travail privé dont il est le `main` — c'est ce qui garde valides les soixante
   * fichiers de tests et les consommateurs npm.
   */
  public registerDocument(doc: Class_ApplicationData, options: Type_DocumentOptions = {}): void {
    if (!this._documents.includes(doc)) this._documents.push(doc)
    // os#1385 (lot 2) — L'IDENTITÉ du document, posée ici et une seule fois : c'est elle qui
    // nomme son emplacement de cache (`cache_key`). Un document n'en a pas avant d'appartenir à
    // un espace de travail — c'est l'espace qui sait ce qui est unique en son sein.
    doc.assignDocumentId(options.id)
    // Un document hors écran n'est candidat à rien : il n'a pas de place à l'écran, donc pas
    // de disposition à écrire ni de menus à repeindre.
    if (!options.offscreen && this._main === null) this._main = doc
    this.refreshActive()
  }

  /** Retire un document (instantané de feuille périmé, source Excel remplacée…). */
  public forgetDocument(doc: Class_ApplicationData): void {
    const idx = this._documents.indexOf(doc)
    if (idx >= 0) this._documents.splice(idx, 1)
    if (this._main === doc) this._main = null
    // os#1440 — LE PRESSE-PAPIERS SURVIT À SON DOCUMENT, EXPRÈS, ET NE SERT PLUS QU'À LE DIRE.
    //
    // Il était remis à `null` ici, avec pour raison « ses identifiants ne désignent plus rien ».
    // C'était vrai tant que coller relisait ces identifiants dans le document d'arrivée, où ils
    // ne pouvaient rien désigner. Depuis os#1440 coller LIT dans le document d'origine : ce qui
    // compte n'est plus la validité des identifiants mais la VIE de la source.
    //
    // Et l'effacer coûtait la seule chose qu'on puisse encore faire d'utile. Copier dans la
    // fenêtre d'une feuille, refermer cette fenêtre (`releaseSheetDocument`), puis coller :
    // presse-papiers vide, donc Ctrl+V sans le moindre effet et sans un mot — l'utilisateur voit
    // sa copie disparaître sans savoir pourquoi. En gardant l'entrée, le collage constate la
    // source morte et l'explique (cf. le refus dans `handleKeyboardEvent`). C'est exactement
    // l'usage prévu de `disposed` : « que les détenteurs d'une référence tardive puissent le
    // constater sans jeter ». Ce qui reste retenu est une coquille — `dispose` a déjà purgé le
    // modèle —, et le prochain Ctrl+C la remplace.
    this.refreshActive()
  }

  // CONSTRUCTOR ========================================================================

  constructor(
    published_mode: boolean,
    options: { [_: string]: boolean | string } = {}
  ) {
    this.published_mode = published_mode
    this.options = options
    // Get TerriFlux logo — le viewer d'une publication sert ses images à plat.
    if (published_mode) this._logo_terriflux = 'logo_terriflux.png'
    // Dispatch virtuel, comme la fabrique de documents : la configuration HÔTE est celle de
    // la couche la plus haute (MenuConfigOSP / MenuConfigSA).
    this.menu_configuration = this.createMenuConfiguration()
    // os#1385 (lot 2) — CHANGER DE FENÊTRE ACTIVE PEUT CHANGER DE DOCUMENT ACTIF. Le setter de
    // `main_zone_active_id` notifie déjà la grande zone ; on s'y branche plutôt que d'ajouter un
    // geste, parce que c'est littéralement le même (D5, « toucher rend actif »).
    this.menu_configuration.subscribe(MAIN_ZONE_TOPIC, () => this.refreshActive())
  }
}
