// os#1385 lot 5 (D9) — UN DOCUMENT EST TYPÉ, ET LE TYPE DÉCIDE.
//
// Ce que ce fichier verrouille : une feuille ne se charge, ne se sérialise, ne s'ouvre et ne
// devient courante que par ce que SON TYPE dit — et un type inconnu de cette version reste une
// entrée opaque, transportée sans jamais être ouverte (règle du lot 4).
//
// Le lot 6 y ajoute l'option de page `sheet` : une page publiée s'ouvre sur la feuille dite,
// AVANT toute vue — une bascule de feuille remplace la zone de dessin et le jeu de vues, donc
// une vue posée avant elle l'aurait été sur le document qu'on quitte.

import { Class_Workspace } from './Workspace'
import {
  document_type_registry, registerBaseDocumentTypes, SANKEY_DOCUMENT_TYPE,
  loadSheetDocumentByDefault, serializeSheetDocumentByDefault
} from './DocumentTypeRegistry'
import type { Type_DocumentType } from './DocumentTypeRegistry'
import type { Class_ApplicationData } from './ApplicationData'
import type { Type_JSON } from './Utils'
import type { TFunction } from 'i18next'

/** Noms volontairement improbables : on les cherche tels quels dans le fichier sérialisé. */
const NAME_MAIN = 'NOEUD_DE_LA_FEUILLE_PRINCIPALE'
const NAME_IMPORTED = 'NOEUD_DU_DOCUMENT_IMPORTE'

/** Un type de test SANS canevas — le classeur d'OS+ en sera un (lot 5, agent L). */
const NO_CANVAS_TYPE_ID = 'test.sans_canevas'

/**
 * Un espace de travail de base, un document principal à DEUX feuilles. `createNewSheet(false)`
 * bascule sur la feuille neuve : la première devient donc l'instantané que le registre sait
 * recharger dans un document à part.
 */
function buildTwoSheetWorkspace() {
  const ws = new Class_Workspace(false)
  const main = ws.createDocument()
  main.drawing_area.sankey.addNewNode('n_1', NAME_MAIN)
  main.createNewSheet(false)
  const first_sheet = main.sheets_order[0]
  return { ws, main, first_sheet }
}

/** Le contenu d'un document ÉTRANGER, tel qu'un import le produirait (un JSON, rien de plus). */
function buildImportedContent(): Type_JSON {
  const foreign = new Class_Workspace(false).createDocument()
  foreign.drawing_area.sankey.addNewNode('n_import', NAME_IMPORTED)
  return foreign.toSheetContentJSON()
}

/** Les entrées de feuilles telles que le fichier les porte. */
function sheetEntriesOf(main: Class_ApplicationData): { [id: string]: Type_JSON } {
  const file = main.toJSON() as Type_JSON
  const sheets = file['sheets'] as unknown as { entries: { [id: string]: Type_JSON } }
  return sheets.entries
}

describe('os#1385 lot 5 — le registre des types de documents', () => {

  it('le type sankey est connu du registre, et il a un canevas', () => {
    const sankey = document_type_registry.get(SANKEY_DOCUMENT_TYPE)
    expect(sankey).toBeDefined()
    expect(sankey!.has_canvas).toBe(true)
    expect(document_type_registry.list().map(t => t.id)).toContain(SANKEY_DOCUMENT_TYPE)
  })

  it('registerBaseDocumentTypes est idempotente', () => {
    const size_before = document_type_registry.size
    registerBaseDocumentTypes()
    registerBaseDocumentTypes()
    expect(document_type_registry.size).toBe(size_before)
    expect(document_type_registry.get(SANKEY_DOCUMENT_TYPE)!.has_canvas).toBe(true)
  })

  it('une entree SANS type est un sankey, et un type inconnu na pas de lecteur', () => {
    // C'est cette équivalence — `type` absent = `'sankey'` — qui fait qu'aucun fichier antérieur
    // n'a besoin de migration (lot 4).
    expect(document_type_registry.typeOf({ name: 'Feuille 1' })!.id).toBe(SANKEY_DOCUMENT_TYPE)
    expect(document_type_registry.typeOf({ name: 'Feuille 1', type: 'sankey' })!.id).toBe(SANKEY_DOCUMENT_TYPE)
    // Inconnu : l'entrée se transporte, elle ne s'ouvre pas.
    expect(document_type_registry.typeOf({ name: 'Venue du futur', type: 'carte' })).toBeNull()
  })

  it('le libelle du type sankey se lit meme sans i18n branche', () => {
    // `defaultValue` : le libellé est juste même quand la clé de traduction n'est pas encore
    // posée (tests, rendu hors écran). La clé `sheets.type_sankey` arrive avec les 7 langues.
    const t = ((key: string, opts?: { defaultValue?: string }) =>
      opts?.defaultValue ?? key) as unknown as TFunction
    expect(document_type_registry.get(SANKEY_DOCUMENT_TYPE)!.label(t)).toBe('Sankey')
  })

  it('la fenetre par defaut dun sankey est son canevas', () => {
    const { main } = buildTwoSheetWorkspace()
    const window_of = document_type_registry.get(SANKEY_DOCUMENT_TYPE)!.defaultWindow(main)
    expect(window_of).not.toBeNull()
    expect(window_of!.subject).toEqual({ kind: 'diagram' })
    expect(window_of!.representation).toBe('os.repr.sankey')
  })
})

describe('os#1385 lot 5 — addSheetFromJSON', () => {

  it('ajoute une feuille typee SANS basculer dessus', () => {
    const { main } = buildTwoSheetWorkspace()
    const current_before = main.current_sheet_id
    const id = main.addSheetFromJSON(buildImportedContent(), { name: 'Classeur', type: NO_CANVAS_TYPE_ID })

    // La feuille existe, en dernier, avec son nom et son type…
    expect(main.sheets_order[main.sheets_order.length - 1]).toBe(id)
    expect(main.sheets_dict[id].name).toBe('Classeur')
    expect(main.sheets_dict[id].type).toBe(NO_CANVAS_TYPE_ID)
    // …son contenu est un INSTANTANÉ (gzip), comme toute feuille non courante…
    expect(main.sheets_dict[id].json).toBeInstanceOf(Uint8Array)
    // …et la feuille courante n'a pas bougé : on ouvre une FENÊTRE sur elle, on n'y bascule pas.
    expect(main.current_sheet_id).toBe(current_before)
  })

  it('le contenu ajoute se retrouve dans le fichier, avec son type', () => {
    const { main } = buildTwoSheetWorkspace()
    const id = main.addSheetFromJSON(buildImportedContent(), { name: 'Classeur', type: NO_CANVAS_TYPE_ID })

    const entries = sheetEntriesOf(main)
    expect(entries[id]['name']).toBe('Classeur')
    expect(entries[id]['type']).toBe(NO_CANVAS_TYPE_ID)
    expect(JSON.stringify(entries[id]['json'])).toContain(NAME_IMPORTED)
  })

  it('une feuille sankey najoutee ne gagne AUCUNE cle type (fichiers inchanges)', () => {
    const { main } = buildTwoSheetWorkspace()
    const id = main.addSheetFromJSON(buildImportedContent(), { name: 'Copie' })
    expect(main.sheets_dict[id].type).toBeUndefined()
    expect(sheetEntriesOf(main)[id]['type']).toBeUndefined()
    // Sans nom demandé non plus : le nom par défaut suffit.
    const id2 = main.addSheetFromJSON(buildImportedContent())
    expect(typeof main.sheets_dict[id2].name).toBe('string')
    expect(main.sheets_dict[id2].name).not.toBe('')
  })

  it('un contenu qui porterait lui-meme une cle sheets la perd (pas de recursion)', () => {
    const { main } = buildTwoSheetWorkspace()
    const content = buildImportedContent()
    content['sheets'] = { current: 'x', order: [], entries: {} } as unknown as Type_JSON
    const id = main.addSheetFromJSON(content, { name: 'Bricolee' })
    expect((sheetEntriesOf(main)[id]['json'] as Type_JSON)['sheets']).toBeUndefined()
  })

  it('un document mono-feuille devient multi-feuilles (ensureSheetsInitialized)', () => {
    const ws = new Class_Workspace(false)
    const main = ws.createDocument()
    expect(main.has_sheets).toBe(false)

    const id = main.addSheetFromJSON(buildImportedContent(), { name: 'Classeur' })

    // La feuille 1, c'est ce qu'on avait sous les yeux ; la nouvelle est la seconde.
    expect(main.sheets_order.length).toBe(2)
    expect(main.current_sheet_id).toBe(main.sheets_order[0])
    expect(main.sheets_order[1]).toBe(id)
  })
})

describe('os#1385 lot 5 — un type SANS canevas', () => {
  let load_calls: Array<{ id: string }> = []
  let serialize_calls = 0

  /**
   * Le type factice du lot : pas de canevas (il ne peut donc jamais devenir la racine), un
   * chargement et une sérialisation qui sont ceux du défaut, marqués pour qu'on VOIE que ce
   * sont bien ceux-là que le modèle appelle.
   */
  const fake_type: Type_DocumentType = {
    id: NO_CANVAS_TYPE_ID,
    label: () => 'Sans canevas',
    has_canvas: false,
    load: (holder, json, id) => {
      load_calls.push({ id })
      return loadSheetDocumentByDefault(holder, json, id)
    },
    serialize: (doc) => {
      serialize_calls++
      const json = serializeSheetDocumentByDefault(doc)
      json['marqueur_de_serialisation_du_type'] = true
      return json
    },
    defaultWindow: () => null,
    offers: (representation_id) => representation_id !== 'os.repr.sankey'
  }

  beforeEach(() => {
    load_calls = []
    serialize_calls = 0
    document_type_registry.register(fake_type)
  })

  afterEach(() => {
    document_type_registry.unregister(NO_CANVAS_TYPE_ID)
  })

  it('switchToSheet refuse une feuille sans canevas, et le dit', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => { /* silencieux */ })
    const { main } = buildTwoSheetWorkspace()
    const current_before = main.current_sheet_id
    const id = main.addSheetFromJSON(buildImportedContent(), { name: 'Classeur', type: NO_CANVAS_TYPE_ID })

    main.switchToSheet(id, false)

    expect(main.current_sheet_id).toBe(current_before)
    expect(warn).toHaveBeenCalled()
    warn.mockRestore()
  })

  it('sheetType rend le type de la feuille, et sait dire quil na pas de canevas', () => {
    const { main, first_sheet } = buildTwoSheetWorkspace()
    const id = main.addSheetFromJSON(buildImportedContent(), { name: 'Classeur', type: NO_CANVAS_TYPE_ID })

    expect(main.sheetType(first_sheet)!.id).toBe(SANKEY_DOCUMENT_TYPE)
    expect(main.sheetType(first_sheet)!.has_canvas).toBe(true)
    expect(main.sheetType(id)!.id).toBe(NO_CANVAS_TYPE_ID)
    expect(main.sheetType(id)!.has_canvas).toBe(false)
    expect(main.sheetType(id)!.offers!('os.repr.sankey')).toBe(false)
    expect(main.sheetType('feuille_inconnue')).toBeNull()
  })

  it('sheetApplication passe par le load du TYPE', () => {
    const { main } = buildTwoSheetWorkspace()
    const id = main.addSheetFromJSON(buildImportedContent(), { name: 'Classeur', type: NO_CANVAS_TYPE_ID })

    const doc = main.sheetApplication(id)

    expect(doc).not.toBeNull()
    expect(load_calls).toEqual([{ id }])
    expect(doc!.document_id).toBe('sheet:' + id)
    expect(doc!.drawing_area.sankey.nodes_list.some(n => n.name === NAME_IMPORTED)).toBe(true)
  })

  it('sheetsToJSON passe par le serialize du TYPE quand le document est vivant', () => {
    const { main } = buildTwoSheetWorkspace()
    const id = main.addSheetFromJSON(buildImportedContent(), { name: 'Classeur', type: NO_CANVAS_TYPE_ID })
    main.sheetApplication(id)

    const entries = sheetEntriesOf(main)

    expect(serialize_calls).toBeGreaterThan(0)
    expect((entries[id]['json'] as Type_JSON)['marqueur_de_serialisation_du_type']).toBe(true)
  })

  it('un type INCONNU reste opaque : ni document, ni bascule, et son json survit', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => { /* silencieux */ })
    const { main } = buildTwoSheetWorkspace()
    const id = main.addSheetFromJSON(buildImportedContent(), { name: 'Venue du futur', type: 'carte' })

    expect(main.sheetType(id)).toBeNull()
    expect(main.sheetApplication(id)).toBeNull()
    main.switchToSheet(id, false)
    expect(main.current_sheet_id).not.toBe(id)
    // Transportée telle quelle : la perdre à la première sauvegarde serait bien pire que ne pas
    // savoir l'afficher.
    const entries = sheetEntriesOf(main)
    expect(entries[id]['type']).toBe('carte')
    expect(JSON.stringify(entries[id]['json'])).toContain(NAME_IMPORTED)
    warn.mockRestore()
  })

  it('supprimer la courante atterrit sur une voisine QUI A un canevas', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => { /* silencieux */ })
    const { main, first_sheet } = buildTwoSheetWorkspace()
    const second_sheet = main.current_sheet_id
    // Ordre : [sankey, sankey(courante), sans canevas], puis une quatrième feuille sankey qui
    // devient courante : [sankey, sankey, SANS CANEVAS, sankey(courante)].
    main.addSheetFromJSON(buildImportedContent(), { name: 'Classeur', type: NO_CANVAS_TYPE_ID })
    const last_sheet = main.createNewSheet(false)

    main.deleteSheet(last_sheet, false)

    // La voisine immédiate n'a pas de canevas : on s'éloigne d'un cran, sans jamais atterrir
    // sur une feuille où `switchToSheet` refuserait d'aller.
    expect(main.current_sheet_id).toBe(second_sheet)
    expect(main.sheets_order).not.toContain(last_sheet)
    expect(main.sheets_order).toContain(first_sheet)
    warn.mockRestore()
  })
})

describe('os#1385 lot 6 — loption de page sheet', () => {
  afterEach(() => {
    delete window.sankey
  })

  it('la page souvre sur la feuille nommee par son NOM donglet', () => {
    // `publish_options` est lue à la construction de l'espace de travail : la page pose son
    // `window.sankey` AVANT, comme le serveur l'écrit avant le bundle.
    window.sankey = { sheet: 'Feuille 1' }
    const { main, first_sheet } = buildTwoSheetWorkspace()
    expect(main.sheets_dict[first_sheet].name).toBe('Feuille 1')
    expect(main.current_sheet_id).not.toBe(first_sheet)

    main.applyPublishStateOptions()

    expect(main.current_sheet_id).toBe(first_sheet)
    expect(main.drawing_area.sankey.nodes_list.some(n => n.name === NAME_MAIN)).toBe(true)
  })

  it('la page souvre aussi sur un IDENTIFIANT de feuille', () => {
    // L'identifiant n'est connu qu'une fois le document construit : on pose l'option sur les
    // options déjà lues, exactement comme le fait le chemin réel d'une page publiée.
    const { main, first_sheet } = buildTwoSheetWorkspace()
    ;(main.publish_options as { sheet: string | null }).sheet = first_sheet

    main.applyPublishStateOptions()

    expect(main.current_sheet_id).toBe(first_sheet)
  })

  it('la bascule de feuille precede louverture de vue', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => { /* silencieux */ })
    const { main, first_sheet } = buildTwoSheetWorkspace()
    ;(main.publish_options as { sheet: string | null, view: string | null }).sheet = first_sheet
    ;(main.publish_options as { sheet: string | null, view: string | null }).view = 'vue_qui_nexiste_pas'
    const switch_spy = jest.spyOn(main, 'switchToSheet')

    main.applyPublishStateOptions()

    // Une bascule remplace la zone de dessin ET le jeu de vues : la vue doit être cherchée
    // APRÈS, sur le document sur lequel la page s'ouvre vraiment.
    expect(switch_spy).toHaveBeenCalled()
    const view_warn_index = warn.mock.calls.findIndex(c => String(c[0]).includes('vue introuvable'))
    expect(view_warn_index).toBeGreaterThanOrEqual(0)
    expect(warn.mock.invocationCallOrder[view_warn_index])
      .toBeGreaterThan(switch_spy.mock.invocationCallOrder[0])
    switch_spy.mockRestore()
    warn.mockRestore()
  })

  it('feuille introuvable : warn, et la page souvre comme avant', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => { /* silencieux */ })
    const { main } = buildTwoSheetWorkspace()
    const current_before = main.current_sheet_id
    ;(main.publish_options as { sheet: string | null }).sheet = 'Feuille qui nexiste pas'

    main.applyPublishStateOptions()

    expect(main.current_sheet_id).toBe(current_before)
    expect(warn).toHaveBeenCalled()
    warn.mockRestore()
  })

  it('idempotente : une re-application ne recharge pas la feuille deja ouverte', () => {
    const { main, first_sheet } = buildTwoSheetWorkspace()
    ;(main.publish_options as { sheet: string | null }).sheet = first_sheet
    main.applyPublishStateOptions()
    expect(main.current_sheet_id).toBe(first_sheet)

    // Les viewers React rappellent `applyPublishStateOptions` à chaque changement de props :
    // recharger la feuille jetterait ce que le visiteur vient d'y faire.
    const switch_spy = jest.spyOn(main, 'switchToSheet')
    main.applyPublishStateOptions()
    expect(switch_spy).not.toHaveBeenCalled()
    expect(main.current_sheet_id).toBe(first_sheet)
    switch_spy.mockRestore()
  })
})
