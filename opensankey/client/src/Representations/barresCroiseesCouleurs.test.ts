// os#1511 (Julien, 14/10) — LES BARRES CROISEES PRENNENT LES COULEURS DES MEMBRES DU SANKEY.
//
// « La legende est en couleur mais pas les parties de la barre. » La figure Barres, dessinee par le
// registre comme dans l application : chaque segment porte la couleur de son membre, la meme que sa
// pastille de legende.
//
//   filiere : produits > (cereales, lait)          pays : monde > (fr, de)

import { Class_Workspace } from '../types/Workspace'
import { MAIN_ZONE_CANVAS_ID } from '../types/MenuConfig'
import type { Class_DataTag } from '../types/Tag'
import type { Class_DataTagGroup } from '../types/TagGroup'
import type { Class_LinkValue } from '../Elements/LinkValues'
import { givePlainDrawingEnvironment, sizedContainer } from '../Charts/figureDomHarness.test-utils'
import { registerAnalysisRepresentations } from './registerAnalysisRepresentations'
import { representation_registry, elementContext } from './RepresentationRegistry'
import type { Type_Presentable } from '../components/panels/presentation/openPresentation'
import { BARS_REPRESENTATION } from './couronneState'

givePlainDrawingEnvironment()

beforeEach(() => registerAnalysisRepresentations())
afterEach(() => {
  document.body.innerHTML = ''
  jest.restoreAllMocks()
})

const scene = (avec_postes = false) => {
  const ws = new Class_Workspace(false)
  const source = ws.createDocument()
  source.drawing_area.bypass_redraws = true
  const sankey = source.drawing_area.sankey
  const filiere = sankey.addDataTagGroup('filiere', 'Filiere', false) as Class_DataTagGroup
  const produits = filiere.addTag('Produits', 'produits') as Class_DataTag
  const cereales = filiere.addTag('Cereales', 'cereales') as Class_DataTag
  const lait = filiere.addTag('Lait', 'lait') as Class_DataTag
  cereales.parent = produits
  lait.parent = produits
  cereales.color = '#aa0000'
  lait.color = '#0000aa'
  filiere.levels = ['produits', 'filieres']
  const pays = sankey.addDataTagGroup('pays', 'Pays', false) as Class_DataTagGroup
  const monde = pays.addTag('Monde', 'monde') as Class_DataTag
  const fr = pays.addTag('France', 'fr') as Class_DataTag
  const de = pays.addTag('Allemagne', 'de') as Class_DataTag
  fr.parent = monde
  de.parent = monde
  fr.color = '#00aa00'
  de.color = '#ffaa00'
  pays.levels = ['monde', 'pays']
  // Les postes : deux membres, un seul porte une valeur sur ce flux (le cas de Julien, 15/10).
  const postes = avec_postes ? sankey.addDataTagGroup('poste', 'Poste', false) as Class_DataTagGroup : null
  const bilan = postes ? postes.addTag('Bilan', 'bilan') as Class_DataTag : null
  const elevage = postes ? postes.addTag('Elevage', 'elevage') as Class_DataTag : null
  const emplois = postes ? postes.addTag('Emplois', 'emplois') as Class_DataTag : null
  if (postes && bilan && elevage && emplois) {
    elevage.parent = bilan
    emplois.parent = bilan
    postes.levels = ['bilan', 'postes']
  }
  const groupes = [filiere, pays, ...(postes ? [postes] : [])]
  const lien = sankey.addNewLink(sankey.addNewNodeWithName('A'), sankey.addNewNodeWithName('B'))
  const poser = (a: Class_DataTag, b: Class_DataTag, v: number) => {
    groupes.forEach(g => g.tags_list.forEach(t => t.setUnSelected()))
    a.setSelected()
    b.setSelected()
    elevage?.setSelected()
    ;(lien.value as Class_LinkValue).valueData = v
  }
  // Le lait pese peu a cote des cereales (moins de 1 %) : en couronne, ses parts seraient trop etroites.
  poser(cereales, fr, 1000)
  poser(cereales, de, 2000)
  poser(lait, fr, 4)
  poser(lait, de, 3)
  groupes.forEach(g => g.tags_list.forEach(t => t.setUnSelected()))
  elevage?.setSelected()
  emplois?.setSelected()
  cereales.setSelected()
  lait.setSelected()
  fr.setSelected()
  de.setSelected()
  const window_id = source.menu_configuration.openMainZoneWindow({ kind: 'selection' }, MAIN_ZONE_CANVAS_ID)
  const options: { [k: string]: unknown } = {
    descriptor: {
      decompose: { kind: 'data_dimension', data_tagg_id: 'filiere', nested_tagg_ids: avec_postes ? ['pays', 'poste'] : ['pays'] },
      compare: null
    }
  }
  const ctx = { ...elementContext(source, lien as unknown as Type_Presentable), window_id, pane_key: 'p1', options }
  jest.spyOn(source.menu_configuration, 'setMainZonePaneOptions').mockImplementation(() => undefined)
  source.drawing_area.legend.legend_show_dataTags = true
  return { ctx }
}

const dessiner = (ctx: ReturnType<typeof scene>['ctx']) => {
  const el = sizedContainer(700)
  const entree = representation_registry.get(BARS_REPRESENTATION)
  if (!entree) throw new Error('les barres ne se sont pas enregistrees')
  entree.draw?.(el, ctx)
  return el
}

describe('os#1511 barres croisees : couleurs des membres', () => {
  test('chaque segment porte la couleur de son membre, meme dans une petite barre', () => {
    const { ctx } = scene()
    const el = sizedContainer(700)
    const entree = representation_registry.get(BARS_REPRESENTATION)
    if (!entree) throw new Error('les barres ne se sont pas enregistrees')
    entree.draw?.(el, ctx)
    const rects = Array.from(el.querySelectorAll('rect.sunburst_bar'))
    expect(rects.length).toBe(4)
    const fills = rects.map(r => r.getAttribute('fill'))
    expect(fills.filter(f => f === '#00aa00')).toHaveLength(2)
    expect(fills.filter(f => f === '#ffaa00')).toHaveLength(2)
  })

  test('une dimension dont un seul membre porte une valeur ne decoupe pas : elle passe en contexte', () => {
    // Julien, 15/10 : « si une dimension n a qu un membre elle n est pas active ; c est perturbant sinon ».
    const { ctx } = scene(true)
    const el = dessiner(ctx)
    const texte = el.textContent ?? ''
    // Pas de bloc de legende « Poste » avec ses cases...
    expect(texte).not.toContain('Emplois')
    // ...mais la ligne de contexte, comme l annee.
    expect(texte).toContain('Poste : Elevage')
    // Les barres restent empilees par pays.
    expect(el.querySelectorAll('rect.sunburst_bar')).toHaveLength(4)
  })
})
