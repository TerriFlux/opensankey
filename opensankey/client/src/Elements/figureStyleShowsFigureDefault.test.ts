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
import { BASE_LABEL_CONFIG, BASE_SHAPE_CONFIG, getConfigValues } from './ElementsAttributesConfig'
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

  it('os#1502 LA PART ELLE-MEME montre aussi ce que sa figure fait', () => {
    // Julien : « si je vais sur la PART elle-meme, elle n a pas Valeur visible — or elle devrait
    // l avoir puisque le style le dit, et ce n est pas une surcharge ».
    //
    // Une part resout comme un element : sa surcharge, ses styles, puis la valeur d usine d un
    // ELEMENT. Ce dernier etage etait le mauvais — ce qu une part fait quand personne ne dit rien,
    // c est ce que sa FIGURE fait.
    const figure = uneCouronne()
    const part = figure.by_id['a']

    expect(luSurLeStyle(part).is_visible).toBe(true)
    // ET L UNITE AVEC, depuis que la declaration suit le trace (os#1500 : « s il y a une unite au
    // depart dans le diagramme principal, elle devrait etre la aussi dans la charte »).
    expect(luSurLeStyle(part).unit_visible).toBe(true)

    figure.document.dispose()
  })

  it('os#1502 UNE SURCHARGE DE LA PART gagne, comme partout', () => {
    const figure = uneCouronne()
    const part = figure.by_id['a'] as unknown as { [k: string]: unknown }
    part['value_label_is_visible'] = false

    expect(luSurLeStyle(part).is_visible).toBe(false)

    figure.document.dispose()
  })

  it('os#1504 LE FOND : le panneau dit ce que le trace fait, cest-a-dire RIEN', () => {
    // Julien : « le fond est selectionne alors qu on ne le voit pas ».
    //
    // `name_label_background_visible` vaut VRAI au catalogue des elements — un noeud dont on
    // affiche le cartouche l affiche. Une part, non : le trace ne peint que ce qu elle DEMANDE, et
    // aucune figure ne declare cette cle.
    const figure = uneCouronne()
    const part = figure.by_id['a']

    expect(getConfigValues(
      [part] as unknown as ElementsType, BASE_SHAPE_CONFIG, 'name_label_background', () => undefined
    ).visible).toBe(false)

    figure.document.dispose()
  })

  it('os#1504 ET SI LA PART LE DEMANDE, cest elle qui parle', () => {
    const figure = uneCouronne()
    const part = figure.by_id['a'] as unknown as { [k: string]: unknown }
    part['name_label_background_visible'] = true

    expect(getConfigValues(
      [part] as unknown as ElementsType, BASE_SHAPE_CONFIG, 'name_label_background', () => undefined
    ).visible).toBe(true)

    figure.document.dispose()
  })

  it('os#1504 UN NOEUD garde son cartouche visible : la regle ne vaut que pour une part', () => {
    // LA CONTRE-VERIFICATION. Sans elle, ce lot eteindrait le fond des etiquettes de tout le parc.
    const figure = uneCouronne()
    const node = figure.document.drawing_area.sankey.addNewDefaultNode()

    expect(getConfigValues(
      [node] as unknown as ElementsType, BASE_SHAPE_CONFIG, 'name_label_background', () => undefined
    ).visible).toBe(true)

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
