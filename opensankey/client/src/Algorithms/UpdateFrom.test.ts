import { Class_ApplicationData } from '../types/ApplicationData'
import type { Class_NodeElement } from '../Elements/Node'
import type { Class_LinkElement } from '../Elements/Link'
import { updateFrom } from './UpdateFrom'

// jsdom + node de l'environnement jest 27 n'expose pas toujours `structuredClone`
// (utilisé par le mode `Values`/`*` d'updateFrom). En prod (navigateur) il existe
// nativement ; on le polyfill uniquement pour le test.
if (typeof (globalThis as { structuredClone?: unknown }).structuredClone === 'undefined') {
  ;(globalThis as { structuredClone: <T>(o: T) => T }).structuredClone =
    <T>(o: T): T => JSON.parse(JSON.stringify(o)) as T
}

// #232 — Tests de la couche BASE OpenSankey : `updateFrom` applique la mise en
// page / les attributs d'une drawing_area SOURCE vers la CIBLE, selon une liste
// de modes (`mode: string[]`). C'est le socle de l'héritage de vues (OSP appelle
// `updateFrom(cible_da, source_da, attrs)` pour propager les attributs hérités).
//
// On construit deux `Class_ApplicationData` réelles (comme corpusRoundTrip) et on
// vérifie : la propagation nominale par mode, la SÉLECTIVITÉ (seuls les attrs du
// mode passent), la NON-RÉGRESSION (un attribut hors mode n'est pas écrasé), et
// les cas limites (source/cible vides, nœud présent d'un seul côté).

/** Diagramme minimal A→B, réutilisé identiquement côté source et cible pour que
 *  `updateFrom` apparie les nœuds/liens par nom+id. */
function makePair(app: Class_ApplicationData): {
  A: Class_NodeElement
  B: Class_NodeElement
  link: Class_LinkElement
} {
  const sankey = app.drawing_area.sankey
  const A = sankey.addNewNode('A', 'A')
  const B = sankey.addNewNode('B', 'B')
  const link = sankey.addNewLink(A, B)
  return { A, B, link }
}

describe('#232 updateFrom — propagation nominale par mode', () => {
  it('posNode : positions x/y/u/v propagées source → cible', () => {
    const src = new Class_ApplicationData(false)
    const tgt = new Class_ApplicationData(false)
    const s = makePair(src)
    const t = makePair(tgt)

    s.A.position_x = 123
    s.A.position_y = 456
    s.A.position_u = 7
    s.A.position_v = 8

    updateFrom(tgt.drawing_area, src.drawing_area, ['posNode'])

    expect(t.A.position_x).toBe(123)
    expect(t.A.position_y).toBe(456)
    expect(t.A.position_u).toBe(7)
    expect(t.A.position_v).toBe(8)
  })

  it('attrNode : attribut de forme (shape_opacity) propagé', () => {
    const src = new Class_ApplicationData(false)
    const tgt = new Class_ApplicationData(false)
    const s = makePair(src)
    const t = makePair(tgt)

    s.A.shape_opacity = 0.3

    updateFrom(tgt.drawing_area, src.drawing_area, ['attrNode'])

    expect(t.A.shape_opacity).toBe(0.3)
  })

  it('attrFlux : attribut de lien (shape_opacity) propagé', () => {
    const src = new Class_ApplicationData(false)
    const tgt = new Class_ApplicationData(false)
    const s = makePair(src)
    const t = makePair(tgt)

    s.link.shape_opacity = 0.2

    updateFrom(tgt.drawing_area, src.drawing_area, ['attrFlux'])

    expect(t.link.shape_opacity).toBe(0.2)
  })
})

describe('#232 updateFrom — sélectivité (seuls les modes demandés passent)', () => {
  it('posNode ne touche PAS les attributs de nœud', () => {
    const src = new Class_ApplicationData(false)
    const tgt = new Class_ApplicationData(false)
    const s = makePair(src)
    const t = makePair(tgt)

    s.A.position_x = 999
    s.A.shape_opacity = 0.1 // modifié côté source mais NON demandé
    t.A.shape_opacity = 0.7 // valeur cible à préserver

    updateFrom(tgt.drawing_area, src.drawing_area, ['posNode'])

    expect(t.A.position_x).toBe(999) // position propagée
    expect(t.A.shape_opacity).toBe(0.7) // attribut NON propagé
  })

  it('attrNode ne touche PAS la position', () => {
    const src = new Class_ApplicationData(false)
    const tgt = new Class_ApplicationData(false)
    const s = makePair(src)
    const t = makePair(tgt)

    s.A.shape_opacity = 0.1
    s.A.position_x = 999 // modifié côté source mais NON demandé
    t.A.position_x = 42 // valeur cible à préserver

    updateFrom(tgt.drawing_area, src.drawing_area, ['attrNode'])

    expect(t.A.shape_opacity).toBe(0.1) // attribut propagé
    expect(t.A.position_x).toBe(42) // position NON propagée
  })

  it('attrNode ne propage pas les attributs de LIEN', () => {
    const src = new Class_ApplicationData(false)
    const tgt = new Class_ApplicationData(false)
    const s = makePair(src)
    const t = makePair(tgt)

    s.link.shape_opacity = 0.15
    t.link.shape_opacity = 0.9

    updateFrom(tgt.drawing_area, src.drawing_area, ['attrNode'])

    expect(t.link.shape_opacity).toBe(0.9) // lien non touché par attrNode
  })
})

describe('#232 updateFrom — attrDrawingArea + échelle', () => {
  it('attrDrawingArea seul conserve l\'échelle de la cible', () => {
    const src = new Class_ApplicationData(false)
    const tgt = new Class_ApplicationData(false)
    makePair(src)
    makePair(tgt)
    src.drawing_area.scale = 5000
    tgt.drawing_area.scale = 100

    updateFrom(tgt.drawing_area, src.drawing_area, ['attrDrawingArea'])

    expect(tgt.drawing_area.scale).toBe(100)
  })

  it('attrDrawingArea + scale copie l\'échelle de la source', () => {
    const src = new Class_ApplicationData(false)
    const tgt = new Class_ApplicationData(false)
    makePair(src)
    makePair(tgt)
    src.drawing_area.scale = 5000
    tgt.drawing_area.scale = 100

    updateFrom(tgt.drawing_area, src.drawing_area, ['attrDrawingArea', 'scale'])

    expect(tgt.drawing_area.scale).toBe(5000)
  })
})

describe('#232 updateFrom — non-régression (attribut hors mode préservé)', () => {
  it('un mode inconnu / vide ne modifie ni positions ni attributs', () => {
    const src = new Class_ApplicationData(false)
    const tgt = new Class_ApplicationData(false)
    const s = makePair(src)
    const t = makePair(tgt)

    s.A.position_x = 111
    s.A.shape_opacity = 0.11
    t.A.position_x = 222
    t.A.shape_opacity = 0.88

    // Aucun mode reconnu => aucun transfert de nœud/lien.
    updateFrom(tgt.drawing_area, src.drawing_area, ['modeInexistant'])

    expect(t.A.position_x).toBe(222)
    expect(t.A.shape_opacity).toBe(0.88)
  })
})

describe('#232 updateFrom — cas limites', () => {
  it('source et cible vides : aucune exception', () => {
    const src = new Class_ApplicationData(false)
    const tgt = new Class_ApplicationData(false)
    expect(() => updateFrom(tgt.drawing_area, src.drawing_area, ['*'])).not.toThrow()
  })

  it('source vide, cible peuplée : cible inchangée sur posNode/attrNode', () => {
    const src = new Class_ApplicationData(false)
    const tgt = new Class_ApplicationData(false)
    const t = makePair(tgt)
    t.A.position_x = 321
    t.A.shape_opacity = 0.44

    updateFrom(tgt.drawing_area, src.drawing_area, ['posNode', 'attrNode'])

    expect(tgt.drawing_area.sankey.nodes_list.length).toBe(2)
    expect(t.A.position_x).toBe(321)
    expect(t.A.shape_opacity).toBe(0.44)
  })

  it('nœud présent seulement dans la source : NON ajouté sans le mode addNode', () => {
    const src = new Class_ApplicationData(false)
    const tgt = new Class_ApplicationData(false)
    makePair(src)
    src.drawing_area.sankey.addNewNode('C', 'C') // uniquement côté source
    makePair(tgt)

    updateFrom(tgt.drawing_area, src.drawing_area, ['attrNode', 'posNode'])

    expect(tgt.drawing_area.sankey.nodes_dict['C']).toBeUndefined()
  })

  it('nœud présent seulement dans la source : ajouté avec le mode addNode', () => {
    const src = new Class_ApplicationData(false)
    const tgt = new Class_ApplicationData(false)
    makePair(src)
    src.drawing_area.sankey.addNewNode('C', 'C') // uniquement côté source
    makePair(tgt)

    updateFrom(tgt.drawing_area, src.drawing_area, ['addNode'])

    expect(tgt.drawing_area.sankey.nodes_dict['C']).toBeDefined()
    expect(tgt.drawing_area.sankey.nodes_dict['C'].name).toBe('C')
  })
})
