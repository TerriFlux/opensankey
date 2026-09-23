// os#1500 — L UNITE DU DIAGRAMME S ECRIT SANS QU ON AIT A LA COCHER.
//
// Julien : « je trouve que s il y a une unite au depart dans le diagramme principal, elle devrait
// etre la aussi dans la charte (barre ou couronne) ».
//
// Les trois figures savaient deja LIRE l unite — `figureUnitOf` / `figureUnitOfNode`, sur un flux
// representatif, exactement comme les etiquettes du dessin — mais ne l ECRIVAIENT que si l auteur
// cochait « Unite ». Une couronne posee sur un diagramme en kt montrait donc des nombres nus, a
// cote d un dessin qui dit « kt » partout.
//
// ⚠️ CE N EST PAS UN RENVERSEMENT RISQUE, et le troisieme cas le tient : sans unite au diagramme,
// le symbole resolu vaut '' et rien ne change.

import { figureValueFormatOf, figureValueFormatter } from './figureFormat'
import { drawSunburstChart } from './SunburstChart'
import {
  givePlainDrawingEnvironment, sizedContainer, plainSunburstTree
} from './figureDomHarness.test-utils'

givePlainDrawingEnvironment()

const PARTS = [
  { id: 'a', label: 'Ble', value: 6 },
  { id: 'b', label: 'Mais', value: 4 }
]

/** Ce que la couronne et les barres ecrivent pour une valeur, sous ces reglages. */
const ecrit = (options: { [key: string]: unknown }, unit: string): string =>
  figureValueFormatter(figureValueFormatOf(options, unit))(12)

afterEach(() => { document.body.innerHTML = '' })

describe('os#1500 une figure ecrit lunite du diagramme', () => {

  it('LA COURONNE ET LES BARRES : rien de dit, et lunite y est', () => {
    expect(ecrit({}, 'kt')).toContain('kt')
  })

  it('LAUTEUR QUI A DECOCHE garde son reglage', () => {
    // La surcharge prime sur le defaut, ici comme partout : changer un defaut ne doit jamais
    // defaire un geste explicite.
    expect(ecrit({ value_label_unit_visible: false }, 'kt')).not.toContain('kt')
  })

  it('SANS UNITE AU DIAGRAMME, rien ne sécrit — et cest ce qui rend le lot sans risque', () => {
    // CONTRE-VERIFICATION : sans elle, « le defaut devient vrai » pourrait coller un espace ou un
    // symbole vide a tous les nombres du parc.
    expect(ecrit({}, '')).toBe('12')
  })

  it('LE DISQUE : la meme regle, et il avait le meme defaut', () => {
    const el = sizedContainer()
    drawSunburstChart(el, plainSunburstTree(PARTS), {
      style: { labels_mode: 'always', value_visible: true } as never,
      unit: 'kt'
    } as never)
    const texte = Array.from(el.querySelectorAll('text')).map(t => t.textContent ?? '').join(' ')
    el.remove()

    expect(texte).toContain('kt')
  })
})
