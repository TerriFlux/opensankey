import { Class_ApplicationData } from '../types/ApplicationData'
import type { Type_JSON } from '../types/Utils'

// sa#419 — le repli de la minimap est un réglage du DOCUMENT (clé `minimap_open`), et non
// plus une préférence de poste rangée dans le localStorage.
//
// Ce que ces tests verrouillent :
//  1. RÉTRO-COMPAT — un fichier écrit avant la feature n'a pas la clé : il doit rouvrir
//     minimap REPLIÉE, exactement comme avant (aucun fichier existant ne change d'aspect).
//  2. ALLER-RETOUR — une minimap dépliée à l'enregistrement rouvre dépliée, et se publie
//     ainsi dans un portfolio (la page publiée lit le même JSON).
//  3. RETOUR AU DÉFAUT — refermer la minimap EFFACE la clé plutôt que d'écrire `false` :
//     le défaut se marque par l'absence, comme pour les autres réglages d'affichage.

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

describe('sa#419 — aller-retour du repli de la minimap', () => {
  it('un fichier sans la clé ouvre la minimap repliée (rétro-compatibilité)', () => {
    const { app, dump } = loadAndDump(baseJSON())
    expect(app.drawing_area.minimap_open).toBe(false)
    // Défaut = absence de clé : on n'alourdit pas tous les fichiers d'un `false`.
    expect('minimap_open' in dump).toBe(false)
  })

  it('une minimap dépliée est lue puis réécrite', () => {
    const { app, dump } = loadAndDump(baseJSON({ minimap_open: true }))
    expect(app.drawing_area.minimap_open).toBe(true)
    expect(dump['minimap_open']).toBe(true)
  })

  it('le second aller-retour est un point fixe', () => {
    const { dump } = loadAndDump(baseJSON({ minimap_open: true }))
    const { app: app2, dump: dump2 } = loadAndDump(dump)
    expect(app2.drawing_area.minimap_open).toBe(true)
    expect(dump2['minimap_open']).toBe(true)
  })

  it('refermer la minimap retire la clé du fichier', () => {
    const { app } = loadAndDump(baseJSON({ minimap_open: true }))
    app.drawing_area.minimap_open = false
    const dump = app.toJSON() as Type_JSON
    expect('minimap_open' in dump).toBe(false)
  })

  it('une valeur non booléenne dans un fichier bricolé retombe sur le défaut', () => {
    const { app } = loadAndDump(baseJSON({ minimap_open: 'oui' as unknown as boolean }))
    expect(app.drawing_area.minimap_open).toBe(false)
  })
})
