import { reorganizeIOOrder } from './reorganizeIOOrder'

// Regression guard for issue #197 — le cadenas d'ordre des flux E/S était défait
// par le déplacement d'un nœud.
//
// Le cadenas (commit 6d8a7067) fige le côté d'une ancre et promet « déplacer le
// noeud opposé ne la repositionnera plus ». Mais l'auto-réorganisation au drag
// (NodeEventsHandler, commit a9efa282, 4 jours plus tard) appelait
// `reorganizeIOLinks()` sur le nœud déplacé ET ses voisins — ce qui relâchait
// tous les verrous et re-triait tous les flux. Le correctif : un drag manuel
// passe `release_locks=false` ; dans ce mode, les ancres verrouillées gardent
// leur place et seuls les flux non verrouillés sont re-triés autour d'elles.
//
// Ce test isole la POLITIQUE D'ORDRE pure (sans le graphe d3/DOM de
// Class_NodeElement). Les « liens » sont de simples objets ; `compare` trie par
// `key` croissant (proxy de la position spatiale du nœud opposé).

type FakeLink = { id: string; key: number; locked?: boolean }

const byKey = (a: FakeLink, b: FakeLink) => a.key - b.key
const isLocked = (l: FakeLink) => l.locked === true
const ids = (links: FakeLink[]) => links.map(l => l.id)

describe("AFMBase issue #197 — reorganizeIOOrder préserve les ancres verrouillées", () => {
  // Ordre initial [A,B,C] ; ordre spatial croissant = [B(1), C(2), A(3)].
  const A: FakeLink = { id: 'A', key: 3 }
  const B: FakeLink = { id: 'B', key: 1 }
  const C: FakeLink = { id: 'C', key: 2 }
  const order = () => [{ ...A }, { ...B }, { ...C }]

  it('release_locks=true : re-trie tout le groupe selon les positions (comportement nominal)', () => {
    const [a, b, c] = order()
    const out = reorganizeIOOrder([a, b, c], [], [], [], isLocked, byKey, true)
    expect(ids(out)).toEqual(['B', 'C', 'A'])
  })

  it("release_locks=false : un lien verrouillé en TÊTE garde sa place, les autres se trient autour", () => {
    const [a, b, c] = order()
    a.locked = true // A reste à l'index 0 alors qu'il devrait spatialement finir dernier
    const out = reorganizeIOOrder([a, b, c], [], [], [], isLocked, byKey, false)
    // A épinglé en 0 ; B,C triés dans les emplacements restants 1,2.
    expect(ids(out)).toEqual(['A', 'B', 'C'])
  })

  it('release_locks=false : un lien verrouillé au MILIEU reste épinglé, les autres se trient autour', () => {
    const [a, b, c] = order()
    b.locked = true // B épinglé à l'index 1
    const out = reorganizeIOOrder([a, b, c], [], [], [], isLocked, byKey, false)
    // Emplacements libres 0 et 2 reçoivent A,C triés par key = [C(2), A(3)].
    expect(ids(out)).toEqual(['C', 'B', 'A'])
  })

  it('release_locks=false sans aucun verrou : équivaut au tri complet', () => {
    const [a, b, c] = order()
    const out = reorganizeIOOrder([a, b, c], [], [], [], isLocked, byKey, false)
    expect(ids(out)).toEqual(['B', 'C', 'A'])
  })

  it('structure préservée : import en tête, recyclage avant export, milieu seul re-trié', () => {
    const I: FakeLink = { id: 'I', key: 9 } // import echange
    const E: FakeLink = { id: 'E', key: 0 } // export echange
    const R: FakeLink = { id: 'R', key: 5 } // recyclage
    const a: FakeLink = { id: 'A', key: 2 }
    const b: FakeLink = { id: 'B', key: 1 }
    // links_order mélangé ; import/export/recycling fournis à part (comme la méthode
    // les calcule depuis input/output_links_list et shape_is_recycling).
    const out = reorganizeIOOrder([I, a, R, b, E], [I], [E], [R], isLocked, byKey, true)
    // [import] + [milieu trié B,A] + [recyclage] + [export].
    expect(ids(out)).toEqual(['I', 'B', 'A', 'R', 'E'])
  })
})
