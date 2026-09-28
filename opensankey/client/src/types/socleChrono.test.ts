import * as fs from 'fs'
import * as zlib from 'zlib'
import { Class_ApplicationData } from './ApplicationData'
import { disaggregateDimensionNodes, removeGeneratedMemberNodes } from '../Algorithms/DimensionDisaggregation'

// jest 27 / jsdom n'expose pas structuredClone (utilise par Link.copyFrom)
if (typeof globalThis.structuredClone !== 'function') {
  globalThis.structuredClone = <T>(o: T): T => JSON.parse(JSON.stringify(o)) as T
}

// os#1511 — OU PASSE LE TEMPS sur le SOCLE ramene a deux flux. Julien : « c est long, ca n a pas
// l air d y arriver ». Avant de supposer quoi que ce soit, on chronometre les trois etapes :
// lecture du JSON, construction du modele, desagregation. Pilote par SOCLE_OUT.

const FICHIER = process.env.SOCLE_OUT
const maybe = FICHIER !== undefined && fs.existsSync(FICHIER) ? describe : describe.skip

const chrono = <T>(nom: string, fn: () => T): T => {
  const t0 = Date.now()
  const r = fn()
  // eslint-disable-next-line no-console
  console.log(`  ${nom} : ${((Date.now() - t0) / 1000).toFixed(2)} s`)
  return r
}

maybe('os#1511 — chrono du SOCLE a deux flux', () => {
  test('lecture, construction, desagregation', () => {
    const brut = chrono('lecture du .gz', () =>
      zlib.gunzipSync(fs.readFileSync(FICHIER as string)).toString('utf-8'))
    const json = chrono('JSON.parse', () => JSON.parse(brut))
    // eslint-disable-next-line no-console
    console.log(`  taille JSON : ${(brut.length / 1e6).toFixed(1)} Mo`)

    // On charge D ABORD sans l attachement : cela isole le cout du modele de celui de la
    // desagregation, qui cree un flux par membre — et un flux neuf porte un cube complet.
    const sans_axe = JSON.parse(brut)
    Object.values(sans_axe.nodes as { [id: string]: Record<string, unknown> })
      .forEach(n => { delete n['driving_dimension'] })
    const temoin = new Class_ApplicationData(false)
    chrono('fromJSON SANS attachement', () => temoin.fromJSON(sans_axe))
    // eslint-disable-next-line no-console
    console.log(`  tas apres : ${(process.memoryUsage().heapUsed / 1e6).toFixed(0)} Mo`)

    const app = new Class_ApplicationData(false)
    chrono('fromJSON (modele + afterFromJSON)', () => app.fromJSON(json))
    const sankey = app.drawing_area.sankey
    // eslint-disable-next-line no-console
    console.log(`  noeuds : ${sankey.nodes_list.length}   flux : ${sankey.links_list.length}`)

    // On coupe la desagregation en deux : le RETRAIT des engendres du tour precedent, puis la
    // generation. Deux hypotheses sur l origine des 33 s se sont revelees fausses ; on mesure.
    chrono('  a. retrait des engendres', () => removeGeneratedMemberNodes(sankey))
    const engendres = chrono('  b. generation', () => disaggregateDimensionNodes(sankey))
    // eslint-disable-next-line no-console
    console.log(`  noeuds engendres : ${engendres}   flux : ${sankey.links_list.length}`)

    chrono('toJSON', () => app.toJSON())
    expect(sankey.nodes_list.length).toBeGreaterThan(0)
  }, 900000)
})
