import { Class_ApplicationData } from '../types/ApplicationData'
import type { Class_DataTag } from '../types/Tag'
import type { Class_DataTagGroup } from '../types/TagGroup'
import type { Class_LinkValue } from '../Elements/LinkValues'
import { disaggregateDimensionNodes, isGeneratedMemberLink } from './DimensionDisaggregation'

// jest 27 / jsdom n'expose pas structuredClone (utilise par Link.copyFrom)
if (typeof globalThis.structuredClone !== 'function') {
  globalThis.structuredClone = <T>(o: T): T => JSON.parse(JSON.stringify(o)) as T
}

// os#1511 — UNE CHAINE DE NOEUDS SUR LA MEME DIMENSION SE SUIT, ELLE NE SE CROISE PAS.
//
// CARTOFOB (30/09/2026) : chaque etape de la filiere (Prelevements, Scieries, Sciages...) se
// decline par essence. Rattachees toutes a la dimension « Essence », deux etapes consecutives
// doivent se relier chene -> chene, hetre -> hetre ; le croisement fabriquait aussi chene -> hetre.

function choisir(groupe: Class_DataTagGroup, ...membres: Class_DataTag[]) {
  groupe.tags_list.forEach(t => t.setUnSelected())
  membres.forEach(m => m.setSelected())
}

function monter() {
  const app = new Class_ApplicationData(false)
  const sankey = app.drawing_area.sankey
  const essence = sankey.addDataTagGroup('essence', 'Essence', false) as unknown as Class_DataTagGroup
  const toutes = essence.addTag('Toutes essences', 'toutes') as Class_DataTag
  const chene = essence.addTag('Chene', 'chene') as Class_DataTag
  const hetre = essence.addTag('Hetre', 'hetre') as Class_DataTag
  chene.parent = toutes
  hetre.parent = toutes
  essence.levels = ['toutes', 'essence']

  const prelevements = sankey.addNewNodeWithName('Prelevements')
  const scieries = sankey.addNewNodeWithName('Scieries')
  const merrains = sankey.addNewNodeWithName('Merrains')
  const amont = sankey.addNewLink(prelevements, scieries)
  const aval = sankey.addNewLink(scieries, merrains)
  prelevements.driving_dimension = essence
  scieries.driving_dimension = essence

  const poser = (flux: typeof amont, membre: Class_DataTag, nombre: number) => {
    choisir(essence, membre)
    ;(flux.value as Class_LinkValue).valueData = nombre
  }
  poser(amont, chene, 30)
  poser(amont, hetre, 12)
  poser(aval, chene, 5)
  poser(aval, hetre, 2)
  choisir(essence, chene, hetre)
  return { sankey }
}

test('deux noeuds sur la meme dimension se relient membre a membre, sans croisement', () => {
  const { sankey } = monter()
  disaggregateDimensionNodes(sankey)
  const engendres = sankey.links_list.filter(isGeneratedMemberLink)
    .map(l => `${l.source.name} -> ${l.target.name} = ${l.value?.valueData}`)
    .sort()
  // Plusieurs axes portent la meme dimension : le nom du membre seul ne dirait plus l etape.
  expect(engendres).toEqual([
    'Prelevements - Chene -> Scieries - Chene = 30',
    'Prelevements - Hetre -> Scieries - Hetre = 12',
    'Scieries - Chene -> Merrains = 5',
    'Scieries - Hetre -> Merrains = 2',
  ])
})
