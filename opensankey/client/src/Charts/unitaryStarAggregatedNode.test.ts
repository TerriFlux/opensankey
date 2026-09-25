// 25/09/2026 — L ETOILE D UN NOEUD QUE LE DIAGRAMME A REPLIE SE DESSINE QUAND MEME.
//
// Julien : « si on est sur couronne sur le noeud Cereales, qu en cliquant sur une part on desagrege
// Ble + Mais, et qu on revient sur la vue unitaire, ca dysfonctionne : ca ne reste pas sur
// Cereales. »
//
// ── CE QUE LA REPRODUCTION A MONTRE, ET QUI N ETAIT PAS L HYPOTHESE EVIDENTE ─────────────────
//
// Le volet RESTE sur Cereales : sujet, vignettes et selection ne bougent pas d un pouce au travers
// de la sequence entiere. Deux hypotheses ont ete ecartees avec preuve en chemin — un sujet EPINGLE
// survit au changement de representation, et un noeud invisible RESTE dans la selection.
//
// Ce qui bouge, c est le DIAGRAMME. `disaggregateAlong` rend Cereales invisible et fait passer ses
// flux sur Ble et Mais. `unitaryStarLinks` lisait `visible_*_links_list` : les deux listes se
// vidaient, l etoile n avait plus rien a dessiner, et de l exterieur ca se lit « ca n est plus sur
// Cereales » alors que le modele y est reste.
//
// LA PORTE DE VISIBILITE EXISTE POUR NE PAS DOUBLE-COMPTER un flux agrege avec ses enfants —
// c est-a-dire pour un noeud QUE LE DIAGRAMME MONTRE. Un noeud qu il ne montre pas n a pas ce
// probleme, et une fenetre ouverte sur lui doit tenir sa promesse.

import { Class_ApplicationData } from '../types/ApplicationData'
import { disaggregateAlong } from '../Algorithms/Hierarchies'
import { unitaryStarLinks } from '../Algorithms/UnitaryExtraction'
import type { Class_NodeElement } from '../Elements/Node'
import type { Type_JSON } from '../types/Utils'

if (typeof globalThis.structuredClone !== 'function') {
  globalThis.structuredClone = <T>(o: T): T => JSON.parse(JSON.stringify(o)) as T
}

/** Amont alimente tout le monde a tous les etages : Cereales 10 = Ble 6 + Mais 4. */
const file = (): Type_JSON => ({
  version: '1.3.0',
  nodes: {
    Amont: { idNode: 'Amont', name: 'Amont' },
    Racine: { idNode: 'Racine', name: 'Racine', tags: { dim: ['niveau1'] } },
    Cereales: {
      idNode: 'Cereales', name: 'Cereales', tags: { dim: ['niveau2'] },
      dimensions: { dim: { parent_name: 'Racine' } }
    },
    Ble: {
      idNode: 'Ble', name: 'Ble', tags: { dim: ['niveau3'] },
      dimensions: { dim: { parent_name: 'Cereales' } }
    },
    Mais: {
      idNode: 'Mais', name: 'Mais', tags: { dim: ['niveau3'] },
      dimensions: { dim: { parent_name: 'Cereales' } }
    }
  },
  links: {
    amont_racine: { idLink: 'amont_racine', idSource: 'Amont', idTarget: 'Racine', value: { value: 10 } },
    amont_cereales: { idLink: 'amont_cereales', idSource: 'Amont', idTarget: 'Cereales', value: { value: 10 } },
    amont_ble: { idLink: 'amont_ble', idSource: 'Amont', idTarget: 'Ble', value: { value: 6 } },
    amont_mais: { idLink: 'amont_mais', idSource: 'Amont', idTarget: 'Mais', value: { value: 4 } }
  },
  levelTags: {
    dim: {
      group_name: 'Dimension', banner: 'one', activated: true, siblings: [],
      tags: {
        niveau1: { name: 'niveau1', selected: true },
        niveau2: { name: 'niveau2', selected: true },
        niveau3: { name: 'niveau3', selected: false }
      }
    }
  }
} as unknown as Type_JSON)

const uneEtude = (): Class_ApplicationData => {
  const app = new Class_ApplicationData(false)
  app.drawing_area.bypass_redraws = true
  app.fromJSON(file() as never, {}, false)
  return app
}

const noeud = (app: Class_ApplicationData, id: string): Class_NodeElement =>
  app.drawing_area.sankey.nodes_dict[id] as Class_NodeElement

const branches = (app: Class_ApplicationData, id: string): string[] => {
  const { inputs, outputs } = unitaryStarLinks(noeud(app, id))
  return [...inputs, ...outputs].map(l => l.id)
}

describe('l etoile d un noeud replie par le diagramme', () => {

  it('AVANT LA DESAGREGATION : Cereales est montre, et son etoile porte son flux', () => {
    // LA CONTRE-VERIFICATION DE DEPART : sans elle, un test vert ne dirait pas si l etoile a ete
    // reparee ou si elle marchait deja.
    const app = uneEtude()

    expect(noeud(app, 'Cereales').is_visible).toBe(true)
    expect(branches(app, 'Cereales')).toEqual(['amont_cereales'])
  })

  it('LE CAS DE JULIEN : desagrege, Cereales n est plus montre — son etoile reste', () => {
    const app = uneEtude()

    disaggregateAlong(app, ['Cereales', 'Ble'])

    expect(noeud(app, 'Cereales').is_visible).toBe(false)
    expect(branches(app, 'Cereales')).toEqual(['amont_cereales'])
  })

  it('ET LES ENFANTS, EUX, sont montres avec les leurs', () => {
    // Le pendant du precedent : la reparation ne doit pas faire remonter les flux des enfants sur
    // le parent, sinon l etoile double-compterait — la raison meme de la porte de visibilite.
    const app = uneEtude()

    disaggregateAlong(app, ['Cereales', 'Ble'])

    expect(noeud(app, 'Ble').is_visible).toBe(true)
    expect(branches(app, 'Ble')).toEqual(['amont_ble'])
    expect(branches(app, 'Cereales')).not.toContain('amont_ble')
  })

  it('UN NOEUD MONTRE garde la porte de visibilite, et c est le cas courant', () => {
    // LA CONTRE-VERIFICATION DU PARC. La regle ne s applique qu au noeud INVISIBLE : sur tous les
    // autres, l etoile est exactement celle d hier, y compris son filtrage.
    const app = uneEtude()
    const amont = noeud(app, 'Amont')

    expect(amont.is_visible).toBe(true)
    expect(branches(app, 'Amont'))
      .toEqual(amont.visible_output_links_list.map(l => l.id))
  })
})
