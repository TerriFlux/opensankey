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

// Local modules
import { Class_NodeElement } from './Node'
import { Class_Tag } from '../types/Tag'
import { Type_JSON } from '../types/Utils'
import { Class_LevelTagGroup, Class_ViewTagGroup } from '../types/TagGroup'

/**
 * Class that handles all tag management operations for NodeElement
 */
export class NodeTagsManager {

  private _node: Class_NodeElement

  constructor(node: Class_NodeElement) {
    this._node = node
  }

  // CLEANUP METHODS ====================================================================

  public cleanForDeletion() {
    const tagsData = this._node.internalTagsData
    tagsData.leveltaggs_as_antitagged.forEach(tag => tag.removeAntiTaggedRef(this._node))
    tagsData.leveltaggs_as_antitagged = []
    // Remove reference of self in related tags
    tagsData.tags.forEach(tag => tag.removeReference(this._node))
    tagsData.tags = []
    tagsData.taggs_dict = {}
  }

  // COPY METHODS =======================================================================

  public copyTagsFrom(node_to_copy: Class_NodeElement) {
    this.addTagsReferencingFrom(node_to_copy)
  }

  public copyTagsReferencingFrom(
    node_to_copy: Class_NodeElement,
    matching_tagg: { [_: string]: string },
    matching_tags: { [_: string]: { [_: string]: string } }
  ) {
    // Copy tags ------------------------------------------------------------------------
    // Clear all tags
    this._node.tags_list
      .forEach(tag => this.removeTag(tag))
    // Add missing tags
    this.addTagsReferencingFrom(node_to_copy, matching_tagg, matching_tags)
  }

  private addTagsReferencingFrom(
    node_to_copy: Class_NodeElement,
    matching_tagg: { [_: string]: string } = {},
    matching_tags: { [_: string]: { [_: string]: string } } = {}
  ) {
    const revert_matching_taggs_id: { [id: string]: string } = {}
    Object.entries(matching_tagg).forEach(([k, v]) => revert_matching_taggs_id[v] = k)

    // Add missing tags
    node_to_copy.tags_list
      .forEach(tag_to_copy => {
        const revert_matching_tags_id: { [id: string]: string } = {}
        Object.entries(matching_tags[revert_matching_taggs_id[tag_to_copy.group.id] ?? tag_to_copy.group.id] ?? []).forEach(([k, v]) => revert_matching_tags_id[v] = k)

        let tagg = this._node.sankey.node_taggs_dict[revert_matching_taggs_id[tag_to_copy.group.id] ?? tag_to_copy.group.id]
        if (tagg == undefined) {
          tagg = this._node.sankey.level_taggs_dict[revert_matching_taggs_id[tag_to_copy.group.id] ?? tag_to_copy.group.id]
        }
        if (tagg !== undefined) {

          const tag = tagg.tags_dict[revert_matching_tags_id[tag_to_copy.id] ?? tag_to_copy.id]
          if (tag !== undefined)
            this.addTag(tag as Class_Tag)
        }
      })
  }

  // JSON METHODS =======================================================================
  public addAsAntiTagged(_: Class_LevelTagGroup) {
    if (typeof _.addAntiTaggedRef !== 'function') {
      console.error(
        'Object is not a proper Class_LevelTagGroup instance:',
        _, 'constructor:', _.constructor?.name
      )
    }
    const tagsData = this._node.internalTagsData
    if (!tagsData.leveltaggs_as_antitagged.includes(_)) {
      tagsData.leveltaggs_as_antitagged.push(_)
      _.addAntiTaggedRef(this._node)
    }
  }

  public removeAsAntiTagged(_: Class_LevelTagGroup) {
    const tagsData = this._node.internalTagsData
    if (tagsData.leveltaggs_as_antitagged.includes(_)) {
      const idx = tagsData.leveltaggs_as_antitagged.indexOf(_)
      tagsData.leveltaggs_as_antitagged.splice(idx, 1)
      _.removeAntiTaggedRef(this._node)
    }
  }

  /**
   * Marque le nœud comme EXCLU d'un groupe de view tags (anti-tag « 0 »). Pas de
   * cross-référence (contrairement aux level anti-tags) : la visibilité est lue
   * directement par Node.viewTagVisibility().
   */
  public addAsViewExcluded(_: Class_ViewTagGroup) {
    const tagsData = this._node.internalTagsData
    if (!tagsData.view_taggs_as_excluded.includes(_)) {
      tagsData.view_taggs_as_excluded.push(_)
    }
  }

  /**
   * Retire l'exclusion de vue (symétrique d'`addAsViewExcluded`). Ajoutée au lot sa#283/6 :
   * sans elle, l'état de tags n'était pas RÉVERSIBLE — on savait exclure un nœud d'un groupe
   * de view tags, jamais l'y remettre.
   */
  public removeAsViewExcluded(_: Class_ViewTagGroup) {
    const tagsData = this._node.internalTagsData
    const idx = tagsData.view_taggs_as_excluded.indexOf(_)
    if (idx >= 0) tagsData.view_taggs_as_excluded.splice(idx, 1)
  }

  public toJSON(json_object: Type_JSON) {
    // Tags
    if (this._node.taggs_list.length > 0) {
      json_object['tags'] = Object.fromEntries(
        this._node.taggs_list
          .map(tagg => [
            tagg.id,
            this._node.tags_list
              .filter(tag => (tag.group === tagg))
              .map(tag => tag.id)
          ])
      )
    }
    const tagsData = this._node.internalTagsData
    if (
      (tagsData.leveltaggs_as_antitagged.length > 0 ||
        tagsData.view_taggs_as_excluded.length > 0) &&
      json_object['tags'] === undefined
    ) {
      json_object['tags'] = {}
    }
    tagsData.leveltaggs_as_antitagged
      .forEach(leveltagg => {
        (json_object['tags'] as Type_JSON)[leveltagg.id] = [String(0)]
      })
    tagsData.view_taggs_as_excluded
      .forEach(viewtagg => {
        (json_object['tags'] as Type_JSON)[viewtagg.id] = [String(0)]
      })
  }

  public fromJSON(
    json_node_object: Type_JSON
  ) {
    // Node Tags
    //   In JSON here are how supposed tags var is :
    //   tags:{key_grp_tag:string[] (key_tag_selected) }
    //   where 'key_grp_tag' represent the id of a node_taggs group
    //   &  'key_tag_selected' represent the array of id of tag selected for that node_taggs group
    const level_taggs_dict = Object.fromEntries(Object.entries(this._node.sankey.level_taggs_dict))
    const taggs_dict = { ...this._node.sankey.node_taggs_dict, ...level_taggs_dict, ...this._node.sankey.view_taggs_dict }
    Object.entries(json_node_object['tags'] ?? {})
      .forEach(([tagg_id, tag_ids]) => {
        const tagg = taggs_dict[tagg_id]
        if (tagg !== undefined) {
          (tag_ids as string[])
            .forEach(tag_id => {
              if (+tag_id == 0 && level_taggs_dict[tagg_id]) {
              //if (+tag_id == 0) {
                this._node._nodeTagsManager.addAsAntiTagged(tagg as Class_LevelTagGroup)
                return
              }
              // Anti-tag « 0 » sur un groupe de view tags (ex. colonne Essence = 0) :
              // le nœud est exclu de la vue, sans créer de fausse étiquette « 0 ».
              if (+tag_id == 0 && this._node.sankey.view_taggs_dict[tagg_id]) {
                this._node._nodeTagsManager.addAsViewExcluded(tagg as Class_ViewTagGroup)
                return
              }
              let tag = tagg.tags_dict[tag_id]
              if (tag == undefined) {
                tag = tagg.addTag(tag_id, tag_id) as Class_Tag
              }
              this.addTag(tag as Class_Tag)
            })
        }
      })
  }

  // ÉTAT DE TAGS LISIBLE / RÉINSCRIPTIBLE (sa#283 lot 6) ==============================

  /**
   * sa#283 lot 6 — ÉTAT DE TAGS de ce nœud, sur la forme EXACTE de `toJSON` :
   * `{ '<groupe>': ['<tag>', …] }`, anti-tags de niveau et exclusions de vue compris
   * (ils s'y écrivent `['0']`).
   *
   * C'est la CINQUIÈME catégorie de données qui peut différer d'une tranche à l'autre, à
   * côté des attributs du sac `_storage`, de la présence de l'élément, de la hiérarchie de
   * dimension et de l'ordre des flux. Elle ne vit PAS dans `_storage` (rien ne la
   * capturait) et gouverne la visibilité par `are_related_node_tags_selected` — dont les
   * tags de NIVEAU (`dimension 1`), qui décident du niveau d'agrégation affiché.
   *
   * @param group_ids restreint le résultat à ces groupes ; un groupe cité dont le nœud ne
   *   porte aucun tag vaut `[]` (= n'appartient à aucune étiquette du groupe). Sans
   *   argument, tous les groupes écrits par `toJSON`.
   */
  public tagsStateToJSON(group_ids?: string[]): Type_JSON {
    const json_object: Type_JSON = {}
    this.toJSON(json_object)
    const written = (json_object['tags'] ?? {}) as Type_JSON
    if (group_ids === undefined) return written
    const out: Type_JSON = {}
    group_ids.forEach(id => { out[id] = (written[id] ?? []) as Type_JSON })
    return out
  }

  /**
   * sa#283 lot 6 — REMPLACE l'appartenance de ce nœud aux GROUPES CITÉS, et à eux seuls.
   * Exactement réversible : `applyTagsState(tagsStateToJSON(ids))` est un no-op, et rejouer
   * l'état mémorisé avant l'écriture rend l'état d'origine.
   *
   * Par groupe cité : TABLE RASE (retrait de tous les tags du nœud dans ce groupe, de
   * l'anti-tag de niveau et de l'exclusion de vue), puis ré-inscription de la liste donnée.
   * Un groupe inconnu du diagramme est ignoré, une étiquette inconnue du groupe aussi
   * (jamais de création d'étiquette ici, contrairement à `fromJSON` : un contexte est une
   * surcouche de présentation, il n'invente pas de vocabulaire). `'0'` sur un groupe de
   * niveau = anti-tag, sur un groupe de vue = exclusion — même convention que `fromJSON`.
   *
   * INVALIDATION DES CACHES DE VISIBILITÉ — le piège de cette famille, exactement comme au
   * lot 5, et MESURÉ ici plutôt que supposé (cf. les deux tests « le cache … est invalide »
   * de nodeContextState.test.ts, chacun vérifié en retirant l'appel correspondant) :
   *  - `_are_related_node_tags_selected` est déjà rattrapé par la CROSS-RÉFÉRENCE tag ↔ nœud
   *    (`Class_Tag.addReference` appelle `Class_NodeElement.addTag`, qui invalide) ;
   *    `tagsUpdated()` reste appelé ici pour ne pas dépendre de ce détour ;
   *  - `_are_related_dimensions_selected` n'a AUCUNE empreinte de secours et n'est touché
   *    par aucun de ces chemins : sans `dimensionsUpdated()` explicite, changer les tags de
   *    NIVEAU d'un nœud (ou son anti-tag, qui ne passe par aucun `addTag`) le laisse replié
   *    à l'écran alors que son état a bel et bien changé — l'overlay SANS EFFET VISIBLE.
   * `dimensionsUpdated()` renouvelle en outre l'empreinte de visibilité, dont les VOISINS
   * dérivent la leur (`getLinksVisibilitiesFingerprint`).
   */
  public applyTagsState(state: Type_JSON): void {
    const node = this._node
    const sankey = node.sankey
    let touched = false
    Object.entries(state).forEach(([group_id, raw]) => {
      const level_group = sankey.level_taggs_dict[group_id]
      const view_group = sankey.view_taggs_dict[group_id]
      const tagg = sankey.node_taggs_dict[group_id] ?? level_group ?? view_group
      if (tagg === undefined) return // groupe inconnu du diagramme : ignoré silencieusement
      touched = true

      // 1. TABLE RASE sur ce groupe, et sur lui seul.
      node.tags_list
        .filter(tag => tag.group === tagg)
        .forEach(tag => this.removeTag(tag))
      if (level_group !== undefined) this.removeAsAntiTagged(level_group as Class_LevelTagGroup)
      if (view_group !== undefined) this.removeAsViewExcluded(view_group as Class_ViewTagGroup)

      // 2. RÉ-INSCRIPTION de la liste citée.
      const tag_ids = Array.isArray(raw) ? (raw as unknown[]) : []
      tag_ids.forEach(raw_tag_id => {
        const tag_id = String(raw_tag_id)
        if (+tag_id === 0 && level_group !== undefined) {
          this.addAsAntiTagged(level_group as Class_LevelTagGroup)
          return
        }
        if (+tag_id === 0 && view_group !== undefined) {
          this.addAsViewExcluded(view_group as Class_ViewTagGroup)
          return
        }
        const tag = tagg.tags_dict[tag_id]
        if (tag === undefined) return // étiquette inconnue du groupe : ignorée
        this.addTag(tag as Class_Tag)
      })
    })
    if (touched) {
      node.tagsUpdated()
      node.dimensionsUpdated()
    }
  }

  // TAG MANAGEMENT METHODS =============================================================
  /**
   * While adding a root level we must shift the previous level
   * 1->2 2->3 ...
   * @memberof Class_NodeDimension
   */
  // public shift_level_tags() {
  //   const tagg = this.parent_level_tag.group as Class_LevelTagGroup
  //   const idx = tagg.tags_list.indexOf(this.parent_level_tag as Class_LevelTag)
  //   this._parent_level_tag = tagg.tags_list[idx + 1]
  //   if (tagg.tags_list.length == idx + 2) {
  //     const new_tags = String(+this._parent_level_tag.id + 1)
  //     if (!tagg.tags_dict[new_tags]) {
  //       tagg.addTag(new_tags, new_tags) as Class_LevelTag
  //     }
  //     this._child_level_tag = tagg.tags_list[idx + 2]
  //   } else {
  //     this._child_level_tag = tagg.tags_list[idx + 2]
  //     this.children.forEach(c => c.dimensions_as_parent_pure.forEach(pdim => (pdim as Class_NodeDimension).shift_level_tags()))
  //   }
  //   this.parent.dimensionsUpdated()
  //   this.children.forEach(c => c.dimensionsUpdated())
  // }

  /**
   * For nodes wich are leaf for a given dimesion anf for which the level tag is not the lower
   * it creates some additional parent child relation so that the node is displayed for several level 
   * (2 and 3 for example)
   * @memberof Class_NodeDimension
   */
  // public normalize() {
  //   const group = this.parent_level_tag.group as Class_LevelTagGroup
  //   const last_tag = group.tags_list[this.parent_level_tag.group.tags_list.length - 1]
  //   this.children.forEach(c => {
  //     let ok = false
  //     const child_dimensions = c.dimensions_as_child.filter(c=>c.parent_level_tag.group.id == group.id)
  //     child_dimensions.forEach(cdim => {
  //       if (cdim.child_level_tag == last_tag) {
  //         ok = true
  //       }
  //     })
  //     if (ok) return
  //     let parent_dimension = c.nodeDimensionAsParent(group)
  //     if (!parent_dimension || parent_dimension.children.includes(parent_dimension.parent)) {
  //       //const child_dimensions = c.dimensions_as_child.filter(c=>c.parent_level_tag.group.id == group.id)
  //       const last_child_dimension = child_dimensions[child_dimensions.length-1]
  //       const last_child_dimension_tag = last_child_dimension.child_level_tag as Class_LevelTag
  //       const idx = group.tags_list.indexOf(last_child_dimension_tag)
  //       const new_tag = group.tags_list[idx+1]
  //       parent_dimension = (this.child_level_tag as Class_LevelTag).getOrCreateLowerDimension(c, c, new_tag)
  //     }
  //     parent_dimension.normalize()
  //   })
  // }

  /**
   * Check if given tag is referenced by node
   */
  public hasGivenTag(tag: Class_Tag) {
    return this._node.internalTagsData.tags.includes(tag)
  }

  /**
   * Add and cross-reference a Tag with node
   */
  public addTag(tag: Class_Tag) {
    const tagsData = this._node.internalTagsData
    if (!tagsData.tags.includes(tag)) {
      tagsData.tags.push(tag)
      this.addTagToGroupTagDict(tag)
      tag.addReference(this._node)
    }
  }

  /**
   * Remove tag and its cross-reference from node
   */
  public removeTag(tag: Class_Tag) {
    const tagsData = this._node.internalTagsData
    if (tagsData.tags.includes(tag)) {
      const idx = tagsData.tags.indexOf(tag)
      tagsData.tags.splice(idx, 1)
      this.removeTagFromGroupTagDict(tag)
      tag.removeReference(this._node)
    }
  }

  // PRIVATE HELPER METHODS =============================================================

  /**
   * Add tag to dict of tag sorted by group
   */
  private addTagToGroupTagDict(tag: Class_Tag) {
    const tagsData = this._node.internalTagsData
    const grp_id = tag.group.id
    
    if (grp_id in tagsData.taggs_dict) {
      if (!(tagsData.taggs_dict[grp_id].includes(tag)))
        tagsData.taggs_dict[grp_id].push(tag)
    }
    else {
      tagsData.taggs_dict[grp_id] = [tag]
    }
  }

  /**
   * Remove tag from dict of tag sorted by group
   */
  private removeTagFromGroupTagDict(tag: Class_Tag) {
    const tagsData = this._node.internalTagsData
    const grp_id = tag.group.id
    
    if (grp_id in tagsData.taggs_dict) {
      const idx = tagsData.taggs_dict[grp_id].indexOf(tag)
      tagsData.taggs_dict[grp_id].splice(idx, 1)

      // After removing a tag check if the node has other tag from the group,
      //  if not remove tag group entries from node so are_related_node_tags_selected don't take into account groupTag not linked to node
      if (Object.values(tagsData.taggs_dict[grp_id]).length == 0) {
        delete tagsData.taggs_dict[grp_id]
      }
    }
  }
}