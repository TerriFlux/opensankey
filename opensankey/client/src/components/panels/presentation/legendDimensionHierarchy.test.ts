import { Class_ApplicationData } from '../../../types/ApplicationData'
import type { Class_DataTag } from '../../../types/Tag'
import type { Class_DataTagGroup } from '../../../types/TagGroup'
import { chooseLegendDimensionTag } from './legendDimensionChoice'

// jest 27 / jsdom n'expose pas structuredClone (utilise par Link.copyFrom)
if (typeof globalThis.structuredClone !== 'function') {
  globalThis.structuredClone = <T>(o: T): T => JSON.parse(JSON.stringify(o)) as T
}

// os#1526 — dans la legende, un membre d une dimension a niveaux se CHOISIT dans le diagramme, par
// le meme geste que le tableau et la barre du haut (regle parent/enfant, historique).

function monter(banner: 'one' | 'multi') {
  const app = new Class_ApplicationData(false)
  const sankey = app.drawing_area.sankey
  const dim = sankey.addDataTagGroup('pays', 'Pays', false) as unknown as Class_DataTagGroup
  const monde = dim.addTag('Monde', 'monde') as Class_DataTag
  const europe = dim.addTag('Europe', 'europe') as Class_DataTag
  const afrique = dim.addTag('Afrique', 'afrique') as Class_DataTag
  const france = dim.addTag('France', 'france') as Class_DataTag
  europe.parent = monde
  afrique.parent = monde
  france.parent = europe
  dim.levels = ['monde', 'regions', 'pays']
  ;(dim as unknown as { banner: string }).banner = banner
  dim.selectMembers(['europe', 'afrique'])
  return { app, dim }
}

const choisis = (dim: Class_DataTagGroup) => dim.selected_tags_list.map(m => m.id).sort()

describe('os#1526 — choisir un membre de dimension depuis la legende', () => {
  test('plusieurs : le membre entre et son ancetre tombe', () => {
    const { app, dim } = monter('multi')
    chooseLegendDimensionTag(app, dim, 'france')
    expect(choisis(dim)).toEqual(['afrique', 'france'])
  })

  test('plusieurs : un membre choisi en sort, jamais le dernier', () => {
    const { app, dim } = monter('multi')
    chooseLegendDimensionTag(app, dim, 'afrique')
    expect(choisis(dim)).toEqual(['europe'])
    chooseLegendDimensionTag(app, dim, 'europe')
    expect(choisis(dim)).toEqual(['europe'])
  })

  test('un membre : il remplace la selection', () => {
    const { app, dim } = monter('one')
    chooseLegendDimensionTag(app, dim, 'france')
    expect(choisis(dim)).toEqual(['france'])
  })

  test('le geste s annule', () => {
    const { app, dim } = monter('multi')
    chooseLegendDimensionTag(app, dim, 'france')
    app.history.applyUndo()
    expect(choisis(dim)).toEqual(['afrique', 'europe'])
  })
})
