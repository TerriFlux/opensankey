import { buildNestedDimensionTree, dataCutOf, smallMultipleCellsOf } from './DataDimensionHierarchy'
import type { Class_DataTag } from '../types/Tag'
import type { Class_DataTagGroup } from '../types/TagGroup'
import { memberPathSectorId, parseMemberSectorId } from './memberSectorId'
import type { Type_MemberRef } from './memberSectorId'
import type { Type_SunburstNode } from './SunburstHierarchy'
import { drawPlanOf } from './couronnePlan'
import { descripteur, monterSocle, type Type_Socle } from './__fixtures__/couronneSocle'
import { declaredDimensionIdsOf, readCouronneState } from '../Representations/couronneState'
import {
  dataDimensionLevelsDisplay, readFigureDataFocus, readFigureDimensionZooms, readFigureLevelsDisplay,
  readFigureOpening, smallMultiplesApply
} from '../Representations/figureOpening'

// 04/10/2026 — os#1511, refonte etape 2, lot 1 : LE FILET DU LOT 2.
//
// Pour une serie de reglages reels (anciens formats, figure liee et detachee), on compare le plan
// (`readCouronneState` puis `drawPlanOf`) a ce que dessine le code d aujourd hui : la coupe
// (`dataCutOf`), les petits multiples (`smallMultiplesOf`, rejoue), la lecture en anneaux
// (`ringsReadingOf`, rejouee) et l arbre (`buildNestedDimensionTree`). On compare la FORME : les
// dimensions qui decoupent et leur ordre, les parts de chacune, les anneaux de chaque part en
// sunburst, les cases, le secteur unique quand rien ne decoupe.
//
// Les ECARTS CONNUS sont listes a part (`ECARTS`) : chacun est un bug d aujourd hui ou un choix du
// nouveau modele. Un ecart qui n y est pas fait echouer le test ; un ecart liste qui disparait aussi
// (il faut alors le retirer de la liste).

type Bag = { [k: string]: unknown }

interface Drawing {
  cut: string[]
  parts: { [dim: string]: string[] }
  /** En anneaux seulement : les anneaux de chaque part, dans sa dimension. */
  paths?: { [dim: string]: { [part: string]: string[] } }
  cells: string[] | null
  whole: string[] | null
}

const ref = (dimension_id: string, member_id: string): Type_MemberRef => ({ dimension_id, member_id })
const zoom = (...refs: Type_MemberRef[]) => [memberPathSectorId(refs)]

/** Ce que dessine le code d aujourd hui, rejoue comme `registerAnalysisRepresentations`. */
const ancien = (s: Type_Socle, options: Bag): Drawing => {
  const declared = declaredDimensionIdsOf(options) ?? []
  const opening = readFigureOpening(options).data
  // `smallMultiplesOf`
  const split_id = options['small_multiples_by']
  const split_dim = typeof split_id === 'string' ? s.sankey.data_taggs_dict[split_id] as unknown as Class_DataTagGroup | undefined : undefined
  let split: { dim: Class_DataTagGroup, members: Class_DataTag[] } | null = null
  if (split_dim?.is_hierarchical && smallMultiplesApply(split_dim.id, declared, opening.inactive)) {
    const members = smallMultipleCellsOf(split_dim, opening, readFigureDimensionZooms(options).get(split_dim.id))
    if (members.length > 0) split = { dim: split_dim, members }
  }
  const nav = split !== null && split.members.length === 1 ? { data_tags: [split.members[0]] } : { data_tags: null }
  const cut = dataCutOf(s.sankey, declared, opening, split ? [split.dim.id] : [])
  // `ringsReadingOf`
  const levels = readFigureLevelsDisplay(options)
  const modeOf = (id: string) => dataDimensionLevelsDisplay(levels, id)
  const count = cut.dividing.length
  const rings = count === 0 ? levels.common === 'rings' : count > 1 || cut.dividing.some(d => modeOf(d.id) === 'rings')
  const tree = buildNestedDimensionTree({ kind: 'link', link: s.lien }, cut, nav, {
    max_depth: 8, ...(rings ? { levels_display_of: modeOf } : {}), focus: readFigureDataFocus(options)
  })
  const out: Drawing = { cut: [], parts: {}, cells: split !== null && split.members.length > 1 ? split.members.map(m => m.id) : null, whole: null }
  const root = tree?.roots[0]
  if (root === undefined) return out
  // Rien ne decoupe : le foyer ne peut rien designer (`resolveDataFocus`), un seul secteur.
  if (cut.dividing.length === 0) {
    out.whole = root.children.map(c => (parseMemberSectorId(c.id) as Type_MemberRef).member_id)
    return out
  }
  if (rings) out.paths = {}
  const walk = (node: Type_SunburstNode, chain: Type_SunburstNode[]) => {
    if (node.children.length > 0) { node.children.forEach(c => walk(c, [...chain, c])); return }
    const by_dim = new Map<string, string[]>()
    chain.forEach(n => {
      const r = parseMemberSectorId(n.id)
      if (r === null) return
      by_dim.set(r.dimension_id, [...(by_dim.get(r.dimension_id) ?? []), r.member_id])
    })
    by_dim.forEach((ids, dim) => {
      if (!out.cut.includes(dim)) out.cut.push(dim)
      const part = ids[ids.length - 1]
      const list = out.parts[dim] ?? (out.parts[dim] = [])
      if (!list.includes(part)) list.push(part)
      if (out.paths) (out.paths[dim] ?? (out.paths[dim] = {}))[part] = ids
    })
  }
  root.children.forEach(c => walk(c, [c]))
  return out
}

/** Ce que dit le plan, dans la meme forme. */
const nouveau = (s: Type_Socle, options: Bag, rings: boolean): Drawing => {
  const plan = drawPlanOf(readCouronneState(options, s.sankey), s.sankey)
  const out: Drawing = {
    cut: plan.cut.map(c => c.dimension_id),
    parts: Object.fromEntries(plan.cut.map(c => [c.dimension_id, c.parts.map(p => p.member_id)])),
    cells: plan.cells?.members ?? null,
    whole: plan.whole?.member_ids ?? null
  }
  if (rings && plan.whole === null) {
    out.paths = Object.fromEntries(plan.cut.map(c => [c.dimension_id, Object.fromEntries(c.parts.map(p => [p.member_id, p.path]))]))
  }
  return out
}

interface Cas {
  nom: string
  options: Bag
  /** Le diagramme : les membres choisis par dimension. */
  diagramme?: { filiere?: string[], pays?: string[] }
}

const croise = descripteur('filiere', 'pays')
const det = (o: Bag): Bag => ({ descriptor: croise, coordinates_linked: false, ...o })
const ouverts = { filiere: ['produits'], pays: ['monde'] }

const CAS: Cas[] = [
  // ── DÉTACHÉE ──
  { nom: 'D1 neuve croisee', options: det({}) },
  { nom: 'D2 neuve une dimension', options: { descriptor: descripteur('filiere'), coordinates_linked: false } },
  { nom: 'D3 croise filieres x continents', options: det({ dimension_opening: ouverts }) },
  { nom: 'D4 mixte cereales en HS4', options: det({ dimension_opening: { filiere: ['produits', 'cereales'] } }) },
  { nom: 'D5 decoche lait', options: det({ dimension_opening: ouverts, dimension_hidden: { filiere: ['lait'] } }) },
  { nom: 'D6 pays desactive', options: det({ dimension_opening: ouverts, inactive_dimensions: ['pays'] }) },
  {
    nom: 'D7 croise filieres en sunburst',
    options: det({ dimension_opening: { filiere: ['produits', 'cereales'], pays: ['monde'] }, levels_display_by: { filiere: 'rings' } })
  },
  { nom: 'D8 sunburst commun mixte', options: det({ dimension_opening: { filiere: ['produits', 'cereales'] }, levels_display: 'rings' }) },
  { nom: 'D9 zoom cereales', options: det({ dimension_opening: { filiere: ['produits'] }, hierarchy_focus: zoom(ref('filiere', 'cereales')) }) },
  {
    nom: 'D10 zoom cereales + lait',
    options: det({ dimension_opening: { filiere: ['produits'] }, hierarchy_focus: zoom(ref('filiere', 'cereales'), ref('filiere', 'lait')) })
  },
  {
    nom: 'D11 pile cereales puis europe',
    options: det({
      dimension_opening: ouverts,
      hierarchy_focus: [...zoom(ref('filiere', 'cereales')), ...zoom(ref('filiere', 'cereales'), ref('pays', 'europe'))]
    })
  },
  {
    nom: 'D12 cereales zoome, pays en multiples Europe + Ameriques',
    options: det({
      dimension_opening: ouverts, small_multiples_by: 'pays',
      hierarchy_focus: zoom(ref('pays', 'europe'), ref('pays', 'ameriques'), ref('filiere', 'cereales'))
    })
  },
  { nom: 'D13 multiples pays sans zoom', options: det({ dimension_opening: ouverts, small_multiples_by: 'pays' }) },
  { nom: 'D14 multiples pays zoome Europe', options: det({ dimension_opening: ouverts, small_multiples_by: 'pays', hierarchy_focus: zoom(ref('pays', 'europe')) }) },
  {
    nom: 'D15 zoom sur une feuille (Espagne), seule dimension',
    options: { descriptor: descripteur('pays'), coordinates_linked: false, dimension_opening: { pays: ['monde', 'europe'] }, hierarchy_focus: zoom(ref('pays', 'es')) }
  },
  {
    nom: 'D16 pays puis filieres, tout en sunburst',
    options: {
      descriptor: descripteur('pays', 'filiere'), coordinates_linked: false, levels_display: 'rings',
      dimension_opening: { pays: ['monde', 'europe'], filiere: ['produits'] }
    }
  },
  {
    nom: 'D17 zoom a deux membres hors centre, non ouverts',
    options: det({
      dimension_opening: ouverts,
      hierarchy_focus: zoom(ref('filiere', 'cereales'), ref('filiere', 'lait'), ref('pays', 'europe'))
    })
  },
  {
    nom: 'D18 sunburst une dimension zoomee sur cereales',
    options: {
      descriptor: descripteur('filiere'), coordinates_linked: false, levels_display: 'rings',
      dimension_opening: { filiere: ['produits', 'lait'] }, hierarchy_focus: zoom(ref('filiere', 'cereales'))
    }
  },
  { nom: 'D19 rien ne decoupe', options: det({ dimension_opening: {} }) },
  // ── LIÉE ──
  { nom: 'L1 liee, diagramme par defaut', options: { descriptor: croise } },
  { nom: 'L2 liee, croise', options: { descriptor: croise }, diagramme: { filiere: ['ble', 'mais', 'lait'], pays: ['europe', 'ameriques'] } },
  {
    nom: 'L3 liee, zoom cereales, diagramme sous la portee',
    options: { descriptor: croise, hierarchy_focus: zoom(ref('filiere', 'cereales')) },
    diagramme: { filiere: ['ble', 'mais', 'lait'], pays: ['europe', 'ameriques'] }
  },
  { nom: 'L4 liee, zoom cereales, diagramme aux filieres', options: { descriptor: croise, hierarchy_focus: zoom(ref('filiere', 'cereales')) } },
  {
    nom: 'L5 liee, zoom Europe, pays a un membre',
    options: { descriptor: croise, hierarchy_focus: zoom(ref('pays', 'europe')) }, diagramme: { pays: ['europe'] }
  },
  {
    nom: 'L6 liee, filieres desactivees',
    options: { descriptor: croise, inactive_dimensions: ['filiere'] }, diagramme: { filiere: ['ble', 'mais', 'lait'], pays: ['europe', 'ameriques'] }
  },
  {
    nom: 'L7 liee, multiples par pays',
    options: { descriptor: croise, small_multiples_by: 'pays' }, diagramme: { pays: ['europe', 'ameriques'] }
  },
  { nom: 'L8 liee, sunburst mixte', options: { descriptor: croise, levels_display: 'rings' }, diagramme: { filiere: ['ble', 'mais', 'lait'] } },
  {
    nom: 'L9 liee, la selection sort de la portee',
    options: { descriptor: croise, hierarchy_focus: zoom(ref('filiere', 'cereales')) }, diagramme: { filiere: ['lait', 'viande'] }
  },
  { nom: 'L10 liee, un pays seul', options: { descriptor: croise }, diagramme: { filiere: ['cereales'], pays: ['fr'] } }
]

/**
 * LES ÉCARTS CONNUS : ce que le plan dessine autrement que le code d'aujourd'hui, et pourquoi. La
 * valeur est la partie du dessin qui diffère.
 */
const ECARTS: { [nom: string]: { pourquoi: string, ancien: Partial<Drawing>, nouveau: Partial<Drawing> } } = {
  'D15 zoom sur une feuille (Espagne), seule dimension': {
    pourquoi: 'Une dimension a UNE part ne decoupe pas dans le modele : elle se lit sur ce membre. Avant, le ' +
      '« lone leaf » de resolveDataFocus en faisait un anneau d un secteur. Meme image (un secteur a 100 %), ' +
      'mais plus de cas particulier.',
    ancien: { cut: ['pays'], parts: { pays: ['es'] }, whole: null },
    nouveau: { cut: [], parts: {}, whole: ['es'] }
  },
  'D17 zoom a deux membres hors centre, non ouverts': {
    pourquoi: 'BUG D AVANT : un zoom a deux membres (Cereales + Lait) sur une dimension qui n est pas celle du ' +
      'centre et que la coupe n ouvre pas etait lu sur leur SOMME, sans le dire. Dans le modele, deux membres ' +
      'dans la portee sont deux parts.',
    ancien: { cut: ['pays'], parts: { pays: ['fr', 'es'] }, paths: { pays: { fr: ['fr'], es: ['es'] } } },
    nouveau: {
      cut: ['filiere', 'pays'], parts: { filiere: ['cereales', 'lait'], pays: ['fr', 'es'] },
      paths: { filiere: { cereales: ['cereales'], lait: ['lait'] }, pays: { fr: ['fr'], es: ['es'] } }
    }
  },
  'L9 liee, la selection sort de la portee': {
    pourquoi: 'REGLE DU MODELE (Julien) : liee, si la selection du diagramme ne touche plus la portee, la portee ' +
      'revient a la racine. Avant, la couronne restait zoomee sur Cereales et montrait Ble, Mais que le ' +
      'diagramme ne montre plus.',
    ancien: { parts: { filiere: ['ble', 'mais'] } },
    nouveau: { parts: { filiere: ['lait', 'viande'] } }
  }
}

const monterCas = (c: Cas) => {
  const s = monterSocle()
  if (c.diagramme?.filiere) s.filiere.selectMembers(c.diagramme.filiere)
  if (c.diagramme?.pays) s.pays.selectMembers(c.diagramme.pays)
  return s
}

const ecartDe = (a: Drawing, b: Drawing): { ancien: Partial<Drawing>, nouveau: Partial<Drawing> } | null => {
  const ancien: Partial<Drawing> = {}
  const nouveau: Partial<Drawing> = {}
  ;(['cut', 'parts', 'paths', 'cells', 'whole'] as const).forEach(k => {
    if (JSON.stringify(a[k] ?? null) !== JSON.stringify(b[k] ?? null)) {
      ;(ancien as Bag)[k] = a[k] ?? null
      ;(nouveau as Bag)[k] = b[k] ?? null
    }
  })
  return Object.keys(ancien).length > 0 ? { ancien, nouveau } : null
}

describe('os#1511 drawPlanOf — non-regression contre dataCutOf + buildNestedDimensionTree', () => {
  CAS.forEach(c => {
    test(c.nom, () => {
      const s = monterCas(c)
      const a = ancien(s, c.options)
      const b = nouveau(s, c.options, a.paths !== undefined)
      const ecart = ecartDe(a, b)
      const connu = ECARTS[c.nom]
      if (process.env.COURONNE_ECARTS === '1' && ecart !== null) {
        // eslint-disable-next-line no-console
        console.log(c.nom, JSON.stringify(ecart))
      }
      if (connu === undefined) expect(ecart).toBeNull()
      else expect(ecart).toEqual({ ancien: connu.ancien, nouveau: connu.nouveau })
    })
  })
})
