// #426 — traçabilité axe B côté front : « d'où vient cette valeur ».
//
// Ce qui est testé ici est ce qui peut réellement produire un mensonge : la
// lecture d'un catalogue abîmé (des index qui pointeraient à côté donneraient
// des explications vraisemblables et fausses), la symétrie lecture/écriture qui
// conditionne l'aller-retour, et les replis quand le fichier ne dit rien.
//
// Le rendu du panneau n'est pas testé ici : il n'a pas de logique propre.

import {
  type Type_DeterminationCatalog,
  determinationCatalogFromJSON,
  determinationCatalogToJSON,
  determinationCoefficient,
  determinationLookup,
  determinationIsFixed,
  determinationIsFree,
  determinationClassificationKey,
  determinationSubjectKey,
  determinationIndexOf,
  determinationStatusOf,
  determinationStatusOfType
} from './Determination'

const catalog: Type_DeterminationCatalog = {
  subjects: [
    { kind: 'mat_balance', subject: 'Blé' },
    { kind: 'aggregation', subject: 'Céréales', variant: 1 },
    { kind: 'equality', subject: '12', label: 'rendement du process X', constraint_type: 'ratio_flux' }
  ],
  explanations: [
    { type: 'determined', constraints: [0, 2], coefs: [1, -0.6], min_by: [], max_by: [], fixed_by: [], combines: [] },
    { type: 'free', constraints: [], coefs: [], min_by: [], max_by: [], fixed_by: [], combines: [] }
  ]
}

describe('#426 détermination — lecture et écriture', () => {
  it('relit ce qu’elle écrit (aller-retour)', () => {
    expect(determinationCatalogFromJSON(determinationCatalogToJSON(catalog))).toEqual(catalog)
  })

  it('omet les membres vides, pour ne pas alourdir le fichier', () => {
    const json = determinationCatalogToJSON({
      subjects: [], explanations: [{ type: 'free', constraints: [], coefs: [], min_by: [], max_by: [], fixed_by: [], combines: [] }]
    }) as unknown as Record<string, unknown>
    expect(json.subjects).toBeUndefined()
    expect((json.explanations as unknown[])[0]).toEqual({ type: 'free' })
  })

  it('rejette le catalogue ENTIER dès qu’un index sort du catalogue de sujets', () => {
    // Le cas dangereux : un index qui pointe à côté désignerait une contrainte
    // qui n'est pas la bonne, et l'explication produite paraîtrait raisonnable.
    expect(determinationCatalogFromJSON({
      subjects: [{ kind: 'mat_balance', subject: 'Blé' }],
      explanations: [{ type: 'determined', constraints: [0] }, { type: 'free', constraints: [7] }]
    })).toBeUndefined()
    expect(determinationCatalogFromJSON({
      subjects: [{ kind: 'mat_balance', subject: 'Blé' }],
      explanations: [{ type: 'determined', constraints: [-1] }]
    })).toBeUndefined()
    expect(determinationCatalogFromJSON({
      subjects: [{ kind: 'mat_balance', subject: 'Blé' }],
      explanations: [{ type: 'determined', constraints: [0.5] }]
    })).toBeUndefined()
  })

  it('rejette ce qui n’est pas un catalogue utilisable', () => {
    expect(determinationCatalogFromJSON(undefined)).toBeUndefined()
    expect(determinationCatalogFromJSON(null)).toBeUndefined()
    expect(determinationCatalogFromJSON({})).toBeUndefined()
    expect(determinationCatalogFromJSON({ explanations: 'oui' })).toBeUndefined()
    expect(determinationCatalogFromJSON({ explanations: [{ type: '' }] })).toBeUndefined()
    expect(determinationCatalogFromJSON({ explanations: [{ type: 42 }] })).toBeUndefined()
    expect(determinationCatalogFromJSON({ subjects: {}, explanations: [] })).toBeUndefined()
    expect(determinationCatalogFromJSON({
      subjects: [{ kind: 'mat_balance' }], explanations: []
    })).toBeUndefined()
  })

  it('accepte un catalogue sans sujets tant qu’aucune explication n’en cite', () => {
    expect(determinationCatalogFromJSON({ explanations: [{ type: 'free' }] }))
      .toEqual({ subjects: [], explanations: [{ type: 'free', constraints: [], coefs: [], min_by: [], max_by: [], fixed_by: [], combines: [] }] })
  })

  it('lit qui pose la borne basse et qui pose la borne haute', () => {
    const json = {
      subjects: [{ kind: 'aggregation', subject: 'Poudre' },
        { kind: 'aggregation', subject: 'Alimentation' }],
      explanations: [{ type: 'free', constraints: [0, 1], coefs: [1, -1], min_by: [0], max_by: [1] }]
    }
    const read = determinationCatalogFromJSON(json)
    expect(read?.explanations[0].min_by).toEqual([0])
    expect(read?.explanations[0].max_by).toEqual([1])
  })

  it('rejette un rôle qui désigne une contrainte étrangère à l’explication', () => {
    // L'interface n'aurait pas le coefficient de cette contrainte, donc pas son
    // calcul : elle afficherait un bloc vide sous un titre affirmatif.
    const json = {
      subjects: [{ kind: 'aggregation', subject: 'Poudre' },
        { kind: 'aggregation', subject: 'Alimentation' }],
      explanations: [{ type: 'free', constraints: [0], coefs: [1], min_by: [1] }]
    }
    expect(determinationCatalogFromJSON(json)).toBeUndefined()
  })

  it('n’invente aucun rôle quand le fichier n’en porte pas', () => {
    const json = {
      subjects: [{ kind: 'aggregation', subject: 'Poudre' }],
      explanations: [{ type: 'free', constraints: [0], coefs: [1] }]
    }
    const read = determinationCatalogFromJSON(json)
    expect(read?.explanations[0].min_by).toEqual([])
    expect(read?.explanations[0].max_by).toEqual([])
  })

  it('rejette le catalogue quand les coefficients ne suivent pas les contraintes', () => {
    // Désalignés, ils attribueraient à chaque flux le coefficient de son
    // voisin : l'équation affichée serait fausse tout en paraissant normale.
    const subjects = [{ kind: 'mat_balance', subject: 'Blé' }, { kind: 'equality', subject: '3' }]
    expect(determinationCatalogFromJSON({
      subjects, explanations: [{ type: 'determined', constraints: [0, 1], coefs: [1] }]
    })).toBeUndefined()
    expect(determinationCatalogFromJSON({
      subjects, explanations: [{ type: 'determined', constraints: [0], coefs: [1, -1] }]
    })).toBeUndefined()
    expect(determinationCatalogFromJSON({
      subjects, explanations: [{ type: 'determined', constraints: [0], coefs: ['+1'] }]
    })).toBeUndefined()
    expect(determinationCatalogFromJSON({
      subjects, explanations: [{ type: 'determined', constraints: [0], coefs: [Infinity] }]
    })).toBeUndefined()
  })

  it('lit un fichier antérieur aux coefficients sans les inventer', () => {
    // Un moteur plus ancien n'en écrit pas : l'interface montrera les flux sans
    // signe, ce qui vaut mieux qu'un signe deviné.
    const read = determinationCatalogFromJSON({
      subjects: [{ kind: 'mat_balance', subject: 'Blé' }],
      explanations: [{ type: 'determined', constraints: [0] }]
    })
    expect(read?.explanations[0].coefs).toEqual([])
  })

  it('garde les compléments facultatifs d’un sujet et ignore ceux mal typés', () => {
    const read = determinationCatalogFromJSON({
      subjects: [{ kind: 'equality', subject: '12', variant: 'deux', label: 'rendement' }],
      explanations: [{ type: 'determined', constraints: [0] }]
    })
    expect(read?.subjects[0]).toEqual({ kind: 'equality', subject: '12', label: 'rendement' })
  })
})

describe('#426 détermination — résolution d’une explication', () => {
  it('rend l’explication désignée', () => {
    expect(determinationLookup(catalog, 0)?.type).toBe('determined')
    expect(determinationLookup(catalog, 1)?.constraints).toEqual([])
  })

  it('ne rend rien plutôt que n’importe quoi quand l’index est absent ou hors bornes', () => {
    // Un diagramme jamais réconcilié, un fichier antérieur, ou un index abîmé :
    // l'inspecteur doit annoncer qu'il ne sait pas, pas se tromper de cellule.
    expect(determinationLookup(undefined, 0)).toBeUndefined()
    expect(determinationLookup(catalog, null)).toBeUndefined()
    expect(determinationLookup(catalog, undefined)).toBeUndefined()
    expect(determinationLookup(catalog, 2)).toBeUndefined()
    expect(determinationLookup(catalog, -1)).toBeUndefined()
    expect(determinationLookup(catalog, 1.5)).toBeUndefined()
  })
})

describe('#426 détermination — coefficient d’une variable dans une contrainte', () => {
  it('rend le coefficient de la contrainte demandée, pas celui de sa voisine', () => {
    const explanation = catalog.explanations[0]
    expect(determinationCoefficient(explanation, 0)).toBe(1)
    expect(determinationCoefficient(explanation, 2)).toBe(-0.6)
  })

  it('ne rend rien quand la contrainte n’est pas la sienne ou n’est pas chiffrée', () => {
    // undefined ne veut pas dire « zéro » : c'est « le fichier ne le dit pas ».
    expect(determinationCoefficient(catalog.explanations[0], 1)).toBeUndefined()
    expect(determinationCoefficient(undefined, 0)).toBeUndefined()
    expect(determinationCoefficient(
      { type: 'determined', constraints: [0], coefs: [], min_by: [], max_by: [], fixed_by: [], combines: [] }, 0)).toBeUndefined()
  })
})

describe('#426 détermination — classification', () => {
  it('sépare ce qui est fixé de ce qui reste à contraindre', () => {
    expect(determinationIsFixed('determined')).toBe(true)
    expect(determinationIsFixed('measured')).toBe(true)
    expect(determinationIsFixed('redundant')).toBe(true)
    expect(determinationIsFixed('free')).toBe(false)
    expect(determinationIsFree('free')).toBe(true)
    expect(determinationIsFree('free_unbounded')).toBe(true)
    expect(determinationIsFree('determined')).toBe(false)
    // « échoué » n'est ni l'un ni l'autre : la valeur affichée est l'entrée.
    expect(determinationIsFixed('failed')).toBe(false)
    expect(determinationIsFree('failed')).toBe(false)
  })

  it('construit les clés i18n attendues', () => {
    expect(determinationClassificationKey('free')).toBe('inspector.determination.classification.free')
    expect(determinationSubjectKey('mat_balance')).toBe('inspector.determination.kinds.mat_balance')
  })
})

// #536 — le résolveur de statut, remonté dans le cœur pour que le code qui
// DESSINE puisse répondre « quel est le statut de cette valeur ». La frontière
// viewer/éditeur interdit d'aller le chercher dans l'inspecteur, où il vivait.
//
// Ce qui peut mentir ici n'est pas la lecture du catalogue (déjà testée plus
// haut) mais la PROJECTION : cinq codes de solveur vers quatre états parlants,
// avec un cas — `redundant` — qui ne se tranche pas sans regarder la valeur.

const cell = (
  determination: number | null,
  valueData: number | null,
  valueResult: number | null
) => ({ determination, valueData, valueResult })

const status_catalog: Type_DeterminationCatalog = {
  subjects: [],
  explanations: ([
    'measured', 'redundant', 'determined', 'free', 'free_unbounded', 'failed', 'quantum'
  ]).map(type => ({ type, constraints: [], coefs: [], min_by: [], max_by: [], fixed_by: [], combines: [] }))
}
const INDEX = {
  measured: 0, redundant: 1, determined: 2, free: 3, free_unbounded: 4, failed: 5, unknown: 6
}

describe('#536 détermination — quelle explication porte la cellule affichée', () => {
  it('préfère l’index de la cellule à celui du flux', () => {
    // Le flux répond pour les combinaisons d'étiquettes qui disent la même
    // chose ; dès qu'une cellule a son mot à dire, c'est le sien qui vaut.
    expect(determinationIndexOf({ determination: 3, value: cell(7, 10, 10) })).toBe(7)
    expect(determinationIndexOf({ determination: 3, value: cell(null, 10, 10) })).toBe(3)
    expect(determinationIndexOf({ determination: 3 })).toBe(3)
    expect(determinationIndexOf({ determination: 3, value: null })).toBe(3)
  })

  it('rend null — et jamais 0 par accident — quand rien n’est porté', () => {
    // 0 est un index VALIDE : le confondre avec « pas d'explication » ferait
    // pointer toutes les cellules muettes sur la première explication.
    expect(determinationIndexOf({ determination: null, value: cell(null, 10, null) })).toBeNull()
    expect(determinationIndexOf(undefined)).toBeNull()
    expect(determinationIndexOf({ determination: 0 })).toBe(0)
    expect(determinationIndexOf({ determination: 3, value: cell(0, 10, 10) })).toBe(0)
  })
})

describe('#536 détermination — projection vers les quatre états parlants', () => {
  it('range les cas sans ambiguïté', () => {
    expect(determinationStatusOfType('measured')).toBe('collected')
    expect(determinationStatusOfType('determined')).toBe('determined')
    expect(determinationStatusOfType('free')).toBe('undetermined')
    expect(determinationStatusOfType('free_unbounded')).toBe('undetermined')
  })

  it('tranche « redondante » sur le DÉPLACEMENT, pas sur le code', () => {
    // `redundant` dit que le solveur POUVAIT bouger la valeur, jamais qu'il
    // l'ait fait : la donnée reste collectée tant qu'elle n'a pas bougé.
    expect(determinationStatusOfType('redundant', cell(1, 120, 120))).toBe('collected')
    expect(determinationStatusOfType('redundant', cell(1, 120, 118.4))).toBe('reconciled')
  })

  it('ne prend pas l’absence de résultat pour un déplacement', () => {
    // Pas de résultat = la cellule ne porte que ce qui a été saisi. Pas de
    // saisie = il n'y avait rien à collecter, la valeur vient du calcul.
    expect(determinationStatusOfType('redundant', cell(1, 120, null))).toBe('collected')
    expect(determinationStatusOfType('redundant', null)).toBe('collected')
    expect(determinationStatusOfType('redundant', undefined)).toBe('collected')
    expect(determinationStatusOfType('redundant', cell(1, null, 118.4))).toBe('reconciled')
  })

  it('ne range PAS « échouée » dans « indéterminée »', () => {
    // Une campagne échouée laisse ses variables sans résultat et sans
    // explication : c'est un modèle non résolu, pas un degré de liberté.
    expect(determinationStatusOfType('failed')).toBeUndefined()
    expect(determinationStatusOfType('failed', cell(1, 120, null))).toBeUndefined()
  })

  it('laisse sans statut un code que le moteur introduirait', () => {
    // Les quatre états sont un ensemble fermé : on ne devine pas où ranger le
    // cinquième code.
    expect(determinationStatusOfType('quantum')).toBeUndefined()
    expect(determinationStatusOfType(undefined)).toBeUndefined()
    expect(determinationStatusOfType('')).toBeUndefined()
  })
})

describe('#536 détermination — statut lu depuis le porteur', () => {
  it('résout le statut de la cellule affichée', () => {
    expect(determinationStatusOf(status_catalog, {
      determination: INDEX.free, value: cell(INDEX.measured, 120, 120)
    })).toBe('collected')
    // Sans index de cellule, c'est le flux qui répond.
    expect(determinationStatusOf(status_catalog, {
      determination: INDEX.determined, value: cell(null, null, 42)
    })).toBe('determined')
    expect(determinationStatusOf(status_catalog, {
      determination: INDEX.redundant, value: cell(null, 120, 118.4)
    })).toBe('reconciled')
    expect(determinationStatusOf(status_catalog, {
      determination: INDEX.redundant, value: cell(null, 120, 120)
    })).toBe('collected')
  })

  it('répond « pas de statut » quand le fichier ne porte pas de catalogue', () => {
    // État NORMAL : fichier antérieur au #426, moteur plus ancien, ou diagramme
    // jamais réconcilié. Sur le corpus SOCLE, Volailles et Sucre sont dans ce
    // cas quand le Lait porte 1 961 explications.
    expect(determinationStatusOf(undefined, {
      determination: INDEX.measured, value: cell(null, 120, 120)
    })).toBeUndefined()
    expect(determinationStatusOf(status_catalog, {
      determination: null, value: cell(null, 120, 120)
    })).toBeUndefined()
    expect(determinationStatusOf(status_catalog, undefined)).toBeUndefined()
    // Index hors catalogue : déjà écarté par determinationLookup.
    expect(determinationStatusOf(status_catalog, { determination: 99 })).toBeUndefined()
  })
})
