// os#1445 — LE NOM, ET L'AFFICHAGE DU NOM, SONT CEUX DE L'ÉLÉMENT.
//
// Arbitrage de Julien (20/09) : « il faut une notion d'élément, et un nœud, un flux, une part sont
// des éléments », et « il y a le nom et le display du nom ». Le nommage était pourtant écrit TROIS
// fois — `Class_NodeBase`, `Class_LinkElement`, la zone de texte — et sur les FEUILLES de la
// hiérarchie plutôt que sur l'abstraction commune, `Class_BaseShape`.
//
// CE FICHIER NE POUVAIT PAS ÊTRE ÉCRIT AVANT. Un flux n'avait ni `name_label`, ni
// `name_label_effective`, ni la cascade qui va avec : ces questions n'avaient tout simplement pas
// de réponse chez lui. Qu'on puisse désormais les lui poser — et obtenir la MÊME réponse que d'un
// nœud ou d'une part — est ce que le déplacement a gagné, et c'est ce qu'on fige ici.
//
// Ce lot est un DÉPLACEMENT : rien ne doit avoir changé à l'écran. D'où les deux gardes qui
// suivent la découpe — le nom d'un flux reste composé de ses deux bouts, et les sources qui ont
// besoin des étiquettes ou des dimensions restent chez `Class_NodeElement`, la base n'en offrant
// qu'un repli neutre.

import { Class_ApplicationData } from '../types/ApplicationData'
import type { Type_JSON } from '../types/Utils'
import { Class_BaseShape, Class_LinkAttribute } from './Element'
import { Class_NodeBase } from './NodeBase'
import { buildParts } from '../Representations/parts/buildParts'

if (typeof globalThis.structuredClone !== 'function') {
  globalThis.structuredClone = <T>(o: T): T => JSON.parse(JSON.stringify(o)) as T
}

/**
 * Micro-diagramme qui porte les deux résolutions RÉSERVÉES au nœud : `Rhd` est étiqueté
 * « secteur » dans le groupe « type de noeud » (source 'tag') et descend de `Alim` le long de
 * « dimension 1 » (source 'ancestor'). Un flux y entre, pour avoir les trois natures sous la main.
 */
const fixture = (): Type_JSON => JSON.parse(JSON.stringify({
  version: '1.1.4',
  nodeTags: {
    'type de noeud': {
      name: 'Type de noeud',
      banner: 'none',
      tags_order: ['produit', 'secteur'],
      tags: {
        produit: { name: 'produit', selected: true, color: '#000083' },
        secteur: { name: 'secteur', selected: true, color: '#ffff00' },
      },
      use_colors: false,
    },
  },
  levelTags: {
    'dimension 1': {
      name: 'Dimension 1',
      banner: 'none',
      tags_order: ['1', '2'],
      tags: {
        1: { name: '1', selected: true, color: '#000083' },
        2: { name: '2', selected: true, color: '#027dc6' },
      },
      use_colors: false,
      activated: true,
      siblings: [],
    },
  },
  nodes: {
    Alim: { name: 'Alimentation humaine', x: 100, y: 100 },
    Rhd: {
      name: 'RHD', x: 300, y: 100,
      dimensions: { 'dimension 1': { parent_name: 'Alim' } },
      tags: { 'dimension 1': ['2'], 'type de noeud': ['secteur'] },
      inputLinksId: ['Ble---Rhd'],
    },
    Ble: { name: 'Ble', x: 100, y: 200, outputLinksId: ['Ble---Rhd'] },
  },
  links: {
    'Ble---Rhd': { idSource: 'Ble', idTarget: 'Rhd' },
  },
}))

function loadFixture() {
  const app = new Class_ApplicationData(false)
  app.fromJSON(fixture() as never, {}, false)
  // Aucun DOM ici : on lit le MODÈLE, et les actions de dessin des setters n'ont rien à toucher.
  app.drawing_area.bypass_redraws = true
  return app
}

/** Le prototype qui porte RÉELLEMENT `key` — c'est-à-dire : qui l'implémente. */
function protoOwning(obj: object, key: string): object | null {
  let proto: object | null = Object.getPrototypeOf(obj)
  while (proto !== null) {
    if (Object.getOwnPropertyDescriptor(proto, key) !== undefined) return proto
    proto = Object.getPrototypeOf(proto)
  }
  return null
}

// Tout le vocabulaire du nommage d'un élément, celui qui devait cesser d'être écrit trois fois.
const NAMING_MEMBERS = [
  'name',
  'name_lang_map',
  'name_label',
  'name_label_custom',
  'name_label_effective',
  'name_label_effective_editable',
]

describe('os#1445 le nommage appartient a l element, et il y est ecrit UNE fois', () => {

  it('Class_BaseShape porte le nom ET son affichage', () => {
    NAMING_MEMBERS.forEach(member => {
      const descriptor = Object.getOwnPropertyDescriptor(Class_BaseShape.prototype, member)
      expect(descriptor).toBeDefined()
      expect(typeof descriptor?.get).toBe('function')
    })
    // Le nom S'ÉCRIT : c'est la donnee du document. Son affichage, lui, se derive.
    expect(typeof Object.getOwnPropertyDescriptor(Class_BaseShape.prototype, 'name')?.set)
      .toBe('function')
    expect(Object.getOwnPropertyDescriptor(Class_BaseShape.prototype, 'name_label_effective')?.set)
      .toBeUndefined()
  })

  it('les deux branches historiques ne le reimplementent plus', () => {
    // LE CANARI DU LOT. Remettre l'une de ces implementations sur une feuille fait echouer ce
    // test, et lui seul : c'est exactement la divergence a trois voix qu'on vient de fermer.
    NAMING_MEMBERS.forEach(member => {
      expect(Object.getOwnPropertyDescriptor(Class_NodeBase.prototype, member)).toBeUndefined()
      expect(Object.getOwnPropertyDescriptor(Class_LinkAttribute.prototype, member)).toBeUndefined()
    })
  })

  it('les trois natures repondent par la MEME implementation de base', () => {
    const app = loadFixture()
    const sankey = app.drawing_area.sankey
    const noeud = sankey.nodes_dict['Rhd']
    const flux = sankey.links_dict['Ble---Rhd']
    const zone = sankey.addNewContainer('zdt_encart', 'Encart')
    const part = buildParts(app, [
      { id: 'p_ble', label: 'Ble', value: 6, subject: { kind: 'node', node: { id: 'Ble', name: 'Ble' } } }
    ]).by_id['p_ble'];

    // `name_label` et l'edition du libelle : aucune des quatre ne les reecrit.
    [noeud, flux, zone, part].forEach(element => {
      expect(protoOwning(element, 'name_label')).toBe(Class_BaseShape.prototype)
      expect(protoOwning(element, 'name_label_custom')).toBe(Class_BaseShape.prototype)
      expect(element).toBeInstanceOf(Class_BaseShape)
      expect(typeof element.name).toBe('string')
      expect(typeof element.name_label_effective).toBe('string')
    })

    // `name` et `name_label_effective` : seules les surcharges MOTIVEES subsistent, et le flux —
    // qui n'avait rien du tout avant ce lot — prend desormais son affichage a la base.
    expect(protoOwning(flux, 'name_label_effective')).toBe(Class_BaseShape.prototype)
    expect(protoOwning(zone, 'name')).toBe(Class_BaseShape.prototype)
    expect(protoOwning(noeud, 'name')).toBe(Class_BaseShape.prototype)
  })
})

describe('os#1445 le nom, et ce que l element AFFICHE, sont deux choses', () => {

  it('un noeud en source custom affiche son texte libre, et son nom ne bouge pas', () => {
    const noeud = loadFixture().drawing_area.sankey.nodes_dict['Rhd']

    noeud.name_label_source = 'custom'
    noeud.name_label_text = 'Restauration hors domicile'

    expect(noeud.name_label_effective).toBe('Restauration hors domicile')
    // LA REGLE : un geste de mise en forme ne touche pas la donnee du document.
    expect(noeud.name).toBe('RHD')
    expect(noeud.name_label).toBe('RHD')
    // Et le raccourci historique dit la meme chose que la source.
    expect(noeud.name_label_custom).toBe(true)
  })

  it('un flux compose toujours son nom de ses deux extremites', () => {
    const sankey = loadFixture().drawing_area.sankey
    const flux = sankey.links_dict['Ble---Rhd']

    expect(flux.name).toBe('Ble---RHD')
    // Il est DERIVE : renommer un bout renomme le flux, sans que personne n'ecrive son nom.
    sankey.nodes_dict['Ble'].name = 'Ble tendre'
    expect(flux.name).toBe('Ble tendre---RHD')
    // Sans source particuliere, ce qu'il afficherait est ce nom compose.
    expect(flux.name_label_effective).toBe('Ble tendre---RHD')
  })

  it('renommer une zone de texte passe par le meme setter que renommer un noeud', () => {
    const sankey = loadFixture().drawing_area.sankey
    const zone = sankey.addNewContainer('zdt_encart', 'Encart')

    zone.name = 'Note de lecture'

    expect(zone.name).toBe('Note de lecture')
    expect(zone.name_label_effective).toBe('Note de lecture')
  })
})

describe('os#1445 les sources qui demandent des etiquettes ou des dimensions', () => {

  it('sur un noeud, tag donne l etiquette et ancestor donne l ancetre', () => {
    // Ces deux resolutions restent chez `Class_NodeElement` : lui seul porte des etiquettes
    // assignees et des dimensions. C'est la part du nommage qui est VRAIMENT propre au nœud.
    const noeud = loadFixture().drawing_area.sankey.nodes_dict['Rhd']

    noeud.name_label_source = 'tag'
    noeud.name_label_tag_group_id = 'type de noeud'
    expect(noeud.name_label_effective).toBe('secteur')

    noeud.name_label_source = 'ancestor'
    noeud.name_label_dimension_id = 'dimension 1'
    expect(noeud.name_label_effective).toBe('Alimentation humaine')
  })

  it('sur un element SANS etiquettes ni dimensions, les deux retombent sur le nom', () => {
    // Le repli de la base est une REPONSE, pas un manque : demander a un flux l'etiquette qui le
    // nomme n'a pas de sens, et il vaut mieux qu'il dise son nom que rien du tout. C'est deja ce
    // que faisait `Class_NodeBase` pour les zones de texte ; la base le fait pour tout le monde.
    const sankey = loadFixture().drawing_area.sankey
    const flux = sankey.links_dict['Ble---Rhd']
    const zone = sankey.addNewContainer('zdt_encart', 'Encart')

    flux.name_label_source = 'tag'
    expect(flux.name_label_effective).toBe('Ble---RHD')
    flux.name_label_source = 'ancestor'
    expect(flux.name_label_effective).toBe('Ble---RHD')

    zone.name_label_source = 'tag'
    expect(zone.name_label_effective).toBe('Encart')
    zone.name_label_source = 'ancestor'
    expect(zone.name_label_effective).toBe('Encart')
  })

  it('le gabarit a jetons connait {Name} sur n importe quel element', () => {
    // OS#1314 : les jetons universels sont ceux de l'element. Un flux en herite sans une ligne de
    // code chez lui — et l'edition rend le gabarit tel qu'il est ecrit, pas sa valeur interpolee.
    const flux = loadFixture().drawing_area.sankey.links_dict['Ble---Rhd']

    flux.name_label_source = 'template'
    flux.name_label_template = 'Flux : {Name}'

    expect(flux.name_label_effective).toBe('Flux : Ble---RHD')
    expect(flux.name_label_effective_editable).toBe('Flux : {Name}')
  })
})
