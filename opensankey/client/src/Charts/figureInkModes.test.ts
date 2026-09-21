// os#1480 — LES VINGT-QUATRE CLES « A TRANCHER » SONT TRANCHEES.
//
// C etait le pas 8 du cap, et le seul qui n etait pas du code : une decision de Julien, prise le
// 21/09/2026. Ce fichier grave ce qui a ete decide, et surtout POURQUOI — c est ce qui manquera
// dans dix-huit mois, quand quelqu un se demandera ou est passee « Couleur fixe ».
//
// ── LE PARTAGE ───────────────────────────────────────────────────────────────────────────────
//
//   18 masquees : les 16 qui font d une etiquette une image, un bloc HTML ou un pictogramme
//                 (doublon de la famille `icon`, qui marche), et les 2 « Couleur fixe » posees sur
//                 la FORME d une part — celles-la ne veulent rien dire, la part EST la forme ;
//    6 ecrites  : les « Couleur fixe » posees sur un TEXTE. Decochees, elles demandent a l encre de
//                 suivre la couleur de la part, et c est le troisieme mode qui manquait.
//
// ⚠️ ET LE TROISIEME MODE NE VAUT QUE DEHORS. Ecrire le nom d un secteur dans la couleur de ce
// secteur le rend invisible. Au bout d un trait de rappel, au contraire, c est le plus lisible :
// rien n y sert de fond a contraster, et la couleur RATTACHE l etiquette a la part qu elle nomme.

import { calloutInk } from './figurePartText'
import { partAspect } from './partAspect'
import { BARS_STYLE_DEFAULTS } from './figureChartStyle'
import { attributeAppliesToElements } from '../Elements/attributeScope'
import { Class_ApplicationData } from '../types/ApplicationData'
import { buildParts } from '../Representations/parts/buildParts'

if (typeof globalThis.structuredClone !== 'function') {
  globalThis.structuredClone = <T>(o: T): T => JSON.parse(JSON.stringify(o)) as T
}

/** Une part reelle, reglee comme un auteur la reglerait dans l inspecteur. */
const partReglee = (reglages: { [attr: string]: unknown }) => {
  const doc = new Class_ApplicationData(false)
  doc.drawing_area.bypass_redraws = true
  const figure = buildParts(doc, [{ id: 'a', label: 'Ble', value: 6 }], undefined, 'donut')
  const part = figure.by_id['a'] as unknown as { [k: string]: unknown }
  Object.entries(reglages).forEach(([k, v]) => { part[k] = v })
  return figure.by_id['a']
}

describe('os#1480 les six cles « Couleur fixe » dun TEXTE sont ecoutees', () => {

  it('DECOCHEE, l encre suit la couleur de la part', () => {
    // LA POLARITE EST INVERSEE, et c est le piege de cette cle : elle dit « garde ta couleur »,
    // donc c est sa valeur FAUSSE qui demande de suivre la forme.
    const part = partReglee({ name_label_color_sustainable: false })

    const a = partAspect(BARS_STYLE_DEFAULTS, part)

    expect(a.name?.ink_follows_shape).toBe(true)
    expect(calloutInk(a.name, '#4472C4', '#2D3748')).toBe('#4472C4')
  })

  it('COCHEE, elle ne demande rien : le trace garde son repli', () => {
    // Cochee est la valeur d usine, et c est ce que fait le trace depuis toujours. Une figure deja
    // enregistree ne doit pas changer d aspect parce qu on a branche la cle.
    const part = partReglee({ name_label_color_sustainable: true })

    const a = partAspect(BARS_STYLE_DEFAULTS, part)

    expect(a.name?.ink_follows_shape).toBeUndefined()
    expect(calloutInk(a.name, '#4472C4', '#2D3748')).toBe('#2D3748')
  })

  it('une part MUETTE ne change rien', () => {
    // La garantie qui protege le parc, celle de tous les lots de ce chantier.
    const a = partAspect(BARS_STYLE_DEFAULTS, partReglee({}))

    expect(a.name?.ink_follows_shape).toBeUndefined()
    expect(calloutInk(a.name, '#4472C4', '#2D3748')).toBe('#2D3748')
  })

  it('UNE TEINTE IMPOSEE GAGNE sur « suivre la part »', () => {
    // Trois modes, un ordre : ce que l auteur NOMME l emporte sur ce qu il fait calculer. Sans cet
    // ordre, decocher une case effacerait silencieusement une couleur choisie a la main.
    const part = partReglee({
      name_label_color_sustainable: false,
      name_label_color: '#B7410E'
    })

    const a = partAspect(BARS_STYLE_DEFAULTS, part)

    expect(calloutInk(a.name, '#4472C4', '#2D3748')).toBe('#B7410E')
  })

  it('sans couleur de part connue, on ne rend pas une encre vide', () => {
    // Un trace peut ne pas savoir la couleur d une part (palette non resolue, part residuelle) :
    // mieux vaut le repli que du texte invisible.
    const part = partReglee({ name_label_color_sustainable: false })

    const a = partAspect(BARS_STYLE_DEFAULTS, part)

    expect(calloutInk(a.name, undefined, '#2D3748')).toBe('#2D3748')
  })

  it('le repli se lit AUSSI sur la mise en forme de la figure', () => {
    // Les deux formes d appel que les traces utilisent : une couleur nue (le disque) ou le style de
    // la figure (la couronne et les barres, qui portent `name_label_color`).
    expect(calloutInk(undefined, '#4472C4', { name_label_color: '#123456' })).toBe('#123456')
    expect(calloutInk(undefined, '#4472C4', { name_label_color: '' })).toBe('#2D3748')
  })
})

describe('os#1480 les dix-huit cles tranchees vers le masquage', () => {

  const part = () => partReglee({})

  it('L ETIQUETTE NE DEVIENT PAS UNE IMAGE NI DU HTML (14 cles)', () => {
    // Machinerie d etiquette d un NOEUD, jamais demandee sur une figure, et lourde a dessiner : un
    // `foreignObject` ne se mesure pas comme un texte, et l export PNG ne le rend pas.
    const p = part()
    const jamais = ['has_fo', 'fo_content', 'is_icon', 'is_image', 'image_src', 'is_value']
    jamais.forEach(suffixe => {
      expect([suffixe, attributeAppliesToElements([p], `name_label_${suffixe}`)])
        .toEqual([suffixe, false])
      expect([suffixe, attributeAppliesToElements([p], `value_label_${suffixe}`)])
        .toEqual([suffixe, false])
    })
  })

  it('LE PICTOGRAMME A UN SEUL CHEMIN, et c est la famille Icone (2 cles)', () => {
    // Offrir un second chemin vers le meme reglage est le defaut que ce chantier a passe sept lots
    // a supprimer : l auteur ne saurait pas lequel des deux agit.
    const p = part()
    expect(attributeAppliesToElements([p], 'name_label_icon_name')).toBe(false)
    expect(attributeAppliesToElements([p], 'name_label_view_box')).toBe(false)
    expect(attributeAppliesToElements([p], 'value_label_icon_name')).toBe(false)
    expect(attributeAppliesToElements([p], 'value_label_view_box')).toBe(false)
    // Celui qui marche, et que les trois natures lisent depuis os#1465.
    expect(attributeAppliesToElements([p], 'icon_icon_name')).toBe(true)
    expect(attributeAppliesToElements([p], 'icon_view_box')).toBe(true)
  })

  it('« COULEUR FIXE » SUR LA FORME se mord la queue (2 cles)', () => {
    // Le drapeau dit « garde ta couleur au lieu de suivre celle de la forme ». Sur une part, la
    // forme EST l element : decocher demanderait au secteur de suivre sa propre couleur.
    const p = part()
    expect(attributeAppliesToElements([p], 'shape_color_sustainable')).toBe(false)
    expect(attributeAppliesToElements([p], 'shape_border_color_sustainable')).toBe(false)
    // Mais les copies sous un prefixe d ETIQUETTE disent quelque chose, et restent offertes.
    expect(attributeAppliesToElements([p], 'name_label_color_sustainable')).toBe(true)
    expect(attributeAppliesToElements([p], 'value_label_color_sustainable')).toBe(true)
  })

  it('LE GARDE-FOU : un noeud et un flux ne perdent rien de tout cela', () => {
    // Toutes ces portees sont des `except: ['part']`. Le diagramme garde son Rich Text, ses images
    // et ses couleurs fixes — c est la ou elles ont toujours servi.
    const doc = new Class_ApplicationData(false)
    doc.drawing_area.bypass_redraws = true
    const sankey = doc.drawing_area.sankey
    const amont = sankey.addNewNode('amont', 'Amont')
    const aval = sankey.addNewNode('aval', 'Aval')
    const flux = sankey.addNewLink(amont, aval)
    const cles = [
      'name_label_has_fo', 'name_label_is_image', 'name_label_icon_name',
      'shape_color_sustainable', 'shape_border_color_sustainable'
    ]
    cles.forEach(cle => {
      expect([cle, attributeAppliesToElements([amont], cle)]).toEqual([cle, true])
      expect([cle, attributeAppliesToElements([flux], cle)]).toEqual([cle, true])
    })
  })
})
