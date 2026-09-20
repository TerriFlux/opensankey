// os#1446 — TOUCHER UNE PART OUVRE L INSPECTEUR D ELEMENT.
//
// Demande de Julien : « figure = graphe, et les trois autres parties devraient etre dans forme /
// libelle / valeur de l element selectionne (la part de la couronne) ».
//
// CE FICHIER NE TESTE PAS LE CLIC, il teste LA CHAINE QUE L INSPECTEUR LIT. Le clic d3 sur un arc
// n est pas jouable ici — jsdom ne met rien en page et le trace n a pas de test de rendu — mais ce
// n est pas la ou est le risque : le geste n a qu une ligne. Ce qui pouvait etre faux est la
// chaine, et elle a trois maillons dont chacun peut casser en silence :
//
//   la vignette est liee a son document de parts  ->  ce document devient l ACTIF
//   une part est selectionnee dans SA zone        ->  l inspecteur voit un element selectionne
//   la vignette est deliee au demontage           ->  l actif repart sur la voie ordinaire
//
// Sans le premier, l inspecteur parlerait du diagramme pendant qu on regle une couronne. Sans le
// dernier, il continuerait de parler d une couronne demontee.

import { Class_Workspace } from '../../types/Workspace'
import { MAIN_ZONE_CANVAS_ID } from '../../types/MenuConfig'
import { buildParts } from './buildParts'
import type { Type_PartInput } from './buildParts'

if (typeof globalThis.structuredClone !== 'function') {
  globalThis.structuredClone = <T>(o: T): T => JSON.parse(JSON.stringify(o)) as T
}

const inputs = (): Type_PartInput[] => [
  { id: 'a', label: 'A', value: 3, subject: { kind: 'node', node: { id: 'n_a', name: 'A' } } },
  { id: 'b', label: 'B', value: 7, subject: { kind: 'tag', tag: { id: 't_b', name: 'B' } } },
  { id: 'a__residual__', label: 'Reste', value: 1 }
]

/** Une couronne dans une vignette : un document, une fenetre, ses parts. */
const buildScene = () => {
  const ws = new Class_Workspace(false)
  const source = ws.createDocument()
  source.drawing_area.bypass_redraws = true
  const mc = source.menu_configuration
  const window_id = mc.openMainZoneWindow({ kind: 'selection' }, MAIN_ZONE_CANVAS_ID)
  const parts = buildParts(source, inputs())
  return { ws, source, mc, window_id, parts }
}

/** Ce que fait le rappel de selection du trace, sans le clic d3. */
const touchPart = (
  parts: ReturnType<typeof buildParts>, sector_id: string
) => {
  const part = parts.by_id[sector_id]
  const area = parts.document.drawing_area
  area.purgeSelection()
  area.addElementToSelection(part)
}

describe('os#1446 la couronne devient le document que linspecteur regarde', () => {

  it('lier la vignette a ses parts rend ce document ACTIF', () => {
    const { ws, source, window_id, parts } = buildScene()
    expect(ws.active).toBe(source)

    ws.bindWindowDocument(window_id, 'p1', parts.document)

    expect(ws.active).toBe(parts.document)
  })

  it('delier au demontage rend lactif a la voie ordinaire', () => {
    // Sans cela, l inspecteur continuerait de parler d une couronne qui n est plus a l ecran.
    const { ws, source, window_id, parts } = buildScene()
    ws.bindWindowDocument(window_id, 'p1', parts.document)

    ws.unbindWindowDocument(window_id, 'p1')

    expect(ws.active).toBe(source)
  })

  it('toucher une part la met dans la selection du document ACTIF', () => {
    // LE MAILLON QUI COMPTE : l inspecteur lit la selection de l actif. Si la part n y est pas,
    // il montre les reglages de la figure et le geste n a servi a rien.
    const { ws, window_id, parts } = buildScene()
    ws.bindWindowDocument(window_id, 'p1', parts.document)

    touchPart(parts, 'a')

    // `selected_elements_list` et NON `selected_nodes_list` : une part n est pas un noeud, c est
    // le frere des noeuds et des flux sous Class_BaseShape. L accesseur generique est le seul qui
    // dise la verite — et c est aussi celui que l inspecteur devra apprendre a lire.
    const selection = ws.active!.drawing_area.selected_elements_list
    expect(selection.length).toBe(1)
    expect(selection[0]).toBe(parts.by_id['a'])
  })

  it('une couronne se lit un secteur a la fois : la selection est PURGEE', () => {
    const { ws, window_id, parts } = buildScene()
    ws.bindWindowDocument(window_id, 'p1', parts.document)

    touchPart(parts, 'a')
    touchPart(parts, 'b')

    const selection = ws.active!.drawing_area.selected_elements_list
    expect(selection.length).toBe(1)
    expect(selection[0]).toBe(parts.by_id['b'])
  })

  it('le secteur RESIDUEL se selectionne aussi', () => {
    // Il n a pas de sujet, mais il a une figure — et c est elle qu on regle. Refuser de le
    // selectionner laisserait un secteur visible et inaccessible.
    const { ws, window_id, parts } = buildScene()
    ws.bindWindowDocument(window_id, 'p1', parts.document)

    touchPart(parts, 'a__residual__')

    expect(ws.active!.drawing_area.selected_elements_list[0]).toBe(parts.by_id['a__residual__'])
    expect(parts.by_id['a__residual__'].subject.kind).toBe('none')
  })

  it('le diagramme SOURCE ne voit passer aucune selection', () => {
    // La part est selectionnee chez ELLE. Selectionner un secteur ne doit pas selectionner le
    // noeud sur le Sankey : ce sont deux gestes, et deux inspecteurs.
    const { ws, source, window_id, parts } = buildScene()
    ws.bindWindowDocument(window_id, 'p1', parts.document)

    touchPart(parts, 'a')

    expect(source.drawing_area.selected_elements_list.length).toBe(0)
  })
})
