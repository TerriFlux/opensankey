// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2026 TerriFlux
// ==================================================================================================
// Author        : Julien Alapetite for TerriFlux
// ==================================================================================================

// os#1445 — UNE PART DE COURONNE EST UN ÉLÉMENT, dont le SUJET est un nœud du document.
//
// Demande de Julien (20/09) : « figure = graphe, et les trois autres parties devraient être dans
// forme / libellé / valeur de l'élément sélectionné (la part de la couronne) ; pour éditer
// globalement on le fait par les styles ». Ce qui l'empêchait n'était pas l'écran mais le modèle :
// une part n'existait que comme une ligne de données dans le tracé, sans rien à sélectionner ni à
// styler. Les réglages d'aspect avaient donc été mis sur la FIGURE, faute d'un endroit juste.
//
// LA FRONTIÈRE, EN UNE PHRASE : le SUJET se délègue, la FIGURE ne se délègue pas.
//
//  - SUJET (nom, étiquettes, hiérarchie) : lu ET écrit sur le nœud du document. Renommer une part
//    renomme le nœud du diagramme, et il n'y a qu'un historique.
//  - FIGURE (forme, couleurs, libellé — tout `ALL_ATTRIBUTES_CONFIG`) : propre à cette couronne.
//    Repeindre une part ne repeint pas le nœud sur le Sankey.
//
// C'est l'arbitrage rendu le 17/09 pour l'étoile unitaire, repris tel quel : voir `StarNode.ts`,
// dont ce fichier est le jumeau sans les flux.
//
// ⚠️ NE SURCHARGER AUCUNE CLÉ D'`ALL_ATTRIBUTES_CONFIG` ICI, ET CE N'EST PAS UN OUBLI.
// `Class_ProtoElement.createDynamicProperties` (`Elements/Element.tsx` ~538) pose un
// `Object.defineProperty(this, clé, …)` sur l'INSTANCE pour chacune de ces clés ; une propriété
// propre à l'instance MASQUE tout accesseur de prototype d'une sous-classe. Ces réglages sont donc
// déjà propres à la part PAR CONSTRUCTION, sans une ligne — et une délégation écrite ici serait
// morte au premier `new`. C'est exactement ce qu'on veut : ce sont la figure.

import { Class_NodeElement } from '../../Elements/Node'
import type { Class_Tag } from '../../types/Tag'
import type { Type_LangMap } from '../../Persistence/persistenceMigrations'

export class Class_DonutPart extends Class_NodeElement {

  /**
   * Le nœud du document dont cette part est le proxy.
   *
   * NUL ENTRE LA CONSTRUCTION ET LA LIAISON, et c'est structurel : la chaîne de fabriques
   * (`addNewNode` → `createNewNode`) ne transporte pas d'argument supplémentaire. Chaque accesseur
   * délégué retombe donc sur `super` tant que le sujet est nul, et le constructeur de la couronne
   * appelle `bindSubject` juste après `addNewNode`.
   *
   * NUL POUR TOUJOURS DANS UN CAS, et il est légitime : le secteur RÉSIDUEL — le complément que
   * les enfants ne couvrent pas, en mode `declared` — ne désigne aucun nœud. C'est une part sans
   * sujet, qui se règle comme les autres et ne renomme rien.
   */
  protected _subject: Class_NodeElement | null = null
  public get subject(): Class_NodeElement | null { return this._subject }

  /** Lie cette part à son sujet. Appelée une fois, juste après `addNewNode`. */
  public bindSubject(subject: Class_NodeElement): void {
    this._subject = subject
  }

  // NOM ================================================================================

  public override get name(): string {
    return this._subject !== null ? this._subject.name : super.name
  }

  /**
   * Renommer une part renomme le nœud du DOCUMENT. Le sujet redessine son propre libellé dans son
   * diagramme ; la couronne, elle, est retracée par son cycle à elle — on ne déclenche rien ici,
   * sans quoi taper un nom rebâtirait la figure à chaque caractère.
   */
  public override set name(_: string) {
    if (this._subject === null) { super.name = _; return }
    this._subject.name = _
  }

  public override get name_lang_map(): Type_LangMap {
    return this._subject !== null ? this._subject.name_lang_map : super.name_lang_map
  }
  public override set name_lang_map(_: Type_LangMap) {
    if (this._subject === null) { super.name_lang_map = _; return }
    this._subject.name_lang_map = _
  }

  // ÉTIQUETTES =========================================================================
  //
  // Les étiquettes passées en argument sont celles du document SOURCE : c'est le sujet qui s'y
  // enregistre (`Class_Tag._references` est indexé par `element.id`), jamais la part. Rebâtir la
  // couronne ne peut donc pas laisser de référence morte dans les étiquettes du document.

  public override hasGivenTag(tag: Class_Tag): boolean {
    return this._subject !== null ? this._subject.hasGivenTag(tag) : super.hasGivenTag(tag)
  }

  public override addTag(tag: Class_Tag): void {
    if (this._subject === null) { super.addTag(tag); return }
    this._subject.addTag(tag)
    this.tagsUpdated()
  }

  public override removeTag(tag: Class_Tag): void {
    if (this._subject === null) { super.removeTag(tag); return }
    this._subject.removeTag(tag)
    this.tagsUpdated()
  }

  public override get tags_list(): Class_Tag[] {
    return this._subject !== null ? this._subject.tags_list : super.tags_list
  }

  /** Étiquettes du sujet rangées par groupe — lu par les panneaux d'étiquettes. */
  public override get grouped_taggs_dict(): { [x: string]: Class_Tag[] } {
    return this._subject !== null ? this._subject.grouped_taggs_dict : super.grouped_taggs_dict
  }

  // HIÉRARCHIE ET DIMENSIONS ===========================================================
  //
  // C'est la hiérarchie qui FAIT la couronne : un anneau est un niveau d'agrégation, et les
  // enfants d'une part sont les secteurs de l'anneau suivant. On ne partage JAMAIS le
  // `NodeDimensionsManager` ni un `Class_NodeDimension` (ils capturent leur porteur et
  // s'enregistrent dans LEUR sankey) : on délègue par accesseur, et une part n'a jamais de
  // dimensions à elle.

  public override get is_child(): boolean {
    return this._subject !== null ? this._subject.is_child : super.is_child
  }
  public override get is_parent(): boolean {
    return this._subject !== null ? this._subject.is_parent : super.is_parent
  }
  public override get is_multi_parent(): boolean {
    return this._subject !== null ? this._subject.is_multi_parent : super.is_multi_parent
  }
  public override get is_multi_children(): boolean {
    return this._subject !== null ? this._subject.is_multi_children : super.is_multi_children
  }
  public override get dimensions_as_parent() {
    return this._subject !== null ? this._subject.dimensions_as_parent : super.dimensions_as_parent
  }
  public override get dimensions_as_child() {
    return this._subject !== null ? this._subject.dimensions_as_child : super.dimensions_as_child
  }
  public override nodeDimensionAsParent(child: Class_NodeElement) {
    return this._subject !== null
      ? this._subject.nodeDimensionAsParent(subjectOfPart(child))
      : super.nodeDimensionAsParent(child)
  }
  public override nodeDimensionAsChild(parent: Class_NodeElement) {
    return this._subject !== null
      ? this._subject.nodeDimensionAsChild(subjectOfPart(parent))
      : super.nodeDimensionAsChild(parent)
  }

  // CE QUI N'EST PAS DÉLÉGUÉ, ET POURQUOI ==============================================
  //
  // `data_value` — NON, et pour une raison plus forte que dans l'étoile. Ce n'est pas un attribut
  // du nœud mais une SOMME sur les flux VISIBLES, et c'est précisément ce que la couronne ne peut
  // pas lire : un nœud agrégé a ses enfants masqués, donc leurs flux invisibles, donc une valeur
  // nulle — une couronne qui lirait `data_value` serait vide partout sauf sur l'anneau affiché.
  // C'est l'inverse de ce qu'on lui demande. Sa valeur est STRUCTURELLE (`sunburstNodeValue`,
  // indépendante de l'état d'agrégation) et vient de l'arbre, pas du proxy.
}

/**
 * Le sujet d'une part, ou la part elle-même. Duck-typing et non `instanceof` : les hiérarchies
 * mélangent les nœuds du document et les proxys, et un `instanceof` obligerait chaque appelant à
 * connaître les deux classes.
 */
const subjectOfPart = (node: Class_NodeElement): Class_NodeElement =>
  (node as { subject?: Class_NodeElement | null }).subject ?? node
