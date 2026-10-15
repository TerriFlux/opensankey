import * as fs from 'fs'
import * as path from 'path'
import * as zlib from 'zlib'
import { Class_ApplicationData } from './ApplicationData'
import type { Class_DataTagGroup } from './TagGroup'
import { applyDimensionLevel, applyReaderToggle } from '../components/ui/dimensionDrawingHost'

// jest 27 / jsdom n'expose pas structuredClone (utilise par Link.copyFrom)
if (typeof globalThis.structuredClone !== 'function') {
  globalThis.structuredClone = <T>(o: T): T => JSON.parse(JSON.stringify(o)) as T
}

// os#1511 — banc des gestes du lecteur sur les diagrammes publies du SOCLE (Julien, 14/10 : « il
// faut que ce soit rapide »). Pour chaque .json.gz du dossier SOCLE_BENCH : chargement, premier
// dessin, chaque niveau de chaque dimension hierarchisee, chaque case « Distinguer… ».

const DOSSIER = process.env.SOCLE_BENCH
const fichiers = DOSSIER !== undefined && fs.existsSync(DOSSIER)
  ? fs.readdirSync(DOSSIER).filter(f => f.endsWith('.json.gz')).map(f => path.join(DOSSIER, f))
  : []
const maybe = fichiers.length > 0 ? describe : describe.skip

const chrono = <T>(nom: string, fn: () => T): T => {
  const t0 = Date.now()
  const r = fn()
  // eslint-disable-next-line no-console
  console.log(`  ${nom} : ${((Date.now() - t0) / 1000).toFixed(2)} s`)
  return r
}

maybe('os#1511 — chrono des gestes du lecteur sur le SOCLE', () => {
  // Sans SOCLE_BENCH (la CI), le describe serait vide : jest 27 rejette une suite sans test.
  if (fichiers.length === 0) test('SOCLE_BENCH absent, banc non lance', () => undefined)
  fichiers.forEach(fichier => {
    test(path.basename(fichier), () => {
      // eslint-disable-next-line no-console
      console.log(`== ${path.basename(fichier)}`)
      const json = JSON.parse(zlib.gunzipSync(fs.readFileSync(fichier)).toString('utf-8'))
      const app = new Class_ApplicationData(false)
      chrono('fromJSON', () => app.fromJSON(json))
      chrono('premier dessin', () => app.drawing_area.draw())
      const taggs = app.drawing_area.sankey.data_taggs_list as Class_DataTagGroup[]
      taggs.forEach(tagg => {
        if (tagg.reader_control?.kind === 'toggle') {
          chrono(`${tagg.name} : distinguer`, () => applyReaderToggle(app, tagg, true))
          chrono(`${tagg.name} : ne plus distinguer`, () => applyReaderToggle(app, tagg, false))
          return
        }
        if (tagg.levels.length < 2) return
        const depart = tagg.current_level_index
        for (let niveau = 0; niveau < tagg.levels.length; niveau++) {
          if (niveau === depart || tagg.membersAtLevel(niveau).length === 0) continue
          chrono(`${tagg.name} : niveau ${niveau}`, () => applyDimensionLevel(app, tagg, niveau))
        }
        chrono(`${tagg.name} : retour au niveau ${depart}`, () => applyDimensionLevel(app, tagg, depart))
      })
      expect(app.drawing_area.sankey.nodes_list.length).toBeGreaterThan(0)
    }, 1800000)
  })
})
