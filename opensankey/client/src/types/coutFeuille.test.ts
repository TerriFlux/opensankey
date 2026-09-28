import { Class_ApplicationData } from './ApplicationData'
import type { Class_DataTagGroup } from './TagGroup'

// jest 27 / jsdom n'expose pas structuredClone (utilise par Link.copyFrom)
if (typeof globalThis.structuredClone !== 'function') {
  globalThis.structuredClone = <T>(o: T): T => JSON.parse(JSON.stringify(o)) as T
}

// os#1511 — COMBIEN COUTE UNE FEUILLE DE L ARBRE DE VALEURS ?
//
// Le SOCLE ramene a deux flux fait exploser la memoire au chargement (constate par Julien, puis
// reproduit : node meurt a 4 Go pendant fromJSON). L arbre de valeurs est DENSE — un enfant par
// membre, a chaque etage — donc deux dimensions croisees materialisent leur produit cartesien,
// trous compris. Reste a savoir si le probleme est le NOMBRE de feuilles ou le POIDS de chacune.
//
// Ce test mesure, il n affirme rien : il construit un croisement de taille connue et regarde le
// tas. Il ne s execute que si COUT_FEUILLE est fourni — une mesure n a pas sa place en CI.

const MESURER = process.env.COUT_FEUILLE !== undefined
const maybe = MESURER ? describe : describe.skip

maybe('os#1511 — cout d une feuille de l arbre de valeurs', () => {
  test('un croisement de taille connue, et le tas qu il occupe', () => {
    const LARGEUR = 60   // membres de la premiere dimension
    const HAUTEUR = 60   // membres de la seconde
    const app = new Class_ApplicationData(false)
    const sankey = app.drawing_area.sankey
    const un = sankey.addDataTagGroup('un', 'Un', false) as unknown as Class_DataTagGroup
    const deux = sankey.addDataTagGroup('deux', 'Deux', false) as unknown as Class_DataTagGroup
    for (let i = 0; i < LARGEUR; i++) un.addTag(`A${i}`, `a${i}`)
    for (let i = 0; i < HAUTEUR; i++) deux.addTag(`B${i}`, `b${i}`)

    global.gc?.()
    const avant = process.memoryUsage().heapUsed
    // Un seul flux : son arbre porte LARGEUR x HAUTEUR feuilles, toutes materialisees.
    sankey.addNewLink(sankey.addNewNodeWithName('S'), sankey.addNewNodeWithName('T'))
    global.gc?.()
    const apres = process.memoryUsage().heapUsed

    const feuilles = LARGEUR * HAUTEUR
    const octets = apres - avant
    // eslint-disable-next-line no-console
    console.log(`  feuilles : ${feuilles}`)
    // eslint-disable-next-line no-console
    console.log(`  tas : ${(octets / 1e6).toFixed(1)} Mo  soit ${Math.round(octets / feuilles)} octets par feuille`)
    // eslint-disable-next-line no-console
    console.log(`  => 148 x 263 x 3 x 2 flux = ${148 * 263 * 3 * 2} feuilles, `
      + `soit ${((octets / feuilles) * 148 * 263 * 3 * 2 / 1e9).toFixed(1)} Go`)
    expect(feuilles).toBe(3600)
  }, 300000)
})
