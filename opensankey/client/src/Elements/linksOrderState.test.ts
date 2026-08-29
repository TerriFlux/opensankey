import { reorderLinksByIds } from './linksOrderState'

// sa#283 lot 6 — ORDRE DES FLUX autour d'un nœud : la brique PURE du réordonnancement.
//
// La règle qu'on verrouille ici : les flux CITÉS d'abord, dans l'ordre de la liste ; les
// autres ENSUITE, dans leur ordre courant. Elle rend l'opération exactement réversible
// (rejouer l'ordre complet mémorisé rend l'ordre d'origine) et donne aux flux du maître
// que la liste ne connaît pas une place DÉTERMINÉE, au lieu de la place accidentelle
// (« en tête ») que leur donnait le tri par indexOf de `reorganizeIOFromListIds`.

const ids = (links: { id: string }[]) => links.map(l => l.id)
const make = (...names: string[]) => names.map(id => ({ id }))

describe('sa#283 lot 6 — reorderLinksByIds', () => {

  it('rejouer l ordre COMPLET est l identite, donc le patch inverse est exact', () => {
    const links = make('a', 'b', 'c', 'd')
    expect(ids(reorderLinksByIds(links, ids(links)))).toEqual(['a', 'b', 'c', 'd'])
    // Aller-retour : un ordre quelconque, puis l'ordre memorise avant.
    const memorise = ids(links)
    const applique = reorderLinksByIds(links, ['d', 'c'])
    expect(ids(applique)).toEqual(['d', 'c', 'a', 'b'])
    expect(ids(reorderLinksByIds(applique, memorise))).toEqual(['a', 'b', 'c', 'd'])
  })

  it('les flux cites passent en tete, les autres suivent dans leur ordre courant', () => {
    const links = make('a', 'b', 'c', 'd', 'e')
    expect(ids(reorderLinksByIds(links, ['c', 'a']))).toEqual(['c', 'a', 'b', 'd', 'e'])
  })

  it('un id inconnu du noeud est IGNORE silencieusement', () => {
    const links = make('a', 'b')
    // 'zzz' vient d'un fichier d'epoque qui ne connait pas le reseau reconcilie.
    expect(ids(reorderLinksByIds(links, ['zzz', 'b', 'inconnu']))).toEqual(['b', 'a'])
  })

  it('un id repete n est honore qu une fois, et aucun flux n est perdu ni duplique', () => {
    const links = make('a', 'b', 'c')
    const out = reorderLinksByIds(links, ['b', 'b', 'a'])
    expect(ids(out)).toEqual(['b', 'a', 'c'])
    expect(out.length).toBe(links.length)
  })

  it('une liste vide laisse l ordre courant intact', () => {
    const links = make('a', 'b', 'c')
    expect(ids(reorderLinksByIds(links, []))).toEqual(['a', 'b', 'c'])
  })

  it('renvoie un tableau NEUF : la liste d entree n est pas mutee', () => {
    const links = make('a', 'b', 'c')
    const out = reorderLinksByIds(links, ['c'])
    expect(out).not.toBe(links)
    expect(ids(links)).toEqual(['a', 'b', 'c'])
  })
})
