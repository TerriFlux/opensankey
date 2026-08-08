import { getPublishOptions } from './PublishOptions'

// Désignation HISTORIQUE du diagramme courant (22 pages du parc, sa#350).
//
// Ces pages chargent leurs données par `<script src="X.json">` — le fichier est
// une affectation `window.sankey['X'] = {…}` — et désignent l'affiché par une
// RÉFÉRENCE : `window.sankey.filiere = window.sankey['X']`. Elles ne posent
// JAMAIS `window.sankey.diagram`.
//
// Tant que `getPublishOptions` rendait `diagram: null` pour elles, un runtime
// moderne n'avait rien à charger et retombait sur le cache localStorage du
// visiteur (App.tsx) : la page affichait le dernier diagramme de CELUI QUI LA
// REGARDE. Mesuré le 2026-08-08 au banc d'essai sur ProjetsAlimentationAnimale,
// dont la page 2022 est exactement de cette forme.

const DIAGRAM = { version: '0.8', nodes: { node0: { name: 'Coproduits' } } }

const setGlobals = (globals: Record<string, unknown>) => {
  (window as unknown as { sankey?: unknown }).sankey = globals
}

describe('getPublishOptions — chargeur historique', () => {
  afterEach(() => setGlobals({}))

  it('résout le diagramme désigné par window.sankey.filiere', () => {
    setGlobals({
      publish: true,
      matieres: DIAGRAM,
      filiere: DIAGRAM,
      sous_filieres: { 'Matiéres Premières': 'matieres' },
    })
    expect(getPublishOptions().diagram).toBe(DIAGRAM)
  })

  it('à défaut de désignation, prend le premier diagramme du sélecteur', () => {
    setGlobals({
      publish: true,
      matieres: DIAGRAM,
      avoine: { version: '0.8' },
      diagrams_list: { 'Matiéres Premières': 'matieres', Avoine: 'avoine' },
    })
    expect(getPublishOptions().diagram).toBe(DIAGRAM)
  })

  it('ne devine rien quand la référence ne pointe aucun objet', () => {
    setGlobals({ publish: true, diagrams_list: { Avoine: 'avoine' } })
    expect(getPublishOptions().diagram).toBeNull()
  })

  it('laisse la priorité au chargeur moderne', () => {
    setGlobals({ publish: true, diagram: 'etude.json.gz', filiere: DIAGRAM })
    expect(getPublishOptions().diagram).toBe('etude.json.gz')
  })
})
