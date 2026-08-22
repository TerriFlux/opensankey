// sa#397 — options de publication `view` / `view_label` lues au démarrage du viewer.
// `view` ouvre sur une vue (id OU nom) ; `view_label` restreint le sélecteur aux vues
// portant ce LABEL DE VUE (sa#396 — étiquettes de sélection, PAS les viewTags générateurs).
// Doctrine additive : sans l'option, rien ne change ; valeur invalide → null (ignorée).
// sa#398 — `diagrams_list` accepte en plus des objets {file, view?, view_label?} : chaque
// diagramme d'une page multi-diagrammes porte sa propre sélection de vues. getPublishOptions
// normalise la liste en {libellé: fichier} (consommateurs historiques inchangés) et résout
// `diagrams_views` (sélection effective par libellé, entrée ?? page).
import { getPublishOptions, applyViewerOptions, diagramsListEntryFile } from './PublishOptions'

describe('sa#397 getPublishOptions — view / view_label', () => {
  afterEach(() => {
    delete window.sankey
  })

  it('sans window.sankey : view et view_label valent null (comportement inchangé)', () => {
    const opts = getPublishOptions()
    expect(opts.view).toBeNull()
    expect(opts.view_label).toBeNull()
  })

  it('page publiée sans ces options : null (doctrine additive)', () => {
    window.sankey = { publish: true }
    const opts = getPublishOptions()
    expect(opts.view).toBeNull()
    expect(opts.view_label).toBeNull()
  })

  it('options posées : relues telles quelles', () => {
    window.sankey = { publish: true, view: 'v1', view_label: 'Résultats' }
    const opts = getPublishOptions()
    expect(opts.view).toBe('v1')
    expect(opts.view_label).toBe('Résultats')
  })

  it('valeurs invalides : ignorées (null), pas d\'écran cassé', () => {
    // sa#412 : une LISTE de chaînes est désormais VALIDE pour view_label (cf. suite dédiée) ;
    // les types réellement invalides restent ignorés.
    window.sankey = { publish: true, view: 42 as never, view_label: 42 as never }
    const opts = getPublishOptions()
    expect(opts.view).toBeNull()
    expect(opts.view_label).toBeNull()
  })

  it('applyViewerOptions : les props viewer view / view_label arrivent dans window.sankey', () => {
    applyViewerOptions({ view: 'Ma Vue', view_label: 'Méthode' })
    expect(window.sankey?.view).toBe('Ma Vue')
    expect(window.sankey?.view_label).toBe('Méthode')
    // Et getPublishOptions les relit.
    const opts = getPublishOptions()
    expect(opts.view).toBe('Ma Vue')
    expect(opts.view_label).toBe('Méthode')
  })
})

// sa#412 — `view_label` accepte une LISTE de labels : le filtre actif de page est le PREMIER,
// la liste complète part dans `view_labels` (sélecteur de label VISIBLE du viewer publié).
// Une chaîne simple garde exactement le comportement historique (view_labels = [chaîne]).
describe('sa#412 getPublishOptions — view_label en liste', () => {
  afterEach(() => {
    delete window.sankey
  })

  it('chaîne simple : view_label inchangé, view_labels normalisée en [chaîne]', () => {
    window.sankey = { publish: true, view_label: 'Sources' }
    const opts = getPublishOptions()
    expect(opts.view_label).toBe('Sources')
    expect(opts.view_labels).toEqual(['Sources'])
  })

  it('liste : filtre actif = PREMIER label, liste complète dans view_labels', () => {
    window.sankey = { publish: true, view_label: ['Sources', 'Méthode', 'Niveau de confiance'] }
    const opts = getPublishOptions()
    expect(opts.view_label).toBe('Sources')
    expect(opts.view_labels).toEqual(['Sources', 'Méthode', 'Niveau de confiance'])
  })

  it('liste : entrées invalides ignorées (warn), doublons dédoublonnés', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => { /* silencieux */ })
    window.sankey = { publish: true, view_label: ['Sources', '', 42, 'Sources', 'Méthode'] as never }
    const opts = getPublishOptions()
    expect(opts.view_label).toBe('Sources')
    expect(opts.view_labels).toEqual(['Sources', 'Méthode'])
    expect(warn).toHaveBeenCalled()
    warn.mockRestore()
  })

  it('rien de valide (liste vide ou sans chaîne, option absente) : null, comportement inchangé', () => {
    window.sankey = { publish: true, view_label: [] }
    expect(getPublishOptions().view_label).toBeNull()
    expect(getPublishOptions().view_labels).toBeNull()
    window.sankey = { publish: true }
    expect(getPublishOptions().view_labels).toBeNull()
  })

  it('applyViewerOptions : une liste voyage jusqu\'à getPublishOptions', () => {
    applyViewerOptions({ view_label: ['Sources', 'Méthode'] })
    const opts = getPublishOptions()
    expect(opts.view_label).toBe('Sources')
    expect(opts.view_labels).toEqual(['Sources', 'Méthode'])
  })
})

describe('sa#398 diagramsListEntryFile — fichier d\'une entrée de diagrams_list', () => {
  it('chaîne historique : la chaîne elle-même', () => {
    expect(diagramsListEntryFile('FiliereBois')).toBe('FiliereBois')
  })

  it('objet {file} : son fichier', () => {
    expect(diagramsListEntryFile({ file: 'FiliereBois', view: 'v1' })).toBe('FiliereBois')
  })

  it('entrée invalide (objet sans file, tableau, undefined) : null', () => {
    expect(diagramsListEntryFile({ view: 'v1' })).toBeNull()
    expect(diagramsListEntryFile(['FiliereBois'])).toBeNull()
    expect(diagramsListEntryFile(undefined)).toBeNull()
  })
})

describe('sa#398 getPublishOptions — sélection de vues PAR diagramme (diagrams_list)', () => {
  afterEach(() => {
    delete window.sankey
  })

  it('liste toute en chaînes : diagrams_list identique, diagrams_views null (parc inchangé)', () => {
    window.sankey = { publish: true, diagrams_list: { 'A': 'FileA', 'B': 'FileB' } }
    const opts = getPublishOptions()
    expect(opts.diagrams_list).toEqual({ 'A': 'FileA', 'B': 'FileB' })
    expect(opts.diagrams_views).toBeNull()
    expect(opts.view).toBeNull()
    expect(opts.view_label).toBeNull()
  })

  it('entrées objet SANS sélection propre : liste normalisée, diagrams_views null', () => {
    window.sankey = { publish: true, diagrams_list: { 'A': { file: 'FileA' }, 'B': 'FileB' } }
    const opts = getPublishOptions()
    expect(opts.diagrams_list).toEqual({ 'A': 'FileA', 'B': 'FileB' })
    expect(opts.diagrams_views).toBeNull()
  })

  it('mélange chaîne / objet avec vues : liste normalisée et sélection effective par libellé', () => {
    window.sankey = {
      publish: true,
      diagrams_list: {
        'A': 'FileA',
        'B': { file: 'FileB', view: 'Vue agrégée', view_label: 'focus' },
      },
    }
    const opts = getPublishOptions()
    expect(opts.diagrams_list).toEqual({ 'A': 'FileA', 'B': 'FileB' })
    expect(opts.diagrams_views).toEqual({
      'A': { view: null, view_label: null },
      'B': { view: 'Vue agrégée', view_label: 'focus' },
    })
    // Première entrée sans sélection propre : l'état initial reste celui de la page (aucun).
    expect(opts.view).toBeNull()
    expect(opts.view_label).toBeNull()
  })

  it('la PREMIÈRE entrée porte des vues : elle fait l\'état initial de la page', () => {
    window.sankey = {
      publish: true,
      diagrams_list: {
        'A': { file: 'FileA', view_label: 'Résultats' },
        'B': 'FileB',
      },
    }
    const opts = getPublishOptions()
    expect(opts.view).toBeNull()
    expect(opts.view_label).toBe('Résultats')
  })

  it('options de page en repli : une entrée sans sélection hérite de la page, une entrée avec prime', () => {
    window.sankey = {
      publish: true,
      view_label: 'Général',
      diagrams_list: {
        'A': 'FileA',
        'B': { file: 'FileB', view_label: 'focus' },
      },
    }
    const opts = getPublishOptions()
    expect(opts.diagrams_views).toEqual({
      'A': { view: null, view_label: 'Général' },
      'B': { view: null, view_label: 'focus' },
    })
    // Première entrée = chaîne : état initial = options de page.
    expect(opts.view_label).toBe('Général')
  })

  it('entrée invalide (objet sans file) : ignorée (warn), le reste de la liste survit', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => { /* silencieux */ })
    window.sankey = {
      publish: true,
      diagrams_list: {
        'A': 'FileA',
        'Cassée': { view: 'v1' } as never,
        'B': { file: 'FileB', view: 'v2' },
      },
    }
    const opts = getPublishOptions()
    expect(opts.diagrams_list).toEqual({ 'A': 'FileA', 'B': 'FileB' })
    expect(opts.diagrams_views).toEqual({
      'A': { view: null, view_label: null },
      'B': { view: 'v2', view_label: null },
    })
    warn.mockRestore()
  })

  it('sous_filieres (déprécié, chaînes seules) : normalisation inchangée, diagrams_views null', () => {
    window.sankey = { publish: true, sous_filieres: { 'A': 'FileA' } }
    const opts = getPublishOptions()
    expect(opts.diagrams_list).toEqual({ 'A': 'FileA' })
    expect(opts.diagrams_views).toBeNull()
  })

  it('applyViewerOptions : une diagrams_list à entrées objet voyage jusqu\'à getPublishOptions', () => {
    applyViewerOptions({ diagrams_list: { 'A': { file: 'FileA', view: 'v1' } } })
    const opts = getPublishOptions()
    expect(opts.diagrams_list).toEqual({ 'A': 'FileA' })
    expect(opts.diagrams_views).toEqual({ 'A': { view: 'v1', view_label: null } })
    expect(opts.view).toBe('v1')
  })
})
