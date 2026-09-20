// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2026 TerriFlux
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction.
// ==================================================================================================
// Author        : Julien Alapetite for TerriFlux
// ==================================================================================================

// os#1418 — UNE FIGURE EST UN ÉLÉMENT (cf. NOTE-FIGURES.md, jalon 84).
//
// Une figure de la grande zone — l'étoile unitaire d'un nœud, sa couronne, son histogramme, le
// sunburst — se réglait par un mécanisme maison de `Class_MenuConfig` : un sac `options` par
// fenêtre, un dictionnaire `panes` par vignette, un « défaut par nature » réécrit à chaque geste,
// une liste en dur des clés « liées au sujet ». C'était un système de styles qui ne disait pas
// son nom. Ce fichier le remplace par celui qui existe déjà pour les nœuds et les flux :
//
//   - une NATURE déclare ses attributs, sur le patron `AttributeConfig` d'`ALL_ATTRIBUTES_CONFIG`
//     (défaut, type, catégorie, libellés), plus la SORTE de chaque clé (cf. Type_AttributeSort) ;
//   - une nature possède un dictionnaire de STYLES, des `Class_ElementStyle` ordinaires, dont le
//     premier, `default`, est pré-rempli des valeurs d'usine — exactement `Class_Sankey.styles_dict` ;
//   - une FIGURE porte sa surcharge propre (`_storage`) et la liste des styles qu'elle suit, et
//     résout chaque attribut par LA cascade de `Class_ProtoElement.getElementProperty` : surcharge
//     propre, puis styles suivis du dernier au premier, puis valeur d'usine.
//
// La cascade est RÉÉCRITE ici sur le même contrat, et non héritée : `Class_ProtoElement` est
// soudée au SVG (groupe d3, zone de dessin, événements) et une figure n'a rien de tout cela.
// Les noms sont ceux des éléments — `getElementProperty`, `isAttributeOverloaded`, `attributes` —
// pour que ce qui sait lire un nœud sache lire une figure.
//
// TROIS SORTES DE CLÉS, qui sont les trois familles de commandes (NOTE-NAVIGATION-CONTEXTUELLE) :
//   - 'style'      : une façon de regarder, transposable à toute figure de la nature ; c'est la
//                    seule sorte qu'un style a le droit de porter ;
//   - 'navigation' : ce que la figure montre (l'axe de décomposition, os#1414) ; par figure,
//                    jamais par style — Julien a refusé sa propagation ;
//   - 'identity'   : ce qui nomme le sujet ou un objet du sujet (le flux de référence d'une
//                    étoile, la racine d'un sunburst) ; ne se transpose jamais.
// Une clé NON DÉCLARÉE par la nature reste lisible et persistée (rien ne se perd en silence), et
// sa transposabilité retombe sur la règle d'avant, `isTransposableOption` de MenuConfig.
//
// Arbitrages Julien du 16/09/2026 (os#1417) : régler une figure en portée « sélection » n'écrit
// QUE sa surcharge propre — le style ne bouge qu'en portée « style » (fin de l'écriture immédiate
// du défaut de nature de os#1394) ; trois portées jusqu'au lot 7 : cette figure, les figures de
// cette fenêtre, le style.

import { Class_ElementStyle } from '../Elements/Element'
import type { AttributeConfig, ConfigType } from '../Elements/ElementsAttributesConfig'
import type { Type_JSON } from '../types/Utils'

/** La sorte d'une clé de réglage de figure (cf. en-tête). Absente dans une déclaration = 'style'. */
export type Type_AttributeSort = 'style' | 'navigation' | 'identity'

/**
 * os#1425 — COMMENT UN RÉGLAGE SE RÈGLE, déclaré avec lui.
 *
 * Une nature écrivait son interface à la main (`renderOptions`), et chacune réinventait la case à
 * cocher, le sélecteur, l'indicateur de surcharge — une interface à part, à côté de celle des
 * nœuds et des flux. Ce qu'un réglage a de particulier tient pourtant en peu de choses : la sorte
 * de contrôle, et les valeurs qu'il accepte. Déclarées ici, elles suffisent à rendre l'interface,
 * et les natures cessent d'en écrire.
 *
 * `kind` absent se DÉDUIT du type de la valeur d'usine — booléen, nombre, texte. Il ne se donne
 * que pour ce qu'aucun type ne dit : une liste de choix, une couleur, ou `'none'` pour un réglage
 * qui n'a pas d'interface (la racine d'une figure, posée par la fenêtre).
 */
export type Type_FigureControlKind = 'checkbox' | 'select' | 'segmented' | 'number' | 'text' | 'color' | 'none'

/** Un choix, avec son libellé dans les sept langues du dépôt (sa#531). */
export type Type_FigureChoice = {
  value: string | number
  labels: { [lang: string]: string }
}

/** De quoi résoudre les choix qui viennent du MODÈLE : les axes du diagramme, ses étiquettes. */
export type Type_FigureChoiceContext = {
  app_data: { drawing_area?: { sankey?: unknown }, t?: unknown }
  element?: unknown
}

export type Type_FigureControl = {
  kind?: Type_FigureControlKind
  /** Les choix FIXES (un régime de valeur, une orientation). */
  choices?: Type_FigureChoice[]
  /**
   * Les choix qui viennent du diagramme (les hiérarchies déclarées, les groupes d'étiquettes) :
   * résolus au moment de rendre, jamais figés dans la déclaration.
   */
  choicesOf?: (ctx: Type_FigureChoiceContext) => { value: string, label: string }[]
  min?: number
  max?: number
  step?: number
  /**
   * Ne montrer ce réglage que si la condition tient : l'unité n'a de sens que si les valeurs
   * s'affichent, le dégradé que si la couleur vient d'une palette. Un réglage caché garde sa
   * valeur — il redevient visible dès que sa condition revient.
   */
  visibleIf?: (options: Type_OptionBag) => boolean
  /** Le groupe visuel où ranger le contrôle ; clé i18n, cf. `figure.group.*`. */
  group?: string
  /**
   * os#1425 — L'ONGLET où ce réglage PROPRE rejoint ceux des éléments.
   *
   * Une figure ajoute des questions que les nœuds et les flux ne se posent pas — le pourcentage
   * écrit à côté d'une valeur, l'orientation d'une étiquette dans son secteur. Elles appartiennent
   * pourtant à la MÊME famille que des réglages d'élément, et les laisser dans un onglet « Figure »
   * à part obligerait l'auteur à régler l'affichage d'une valeur à deux endroits.
   *
   * Absent : le réglage reste dans l'onglet propre à la figure (le centre, la légende, le geste du
   * clic — qui n'ont d'équivalent dans aucune famille).
   */
  family?: 'shape' | 'name_label' | 'value_label'
  /**
   * os#1425 — UN RÉGLAGE AVANCÉ : vrai, mais rarement ce qu'on vient chercher.
   *
   * Il ne disparaît pas, il se replie — le formulaire le range sous un « Avancé » fermé. C'est la
   * réponse au reproche que la première version de ce formulaire a valu : tout mettre au même
   * niveau fait lire quatre questions là où l'auteur n'en a qu'une, et les trois autres n'ont
   * souvent aucun effet visible (le côté du nœud d'où la valeur se lit ne change rien sur un
   * diagramme bouclé, où entrées et sorties sont égales).
   */
  advanced?: boolean
}

/** Un attribut déclaré par une nature : le patron des éléments, plus sa sorte et son contrôle. */
export type Type_FigureAttributeConfig = AttributeConfig<unknown> & {
  sort?: Type_AttributeSort
  ui?: Type_FigureControl
}
export type Type_FigureAttributesConfig = Record<string, Type_FigureAttributeConfig>

/** Un sac de réglages, la forme que les natures lisent (`ctx.options`) et écrivent (`setOptions`). */
export type Type_OptionBag = { [key: string]: unknown }

/** L'identifiant du style pré-rempli d'usine de chaque nature — le même mot que pour les éléments. */
export const FIGURE_DEFAULT_STYLE_ID = 'default'

/** Clé de vignette d'une fenêtre à sujet DIAGRAMME, qui n'a qu'une figure. */
export const FIGURE_DIAGRAM_PANE_KEY = ''

/** Comparaison par sérialisation : un descripteur ou une liste sont des valeurs composées. */
const sameValue = (a: unknown, b: unknown): boolean => JSON.stringify(a) === JSON.stringify(b)

// --- Le rapport de migration -------------------------------------------------------------------

/**
 * os#1419 — UNE CLÉ SANS PRENEUR NE DISPARAÎT PAS EN SILENCE.
 *
 * La migration des fichiers d'avant (options par fenêtre, `panes`, `representation_defaults`)
 * ÉNUMÈRE et RAPPORTE ce qu'elle n'a pas su porter : une clé qu'aucune nature ne déclare (gardée,
 * mais dite), une clé liée au sujet trouvée dans un défaut de nature (écartée, et dite). Vécu trois
 * semaines sur sa#283 : ce qui se perd sans bruit se découvre un essai à la fois.
 */
export type Type_FigureMigrationNote = {
  nature: string
  key: string
  /** Où on l'a trouvée : `options` de la fenêtre w_3, `panes[chene]`, `representation_defaults`… */
  where: string
  /**
   * - `'unknown_key'` : aucune nature ne déclare cette clé ; elle est GARDÉE telle quelle.
   * - `'not_transposable'` : clé déclarée d'une sorte qu'un style n'a pas le droit de porter
   *   (identité, navigation) ; elle est ÉCARTÉE.
   * - `'legacy_on_node'` (os#1421) : un `surfaces.on_node` d'avant les placements (OS#1278) qu'on
   *   n'a pas pu porter en figure — un descripteur sans aucun axe ne dessine rien, donc il n'y a
   *   rien à poser sur le nœud. Le booléen est retiré, et c'est dit plutôt que passé sous silence :
   *   ni 'unknown_key' (la clé est connue, elle n'a simplement plus de preneur) ni
   *   'not_transposable' (rien ne se transpose ici) ne décrivaient ce cas.
   */
  reason: 'unknown_key' | 'not_transposable' | 'legacy_on_node'
}

export class Class_FigureMigrationReport {
  private _notes: Type_FigureMigrationNote[] = []
  private _migrated = 0

  public countMigrated(n = 1): void { this._migrated += n }
  public add(note: Type_FigureMigrationNote): void { this._notes.push(note) }
  public get notes(): readonly Type_FigureMigrationNote[] { return this._notes }
  public get migrated(): number { return this._migrated }
  public get is_empty(): boolean { return this._notes.length === 0 && this._migrated === 0 }

  /** Un résumé lisible, ou `null` s'il n'y a rien à dire. Compte + exemples nommés, jamais « au mieux ». */
  public summary(): string | null {
    if (this._notes.length === 0) return null
    const examples = this._notes.slice(0, 5)
      .map(n => `${n.nature}:${n.key} (${n.where}, ${n.reason})`).join(' ; ')
    const more = this._notes.length > 5 ? ` … +${this._notes.length - 5}` : ''
    return `[figures] migration : ${this._migrated} réglage(s) porté(s), ` +
      `${this._notes.length} non porté(s) tel(s) quel(s) : ${examples}${more}`
  }

  public reset(): void { this._notes = []; this._migrated = 0 }
}

// --- La nature ----------------------------------------------------------------------------------

/**
 * UNE NATURE DE FIGURE : la déclaration de ses attributs et ses styles.
 *
 * Le style `default` est construit non supprimable, donc PRÉ-REMPLI de toutes les valeurs d'usine
 * (cf. le constructeur de `Class_ElementStyle`) : c'est ce qui fait qu'une figure sans surcharge
 * ni style suivi rend quand même une valeur pour chaque clé déclarée. Les autres styles ne portent
 * que ce qu'on y a posé.
 */
export class Class_FigureNature {
  public readonly id: string
  public readonly config: Type_FigureAttributesConfig
  private readonly _default: Class_ElementStyle
  private _styles: { [style_id: string]: Class_ElementStyle } = {}

  constructor(id: string, config: Type_FigureAttributesConfig) {
    this.id = id
    this.config = config
    // `Class_ElementStyle` pose un accesseur PAR CLÉ déclarée sur l'instance : une clé qui porte le
    // nom d'un membre du style (`attributes`, `id`, `name`…) l'écraserait. On refuse à la
    // construction plutôt que de découvrir un style muet à l'usage.
    const reserved = Object.getOwnPropertyNames(Class_ElementStyle.prototype)
    const clash = Object.keys(config).find(k => reserved.includes(k))
    if (clash) throw new Error(`Figure nature ${id}: attribute key '${clash}' collides with Class_ElementStyle`)
    this._default = new Class_ElementStyle(
      config as ConfigType, FIGURE_DEFAULT_STYLE_ID, FIGURE_DEFAULT_STYLE_ID, false
    )
    this._styles[FIGURE_DEFAULT_STYLE_ID] = this._default
  }

  public get default_style(): Class_ElementStyle { return this._default }
  public get styles_dict(): { readonly [style_id: string]: Class_ElementStyle } { return this._styles }
  public style(style_id: string): Class_ElementStyle | undefined { return this._styles[style_id] }
  public get declared_keys(): string[] { return Object.keys(this.config) }
  public isDeclared(key: string): boolean { return key in this.config }

  /** La sorte d'une clé déclarée ('style' si la déclaration ne dit rien) ; `undefined` si non déclarée. */
  public sortOf(key: string): Type_AttributeSort | undefined {
    const c = this.config[key]
    return c ? (c.sort ?? 'style') : undefined
  }

  /**
   * Un réglage a-t-il un sens sur la figure voisine ? Déclaré : seule la sorte 'style' voyage.
   * Non déclaré : la règle d'avant (`fallback`, la liste de MenuConfig), pour ne rien casser.
   */
  public isTransposable(key: string, fallback: (key: string) => boolean): boolean {
    const sort = this.sortOf(key)
    return sort === undefined ? fallback(key) : sort === 'style'
  }

  public factoryDefault(key: string): unknown { return this.config[key]?.default }

  /**
   * Un style nommé de plus ; existant = rendu tel quel (idempotent, sûr à la relecture).
   * TOUJOURS supprimable (`is_deletable = true`) : c'est `!is_deletable` qui pré-remplit d'usine,
   * et un style nommé pré-rempli serait écrit EN ENTIER dans le fichier par `toJSON`. Le seul
   * style d'usine d'une nature est `default`.
   */
  public createStyle(style_id: string, name: string = style_id): Class_ElementStyle {
    const existing = this._styles[style_id]
    if (existing) return existing
    const s = new Class_ElementStyle(this.config as ConfigType, style_id, name, true, this._default)
    this._styles[style_id] = s
    return s
  }

  /**
   * Retire un style du dictionnaire. Les FIGURES qui le suivaient ne sont pas connues d'ici (une
   * figure ne s'enregistre pas comme référence de ses styles, cf. la note sur `addStyle`) : c'est
   * à l'hôte de balayer ses figures et d'appeler `removeStyleById`, sans quoi elles continueraient
   * de suivre un style que le fichier ne saura plus nommer.
   */
  public deleteStyle(style_id: string): void {
    if (style_id === FIGURE_DEFAULT_STYLE_ID) return
    delete this._styles[style_id]
  }

  // ── HÔTE DE STYLES (os#1458) ────────────────────────────────────────────────────────────────
  //
  // Une nature de figure DÉTENAIT déjà une famille de styles nommés — créer, supprimer, un défaut.
  // Ce qui lui manquait, c'était de le dire sous les mots que l'éditeur de styles emploie, lui qui
  // sert les nœuds et les flux depuis toujours. Ces cinq membres ne sont donc que des SYNONYMES :
  // aucune logique nouvelle, et c'est le signe que la factorisation était la bonne (« normalement,
  // avec la factorisation, tout devient simple », Julien).
  //
  // Ce que ça débloque : l'onglet Styles d'une figure peut monter LE composant de styles — famille,
  // liste, « + », renommage — au lieu de sa demi-interface. Une nature de plus ne coûtera plus une
  // ligne d'interface.

  public get styles_list(): Class_ElementStyle[] { return Object.values(this._styles) }

  public addNewDefaultElementStyle(): Class_ElementStyle {
    // Même façon de nommer que côté Sankey : le rang dans la famille, pas un identifiant à lire.
    const rank = String(this.styles_list.length)
    return this.createStyle(this.id + '_style_' + rank, 'Style ' + rank)
  }

  public deleteElementStyle(style: Class_ElementStyle): void { this.deleteStyle(style.id) }

  /**
   * Assigner le style AUX FIGURES CITÉES, et à elles seules.
   *
   * Une nature décrit une SORTE, pas un objet à l'écran : elle ne sait pas quelle figure l'auteur
   * regarde, et l'inventer serait deviner. C'est pourquoi l'hôte de styles accepte une cible
   * explicite — l'appelant tient déjà la liste de ce qu'il édite (cf. `Type_StyleHost`).
   */
  public switchElementStyle(style: Class_ElementStyle, add: boolean, targets?: unknown[]): void {
    (targets ?? []).forEach(target => {
      // Les VRAIS noms de `Class_Figure` : `addStyle` prend le style, `removeStyleById`
      // l'identifiant. Une première version avait inventé `addStyleId` des deux côtés, et le test
      // l'avait laissée passer parce qu'il se donnait un faux objet portant ce nom-là — un vert
      // qui ne validait que mon invention.
      const figure = target as {
        addStyle?: (style: Class_ElementStyle) => void
        removeStyleById?: (id: string) => void
      }
      if (add) figure.addStyle?.(style)
      else figure.removeStyleById?.(style.id)
    })
  }

  /** Rendre au style ses valeurs d'usine : un sac vide, que `assignStyle` interprète ainsi. */
  public resetAttrStyle(style: Class_ElementStyle): void { this.assignStyle(style, {}) }

  /** Retirer UNE clé posée sur ce style ; elle repasse à ce dont elle hérite. */
  public deleteLocalAttrStyle(style: Class_ElementStyle, key: string): void {
    const next = { ...this.styleBag(style) }
    delete next[key]
    this.assignStyle(style, next)
  }

  /**
   * LE SAC D'UN STYLE : ce qu'il dit, clé par clé. Pour `default`, toutes les clés déclarées de
   * sorte 'style' (il est pré-rempli d'usine) ; pour un autre style, ce qu'il porte explicitement.
   * C'est ce que le volet montre en portée « style », et ce que `assignStyle` reçoit en retour.
   */
  public styleBag(style: Class_ElementStyle): Type_OptionBag {
    const out: Type_OptionBag = {}
    Object.keys(style.attributes).forEach(key => {
      const v = style.getElementProperty(key)
      if (v !== undefined && this.sortOf(key) !== 'identity' && this.sortOf(key) !== 'navigation') out[key] = v
    })
    return out
  }

  /**
   * ÉCRIRE UN STYLE depuis un sac complet (le contrat de `setOptions`). Seules les clés de sorte
   * 'style' entrent — c'est le garde-fou de os#1416, à l'ÉCRITURE et non dans l'interface : quelle
   * que soit la surface, une clé d'identité ou de navigation n'atterrit jamais dans un style.
   * Rend les clés qu'il a refusées, pour que l'appelant les pose ailleurs (sur la figure active)
   * ou les rapporte.
   *
   * Pour `default`, une clé absente du sac reprend sa valeur d'usine ; pour un autre style, elle
   * est retirée — un style ordinaire ne dit que ce qu'on y a posé.
   */
  public assignStyle(style: Class_ElementStyle, next: Type_OptionBag): string[] {
    const refused: string[] = []
    const storage: Record<string, unknown> = { ...style.attributes }
    Object.entries(next).forEach(([key, value]) => {
      if (this.isDeclared(key) && this.sortOf(key) !== 'style') {
        // Refusée, ET nettoyée si un fichier d'avant l'avait posée là : sans ce `delete`, un
        // style pollué ne pourrait plus jamais se laver, la clé étant `in next` à chaque geste.
        refused.push(key)
        delete storage[key]
        return
      }
      if (value === undefined) delete storage[key]
      else storage[key] = value
    })
    Object.keys(storage).forEach(key => {
      if (key in next) return
      // Une clé NON DÉCLARÉE absente du sac est laissée telle quelle : « reprendre l'usine »
      // n'a pas de sens sans déclaration, et la vider ferait perdre en silence ce qu'un fichier
      // portait (relecture du lot A, 16/09).
      if (!this.isDeclared(key)) return
      if (style.is_default_style) storage[key] = this.factoryDefault(key)
      else delete storage[key]
    })
    style.attributes = storage
    return refused
  }

  /**
   * Sérialisation des styles de la nature, ou `undefined` s'il n'y a rien à écrire. Même règle
   * que `StylePersistence.toJSON` : `default` n'écrit que ses écarts à l'usine, les autres tout ce
   * qu'ils portent. Clé ADDITIVE : un document dont personne n'a réglé une figure n'en porte pas.
   */
  public toJSON(): Type_JSON | undefined {
    const out: Type_JSON = {}
    Object.values(this._styles).forEach(style => {
      const attrs: Type_JSON = {}
      Object.entries(style.attributes).forEach(([key, value]) => {
        if (value === undefined) return
        const keep = style.is_default_style
          ? !sameValue(value, this.factoryDefault(key))
          : true
        if (keep) attrs[key] = value as Type_JSON[string]
      })
      // `default` n'est écrit que s'il s'écarte de l'usine ; un style NOMMÉ est écrit dès qu'il
      // existe, même vide — sinon il disparaîtrait au rechargement et les figures qui le suivent
      // le perdraient en silence (relecture du lot A).
      if (style.is_default_style) {
        if (Object.keys(attrs).length > 0) out[style.id] = { attributes: attrs }
      } else out[style.id] = { name: style.name, attributes: attrs }
    })
    return Object.keys(out).length > 0 ? out : undefined
  }

  /**
   * Relecture. Une clé non déclarée est GARDÉE et rapportée ; une clé déclarée d'une autre sorte
   * que 'style' est ÉCARTÉE et rapportée (un défaut pollué d'avant os#1394 portait des flux de
   * référence étrangers : les relire referait la figure fausse).
   */
  public fromJSON(json: unknown, report: Class_FigureMigrationReport, where: string): void {
    if (!json || typeof json !== 'object' || Array.isArray(json)) return
    Object.entries(json as Type_JSON).forEach(([style_id, raw]) => {
      if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return
      const entry = raw as Type_JSON
      const attrs = entry['attributes']
      if (!attrs || typeof attrs !== 'object' || Array.isArray(attrs)) return
      const name = typeof entry['name'] === 'string' ? entry['name'] : style_id
      const style = style_id === FIGURE_DEFAULT_STYLE_ID ? this._default : this.createStyle(style_id, name)
      // Le nom du fichier fait foi, même si le style existait déjà (relecture dans une nature
      // déjà peuplée) : sinon l'aller-retour réécrirait l'ancien nom.
      if (!style.is_default_style) style.name = name
      const accepted: Type_OptionBag = {}
      Object.entries(attrs as Type_JSON).forEach(([key, value]) => {
        const sort = this.sortOf(key)
        if (sort === undefined) {
          report.add({ nature: this.id, key, where: `${where}[${style_id}]`, reason: 'unknown_key' })
          accepted[key] = value
        } else if (sort !== 'style') {
          report.add({ nature: this.id, key, where: `${where}[${style_id}]`, reason: 'not_transposable' })
        } else accepted[key] = value
      })
      // `default` est pré-rempli d'usine : on FUSIONNE (le fichier n'écrit que ses écarts). Un
      // style nommé ne dit que ce qu'on y a posé : on REMPLACE, sinon deux lectures s'accumulent.
      style.attributes = style.is_default_style ? { ...style.attributes, ...accepted } : accepted
      report.countMigrated(Object.keys(accepted).length)
    })
  }
}

// --- La figure ----------------------------------------------------------------------------------

/**
 * UNE FIGURE : une vignette de la grande zone, réglée comme un élément.
 *
 * Sa CLÉ est son identité (`Type_MainZonePane.key`, cf. mainZoneWindow) : le même nœud peut
 * figurer deux fois dans une fenêtre, réglé autrement, et l'identifiant du sujet ne suffit donc
 * pas à la nommer. Le sujet, lui, n'est pas ici : c'est l'affaire de la fenêtre.
 */
export class Class_Figure {
  public readonly key: string
  public readonly nature: Class_FigureNature
  /**
   * os#1421 — L'IDENTIFIANT DE DOCUMENT, `null` tant que la figure n'est qu'une vignette.
   *
   * Une figure de vignette se nomme par (fenêtre, clé) et MEURT avec sa fenêtre : c'est très bien
   * pour un réglage qu'on ne voit que là, et impossible à CITER depuis ailleurs. Un placement sur
   * un nœud cite une figure et doit lui survivre — d'où un second nom, stable et propre au
   * document (`f_N`), donné par le REGISTRE (`Class_MenuConfig.figureIdOf`) au moment où on pose
   * la figure quelque part, et à ce moment-là seulement.
   *
   * Une figure qui n'a jamais été posée garde donc `null`, ne s'indexe nulle part, et s'écrit
   * EXACTEMENT comme avant ce lot (les goldens ne bougent pas). C'est la PROMOTION qui coûte deux
   * clés de plus, et elle n'a lieu que si quelqu'un a besoin de nommer la figure.
   */
  public id: string | null = null
  private _storage: Type_OptionBag = {}
  private _style: Class_ElementStyle[]

  constructor(nature: Class_FigureNature, key: string) {
    this.nature = nature
    this.key = key
    this._style = [nature.default_style]
  }

  // --- styles suivis, même surface que Class_ProtoElement ---

  public get style(): readonly Class_ElementStyle[] { return this._style }

  /**
   * Ajoute un style en fin de liste (donc prioritaire). Déjà présent : rien.
   *
   * PAS DE RÉFÉRENCE INVERSE, et c'est assumé : `Class_ElementStyle.addReference` attend un
   * `Class_BaseElement` et appelle `ref.draw()`, qu'une figure n'a pas. Deux conséquences que
   * l'hôte doit porter : écrire un style ne redessine aucune figure (c'est `_notifyMainZone` qui
   * remonte les vignettes), et `style.reference_count` vaut toujours 0 pour un style de figure.
   */
  public addStyle(style: Class_ElementStyle): void {
    if (this._style.some(s => s.id === style.id)) return
    this._style.push(style)
  }

  public removeStyleById(style_id: string): void {
    if (style_id === FIGURE_DEFAULT_STYLE_ID) return
    this._style = this._style.filter(s => s.id !== style_id)
  }

  /** Remplace tous les styles suivis, sauf le défaut. */
  public replaceStyles(styles: Class_ElementStyle[]): void {
    this._style = [this._style[0], ...styles.filter(s => s.id !== FIGURE_DEFAULT_STYLE_ID)]
  }

  public hasStyle(style_id: string): boolean { return this._style.some(s => s.id === style_id) }

  // --- la cascade ---

  /** Le style le plus spécifique qui dit quelque chose de cette clé, sinon le défaut. */
  public getStyleWithAttr(key: string): Class_ElementStyle {
    return this._style.slice().reverse().find(s => s.getElementProperty(key) !== undefined) ?? this._style[0]
  }

  public getStylesWithAttr(key: string): Class_ElementStyle[] {
    return this._style.filter(s => s.getElementProperty(key) !== undefined)
  }

  /** Ce que les styles disent, sinon l'usine ; `undefined` pour une clé que rien ne porte. */
  public getStyleProperty(key: string): unknown {
    const v = this.getStyleWithAttr(key).getElementProperty(key)
    return v !== undefined ? v : this.nature.factoryDefault(key)
  }

  /** LA CASCADE : surcharge propre, puis styles suivis du dernier au premier, puis usine. */
  public getElementProperty(key: string): unknown {
    const own = this._storage[key]
    return own !== undefined ? own : this.getStyleProperty(key)
  }

  public isAttributeExplicit(key: string): boolean { return this._storage[key] !== undefined }

  /** Surchargé = posé ici ET différent de ce que la cascade rendrait sans lui. */
  public isAttributeOverloaded(key: string): boolean {
    return this.isAttributeExplicit(key) && !sameValue(this._storage[key], this.getStyleProperty(key))
  }

  // --- les deux sacs ---

  /**
   * LES RÉGLAGES EFFECTIFS, la forme que les natures lisent (`ctx.options`) : toutes les clés
   * déclarées qui ont une valeur, plus les clés propres non déclarées (rien ne se perd). Un objet
   * NEUF à chaque appel — l'hôte le sérialise pour décider d'un remontage.
   */
  public get attributes(): Type_OptionBag {
    // Les clés déclarées, PLUS toute clé non déclarée que la surcharge propre ou un style suivi
    // porte : la cascade la voit (elle lit les storages), le sac doit la voir aussi — sinon une
    // clé gardée « pour ne rien perdre » serait perdue pour la nature qui la lit.
    const keys = new Set<string>(this.nature.declared_keys)
    Object.keys(this._storage).forEach(k => keys.add(k))
    this._style.forEach(s => Object.keys(s.attributes).forEach(k => keys.add(k)))
    const out: Type_OptionBag = {}
    keys.forEach(key => {
      const v = this.getElementProperty(key)
      if (v !== undefined) out[key] = v
    })
    return out
  }

  /** La surcharge propre seule, telle qu'elle s'écrit dans le fichier. */
  public get own(): Type_OptionBag { return { ...this._storage } }

  /**
   * ÉCRIRE DEPUIS UN SAC COMPLET — le contrat de `setOptions` (l'objet entier, pas un patch).
   *
   * Une valeur égale à ce que la cascade rend déjà N'EST PAS une surcharge : elle n'est pas posée,
   * et si elle l'était, elle est retirée — c'est `shouldSaveAttribute` des éléments, et c'est ce
   * qui fait qu'une figure réglée « comme son style » continue de le suivre quand il change. Une
   * clé absente du sac est retirée de la surcharge propre ; `undefined` aussi.
   *
   * N'ÉCRIT QUE CETTE FIGURE (arbitrage du 16/09) : ni le style, ni les voisines.
   */
  public assign(next: Type_OptionBag): void {
    Object.entries(next).forEach(([key, value]) => {
      if (value === undefined) { delete this._storage[key]; return }
      if (this.nature.isDeclared(key) && sameValue(value, this.getStyleProperty(key))) {
        delete this._storage[key]
      } else this._storage[key] = value
    })
    Object.keys(this._storage).forEach(key => { if (!(key in next)) delete this._storage[key] })
  }

  /** Pose UNE clé, sans toucher aux autres (même règle de surcharge minimale). */
  public set(key: string, value: unknown): void {
    if (value === undefined || (this.nature.isDeclared(key) && sameValue(value, this.getStyleProperty(key)))) {
      delete this._storage[key]
    } else this._storage[key] = value
  }

  public delete(key: string): void { delete this._storage[key] }

  /** Reprend TELLE QUELLE une surcharge d'avant (migration) : pas de minimisation, rien ne se perd. */
  public loadOwn(storage: Type_OptionBag): void {
    this._storage = {}
    Object.entries(storage).forEach(([key, v]) => { if (v !== undefined) this._storage[key] = v })
  }

  // --- persistance ---

  /**
   * `{ attributes?, styles? }`, ou `undefined` quand la figure n'a rien à dire (elle suit le défaut).
   *
   * os#1421 — UNE FIGURE PROMUE SE NOMME ELLE-MÊME : `id` et `nature` s'ajoutent, et UNIQUEMENT
   * pour elle. Deux raisons de ne les écrire qu'alors : une figure de vignette n'en a pas besoin
   * (sa fenêtre dit sa nature, sa clé dit qui elle est), et les écrire quand même changerait tous
   * les fichiers d'aujourd'hui. Pour une entrée de REGISTRE, au contraire, ce sont les deux seules
   * choses qui la rattachent à quelque chose : elle est écrite hors de toute fenêtre, et rien
   * d'autre ne dirait de quelle nature elle est au moment de la relire.
   *
   * Conséquence voulue : une figure promue n'est JAMAIS `undefined`, même vide. Elle a un
   * référent — un placement la cite — et disparaître du fichier lui ferait perdre ce lien.
   */
  public toJSON(): Type_JSON | undefined {
    const out: Type_JSON = {}
    const own = this.own
    if (Object.keys(own).length > 0) out['attributes'] = own as Type_JSON
    const followed = this._style.slice(1).map(s => s.id)
    if (followed.length > 0) out['styles'] = followed
    if (this.id !== null) {
      out['id'] = this.id
      out['nature'] = this.nature.id
    }
    return Object.keys(out).length > 0 ? out : undefined
  }

  /**
   * Relecture d'une figure écrite par `toJSON`. Une clé non déclarée est gardée et rapportée ; un
   * style suivi que la nature ne connaît pas est ignoré (le fichier peut venir d'une version qui
   * l'offrait).
   */
  public fromJSON(json: unknown, report: Class_FigureMigrationReport, where: string): void {
    if (!json || typeof json !== 'object' || Array.isArray(json)) return
    const entry = json as Type_JSON
    // os#1421 — l'identifiant de document, s'il est là. Absent = figure de vignette : `id` reste
    // `null` et rien ne change. Le registre, lui, repose l'id qu'il a lu de sa clé — ici on ne
    // fait que ne PAS le perdre quand l'entrée se relit seule.
    const doc_id = entry['id']
    if (typeof doc_id === 'string' && doc_id !== '') this.id = doc_id
    const attrs = entry['attributes']
    if (attrs && typeof attrs === 'object' && !Array.isArray(attrs)) {
      const own: Type_OptionBag = {}
      Object.entries(attrs as Type_JSON).forEach(([key, value]) => {
        if (!this.nature.isDeclared(key)) {
          report.add({ nature: this.nature.id, key, where, reason: 'unknown_key' })
        }
        own[key] = value
      })
      this.loadOwn(own)
      report.countMigrated(Object.keys(own).length)
    }
    const styles = entry['styles']
    if (Array.isArray(styles)) {
      // La liste du fichier REMPLACE la liste courante : relire deux fois n'accumule pas.
      this.replaceStyles([])
      styles.forEach(id => {
        const s = typeof id === 'string' ? this.nature.style(id) : undefined
        if (s) this.addStyle(s)
      })
    }
  }
}

/**
 * CE QU'UNE PORTÉE « TOUTES LES FIGURES DE LA FENÊTRE » A LE DROIT DE PORTER : ce qui vient de
 * changer, moins ce qui ne se transpose pas. Le diff et non le sac entier — recopier tout le jeu
 * de l'auteur sur ses voisines écraserait ce qu'elles disent par ailleurs. Une clé RETIRÉE ne
 * voyage pas (aucun réglage ne se supprime aujourd'hui). Repris de MenuConfig (os#1416), la
 * transposabilité venant désormais de la déclaration de la nature.
 */
export const transposableBagChanges = (
  prev: Type_OptionBag | undefined,
  next: Type_OptionBag | undefined,
  isTransposable: (key: string) => boolean
): Type_OptionBag => {
  const out: Type_OptionBag = {}
  Object.entries(next ?? {}).forEach(([key, value]) => {
    if (!isTransposable(key)) return
    if (!sameValue((prev ?? {})[key], value)) out[key] = value
  })
  return out
}
