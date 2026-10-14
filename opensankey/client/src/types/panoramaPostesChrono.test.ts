import * as fs from 'fs'
import * as zlib from 'zlib'
import { Class_ApplicationData } from './ApplicationData'
import type { Class_DataTagGroup } from './TagGroup'
import { applyDimensionLevel } from '../components/ui/dimensionDrawingHost'

// jest 27 / jsdom n'expose pas structuredClone (utilise par Link.copyFrom)
if (typeof globalThis.structuredClone !== 'function') {
  globalThis.structuredClone = <T>(o: T): T => JSON.parse(JSON.stringify(o)) as T
}

// os#1511 — banc du panorama de l agriculture (Julien, 14/10 : « il faut que ce soit rapide ») :
// passer Ressources et emplois au niveau Postes bloquait 47 s sur la page publiee. Pilote par PANORAMA.

const FICHIER = process.env.PANORAMA
const maybe = FICHIER !== undefined && fs.existsSync(FICHIER) ? describe : describe.skip

const chrono = <T>(nom: string, fn: () => T): T => {
  const t0 = Date.now()
  const r = fn()
  // eslint-disable-next-line no-console
  console.log(`  ${nom} : ${((Date.now() - t0) / 1000).toFixed(2)} s`)
  return r
}

maybe('os#1511 — chrono du panorama au niveau Postes', () => {
  test('chargement puis niveau Postes', () => {
    const json = JSON.parse(zlib.gunzipSync(fs.readFileSync(FICHIER as string)).toString('utf-8'))
    const app = new Class_ApplicationData(false)
    chrono('fromJSON', () => app.fromJSON(json))
    chrono('premier dessin', () => app.drawing_area.draw())
    const sankey = app.drawing_area.sankey
    const tagg = (sankey.data_taggs_list as Class_DataTagGroup[]).find(t => t.name.startsWith('Ressources'))
    expect(tagg).toBeDefined()
    const groupe = tagg as Class_DataTagGroup
    const niveau = [1, 2, 3].find(i => groupe.membersAtLevel(i).some(m => m.name.startsWith('Production'))) ?? 1
    chrono(`niveau ${niveau} (Postes)`, () => applyDimensionLevel(app, groupe, niveau))
    // eslint-disable-next-line no-console
    console.log(`  flux : ${sankey.links_list.length}`)
    chrono('retour au niveau 0', () => applyDimensionLevel(app, groupe, 0))
  }, 900000)
})
