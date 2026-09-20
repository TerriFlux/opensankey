// LE SAC DE REGLAGES SUIVANT, quand on epingle ou qu on relache une coordonnee.
//
// La seule regle de fond de la surface : le reste du fichier est du rendu. Ce qui se verifie ici,
// c est surtout ce qu on N ECRIT PAS — une figure qui suit tout ne doit laisser AUCUNE trace dans
// l enregistrement, pas meme une cle `data_tags` vide.

import {
  FIGURE_DATA_TAGS_KEY, readFigureDataTagPins
} from '../Charts/FigureNavigation'

import { withDataTagPin } from './figureDataTagPins'

describe('withDataTagPin', () => {
  test('pose une epingle sur un sac qui n en avait pas', () => {
    const next = withDataTagPin({ descriptor: null }, 'annee', '2019')
    expect(next[FIGURE_DATA_TAGS_KEY]).toEqual({ annee: '2019' })
    // Les autres reglages de la figure ne bougent pas.
    expect(next.descriptor).toBeNull()
  })

  test('ajoute un second groupe sans toucher au premier', () => {
    const first = withDataTagPin({}, 'annee', '2019')
    const next = withDataTagPin(first, 'scenario', 'tendanciel')
    expect(next[FIGURE_DATA_TAGS_KEY]).toEqual({ annee: '2019', scenario: 'tendanciel' })
  })

  test('remplace l epingle d un groupe deja epingle', () => {
    const first = withDataTagPin({}, 'annee', '2019')
    const next = withDataTagPin(first, 'annee', '2020')
    expect(next[FIGURE_DATA_TAGS_KEY]).toEqual({ annee: '2020' })
  })

  test('une valeur vide RELACHE le groupe, les autres restent', () => {
    const both = withDataTagPin(withDataTagPin({}, 'annee', '2019'), 'scenario', 'tendanciel')
    const next = withDataTagPin(both, 'annee', '')
    expect(next[FIGURE_DATA_TAGS_KEY]).toEqual({ scenario: 'tendanciel' })
  })

  test('la DERNIERE epingle relachee fait SORTIR la cle du sac', () => {
    const pinned = withDataTagPin({ descriptor: null }, 'annee', '2019')
    const next = withDataTagPin(pinned, 'annee', '')
    expect(FIGURE_DATA_TAGS_KEY in next).toBe(false)
    expect(next).toEqual({ descriptor: null })
  })

  test('relacher un groupe jamais epingle n ajoute pas la cle', () => {
    const next = withDataTagPin({ descriptor: null }, 'annee', '')
    expect(FIGURE_DATA_TAGS_KEY in next).toBe(false)
  })

  test('n altere pas le sac qu on lui donne', () => {
    const before = { [FIGURE_DATA_TAGS_KEY]: { annee: '2019' } }
    withDataTagPin(before, 'annee', '2020')
    expect(before[FIGURE_DATA_TAGS_KEY]).toEqual({ annee: '2019' })
  })

  test('ce qui est ecrit est relu par le contrat de FigureNavigation', () => {
    const next = withDataTagPin({}, 'annee', '2019')
    expect(readFigureDataTagPins(next)).toEqual({ annee: '2019' })
    expect(readFigureDataTagPins(withDataTagPin(next, 'annee', ''))).toBeNull()
  })
})
