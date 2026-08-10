// OS#85 — FEUILLES DE DESSIN (lot 1 : modèle + persistance + navigation).
//
// Une feuille = un AUTRE diagramme, indépendant, dans le même document (règle des deux
// niveaux : une VUE suit les données de son diagramme, une FEUILLE porte d'autres données).
// Clé racine `sheets` : { current, order, entries: { id: { name, json? } } } — la racine du
// fichier EST le contenu de la feuille courante (un lecteur ancien, qui ignore la clé,
// affiche donc la feuille courante sans rien perdre). Un fichier ancien SANS la clé doit
// charger sans bruit.
import { Class_ApplicationData } from './ApplicationData'
import type { Type_JSON } from './Utils'

const deepClone = <T>(o: T): T => JSON.parse(JSON.stringify(o)) as T

/** App OS neuve (mode édition, headless — même recette que corpusRoundTrip). */
const mkApp = () => new Class_ApplicationData(false)

describe('OS#85 — feuilles de dessin : modèle et persistance', () => {
  it('document historique : pas de feuilles, pas de clé sheets à la sauvegarde', () => {
    const app = mkApp()
    expect(app.has_sheets).toBe(false)
    const out = app.toJSON() as Type_JSON
    expect('sheets' in out).toBe(false)
  })

  it('fichier ancien sans clé sheets : chargement sans bruit', () => {
    const dump = mkApp().toJSON() as Type_JSON
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => { /* silencieux */ })
    const app = mkApp()
    app.fromJSON(deepClone(dump), {}, false)
    expect(app.has_sheets).toBe(false)
    expect(warn).not.toHaveBeenCalled()
    warn.mockRestore()
  })

  it('createNewSheet : la feuille courante est enregistrée, la nouvelle est vierge et courante', () => {
    const app = mkApp()
    app.file_name = 'feuille-A' // marqueur persisté (name_file) pour tracer le contenu
    const id2 = app.createNewSheet(false)
    expect(app.has_sheets).toBe(true)
    expect(app.sheets_order).toHaveLength(2)
    expect(app.current_sheet_id).toBe(id2)
    // La nouvelle feuille est un diagramme VIERGE : le marqueur n'y est pas.
    expect(app.file_name).not.toBe('feuille-A')
    // Bascule retour : le contenu de la première feuille est restauré.
    const id1 = app.sheets_order[0]
    app.switchToSheet(id1, false)
    expect(app.current_sheet_id).toBe(id1)
    expect(app.file_name).toBe('feuille-A')
    // Et re-bascule : la feuille 2 est bien restée vierge.
    app.switchToSheet(id2, false)
    expect(app.file_name).not.toBe('feuille-A')
  })

  it('round-trip enregistrer/rouvrir : ordre, noms, feuille courante et contenus survivent', () => {
    const app = mkApp()
    app.file_name = 'feuille-A'
    app.createNewSheet(false)
    app.file_name = 'feuille-B'
    const [id1, id2] = app.sheets_order
    app.renameSheet(id1, 'Bois')
    app.renameSheet(id2, 'Paille')

    const saved = app.toJSON() as Type_JSON
    // La racine du fichier est la feuille COURANTE (compat lecteur ancien).
    expect(saved['name_file']).toBe('feuille-B')
    const sheets = saved['sheets'] as Type_JSON
    expect(sheets['order']).toEqual([id1, id2])
    expect(sheets['current']).toBe(id2)
    const entries = sheets['entries'] as { [id: string]: Type_JSON }
    expect(entries[id1]['name']).toBe('Bois')
    // Feuille non courante : snapshot JSON embarqué. Feuille courante : pas de json (racine).
    expect((entries[id1]['json'] as Type_JSON)['name_file']).toBe('feuille-A')
    expect('json' in entries[id2]).toBe(false)

    const app2 = mkApp()
    app2.fromJSON(deepClone(saved), {}, false)
    expect(app2.sheets_order).toEqual([id1, id2])
    expect(app2.current_sheet_id).toBe(id2)
    expect(app2.sheets_dict[id1].name).toBe('Bois')
    expect(app2.sheets_dict[id2].name).toBe('Paille')
    expect(app2.file_name).toBe('feuille-B')
    app2.switchToSheet(id1, false)
    expect(app2.file_name).toBe('feuille-A')
  })

  it('duplicateCurrentSheetAsNewSheet : feuille indépendante, contenu identique, insérée après', () => {
    const app = mkApp()
    app.file_name = 'feuille-A'
    const id_copy = app.duplicateCurrentSheetAsNewSheet()
    // Le document mono-feuille a été initialisé au passage (feuille 1 + copie).
    expect(app.sheets_order).toHaveLength(2)
    expect(app.sheets_order[1]).toBe(id_copy)
    expect(app.current_sheet_id).toBe(id_copy)
    // Le contenu affiché n'a pas changé (même diagramme, autre identité de feuille).
    expect(app.file_name).toBe('feuille-A')
    expect(app.sheets_dict[id_copy].name.startsWith('Copie de ')).toBe(true)
    // Indépendance : modifier la copie ne touche pas l'originale.
    app.file_name = 'feuille-copie-modifiee'
    app.switchToSheet(app.sheets_order[0], false)
    expect(app.file_name).toBe('feuille-A')
  })

  it('deleteSheet : bascule sur la voisine ; la dernière feuille est insupprimable', () => {
    const app = mkApp()
    app.file_name = 'feuille-A'
    const id2 = app.createNewSheet(false)
    const id1 = app.sheets_order[0]
    // Supprimer la feuille courante (id2) : bascule sur la précédente (id1).
    app.deleteSheet(id2, false)
    expect(app.sheets_order).toEqual([id1])
    expect(app.current_sheet_id).toBe(id1)
    expect(app.file_name).toBe('feuille-A')
    // La dernière feuille ne se supprime pas.
    app.deleteSheet(id1, false)
    expect(app.sheets_order).toEqual([id1])
  })

  it('clé sheets malformée : ignorée sans bruit (document mono-feuille)', () => {
    const dump = mkApp().toJSON() as Type_JSON
    dump['sheets'] = { current: 'x', order: 'pas-un-tableau', entries: {} } as unknown as Type_JSON
    const app = mkApp()
    app.fromJSON(deepClone(dump), {}, false)
    expect(app.has_sheets).toBe(false)
  })
})

// 10/08 — demande de Julien pendant les tests du lot 1 : « quand je charge un modèle ou un
// fichier, ça efface les feuilles — le chargement ne devrait-il pas être associé à la
// feuille ? ». Sémantique draw.io/Excel retenue : un fichier SANS feuilles se charge DANS
// la feuille courante ; un fichier AVEC feuilles est un document complet et remplace tout.
describe('OS#85 — charger un fichier dans la feuille courante', () => {
  it('fichier SANS feuilles + document à feuilles : chargé dans la feuille courante, les autres restent', () => {
    const ext = mkApp()
    ext.file_name = 'externe'
    const ext_dump = ext.toJSON() as Type_JSON

    const app = mkApp()
    app.file_name = 'feuille-A'
    const id2 = app.createNewSheet(false)
    const id1 = app.sheets_order[0]

    app.fromJSON(deepClone(ext_dump), {}, false)
    // Le classeur n'a pas bougé : mêmes feuilles, même feuille courante.
    expect(app.sheets_order).toEqual([id1, id2])
    expect(app.current_sheet_id).toBe(id2)
    // Le contenu chargé est sur la feuille courante…
    expect(app.file_name).toBe('externe')
    // …la feuille 1 est intacte, et le chargement survit à l'aller-retour.
    app.switchToSheet(id1, false)
    expect(app.file_name).toBe('feuille-A')
    app.switchToSheet(id2, false)
    expect(app.file_name).toBe('externe')
  })

  it('fichier AVEC feuilles : document complet, il remplace tout', () => {
    const doc = mkApp()
    doc.file_name = 'doc-X'
    doc.createNewSheet(false)
    const doc_dump = doc.toJSON() as Type_JSON

    const app = mkApp()
    app.createNewSheet(false)
    app.createNewSheet(false)
    expect(app.sheets_order).toHaveLength(3)
    app.fromJSON(deepClone(doc_dump), {}, false)
    expect(app.sheets_order).toHaveLength(2)
  })
})
