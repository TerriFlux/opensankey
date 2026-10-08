// sa#617 — LES TYPES DE VOLET SE NOMMENT ET SE DÉCRIVENT DANS LES SEPT LANGUES.
//
// Le défaut d'origine : trois libellés (« Unit. », « Couronne », « Barres ») appelaient des clés
// qu'aucun catalogue ne portait. `t` rendait alors leur `defaultValue` français dans toutes les
// langues, et rien ne le signalait — `check:i18n` contrôle la parité des catalogues, pas qu'une
// clé APPELÉE y existe. Ce test résout chaque libellé et chaque description contre les catalogues
// réels, langue par langue : une clé absente échoue ici au lieu de s'afficher en français.

import { registerBaseRepresentations } from './registerBaseRepresentations'
import { registerAnalysisRepresentations } from './registerAnalysisRepresentations'
import { representation_registry } from './RepresentationRegistry'
import { SUPPORTED_LANGS } from '../traductions/supportedLangs'
import { resources_spreadsheet } from '../traductions/traduction_spreadsheet'
import { resources_app_elements } from '../traductions/traduction_app_elements'
import type { Class_ApplicationData } from '../types/ApplicationData'

if (typeof globalThis.structuredClone !== 'function') {
  globalThis.structuredClone = <T>(o: T): T => JSON.parse(JSON.stringify(o)) as T
}

type Tree = { [k: string]: unknown }

const lookup = (lang: string, key: string): string | undefined => {
  for (const res of [resources_spreadsheet, resources_app_elements] as unknown as Tree[]) {
    let node: unknown = ((res[lang] as Tree | undefined)?.translation)
    for (const part of key.split('.')) node = (node as Tree | undefined)?.[part]
    if (typeof node === 'string') return node
  }
  return undefined
}

/** Un `t` qui ne connaît QUE les catalogues : la clé absente rend un témoin, jamais un défaut. */
const appDataIn = (lang: string) => ({
  t: (key: string) => lookup(lang, key) ?? `MISSING:${key}`
}) as unknown as Class_ApplicationData

// Les types d'OpenSankey (l'unitaire est enregistré par OS+, ses clés sont vérifiées à part).
const TYPES = [
  'os.repr.sankey', 'os.repr.spreadsheet', 'os.repr.json', 'os.repr.doc', 'os.repr.element_info',
  'osp.repr.donut', 'osp.repr.bars', 'osp.repr.matrix'
]

beforeAll(() => {
  registerBaseRepresentations()
  registerAnalysisRepresentations()
})

describe('sa#617 — nom et description des types de volet', () => {
  it.each(SUPPORTED_LANGS)('%s : chaque type a un libellé et une description traduits', lang => {
    const app_data = appDataIn(lang)
    const ids = representation_registry.all().map(e => e.id)
    for (const id of TYPES.filter(i => ids.includes(i))) {
      const entry = representation_registry.get(id)!
      expect(entry.label(app_data)).not.toMatch(/^MISSING:/)
      expect(entry.description?.(app_data) ?? 'MISSING:description').not.toMatch(/^MISSING:/)
    }
  })

  it('les types du ticket sont bien enregistrés (sinon le test ci-dessus ne vérifierait rien)', () => {
    const ids = representation_registry.all().map(e => e.id)
    for (const id of TYPES) expect(ids).toContain(id)
  })

  it.each(SUPPORTED_LANGS)('%s : le Sankey unitaire porte son nom entier et sa description', lang => {
    expect(lookup(lang, 'Spreadsheet.zone.unitary')).toBeDefined()
    expect(lookup(lang, 'Spreadsheet.zone.unitary')).not.toBe('Unit.')
    expect(lookup(lang, 'Spreadsheet.zone.type_description.unitary')).toBeDefined()
  })

  it('« Couronne » et « Barres » ne restent pas en français hors du français', () => {
    const fr = appDataIn('fr')
    const en = appDataIn('en')
    const donut = representation_registry.get('osp.repr.donut')!
    const bars = representation_registry.get('osp.repr.bars')!
    expect(donut.label(fr)).toBe('Couronne')
    expect(bars.label(fr)).toBe('Barres')
    expect(donut.label(en)).not.toBe('Couronne')
    expect(bars.label(en)).not.toBe('Barres')
  })
})
