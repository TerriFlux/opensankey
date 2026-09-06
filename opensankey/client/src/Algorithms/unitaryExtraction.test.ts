import { Class_ApplicationData } from '../types/ApplicationData'
import { CURRENT_FORMAT_VERSION } from '../Persistence/persistenceMigrations'
import { extractUnitaryBricks, composeUnitaryBricks } from './UnitaryExtraction'
import { unitaryAssemblyFromJSON, unitaryAssemblyToJSON } from '../types/UnitaryAssembly'
import type { Type_UnitaryProcess } from '../types/UnitaryProcess'
import type { Type_JSON } from '../types/Utils'

/**
 * os#1379 (U2) — LA RECETTE : `global -> (briques + assemblage) -> global`.
 *
 * NOTE-SANKEY-UNITAIRES.md §5 pose le critere : la derivation doit etre une
 * BIJECTION, valeurs comprises. Le test la verifie de bout en bout, sur des
 * globaux ecrits en memoire — un par piege reconnu dans le code : deux niveaux
 * d agregation, un nœud d echange eclate, un flux produit -> produit hors de
 * toute etoile, un flux secteur -> secteur present dans DEUX briques, et un
 * diagramme sans groupe « type de noeud » du tout.
 *
 * CANONICALISATION — les deux cotes passent par le MEME pipeline avant d etre
 * compares : `canon(j) = dump(load(j))`, avec une application neuve. Sans ca on
 * comparerait un JSON fabrique a la main a un JSON produit par la persistance,
 * et l on mesurerait les defauts de l ecriture du test plutot que ceux de
 * l extraction.
 */

const KWARGS = { keep_siblings: true, without_sheets: true } as Type_JSON

const NODE_TAGGS = {
  'type de noeud': {
    group_name: 'Type de noeud',
    banner: 'none',
    activated: true,
    tags: {
      produit: { name: 'produit', selected: true },
      secteur: { name: 'secteur', selected: true },
      echange: { name: 'echange', selected: true }
    }
  }
}

const produit = (id: string, extra: Type_JSON = {}) =>
  ({ idNode: id, name: id, tags: { 'type de noeud': ['produit'] }, ...extra })
const secteur = (id: string, extra: Type_JSON = {}) =>
  ({ idNode: id, name: id, tags: { 'type de noeud': ['secteur'] }, ...extra })
const echange = (id: string) =>
  ({ idNode: id, name: id, trade_close: true, tags: { 'type de noeud': ['echange'] } })
const flux = (id: string, source: string, target: string, value: number) =>
  ({ idLink: id, idSource: source, idTarget: target, value: { value } })

const file = (content: Record<string, unknown>): Type_JSON => ({
  version: '1.3.0',
  format_version: CURRENT_FORMAT_VERSION,
  nodeTags: NODE_TAGGS,
  ...content
} as unknown as Type_JSON)

const loadApp = (json: Type_JSON): Class_ApplicationData => {
  const app = new Class_ApplicationData(false)
  // `fromJSON` MUTE son argument : on ne lui donne jamais l objet du test.
  app.fromJSON(JSON.parse(JSON.stringify(json)) as never, {}, false)
  return app
}

const dump = (app: Class_ApplicationData): Type_JSON => app.toJSON(KWARGS) as Type_JSON
const canon = (json: Type_JSON): Type_JSON => dump(loadApp(json))

/**
 * Deroule la recette et rend de quoi inspecter le detail. L egalite est
 * profonde ; `toEqual` de jest ignore deja l ordre des CLES d un objet, ce qui
 * est exactement la tolerance voulue (l ordre d un dictionnaire de nœuds n est
 * pas une information).
 */
const recipe = (json: Type_JSON) => {
  const app = loadApp(json)
  const global_dump = dump(app)
  const { bricks, assembly } = extractUnitaryBricks(app)
  const recomposed = composeUnitaryBricks(bricks, assembly)
  expect(canon(recomposed)).toEqual(canon(global_dump))
  return { app, bricks, assembly, recomposed }
}

const processOf = (brick: Type_JSON): Type_UnitaryProcess =>
  brick['process'] as unknown as Type_UnitaryProcess

const nodeIdsOf = (json: Type_JSON): string[] =>
  Object.keys((json['nodes'] as Type_JSON | undefined) ?? {}).sort()
const linkIdsOf = (json: Type_JSON): string[] =>
  Object.keys((json['links'] as Type_JSON | undefined) ?? {}).sort()
const shellOf = (assembly: Type_JSON): Type_JSON => assembly['shell'] as Type_JSON

// ---------------------------------------------------------------------------
// 1. Petit global bipartite
// ---------------------------------------------------------------------------

/**
 * Deux procedes en chaine, deux entrees valuees sur le premier — de quoi
 * verifier un coefficient V1 a la main : 30 / 40 et 10 / 40.
 */
const bipartite = () => file({
  nodes: {
    Pa: produit('Pa'), Pb: produit('Pb'), Pmid: produit('Pmid'), Pout: produit('Pout'),
    S1: secteur('S1'), S2: secteur('S2')
  },
  links: {
    a_s1: flux('a_s1', 'Pa', 'S1', 30),
    b_s1: flux('b_s1', 'Pb', 'S1', 10),
    s1_mid: flux('s1_mid', 'S1', 'Pmid', 40),
    mid_s2: flux('mid_s2', 'Pmid', 'S2', 40),
    s2_out: flux('s2_out', 'S2', 'Pout', 40)
  }
})

describe('os#1379 — recette sur un global bipartite', () => {
  it('global vers briques puis assemblage redonne le global', () => {
    const { bricks } = recipe(bipartite())
    expect(Object.keys(bricks).sort()).toEqual(['S1', 'S2'])
  })

  it('chaque brique ne porte que l etoile de son procede', () => {
    const { bricks } = recipe(bipartite())
    expect(nodeIdsOf(bricks.S1)).toEqual(['Pa', 'Pb', 'Pmid', 'S1'])
    expect(linkIdsOf(bricks.S1)).toEqual(['a_s1', 'b_s1', 's1_mid'])
    expect(nodeIdsOf(bricks.S2)).toEqual(['Pmid', 'Pout', 'S2'])
  })

  it('les coefficients suivent la convention V1 et l activite est la somme des entrees', () => {
    const { bricks } = recipe(bipartite())
    const s1 = processOf(bricks.S1)
    expect(s1.central_node_id).toBe('S1')
    expect(s1.activity_reference).toEqual({ value: 40 })
    // 30 / 40 et 10 / 40 : la somme des coefficients d ENTREE vaut bien 1.
    expect(s1.ports.Pa).toEqual({ direction: 'input', coefficient: 0.75 })
    expect(s1.ports.Pb).toEqual({ direction: 'input', coefficient: 0.25 })
    expect(s1.ports.Pmid).toEqual({ direction: 'output', coefficient: 1 })
  })

  it('l assemblage porte le niveau d activite et le graphe port a port', () => {
    const { assembly } = recipe(bipartite())
    expect(assembly.unitary_assembly).toBe(true)
    expect(assembly.bricks).toEqual({ S1: { activity: 40 }, S2: { activity: 40 } })
    // Seul Pmid raccorde deux procedes ; Pa, Pb et Pout sont des extremites.
    expect(assembly.connections).toEqual([{ product: 'Pmid', from: 'S1', to: 'S2' }])
  })

  it('le shell ne garde aucun nœud ni flux parti dans une brique', () => {
    const { assembly } = recipe(bipartite())
    expect(nodeIdsOf(shellOf(assembly))).toEqual([])
    expect(linkIdsOf(shellOf(assembly))).toEqual([])
    // Mais il garde le socle : sans les tags, la recomposition ne rendrait pas
    // le meme diagramme.
    expect(shellOf(assembly).nodeTags).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// 1 bis. Les deux replis documentes du calcul de coefficient
// ---------------------------------------------------------------------------

/** `S0` n a AUCUNE entree : son activite se lit sur ses sorties (repli documente). */
const procedeSansEntree = () => file({
  nodes: { S0: secteur('S0'), Pa: produit('Pa'), Pb: produit('Pb') },
  links: {
    s0_a: flux('s0_a', 'S0', 'Pa', 30),
    s0_b: flux('s0_b', 'S0', 'Pb', 10)
  }
})

/**
 * Une contrainte de ratio flux DECLAREE rapporte `S1 -> Pmid` aux entrees de `S1`.
 * C est exactement la grandeur de la convention V1 : c est ce coefficient-la qui
 * doit primer sur le quotient de valeurs (source declaree > calcul).
 */
const avecRatioDeclare = () => file({
  nodes: { Pin: produit('Pin'), S1: secteur('S1'), Pmid: produit('Pmid'), Pperte: produit('Pperte') },
  links: {
    in_s1: flux('in_s1', 'Pin', 'S1', 40),
    s1_mid: flux('s1_mid', 'S1', 'Pmid', 36),
    s1_perte: flux('s1_perte', 'S1', 'Pperte', 4)
  },
  ratio_flux_constraints: [{
    origin: 'S1', destination: 'Pmid',
    // « les entrees de S1 » : origin_ref generique, destination_ref = le procede.
    origin_ref: '*', destination_ref: 'S1',
    coef: 0.9, min: null, max: null,
    data_tag: null, data_tag_ref: null, traduction: null
  }]
})

describe('os#1379 — replis du calcul de coefficient', () => {
  it('un procede sans entree se met a l echelle de ses sorties', () => {
    const { bricks } = recipe(procedeSansEntree())
    const s0 = processOf(bricks.S0)
    // Repli documente : l activite devient la somme des SORTIES, et chaque
    // coefficient de sortie est la part du flux dans ce total (l enonce
    // symetrique de la convention V1).
    expect(s0.activity_reference).toEqual({ value: 40 })
    expect(s0.ports.Pa).toEqual({ direction: 'output', coefficient: 0.75 })
    expect(s0.ports.Pb).toEqual({ direction: 'output', coefficient: 0.25 })
  })

  it('un coefficient declare prime sur le quotient de valeurs', () => {
    const { bricks } = recipe(avecRatioDeclare())
    const s1 = processOf(bricks.S1)
    // 36 / 40 vaut 0.9 aussi, mais c est bien la contrainte qui repond : elle est
    // reprise TELLE QUELLE, la ou le calcul n aurait donne qu une approximation
    // de valeurs reconciliees.
    expect(s1.ports.Pmid).toEqual({ direction: 'output', coefficient: 0.9 })
    // Le flux sans contrainte reste calcule : 4 / 40.
    expect(s1.ports.Pperte).toEqual({ direction: 'output', coefficient: 0.1 })
  })
})

// ---------------------------------------------------------------------------
// 2. Deux niveaux d agregation
// ---------------------------------------------------------------------------

const LEVEL_GROUP = 'Niveaux'

/**
 * Le produit agrege `Ptot` et ses deux details `Pd1`/`Pd2` sont gouvernes par un
 * groupe de niveaux dont seul « Agrege » est selectionne. Les trois flux de
 * sortie de S1 coexistent donc dans le fichier, mais un seul est VISIBLE.
 */
const deuxNiveaux = () => file({
  nodes: {
    Pin: produit('Pin'),
    S1: secteur('S1'),
    Ptot: produit('Ptot', { tags: { 'type de noeud': ['produit'], [LEVEL_GROUP]: ['Agrege'] } }),
    Pd1: produit('Pd1', { tags: { 'type de noeud': ['produit'], [LEVEL_GROUP]: ['Detail'] } }),
    Pd2: produit('Pd2', { tags: { 'type de noeud': ['produit'], [LEVEL_GROUP]: ['Detail'] } })
  },
  links: {
    in_s1: flux('in_s1', 'Pin', 'S1', 40),
    s1_tot: flux('s1_tot', 'S1', 'Ptot', 40),
    s1_d1: flux('s1_d1', 'S1', 'Pd1', 25),
    s1_d2: flux('s1_d2', 'S1', 'Pd2', 15)
  },
  levelTags: {
    [LEVEL_GROUP]: {
      group_name: LEVEL_GROUP, banner: 'one', activated: true, siblings: [],
      tags: {
        Agrege: { name: 'Agrege', selected: true },
        Detail: { name: 'Detail', selected: false }
      }
    }
  }
})

describe('os#1379 — deux niveaux d agregation', () => {
  it('l extraction au niveau agrege ne double compte pas les flux', () => {
    const { bricks } = recipe(deuxNiveaux())
    const s1 = processOf(bricks.S1)
    // Deux ports, pas quatre : ce sont les flux VISIBLES qui font l etoile.
    // `input_links_list` en aurait donne quatre, et l activite 40 serait devenue 80.
    expect(Object.keys(s1.ports).sort()).toEqual(['Pin', 'Ptot'])
    expect(s1.activity_reference).toEqual({ value: 40 })
    expect(s1.ports.Ptot).toEqual({ direction: 'output', coefficient: 1 })
  })

  it('les niveaux masques restent dans le shell, et la recette passe', () => {
    const { assembly } = recipe(deuxNiveaux())
    expect(nodeIdsOf(shellOf(assembly))).toEqual(['Pd1', 'Pd2'])
    expect(linkIdsOf(shellOf(assembly))).toEqual(['s1_d1', 's1_d2'])
  })
})

// ---------------------------------------------------------------------------
// 3. Nœud d echange eclate
// ---------------------------------------------------------------------------

/**
 * `ImportNettes` est stocke AGREGE : `afterFromJSON` l eclate en
 * `S1-ImportNettesImportations`. Ce sont ces identifiants ECLATES que la brique
 * doit porter — d ou `keep_siblings: true` sur toutes les serialisations.
 */
const avecEchange = () => file({
  nodes: {
    S1: secteur('S1'), Pout: produit('Pout'), ImportNettes: echange('ImportNettes')
  },
  links: {
    imp: flux('imp', 'ImportNettes', 'S1', 40),
    s1_out: flux('s1_out', 'S1', 'Pout', 40)
  }
})

describe('os#1379 — nœud d echange eclate', () => {
  it('les cles de ports sont les identifiants eclates', () => {
    const { app, bricks } = recipe(avecEchange())
    const split_id = 'S1-ImportNettesImportations'
    // L eclatement a bien eu lieu sur le diagramme source.
    expect((app.drawing_area.sankey.nodes_list as unknown as { id: string }[])
      .map(n => n.id)).toContain(split_id)
    expect(Object.keys(processOf(bricks.S1).ports).sort()).toEqual(['Pout', split_id])
    expect(processOf(bricks.S1).ports[split_id]).toEqual({ direction: 'input', coefficient: 1 })
    // Et la cle designe bien un nœud du fichier de brique : sans keep_siblings,
    // la persistance l aurait reecrit sous l id de son agregat.
    expect(nodeIdsOf(bricks.S1)).toContain(split_id)
  })
})

// ---------------------------------------------------------------------------
// 4. Flux produit -> produit, hors de toute etoile
// ---------------------------------------------------------------------------

const produitVersProduit = () => file({
  nodes: {
    Pin: produit('Pin'), S1: secteur('S1'), Pout: produit('Pout'),
    Px: produit('Px'), Py: produit('Py')
  },
  links: {
    in_s1: flux('in_s1', 'Pin', 'S1', 40),
    s1_out: flux('s1_out', 'S1', 'Pout', 40),
    // Aucun procede sur ce chemin : il n appartient a aucune etoile.
    x_y: flux('x_y', 'Px', 'Py', 7)
  }
})

describe('os#1379 — flux produit vers produit', () => {
  it('atterrit dans le shell, et la recette passe', () => {
    const { assembly, bricks } = recipe(produitVersProduit())
    expect(nodeIdsOf(shellOf(assembly))).toEqual(['Px', 'Py'])
    expect(linkIdsOf(shellOf(assembly))).toEqual(['x_y'])
    expect(nodeIdsOf(bricks.S1)).toEqual(['Pin', 'Pout', 'S1'])
  })
})

// ---------------------------------------------------------------------------
// 5. Flux secteur -> secteur, present dans DEUX briques
// ---------------------------------------------------------------------------

const secteurVersSecteur = () => file({
  nodes: { Pin: produit('Pin'), S1: secteur('S1'), S2: secteur('S2'), Pout: produit('Pout') },
  links: {
    in_s1: flux('in_s1', 'Pin', 'S1', 40),
    s1_s2: flux('s1_s2', 'S1', 'S2', 40),
    s2_out: flux('s2_out', 'S2', 'Pout', 40)
  }
})

describe('os#1379 — flux secteur vers secteur', () => {
  it('appartient aux deux etoiles et la composition fusionne sans erreur', () => {
    const { bricks, assembly } = recipe(secteurVersSecteur())
    expect(linkIdsOf(bricks.S1)).toContain('s1_s2')
    expect(linkIdsOf(bricks.S2)).toContain('s1_s2')
    expect(nodeIdsOf(bricks.S1)).toEqual(['Pin', 'S1', 'S2'])
    expect(nodeIdsOf(bricks.S2)).toEqual(['Pout', 'S1', 'S2'])
    // Un flux direct entre deux procedes ne fait pas un raccord port a port :
    // il n y a pas de produit entre eux.
    expect(assembly.connections).toEqual([])
  })

  it('les deux procedes se voient l un l autre comme un port', () => {
    const { bricks } = recipe(secteurVersSecteur())
    expect(processOf(bricks.S1).ports.S2).toEqual({ direction: 'output', coefficient: 1 })
    expect(processOf(bricks.S2).ports.S1).toEqual({ direction: 'input', coefficient: 1 })
  })
})

// ---------------------------------------------------------------------------
// 6. Diagramme sans groupe « type de noeud »
// ---------------------------------------------------------------------------

const sansTypeDeNoeud = (): Type_JSON => ({
  version: '1.3.0',
  format_version: CURRENT_FORMAT_VERSION,
  nodes: {
    A: { idNode: 'A', name: 'A' },
    B: { idNode: 'B', name: 'B' }
  },
  links: { a_b: flux('a_b', 'A', 'B', 3) }
} as unknown as Type_JSON)

describe('os#1379 — diagramme sans groupe type de noeud', () => {
  it('ne donne aucune brique, garde tout dans le shell, et la recette passe', () => {
    const { bricks, assembly } = recipe(sansTypeDeNoeud())
    expect(bricks).toEqual({})
    expect(assembly.bricks).toEqual({})
    expect(assembly.connections).toEqual([])
    expect(nodeIdsOf(shellOf(assembly))).toEqual(['A', 'B'])
    expect(linkIdsOf(shellOf(assembly))).toEqual(['a_b'])
  })
})

// ---------------------------------------------------------------------------
// 7. Le module UnitaryAssembly seul
// ---------------------------------------------------------------------------

const fullAssembly = {
  unitary_assembly: true,
  bricks: { Scierie: { activity: 388, unit_ref: 'kt' }, Papeterie: { activity: 12 } },
  connections: [
    { product: 'Connexes', from: 'Scierie', to: 'Papeterie' },
    { product: 'Grume', from: 'Foret', to: 'Scierie' }
  ],
  shell: { version: '1.3.0', nodes: {}, links: {} }
}

describe('os#1379 — module UnitaryAssembly (lecture et ecriture)', () => {
  it('relit un assemblage complet sans rien perdre', () => {
    const parsed = unitaryAssemblyFromJSON(fullAssembly)
    expect(parsed).not.toBeNull()
    expect(parsed?.bricks).toEqual(fullAssembly.bricks)
    expect(parsed?.connections).toEqual(fullAssembly.connections)
    expect(parsed?.shell).toEqual(fullAssembly.shell)
    // La serialisation est symetrique de la lecture.
    expect(unitaryAssemblyToJSON(parsed as never)).toEqual(fullAssembly)
  })

  it('accepte le minimum : le seul discriminant', () => {
    const parsed = unitaryAssemblyFromJSON({ unitary_assembly: true })
    expect(parsed).toEqual({ bricks: {}, connections: [], shell: {} })
    // Les trois membres sont ecrits meme vides : un assemblage sans brique reste
    // un assemblage.
    expect(unitaryAssemblyToJSON(parsed as never))
      .toEqual({ unitary_assembly: true, bricks: {}, connections: [], shell: {} })
  })

  it('garde une activite nulle, qui est un procede a l arret et non une absence', () => {
    const parsed = unitaryAssemblyFromJSON({
      unitary_assembly: true, bricks: { Scierie: { activity: 0 } }
    })
    expect(parsed?.bricks.Scierie.activity).toBe(0)
  })

  it('rejette tout ce qui n est pas un assemblage exploitable, sans lever', () => {
    // Pas un objet, ou discriminant absent / faux.
    expect(unitaryAssemblyFromJSON(undefined)).toBeNull()
    expect(unitaryAssemblyFromJSON(null)).toBeNull()
    expect(unitaryAssemblyFromJSON('assemblage')).toBeNull()
    expect(unitaryAssemblyFromJSON([fullAssembly])).toBeNull()
    expect(unitaryAssemblyFromJSON({ bricks: {}, connections: [] })).toBeNull()
    expect(unitaryAssemblyFromJSON({ unitary_assembly: false, bricks: {} })).toBeNull()
    expect(unitaryAssemblyFromJSON({ unitary_assembly: 'oui' })).toBeNull()
  })

  it('une seule brique ou un seul raccord mal forme fait tomber l assemblage entier', () => {
    // Brique sans activite, ou activite non numerique.
    expect(unitaryAssemblyFromJSON({
      unitary_assembly: true, bricks: { Scierie: { unit_ref: 'kt' } }
    })).toBeNull()
    expect(unitaryAssemblyFromJSON({
      unitary_assembly: true, bricks: { Scierie: { activity: '388' } }
    })).toBeNull()
    expect(unitaryAssemblyFromJSON({ unitary_assembly: true, bricks: [] })).toBeNull()
    // Raccord ampute d une extremite : il ne raccorde rien.
    expect(unitaryAssemblyFromJSON({
      unitary_assembly: true, connections: [{ product: 'Connexes', from: 'Scierie' }]
    })).toBeNull()
    expect(unitaryAssemblyFromJSON({
      unitary_assembly: true, connections: [{ product: '', from: 'a', to: 'b' }]
    })).toBeNull()
    expect(unitaryAssemblyFromJSON({ unitary_assembly: true, connections: {} })).toBeNull()
    // Shell qui n est pas un objet.
    expect(unitaryAssemblyFromJSON({ unitary_assembly: true, shell: 42 })).toBeNull()
  })

  it('composer depuis un assemblage illisible leve une erreur explicite', () => {
    expect(() => composeUnitaryBricks({}, { bricks: {} } as Type_JSON))
      .toThrow(/assemblage/)
  })
})
