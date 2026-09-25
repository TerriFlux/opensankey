// 24/09/2026 — LE PANNEAU DIT CE QUE LE TRACE FAIT, DES LA PREMIERE OUVERTURE.
//
// Julien, deux symptomes le meme matin, et c est un seul defaut :
//
//   « ok ca marche, sauf qu au debut le texte est en diagonal alors que les angles sont mis a 0.
//     Si on edite ca marche, mais au debut ca ne correspond pas. »
//   « pareil pour le fond : on a l impression que ce n est pas initialise correctement. Il est
//     montre ON alors qu il est dessine OFF. »
//
// LA FORME DU DEFAUT, et c est la troisieme fois qu elle revient (os#1501, os#1502, os#1504) : un
// element repond TOUJOURS. Interroge sur une cle que personne ne regle, il ne rend pas `undefined`
// mais la valeur d usine d un NOEUD. Le panneau montre donc cette valeur-la pendant que le trace
// fait autre chose — et les deux se « synchronisent » au premier geste, parce qu ecrire la cle la
// rend enfin explicite des deux cotes. « Si on edite ca marche » EST la signature.
//
// CE QUE CE LOT AJOUTE AUX TROIS PRECEDENTS, ce sont les deux trous qui restaient :
//
//   1. UNE REPONSE QUI DEPEND DES DONNEES. `autoBarLabelAngle` — « plus de six barres OU un libelle
//      de plus de huit caracteres » — n est pas une valeur, c est une REGLE : deux histogrammes du
//      meme document repondent differemment. Ni la declaration d une nature ni la table neutre, qui
//      sont des constantes, ne pouvaient la porter. La figure la STAMPE donc sur ses parts au
//      cablage, comme os#1503 stampe deja le pourcentage.
//   2. LE STYLE D UNE PART, que la table neutre ne servait pas. La part repondait `false` sur son
//      cartouche et son style `true` : deux panneaux pour un seul dessin, qui se contredisaient.

import { Class_ApplicationData } from '../types/ApplicationData'
import { figurePartsWiring } from '../Representations/parts/figurePartsWiring'
import {
  registerAnalysisRepresentations
} from '../Representations/registerAnalysisRepresentations'
import { BARS_STYLE_DEFAULTS, DONUT_STYLE_DEFAULTS } from '../Charts/figureChartStyle'
import { autoBarLabelAngle } from '../Charts/NodeStatsCharts'
import { BASE_LABEL_CONFIG, BASE_SHAPE_CONFIG, getConfigValues } from './ElementsAttributesConfig'
import type { ElementsType } from './ElementsAttributesConfig'

if (typeof globalThis.structuredClone !== 'function') {
  globalThis.structuredClone = <T>(o: T): T => JSON.parse(JSON.stringify(o)) as T
}

// Les defauts d une nature sont retenus a son ENREGISTREMENT : sans lui, ce fichier mesurerait un
// registre vide et passerait au vert pour la mauvaise raison.
beforeEach(() => registerAnalysisRepresentations())

/** L angle que l inspecteur annonce pour le libelle de cet element. */
const angleLu = (el: unknown): unknown => getConfigValues(
  [el] as unknown as ElementsType, BASE_LABEL_CONFIG, 'name_label', () => undefined
).text_angle

/** La case « Fond » du cartouche de son libelle. */
const cartoucheLu = (el: unknown): unknown => getConfigValues(
  [el] as unknown as ElementsType, BASE_SHAPE_CONFIG, 'name_label_background', () => undefined
).visible

/**
 * Une figure CABLEE, comme le trace la recoit — et non des parts nues : c est le cablage qui pose
 * sur elles ce que la figure est en train de faire, et c est precisement ce qui manquait.
 */
const uneFigure = (nature: string, labels: string[]) => {
  const app = new Class_ApplicationData(false)
  app.drawing_area.bypass_redraws = true
  const inputs = labels.map((label, i) => ({ id: `p${i}`, label, value: i + 1 }))
  const wiring = figurePartsWiring(
    { app_data: app }, inputs, nature,
    nature === 'bars' ? BARS_STYLE_DEFAULTS : DONUT_STYLE_DEFAULTS
  )
  const part = wiring.by_id['p0']
  const styles = (part as unknown as {
    drawing_area: { sankey: { styles_dict: { [k: string]: unknown } } }
  }).drawing_area.sankey.styles_dict
  return { wiring, part, styles }
}

const COURTS = ['Ble', 'Mais']
const LONGS = ['Consommation', 'Production']

describe('l angle annonce par le panneau est celui que le trace donnera', () => {

  it('LE CAS DE JULIEN : libelles longs, le champ annonce l inclinaison', () => {
    // Le trace inclinerait de toute facon (c est `autoBarLabelAngle`) ; ce qui changeait, c est que
    // le champ disait zero. On le tient a la REGLE et non au nombre : le jour ou le repli change,
    // ce test suit au lieu de rougir pour rien.
    const { wiring, part } = uneFigure('bars', LONGS)

    expect(autoBarLabelAngle(LONGS.map(label => ({ label })))).toBe(-35)
    expect(angleLu(part)).toBe(-35)

    wiring.release()
  })

  it('ET A PLAT QUAND LE REPLI EST A PLAT : ce n est pas une constante', () => {
    // LA CONTRE-VERIFICATION QUI COMPTE. Sans elle, poser -35 en dur passerait au vert et
    // mentirait sur toutes les figures a libelles courts — le defaut d aujourd hui, retourne.
    const { wiring, part } = uneFigure('bars', COURTS)

    expect(angleLu(part)).toBe(0)

    wiring.release()
  })

  it('LE STYLE DE LA NATURE annonce la meme chose que ses parts', () => {
    // « Regler toutes les parts d un coup » part de ce que les parts font : sinon le premier geste
    // deplace quelque chose qu on croyait a zero.
    const { wiring, part, styles } = uneFigure('bars', LONGS)

    expect(angleLu(styles['BarPartStyle'])).toBe(angleLu(part))

    wiring.release()
  })

  it('UNE SURCHARGE DE LA PART gagne, comme partout', () => {
    const { wiring, part } = uneFigure('bars', LONGS)
    ;(part as unknown as { [k: string]: unknown })['name_label_text_angle'] = -90

    expect(angleLu(part)).toBe(-90)

    wiring.release()
  })

  it('UNE COURONNE n incline rien, et son panneau le dit', () => {
    // Le repli est celui d une ABSCISSE : un secteur n en a pas, et la cle lui est d ailleurs hors
    // de portee (`NOT_ON_A_PART_FIGURE_ROUND`). Le stamp ne doit donc pas deborder sur elle.
    const { wiring, part } = uneFigure('donut', LONGS)

    expect(angleLu(part)).toBe(0)

    wiring.release()
  })
})

describe('le cartouche : la part et ses styles disent la meme chose', () => {

  it('LE CAS DE JULIEN : le STYLE ne montre plus un fond que rien ne peint', () => {
    // os#1504 avait ferme la question sur la part et laisse son style repondre `true`.
    const { wiring, part, styles } = uneFigure('bars', COURTS)

    expect(cartoucheLu(part)).toBe(false)
    expect(cartoucheLu(styles['BarPartStyle'])).toBe(false)
    // LE GENERIQUE AUSSI : il n a pas de nature, mais la table neutre n en demande aucune — elle
    // dit ce que le trace fait, et les trois natures le font pareil.
    expect(cartoucheLu(styles['FigurePartStyle'])).toBe(false)

    wiring.release()
  })

  it('ET SUR UNE COURONNE de meme', () => {
    const { wiring, part, styles } = uneFigure('donut', COURTS)

    expect(cartoucheLu(part)).toBe(false)
    expect(cartoucheLu(styles['DonutPartStyle'])).toBe(false)

    wiring.release()
  })

  it('UN STYLE QUI LE DEMANDE EXPLICITEMENT gagne, comme partout', () => {
    // Sans quoi la correction mentirait dans l autre sens : un auteur qui coche « Fond » sur le
    // style de ses parts verrait la case se rouvrir a zero.
    const { wiring, styles } = uneFigure('bars', COURTS)
    ;(styles['BarPartStyle'] as { [k: string]: unknown })['name_label_background_visible'] = true

    expect(cartoucheLu(styles['BarPartStyle'])).toBe(true)

    wiring.release()
  })

  it('UN NOEUD garde son cartouche : la regle ne vaut que pour les parts', () => {
    // LA CONTRE-VERIFICATION DU PARC. Sans elle, ce lot eteindrait le fond des etiquettes partout.
    const { wiring, part } = uneFigure('bars', COURTS)
    const sankey = (part as unknown as {
      drawing_area: { sankey: { addNewDefaultNode: () => unknown } }
    }).drawing_area.sankey

    expect(cartoucheLu(sankey.addNewDefaultNode())).toBe(true)

    wiring.release()
  })
})
