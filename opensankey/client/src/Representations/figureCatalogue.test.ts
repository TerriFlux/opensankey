// os#1425 — LE CATALOGUE DES ATTRIBUTS DE FIGURE, et la façon dont une nature y pique.
//
// Deux promesses que ce fichier garde :
//  - le catalogue est COMPLET et TRADUIT : toute entree porte les sept langues (sa#531), et une
//    entree qui se regle par une liste porte ses choix, eux aussi en sept langues ;
//  - une nature qui pique une cle n en redeclare rien : elle recoit le libelle, l infobulle et le
//    controle du catalogue, et ne change que ce qu elle dit changer.

import { ALL_ATTRIBUTES_CONFIG } from '../Elements/ElementsAttributesConfig'
import {
  FIGURE_ATTRIBUTES_CONFIG, LEGEND_CONFIG, PARTS_CONFIG, CENTRE_CONFIG, INTERACTION_CONFIG,
  NOTES_CONFIG, SCALE_CONFIG, FIGURE_LABEL_CONFIG
} from './figureCatalogue'
import { honours } from './figureAttribute'

const LANGS = ['en', 'fr', 'es', 'de', 'it', 'zh-CN', 'ja'] as const

const FIGURE_FAMILIES = {
  ...LEGEND_CONFIG, ...PARTS_CONFIG, ...CENTRE_CONFIG, ...INTERACTION_CONFIG,
  ...NOTES_CONFIG, ...SCALE_CONFIG, ...FIGURE_LABEL_CONFIG
}

describe('le catalogue des attributs de figure', () => {

  test('reprend litteralement tout le catalogue des elements', () => {
    Object.keys(ALL_ATTRIBUTES_CONFIG).forEach(key => {
      expect(FIGURE_ATTRIBUTES_CONFIG[key]).toBeDefined()
    })
  })

  test('chaque famille de figure parle les sept langues, choix compris', () => {
    Object.entries(FIGURE_FAMILIES).forEach(([key, cfg]) => {
      LANGS.forEach(lang => {
        expect([key, lang, (cfg.labels as { [l: string]: string })[lang]]).toEqual(
          [key, lang, expect.any(String)]
        )
        expect([key, lang, (cfg.tooltips as { [l: string]: string })[lang]]).toEqual(
          [key, lang, expect.any(String)]
        )
      })
      cfg.ui?.choices?.forEach(c => LANGS.forEach(lang => {
        expect([key, String(c.value), lang, c.labels[lang]]).toEqual(
          [key, String(c.value), lang, expect.any(String)]
        )
      }))
    })
  })

  test('une cle de famille de figure ne cache aucune cle d element', () => {
    // Une figure « complete » le catalogue des elements ; elle ne le reecrit pas.
    Object.keys(FIGURE_FAMILIES).forEach(key => {
      expect(key in ALL_ATTRIBUTES_CONFIG).toBe(false)
    })
  })

  test('les cles d element qui en ont besoin recoivent leur controle, une fois', () => {
    expect(FIGURE_ATTRIBUTES_CONFIG.name_label_font_family.ui?.kind).toBe('select')
    expect(FIGURE_ATTRIBUTES_CONFIG.shape_border_color.ui?.kind).toBe('color')
    expect(FIGURE_ATTRIBUTES_CONFIG.name_label_font_size.ui?.kind).toBe('number')
  })
})

describe('honours : piquer un sous-ensemble du catalogue', () => {

  test('rend le libelle, l infobulle et le controle du catalogue, sans rien redeclarer', () => {
    const picked = honours(FIGURE_ATTRIBUTES_CONFIG, { parts_order: {}, name_label_font_family: {} })
    expect(picked.parts_order.labels).toBe(FIGURE_ATTRIBUTES_CONFIG.parts_order.labels)
    expect(picked.parts_order.ui?.choices).toBe(FIGURE_ATTRIBUTES_CONFIG.parts_order.ui?.choices)
    expect(picked.name_label_font_family.ui?.kind).toBe('select')
    expect(picked.parts_order.sort).toBe('style')
  })

  test('ne change que ce que la nature dit changer', () => {
    const picked = honours(FIGURE_ATTRIBUTES_CONFIG, {
      name_label_font_size: { default: 10, advanced: true },
      shape_border_color: { default: '#ffffff' }
    })
    // Le defaut d une figure, pas celui d un noeud (20 points, noir).
    expect(picked.name_label_font_size.default).toBe(10)
    expect(picked.shape_border_color.default).toBe('#ffffff')
    // Le controle du catalogue est garde, le rang ajoute.
    expect(picked.name_label_font_size.ui?.kind).toBe('number')
    expect(picked.name_label_font_size.ui?.advanced).toBe(true)
    // Le libelle est celui du catalogue, intact.
    expect(picked.name_label_font_size.labels).toBe(FIGURE_ATTRIBUTES_CONFIG.name_label_font_size.labels)
  })

  test('une cle absente du catalogue est signalee et ignoree, pas rendue sans libelle', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => undefined)
    const picked = honours(FIGURE_ATTRIBUTES_CONFIG, { parts_order: {}, pas_au_catalogue: {} })
    expect(Object.keys(picked)).toEqual(['parts_order'])
    expect(spy).toHaveBeenCalledTimes(1)
    spy.mockRestore()
  })

  test('deux natures qui piquent la meme cle partagent son mot et son widget', () => {
    // C est ce qui rend le meme look d une figure a l autre, et la conservation d un reglage au
    // changement de nature (figureOf garde la surcharge propre, sous le meme nom).
    const a = honours(FIGURE_ATTRIBUTES_CONFIG, { legend_position: {} })
    const b = honours(FIGURE_ATTRIBUTES_CONFIG, { legend_position: { advanced: true } })
    expect(a.legend_position.labels).toBe(b.legend_position.labels)
    expect(a.legend_position.ui?.choices).toBe(b.legend_position.ui?.choices)
  })
})
