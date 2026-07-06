import { migrateHereditedAttr } from './hereditedAttrMigration'

// #232 — Migration legacy `string[]` → dict de `heredited_attr` (couche OSP).
// Fonction pure, testée en isolation (aucun import de la couche OS).

const MASTER = 'sankey_maitre'

describe('#232 migrateHereditedAttr — migration ancien format string[] → dict', () => {
  it('string[] + heredited_source_id explicite → { [source]: attrs }', () => {
    const result = migrateHereditedAttr(
      { heredited_attr: ['posNode', 'attrNode'], heredited_source_id: 'vue_A' },
      MASTER
    )
    expect(result).toEqual({ vue_A: ['posNode', 'attrNode'] })
  })

  it('string[] SANS heredited_source_id → source par défaut (maître)', () => {
    const result = migrateHereditedAttr(
      { heredited_attr: ['posNode'] },
      MASTER
    )
    expect(result).toEqual({ [MASTER]: ['posNode'] })
  })

  it('string[] vide → dict avec la clé source et liste vide', () => {
    const result = migrateHereditedAttr(
      { heredited_attr: [], heredited_source_id: 'vue_B' },
      MASTER
    )
    expect(result).toEqual({ vue_B: [] })
  })
})

describe('#232 migrateHereditedAttr — format actuel (dict) préservé', () => {
  it('un dict est renvoyé tel quel (mono-source)', () => {
    const dict = { [MASTER]: ['posNode', 'Values'] }
    expect(migrateHereditedAttr({ heredited_attr: dict }, MASTER)).toEqual(dict)
  })

  it('cascade multi-source préservée intégralement', () => {
    const dict = {
      [MASTER]: ['posNode'],
      vue_A: ['attrNode'],
      vue_B: ['Values', 'attrFlux'],
    }
    const result = migrateHereditedAttr({ heredited_attr: dict }, MASTER)
    expect(result).toEqual(dict)
    // Toutes les sources sont conservées.
    expect(Object.keys(result).sort()).toEqual([MASTER, 'vue_A', 'vue_B'].sort())
  })
})

describe('#232 migrateHereditedAttr — champ absent', () => {
  it('heredited_attr undefined → dict vide (jamais undefined)', () => {
    expect(migrateHereditedAttr({}, MASTER)).toEqual({})
  })

  it('heredited_source_id est ignoré quand heredited_attr est déjà un dict', () => {
    const dict = { vue_X: ['posNode'] }
    const result = migrateHereditedAttr(
      { heredited_attr: dict, heredited_source_id: 'vue_ignored' },
      MASTER
    )
    expect(result).toEqual(dict)
    expect(result['vue_ignored']).toBeUndefined()
  })
})
