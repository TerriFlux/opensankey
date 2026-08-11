import { resolveInlineEditEntry } from './inlineEditEntry'

// os#1340 — garde de régression sur les DEUX entrées en édition inline d'un libellé.
//
// Historique : `setInputLabelVisible` avait convergé vers un comportement unique
// (`void initialValue`) — quelle que soit l'entrée, l'éditeur s'ouvrait avec le nom
// existant tout sélectionné. Conséquence : la frappe directe (#688) était AVALÉE, il
// fallait retaper le caractère. F2 devenait un simple synonyme du double-clic, sans
// valeur propre.
//
// Règle rétablie (convention Excel / Explorateur Windows / draw.io) : frappe = remplacer,
// F2/double-clic = éditer l'existant. Ce test fige la décision ; l'application au DOM
// (innerText + position du curseur) vit dans DrawLabel, non testable ici sans réveiller
// le cycle Element -> Handler.

describe('os#1340 — entrée en édition inline : frappe directe vs F2/double-clic', () => {

  it('frappe directe : le caractère tapé remplace le libellé', () => {
    expect(resolveInlineEditEntry('b')).toEqual({ mode: 'replace', text: 'b' })
  })

  it('F2 / double-clic (aucune valeur) : on édite le nom existant', () => {
    expect(resolveInlineEditEntry()).toEqual({ mode: 'edit_existing' })
    expect(resolveInlineEditEntry(undefined)).toEqual({ mode: 'edit_existing' })
  })

  it('chaîne vide : jamais de remplacement par du vide, on retombe sur l\'édition', () => {
    expect(resolveInlineEditEntry('')).toEqual({ mode: 'edit_existing' })
  })

  it('un caractère « faux-vide » reste un remplacement (espace, zéro)', () => {
    expect(resolveInlineEditEntry(' ')).toEqual({ mode: 'replace', text: ' ' })
    expect(resolveInlineEditEntry('0')).toEqual({ mode: 'replace', text: '0' })
  })
})
