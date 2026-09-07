// os#1366 — Le mode d'affichage vu comme un RÉGLAGE DE LECTURE.
//
// Deux garanties, distinctes de la règle d'affichage testée dans `positionModeHost.test.ts` :
//  1. le geste du lecteur ne persiste RIEN — il pose le mode en mémoire et redessine, sans lever
//     le marqueur d'enregistrement ni sérialiser quoi que ce soit ;
//  2. l'option de publication `position_mode_selector` vaut TRUE par défaut (elle n'existe que
//     pour COUPER l'apparition automatique), et une page déjà publiée qui ne la pose pas garde
//     donc exactement le comportement décidé par la présence d'une référence.

import {
  applyPositionMode, setScaleAdaptedReferenceDataTag, scaleAdaptedReferenceDataTagOf
} from './positionModeHost'
import { getPublishOptions } from '../../types/PublishOptions'
import type { Class_ApplicationData } from '../../types/ApplicationData'
import type { Class_DataTagGroup } from '../../types/TagGroup'

type Trace = {
  updates_data: number
  updates_flux: number
  save_in_cache: boolean[]
  serialisations: number
  applied_force: boolean[]
}

const makeStubs = () => {
  const trace: Trace = {
    updates_data: 0, updates_flux: 0, save_in_cache: [], serialisations: 0, applied_force: []
  }
  const app_data = {
    menu_configuration: {
      updateAllComponentsRelatedToDataTags: () => { trace.updates_data += 1 },
      updateAllComponentsRelatedToFluxTags: () => { trace.updates_flux += 1 },
      // Le marqueur « il y a du travail à enregistrer » : il ne doit JAMAIS être levé par ce geste.
      ref_to_save_in_cache_indicator: { current: (v: boolean) => { trace.save_in_cache.push(v) } },
    },
    toJSON: () => { trace.serialisations += 1; return {} },
  } as unknown as Class_ApplicationData

  const tagg = {
    id: 'annee',
    name: 'Année',
    position_mode: 'absolute',
    applyPositionModeToDrawing: (force: boolean) => { trace.applied_force.push(force) },
  } as unknown as Class_DataTagGroup

  return { app_data, tagg, trace }
}

describe('os#1366 applyPositionMode — reglage de lecture, volatile', () => {
  it('pose le mode sur la dimension et le montre aussitot', () => {
    const { app_data, tagg, trace } = makeStubs()
    applyPositionMode(app_data, tagg, 'scale_adapted')
    expect(tagg.position_mode).toBe('scale_adapted')
    // `force` : le clic est un choix explicite, il l'emporte sur un mode hérité.
    expect(trace.applied_force).toEqual([true])
    expect(trace.updates_data).toBe(1)
    expect(trace.updates_flux).toBe(1)
  })

  it('n ecrit rien : ni marqueur d enregistrement, ni serialisation', () => {
    const { app_data, tagg, trace } = makeStubs()
    applyPositionMode(app_data, tagg, 'proportional')
    applyPositionMode(app_data, tagg, 'absolute')
    expect(trace.save_in_cache).toEqual([])
    expect(trace.serialisations).toBe(0)
  })
})

// os#1383 — La référence du mode « échelle adaptée » se DÉSIGNE. Le modèle existait depuis
// os#1372 (`scale_adapted_reference_datatag`, persisté et lu par l'algorithme) mais aucune
// interface ne le posait : la grandeur de référence restait celle capturée au vol, donc
// dépendante du chemin de clics. Ce geste est la commande manquante.
describe('os#1383 setScaleAdaptedReferenceDataTag — la reference est enoncee', () => {
  const makeRefStubs = () => {
    const { app_data, tagg, trace } = makeStubs()
    const oublis: number[] = []
    let ids: string[] = []
    // La zone de dessin réduite à ce que le geste touche, setter compris : c'est lui qui
    // oublie la base capturée contre l'ANCIENNE référence.
    const drawing_area = {
      get scale_adapted_reference_datatag() { return ids },
      set scale_adapted_reference_datatag(v: string[]) { ids = v; oublis.push(1) },
    }
    Object.defineProperty(app_data, 'drawing_area', { value: drawing_area, configurable: true })
    Object.defineProperty(tagg, 'tags_list', {
      value: [{ id: 'chene', name: 'Chêne' }, { id: 'pin', name: 'Pin maritime' }],
      configurable: true,
    })
    return { app_data, tagg, trace, oublis, lire: () => ids, poser: (v: string[]) => { ids = v } }
  }

  it('designe un tag, et le relit', () => {
    const { app_data, tagg, trace, oublis } = makeRefStubs()
    setScaleAdaptedReferenceDataTag(app_data, tagg, 'chene')
    expect(scaleAdaptedReferenceDataTagOf(app_data, tagg)).toBe('chene')
    // La base capturée est oubliée : elle valait contre une autre référence.
    expect(oublis).toEqual([1])
    // Rejouer le mode est ce qui fait VOIR la nouvelle référence.
    expect(trace.applied_force).toEqual([true])
  })

  it('remplace la reference de SA dimension et laisse celle des autres', () => {
    const { app_data, tagg, poser, lire } = makeRefStubs()
    poser(['pin', 'annee_2020'])
    setScaleAdaptedReferenceDataTag(app_data, tagg, 'chene')
    // Au plus un tag par dimension : `pin` cède la place, `annee_2020` reste.
    expect(lire()).toEqual(['annee_2020', 'chene'])
  })

  it('undefined libere la reference : retour a la selection courante', () => {
    const { app_data, tagg, poser, lire } = makeRefStubs()
    poser(['chene', 'annee_2020'])
    setScaleAdaptedReferenceDataTag(app_data, tagg, undefined)
    expect(lire()).toEqual(['annee_2020'])
    expect(scaleAdaptedReferenceDataTagOf(app_data, tagg)).toBeUndefined()
  })
})

describe('os#1366 option de publication position_mode_selector', () => {
  afterEach(() => {
    delete window.sankey
  })

  it('vaut true par defaut, y compris sur une page publiee qui ne la pose pas', () => {
    expect(getPublishOptions().position_mode_selector).toBe(true)
    window.sankey = { publish: true }
    expect(getPublishOptions().position_mode_selector).toBe(true)
  })

  it('posee a false par l auteur, elle coupe l apparition automatique', () => {
    window.sankey = { publish: true, position_mode_selector: false }
    expect(getPublishOptions().position_mode_selector).toBe(false)
  })
})
