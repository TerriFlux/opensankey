import { compareZOrder, dedupeZOrderKeepFirst } from './zOrder'

// Garde de régression — bug « zones de texte / axe Z » : à l'application d'une mise en
// page, les zones de texte (Cheptel, Abattage-découpe, Transformation coproduits…)
// apparaissaient en arrière-plan sous d'autres zones (Approvisionnements, Marché
// intermédiaire), et il fallait « nudger » un élément au 1er/dernier plan pour que
// l'ordre Z se rétablisse.
//
// Cause : `list_g_element` se retrouvait avec des ids EN DOUBLE après updateFrom —
// `attrDrawingArea` pré-amorce la liste avec l'ordre Z source, puis le constructeur de
// Class_ContainerElement re-pousse chaque zone créée à la fin (ordre des données). Le
// tri par indexOf choisissait alors l'occurrence ajoutée (ordre de création) au lieu de
// celle de l'ordre Z source. moveOrderElementInDA (1er/dernier plan) dédoublonnait déjà,
// d'où le rétablissement après une manip manuelle. Le correctif applique le même
// dédoublonnage (garder la 1ʳᵉ occurrence) dans orderElementOnDA.

describe('AFMBase zones de texte / axe Z — dedupeZOrderKeepFirst', () => {
  it('garde la 1ʳᵉ occurrence de chaque id (ordre Z source), pas la dernière', () => {
    // Pré-amorçage source [n1, C_haut, C_bas] PUIS re-push création [C_bas, C_haut].
    const raw = ['n1', 'C_haut', 'C_bas', 'C_bas', 'C_haut']
    expect(dedupeZOrderKeepFirst(raw)).toEqual(['n1', 'C_haut', 'C_bas'])
  })

  it('liste déjà sans doublon : inchangée', () => {
    const raw = ['n1', 'C_haut', 'C_bas']
    expect(dedupeZOrderKeepFirst(raw)).toEqual(['n1', 'C_haut', 'C_bas'])
  })

  it('liste vide : reste vide', () => {
    expect(dedupeZOrderKeepFirst([])).toEqual([])
  })
})

describe('AFMBase zones de texte / axe Z — compareZOrder', () => {
  it('un id plus loin dans la liste (arrière→avant) est dessiné par-dessus', () => {
    const back_to_front = ['a', 'b', 'c']
    expect(compareZOrder('a', 'c', back_to_front)).toBeLessThan(0)
    expect(compareZOrder('c', 'a', back_to_front)).toBeGreaterThan(0)
    expect(compareZOrder('b', 'b', back_to_front)).toBe(0)
  })

  it('ids absents (indexOf = -1) passent en premier', () => {
    const back_to_front = ['a', 'b']
    expect(compareZOrder('zzz', 'a', back_to_front)).toBeLessThan(0)
  })
})

describe('AFMBase zones de texte / axe Z — pipeline complet (réplique orderElementOnDA)', () => {
  // orderElementOnDA : dédoublonne, INVERSE la liste, puis trie le DOM par compareZOrder.
  // L'ordre du DOM résultant est arrière→avant : le dernier élément est au 1er plan.
  const drawOrderBackToFront = (raw_list_g_element: string[], present_ids: string[]) => {
    const order = dedupeZOrderKeepFirst(raw_list_g_element)
    const back_to_front = [...order].reverse()
    return [...present_ids].sort((a, b) => compareZOrder(a, b, back_to_front))
  }

  it('ordre Z source respecté dès le 1er rendu malgré les doublons (régression)', () => {
    // Ordre Z voulu (front-to-back) : zones de texte AU-DESSUS des nœuds/sections.
    // Source pré-amorcée : [C_section, C_souszone, n1] ; doublons de création ajoutés.
    const raw = ['C_souszone', 'C_section', 'n1', /* re-push création */ 'n1', 'C_section', 'C_souszone']
    const present = ['n1', 'C_section', 'C_souszone']
    // back-to-front attendu : n1 (fond), C_section, C_souszone (1er plan).
    expect(drawOrderBackToFront(raw, present)).toEqual(['n1', 'C_section', 'C_souszone'])
  })

  it('SANS dédoublonnage, le bug réapparaît (l’occurrence de création gagne)', () => {
    // Démonstration que le dédoublonnage est nécessaire : on saute dedupeZOrderKeepFirst.
    const raw = ['C_souszone', 'C_section', 'n1', 'n1', 'C_section', 'C_souszone']
    const present = ['n1', 'C_section', 'C_souszone']
    const back_to_front = [...raw].reverse() // pas de dédoublonnage
    const buggy = [...present].sort((a, b) => compareZOrder(a, b, back_to_front))
    // indexOf prend la 1ʳᵉ occurrence de la liste inversée = celle de création →
    // l'ordre Z source n'est plus respecté.
    expect(buggy).not.toEqual(['n1', 'C_section', 'C_souszone'])
  })
})
