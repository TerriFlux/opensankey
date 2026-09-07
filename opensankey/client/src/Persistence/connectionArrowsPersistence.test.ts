import { Class_ApplicationData } from '../types/ApplicationData'
import type { Type_JSON } from '../types/Utils'

// sa#422 — l'interrupteur des flèches de création rapide (os#1344), porté par le bouton
// « Sélection » de la colonne d'outils, est un réglage du DOCUMENT (clé
// `connection_arrows_off`) : il doit se retrouver à la réouverture du JSON.
//
// Le défaut est la COUPURE : on lit un diagramme bien plus souvent qu'on ne le dessine,
// et les flèches surgissaient à chaque passage de souris. C'est donc leur réactivation
// qui s'écrit, et le défaut se marque par l'absence de clé.
//
// Ce que ces tests verrouillent :
//  1. DÉFAUT — un fichier sans la clé (tout fichier antérieur, et le premier lancement de
//     l'appli) ouvre flèches COUPÉES.
//  2. ALLER-RETOUR — un diagramme enregistré flèches visibles rouvre flèches visibles.
//  3. RETOUR AU DÉFAUT — recouper les flèches EFFACE la clé plutôt que d'écrire `true` :
//     le défaut se marque par l'absence, comme les autres réglages d'affichage.

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

describe('sa#422 — aller-retour de l\'interrupteur des flèches de création rapide', () => {
  it('un fichier sans la clé ouvre avec les flèches coupées (défaut)', () => {
    const { app, dump } = loadAndDump(baseJSON())
    expect(app.drawing_area.connection_arrows_off).toBe(true)
    // Défaut = absence de clé : on n'alourdit pas tous les fichiers d'un `true`.
    expect('connection_arrows_off' in dump).toBe(false)
  })

  it('un diagramme enregistré flèches visibles est lu puis réécrit', () => {
    const { app, dump } = loadAndDump(baseJSON({ connection_arrows_off: false }))
    expect(app.drawing_area.connection_arrows_off).toBe(false)
    expect(dump['connection_arrows_off']).toBe(false)
  })

  it('le second aller-retour est un point fixe', () => {
    const { dump } = loadAndDump(baseJSON({ connection_arrows_off: false }))
    const { app: app2, dump: dump2 } = loadAndDump(dump)
    expect(app2.drawing_area.connection_arrows_off).toBe(false)
    expect(dump2['connection_arrows_off']).toBe(false)
  })

  it('recouper les flèches retire la clé du fichier', () => {
    const { app } = loadAndDump(baseJSON({ connection_arrows_off: false }))
    app.drawing_area.connection_arrows_off = true
    const dump = app.toJSON() as Type_JSON
    expect('connection_arrows_off' in dump).toBe(false)
  })

  it('une valeur non booléenne dans un fichier bricolé retombe sur le défaut', () => {
    const { app } = loadAndDump(baseJSON({ connection_arrows_off: 'oui' as unknown as boolean }))
    expect(app.drawing_area.connection_arrows_off).toBe(true)
  })
})
