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
import type { Class_DrawingArea } from '../../types/DrawingArea'
import type { Class_ElementStyle } from '../../Elements/Element'
import { NO_SUBJECT, subjectNameOf } from './PartSubject'
import type { Type_PartSubject } from './PartSubject'

export class Class_PartElement extends Class_BaseShape {

  /**
   * Ce que cette part désigne dans le document : un nœud, un flux, une étiquette qui somme
   * plusieurs flux, ou rien (le secteur de complément). Cf. `PartSubject.ts`.
   */
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

  /**
   * Ce que la part AFFICHE : son alias s'il y en a un, sinon le nom de son sujet. Même cascade que
   * `Class_NodeBase.name_label_effective`, réduite aux deux sources qu'une part connaît — elle n'a
   * ni tags assignés, ni dimensions, ni gabarit.
   */
  public get name_label_effective(): string {
    const own = this.alias
    return own.trim() !== '' ? own : this.name
  }

  // CE QUI NE SE DESSINE PAS ===========================================================
  //
  // Une part n'a pas de représentation SVG à elle : le graphique la trace. Les setters dynamiques
  // d'`ALL_ATTRIBUTES_CONFIG` déclenchent des actions de dessin (`drawShape`, `drawNameLabel`…)
  // que la classe de base adresse à une machinerie de nœud ; sur une part, elles n'auraient ni
  // forme ni conteneur à toucher. On les neutralise ICI plutôt que de laisser `_suspend_actions`
  // à `true` pour toujours : ce drapeau sert la chaîne de construction, le détourner cacherait
  // aussi les actions qu'on voudrait un jour.

  public override draw(): void { /* le graphique trace, pas la part */ }
  public override unDraw(): void { /* rien à retirer du DOM */ }
}
