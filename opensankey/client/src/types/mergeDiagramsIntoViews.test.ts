// Tests de `buildMultiViewDocument` sur donnees synthetiques : garanties de FORME du
// document fusionne, independamment de tout corpus. Le harnais de fidelite sur donnees
// reelles (etude Filiere Dechet Pays Voironnais) vit cote OSP, ou reside le chargeur
// complet.
import { buildMultiViewDocument } from './mergeDiagramsIntoViews'
import { decodeViewsFromDelta, DELETED_KEY, PATCH_KEY } from './viewDelta'
import { MASTER_VIEW_ID } from './ViewsQuery'
import type { Type_JSON } from './Utils'

const deepClone = <T>(o: T): T => JSON.parse(JSON.stringify(o)) as T

/** Diagramme synthetique minimal, assez riche pour exercer le diff structurel. */
const mkDiagram = (x: number, color: string): Type_JSON => ({
  id: 'sankey',
  name: 'diagramme',
  version: '1.2.1',
  format_version: 3,
  nodes: {
    n1: { idNode: 'n1', name: 'Noeud 1', position_x: x, position_y: 10, color },
    n2: { idNode: 'n2', name: 'Noeud 2', position_x: 200, position_y: 50, color: '#000000' },
  },
  links: {
    'n1---n2': { idLink: 'n1---n2', idSource: 'n1', idTarget: 'n2', value: { 0: { value: 42 } } },
  },
  labels: {},
})

describe('buildMultiViewDocument — forme du document fusionne', () => {
  it('produit une entree de views par specification, avec id et nom surcharges', () => {
    const master = mkDiagram(100, '#ff0000')
    const doc = buildMultiViewDocument(master, [
      { id: 'v_a', name: 'Vue A', snapshot: mkDiagram(100, '#ff0000') },
      { id: 'v_b', name: 'Vue B', snapshot: mkDiagram(340, '#00ff00') },
    ])
    decodeViewsFromDelta(doc)
    const views = doc['views'] as { [id: string]: Type_JSON }

    expect(Object.keys(views)).toEqual(['v_a', 'v_b'])
    expect(views['v_a']['id']).toBe('v_a')
    expect(views['v_a']['name']).toBe('Vue A')
    expect(views['v_b']['id']).toBe('v_b')
    expect(views['v_b']['name']).toBe('Vue B')
  })

  it('chaque vue decodee restitue EXACTEMENT son diagramme source', () => {
    const snap_a = mkDiagram(100, '#ff0000')
    const snap_b = mkDiagram(340, '#00ff00')
    const doc = buildMultiViewDocument(mkDiagram(100, '#ff0000'), [
      { id: 'v_a', name: 'Vue A', snapshot: deepClone(snap_a) },
      { id: 'v_b', name: 'Vue B', snapshot: deepClone(snap_b) },
    ])
    decodeViewsFromDelta(doc)
    const views = doc['views'] as { [id: string]: Type_JSON }

    // Le seul ecart tolere par rapport a la source est le couple id/nom, pose a dessein.
    expect(views['v_a']).toEqual({ ...snap_a, id: 'v_a', name: 'Vue A' })
    expect(views['v_b']).toEqual({ ...snap_b, id: 'v_b', name: 'Vue B' })
  })

  it('encode bien en delta la vue qui differe du maitre', () => {
    const doc = buildMultiViewDocument(mkDiagram(100, '#ff0000'), [
      { id: 'v_b', name: 'Vue B', snapshot: mkDiagram(340, '#00ff00') },
    ])
    const raw = (doc['views'] as { [id: string]: Type_JSON })['v_b']
    expect(Object.prototype.hasOwnProperty.call(raw, PATCH_KEY)).toBe(true)
    // Le patch ne porte que la difference reelle, pas tout le diagramme : le noeud
    // deplace et recolore, le couple id/nom, et le retrait des cles de pilotage qui
    // sont RACINE seulement (elles font partie de la base mais pas de la vue).
    const patch = raw[PATCH_KEY] as Type_JSON
    expect(Object.keys(patch).sort()).toEqual([DELETED_KEY, 'id', 'name', 'nodes'])
    expect(patch[DELETED_KEY]).toEqual(
      expect.arrayContaining(['current_view', 'show_master_in_views', 'master_view_name'])
    )
    expect(Object.keys(patch['nodes'] as Type_JSON)).toEqual(['n1'])
  })

  it('pose les cles racine AVANT le codage delta, donc aucune vue en herite', () => {
    const doc = buildMultiViewDocument(mkDiagram(100, '#ff0000'), [
      { id: 'v_a', name: 'Vue A', snapshot: mkDiagram(100, '#ff0000') },
    ])
    decodeViewsFromDelta(doc)
    const view = (doc['views'] as { [id: string]: Type_JSON })['v_a']
    // Symetrie de cle racine : les cles de pilotage des vues restent a la racine seule.
    expect('views' in view).toBe(false)
    expect('current_view' in view).toBe(false)
    expect('show_master_in_views' in view).toBe(false)
    expect('master_view_name' in view).toBe(false)
  })

  it('pilote la vue active, le maitre affiche et son nom', () => {
    const doc = buildMultiViewDocument(mkDiagram(100, '#ff0000'), [
      { id: 'v_a', name: 'Vue A', snapshot: mkDiagram(100, '#ff0000') },
      { id: 'v_b', name: 'Vue B', snapshot: mkDiagram(340, '#00ff00') },
    ], { current_view: 'v_b', show_master_in_views: true, master_view_name: 'Reference' })

    expect(doc['current_view']).toBe('v_b')
    expect(doc['show_master_in_views']).toBe(true)
    expect(doc['master_view_name']).toBe('Reference')
  })

  it('active la premiere vue par defaut et masque le maitre', () => {
    const doc = buildMultiViewDocument(mkDiagram(100, '#ff0000'), [
      { id: 'v_a', name: 'Vue A', snapshot: mkDiagram(100, '#ff0000') },
      { id: 'v_b', name: 'Vue B', snapshot: mkDiagram(340, '#00ff00') },
    ])
    expect(doc['current_view']).toBe('v_a')
    expect(doc['show_master_in_views']).toBe(false)
  })

  it('ne mute jamais les entrees fournies', () => {
    const master = mkDiagram(100, '#ff0000')
    const snapshot = mkDiagram(340, '#00ff00')
    const master_before = deepClone(master)
    const snapshot_before = deepClone(snapshot)

    buildMultiViewDocument(master, [{ id: 'v_b', name: 'Vue B', snapshot }])

    expect(master).toEqual(master_before)
    expect(snapshot).toEqual(snapshot_before)
  })

  it('rejette les identifiants vides, dupliques ou reserves au maitre', () => {
    const master = mkDiagram(100, '#ff0000')
    const spec = (id: string) => ({ id, name: 'x', snapshot: mkDiagram(100, '#ff0000') })

    expect(() => buildMultiViewDocument(master, [])).toThrow(/aucune vue/)
    expect(() => buildMultiViewDocument(master, [spec('')])).toThrow(/vide/)
    expect(() => buildMultiViewDocument(master, [spec(MASTER_VIEW_ID)])).toThrow(/reserve/)
    expect(() => buildMultiViewDocument(master, [spec('v_a'), spec('v_a')])).toThrow(/duplique/)
  })

  it('ignore une cle views parasite portee par le maitre ou par un snapshot', () => {
    const master = { ...mkDiagram(100, '#ff0000'), views: { parasite: { name: 'x' } } }
    const snapshot = { ...mkDiagram(340, '#00ff00'), views: { parasite: { name: 'y' } } }
    const doc = buildMultiViewDocument(master as Type_JSON, [
      { id: 'v_b', name: 'Vue B', snapshot: snapshot as Type_JSON },
    ])
    decodeViewsFromDelta(doc)
    const views = doc['views'] as { [id: string]: Type_JSON }

    expect(Object.keys(views)).toEqual(['v_b'])
    expect('views' in views['v_b']).toBe(false)
  })
})
