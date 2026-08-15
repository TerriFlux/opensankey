// sa#283 — Échelle par dataTag GÉNÉRALISÉE (retour Julien, pilote SOCLE Céréales) : « c'est
// le principe du UnitTag, généralisé à tous les dataTags ». Les volumes varient de
// plusieurs ordres de grandeur entre tranches (blé tendre ~35 000 kt, millet quelques
// centaines) : chaque tag d'un groupe de dataTags peut porter une échelle PROPRE
// (Class_DataTag.own_scale), et la tranche sélectionnée impose la sienne au dessin.
//
// RÉSOLUTION DU PORTEUR — un seul endroit, deux consommateurs (le rendu Link.scaleValueToPx
// et le porteur transitoire de Class_ScaleOverrides) :
//   parcours des groupes de dataTags dans l'ordre de `taggs_order`, le DERNIER groupe
//   ayant un porteur gagne (le plus spécifique : `cereale` bat `unite` s'il vient après).
//   Porteur d'un groupe :
//    - groupe d'UNITÉ : le tag d'unité DE LA VALEUR considérée (chemin de l'arbre de
//      valeurs — sémantique historique : chaque flux suit l'échelle de SON unité, ce qui
//      rend affichables ensemble des valeurs non additives kWh/t/€). JAMAIS via la
//      sélection : plusieurs unités sont sélectionnées à la fois par construction ;
//    - groupe ordinaire : l'UNIQUE tag sélectionné à échelle propre (plusieurs tranches
//      scalées sélectionnées à la fois = agrégat, échelle ambiguë → groupe ignoré).
//   Aucun porteur → échelle de la zone de dessin (comportement historique).
//
// NON-RÉGRESSION : dans un fichier où seuls les groupes d'unité portent des échelles
// (tout le parc — le drapeau `scale_owned` n'existe pas en legacy), la résolution rend
// EXACTEMENT le tag d'unité de la valeur, ou rien : comportement strictement identique.
//
// Discipline d'import : module PUR (type-only) — testable par jest sans transformer d3.
import type { Class_DataTag } from './Tag'
import type { Class_DataTagGroup } from './TagGroup'
import type { Class_Sankey } from './Sankey'

// FONCTION PURE ======================================================================

export type Type_ScaleCarrierTagInfo = {
  tag_id: string
  is_selected: boolean
  /** Échelle propre (Class_DataTag.own_scale) : undefined = le tag n'en porte pas. */
  own_scale: number | undefined
}

export type Type_ScaleCarrierGroupInfo = {
  group_id: string
  is_unit: boolean
  tags: Type_ScaleCarrierTagInfo[]
}

export type Type_ResolvedScaleCarrier = {
  group_id: string
  tag_id: string
  scale: number
}

const isValidScale = (v: number | undefined): v is number =>
  typeof v === 'number' && Number.isFinite(v) && v > 0

/**
 * Tag porteur de l'échelle effective, ou undefined (→ échelle de la zone de dessin).
 * `groups_in_order` : les groupes de dataTags dans l'ordre de `taggs_order`.
 * `value_unit_tag` : le tag d'unité de la VALEUR considérée (chemin de l'arbre de
 * valeurs), s'il y en a un — seul canal par lequel un groupe d'unité peut porter.
 */
export function resolveScaleCarrier(
  groups_in_order: Type_ScaleCarrierGroupInfo[],
  value_unit_tag?: { group_id: string, tag_id: string }
): Type_ResolvedScaleCarrier | undefined {
  for (let i = groups_in_order.length - 1; i >= 0; i--) {
    const group = groups_in_order[i]
    if (group.is_unit) {
      // Groupe d'unité : porteur = le tag d'unité de la valeur, jamais la sélection.
      if (value_unit_tag === undefined || value_unit_tag.group_id !== group.group_id) continue
      const tag = group.tags.find(t => t.tag_id === value_unit_tag.tag_id)
      if (tag !== undefined && isValidScale(tag.own_scale)) {
        return { group_id: group.group_id, tag_id: tag.tag_id, scale: tag.own_scale }
      }
      continue
    }
    // Groupe ordinaire : l'unique tag sélectionné à échelle propre.
    const scaled_selected = group.tags.filter(t => t.is_selected && isValidScale(t.own_scale))
    if (scaled_selected.length === 1) {
      return {
        group_id: group.group_id,
        tag_id: scaled_selected[0].tag_id,
        scale: scaled_selected[0].own_scale as number,
      }
    }
    // 0 sélectionné scalé → le groupe ne porte pas ; ≥ 2 → ambigu (agrégat) → ignoré.
  }
  return undefined
}

// ADAPTATEUR RUNTIME =================================================================

/**
 * Résout le TAG porteur (objet vivant) pour la sélection courante du diagramme, avec en
 * option le tag d'unité de la valeur considérée (Link.value.unit_data_tag()). Retourne
 * un Class_DataTag dont `own_scale` est défini, ou undefined (→ échelle de la DA).
 */
export function resolveScaleCarrierTag(
  sankey: Class_Sankey,
  value_unit_tag?: Class_DataTag
): Class_DataTag | undefined {
  const groups = sankey.getTagGroupsAsList('data_taggs') as Class_DataTagGroup[]
  const infos: Type_ScaleCarrierGroupInfo[] = groups.map(group => ({
    group_id: group.id,
    is_unit: group.is_unit,
    tags: group.tags_list.map(tag => ({
      tag_id: tag.id,
      is_selected: tag.is_selected,
      own_scale: (tag as Class_DataTag).own_scale,
    })),
  }))
  const resolved = resolveScaleCarrier(
    infos,
    value_unit_tag !== undefined
      ? { group_id: value_unit_tag.group.id, tag_id: value_unit_tag.id }
      : undefined
  )
  if (resolved === undefined) return undefined
  const group = groups.find(g => g.id === resolved.group_id)
  return group?.tags_dict[resolved.tag_id] as Class_DataTag | undefined
}
