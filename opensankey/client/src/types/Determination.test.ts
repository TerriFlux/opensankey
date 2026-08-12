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
    { type: 'determined', constraints: [0, 2] },
    { type: 'free', constraints: [] }
  ]
}

describe('#426 détermination — lecture et écriture', () => {
  it('relit ce qu’elle écrit (aller-retour)', () => {
    expect(determinationCatalogFromJSON(determinationCatalogToJSON(catalog))).toEqual(catalog)
  })

  it('omet les membres vides, pour ne pas alourdir le fichier', () => {
    const json = determinationCatalogToJSON({
      subjects: [], explanations: [{ type: 'free', constraints: [] }]
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
      .toEqual({ subjects: [], explanations: [{ type: 'free', constraints: [] }] })
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
