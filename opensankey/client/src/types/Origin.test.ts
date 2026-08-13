// #411 — logique de traçabilité côté front.
//
// Ce qui est testé ici est ce qui peut réellement casser : la remontée de
// chaîne (bornée, résistante aux cycles), les replis quand une information
// manque, et la symétrie lecture/écriture qui conditionne l'aller-retour.
//
// Le rendu du panneau n'est pas testé ici : il n'a pas de logique propre.

import {
  type Type_Origin,
  originRuleKey,
  originIsDeduced,
  originExcelLine,
  originFromJSON,
  originToJSON,
  walkOriginChain
} from './Origin'

describe('#411 origines — lecture et écriture', () => {
  it('relit ce qu’elle écrit (aller-retour)', () => {
    const origin: Type_Origin = {
      rule: 'data_sheet', sheet: 'Données', row: 12,
      trigger: 'A - B', datatags: '2020', detail: 'c12'
    }
    expect(originFromJSON(originToJSON(origin))).toEqual(origin)
  })

  it('omet les membres vides, pour ne pas alourdir le fichier', () => {
    expect(originToJSON({ rule: 'manual_draw' })).toEqual({ rule: 'manual_draw' })
  })

  it('rejette ce qui n’est pas un enregistrement utilisable', () => {
    // Un fichier antérieur, ou édité à la main, ne doit jamais faire planter la
    // lecture — ni produire une origine inventée.
    expect(originFromJSON(undefined)).toBeUndefined()
    expect(originFromJSON(null)).toBeUndefined()
    expect(originFromJSON('data_sheet')).toBeUndefined()
    expect(originFromJSON({})).toBeUndefined()
    expect(originFromJSON({ rule: '' })).toBeUndefined()
    expect(originFromJSON({ rule: 42 })).toBeUndefined()
  })

  it('ignore les membres de type inattendu sans perdre la règle', () => {
    expect(originFromJSON({ rule: 'data_sheet', row: 'douze' }))
      .toEqual({ rule: 'data_sheet' })
  })
})

describe('#411 origines — présentation', () => {
  it('désigne le libellé d’une règle par une clé de traduction', () => {
    // Les libellés vivent dans les ressources i18n, et non dans un catalogue
    // local : celui-ci aurait sa propre notion de langue courante, qui diverge
    // de celle de l’application dès que l’utilisateur n’a pas choisi sa langue
    // explicitement — c’est le défaut constaté au premier essai.
    expect(originRuleKey('propagate_to_children'))
      .toBe('inspector.origin.rules.propagate_to_children')
  })

  it('distingue une déduction du moteur d’une saisie', () => {
    expect(originIsDeduced({ rule: 'propagate_to_parent' })).toBe(true)
    expect(originIsDeduced({ rule: 'data_sheet' })).toBe(false)
  })

  it('convertit l’index de ligne en numéro de ligne du classeur', () => {
    // L’en-tête occupe la ligne 1, donc l’index 0 est la ligne 2.
    expect(originExcelLine({ rule: 'data_sheet', row: 0 })).toBe(2)
    expect(originExcelLine({ rule: 'data_sheet', row: 40 })).toBe(42)
    expect(originExcelLine({ rule: 'data_sheet' })).toBeUndefined()
  })
})

describe('#411 origines — remontée de la chaîne causale', () => {
  const chainOf = (
    start: Type_Origin, table: Record<string, Type_Origin>
  ) => walkOriginChain(start, (k) => table[k])

  it('remonte de proche en proche jusqu’à la saisie', () => {
    const start: Type_Origin = { rule: 'propagate_to_parent', trigger: 'a - S' }
    const chain = chainOf(start, {
      'a - S': { rule: 'propagate_to_children', trigger: 'P - S' },
      'P - S': { rule: 'data_sheet', sheet: 'Données', row: 3 }
    })
    expect(chain.map(c => c.origin.rule)).toEqual(
      ['propagate_to_parent', 'propagate_to_children', 'data_sheet'])
    expect(chain[chain.length - 1].origin.sheet).toBe('Données')
  })

  it('s’arrête sur une saisie, qui n’a pas de déclencheur', () => {
    const chain = chainOf({ rule: 'data_sheet', sheet: 'Données', row: 0 }, {})
    expect(chain).toHaveLength(1)
  })

  it('ne boucle pas sur un cycle', () => {
    // Le moteur travaille par points fixes : un élément peut être à la fois
    // cause et conséquence. Une boucle infinie figerait l’interface.
    const chain = chainOf({ rule: 'propagate_to_parent', trigger: 'A - B' }, {
      'A - B': { rule: 'propagate_to_children', trigger: 'C - D' },
      'C - D': { rule: 'propagate_to_parent', trigger: 'A - B' }
    })
    expect(chain.length).toBeLessThanOrEqual(4)
  })

  it('montre quand même un déclencheur dont l’enregistrement est introuvable', () => {
    // Savoir QUI a déclenché reste utile même si l’on ne sait pas pourquoi
    // celui-là existe : on affiche le maillon et l’on s’arrête.
    const chain = chainOf({ rule: 'propagate_to_parent', trigger: 'X - Y' }, {})
    expect(chain).toHaveLength(2)
    expect(chain[1].element).toBe('X - Y')
    // Marqué comme tel : l’interface doit dire « on ne sait pas pourquoi
    // celui-là existe », pas inventer une règle.
    expect(chain[1].unresolved).toBe(true)
  })

  it('reste borné même sur une chaîne très longue', () => {
    const table: Record<string, Type_Origin> = {}
    for (let i = 0; i < 200; i++) {
      table['n' + i] = { rule: 'propagate_to_parent', trigger: 'n' + (i + 1) }
    }
    const chain = chainOf({ rule: 'propagate_to_parent', trigger: 'n0' }, table)
    expect(chain.length).toBeLessThanOrEqual(24)
  })
})
