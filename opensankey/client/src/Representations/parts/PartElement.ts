// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2026 TerriFlux
// ==================================================================================================
// Author        : Julien Alapetite for TerriFlux
// ==================================================================================================

// os#1445 — UNE PART EST UN ÉLÉMENT, au même titre qu'un nœud et qu'un flux.
//
// Arbitrage de Julien (20/09) : « il faut une notion d'élément, et un nœud, un flux, une part sont
// des éléments ». L'abstraction existait déjà et je ne l'avais pas prise : `Class_BaseShape` est
// l'élément qui a une FORME, un LIBELLÉ et une VALEUR — c'est-à-dire exactement les trois onglets
// de l'inspecteur. Les deux natures connues en descendent, la part est le troisième frère :
//
//     Class_BaseShape
//      ├── Class_NodeBase      → Class_NodeElement
//      ├── Class_LinkAttribute → Class_LinkElement
//      └── Class_PartElement   ← ici
//
// La première version étendait `Class_NodeElement`, pour une raison d'héritage d'implémentation et
// non de nature : une part-flux y aurait hérité de dimensions, d'une hiérarchie et de quatre
// poignées de redimensionnement qui n'ont aucun sens pour elle.
//
// ELLE NE SE DESSINE PAS ELLE-MÊME. Un nœud et un flux sont tracés par le moteur Sankey ; une part
// est tracée par le graphique (`SunburstChart` et ses semblables), qui viendra LIRE ses attributs.
// D'où les actions de dessin neutralisées plus bas : sans elles, poser une couleur sur une part
// appellerait une machinerie de nœud qui n'a ni forme SVG ni conteneur à toucher.
//
// ⚠️ NE SURCHARGER AUCUNE CLÉ D'`ALL_ATTRIBUTES_CONFIG` ICI, ET CE N'EST PAS UN OUBLI.
// `createDynamicProperties` pose un `Object.defineProperty` sur l'INSTANCE pour chacune de ces
// clés ; une propriété d'instance masque tout accesseur de prototype. Ces réglages sont donc
// propres à la part PAR CONSTRUCTION — c'est ce qui rend ce lot court, et c'est ce qui fait
// qu'une part porte déjà son ALIAS sans mécanisme neuf.

import { Class_BaseShape } from '../../Elements/Element'
import { ALL_ATTRIBUTES_CONFIG } from '../../Elements/ElementsAttributesConfig'
import { DRAW_TOPIC } from '../../types/EventBus'
import type { Class_DrawingArea } from '../../types/DrawingArea'
import type { Class_ElementStyle } from '../../Elements/Element'
import type { ConfigType } from '../../Elements/ElementsAttributesConfig'
import { NO_SUBJECT, subjectNameOf } from './PartSubject'
import type { Type_PartSubject } from './PartSubject'
import { partStyleSpeaksOf } from './partStyle'

export class Class_PartElement extends Class_BaseShape {

  /**
   * Ce que cette part désigne dans le document : un nœud, un flux, une étiquette qui somme
   * plusieurs flux, ou rien (le secteur de complément). Cf. `PartSubject.ts`.
   */
  /**
   * os#1446 — LE MARQUEUR QUI DIT « JE SUIS UNE PART », lu structurellement.
   *
   * L'inspecteur compte la sélection par nature, et il vit dans l'éditeur, en aval. Lui faire
   * importer cette classe pour un `instanceof` l'attacherait à une nature particulière — alors
   * qu'il n'a besoin que de la question. C'est le procédé déjà en place pour les flux
   * (`isLinkLikeElement`, `ElementNaming.ts`) et pour la même raison.
   */
  public readonly is_figure_part = true

  protected _subject: Type_PartSubject = NO_SUBJECT
  public get subject(): Type_PartSubject { return this._subject }
  public bindSubject(subject: Type_PartSubject): void { this._subject = subject }

  constructor(
    id: string,
    drawing_area: Class_DrawingArea,
    default_style: Class_ElementStyle,
    parent_svg = 'g_elements_sankey'
  ) {
    super(id, drawing_area, parent_svg, default_style)
    // AVANT de relâcher les actions : sinon la première écriture d'attribut chercherait une
    // méthode qui n'existe pas encore.
    this.installRedrawActions()
    // Les feuilles de la hiérarchie relâchent ce drapeau à la fin de leur constructeur (cf.
    // `Class_ProtoElement`) : sans cela, les setters dynamiques resteraient muets pour toujours.
    this._suspend_actions = false
  }

  // LE NOM, ET SON AFFICHAGE ===========================================================
  //
  // Arbitrage de Julien (20/09) : « il y a le nom et le display du nom, donc le même nœud peut
  // être nommé autrement sur le diagramme complet et sur le doughnut, par le jeu d'alias associé
  // au nœud et à la figure ».
  //
  // `name` est le nom du SUJET — une seule vérité, partagée par toutes les figures qui le
  // montrent. L'ALIAS est le libellé de la part, et il vit dans `name_label_source` /
  // `name_label_text`, qui sont des clés de figure : propres à la part par construction.
  //
  // LA RÈGLE, et elle vaut pour les quatre sortes de sujets : renommer depuis une part écrit SON
  // alias, jamais le nom du sujet. Un geste de mise en forme ne modifie pas les données du
  // document. C'est aussi ce qui répond aux deux cas qui n'avaient pas de réponse évidente — une
  // part qui agrège des flux sous une étiquette, et une part-flux libellée par le nœud d'en face :
  // toutes deux se renomment chez elles, sans rien renommer en amont.
  //
  // Le nommage est aujourd'hui implémenté TROIS FOIS (`Class_NodeBase`, `Class_LinkElement`, la
  // zone de texte) et vit sur les feuilles plutôt que sur `Class_BaseShape`. Le remonter est le
  // vrai pas d'homogénéisation, et c'est un lot à lui seul : ici on écrit la quatrième, petite et
  // explicite, en le disant.

  public get name(): string { return subjectNameOf(this._subject) }

  /** L'alias : vide tant que l'auteur n'a rien écrit pour cette part. */
  public get alias(): string {
    return this.name_label_source === 'custom' ? this.name_label_text : ''
  }

  /**
   * Écrire l'alias. Une chaîne vide le retire — la part revient au nom de son sujet, et suit donc
   * de nouveau ce que le document dit.
   */
  public set alias(_: string) {
    if (_.trim() === '') {
      this.name_label_source = 'name'
      this.name_label_text = ''
      return
    }
    this.name_label_source = 'custom'
    this.name_label_text = _
  }

  // `name_label_effective` N'EST PLUS ÉCRIT ICI, et c'est le lot d'homogénéisation qui l'a retiré.
  //
  // Cette classe en portait une version à deux branches — alias, sinon le nom du sujet — parce que
  // la cascade vivait sur `Class_NodeBase` et qu'une part n'en descend pas. Depuis qu'elle est
  // remontée sur `Class_BaseShape`, la base répond, et mieux : elle applique aussi le séparateur de
  // libellé, que ma version ignorait. Une quatrième implémentation du nommage aurait donc introduit
  // une divergence dès le premier réglage de séparateur sur une couronne.
  //
  // Ce qui reste ici est ce qui est VRAI D'UNE PART et d'elle seule : son nom vient de son sujet
  // (ci-dessus), et son alias porte un nom qui se lit (ci-dessus). Le reste est commun à tout
  // élément, et c'est exactement le pas que Julien demandait.

  // CE QUE LA PART DIT — LA PORTE DU TRACÉ =============================================
  //
  // os#1448. Le tracé ne lit sur une part que ce qu'elle DIT (`sunburstPartStyle`, dont la porte
  // est cette méthode) ; sur tout le reste, c'est le réglage de la FIGURE qui tient — et c'est lui
  // qui porte l'aspect de toutes les couronnes enregistrées.
  //
  // La règle d'une part tient en trois lignes, et chacune se paie si on l'oublie :
  //
  //   1. SON SAC PROPRE PARLE TOUJOURS. La version héritée ne le tient pour une surcharge que s'il
  //      DIFFÈRE du style résolu. Pour un nœud c'est sans conséquence — il rend la même valeur
  //      dans les deux cas. Pour une part, non : ce qui l'attend derrière la porte fermée n'est
  //      pas son style, c'est le réglage de la FIGURE, qui peut dire autre chose. Poser sur une
  //      part la valeur que son style porte déjà doit donc compter, sans quoi « cocher le liséré
  //      sur CE secteur » resterait sans effet dès que le style le coche aussi.
  //   2. SES STYLES PARLENT AU-DELÀ DE LEUR AMORCE. C'est ce qui fait marcher « éditer globalement
  //      par les styles » — la seconde moitié de la demande de Julien. Une amorce, elle, reste
  //      muette : elle écraserait ce que l'auteur a réglé sur sa figure (cf. `partStyle.ts`).
  //   3. JAMAIS LE STYLE PAR DÉFAUT (`getCustomStyles` l'écarte, c'est `_style[0]`). Lui seul est
  //      pré-rempli des valeurs d'usine d'un NŒUD : l'écouter repeindrait tout le parc en quatorze
  //      points, liséré noir.

  public override isAttributeOverloaded(attr: keyof ConfigType): boolean {
    if (this.attributes[attr] !== undefined) return true
    return this.getCustomStyles().some(style => partStyleSpeaksOf(style, String(attr)))
  }

  // CE QUI NE SE DESSINE PAS ===========================================================
  //
  // Une part n'a pas de représentation SVG à elle : le graphique la trace. Les setters dynamiques
  // d'`ALL_ATTRIBUTES_CONFIG` déclenchent des actions de dessin (`drawShape`, `drawNameLabel`…)
  // que la classe de base adresse à une machinerie de nœud ; sur une part, elles n'auraient ni
  // forme ni conteneur à toucher. On les neutralise ICI plutôt que de laisser `_suspend_actions`
  // à `true` pour toujours : ce drapeau sert la chaîne de construction, le détourner cacherait
  // aussi les actions qu'on voudrait un jour.

  /**
   * os#1459 — ELLE NE SE DESSINE PAS, MAIS ELLE DEMANDE QU'ON LA REDESSINE.
   *
   * Julien, deux fois : « si on change les attributs ce n'est pas agissant », puis « les attributs
   * ne sont toujours pas agissants sur les parts ». La seconde fois était de ma faute : j'avais
   * surchargé `draw()`, et **un setter d'attribut n'appelle jamais `draw()`**. Il appelle les
   * ACTIONS DÉCLARÉES à côté de l'attribut (`drawShape`, `drawNameLabel`, `drawValueLabel`…, cf.
   * `createDynamicProperties` : `attribute.actions.forEach(...)`). Ma porte n'était jamais
   * franchie.
   *
   * On installe donc TOUTES les actions du catalogue sur l'instance, chacune demandant le même
   * redessin. Énumérées depuis `ALL_ATTRIBUTES_CONFIG` et non écrites à la main : une action
   * ajoutée demain au catalogue sera servie sans que personne ait à y penser — c'est précisément
   * la liste qu'on oublie de tenir à jour.
   *
   * Le redessin lui-même est une ANNONCE : `DRAW_TOPIC` sur le document source, celui que la
   * vignette écoute déjà (`MainZoneTabs`). Pas de boucle : la reconstruction des parts écrit leur
   * sac par `restoreStorage`, qui ne passe pas par les setters dynamiques.
   */
  protected requestFigureRedraw(): void {
    const source = (this.drawing_area?.application_data as unknown as {
      source?: { menu_configuration?: { notify?: (topic: string) => void } }
    })?.source
    source?.menu_configuration?.notify?.(DRAW_TOPIC)
  }

  /** Installe les actions du catalogue sur cette part. Appelé une fois, au constructeur. */
  protected installRedrawActions(): void {
    const actions = new Set<string>()
    Object.values(ALL_ATTRIBUTES_CONFIG).forEach(attr => {
      (attr as { actions?: string[] }).actions?.forEach(a => actions.add(a))
    })
    actions.forEach(name => {
      (this as unknown as { [k: string]: () => void })[name] = () => this.requestFigureRedraw()
    })
  }

  public override draw(): void { this.requestFigureRedraw() }
  public override unDraw(): void { /* rien à retirer du DOM */ }
}
