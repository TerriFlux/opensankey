import { Class_ApplicationData } from '../types/ApplicationData'
import { getPublishOptions } from '../types/PublishOptions'
import type { Type_JSON } from '../types/Utils'

// sa#373 — le plancher d'épaisseur des flux (`minimum_flux`, réglage « taille limite des
// nœuds et flux ») doit faire l'aller-retour fichier ↔ application sans se perdre.
//
// Deux défauts couverts :
//  1. ÉCRITURE — toJSON ne sérialisait la clé que `if (drawing_area.minimum_flux)`, donc un
//     plancher réglé à 0 (valeur légitime depuis #200 : flux tracés à leur épaisseur réelle)
//     disparaissait à l'enregistrement et le fichier rouvrait au défaut 2px.
//  2. OPTION DE PAGE — une page publiée ne pouvait pas imposer le plancher ; il n'était
//     réglable qu'à la main dans l'interface.
//
// « Aucun réglage » se marque par l'ABSENCE de la clé (removeMinimumLinkThickness efface le
// champ), jamais par un 0 : c'est l'invariant que ces tests verrouillent.

const baseJSON = (extra: Record<string, unknown> = {}): Type_JSON => ({
  version: '1.1.4',
  format_version: 3,
  nodes: {},
  links: {},
  width: 1000,
  height: 800,
  user_scale: 100,
  ...extra
} as unknown as Type_JSON)

const loadAndDump = (json: Type_JSON): { app: Class_ApplicationData, dump: Type_JSON } => {
  const app = new Class_ApplicationData(false)
  app.fromJSON(JSON.parse(JSON.stringify(json)) as never, {}, false)
  return { app, dump: app.toJSON() as Type_JSON }
}

describe('sa#373 — aller-retour du plancher d\'épaisseur des flux', () => {
  it('une valeur au-dessus du défaut est lue puis réécrite', () => {
    const { app, dump } = loadAndDump(baseJSON({ minimum_flux: 14 }))
    expect(app.drawing_area.minimum_flux).toBe(14)
    expect(dump['minimum_flux']).toBe(14)
  })

  it('un plancher à 0 survit à l\'enregistrement (cœur de sa#373)', () => {
    const { app, dump } = loadAndDump(baseJSON({ minimum_flux: 0 }))
    expect(app.drawing_area.minimum_flux).toBe(0)
    // Avant correctif : la clé n'était pas écrite (0 falsy) → réouverture au défaut 2px.
    expect('minimum_flux' in dump).toBe(true)
    expect(dump['minimum_flux']).toBe(0)
  })

  it('le second aller-retour est un point fixe (0 reste 0)', () => {
    const { dump } = loadAndDump(baseJSON({ minimum_flux: 0 }))
    const { app: app2, dump: dump2 } = loadAndDump(dump)
    expect(app2.drawing_area.minimum_flux).toBe(0)
    expect(dump2['minimum_flux']).toBe(0)
  })

  it('sans réglage, la clé reste absente (défaut 2px) et non écrite à 0', () => {
    const { app, dump } = loadAndDump(baseJSON())
    expect(app.drawing_area.minimum_flux).toBeUndefined()
    expect('minimum_flux' in dump).toBe(false)
  })

  it('effacer le réglage retire la clé du fichier', () => {
    const { app } = loadAndDump(baseJSON({ minimum_flux: 14 }))
    app.drawing_area.removeMinimumLinkThickness()
    const dump = app.toJSON() as Type_JSON
    expect('minimum_flux' in dump).toBe(false)
  })
})

describe('sa#373 — option window.sankey.minimum_flux', () => {
  afterEach(() => { delete window.sankey })

  it('lue comme nombre, 0 compris ; absente => null', () => {
    window.sankey = {}
    expect(getPublishOptions().minimum_flux).toBeNull()
    window.sankey = { minimum_flux: 14 }
    expect(getPublishOptions().minimum_flux).toBe(14)
    window.sankey = { minimum_flux: 0 }
    expect(getPublishOptions().minimum_flux).toBe(0)
    // Chaîne numérique acceptée (page publiée écrite à la main), valeurs aberrantes rejetées.
    window.sankey = { minimum_flux: '3.5' as unknown as number }
    expect(getPublishOptions().minimum_flux).toBe(3.5)
    window.sankey = { minimum_flux: -1 }
    expect(getPublishOptions().minimum_flux).toBeNull()
    window.sankey = { minimum_flux: 'gros' as unknown as number }
    expect(getPublishOptions().minimum_flux).toBeNull()
  })

  it('l\'option prime sur la valeur du document', () => {
    window.sankey = { minimum_flux: 6 }
    const app = new Class_ApplicationData(false)
    app.fromJSON(baseJSON({ minimum_flux: 14 }) as never, {}, false)
    app.applyPublishStateOptions()
    expect(app.drawing_area.minimum_flux).toBe(6)
  })

  it('sans option, le réglage du document est conservé', () => {
    window.sankey = {}
    const app = new Class_ApplicationData(false)
    app.fromJSON(baseJSON({ minimum_flux: 14 }) as never, {}, false)
    app.applyPublishStateOptions()
    expect(app.drawing_area.minimum_flux).toBe(14)
  })
})
