// os#1501 — UN STYLE DE PART MONTRE CE QUE SA FIGURE FERAIT, pas ce qu un noeud ferait.
//
// Julien, capture a l appui, dans la cascade de styles d une couronne : « quand je selectionne la
// couronne et je vais sur Valeur, ce ne sont pas les memes choses qui sont selectionnees dans la
// config que celles qui sont affichees — par exemple Valeur n est pas mis en ON dans config. Si je
// manipule ensuite ca se synchronise, mais pas au debut. » Puis : « meme le style pour les
// couronnes ne reflete pas le dessin ».
//
// ⚠️ UN STYLE REPOND TOUJOURS, ET C EST LE PIEGE. Interroge sur une cle qu il ne regle pas, il ne
// rend pas `undefined` mais la valeur d usine d un ELEMENT (par son style par defaut) :
// `value_label_is_visible` vaut donc `false`, parce qu un noeud n ecrit pas sa valeur. Une
// couronne, elle, l ecrit (os#1489). Le panneau montrait l inverse du dessin, et les deux se
// « synchronisaient » au premier geste — parce qu ecrire la cle la rend explicite des deux cotes.

import { Class_ApplicationData } from '../types/ApplicationData'
import { buildParts } from '../Representations/parts/buildParts'
import {
  registerAnalysisRepresentations
} from '../Representations/registerAnalysisRepresentations'
import { BASE_LABEL_CONFIG, getConfigValues } from './ElementsAttributesConfig'
import type { ElementsType } from './ElementsAttributesConfig'
import { figureStyleDefault } from './figureNatureDefaults'

if (typeof globalThis.structuredClone !== 'function') {
  globalThis.structuredClone = <T>(o: T): T => JSON.parse(JSON.stringify(o)) as T
}

// Les defauts d une nature sont retenus a son ENREGISTREMENT : sans lui, ce fichier mesurerait un
// registre vide et passerait au vert pour la mauvaise raison.
beforeEach(() => registerAnalysisRepresentations())

/** Une figure de COURONNE et son document de parts, comme le trace les construit. */
const uneCouronne = () => {
  const doc = new Class_ApplicationData(false)
  doc.drawing_area.bypass_redraws = true
  return buildParts(doc, [
    { id: 'a', label: 'Ble', value: 6 },
    { id: 'b', label: 'Mais', value: 4 }
  ], undefined, 'donut')
}

/** Ce que l inspecteur lit sur ce style, pour la famille « Valeur ». */
const luSurLeStyle = (style: unknown) =>
  getConfigValues(
    [style] as unknown as ElementsType, BASE_LABEL_CONFIG, 'value_label', () => undefined
  )

describe('os#1501 le style dune part montre le defaut de sa figure', () => {

  it('LE CAS DE JULIEN : la valeur est VISIBLE dans le style de la couronne', () => {
    const figure = uneCouronne()
    const styles = figure.document.drawing_area.sankey.styles_dict

    // Le style de la couronne existe : le semis le cree avec le document de parts (os#1462).
    expect(styles['DonutPartStyle']).toBeDefined()
    expect(luSurLeStyle(styles['DonutPartStyle']).is_visible).toBe(true)

    figure.document.dispose()
  })

  it('UN STYLE QUI N EST PAS CELUI D UNE PART n est pas touche par la regle', () => {
    // LA CONTRE-VERIFICATION, et elle porte sur la REGLE et non sur la valeur : les styles de
    // base sont semes avec leur propre configuration (`create_internal_style`), donc ce qu un
    // `NodeStyle` rend depend du depot, pas de ce lot. Ce qui doit etre vrai est que ce lot ne
    // lui dit RIEN — sans quoi il rendrait `true` a tout le monde.
    const figure = uneCouronne()
    const styles = figure.document.drawing_area.sankey.styles_dict

    expect(figureStyleDefault(styles['NodeStyle'], 'value_label_is_visible')).toBeUndefined()
    expect(figureStyleDefault({ id: 'MonStyleAMoi' }, 'value_label_is_visible')).toBeUndefined()

    figure.document.dispose()
  })

  it('CE QUE LE STYLE DIT EXPLICITEMENT GAGNE, comme partout', () => {
    // Le defaut de nature ne se montre que faute de mieux : un geste de l auteur prime, sans quoi
    // le panneau mentirait dans l autre sens.
    const figure = uneCouronne()
    const style = figure.document.drawing_area.sankey.styles_dict['DonutPartStyle'] as unknown as {
      [k: string]: unknown
    }
    style['value_label_is_visible'] = false

    expect(luSurLeStyle(style).is_visible).toBe(false)

    figure.document.dispose()
  })

  it('LE STYLE GENERIQUE ne prend la figure daucune nature', () => {
    // `FigurePartStyle` sert les trois natures a la fois : montrer le defaut de l une mentirait
    // sur les deux autres. Il garde donc ce que la cascade rendait, comme avant ce lot.
    const figure = uneCouronne()
    const styles = figure.document.drawing_area.sankey.styles_dict

    expect(styles['FigurePartStyle']).toBeDefined()
    expect(figureStyleDefault(styles['FigurePartStyle'], 'value_label_is_visible')).toBeUndefined()

    figure.document.dispose()
  })
})
