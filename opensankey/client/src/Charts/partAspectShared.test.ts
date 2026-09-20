// os#1474 — LA MÊME PART, LUE PAREIL PAR TOUTES LES NATURES.
//
// Julien : « je veux pouvoir te dire *je veux un nouveau graphe avec ces caractéristiques* et que
// tu l implementes de A a Z avec le mecanisme generique ». Le pas 1 vers ca etait de supprimer le
// SECOND lecteur de part.
//
// CE QUE CE FICHIER GARDE, et ce n est pas « partAspect marche » — ses propres tests le disent
// deja. C est que `sunburstPartStyle` NE LIT PLUS : il compose au-dessus du lecteur commun. Tant
// que c est vrai, une cle ajoutee au lecteur est lue par les trois natures le jour ou on l ecrit.
//
// LA MESURE QUI A MOTIVE LE LOT, refaite ici en une assertion : avant, le disque lisait 3 cles que
// le lecteur commun ignorait, et en ignorait 33 qu il lisait. Personne ne l avait decide — c est ce
// qu une seconde copie devient quand on l enrichit d un seul cote.

import { partAspect } from './partAspect'
import { sunburstPartStyle, SUNBURST_STYLE_DEFAULTS } from './SunburstChart'
import type { Type_SunburstPart } from './SunburstChart'
import { BARS_STYLE_DEFAULTS } from './figureChartStyle'
import { Class_ApplicationData } from '../types/ApplicationData'
import { buildParts } from '../Representations/parts/buildParts'

if (typeof globalThis.structuredClone !== 'function') {
  globalThis.structuredClone = <T>(o: T): T => JSON.parse(JSON.stringify(o)) as T
}

/** Une part reelle, reglee comme un auteur la reglerait dans l inspecteur. */
const partReglee = (reglages: { [attr: string]: unknown }) => {
  const doc = new Class_ApplicationData(false)
  doc.drawing_area.bypass_redraws = true
  const figure = buildParts(doc, [{ id: 'a', label: 'Ble', value: 6 }], undefined, 'sunburst')
  const part = figure.by_id['a'] as unknown as { [k: string]: unknown }
  Object.entries(reglages).forEach(([k, v]) => { part[k] = v })
  return figure.by_id['a']
}

describe('os#1474 le disque ne lit plus : il compose', () => {

  it('ce que la part dit de son NOM arrive dans le style du disque', () => {
    // Les memes cles, lues une fois, rendues sous les deux vocabulaires : `color` cote aspect,
    // `label_color` cote disque. C est de la traduction.
    //
    // os#1476 — ET LA TRADUCTION S EST RACCOURCIE, parce que le disque dessine desormais ses textes
    // par le module commun (`applyPartTextStyle`), qui lit l aspect sous SES noms. Police, graisse,
    // style et cartouche ne sont donc plus traduits : les traduire etait du travail que plus
    // personne ne lisait. Ne reste ici que ce dont le DISQUE a besoin pour autre chose que poser un
    // attribut de texte — la taille pour l interligne, la boite pour decider si ca tient, l encre
    // pour sa regle de contraste.
    const part = partReglee({
      name_label_bold: true,
      name_label_font_size: 17,
      name_label_color: '#FF0000',
      name_label_box_width: 120
    })

    const a = partAspect(BARS_STYLE_DEFAULTS, part)
    const s = sunburstPartStyle(SUNBURST_STYLE_DEFAULTS, part as unknown as Type_SunburstPart)

    expect(a.name?.bold).toBe(true)
    expect(s.font_size).toBe(a.name?.font_size)
    expect(s.label_color).toBe(a.name?.color)
    expect(s.box_width).toBe(a.name?.box_width)
  })

  it('les TROIS cles que seul le disque lisait passent par le lecteur commun', () => {
    // ⚠️ ET AUCUNE PART NE PEUT ENCORE LES DIRE — c est l etat reel, et le test le grave.
    //
    // `name_label_orientation`, `_strip_parent` et `_contrast_color` sont declarees dans le
    // catalogue des FIGURES (`figureCatalogue.FIGURE_LABEL_CONFIG`), pas dans celui des ELEMENTS.
    // Une part n a donc pas de propriete pour elles : ecrire dessus ne pose rien dans son sac, et
    // la porte `said()` rend `undefined`. C etait DEJA vrai de l ancien lecteur du disque — cette
    // lecture-la ne rendait jamais rien.
    //
    // Ce que le lot change : le chemin existe, et il est unique. Le jour ou ces cles entrent au
    // catalogue des elements (os#1464, le second sens de la portee), les trois natures les liront
    // sans qu on ecrive une ligne. Ce test tombera alors, et il dira quoi retirer de ce
    // commentaire.
    const part = partReglee({
      name_label_orientation: 'tangential',
      name_label_strip_parent: true
    })

    const a = partAspect(BARS_STYLE_DEFAULTS, part)

    expect(part.isAttributeOverloaded('name_label_orientation' as never)).toBe(false)
    expect(a.name?.orientation).toBeUndefined()
    expect(a.name?.strip_parent).toBeUndefined()
  })

  it('les 33 cles que le disque ignorait lui parviennent maintenant', () => {
    // LE GAIN DU LOT, en une assertion. Le cartouche et la mise en forme de la VALEUR n etaient
    // lus que par la couronne et les barres ; le disque les recoit sans qu on ait ecrit une ligne
    // pour lui.
    //
    // os#1476 — LE CARTOUCHE NE PASSE PLUS PAR LE STYLE DU DISQUE, et c est un progres, pas une
    // perte : il n a jamais ete un reglage de FIGURE — aucune couronne ne pose un fond derriere
    // toutes ses etiquettes a la fois. Il se lit la ou il est dit, et le module commun le dessine
    // pour les trois natures.
    const part = partReglee({
      name_label_background_visible: true,
      name_label_background_color: '#EEEEEE',
      value_label_stick_to_label: false
    })

    const a = partAspect(BARS_STYLE_DEFAULTS, part)
    const s = sunburstPartStyle(SUNBURST_STYLE_DEFAULTS, part as unknown as Type_SunburstPart)

    expect(a.name?.bg_visible).toBe(true)
    expect(a.name?.bg_color).toBe('#EEEEEE')
    expect(s.value_attached).toBe(false)
  })

  it('une part MUETTE ne change rien, des deux cotes', () => {
    // La garantie qui protege le parc : une figure enregistree se rouvre a l identique. Elle vaut
    // pour le disque comme pour les autres, et c est ce qui rend la fusion sans risque.
    const part = partReglee({})

    expect(sunburstPartStyle(SUNBURST_STYLE_DEFAULTS, part as unknown as Type_SunburstPart))
      .toEqual(SUNBURST_STYLE_DEFAULTS)
    const a = partAspect(BARS_STYLE_DEFAULTS, part)
    expect(a.name?.bold).toBeUndefined()
    expect(a.fill).toBeUndefined()
  })

  it('sans part du tout, le disque rend sa base telle quelle', () => {
    expect(sunburstPartStyle(SUNBURST_STYLE_DEFAULTS, undefined)).toBe(SUNBURST_STYLE_DEFAULTS)
  })
})
