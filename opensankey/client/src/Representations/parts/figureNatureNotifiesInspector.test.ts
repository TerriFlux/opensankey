// 25/09/2026 — CHANGER DE REPRESENTATION DOIT RAPPELER L INSPECTEUR.
//
// Julien, deux fois, la seconde apres une correction qui ne suffisait pas : « si je passe par
// Couronne et si je selectionne Barres dans le selecteur de la fenetre, ca ne met pas a jour
// l inspecteur. »
//
// ── POURQUOI LA PREMIERE CORRECTION NE POUVAIT PAS SE VOIR ────────────────────────────────────
//
// Elle portait sur le MODELE (`figureNatureSwitch.test.ts`) : la part devient bien une part de
// barres, son etage de style est seme, le champ d angle lui est rendu. Tout cela est vrai — et
// invisible, parce que personne ne redemandait a l inspecteur de le lire.
//
// La chaine du geste : `setMainZoneWindowRepresentation` n emet que `MAIN_ZONE_TOPIC`. L inspecteur
// s y re-rend AUSSITOT, donc AVANT que l effet de la vignette n ait redessine la figure. A ce
// rendu-la, la representation active est deja la neuve mais les parts portent encore l ancienne
// nature : il montre fidelement la couronne.
//
// Le rendu suivant devrait lever la contradiction. Il n arrive jamais, et c est le PRIX D OS#1453 :
// le document de parts est delibrement le MEME objet d une figure a l autre, donc
// `Workspace.refreshActive` n y voit aucun changement d actif et n annonce rien. Le debranchement
// puis rebranchement du montage se compensent exactement.
//
// D ou ce fichier : il ne mesure pas ce que les parts VALENT — l autre s en charge — mais qu on
// PREVIENT. C est la difference entre le resolveur et le chemin visible, et c est elle qui a coute
// un aller-retour.

import { Class_ApplicationData } from '../../types/ApplicationData'
import { figurePartsWiring } from './figurePartsWiring'
import { resetFigureParts } from './figurePartsRegistry'
import { registerAnalysisRepresentations } from '../registerAnalysisRepresentations'
import { BARS_STYLE_DEFAULTS, DONUT_STYLE_DEFAULTS } from '../../Charts/figureChartStyle'

if (typeof globalThis.structuredClone !== 'function') {
  globalThis.structuredClone = <T>(o: T): T => JSON.parse(JSON.stringify(o)) as T
}

beforeEach(() => { registerAnalysisRepresentations(); resetFigureParts() })
afterEach(() => resetFigureParts())

const INPUTS = [
  { id: 'a', label: 'Consommation', value: 6 },
  { id: 'b', label: 'Production', value: 4 }
]

/**
 * Un volet, et le compteur des rappels d inspecteur qu il provoque.
 *
 * On compte sur `updateInspector` lui-meme plutot que sur un topic : c est le nom par lequel le
 * reste du code demande ce rafraichissement (cf. `on_part_select`), et donc ce qu un lecteur ira
 * chercher.
 */
const unVolet = () => {
  const app = new Class_ApplicationData(false)
  app.drawing_area.bypass_redraws = true
  const mc = app.menu_configuration as unknown as { updateInspector: () => void }
  let rappels = 0
  const vrai = mc.updateInspector.bind(mc)
  mc.updateInspector = () => { rappels += 1; vrai() }

  return {
    dessine: (nature: string) => figurePartsWiring(
      { app_data: app, window_id: 'fen1', pane_key: 'volet1' }, INPUTS, nature,
      nature === 'bars' ? BARS_STYLE_DEFAULTS : DONUT_STYLE_DEFAULTS
    ),
    rappels: () => rappels
  }
}

describe('le rappel de l inspecteur au changement de representation', () => {

  it('LE CAS DE JULIEN : passer de la couronne aux barres previent l inspecteur', () => {
    const volet = unVolet()
    volet.dessine('donut')
    const avant = volet.rappels()

    volet.dessine('bars')

    expect(volet.rappels()).toBe(avant + 1)
  })

  it('UN REDESSIN ORDINAIRE ne previent personne', () => {
    // LA CONTRE-VERIFICATION QUI COMPTE, et elle est la vraie contrainte de ce lot. Un redessin
    // arrive a chaque geste ; rappeler l inspecteur a chaque fois le ferait clignoter et,
    // surtout, lui reprendrait l onglet que l auteur venait d ouvrir.
    const volet = unVolet()
    volet.dessine('donut')
    const avant = volet.rappels()

    volet.dessine('donut')
    volet.dessine('donut')

    expect(volet.rappels()).toBe(avant)
  })

  it('LE PREMIER DESSIN non plus : il n y a pas de « avant » a contredire', () => {
    const volet = unVolet()

    volet.dessine('donut')

    expect(volet.rappels()).toBe(0)
  })

  it('ET DANS L AUTRE SENS, car un auteur revient sur ses pas', () => {
    const volet = unVolet()
    volet.dessine('donut')
    volet.dessine('bars')
    const avant = volet.rappels()

    volet.dessine('donut')

    expect(volet.rappels()).toBe(avant + 1)
  })
})
