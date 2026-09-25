// 25/09/2026 — CHANGER DE REPRESENTATION CHANGE LA FIGURE, DONC L INSPECTEUR.
//
// Julien, capture a l appui : « si je passe par Couronne et si je selectionne Barres dans le
// selecteur de la fenetre, ca ne met pas a jour l inspecteur. »
//
// ── POURQUOI LE DEPOT NE POUVAIT PAS LE VOIR ──────────────────────────────────────────────────
//
// Les parts d un volet sont gardees d un dessin au suivant, indexees par (fenetre, vignette) et par
// rien d autre (`figurePartsRegistry`). C est voulu et c est meme la correction d os#1453 : sans
// cette reprise, chaque geste detruisait l objet qu on etait en train de regler, la selection
// partait et l inspecteur retombait sur « Graphe ».
//
// Mais la nature n etait dans aucune cle NI dans le jeu rendu. Reprendre le jeu revenait donc a
// reprendre la figure : la part continuait de se dire part de couronne (`figure_nature`),
// `BarPartStyle` n etait jamais seme — `seedPartStyles` ne tournait qu au PREMIER dessin — et
// l inspecteur, qui lit ces deux choses, montrait fidelement une couronne.
//
// ⚠️ CE QUI NE DOIT PAS CHANGER EN MEME TEMPS, et c est la moitie fragile : le document et les
// parts restent LES MEMES OBJETS. Rebatir reglerait la nature et rouvrirait os#1453. Ce fichier
// tient donc les deux bouts — la figure change, l identite non.

import { Class_ApplicationData } from '../../types/ApplicationData'
import { figurePartsFor, resetFigureParts } from './figurePartsRegistry'
import { registerAnalysisRepresentations } from '../registerAnalysisRepresentations'
import { attributeAppliesToElements } from '../../Elements/attributeScope'

if (typeof globalThis.structuredClone !== 'function') {
  globalThis.structuredClone = <T>(o: T): T => JSON.parse(JSON.stringify(o)) as T
}

beforeEach(() => { registerAnalysisRepresentations(); resetFigureParts() })
afterEach(() => resetFigureParts())

const INPUTS = [
  { id: 'a', label: 'Consommation', value: 6 },
  { id: 'b', label: 'Production', value: 4 }
]

/** Un document, et le meme volet d une fenetre d un bout a l autre du scenario. */
const unVolet = () => {
  const app = new Class_ApplicationData(false)
  app.drawing_area.bypass_redraws = true
  return (nature: string) => figurePartsFor('fen1', 'volet1', app, INPUTS, nature)
}

const stylesDe = (jeu: { document: { drawing_area: { sankey: { styles_dict: object } } } }) =>
  Object.keys(jeu.document.drawing_area.sankey.styles_dict).filter(id => id.includes('PartStyle'))

const natureDe = (part: unknown) => (part as { figure_nature: string }).figure_nature

describe('passer de la couronne aux barres dans le selecteur de la fenetre', () => {

  it('LE CAS DE JULIEN : la part devient une part de BARRES', () => {
    const volet = unVolet()
    const couronne = volet('donut')
    expect(natureDe(couronne.by_id['a'])).toBe('donut')

    const barres = volet('bars')

    expect(natureDe(barres.by_id['a'])).toBe('bars')
  })

  it('ET SON ETAGE DE STYLE EST SEME : sans lui, rien a offrir a l auteur', () => {
    // `seedPartStyles` ne tournait qu au premier dessin : « Part de barres » n existait pas, donc
    // « regler toutes les parts d un coup » n avait rien a proposer sur cette figure.
    const volet = unVolet()
    volet('donut')

    const barres = volet('bars')

    expect(stylesDe(barres)).toContain('BarPartStyle')
  })

  it('LE STYLE DE LA COURONNE NE PARLE PLUS A LA PART', () => {
    // Il RESTE au document — l auteur peut revenir a la couronne, ses reglages de secteur l y
    // attendent — mais empile sur une barre il dicterait l aspect de l ancienne figure.
    const volet = unVolet()
    volet('donut')

    const barres = volet('bars')
    const part = barres.by_id['a'] as unknown as { hasStyle: (id: string) => boolean }

    expect(part.hasStyle('DonutPartStyle')).toBe(false)
    expect(part.hasStyle('BarPartStyle')).toBe(true)
  })

  it('LA CONSEQUENCE VISIBLE : le champ d angle, masque sur un secteur, apparait sur une barre', () => {
    // C est ce que Julien regarde. La portee `NOT_ON_A_PART_FIGURE_ROUND` interroge la nature de
    // figure de l element : tant que la part se disait couronne, le controle restait cache.
    const volet = unVolet()
    const couronne = volet('donut')
    expect(attributeAppliesToElements([couronne.by_id['a']], 'name_label_text_angle')).toBe(false)

    const barres = volet('bars')

    expect(attributeAppliesToElements([barres.by_id['a']], 'name_label_text_angle')).toBe(true)
  })

  it('ET DANS L AUTRE SENS, car un auteur revient sur ses pas', () => {
    const volet = unVolet()
    volet('donut')
    volet('bars')

    const retour = volet('donut')
    const part = retour.by_id['a'] as unknown as { hasStyle: (id: string) => boolean }

    expect(natureDe(retour.by_id['a'])).toBe('donut')
    expect(part.hasStyle('DonutPartStyle')).toBe(true)
    expect(part.hasStyle('BarPartStyle')).toBe(false)
  })
})

describe('ce que le changement de figure ne doit PAS emporter', () => {

  it('LE DOCUMENT ET LES PARTS SONT LES MEMES OBJETS (os#1453)', () => {
    // LA CONTRE-VERIFICATION QUI COMPTE. Rebatir reglerait la nature et rouvrirait le defaut que
    // Julien avait decrit en trois symptomes : « l interface apparait mais EN CLIQUANT DEUX FOIS ;
    // je clique sur Fond, ca ne fait rien ; et EN PLUS ca ramene sur Graphe ».
    const volet = unVolet()
    const couronne = volet('donut')

    const barres = volet('bars')

    expect(barres.document).toBe(couronne.document)
    expect(barres.by_id['a']).toBe(couronne.by_id['a'])
  })

  it('CE QUE L AUTEUR A POSE EN PROPRE survit au changement', () => {
    // Un alias, une couleur : ce sont des reglages de CETTE part, et ils valent pour un secteur
    // comme pour une barre. Les perdre ferait du selecteur de representation un geste destructeur.
    const volet = unVolet()
    const couronne = volet('donut')
    const part = couronne.by_id['a'] as unknown as { [k: string]: unknown }
    part['shape_color'] = '#123456'

    volet('bars')

    expect(part['shape_color']).toBe('#123456')
  })

  it('UNE FIGURE QUI NE CHANGE PAS DE NATURE ne rebrasse rien', () => {
    // Le chemin de tous les redessins : deux dessins de suite sur la meme figure ne doivent ni
    // detacher ni rempiler un style — sinon le cas courant paie le prix du cas rare.
    const volet = unVolet()
    const un = volet('donut')
    const deux = volet('donut')

    expect(deux.by_id['a']).toBe(un.by_id['a'])
    expect(deux.nature).toBe('donut')
    expect(stylesDe(deux)).not.toContain('BarPartStyle')
  })
})
