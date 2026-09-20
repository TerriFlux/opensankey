import {
  Class_RepresentationRegistry,
  diagramCapabilities,
  diagramContext,
  elementContext,
  isOfferedToReader,
  mountRepresentation,
  redrawMounted,
  representation_registry,
  type Type_RepresentationEntry
} from './RepresentationRegistry'
import { figureAttribute } from './figureAttribute'
import type { Class_ApplicationData } from '../types/ApplicationData'
import type { Type_Presentable } from '../components/panels/presentation/openPresentation'

// os#1361 (D0) — le CONTRAT du registre, testé en isolation : échelle, gating,
// exigences, liste blanche de publication, ordre. Aucun rendu réel — même
// discipline que PresentationBlockRegistry.test.ts.

type Fake = {
  is_static?: boolean
  publish_options?: Record<string, unknown>
  sankey?: { level_taggs_list: unknown[], nodes_list: { dimensions_as_parent: unknown[] }[] }
}

const app = (over: Fake = {}): Class_ApplicationData => ({
  is_static: over.is_static ?? false,
  publish_options: over.publish_options ?? { representations: null },
  drawing_area: {
    sankey: over.sankey ?? { level_taggs_list: [], nodes_list: [] }
  }
} as unknown as Class_ApplicationData)

const element = { id: 'n1', getElementProperty: () => undefined } as Type_Presentable

function entry(
  over: Partial<Type_RepresentationEntry> & { id: string }
): Type_RepresentationEntry {
  return {
    scale: 'diagram',
    order: 10,
    label: () => over.id,
    draw: () => undefined,
    ...over
  } as Type_RepresentationEntry
}

describe('os#1361 Class_RepresentationRegistry', () => {
  let registry: Class_RepresentationRegistry

  beforeEach(() => {
    registry = new Class_RepresentationRegistry()
  })

  it('enregistre et retrouve une entree par id', () => {
    registry.register(entry({ id: 'a' }))
    expect(registry.has('a')).toBe(true)
    expect(registry.get('a')?.id).toBe('a')
    expect(registry.size).toBe(1)
  })

  it('reenregistrer le meme id remplace, il ne duplique pas', () => {
    registry.register(entry({ id: 'a', order: 1 }))
    registry.register(entry({ id: 'a', order: 2 }))
    expect(registry.size).toBe(1)
    expect(registry.get('a')?.order).toBe(2)
  })

  it('ne melange jamais les deux echelles', () => {
    registry.register(entry({ id: 'd', scale: 'diagram' }))
    registry.register(entry({ id: 'e', scale: 'element' }))
    const a = app()
    expect(registry.list(diagramContext(a)).map(x => x.id)).toEqual(['d'])
    expect(registry.list(elementContext(a, element)).map(x => x.id)).toEqual(['e'])
  })

  it('trie par ordre declare', () => {
    registry.register(entry({ id: 'z', order: 30 }))
    registry.register(entry({ id: 'a', order: 10 }))
    registry.register(entry({ id: 'm', order: 20 }))
    expect(registry.list(diagramContext(app())).map(x => x.id)).toEqual(['a', 'm', 'z'])
  })

  it('ecarte une entree dont le gate refuse', () => {
    registry.register(entry({ id: 'a', gate: () => false }))
    expect(registry.list(diagramContext(app()))).toHaveLength(0)
  })

  it('ecarte une entree qui exige une hierarchie absente', () => {
    registry.register(entry({ id: 'sunburst', needs: { hierarchy: true } }))
    expect(registry.list(diagramContext(app()))).toHaveLength(0)
    const with_levels = app({ sankey: { level_taggs_list: [{}], nodes_list: [] } })
    expect(registry.list(diagramContext(with_levels))).toHaveLength(1)
  })

  it('ecarte une entree qui exige la geographie, tant qu aucune brique carto n existe', () => {
    registry.register(entry({ id: 'map', needs: { geography: true } }))
    const with_levels = app({ sankey: { level_taggs_list: [{}], nodes_list: [] } })
    expect(registry.list(diagramContext(with_levels))).toHaveLength(0)
  })

  it('un isAvailable qui leve vaut refus, il n emporte pas le selecteur', () => {
    registry.register(entry({ id: 'ok' }))
    registry.register(entry({
      id: 'boom',
      order: 5,
      isAvailable: () => { throw new Error('descripteur absent') }
    }))
    expect(registry.list(diagramContext(app())).map(x => x.id)).toEqual(['ok'])
  })

  // os#1418 — une nature DECLARE ses attributs de reglage, et le registre les transporte sans
  // jamais les lire. `{}` pour un id inconnu comme pour une nature qui ne declare rien : le
  // meme mot, parce que c est la meme reponse - rien a dire de particulier sur ces cles la.
  it('une entree declare ses attributs et attributesOf les rend', () => {
    const labels = {
      en: 'Value mode', fr: 'Mode de valeur', es: 'Modo de valor', de: 'Wertmodus',
      it: 'Modalita dei valori', 'zh-CN': '数值模式', ja: '値の表示モード'
    }
    const roots = {
      en: 'Root', fr: 'Racine', es: 'Raiz', de: 'Wurzel',
      it: 'Radice', 'zh-CN': '根节点', ja: 'ルート'
    }
    registry.register(entry({
      id: 'avec',
      attributes: {
        value_mode: figureAttribute<string>('percent', 'style', labels),
        root_ids: figureAttribute<string[] | undefined>(undefined, 'identity', roots)
      }
    }))
    registry.register(entry({ id: 'sans' }))

    const declared = registry.attributesOf('avec')
    expect(Object.keys(declared).sort()).toEqual(['root_ids', 'value_mode'])
    expect(declared.value_mode.default).toBe('percent')
    expect(declared.value_mode.sort).toBe('style')
    expect(declared.value_mode.category).toBe('figure')
    expect(declared.value_mode.labels.fr).toBe('Mode de valeur')
    // Infobulles absentes = les libelles servent des deux cotes.
    expect(declared.value_mode.tooltips.ja).toBe('値の表示モード')
    expect(declared.root_ids.default).toBeUndefined()
    expect(declared.root_ids.sort).toBe('identity')

    expect(registry.attributesOf('sans')).toEqual({})
    expect(registry.attributesOf('jamais.vu')).toEqual({})
  })

  it('all() ne filtre rien : l auteur doit voir ce qu il retire', () => {
    registry.register(entry({ id: 'a', gate: () => false }))
    registry.register(entry({ id: 'b', needs: { geography: true } }))
    expect(registry.all('diagram').map(x => x.id)).toEqual(['a', 'b'])
  })
})

describe('os#1361 offre au lecteur', () => {
  it('hors page publiee, tout est offert', () => {
    const e = entry({ id: 'a', publish_option: 'doc' })
    expect(isOfferedToReader(e, app({ is_static: false }))).toBe(true)
  })

  it('sur une page publiee sans liste blanche, tout est offert', () => {
    const e = entry({ id: 'a' })
    const a = app({ is_static: true, publish_options: { representations: null } })
    expect(isOfferedToReader(e, a)).toBe(true)
  })

  it('la liste blanche retire ce qu elle ne cite pas', () => {
    const a = app({ is_static: true, publish_options: { representations: ['os.repr.sankey'] } })
    expect(isOfferedToReader(entry({ id: 'os.repr.sankey' }), a)).toBe(true)
    expect(isOfferedToReader(entry({ id: 'os.repr.doc' }), a)).toBe(false)
  })

  it('la cle de publication declaree par l entree doit etre vraie', () => {
    const off = app({ is_static: true, publish_options: { representations: null, doc: false } })
    const on = app({ is_static: true, publish_options: { representations: null, doc: true } })
    const e = entry({ id: 'a', publish_option: 'doc' })
    expect(isOfferedToReader(e, off)).toBe(false)
    expect(isOfferedToReader(e, on)).toBe(true)
  })
})

describe('os#1361 diagramCapabilities', () => {
  it('voit une hierarchie portee par les dimensions de noeuds', () => {
    const a = app({ sankey: { level_taggs_list: [], nodes_list: [{ dimensions_as_parent: [{}] }] } })
    expect(diagramCapabilities(a).hierarchy).toBe(true)
  })

  it('ne voit aucune hierarchie sur un diagramme plat', () => {
    const a = app({ sankey: { level_taggs_list: [], nodes_list: [{ dimensions_as_parent: [] }] } })
    expect(diagramCapabilities(a).hierarchy).toBe(false)
  })
})

describe('os#1361 montage et redessin', () => {
  const container = () => ({} as unknown as HTMLElement)

  beforeEach(() => { representation_registry.clear() })
  afterEach(() => { representation_registry.clear() })

  it('rend null sur un id inconnu, plutot que de casser l ecran', () => {
    expect(mountRepresentation('jamais.vu', container(), diagramContext(app()))).toBeNull()
  })

  it('rend null pour une entree de forme host, qui possede deja son rendu', () => {
    representation_registry.register({
      id: 't', scale: 'diagram', order: 10, label: () => 't',
      host: 'component'
    })
    expect(mountRepresentation('t', container(), diagramContext(app()))).toBeNull()
  })

  it('une entree qui ne rend rien reste montable et demontable', () => {
    representation_registry.register(entry({ id: 'v', draw: () => undefined }))
    const m = mountRepresentation('v', container(), diagramContext(app()))
    expect(m?.redraw).toBeNull()
    expect(() => m?.cleanup()).not.toThrow()
  })

  it('la forme historique, une fonction de demontage, reste valide', () => {
    const cleanup = jest.fn()
    representation_registry.register(entry({ id: 'f', draw: () => cleanup }))
    const m = mountRepresentation('f', container(), diagramContext(app()))
    expect(m?.redraw).toBeNull()
    m?.cleanup()
    expect(cleanup).toHaveBeenCalledTimes(1)
  })

  it('la poignee complete expose redraw et cleanup', () => {
    const redraw = jest.fn()
    const cleanup = jest.fn()
    representation_registry.register(entry({ id: 'h', draw: () => ({ redraw, cleanup }) }))
    const m = mountRepresentation('h', container(), diagramContext(app()))
    expect(redrawMounted(m)).toBe(true)
    expect(redraw).toHaveBeenCalledTimes(1)
    m?.cleanup()
    expect(cleanup).toHaveBeenCalledTimes(1)
  })

  it('une poignee sans cleanup reste demontable sans lever', () => {
    representation_registry.register(entry({ id: 'r', draw: () => ({ redraw: () => undefined }) }))
    const m = mountRepresentation('r', container(), diagramContext(app()))
    expect(() => m?.cleanup()).not.toThrow()
  })

  it('redrawMounted rend false quand la representation ne sait pas se redessiner', () => {
    representation_registry.register(entry({ id: 'f', draw: () => () => undefined }))
    expect(redrawMounted(mountRepresentation('f', container(), diagramContext(app())))).toBe(false)
    expect(redrawMounted(null)).toBe(false)
  })

  it('un redraw qui leve vaut false, a l hote de remonter', () => {
    representation_registry.register(entry({
      id: 'b',
      draw: () => ({ redraw: () => { throw new Error('donnees absentes') } })
    }))
    const m = mountRepresentation('b', container(), diagramContext(app()))
    expect(redrawMounted(m)).toBe(false)
  })
})
