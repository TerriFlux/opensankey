import * as fs from 'fs'
import * as zlib from 'zlib'
import { Class_ApplicationData } from './ApplicationData'
import type { Class_DataTagGroup } from './TagGroup'
import { isGeneratedMemberNode } from '../Algorithms/DimensionDisaggregation'

// jest 27 / jsdom n'expose pas structuredClone (utilise par Link.copyFrom)
if (typeof globalThis.structuredClone !== 'function') {
  globalThis.structuredClone = <T>(o: T): T => JSON.parse(JSON.stringify(o)) as T
}

// os#1511 — CE QUE LE FICHIER DE DEMONSTRATION MONTRE, membre par membre. Julien veut
// comprendre l interface ; decrire de memoire ce qu elle fait serait le meilleur moyen de lui
// faire cliquer a cote. Pilote par DIMENSION_DEMO_OUT.

const FICHIER = process.env.DIMENSION_DEMO_OUT
const maybe = FICHIER !== undefined && fs.existsSync(FICHIER) ? describe : describe.skip

maybe('os#1511 — ce que la demo montre a chaque membre choisi', () => {
  test('parcours des membres de la dimension attachee', () => {
    const json = JSON.parse(zlib.gunzipSync(fs.readFileSync(FICHIER as string)).toString('utf-8'))
    const app = new Class_ApplicationData(false)
    app.fromJSON(json)
    const sankey = app.drawing_area.sankey

    // eslint-disable-next-line no-console
    console.log('dimensions : ' + sankey.data_taggs_list
      .map(d => `${d.name} (banner=${d.banner}, ${(d as unknown as Class_DataTagGroup).levels.length} niveaux)`)
      .join(' | '))
    const attaches = sankey.nodes_list.filter(n => n.is_driven_by_dimension)
    // eslint-disable-next-line no-console
    console.log('noeuds attaches : ' + attaches.map(n => `${n.name} -> ${n.driving_dimension?.name}`).join(', '))

    const pays = sankey.data_taggs_dict['pays'] as unknown as Class_DataTagGroup
    pays.tags_list.forEach(membre => {
      pays.tags_list.forEach(t => t.setUnSelected())
      membre.setSelected()
      app.drawing_area.rebuildDimensionNodes()
      const montres = sankey.nodes_list.filter(isGeneratedMemberNode).map(n => n.name).sort()
      const valeurs = sankey.links_list
        .filter(l => l.is_visible)
        .map(l => `${l.target.name}=${l.valueCurrent ?? '-'}`)
      // eslint-disable-next-line no-console
      console.log(`  choisir « ${membre.name} » -> ${montres.join(', ') || '(aucun)'}`
        + `   [${valeurs.join(' ')}]`)
    })
    expect(sankey.nodes_list.length).toBeGreaterThan(0)
  }, 300000)
})

maybe('os#1511 — une dimension en bandes pendant que l autre pilote des noeuds', () => {
  test('la configuration exacte de Julien : Filiere en multi, Pays attache', () => {
    const json = JSON.parse(zlib.gunzipSync(fs.readFileSync(FICHIER as string)).toString('utf-8'))
    const app = new Class_ApplicationData(false)
    app.fromJSON(json)
    const sankey = app.drawing_area.sankey

    const filiere = sankey.data_taggs_dict['filiere'] as unknown as Class_DataTagGroup
    const pays = sankey.data_taggs_dict['pays'] as unknown as Class_DataTagGroup
    filiere.banner = 'multi'
    filiere.selectAllAtLevel(1)   // « filieres » : Cereales et Oleagineux
    pays.selectAllAtLevel(0)      // « Monde »
    app.drawing_area.rebuildDimensionNodes()

    const engendres = sankey.links_list.filter(l => l.is_visible && l.id.includes('--par--'))
    // eslint-disable-next-line no-console
    console.log('  flux dessines : ' + engendres.map(l => `${l.target.name}=${l.valueCurrent}`).join(' '))
    expect(engendres.length).toBe(1)
    // Le flux existe et porte le total des DEUX filieres cochees.
    expect(engendres[0].valueCurrent).toBe(1385)

    const bandes = engendres[0].tagged_value_bands
    // eslint-disable-next-line no-console
    console.log('  bandes : ' + bandes.map(b => `${b.id}=${b.value}`).join(' '))
    expect(bandes.map(b => b.id).sort()).toEqual(['cereales', 'oleagineux'])
    expect(bandes.reduce((t, b) => t + b.value, 0)).toBe(1385)
  }, 300000)
})
