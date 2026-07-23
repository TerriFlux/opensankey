import { resolveInspectorTarget } from './InspectorResolver'

// #1243 — Résolveur d'inspecteur piloté par la sélection (fonction pure).

describe('#1243 resolveInspectorTarget', () => {
  it('aucune sélection → vue', () => {
    expect(resolveInspectorTarget()).toEqual({ target: 'view', count: 0 })
    expect(resolveInspectorTarget({})).toEqual({ target: 'view', count: 0 })
  })

  it('un seul type sélectionné → cible de ce type, count = nombre', () => {
    expect(resolveInspectorTarget({ nodes: 1 })).toEqual({ target: 'node', count: 1 })
    expect(resolveInspectorTarget({ nodes: 3 })).toEqual({ target: 'node', count: 3 })
    expect(resolveInspectorTarget({ links: 2 })).toEqual({ target: 'link', count: 2 })
    expect(resolveInspectorTarget({ containers: 1 })).toEqual({ target: 'container', count: 1 })
    expect(resolveInspectorTarget({ legend: true })).toEqual({ target: 'legend', count: 1 })
    expect(resolveInspectorTarget({ title: true })).toEqual({ target: 'title', count: 1 })
  })

  it('plusieurs types → mixed avec le total d\'éléments', () => {
    expect(resolveInspectorTarget({ nodes: 2, links: 1 }))
      .toEqual({ target: 'mixed', count: 3 })
    expect(resolveInspectorTarget({ nodes: 1, containers: 1, legend: true }))
      .toEqual({ target: 'mixed', count: 3 })
  })

  it('view_override force la vue même avec une sélection active', () => {
    expect(resolveInspectorTarget({ nodes: 5 }, true))
      .toEqual({ target: 'view', count: 0 })
    expect(resolveInspectorTarget({ nodes: 1, links: 1 }, true))
      .toEqual({ target: 'view', count: 0 })
  })

  it('un même type sur plusieurs éléments ne bascule pas en mixed', () => {
    expect(resolveInspectorTarget({ nodes: 10 }).target).toBe('node')
    expect(resolveInspectorTarget({ links: 4 }).target).toBe('link')
  })

  it('légende + titre comptent comme deux types distincts → mixed', () => {
    expect(resolveInspectorTarget({ legend: true, title: true }))
      .toEqual({ target: 'mixed', count: 2 })
  })
})
