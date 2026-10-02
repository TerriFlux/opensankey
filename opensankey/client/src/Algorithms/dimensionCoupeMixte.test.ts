import { Class_ApplicationData } from '../types/ApplicationData'
import type { Class_DataTag } from '../types/Tag'
import type { Class_DataTagGroup } from '../types/TagGroup'
import type { Class_LinkValue } from '../Elements/LinkValues'
import type { Class_LinkElement } from '../Elements/Link'
import type { Class_NodeElement } from '../Elements/Node'
import { disaggregateDimensionNodes, isGeneratedMemberLink, isGeneratedMemberNode } from './DimensionDisaggregation'
import { NodeRightExtremityStyle } from '../Elements/ElementStyle'

// jest 27 / jsdom n expose pas structuredClone (utilise par Link.copyFrom)
if (typeof globalThis.structuredClone !== 'function') {
  globalThis.structuredClone = <T>(o: T): T => JSON.parse(JSON.stringify(o)) as T
}

// os#1511 — LA COUPE MIXTE. Julien, 29/09 : « on pourrait mixer differents niveaux, par exemple
// Afrique et Espagne et Italie, parce que ca c est cool. »
//
// Ce que ces tests etablissent, avant de toucher a la moindre interface : le MODELE le fait-il
// deja ? La regle de `selectMembers` n interdit que le RECOUVREMENT (un membre et son ancetre
// ensemble), pas la difference de niveau. Si elle suffit, il n y a rien a changer sous l ecran —
// et c est l ecran seul qui empeche de le demander.
//
// LA PROPRIETE QUI COMPTE N EST PAS « des niveaux differents », c est que les membres dessines
// forment une FRONTIERE : aucun n est l ancetre d un autre (sinon on compte deux fois), et
// ensemble ils couvrent la racine (sinon il en manque). Afrique + Espagne + Italie la forme ;
// Europe + Espagne, non.
//
//   monde
//     europe          (espagne 195, italie 145)
//       espagne
//       italie
//     afrique         (maroc 130, egypte 80)
//       maroc
//       egypte

type Montage = {
  sankey: Class_ApplicationData['drawing_area']['sankey'],
  pays: Class_DataTagGroup,
  france: Class_NodeElement,
  partenaires: Class_NodeElement,
  flux: Class_LinkElement,
}

const FEUILLES: { [id: string]: number } = {
  espagne: 195, italie: 145, maroc: 130, egypte: 80,
}
const TOTAL = 195 + 145 + 130 + 80   // 550

function monter(): Montage {
  const app = new Class_ApplicationData(false)
  const sankey = app.drawing_area.sankey
  const pays = sankey.addDataTagGroup('pays', 'Pays', false) as unknown as Class_DataTagGroup
  const monde = pays.addTag('Monde', 'monde') as Class_DataTag
  const europe = pays.addTag('Europe', 'europe') as Class_DataTag
  const afrique = pays.addTag('Afrique', 'afrique') as Class_DataTag
  europe.parent = monde
  afrique.parent = monde
  Object.keys(FEUILLES).forEach(id => {
    const feuille = pays.addTag(id, id) as Class_DataTag
    feuille.parent = (id === 'espagne' || id === 'italie') ? europe : afrique
  })
  pays.levels = ['monde', 'regions', 'pays']

  const france = sankey.addNewNodeWithName('France')
  const partenaires = sankey.addNewNodeWithName('Partenaires')
  const flux = sankey.addNewLink(france, partenaires)
  Object.entries(FEUILLES).forEach(([id, nombre]) => {
    pays.tags_list.forEach(t => t.setUnSelected())
    ;(pays.tags_dict[id] as Class_DataTag).setSelected()
    ;(flux.value as Class_LinkValue).valueData = nombre
  })
  return { sankey, pays, france, partenaires, flux }
}

/** Les membres effectivement retenus par le modele, dans l ordre du groupe. */
function retenus(pays: Class_DataTagGroup): string[] {
  return pays.selected_tags_list.map(t => t.id).sort()
}

describe('os#1511 — le modele accepte-t-il deja une coupe MIXTE', () => {
  test('Afrique + Espagne + Italie : les trois sont retenus', () => {
    const m = monter()
    m.pays.selectMembers(['afrique', 'espagne', 'italie'])
    expect(retenus(m.pays)).toEqual(['afrique', 'espagne', 'italie'])
  })

  test('un membre et son ANCETRE ensemble : l ancetre cede la place', () => {
    const m = monter()
    m.pays.selectMembers(['europe', 'espagne'])
    // Garder les deux compterait l Espagne deux fois — dans Europe, et pour elle-meme.
    expect(retenus(m.pays)).toEqual(['espagne'])
  })

  test('le niveau courant suit le membre le PLUS FIN de la coupe', () => {
    const m = monter()
    m.pays.selectMembers(['afrique', 'espagne', 'italie'])
    // Afrique est au niveau 1, Espagne et Italie au niveau 2 : la coupe descend a 2.
    expect(m.pays.current_level_index).toBe(2)
  })
})

describe('os#1511 — une coupe mixte se DESSINE, et sans double compte', () => {
  test('trois noeuds, et les trois refont le total', () => {
    const m = monter()
    m.partenaires.driving_dimension = m.pays
    m.pays.selectMembers(['afrique', 'espagne', 'italie'])
    disaggregateDimensionNodes(m.sankey)

    const noeuds = m.sankey.nodes_list.filter(isGeneratedMemberNode).map(n => n.name).sort()
    expect(noeuds).toEqual(['Afrique', 'espagne', 'italie'])

    const flux = m.sankey.links_list.filter(isGeneratedMemberLink)
      .map(l => `${l.target.name}=${l.value?.valueData}`).sort()
    // Afrique agrege ses deux feuilles ; l Espagne et l Italie portent la leur.
    expect(flux).toEqual(['Afrique=210', 'espagne=195', 'italie=145'])
    expect(m.sankey.links_list.filter(isGeneratedMemberLink)
      .reduce((t, l) => t + (l.value?.valueData ?? 0), 0)).toBe(TOTAL)
  })

  test('le total ne bouge pas d une coupe a l autre — le critere de recette', () => {
    const m = monter()
    m.partenaires.driving_dimension = m.pays
    // CE QUE LE DESSIN MONTRE, et non les seuls flux engendres : avec UN SEUL membre choisi, il
    // n y a rien a engendrer — l axe reste lui-meme et porte l agregat (cf. la regle du membre
    // unique). Sommer les flux VISIBLES est donc la seule lecture qui vaille pour les quatre
    // coupes a la fois.
    const totalDe = (coupe: string[]) => {
      m.pays.selectMembers(coupe)
      disaggregateDimensionNodes(m.sankey)
      return m.sankey.links_list.filter(l => l.is_visible)
        .reduce((t, l) => t + (l.valueCurrent ?? 0), 0)
    }
    expect(totalDe(['monde'])).toBe(TOTAL)
    expect(totalDe(['europe', 'afrique'])).toBe(TOTAL)
    expect(totalDe(['espagne', 'italie', 'maroc', 'egypte'])).toBe(TOTAL)
    // ET LA COUPE MIXTE, qui est le point : elle vaut autant que les trois autres.
    expect(totalDe(['afrique', 'espagne', 'italie'])).toBe(TOTAL)
  })

  // os#1511, 29/09 — Julien : « en noeud duplique, il faut que ca suive les options de
  // desagregation ». Les noeuds engendres prennent la place de l axe (mode `fill`, le defaut) au
  // lieu de s etaler de 90 px en dur autour de lui — un ecart qui ne connaissait ni leur hauteur
  // ni le slot du parent, donc qui debordait sur les voisins des qu ils etaient nombreux.
  test('les noeuds engendres prennent la PLACE de l axe, pas un ecart en dur', () => {
    const m = monter()
    m.partenaires.setPosXY(520, 300)
    m.partenaires.driving_dimension = m.pays
    m.pays.selectMembers(['europe', 'afrique'])
    disaggregateDimensionNodes(m.sankey)
    const engendres = m.sankey.nodes_list.filter(isGeneratedMemberNode)
    // Meme colonne que l axe : `layoutChildrenInParentSlot` ne regle que le Y.
    engendres.forEach(n => expect(n.position_x).toBe(520))
    // Et ils occupent le slot du parent, a partir de son haut — jamais au-dessus.
    const haut = Math.min(...engendres.map(n => n.position_y))
    expect(haut).toBeGreaterThanOrEqual(300)
  })

  // os#1511, 29/09 — Julien : « c est marque "remplir le slot du parent" mais ca fait pas ca, ca
  // ecarte. » C etait vrai : la position enregistree de chaque membre ecrasait la mise en page
  // qu on venait de calculer. (Depuis le 02/10, elle s applique APRES la mise en page, dans tous
  // les modes : cf. le test suivant.)
  test('sous GARDER LES POSITIONS, celle du membre fait foi', () => {
    const m = monter()
    m.partenaires.setPosXY(520, 300)
    m.partenaires.driving_dimension = m.pays
    ;(m.sankey.drawing_area as unknown as { disaggregation_gap_mode: string })
      .disaggregation_gap_mode = 'keep'
    ;(m.pays.tags_dict['afrique'] as Class_DataTag).position = { x: 700, y: 55 }
    m.pays.selectMembers(['europe', 'afrique'])
    disaggregateDimensionNodes(m.sankey)
    const afrique = m.sankey.nodes_list.filter(isGeneratedMemberNode)
      .find(n => n.name === 'Afrique')
    expect([afrique?.position_x, afrique?.position_y]).toEqual([700, 55])
  })

  // os#1511, 02/10 (sa!824) — RENVERSE : « un noeud engendre se comporte comme un noeud ordinaire ».
  // Deplace a la main, il reste ou on l a pose, dans TOUS les modes, slot compris : la position
  // manuelle s applique APRES la mise en page. Les membres sans position suivent le slot. Le retour
  // au placement automatique passe par le menu « Placer », qui efface ces positions.
  test('sous REMPLIR LE SLOT, un membre deplace garde sa place, les autres suivent le slot', () => {
    const m = monter()
    m.partenaires.setPosXY(520, 300)
    m.partenaires.driving_dimension = m.pays
    ;(m.pays.tags_dict['afrique'] as Class_DataTag).position = { x: 700, y: 55 }
    m.pays.selectMembers(['europe', 'afrique'])
    disaggregateDimensionNodes(m.sankey)
    const engendres = m.sankey.nodes_list.filter(isGeneratedMemberNode)
    const afrique = engendres.find(n => n.name === 'Afrique')
    const europe = engendres.find(n => n.name === 'Europe')
    expect([afrique?.position_x, afrique?.position_y]).toEqual([700, 55])
    // L Europe, sans position a elle, est mise en page dans le slot de l axe.
    expect(europe?.position_x).toBe(520)
    expect(europe?.position_y).toBeGreaterThanOrEqual(300)
  })

  // os#1511, 29/09 — « le positionnement desagrege, ca marche toujours pas ». La cause n etait
  // plus la position du membre (corrigee le matin) mais L ORDRE : la mise en page tournait a la
  // CREATION des noeuds, donc AVANT que leurs flux existent. « Remplir le slot » repartit d apres
  // la HAUTEUR, et la hauteur d un noeud vient de ses flux : on repartissait le slot entre des
  // noeuds qui ne pesaient rien.
  test('au moment ou on les place, les membres ont deja leurs flux — donc une hauteur', () => {
    const m = monter()
    m.partenaires.setPosXY(520, 300)
    m.partenaires.driving_dimension = m.pays
    m.pays.selectMembers(['europe', 'afrique'])
    disaggregateDimensionNodes(m.sankey)
    const engendres = m.sankey.nodes_list.filter(isGeneratedMemberNode)
    // Chacun porte son flux, donc une hauteur non nulle : c est ce qui manquait.
    engendres.forEach(n => {
      expect(n.input_links_list.filter(isGeneratedMemberLink).length).toBe(1)
      expect(n.getShapeHeightToUse()).toBeGreaterThan(0)
    })
    // Et ils se suivent dans le slot, du plus haut au plus bas, sans se chevaucher.
    const tries = [...engendres].sort((a, b) => a.position_y - b.position_y)
    for (let i = 1; i < tries.length; i++) {
      expect(tries[i].position_y)
        .toBeGreaterThanOrEqual(tries[i - 1].position_y + tries[i - 1].getShapeHeightToUse())
    }
  })

  // os#1511, 30/09 — « il faut que les labels soient positionnes a droite ou a gauche du noeud ».
  // Les styles d extremite mettent le nom A COTE plutot que dessus ; la mise en page automatique
  // les pose d apres la connectivite, mais un noeud de membre nait APRES elle. Il herite donc de
  // ceux de son axe, ce qui est juste par construction : meme colonne, memes voisins.
  test('un noeud de membre herite des styles d extremite de son axe', () => {
    const m = monter()
    const style = m.sankey.styles_dict[NodeRightExtremityStyle]
    expect(style).toBeDefined()
    m.partenaires.addStyle(style)
    m.partenaires.driving_dimension = m.pays
    m.pays.selectMembers(['europe', 'afrique'])
    disaggregateDimensionNodes(m.sankey)
    const engendres = m.sankey.nodes_list.filter(isGeneratedMemberNode)
    expect(engendres.length).toBeGreaterThan(0)
    engendres.forEach(n => expect(n.hasStyle(NodeRightExtremityStyle)).toBe(true))
  })

  test('une coupe mixte de l autre cote : Europe entiere, l Afrique detaillee', () => {
    const m = monter()
    m.partenaires.driving_dimension = m.pays
    m.pays.selectMembers(['europe', 'maroc', 'egypte'])
    disaggregateDimensionNodes(m.sankey)
    const flux = m.sankey.links_list.filter(isGeneratedMemberLink)
      .map(l => `${l.target.name}=${l.value?.valueData}`).sort()
    expect(flux).toEqual(['Europe=340', 'egypte=80', 'maroc=130'])
  })
})
