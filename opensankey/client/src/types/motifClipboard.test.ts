import { Class_ApplicationData } from './ApplicationData'
import { captureMotifFromSelection, insertMotif } from './motifClipboard'
import type { Type_JSON } from './Utils'

// os#1346 — scratchpad de motifs : capture de la sélection (nœuds + flux internes) et
// réinsertion par glisser-déposer. Ce que ces tests verrouillent :
//  - la capture ne prend que les flux INTERNES à la sélection, et retire les clés
//    dangereuses (dimensions, inputLinksId/outputLinksId/links_order — ids du document
//    d'origine) ;
//  - l'insertion remappe les ids (insertion possible dans le document d'origine), recentre
//    le motif sur le point visé, préserve les attributs locaux, et s'annule proprement.

const baseJSON = (): Type_JSON => ({
  version: '1.1.4',
  format_version: 3,
  node_pos_is_center: true,
  nodes: {
    A: { x: 100, y: 100, name: 'Alpha', local: { shape_color: '#ff0000' } },
    B: { x: 300, y: 200, name: 'Beta' },
    C: { x: 500, y: 100, name: 'Gamma' }
  },
  links: {
    'A---B': { idSource: 'A', idTarget: 'B' },
    'B---C': { idSource: 'B', idTarget: 'C' }
  },
  width: 1000,
  height: 800,
  user_scale: 100
} as unknown as Type_JSON)

const loadApp = (): Class_ApplicationData => {
  const app = new Class_ApplicationData(false)
  app.fromJSON(JSON.parse(JSON.stringify(baseJSON())) as never, {}, false)
  return app
}

const selectNodes = (app: Class_ApplicationData, ids: string[]) => {
  const da = app.drawing_area
  da.purgeSelection()
  ids.forEach(id => da.addElementToSelection(da.sankey.nodes_dict[id]))
}

describe('os#1346 — capture d\'un motif depuis la sélection', () => {
  it('sélection vide -> pas de motif', () => {
    const app = loadApp()
    expect(captureMotifFromSelection(app.drawing_area)).toBeNull()
  })

  it('capture les nœuds sélectionnés et les seuls flux internes', () => {
    const app = loadApp()
    selectNodes(app, ['A', 'B'])
    const motif = captureMotifFromSelection(app.drawing_area)
    expect(motif).not.toBeNull()
    expect(Object.keys(motif!.nodes).sort()).toEqual(['A', 'B'])
    // B---C sort de la sélection : exclu.
    expect(Object.keys(motif!.links)).toEqual(['A---B'])
    expect(motif!.name).toBe('Alpha +1')
  })

  it('retire les clés de liens et de dimensions du JSON de nœud', () => {
    const app = loadApp()
    selectNodes(app, ['A', 'B'])
    const motif = captureMotifFromSelection(app.drawing_area)!
    Object.values(motif.nodes).forEach(node_json => {
      expect(node_json['inputLinksId']).toBeUndefined()
      expect(node_json['outputLinksId']).toBeUndefined()
      expect(node_json['links_order']).toBeUndefined()
      expect(node_json['dimensions']).toBeUndefined()
    })
    // Les attributs locaux, eux, restent.
    expect((motif.nodes['A']['local'] as Type_JSON)['shape_color']).toBe('#ff0000')
  })
})

describe('os#1346 — insertion d\'un motif', () => {
  it('insère dans le document d\'origine avec des ids remappés, centré au point visé', () => {
    const app = loadApp()
    const da = app.drawing_area
    selectNodes(app, ['A', 'B'])
    const motif = captureMotifFromSelection(da)!

    const inserted = insertMotif(da, motif, 500, 400)
    expect(inserted).toBe(true)
    expect(da.sankey.nodes_list.length).toBe(5)
    expect(da.sankey.links_list.length).toBe(3)

    // Ids d'origine occupés -> suffixe _m1, sans muter le nom.
    const a2 = da.sankey.nodes_dict['A_m1']
    const b2 = da.sankey.nodes_dict['B_m1']
    expect(a2).toBeDefined()
    expect(b2).toBeDefined()
    expect(a2.name).toBe('Alpha')

    // Centres du motif d'origine : A(100,100), B(300,200) -> centre bbox (200,150).
    // Visé (500,400) -> décalage (+300,+250) : A_m1 (400,350), B_m1 (600,450).
    const dump = app.toJSON() as Type_JSON
    const nodes_dump = dump['nodes'] as Type_JSON
    expect((nodes_dump['A_m1'] as Type_JSON)['x']).toBeCloseTo(400)
    expect((nodes_dump['A_m1'] as Type_JSON)['y']).toBeCloseTo(350)
    expect((nodes_dump['B_m1'] as Type_JSON)['x']).toBeCloseTo(600)
    expect((nodes_dump['B_m1'] as Type_JSON)['y']).toBeCloseTo(450)

    // Attribut local préservé sur la copie.
    expect(((nodes_dump['A_m1'] as Type_JSON)['local'] as Type_JSON)['shape_color']).toBe('#ff0000')

    // Le flux recréé relie les copies (pas les originaux).
    const new_link = da.sankey.links_list.find(l => l.source.id === 'A_m1')
    expect(new_link).toBeDefined()
    expect(new_link!.target.id).toBe('B_m1')

    // La sélection porte les éléments créés.
    expect(da.selected_nodes_list.map(n => n.id).sort()).toEqual(['A_m1', 'B_m1'])
  })

  it('l\'insertion est annulable (les copies disparaissent, les originaux restent)', () => {
    const app = loadApp()
    const da = app.drawing_area
    selectNodes(app, ['A', 'B'])
    const motif = captureMotifFromSelection(da)!
    insertMotif(da, motif, 500, 400)
    expect(da.sankey.nodes_list.length).toBe(5)

    app.history.applyUndo()
    expect(da.sankey.nodes_list.length).toBe(3)
    expect(da.sankey.links_list.length).toBe(2)
    expect(da.sankey.nodes_dict['A']).toBeDefined()
    expect(da.sankey.nodes_dict['A_m1']).toBeUndefined()
  })

  it('un motif vide est refusé', () => {
    const app = loadApp()
    expect(insertMotif(app.drawing_area, { name: 'vide', nodes: {}, links: {} }, 0, 0)).toBe(false)
  })
})
