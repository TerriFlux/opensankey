// os#1449 — LES PARTS ONT LEURS STYLES.
//
// « Ben ajoute des styles de part ? non » (Julien, 20/09). Les parts avaient depuis os#1445 un
// document et une cascade, mais toutes accrochees au `default_style` : l onglet Styles de
// l inspecteur n avait donc rien a regler, et « toutes les parts d un coup » etait impossible.
//
// CE QUI SE VERIFIE ICI, dans l ordre de ce qui compte :
//  1. le style existe et se voit (`styles_list`) — sinon l inspecteur ne le propose pas ;
//  2. une part neuve n est PAS surchargee : le semis passe par la CASCADE et non par `copyFrom`,
//     sans quoi chaque cle apparaitrait comme surchargee et l inspecteur montrerait un lisere
//     partout ;
//  3. regler le style change TOUTES les parts, et regler UNE part ne change qu elle ;
//  4. ET LE CAS QUI COMMANDE TOUT : une figure dont aucune part ne dit rien rend exactement le
//     meme aspect qu avant — y compris, et surtout, quand l auteur avait regle sa figure.

import { buildParts } from './buildParts'
import type { Type_FigureParts } from './buildParts'
import { partStyleOf } from './partStyle'
import { Class_ApplicationData } from '../../types/ApplicationData'
import { BarPartStyle, DonutPartStyle, elementStyleConfigs, FigurePartStyle, SunburstPartStyle } from '../../Elements/ElementStyle'
import { SUNBURST_STYLE_DEFAULTS, sunburstPartStyle } from '../../Charts/SunburstChart'

if (typeof globalThis.structuredClone !== 'function') {
  globalThis.structuredClone = <T>(o: T): T => JSON.parse(JSON.stringify(o)) as T
}

const buildSource = () => {
  const doc = new Class_ApplicationData(false)
  doc.drawing_area.bypass_redraws = true
  return doc
}

// os#1462 — LA NATURE EST DECLAREE, et ce n est pas un detail de mise en place : depuis que les
// styles de part ont deux etages, l aspect d une couronne (opacite, lisere blanc) vit sur le style
// de la NATURE et non sur le generique. Une part batie sans nature n a donc que l etage du haut —
// ce qui est juste, et ce que verifie le test « sans nature » plus bas.
const twoParts = (): Type_FigureParts => buildParts(buildSource(), [
  { id: 'n_ble', label: 'Ble', value: 6 },
  { id: 'n_mais', label: 'Mais', value: 4 }
], undefined, 'sunburst')

describe('os#1449 le style de part existe et se voit', () => {

  it('le document de parts porte un style de part, et il est liste', () => {
    // Sa simple PRESENCE dans `styles_list` est ce que le selecteur de styles de l inspecteur
    // montre : c est le grief auquel ce lot repond.
    const figure = twoParts()
    const sankey = figure.document.drawing_area.sankey

    expect(sankey.styles_dict[FigurePartStyle]).toBeDefined()
    expect(sankey.styles_list.map(s => s.id)).toContain(FigurePartStyle)
  })

  it('chaque part porte ce style, et le style par defaut en dessous', () => {
    const figure = twoParts()
    const part_style = partStyleOf(figure.document.drawing_area.sankey)

    figure.ordered.forEach(part => {
      expect(part.style.map(s => s.id)).toEqual(['default', FigurePartStyle, SunburstPartStyle])
      // Et c est bien LA MEME instance : deux styles homonymes auraient deux sacs, et regler l un
      // ne se verrait pas sur les parts accrochees a l autre.
      expect(part.getCustomStyles()[0]).toBe(part_style)
    })
  })

  it('le style porte laspect dusine dune FIGURE, pas celui dun noeud', () => {
    // C est la raison d etre de l amorce : ce que l inspecteur montre doit etre ce que la couronne
    // dessine — dix points, opacite 1, lisere blanc — et non les quatorze points d un noeud.
    const figure = twoParts()
    const part = figure.by_id['n_ble']

    expect(part.name_label_font_size).toBe(SUNBURST_STYLE_DEFAULTS.font_size)
    expect(part.shape_opacity).toBe(SUNBURST_STYLE_DEFAULTS.opacity)
    expect(part.shape_border_color).toBe(SUNBURST_STYLE_DEFAULTS.border_color)
    expect(part.shape_border_visible).toBe(SUNBURST_STYLE_DEFAULTS.border_visible)
  })
})

describe('os#1449 le semis passe par la cascade, jamais par copyFrom', () => {

  it('le style ne porte QUE ses cles declarees', () => {
    // LE PIEGE QUI A DEJA COUTE UNE RECETTE. Un `copyFrom(default_style)` aurait recopie le sac
    // entier des valeurs d usine ; le sac du style ne doit contenir que l amorce.
    const figure = twoParts()
    const part_style = partStyleOf(figure.document.drawing_area.sankey)

    expect(Object.keys(part_style.attributes).sort())
      .toEqual(Object.keys(elementStyleConfigs[FigurePartStyle].config).sort())
  })

  it('une part neuve nest surchargee sur RIEN', () => {
    // Ni par son sac propre (vide), ni par son style (a l amorce). C est ce qui fait que
    // l inspecteur n affiche aucun lisere de surcharge sur une part qu on vient d ouvrir.
    const figure = twoParts()
    const part = figure.by_id['n_ble']

    const seeded = Object.keys(elementStyleConfigs[FigurePartStyle].config)
    seeded.forEach(attr => expect(part.isAttributeOverloaded(attr)).toBe(false))
    // Et pas davantage sur une cle que personne n a semee.
    expect(part.isAttributeOverloaded('name_label_bold')).toBe(false)
  })
})

describe('os#1449 regler le style, ou regler une part', () => {

  it('regler le style change TOUTES les parts', () => {
    // La seconde moitie de la demande : « pour editer globalement on le fait par les styles ».
    const figure = twoParts()
    const part_style = partStyleOf(figure.document.drawing_area.sankey)

    part_style.name_label_font_size = 22

    expect(sunburstPartStyle(SUNBURST_STYLE_DEFAULTS, figure.by_id['n_ble']).font_size).toBe(22)
    expect(sunburstPartStyle(SUNBURST_STYLE_DEFAULTS, figure.by_id['n_mais']).font_size).toBe(22)
  })

  it('regler UNE part ne change pas les autres', () => {
    const figure = twoParts()
    const part_style = partStyleOf(figure.document.drawing_area.sankey)
    part_style.name_label_font_size = 22

    figure.by_id['n_ble'].name_label_font_size = 30

    expect(sunburstPartStyle(SUNBURST_STYLE_DEFAULTS, figure.by_id['n_ble']).font_size).toBe(30)
    // La voisine suit le style, qui suit l auteur : 22 et non 30.
    expect(sunburstPartStyle(SUNBURST_STYLE_DEFAULTS, figure.by_id['n_mais']).font_size).toBe(22)
  })

  it('une part qui pose la valeur de son style la DIT quand meme', () => {
    // Le trou que ce lot rebouche. Ce qui attend derriere la porte fermee n est pas le style de la
    // part mais le reglage de la FIGURE, qui peut dire autre chose : cocher le lisere sur CE
    // secteur doit compter, meme si le style le coche deja.
    const sans_lisere = { ...SUNBURST_STYLE_DEFAULTS, border_visible: false }
    const figure = twoParts()

    // `true` est justement ce que porte l amorce du style de part.
    figure.by_id['n_ble'].shape_border_visible = true

    expect(sunburstPartStyle(sans_lisere, figure.by_id['n_ble']).border_visible).toBe(true)
    // Et la voisine, qui n a rien demande, suit toujours la figure.
    expect(sunburstPartStyle(sans_lisere, figure.by_id['n_mais']).border_visible).toBe(false)
  })

  it('un reglage de part qui coincide avec son style survit au rebatissage', () => {
    // Le pendant du test precedent. Ce reglage-la est justement celui qu une minimisation contre
    // le style aurait jete : il aurait tenu jusqu au redessin suivant, puis disparu sans un mot.
    const source = buildSource()
    const inputs = [{ id: 'n_ble', label: 'Ble', value: 6 }]
    const premier = buildParts(source, inputs)
    premier.by_id['n_ble'].shape_border_visible = true

    const second = buildParts(source, inputs, premier)

    const sans_lisere = { ...SUNBURST_STYLE_DEFAULTS, border_visible: false }
    expect(sunburstPartStyle(sans_lisere, second.by_id['n_ble']).border_visible).toBe(true)
  })

  it('le reglage du style survit a un rebatissage', () => {
    // Les parts se refont a chaque geste de navigation. Un reglage global perdu au premier
    // depliage ne serait pas un reglage.
    const source = buildSource()
    const inputs = [{ id: 'n_ble', label: 'Ble', value: 6 }]
    const premier = buildParts(source, inputs)
    partStyleOf(premier.document.drawing_area.sankey).name_label_font_size = 22

    const second = buildParts(source, inputs, premier)

    expect(partStyleOf(second.document.drawing_area.sankey).name_label_font_size).toBe(22)
    expect(sunburstPartStyle(SUNBURST_STYLE_DEFAULTS, second.by_id['n_ble']).font_size).toBe(22)
  })
})

describe('os#1449 une couronne enregistree se rouvre a lidentique', () => {

  it('sans rien de dit, laspect de la figure tient — meme regle par lauteur', () => {
    // LE CAS QUI COMMANDE LE LOT, et celui que l amorce aurait pu casser. Une couronne dont
    // l auteur a regle la police a quatorze points, l opacite a 0,4 et le lisere en noir : si
    // l amorce du style (dix points, opacite 1, lisere blanc) etait tenue pour « dite », elle
    // ecraserait ces trois reglages a la reouverture. Une amorce est MUETTE, et c est ce que ce
    // test fige.
    const reglee = {
      ...SUNBURST_STYLE_DEFAULTS,
      font_size: 14,
      opacity: 0.4,
      border_color: '#000000',
      significant_digits: false,
      nb_significant_digits: 3,
      labels_mode: 'always' as const
    }
    const figure = twoParts()

    expect(sunburstPartStyle(reglee, figure.by_id['n_ble'])).toEqual(reglee)
    expect(sunburstPartStyle(reglee, figure.by_id['n_mais'])).toEqual(reglee)
  })

  it('aucune part ne dit rien tant que personne na rien touche', () => {
    const figure = twoParts()

    expect(sunburstPartStyle(SUNBURST_STYLE_DEFAULTS, figure.by_id['n_ble']))
      .toEqual(SUNBURST_STYLE_DEFAULTS)
  })
})

// os#1462 — LES STYLES DE PART ONT DEUX ETAGES.
//
// Julien : « il faut creer des styles par defaut pour les parts — parts de sunburst, parts de
// couronne, parts de barre… tu vois le truc ? » C est le §5 du contrat applique aux parts : en
// haut ce qui vaut pour TOUTE part, en bas ce qui vaut pour la sienne.
//
// CE QUI SE VERIFIE ICI N EST PAS LE CONTENU DES AMORCES mais la MECANIQUE : que la cascade ait
// bien trois crans, que le cran du bas gagne, et qu une figure ne se voie offrir que les styles
// qui la concernent. Les valeurs, elles, se relisent dans `ElementStyle`.
describe('os#1462 le generique en haut, la nature en bas', () => {

  it('une part de sunburst porte les deux etages, dans cet ordre', () => {
    const part = twoParts().by_id['n_ble']

    expect(part.style.map(s => s.id)).toEqual(['default', FigurePartStyle, SunburstPartStyle])
  })

  it('le lisere blanc a QUITTE le generique pour la nature', () => {
    // LE PARTAGE, ET SA RAISON. Le lisere blanc separe des ANNEAUX : il etait dans l etage
    // generique, donc herite par les barres, et `barPartStyle` devait s en defendre a la main.
    // Une valeur fausse qu on neutralise en aval reste une valeur fausse.
    const generique = elementStyleConfigs[FigurePartStyle].config as { [k: string]: unknown }
    const nature = elementStyleConfigs[SunburstPartStyle].config as { [k: string]: unknown }

    expect(generique.shape_border_visible).toBeUndefined()
    expect(generique.shape_border_color).toBeUndefined()
    expect(nature.shape_border_color).toBe('#ffffff')
    // Et ce qui vaut pour TOUTE part est reste en haut : dix points, quatre chiffres.
    expect(generique.name_label_font_size).toBe(10)
  })

  it('une part de barres ne porte PAS le lisere de la couronne', () => {
    // La demande, en une assertion : deux natures, deux aspects d usine.
    const barres = buildParts(buildSource(), [
      { id: 'l_ble', label: 'Ble', value: 6 }
    ], undefined, 'bars').by_id['l_ble']

    expect(barres.style.map(s => s.id)).toEqual(['default', FigurePartStyle, BarPartStyle])
    expect(barres.shape_border_visible).toBe(false)
  })

  it('une couronne ne se voit pas offrir le style des BARRES', () => {
    // Semer les trois natures d un coup proposerait « Part de barres » dans la liste des styles
    // d une couronne : un reglage sans effet, ce qui est la pire chose a offrir a un auteur.
    const sankey = buildParts(buildSource(), [
      { id: 'n_ble', label: 'Ble', value: 6 }
    ], undefined, 'donut').document.drawing_area.sankey
    const ids = sankey.styles_list.map(s => s.id)

    expect(ids).toContain(DonutPartStyle)
    expect(ids).not.toContain(BarPartStyle)
    expect(ids).not.toContain(SunburstPartStyle)
  })

  it('une nature inconnue sen tient au generique, sans rien casser', () => {
    // C est ce qui permet d ajouter les natures UNE A LA FOIS : celle qui n a pas encore son style
    // garde exactement l aspect d avant ce lot.
    const part = buildParts(buildSource(), [
      { id: 'x', label: 'X', value: 1 }
    ], undefined, 'nature_qui_nexiste_pas').by_id['x']

    expect(part.style.map(s => s.id)).toEqual(['default', FigurePartStyle])
  })
})
