// os#1359 — option de publication `data_links_reveal` : ouvre au LECTEUR la case
// « Toutes données », qui révèle les flux porteurs d'une donnée collectée tous niveaux
// d'agrégation confondus.
//
// Elle est la seule du groupe des filtres à valoir FALSE par défaut : cette lecture montre
// la matière première d'une étude, l'exposer se décide, et aucune page déjà publiée ne doit
// changer d'aspect au prochain déploiement. En édition la case ne dépend pas de l'option.
import { getPublishOptions, applyViewerOptions } from './PublishOptions'

describe('os#1359 getPublishOptions — data_links_reveal', () => {
  afterEach(() => {
    delete window.sankey
  })

  it('sans window.sankey : false', () => {
    expect(getPublishOptions().data_links_reveal).toBe(false)
  })

  it('page publiee qui ne pose pas la cle : false, le parc existant ne bouge pas', () => {
    window.sankey = { publish: true }
    expect(getPublishOptions().data_links_reveal).toBe(false)
  })

  it('option posee par l auteur : relue telle quelle', () => {
    window.sankey = { publish: true, data_links_reveal: true }
    expect(getPublishOptions().data_links_reveal).toBe(true)
  })

  it('les autres filtres gardent leur defaut a true', () => {
    window.sankey = { publish: true }
    const opts = getPublishOptions()
    expect(opts.data_filter).toBe(true)
    expect(opts.level_filter).toBe(true)
  })

  it('applyViewerOptions : la prop viewer arrive dans window.sankey et se relit', () => {
    applyViewerOptions({ data_links_reveal: true })
    expect(window.sankey?.data_links_reveal).toBe(true)
    expect(getPublishOptions().data_links_reveal).toBe(true)
  })
})
