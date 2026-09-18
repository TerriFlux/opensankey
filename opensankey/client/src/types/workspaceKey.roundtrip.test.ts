// os#1385 (lot 4, D8) — LA CLÉ RACINE `workspace`, ET LE TYPE D'UNE FEUILLE.
//
// Ce que ce fichier verrouille tient en une phrase : ce qui est de l'ESPACE DE TRAVAIL
// (la langue de l'interface, les panneaux) sort du document et part sous `workspace`,
// écrite par le seul document principal — sans qu'aucun fichier antérieur ait à migrer,
// puisque la lecture retombe sur les clés racines `language` et `panels`.
//
// Et la moitié « conteneur » de la même bascule : une feuille porte un TYPE (absent =
// `'sankey'`), un type inconnu se transporte sans jamais se charger, et la RÈGLE DE LA
// RACINE — « la racine porte toujours un Sankey » — se lit dans les deux sens.

// i18next n'est PAS initialisé dans un test unitaire (aucun module de ce graphe ne l'initialise,
// c'est `traductions/traduction.tsx` qui le fait dans l'application) : `changeLanguage` y jette,
// faute de `services.languageUtils`. Or `_afterFromJSON` change la langue de l'interface dès que
// le document principal en déclare une — et c'est justement ce que ces tests font. Ce qu'ils
// vérifient est la PERSISTANCE de la langue, pas la bascule de l'interface : on neutralise donc
// le client i18n.
jest.mock('i18next', () => {
  const stub: Record<string, unknown> = {
    language: undefined,
    changeLanguage: jest.fn(),
    t: (key: string) => key
  }
  stub.use = () => stub
  stub.init = () => stub
  return { __esModule: true, default: stub, t: stub.t }
})

import { Class_Workspace } from './Workspace'
import {
  Class_ApplicationData,
  isSankeySheetType,
  SHEET_TYPE_SANKEY,
  workspaceStateFromJSON
} from './ApplicationData'
import type { Type_JSON } from './Utils'

const deepClone = <T>(o: T): T => JSON.parse(JSON.stringify(o)) as T

/** Un document PRINCIPAL neuf, dans un espace de travail neuf. */
const mkMain = (): Class_ApplicationData => new Class_Workspace(false).createDocument()

/** Charge un fichier dans un document principal neuf, sans dessiner. */
const load = (file: Type_JSON): Class_ApplicationData => {
  const app = mkMain()
  app.fromJSON(deepClone(file), {}, false)
  return app
}

describe('os#1385 lot 4 — la clé racine workspace', () => {

  it('le principal ecrit langue et panneaux sous workspace, et plus a la racine', () => {
    const app = mkMain()
    app.language = 'fr'
    app.menu_configuration.panels.setMode('config', 'sidebar')

    const saved = app.toJSON() as Type_JSON
    expect('language' in saved).toBe(false)
    expect('panels' in saved).toBe(false)
    const workspace = saved['workspace'] as Type_JSON
    expect(workspace['language']).toBe('fr')
    expect((workspace['panels'] as Type_JSON)['sidebar_id']).toBe('config')
  })

  it('relu dans une application neuve : la langue et les panneaux reviennent', () => {
    const app = mkMain()
    app.language = 'fr'
    app.menu_configuration.panels.setMode('config', 'sidebar')
    const saved = app.toJSON() as Type_JSON

    const reloaded = load(saved)
    expect(reloaded.language).toBe('fr')
    expect(reloaded.menu_configuration.panels.getMode('config')).toBe('sidebar')
  })

  it('un fichier ANTERIEUR (langue et panneaux a la racine) se relit tel quel', () => {
    const source = mkMain()
    const file = source.toJSON() as Type_JSON
    // La forme d'avant ce lot : pas de clé `workspace`, tout à la racine.
    delete file['workspace']
    file['language'] = 'en'
    file['panels'] = {
      sidebar_id: 'config', sidebar_width_px: 420, sidebar_open: true, popups: {}
    } as unknown as Type_JSON

    const app = load(file)
    expect(app.language).toBe('en')
    expect(app.menu_configuration.panels.getMode('config')).toBe('sidebar')
    expect(app.menu_configuration.panels.sidebar_width_px).toBe(420)
  })

  it('workspace gagne sur la racine quand les deux sont la', () => {
    // Un fichier hybride ne doit pas laisser deux vérités : la clé dédiée tranche.
    const state = workspaceStateFromJSON({
      language: 'en',
      workspace: { language: 'fr' }
    } as unknown as Type_JSON)
    expect(state.language).toBe('fr')
  })

  it('un document secondaire n ecrit pas l espace de travail', () => {
    const ws = new Class_Workspace(false)
    ws.createDocument()
    const second = ws.createDocument({ offscreen: true })
    second.language = 'de'
    expect('workspace' in (second.toJSON() as Type_JSON)).toBe(false)
  })

  it('un document secondaire ne remplace pas la langue ni les panneaux de l utilisateur', () => {
    const ws = new Class_Workspace(false)
    const main = ws.createDocument()
    const second = ws.createDocument({ offscreen: true })
    main.language = 'fr'
    ws.menu_configuration.panels.setMode('config', 'sidebar')

    const foreign = mkMain()
    foreign.language = 'de'
    foreign.menu_configuration.panels.setMode('doc', 'sidebar')
    const file = foreign.toJSON() as Type_JSON

    second.fromJSON(deepClone(file), {}, false)
    expect(main.language).toBe('fr')
    expect(ws.menu_configuration.panels.getMode('config')).toBe('sidebar')
  })

  it('le contenu d une feuille ne porte pas l espace de travail', () => {
    const app = mkMain()
    app.language = 'fr'
    app.menu_configuration.panels.setMode('config', 'sidebar')
    const content = app.toSheetContentJSON()
    expect('workspace' in content).toBe(false)
    expect('language' in content).toBe(false)
    expect('panels' in content).toBe(false)
  })

  it('basculer de feuille ne change ni la langue ni les panneaux', () => {
    const app = mkMain()
    app.language = 'fr'
    app.menu_configuration.panels.setMode('config', 'sidebar')

    app.createNewSheet(false)
    expect(app.language).toBe('fr')
    expect(app.menu_configuration.panels.getMode('config')).toBe('sidebar')

    const first_sheet = app.sheets_order[0]
    app.switchToSheet(first_sheet, false)
    expect(app.current_sheet_id).toBe(first_sheet)
    expect(app.language).toBe('fr')
    expect(app.menu_configuration.panels.getMode('config')).toBe('sidebar')
  })
})

describe('os#1385 lot 4 — le type d une feuille', () => {

  it('absent vaut sankey, et rien ne s ecrit pour une feuille Sankey', () => {
    expect(isSankeySheetType(undefined)).toBe(true)
    expect(isSankeySheetType(SHEET_TYPE_SANKEY)).toBe(true)
    expect(isSankeySheetType('chart')).toBe(false)

    const app = mkMain()
    app.createNewSheet(false)
    const entries = ((app.toJSON() as Type_JSON)['sheets'] as Type_JSON)['entries'] as Type_JSON
    Object.values(entries).forEach(entry => {
      expect('type' in (entry as Type_JSON)).toBe(false)
    })
  })

  /**
   * Un fichier à deux feuilles dont la SECONDE (non courante) est d'un type inconnu.
   * Aucune feuille non Sankey n'est créable au lot 4 : seule la LECTURE de cette forme
   * s'exerce, et c'est bien ce que le lot livre.
   */
  const fileWithForeignSheet = (): { file: Type_JSON, sheet_id: string } => {
    const app = mkMain()
    app.createNewSheet(false)
    // La feuille courante reste Sankey (règle de la racine) ; l'autre devient un `chart`.
    const file = app.toJSON() as Type_JSON
    const sheets = file['sheets'] as Type_JSON
    const entries = sheets['entries'] as Type_JSON
    const sheet_id = (sheets['order'] as string[]).filter(id => id !== sheets['current'])[0]
    const entry = entries[sheet_id] as Type_JSON
    entry['type'] = 'chart'
    entry['json'] = { chart_version: 1, series: 'ventes' } as unknown as Type_JSON
    return { file, sheet_id }
  }

  it('un type inconnu fait un aller-retour intact, contenu compris', () => {
    const { file, sheet_id } = fileWithForeignSheet()
    const app = load(file)
    expect(app.sheets_dict[sheet_id].type).toBe('chart')

    const saved = app.toJSON() as Type_JSON
    const entry = ((saved['sheets'] as Type_JSON)['entries'] as Type_JSON)[sheet_id] as Type_JSON
    expect(entry['type']).toBe('chart')
    expect((entry['json'] as Type_JSON)['chart_version']).toBe(1)
    expect((entry['json'] as Type_JSON)['series']).toBe('ventes')
  })

  it('une feuille d un type inconnu n a pas d application, et on ne bascule pas dessus', () => {
    const { file, sheet_id } = fileWithForeignSheet()
    const app = load(file)
    const before = app.current_sheet_id

    expect(app.sheetApplication(sheet_id)).toBeNull()

    const warn = jest.spyOn(console, 'warn').mockImplementation(() => { /* silence */ })
    app.switchToSheet(sheet_id, false)
    expect(warn).toHaveBeenCalled()
    warn.mockRestore()
    // Rien n'a bougé : la feuille reste transportée, pas ouverte.
    expect(app.current_sheet_id).toBe(before)
  })

  it('regle de la racine : une entree COURANTE qui porte un json garde ce json', () => {
    const app = mkMain()
    app.createNewSheet(false)
    const file = app.toJSON() as Type_JSON
    const sheets = file['sheets'] as Type_JSON
    const current = sheets['current'] as string
    const entries = sheets['entries'] as Type_JSON
    // La forme qu'écrira le lot 5 : la feuille courante n'est pas un Sankey, la racine
    // porte le dernier Sankey actif, et le contenu de la courante vit dans son entrée.
    const current_entry = entries[current] as Type_JSON
    expect('json' in current_entry).toBe(false)
    current_entry['type'] = 'chart'
    current_entry['json'] = { chart_version: 1 } as unknown as Type_JSON

    const reloaded = load(file)
    expect(reloaded.sheets_dict[current].type).toBe('chart')
    // Le `json` de la courante n'est plus ignoré : sans lui, le contenu serait perdu.
    expect(reloaded.sheets_dict[current].json).toBeDefined()
    // Et il se réécrit, parce que la courante n'est pas un Sankey.
    const resaved = reloaded.toJSON() as Type_JSON
    const resaved_entry = ((resaved['sheets'] as Type_JSON)['entries'] as Type_JSON)[current] as Type_JSON
    expect(resaved_entry['type']).toBe('chart')
    expect((resaved_entry['json'] as Type_JSON)['chart_version']).toBe(1)
    // La feuille courante d'un autre type n'a pas d'application Sankey : c'est la racine
    // qui porte le dernier Sankey actif, pas elle.
    expect(reloaded.sheetApplication(current)).toBeNull()
  })
})
