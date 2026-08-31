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
  determinationSubjectKey
} from './Determination'

const catalog: Type_DeterminationCatalog = {
  subjects: [
    { kind: 'mat_balance', subject: 'Blé' },
    { kind: 'aggregation', subject: 'Céréales', variant: 1 },
    { kind: 'equality', subject: '12', label: 'rendement du process X', constraint_type: 'ratio_flux' }
  ],
  explanations: [
    { type: 'determined', constraints: [0, 2], coefs: [1, -0.6], min_by: [], max_by: [] },
    { type: 'free', constraints: [], coefs: [], min_by: [], max_by: [] }
  ]
}

describe('#426 détermination — lecture et écriture', () => {
  it('relit ce qu’elle écrit (aller-retour)', () => {
    expect(determinationCatalogFromJSON(determinationCatalogToJSON(catalog))).toEqual(catalog)
  })

  it('omet les membres vides, pour ne pas alourdir le fichier', () => {
    const json = determinationCatalogToJSON({
      subjects: [], explanations: [{ type: 'free', constraints: [], coefs: [], min_by: [], max_by: [] }]
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
      .toEqual({ subjects: [], explanations: [{ type: 'free', constraints: [], coefs: [], min_by: [], max_by: [] }] })
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
      { type: 'determined', constraints: [0], coefs: [], min_by: [], max_by: [] }, 0)).toBeUndefined()
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
