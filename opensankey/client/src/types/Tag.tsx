// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2025 TerriFlux
// 
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
// 
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
// 
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.
// ==================================================================================================
// Author        : Vincent LE DOZE & Vincent CLAVEL & Julien Alapetite for TerriFlux
// ==================================================================================================

// Local types
import { Class_LinkElement } from '../Elements/Link'
import { Class_ElementValue, Class_ElementTaggedValue } from '../Elements/LinkValues'
import { Class_NodeElement } from '../Elements/Node'
import {
  Type_JSON,
  getBooleanFromJSON,
  getNumberFromJSON,
  getStringFromJSON,
  makeId
} from '../types/Utils'
import { default_grey_color } from '../Elements/ElementsAttributesConfig'
import i18next from 'i18next'
import { Class_Sankey } from './Sankey'
import { Type_LangMap, normalizeLang, parseLangMap, parseStylePatch, resolveLangMap, serializeLangMap, serializeStylePatch } from '../Persistence/persistenceMigrations'
import type { Type_StylePatch } from './Theme'
import { Class_ProtoTagGroup, Class_TagGroup, Class_DataTagGroup, Class_ViewTagGroup } from './TagGroup'

// SPECIFIC TYPES ***********************************************************************

export type tag_banner_type = 'none' | 'one' | 'multi' | 'sequence' | 'topbar'

// #527 - cles d'etiquette que le front sait lire et reecrire, toutes sous-classes
// confondues. Le reste traverse le front a l'identique (passthrough) au lieu
// d'etre detruit au premier aller-retour. A completer le jour ou le front
// apprend a lire une nouvelle cle, sans quoi elle serait ecrite deux fois.
const KNOWN_TAG_JSON_KEYS = new Set([
  'name', 'long_name', 'selected', 'color',
  'scale', 'unit', 'scale_owned',
  // #537 - le front MODELISE desormais ces deux cles : les laisser au sac du
  // #527 ferait resurgir une valeur effacee. L'ecriture etant conditionnelle,
  // effacer une definition n'ecrit plus la cle — et celle restee dans le sac
  // reprendrait la main au dump suivant.
  'description', 'style_patch',
  // SA#541 - style nomme impose par l'etiquette : modelise, donc hors du sac.
  'style_id',
])

// CLASS PROTO TAG ***********************************************************************

/**
 * Class that define a Tag object
 * @class Class_Tag
 */
export abstract class Class_ProtoTag {

  // PRIVATE ATTRIBUTES =================================================================

  // Unique ID
  private _id: string

  // OS#1299 — nom multilingue { langue -> nom }, comme les noms de nœuds.
  // Les getters/setters name / long_name exposent une string résolue/écrite pour
  // la langue ACTIVE de l'app (i18next). Monolingue = comportement historique
  // (sérialisé en string).
  // Name (short name - used as label in config menus & selectors)
  private _name_map: Type_LangMap

  // Long name (used for display on the diagram - falls back to _name if empty)
  private _long_name_map: Type_LangMap = {}

  // #537 - DEFINITION de l'etiquette (« donnee presentant un tres faible niveau
  // d'incertitude... »), destinee a l'info-bulle de legende. A ne surtout pas
  // confondre avec `long_name`, qui est le nom AFFICHE (cf. display_name) : les
  // definitions font 95 caracteres en moyenne, y ranger une definition
  // remplacerait « Fiable » par un paragraphe dans la legende et dans tous les
  // selecteurs de banniere. Meme patron multilingue que les noms (OS#1299).
  private _description_map: Type_LangMap = {}

  // #537 - mise en forme portee par l'etiquette AU-DELA de la couleur :
  // { attribut moderne -> valeur }, exactement la forme des patchs de theme
  // (Type_StylePatch). Vide = comportement d'avant, l'etiquette ne pilote que sa
  // couleur. Le premier attribut consomme sera l'opacite ; la bordure et la
  // hachure viendront sans nouveau format.
  private _style_patch: Type_StylePatch = {}

  // SA#541 - id du STYLE NOMME (liste des Styles) impose aux elements qui portent
  // l'etiquette : il surcharge leur style et leur mise en forme locale, pour les
  // seuls parametres qu'il definit (cf. Elements/tagStyles.ts). undefined = aucun.
  private _style_id: string | undefined = undefined

  // Color of tag
  private _color: string = default_grey_color

  // Boolean
  private _is_selected: boolean = false

  // #527 - sac des cles JSON que le front ne modelise pas (« Noms longs » mis a
  // part, deja porte ci-dessus), reemises telles quelles pour qu'un attribut
  // pose sur une etiquette survive a l'aller-retour par le navigateur.
  private _json_extras: Type_JSON = {}

  /**
   * True if tag is currently on a deletion process
   * Avoid cross calls of delete() method
   * @private
   * @memberof Class_Tag
   */
  private _is_currently_deleted = false


  // PROTECTED ATTRIBUTES ===============================================================

  // Group where it belong
  protected abstract _group: Class_ProtoTagGroup

  // Sankey in which it applies
  protected _ref_sankey: Class_Sankey

  // CONSTRUCTOR ========================================================================

  /**
   * Creates an instance of Class_ProtoTag.
   * @param {string} name
   * @param {(string | undefined)} [id=undefined]
   * @memberof Class_ProtoTag
   */
  constructor(
    name: string,
    sankey: Class_Sankey,
    id: string | undefined = undefined
  ) {
    this._id = id ?? makeId(name)
    this._name_map = { [normalizeLang(i18next.language)]: name }
    this._ref_sankey = sankey
  }

  public abstract setReferenceFromIds(list_id: string[]): void

  /**
   * Define deletion behavior
   * @memberof Class_Tag
   */
  public delete() {
    if (!this._is_currently_deleted) {
      // Set as currently deleted
      this._is_currently_deleted = true
      // SA#541 - l'etiquette emporte son style : un style d'etiquette a pu disparaitre
      if (this._style_id !== undefined) this._ref_sankey.tagStylesConfigUpdated()
      // Unref this from tag group
      this.group.removeTag(this)
      // Clean the rest
      this.cleanForDeletion()
      // Garbage collection will do the rest
    }
  }

  // COPY METHODS =======================================================================

  /**
   * Copy given tag
   * @param {Class_ProtoTag} tag_to_copy
   * @memberof Class_ProtoTag
   */
  public copyFrom(tag_to_copy: Class_ProtoTag) {
    // Get infos
    this._copyFrom(tag_to_copy)
  }

  /**
   * Overridable method to copy a given tag
   * @protected
   * @param {Class_ProtoTag} tag_to_copy
   * @memberof Class_ProtoTag
   */
  protected _copyFrom(tag_to_copy: Class_ProtoTag) {
    // Maps complètes (pas les strings résolues) : les traductions survivent à la copie.
    this._name_map = { ...tag_to_copy._name_map }
    this._long_name_map = { ...tag_to_copy._long_name_map }
    this._color = tag_to_copy._color
    this._is_selected = tag_to_copy._is_selected
    // #537 - definition et mise en forme suivent l'etiquette. Sans ces lignes,
    // une duplication de groupe ou une fusion de mise en page les perdrait en
    // silence : #385 a l'identique.
    this._description_map = { ...tag_to_copy._description_map }
    this._style_patch = { ...tag_to_copy._style_patch }
    // SA#541 - meme raison : le style impose suit l'etiquette.
    if (this._style_id !== tag_to_copy._style_id) {
      this._style_id = tag_to_copy._style_id
      this._ref_sankey.tagStylesConfigUpdated()
    }
    // #527 - les attributs que le front ne modelise pas suivent l'etiquette :
    // sans cette ligne, une fusion de mise en page ou une duplication les
    // perdrait silencieusement.
    this._json_extras = { ...tag_to_copy._json_extras }
    // Groups are switched from related group class
  }

  /**
   * Convert element to JSON
   * @param {Type_JSON} [kwargs]
   * @return {*}
   * @memberof Class_ProtoTag
   */
  public toJSON(
    kwargs?: Type_JSON
  ) {
    // Init output JSON
    const json_object: Type_JSON = {}
    // Fill data
    this._toJSON(json_object, kwargs)
    // Return
    return json_object
  }

  /**
   * Overridable method for JSON conversion
   * @protected
   * @param {Type_JSON} json_object
   * @param {Type_JSON} [_kwargs]
   * @memberof Class_ProtoTag
   */
  protected _toJSON(
    json_object: Type_JSON,
    _kwargs?: Type_JSON
  ) {
    // #527 - le sac d'abord : une cle connue est ensuite reecrite par sa valeur
    // courante (ici ou dans une sous-classe), une cle inconnue ressort intacte.
    Object.assign(json_object, this._json_extras)
    // OS#1299 — string si monolingue (format historique), map { fr, en, ... } sinon.
    json_object['name'] = serializeLangMap(this._name_map) ?? ''
    json_object['long_name'] = serializeLangMap(this._long_name_map) ?? ''
    json_object['selected'] = this._is_selected
    json_object['color'] = this._color
    // #537 - ecriture CONDITIONNELLE : la cle n'apparait que si l'etiquette
    // porte quelque chose. C'est ce qui fait qu'aucun fichier existant ne gagne
    // de cle a la premiere re-sauvegarde — contrairement aux quatre lignes
    // ci-dessus, toujours ecrites, qui ne sont PAS un modele a suivre.
    const description = serializeLangMap(this._description_map)
    if (description !== undefined) json_object['description'] = description
    const style_patch = serializeStylePatch(this._style_patch)
    if (style_patch !== undefined) json_object['style_patch'] = style_patch
    // SA#541 - meme ecriture conditionnelle
    if (this._style_id !== undefined) json_object['style_id'] = this._style_id
  }

  /**
   *
   *
   * @param {Type_JSON} json_object
   * @param {Type_JSON} [kwargs]
   * @memberof Class_ProtoTag
   */
  public fromJSON(
    json_object: Type_JSON,
    kwargs?: Type_JSON
  ): void {
    // Get infos
    this._fromJSON(json_object, kwargs)
  }

  /**
   * Set Tag value from JSON
   * @protected
   * @param {Type_JSON} json_object
   * @param {Type_JSON} [_kwargs]
   * @memberof Class_ProtoTag
   */
  protected _fromJSON(
    json_object: Type_JSON,
    _kwargs?: Type_JSON
  ): void {
    // #527 - memorise ce que le front ne modelise pas. Les cles connues sont
    // ecartees : certaines ne sont ecrites que lorsqu'elles s'ecartent du defaut
    // (`scale`, `unit`, `scale_owned`), et les garder ici figerait un ancien
    // etat que l'utilisateur vient de changer.
    this._json_extras = {}
    Object.keys(json_object)
      .filter(key => !KNOWN_TAG_JSON_KEYS.has(key))
      .forEach(key => { this._json_extras[key] = json_object[key] })
    // OS#1299 — accepte la string historique (rangée sous la langue déclarée du
    // fichier) ou la map { langue -> nom }.
    const file_lang = this._ref_sankey.drawing_area.application_data.language
    if (json_object['name'] !== undefined) {
      this._name_map = parseLangMap(json_object['name'], file_lang)
    }
    if (json_object['long_name'] !== undefined) {
      this._long_name_map = parseLangMap(json_object['long_name'], file_lang)
    }
    this._is_selected = getBooleanFromJSON(json_object, 'selected', true)
    this._color = getStringFromJSON(json_object, 'color', this._color)
    // #537 - cle absente = defaut du format (aucune definition, aucune mise en
    // forme). On n'ecrase que si la cle est presente : `fromJSON` sert aussi aux
    // mises a jour partielles, ou un JSON muet ne doit rien effacer.
    if (json_object['description'] !== undefined) {
      this._description_map = parseLangMap(json_object['description'], file_lang)
    }
    if (json_object['style_patch'] !== undefined) {
      this._style_patch = parseStylePatch(json_object['style_patch'])
    }
    // SA#541 - cle absente = aucun style ; chaine vide ou non-chaine = aucun style.
    if (json_object['style_id'] !== undefined) {
      const style_id = json_object['style_id']
      this._style_id = (typeof style_id === 'string' && style_id !== '') ? style_id : undefined
      this._ref_sankey.tagStylesConfigUpdated()
    }
  }

  // PUBLIC METHODES ==================================================================

  public setSelected(
    update: boolean = true
  ) {
    // Avoid useless update
    if (this._is_selected === false) {
      // Set attributes
      this._is_selected = true
      // Update this fingerprint
      this.updateFingerprint()
      // Redraw all related elements
      if (update) this.update()
    }
  }

  public setUnSelected(
    update: boolean = true
  ) {
    // Avoid useless update
    if (this._is_selected === true) {
      // Set attributes
      this._is_selected = false
      // Update this fingerprint
      this.updateFingerprint()
      // Redraw all related elements
      if (update) this.update()
    }
  }

  public toogleSelected() {
    // Set attributes
    this._is_selected = !this._is_selected
    // sa#283 — vues contextuelles : overlay appliqué APRÈS le basculement, AVANT le
    // redraw d'update() (slot optionnel enregistré par OSP).
    this._ref_sankey.drawing_area.application_data.after_tag_selection_change?.()
    // Redraw all related elements
    this.update()
  }

  // PROTECTED METHODS ==================================================================

  protected abstract cleanForDeletion(): void
  protected abstract update(): void
  protected abstract updateFingerprint(): void

  // GETTERS / SETTERS ==================================================================

  public get id() { return this._id }

  // Nom résolu pour la langue active de l'app (repli en→fr→première dispo).
  public get name() { return resolveLangMap(this._name_map ?? {}, i18next.language) }
  public set name(value: string) {
    const lang = normalizeLang(i18next.language)
    if (!this._name_map) this._name_map = {}
    // Vider dans une langue alors que d'autres existent = supprimer la traduction.
    if (value === '' && Object.keys(this._name_map).some(l => l !== lang)) delete this._name_map[lang]
    else this._name_map[lang] = value
  }

  // Long name - used for display on the diagram, falls back to short name if empty
  public get long_name() { return resolveLangMap(this._long_name_map ?? {}, i18next.language) }
  public set long_name(value: string) {
    // Avoid useless updates
    if (this.long_name !== value) {
      const lang = normalizeLang(i18next.language)
      if (value === '' && Object.keys(this._long_name_map).some(l => l !== lang)) delete this._long_name_map[lang]
      else this._long_name_map[lang] = value
      // Redraw all related elements (legend, banner, ...)
      this.update()
    }
  }

  // Name to display on the diagram : long name if defined, else short name
  public get display_name() {
    const long_name = this.long_name
    return long_name !== '' ? long_name : this.name
  }

  // #537 - Definition resolue pour la langue active (repli en->fr->premiere
  // disponible), destinee a l'info-bulle. JAMAIS affichee a la place du nom.
  public get description() { return resolveLangMap(this._description_map ?? {}, i18next.language) }
  public set description(value: string) {
    // Avoid useless updates
    if (this.description !== value) {
      const lang = normalizeLang(i18next.language)
      if (!this._description_map) this._description_map = {}
      // Vider dans une langue alors que d'autres existent = supprimer la traduction.
      if (value === '' && Object.keys(this._description_map).some(l => l !== lang)) delete this._description_map[lang]
      else this._description_map[lang] = value
      // Redraw all related elements (l'info-bulle de legende en derive)
      this.update()
    }
  }

  /** Map complete { langue -> definition } — pour l'edition multilingue. Copie. */
  public get description_map(): Type_LangMap { return { ...this._description_map } }
  public set description_map(value: Type_LangMap) {
    this._description_map = { ...value }
    this.update()
  }

  // #537 - Mise en forme portee par l'etiquette. Copie en lecture comme en
  // ecriture : un appelant qui garderait la reference muterait l'etiquette sans
  // passer par le setter, donc sans redessiner.
  public get style_patch(): Type_StylePatch { return { ...this._style_patch } }
  public set style_patch(value: Type_StylePatch) {
    this._style_patch = { ...value }
    this.update()
  }

  // SA#541 - Style nomme impose par l'etiquette (id de la liste des Styles).
  public get style_id(): string | undefined { return this._style_id }
  public set style_id(value: string | undefined) {
    const next = value === '' ? undefined : value
    if (this._style_id === next) return
    this._style_id = next
    this._ref_sankey.tagStylesConfigUpdated()
    // Redessine les elements porteurs (et la legende)
    this.update()
  }

  public get color() { return this._color }
  public set color(value: string) {
    // Avoid useless updates
    if (this._color !== value) {
      // Set attributes
      this._color = value
      // Redraw all related elements
      this.update()
    }
  }

  // Selection
  public get is_selected() { return this._is_selected }
  public set is_selected(_: boolean) { this._is_selected = _ }

  // Group
  public abstract get group(): Class_ProtoTagGroup
}

// CLASS TAG ****************************************************************************

/**
 * Class that define a Tag object
 * @class Class_Tag
 */
export abstract class Class_Tag extends Class_ProtoTag {

  // PRIVATE ATTRIBUTES =================================================================

  // List of elements that relates to this tag
  protected _references: { [_: string]: Class_NodeElement | Class_LinkElement | Class_ElementValue | Class_ElementTaggedValue } = {}

  // PROTECTED ATTRIBUTES ===============================================================

  // Group where it belong
  protected _group: Class_TagGroup

  // CONSTRUCTOR ========================================================================

  /**
   * Creates an instance of Class_Tag.
   * @param {string} name
   * @param {Class_TagGroup} group
   * @param {(string | undefined)} [id=undefined]
   * @memberof Class_DataTag
   */
  constructor(
    name: string,
    group: Class_TagGroup,
    sankey: Class_Sankey,
    id: string | undefined = undefined
  ) {
    super(name, sankey, id)
    this._group = group
  }

  /**
   * Define deletion behavior
   * @memberof Class_Tag
   */
  protected cleanForDeletion() {
    // Unref this tag from all references
    Object.values(this._references)
      .forEach(element => {
        element.removeTag(this)
      })
    this._references = {}
  }

  // PUBLIC METHODS =====================================================================

  public update() {
    // Redraw elements
    Object.values(this._references)
      .forEach(element => {
        element.draw()
      })
    // Update legend
    this._ref_sankey.drawing_area.legend.draw()
  }

  public hasGivenReference(_: Class_NodeElement | Class_LinkElement | Class_ElementValue | Class_ElementTaggedValue) {
    return (this._references[_.id] !== undefined)
  }

  public addReference(_: Class_NodeElement | Class_LinkElement | Class_ElementValue | Class_ElementTaggedValue) {
    if (!this.hasGivenReference(_)) {
      this._references[_.id] = _
      // SA#541 - ce que porte l'element change : ses couches de style sont a recalculer.
      // Tout attachement d'etiquette (noeud, valeur, valeur coordonnee) passe par ici.
      this._ref_sankey.tagStylesUpdated()
      _.addTag(this)
    }
  }

  public removeReference(_: Class_NodeElement | Class_LinkElement | Class_ElementValue | Class_ElementTaggedValue) {
    if (this.hasGivenReference(_)) {
      delete this._references[_.id]
      this._ref_sankey.tagStylesUpdated()
      _.removeTag(this)
    }
  }

  // PROTECTED METHODS ==================================================================

  protected abstract updateFingerprint(): void

  // GETTERS ============================================================================

  public get group() { return this._group }

  public get references() { return Object.values(this._references) }

}

// CLASS NODETAG ****************************************************************************

/**
 * Class that define a node tag object
 * @class Class_Tag
 */
export class Class_NodeTag extends Class_Tag {
  // PROTECTED METHODS ==================================================================

  /**
   * Assign tag to node from list 
   *
   * @param {string[]} list_id
   * @memberof Class_NodeTag
   */
  public setReferenceFromIds(list_id: string[]): void {
    // go throught list of node referenced & add this tag 
    list_id.forEach(nid => {
      const node_ref = this._ref_sankey.nodes_dict[nid]
      if (!this.hasGivenReference(node_ref)) {
        this._references[nid] = node_ref
        node_ref.addTag(this)
      }
    })
  }

  // PROTECTED METHODS ==================================================================

  protected updateFingerprint() {
    this._ref_sankey.nodeTagsUpdated()
  }

}

// CLASS FLUXTAG ****************************************************************************

/**
 * Class that define a node tag object
 * @class Class_Tag
 */
export class Class_FluxTag extends Class_Tag {

  // #285 (§3.0ter) — échelle propre du tag, pendant de Class_DataTag._scale
  // pour les groupes PORTEURS DE VALEURS : la largeur de bande d'une valeur
  // coordonnée vaut valeur convertie avec l'échelle de SON tag, ce qui rend
  // affichables ensemble des valeurs non additives (kWh/t/€).
  // undefined = échelle du dessin.
  private _scale: number | undefined = undefined

  public get scale(): number | undefined { return this._scale }
  public set scale(_: number | undefined) { this._scale = _ }

  // OS#1286 (fusion §3.0ter) — quand le groupe est « de type unité », le tag
  // référence une unité du registre du diagramme (id d'unité). L'unité fournit
  // le symbole affiché ET le coefficient de conversion : la largeur de bande
  // d'une valeur exprimée dans cette unité vaut valeur × coefficient à
  // l'échelle du dessin (t/kt/Mt deviennent cohérents automatiquement).
  private _unit_ref: string | undefined = undefined

  public get unit_ref(): string | undefined { return this._unit_ref }
  public set unit_ref(_: string | undefined) { this._unit_ref = _ }

  /** Unité résolue depuis le registre du diagramme (OS#1286), ou undefined. */
  public get resolved_unit() {
    return this._unit_ref ? this._ref_sankey.units.resolve(this._unit_ref) : undefined
  }

  protected _toJSON(
    json_object: Type_JSON,
    _kwargs?: Type_JSON
  ) {
    super._toJSON(json_object, _kwargs)
    if (this._scale !== undefined) json_object['scale'] = this._scale
    if (this._unit_ref !== undefined) json_object['unit'] = this._unit_ref
  }

  protected _fromJSON(
    json_object: Type_JSON,
    _kwargs?: Type_JSON
  ): void {
    super._fromJSON(json_object, _kwargs)
    if (json_object['scale'] !== undefined) this._scale = getNumberFromJSON(json_object, 'scale', 0)
    if (json_object['unit'] !== undefined) this._unit_ref = getStringFromJSON(json_object, 'unit', '')
  }

  protected _copyFrom(tag_to_copy: Class_ProtoTag) {
    super._copyFrom(tag_to_copy)
    if (tag_to_copy instanceof Class_FluxTag) {
      this._scale = tag_to_copy._scale
      this._unit_ref = tag_to_copy._unit_ref
    }
  }

  // PUBLIC METHODS =====================================================================

  /**
   * Assign tag to links from list 
   *
   * @param {string[]} list_id_link_val
   * @memberof Class_FluxTag
   */
  public setReferenceFromIds(list_id_link_val: string[]): void {
    // Go throught all link
    this._ref_sankey.links_list.forEach(link => {
      const l_values= link.getAllValues()
      // if a link value id is in list_id_link_val then add tag to link value
      list_id_link_val.forEach(lid=>{
        if(lid in l_values){
          l_values[lid][0].addTag(this)
        }
      })
    })
  }


  // PROTECTED METHODS ==================================================================

  protected updateFingerprint() {
    this._ref_sankey.fluxTagsUpdated()
  }

}

// CLASS DATATAG ************************************************************************

export class Class_DataTag extends Class_ProtoTag {
  // PRIVATE ATTRIBUTES =================================================================

  // List of elements that relates to this tag
  private _references: { [_: string]: Class_LinkElement } = {}

  // PROTECTED ATTRIBUTES ===============================================================

  // Group where it belong
  protected _group: Class_DataTagGroup

  private _scale: number

  // sa#283 — Généralisation de l'échelle par tag à TOUS les groupes de dataTags (retour
  // Julien, pilote Céréales : les volumes varient de plusieurs ordres de grandeur entre
  // tranches, une seule échelle de dessin ne peut pas convenir). `_scale` existe depuis
  // toujours mais n'est SIGNIFIANT que pour les groupes d'unité (défaut 10 sérialisé sur
  // tous les tags des fichiers historiques — bruit inexploitable). Ce drapeau, additif et
  // absent des fichiers legacy, dit qu'un tag NON-unité porte une échelle PROPRE : c'est
  // lui (et lui seul) qui fait participer le tag à la résolution du porteur d'échelle
  // (cf. ScaleResolution.resolveScaleCarrier).
  private _has_own_scale: boolean = false
  // CONSTRUCTOR ========================================================================

  /**
   * Creates an instance of Class_DataTag.
   * @param {string} name
   * @param {Class_TagGroup} group
   * @param {Class_Sankey} sankey
   * @param {(string | undefined)} [id=undefined]
   * @memberof Class_DataTag
   */
  constructor(
    name: string,
    group: Class_DataTagGroup,
    sankey: Class_Sankey,
    id: string | undefined = undefined
  ) {
    super(name, sankey, id)
    this._group = group
    this._references = sankey.links_dict
    // Indicate that we will need to recompute visibility
    this._ref_sankey.dataTagsUpdated()
    // Update all links
    Object.values(this._references)
      .forEach(ref => ref.addDataTag(this))
    this._scale = 10
  }


  protected _toJSON(
    json_object: Type_JSON,
    _kwargs?: Type_JSON
  ) {
    super._toJSON(json_object,_kwargs)
    json_object['scale'] = this._scale
    // sa#283 — clé ADDITIVE : seul un tag non-unité à échelle propre l'écrit (les groupes
    // d'unité restent régis par `scale` seul, comme toujours). Absente d'un fichier
    // legacy → false → comportement strictement inchangé.
    if (this._has_own_scale) json_object['scale_owned'] = true
  }

  /**
   * Overridable method to copy a given tag
   * @protected
   * @param {Class_ProtoTag} tag_to_copy
   * @memberof Class_ProtoTag
   */
  protected _copyFrom(tag_to_copy: Class_ProtoTag) {
    super._copyFrom(tag_to_copy)
    this._scale = (tag_to_copy as Class_DataTag)._scale
    this._has_own_scale = (tag_to_copy as Class_DataTag)._has_own_scale
  }

  /**
   * Set Tag value from JSON
   * @protected
   * @param {Type_JSON} json_object
   * @param {Type_JSON} [_kwargs]
   * @memberof Class_ProtoTag
   */
  protected _fromJSON(
    json_object: Type_JSON,
    _kwargs?: Type_JSON
  ): void {
    super._fromJSON(json_object,_kwargs)
    this._scale = getNumberFromJSON(json_object, 'scale', this._scale)
    // sa#283 — cf. _toJSON : absent (tous les fichiers legacy) → false.
    this._has_own_scale = json_object['scale_owned'] === true
  }


  public update() { } // Does nothing - never called

  public override setSelected(): void {
    // Avoid useless update
    if (this.is_selected === false) {
      // Set attributes
      this.is_selected = true
      // Indicate that we will need to recompute visibility
      this.updateFingerprint()
    }
  }

  public override setUnSelected(): void {
    // Avoid useless update
    if (this.is_selected === true) {
      // Set attributes
      this.is_selected = false
      // Indicate that we will need to recompute visibility
      this.updateFingerprint()
    }
  }

  // Implement function so we can use it in config tags
  // we don't need to ref elements in this function because for DataTag it reference all links (done in constructor)
  public setReferenceFromIds(): void {
    // TODO : Not implemented yet
  }

  // PROTECTED METHODS ==================================================================

  /**
   * Define deletion behavior
   * @memberof Class_Tag
   */
  protected cleanForDeletion() {
    // Update all links
    Object.values(this._references)
      .forEach(link => link.removeDataTag(this))
    // Indicate that we will need to recompute visibility
    this._ref_sankey.dataTagsUpdated()
    // Unref references
    this._references = {}
  }

  // PROTECTED METHODS ==================================================================

  protected updateFingerprint() {
    this._ref_sankey.dataTagsUpdated()
  }

  // GETTERS ============================================================================

  public get group() { return this._group }

  public get references() { return Object.values(this._references) }

  public get scale() {
    if (this.group.is_unit) return this._scale
    return this._ref_sankey.drawing_area.scale
  }
  public set scale(_) {
    if (this.group.is_unit) this._scale = _
    else this._scale = _
  }

  /**
   * sa#283 — Échelle PROPRE du tag, ou undefined s'il n'en porte pas :
   *  - groupe d'UNITÉ : toujours `_scale` (sémantique historique : chaque unité a la
   *    sienne, « quantité par 100 px pour cette unité ») ;
   *  - groupe ordinaire : `_scale` si explicitement posée (drapeau `scale_owned`),
   *    sinon undefined (le tag suit l'échelle du porteur résolu / de la zone de dessin —
   *    le `scale: 10` par défaut des fichiers historiques n'est PAS une échelle propre).
   * Poser undefined retire l'échelle propre d'un tag ordinaire (no-op pour une unité).
   */
  public get own_scale(): number | undefined {
    if (this.group.is_unit) return this._scale
    return this._has_own_scale ? this._scale : undefined
  }
  public set own_scale(_: number | undefined) {
    if (_ === undefined) {
      if (!this.group.is_unit) this._has_own_scale = false
      return
    }
    this._scale = _
    this._has_own_scale = true
  }
}

export class Class_LevelTag extends Class_NodeTag{
}
// CLASS VIEW TAG (nouveau type de tag pour les vues)
/**
 * Tag for view management - similar to LevelTag
 * @export
 * @class Class_ViewTag
 */
export class Class_ViewTag extends Class_NodeTag {
  
  // CONSTRUCTOR ========================================================================
  /**
   * Creates an instance of Class_ViewTag.
   * @param {string} name
   * @param {Class_ViewTagGroup} taggroup
   * @param {Class_Sankey} sankey
   * @param {string} [id]
   * @memberof Class_ViewTag
   */
  constructor(
    name: string,
    taggroup: Class_ViewTagGroup,
    sankey: Class_Sankey,
    id: string | undefined = undefined
  ) {
    super(name, taggroup, sankey, id)
  }

  // GETTER =============================================================================
  /**
   * Return parent taggroup as ViewTagGroup
   * @readonly
   * @type {Class_ViewTagGroup}
   * @memberof Class_ViewTag
   */
  public get taggroup(): Class_ViewTagGroup {
    return this.taggroup as Class_ViewTagGroup
  }
}