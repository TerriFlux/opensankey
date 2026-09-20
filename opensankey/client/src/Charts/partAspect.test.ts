// os#1451 — UN HISTOGRAMME ENREGISTRE NE CHANGE PAS D ASPECT.
//
// C est LA question du lot, et elle se joue sur un detail : les valeurs d usine d un ELEMENT ne
// sont pas celles du TRACE. Un element ecrit en quatorze points, a 0,85 d opacite ; un histogramme
// en dix points, a 1. Si le trace lisait l aspect de ses parts sans reserve, toutes les figures du
// parc changeraient d aspect en silence, sans que personne n ait touche a rien.
//
// LA PORTE EST `isAttributeOverloaded` : une part n est ecoutee que sur ce qu elle porte EN PROPRE.
// Ces tests verifient les deux faces de la garantie — une part fraiche ne dit RIEN, et une part
// reglee ne parle que pour elle.

import {
  BARS_STYLE_DEFAULTS, labelTextWidthPx, wrapLabelToBox
} from './figureChartStyle'
import type { Type_FigureValueFormat } from './figureFormat'
import { buildParts } from '../Representations/parts/buildParts'
import { Class_ApplicationData } from '../types/ApplicationData'

import { partAspect, partAspectResolver } from './partAspect'

if (typeof globalThis.structuredClone !== 'function') {
  globalThis.structuredClone = <T>(o: T): T => JSON.parse(JSON.stringify(o)) as T
}

const buildSource = () => {
  const doc = new Class_ApplicationData(false)
  doc.drawing_area.bypass_redraws = true
  return doc
}

/**
 * Poser une cle que la classe NE DECLARE PAS en TypeScript mais qu elle porte a l execution.
 *
 * `createDynamicProperties` definit une propriete d instance par cle d `ALL_ATTRIBUTES_CONFIG` ;
 * `Element.tsx`, lui, n en declare qu une partie en champs types — `name_label_wrap_long_words` et
 * `name_label_prune_if_unfitting` en font partie. L affectation passe donc par le vrai setter, et
 * `isAttributeOverloaded` la voit comme n importe quelle autre.
 */
const setAttr = (part: object, key: string, value: unknown) => {
  (part as { [k: string]: unknown })[key] = value
}

const twoParts = () => buildParts(buildSource(), [
  { id: 'l_ble', label: 'Ble', value: 6 },
  { id: 'l_mais', label: 'Mais', value: 4 }
])

describe('os#1451 sans parts le trace est celui dhier', () => {

  it('aucune part : la mise en forme de la figure passe telle quelle', () => {
    const aspect = partAspect(BARS_STYLE_DEFAULTS)

    expect(aspect.style).toBe(BARS_STYLE_DEFAULTS)
    expect(aspect.fill).toBeUndefined()
    expect(aspect.opacity).toBeUndefined()
    expect(aspect.border_color).toBeUndefined()
  })

  it('une part fraiche ne dit RIEN, et la figure garde le dernier mot', () => {
    // LE POINT CRITIQUE. La preuve que le piege est reel tient dans la premiere ligne : une part
    // RESOUT une couleur de forme et un lisere (ceux d un element, ou ceux de l amorce de son
    // style) alors qu un histogramme n en a jamais eu. Lire son aspect sans reserve repeindrait
    // donc toutes les barres du parc et les cernerait.
    const figure = twoParts()
    const part = figure.by_id['l_ble']

    expect(typeof part.getElementProperty('shape_color')).toBe('string')

    const aspect = partAspect(BARS_STYLE_DEFAULTS, part)

    expect(aspect.style).toEqual(BARS_STYLE_DEFAULTS)
    expect(aspect.fill).toBeUndefined()
    expect(aspect.opacity).toBeUndefined()

    figure.document.dispose()
  })
})

describe('os#1451 une barre peut differer des autres', () => {

  it('une part qui porte un reglage le fait valoir, et elle seule', () => {
    // L objet meme du lot : l aspect d UNE barre peut differer de celui des autres.
    const figure = twoParts()
    figure.by_id['l_ble'].name_label_font_size = 22
    figure.by_id['l_ble'].shape_opacity = 0.5
    figure.by_id['l_ble'].shape_color = '#FF0000'

    const reglee = partAspect(BARS_STYLE_DEFAULTS, figure.by_id['l_ble'])
    const voisine = partAspect(BARS_STYLE_DEFAULTS, figure.by_id['l_mais'])

    expect(reglee.style.name_label_font_size).toBe(22)
    expect(reglee.opacity).toBe(0.5)
    expect(reglee.fill).toBe('#FF0000')
    // La voisine n a rien demande : elle garde la mise en forme de la figure, et sa couleur reste
    // celle du modele ou de la palette.
    expect(voisine.style).toEqual(BARS_STYLE_DEFAULTS)
    expect(voisine.fill).toBeUndefined()

    figure.document.dispose()
  })

  it('os#1453 cacher le FOND de la part se lit dans laspect', () => {
    // Julien, a l ecran : « je clique sur Fond pour cacher le fond, ca ne fait rien ». On lisait la
    // COULEUR du fond et son opacite, jamais sa VISIBILITE : la case etait offerte a l auteur sans
    // que rien ne l ecoute. Et elle se lit SEPAREMENT de la couleur — une part qui cache son fond
    // sans avoir choisi de couleur ne dit rien de `fill`, donc passer par `fill` ne pourrait pas
    // distinguer « pas de fond » de « la figure decide ».
    const figure = twoParts()
    figure.by_id['l_ble'].shape_color_visible = false

    const cachee = partAspect(BARS_STYLE_DEFAULTS, figure.by_id['l_ble'])
    const voisine = partAspect(BARS_STYLE_DEFAULTS, figure.by_id['l_mais'])

    expect(cachee.background_visible).toBe(false)
    expect(cachee.fill).toBeUndefined()
    // Et la voisine n a rien dit : la figure garde le dernier mot, comme pour tout le reste.
    expect(voisine.background_visible).toBeUndefined()

    figure.document.dispose()
  })

  it('le lisere ne sort que si la part en veut un', () => {
    // Un histogramme n a jamais eu de lisere : lui en donner un par defaut se verrait sur tout le
    // parc. Or l amorce du style de part porte deja « lisere blanc visible » — l aspect d une
    // COURONNE — mais une amorce est MUETTE (os#1449). Une barre fraiche n a donc pas de lisere,
    // et il n apparait que quand la part dit quelque chose de lui.
    const figure = twoParts()
    const sans = partAspect(BARS_STYLE_DEFAULTS, figure.by_id['l_ble'])
    expect(sans.border_color).toBeUndefined()
    expect(sans.border_thickness).toBeUndefined()

    figure.by_id['l_ble'].shape_border_color = '#00FF00'
    const avec = partAspect(BARS_STYLE_DEFAULTS, figure.by_id['l_ble'])

    expect(avec.border_color).toBe('#00FF00')
    expect(avec.border_thickness).toBeGreaterThan(0)

    figure.document.dispose()
  })
})

describe('os#1451 la frontiere part graphe', () => {

  it('une part reglee ne touche a rien de ce qui repartit les barres entre elles', () => {
    // Ordre, repliement, source des couleurs, echelle, legende, mentions, info-bulle : ce sont des
    // reglages du GRAPHE. Un reglage qui, pose sur une seule barre, rendrait le graphique faux ou
    // incoherent n appartient pas a la part.
    const base = { ...BARS_STYLE_DEFAULTS, parts_order: 'name' as const, scale_factor: 60 }
    const figure = twoParts()
    figure.by_id['l_ble'].name_label_font_size = 22
    figure.by_id['l_ble'].shape_opacity = 0.5

    const aspect = partAspect(base, figure.by_id['l_ble'])

    expect(aspect.style.parts_order).toBe('name')
    expect(aspect.style.scale_factor).toBe(60)
    expect(aspect.style.parts_color_source).toBe(base.parts_color_source)
    expect(aspect.style.parts_max).toBe(base.parts_max)
    expect(aspect.style.legend_visible).toBe(base.legend_visible)
    expect(aspect.style.notes_visible).toBe(base.notes_visible)
    expect(aspect.style.interaction_tooltip).toBe(base.interaction_tooltip)

    figure.document.dispose()
  })

  it('le resolveur rend laspect barre par barre, et le repli hors des parts connues', () => {
    // C est la forme que le trace attend : il demande, pour l identifiant qu il dessine, l aspect a
    // appliquer. Un identifiant qu aucune part ne porte retombe sur la figure.
    const figure = twoParts()
    figure.by_id['l_mais'].name_label_font_size = 33
    const aspectOf = partAspectResolver(BARS_STYLE_DEFAULTS, figure.by_id)

    expect(aspectOf('l_mais').style.name_label_font_size).toBe(33)
    expect(aspectOf('l_ble').style).toEqual(BARS_STYLE_DEFAULTS)
    expect(aspectOf('inconnu').style).toBe(BARS_STYLE_DEFAULTS)

    figure.document.dispose()
  })
})

// os#1462 — « BORDURE » DECOCHE DOIT ARRIVER JUSQU AU TRACE.
//
// Julien, a l ecran : « Fond et Bordure n agissent pas sur l element ». Pour la bordure, le chemin
// manquait purement et simplement : l aspect rendait une couleur et une epaisseur, jamais la
// VISIBILITE. Une couronne separe ses secteurs de blanc par defaut ; sans cette cle, decocher ne
// pouvait rien retirer.
describe('os#1462 le lisere dune part, dans les deux sens', () => {

  it('la part ne dit rien : la figure decide, et on ne dit rien pour elle', () => {
    const figure = twoParts()

    expect(partAspect(BARS_STYLE_DEFAULTS, figure.by_id['l_ble']).border_visible)
      .toBeUndefined()

    figure.document.dispose()
  })

  it('la part decoche Bordure : le trace doit lentendre', () => {
    // LE CAS QUI MANQUAIT. Distinct du precedent : `false` n est pas « absent ».
    const figure = twoParts()
    figure.by_id['l_ble'].shape_border_visible = false

    const aspect = partAspect(BARS_STYLE_DEFAULTS, figure.by_id['l_ble'])
    expect(aspect.border_visible).toBe(false)
    expect(aspect.border_color).toBeUndefined()

    figure.document.dispose()
  })

  it('la part ne choisit quune couleur : elle en veut un', () => {
    // Le seul sens possible du geste — choisir la couleur d un lisere qu on ne veut pas n en a
    // aucun.
    const figure = twoParts()
    figure.by_id['l_ble'].shape_border_color = '#00FF00'

    const aspect = partAspect(BARS_STYLE_DEFAULTS, figure.by_id['l_ble'])
    expect(aspect.border_visible).toBe(true)
    expect(aspect.border_color).toBe('#00FF00')

    figure.document.dispose()
  })
})

// os#1463 — LA TYPOGRAPHIE ET LE FORMAT DE LA VALEUR, PART PAR PART.
//
// Le sunburst lisait deja une vingtaine de cles sur un secteur ; la couronne d OS+ et les barres
// n en lisaient que quatre. Regler la police ou les decimales d un secteur etait donc un geste sans
// effet. Ce qui suit verifie les deux faces de la garantie, comme plus haut : une part fraiche ne
// dit RIEN de sa typographie ni de son format, et une part reglee ne parle que pour elle.
describe('os#1463 la typographie dune part', () => {

  it('une part qui na rien dit ne dit rien de sa typographie', () => {
    // LE POINT CRITIQUE, et il vaut ici plus qu ailleurs : une part RESOUT une police, une encre et
    // une casse — celles d un element, ou celles de l amorce de son style — alors qu une couronne
    // ecrit en blanc, dans la police de la page, sur une ligne. Les lire sans reserve changerait
    // l aspect de toutes les figures du parc.
    const figure = twoParts()
    const part = figure.by_id['l_ble']

    expect(typeof part.getElementProperty('name_label_font_family')).toBe('string')
    expect(typeof part.getElementProperty('name_label_color')).toBe('string')

    const aspect = partAspect(BARS_STYLE_DEFAULTS, part)

    expect(aspect.name?.font_family).toBeUndefined()
    expect(aspect.name?.bold).toBeUndefined()
    expect(aspect.name?.italic).toBeUndefined()
    expect(aspect.name?.uppercase).toBeUndefined()
    expect(aspect.name?.color).toBeUndefined()
    expect(aspect.name?.box_width).toBeUndefined()
    expect(aspect.name?.separator).toBeUndefined()
    expect(aspect.name?.separator_part).toBeUndefined()

    figure.document.dispose()
  })

  it('la police, la casse, le gras et lencre se lisent part par part', () => {
    const figure = twoParts()
    figure.by_id['l_ble'].name_label_font_family = 'Georgia'
    figure.by_id['l_ble'].name_label_bold = true
    figure.by_id['l_ble'].name_label_italic = true
    figure.by_id['l_ble'].name_label_uppercase = true
    figure.by_id['l_ble'].name_label_color = '#123456'

    const reglee = partAspect(BARS_STYLE_DEFAULTS, figure.by_id['l_ble'])
    const voisine = partAspect(BARS_STYLE_DEFAULTS, figure.by_id['l_mais'])

    expect(reglee.name?.font_family).toBe('Georgia')
    expect(reglee.name?.bold).toBe(true)
    expect(reglee.name?.italic).toBe(true)
    expect(reglee.name?.uppercase).toBe(true)
    expect(reglee.name?.color).toBe('#123456')
    // La voisine n a rien demande : le trace lui ecrit son etiquette comme hier.
    expect(voisine.name?.font_family).toBeUndefined()
    expect(voisine.name?.color).toBeUndefined()

    figure.document.dispose()
  })

  it('la coupe des mots longs et le masquage sarretent a la porte, comme le reste', () => {
    // Deux cles que le trace lit desormais, et deux fois la meme garantie : tant que la part ne les
    // dit pas, le trace fait ce qu il faisait — le mot deborde, rien ne se masque.
    const figure = twoParts()
    const muette = partAspect(BARS_STYLE_DEFAULTS, figure.by_id['l_ble'])

    expect(muette.name?.wrap_long_words).toBeUndefined()
    expect(muette.name?.prune_if_unfitting).toBeUndefined()

    setAttr(figure.by_id['l_ble'], 'name_label_wrap_long_words', true)
    setAttr(figure.by_id['l_ble'], 'name_label_prune_if_unfitting', true)
    const reglee = partAspect(BARS_STYLE_DEFAULTS, figure.by_id['l_ble'])

    expect(reglee.name?.wrap_long_words).toBe(true)
    expect(reglee.name?.prune_if_unfitting).toBe(true)
    // La voisine n a rien demande.
    expect(partAspect(BARS_STYLE_DEFAULTS, figure.by_id['l_mais']).name?.prune_if_unfitting)
      .toBeUndefined()

    figure.document.dispose()
  })

  it('name_label_callout nest pas encore un attribut delement, et laspect le montre', () => {
    // CE QUI MANQUE, ECRIT NOIR SUR BLANC. L etiquette detachee est declaree dans `figureCatalogue`
    // (cle de FIGURE) et pas dans `ElementsAttributesConfig` (attribut d ELEMENT) — comme
    // `name_label_contrast_color`. Une part ne peut donc pas la dire, et le trace retombe sur le
    // reglage de la figure. Le jour ou `callout` entrera dans le catalogue des elements, ce test
    // changera de reponse et le trace, lui, n aura rien a apprendre.
    const figure = twoParts()

    expect(partAspect(BARS_STYLE_DEFAULTS, figure.by_id['l_ble']).label_callout)
      .toBeUndefined()

    figure.document.dispose()
  })

  it('le separateur et la boite de texte arrivent jusquau trace', () => {
    // Deux reglages que la couronne offrait sans les ecouter : le nom se reduit a ce qui suit le
    // separateur, et le texte revient a la ligne au-dela de la boite.
    const figure = twoParts()
    figure.by_id['l_ble'].name_label_separator = ' - '
    figure.by_id['l_ble'].name_label_separator_part = 'before'
    figure.by_id['l_ble'].name_label_box_width = 80

    const aspect = partAspect(BARS_STYLE_DEFAULTS, figure.by_id['l_ble'])

    expect(aspect.name?.separator).toBe(' - ')
    expect(aspect.name?.separator_part).toBe('before')
    expect(aspect.name?.box_width).toBe(80)

    figure.document.dispose()
  })
})

describe('os#1463 la boite de texte coupe entre les mots', () => {

  it('une boite absente rend la ligne telle quelle', () => {
    // C est la garantie du reglage : tant que personne ne le pose, rien ne change.
    expect(wrapLabelToBox('Transformation du ble', 0, 11)).toEqual(['Transformation du ble'])
    expect(wrapLabelToBox('Transformation du ble', -1, 11)).toEqual(['Transformation du ble'])
  })

  it('une boite posee coupe entre les mots, et jamais dans un mot', () => {
    // 60 px a 10 points valent dix caracteres (0,6 px par point, la mesure du sunburst).
    expect(wrapLabelToBox('Ble tendre hiver', 60, 10)).toEqual(['Ble tendre', 'hiver'])
    // Un mot plus long que la boite deborde plutot que de perdre de l information.
    expect(wrapLabelToBox('Transformation', 60, 10)).toEqual(['Transformation'])
  })

  it('name_label_wrap_long_words coupe DANS le mot, et seulement sur demande', () => {
    // Le defaut laisse deborder — c est ce que le trace faisait quand la boite n existait pas.
    expect(wrapLabelToBox('Transformation', 60, 10, true)).toEqual(['Transforma', 'tion'])
    expect(wrapLabelToBox('Ble Transformation', 60, 10, true))
      .toEqual(['Ble', 'Transforma', 'tion'])
  })

  it('la largeur approchee dun texte suit la mesure du sunburst', () => {
    // Sert a « masquer si ca depasse », jamais a placer quoi que ce soit : mesurer pour de vrai
    // demanderait un noeud dans le DOM, donc un reflow par etiquette.
    expect(labelTextWidthPx('abcde', 10)).toBeCloseTo(30)
    expect(labelTextWidthPx('', 10)).toBe(0)
  })
})

describe('os#1463 le format de valeur dune part', () => {

  /** Un format de FIGURE qui ne ressemble pas aux valeurs d usine : un chiffre, et une unite. */
  const figureFormat = (): Type_FigureValueFormat => ({
    significant_digits: true,
    nb_significant_digits: 1,
    custom_digit: false,
    nb_digit: 0,
    scientific_notation: false,
    unit: 'kt'
  })

  it('sans reglage la part na pas de format a elle', () => {
    // L ABSENCE EST LE MESSAGE : le trace ecrit alors ce nombre comme il ecrit tous les autres.
    // Des cles recomposees l obligeraient a distinguer « regle a la meme valeur » de « pas regle ».
    const figure = twoParts()

    expect(partAspect(BARS_STYLE_DEFAULTS, figure.by_id['l_ble']).value_format).toBeUndefined()
    expect(
      partAspect(BARS_STYLE_DEFAULTS, figure.by_id['l_ble'], { format: figureFormat() })
        .value_format
    ).toBeUndefined()

    figure.document.dispose()
  })

  it('la part impose ses decimales et herite du reste de la FIGURE', () => {
    // Regler une case ne doit pas en defausser une autre en silence : les chiffres significatifs et
    // l unite restent ceux de la figure. 87,6 a un chiffre significatif fait 90, puis zero decimale
    // le laisse a 90 — avec les valeurs d usine (quatre chiffres) on lirait 88.
    const figure = twoParts()
    figure.by_id['l_ble'].value_label_custom_digit = true
    figure.by_id['l_ble'].value_label_nb_digit = 0

    const aspect = partAspect(
      BARS_STYLE_DEFAULTS, figure.by_id['l_ble'], { format: figureFormat() }
    )

    expect(aspect.value_format?.(87.6)).toBe('90 kt')
    // Et la voisine n a rien dit : elle reste sans format propre.
    expect(
      partAspect(BARS_STYLE_DEFAULTS, figure.by_id['l_mais'], { format: figureFormat() })
        .value_format
    ).toBeUndefined()

    figure.document.dispose()
  })

  it('la notation scientifique passe avant tout le reste', () => {
    // L ordre du procede, celui des etiquettes d un flux : notation scientifique, puis chiffres
    // significatifs, puis decimales imposees. Les decimales posees ici ne doivent PAS se cumuler.
    const figure = twoParts()
    figure.by_id['l_ble'].value_label_scientific_notation = true
    figure.by_id['l_ble'].value_label_significant_digits = true
    figure.by_id['l_ble'].value_label_nb_significant_digits = 3
    figure.by_id['l_ble'].value_label_custom_digit = true
    figure.by_id['l_ble'].value_label_nb_digit = 0

    const aspect = partAspect(BARS_STYLE_DEFAULTS, figure.by_id['l_ble'])

    expect(aspect.value_format?.(12345)).toBe('1.23e+4')

    figure.document.dispose()
  })

  it('la part peut taire lunite que la figure montre', () => {
    const figure = twoParts()
    figure.by_id['l_ble'].value_label_unit_visible = false

    const aspect = partAspect(
      BARS_STYLE_DEFAULTS, figure.by_id['l_ble'], { format: figureFormat() }
    )

    expect(aspect.value_format?.(12)).toBe('10')

    figure.document.dispose()
  })
})

// os#1463 — « LES ATTRIBUTS UNITES, CA NE MARCHE PAS » (Julien, a l ecran).
//
// On savait MONTRER ou CACHER l unite — `value_label_unit_visible` etait la seule cle lue — mais
// personne ne lisait LAQUELLE : ni `value_label_unit`, ni `value_label_unit_type`. Nommer l unite
// d un secteur etait donc un geste sans effet, au sunburst comme a la couronne.
describe('os#1463 lunite dune part', () => {

  const figureFormat = (): Type_FigureValueFormat => ({
    significant_digits: true,
    nb_significant_digits: 1,
    custom_digit: false,
    nb_digit: 0,
    scientific_notation: false,
    // Le symbole DEJA RESOLU par la figure : c est sur lui que la part se pose.
    unit: 'kt'
  })

  it('une part qui na rien dit garde lunite de la figure', () => {
    const figure = twoParts()
    figure.by_id['l_ble'].value_label_nb_digit = 2

    const aspect = partAspect(
      BARS_STYLE_DEFAULTS, figure.by_id['l_ble'], { format: figureFormat() }
    )

    expect(aspect.value_format?.(87.6)).toBe('90 kt')

    figure.document.dispose()
  })

  it('une part qui NOMME son unite la fait ecrire, et la montre sans quon coche', () => {
    // Le cas 3 de la doctrine du lisere, applique a l unite : choisir une unite qu on ne veut pas
    // voir n a aucun sens, donc la nommer vaut la demander.
    const figure = twoParts()
    figure.by_id['l_ble'].value_label_unit_type = 'unit_name'
    figure.by_id['l_ble'].value_label_unit = 'GWh'

    const reglee = partAspect(
      BARS_STYLE_DEFAULTS, figure.by_id['l_ble'], { format: figureFormat() }
    )
    const voisine = partAspect(
      BARS_STYLE_DEFAULTS, figure.by_id['l_mais'], { format: figureFormat() }
    )

    expect(reglee.value_format?.(87.6)).toBe('90 GWh')
    // Et la voisine n a rien dit : pas de format propre, donc l unite de la figure.
    expect(voisine.value_format).toBeUndefined()

    figure.document.dispose()
  })

  it('en unit_model sans registre on garde lunite de la figure, jamais lidentifiant', () => {
    // LE PIEGE. `unit_model` est le DEFAUT du catalogue, et `value_label_unit` y porte un ID que
    // seul `sankey.units` sait resoudre — or le document de parts a son propre registre, vide.
    // Ecrire l id serait pire que ne rien ecrire.
    const figure = twoParts()
    figure.by_id['l_ble'].value_label_unit_type = 'unit_model'
    figure.by_id['l_ble'].value_label_unit = 'u_42'

    const aspect = partAspect(
      BARS_STYLE_DEFAULTS, figure.by_id['l_ble'], { format: figureFormat() }
    )

    expect(aspect.value_format?.(87.6)).toBe('90 kt')

    figure.document.dispose()
  })

  it('en unit_model avec le registre, cest le symbole du registre qui sort', () => {
    const figure = twoParts()
    figure.by_id['l_ble'].value_label_unit_type = 'unit_model'
    figure.by_id['l_ble'].value_label_unit = 'u_42'

    const aspect = partAspect(BARS_STYLE_DEFAULTS, figure.by_id['l_ble'], {
      format: figureFormat(),
      resolveUnit: (id) => id === 'u_42' ? 'GWh' : undefined
    })

    expect(aspect.value_format?.(87.6)).toBe('90 GWh')

    figure.document.dispose()
  })

  it('le FACTEUR reste au graphe : une part qui ne dit que lui na pas de format a elle', () => {
    // L ARBITRAGE DU LOT, verifie. Le facteur divise le nombre ecrit sans toucher a la geometrie :
    // pose sur une seule part, il ecrirait sous un secteur visiblement plus grand que son voisin un
    // nombre mille fois plus petit. C est le critere de la frontiere part / graphe.
    const figure = twoParts()
    figure.by_id['l_ble'].value_label_unit_factor = 1000

    const aspect = partAspect(
      BARS_STYLE_DEFAULTS, figure.by_id['l_ble'], { format: figureFormat() }
    )

    expect(aspect.value_format).toBeUndefined()

    figure.document.dispose()
  })
})

// os#1469 — LE NOM ET LA VALEUR SONT DEUX TEXTES, DECRITS PAR LE MEME TYPE.
//
// Julien : « le plus gros trou est la valeur » — 43 cles, police, graisse, casse, encre, placement,
// cartouche, qu aucun trace ne lisait. Le nombre ecrit sous une barre ne se mettait pas en forme du
// tout, alors que son nom le pouvait.
//
// CE QUI EST GARDE ICI N EST PAS « la valeur a une police » mais « LES DEUX MOITIES SONT
// INDEPENDANTES ET COMPLETES ». La correction ne consistait pas a recopier quinze champs sous un
// autre prefixe : c est le MEME lecteur, appele avec l autre prefixe. Deux moities du meme type ne
// peuvent pas diverger — ce qu on ajoute a l une, l autre l a.
describe('os#1469 la valeur dune part sécrit comme son nom', () => {

  it('regler la valeur ne touche pas au nom, et reciproquement', () => {
    const figure = twoParts()
    const part = figure.by_id['l_ble']
    setAttr(part, 'name_label_bold', true)
    setAttr(part, 'value_label_italic', true)
    setAttr(part, 'value_label_color', '#FF0000')

    const aspect = partAspect(BARS_STYLE_DEFAULTS, part)

    expect(aspect.name?.bold).toBe(true)
    expect(aspect.name?.italic).toBeUndefined()
    expect(aspect.value?.italic).toBe(true)
    expect(aspect.value?.color).toBe('#FF0000')
    expect(aspect.value?.bold).toBeUndefined()

    figure.document.dispose()
  })

  it('la valeur porte TOUT ce que porte le nom, sans quon lait reecrit', () => {
    // La preuve de la factorisation : on regle sur la VALEUR des cles qui n avaient jamais ete
    // ecrites pour elle nulle part, et elles repondent — parce que c est le meme lecteur.
    const figure = twoParts()
    const part = figure.by_id['l_ble']
    setAttr(part, 'value_label_font_family', 'Georgia')
    setAttr(part, 'value_label_uppercase', true)
    setAttr(part, 'value_label_inside_vert', true)
    setAttr(part, 'value_label_vert', 'middle')
    setAttr(part, 'value_label_horiz_shift', 7)
    setAttr(part, 'value_label_background_visible', true)
    setAttr(part, 'value_label_background_color', '#EEEEEE')

    const v = partAspect(BARS_STYLE_DEFAULTS, part).value

    expect(v?.font_family).toBe('Georgia')
    expect(v?.uppercase).toBe(true)
    expect(v?.inside).toBe(true)
    expect(v?.vert).toBe('middle')
    expect(v?.shift_x).toBe(7)
    expect(v?.bg_visible).toBe(true)
    expect(v?.bg_color).toBe('#EEEEEE')

    figure.document.dispose()
  })

  it('une part muette ne dit rien, NI du nom NI de la valeur', () => {
    // La garantie du lot, inchangee : un histogramme enregistre se rouvre au pixel.
    const figure = twoParts()

    const aspect = partAspect(BARS_STYLE_DEFAULTS, figure.by_id['l_ble'])

    expect(aspect.name?.font_family).toBeUndefined()
    expect(aspect.value?.font_family).toBeUndefined()
    expect(aspect.value?.color).toBeUndefined()
    expect(aspect.value?.bg_visible).toBeUndefined()

    figure.document.dispose()
  })
})
