import { Class_FilterPanelRegistry, type Type_FilterPanelSection } from './FilterPanelRegistry'
import type { Class_ApplicationData } from '../../types/ApplicationData'

// #1243 — Registre des sections « Éditer » du panneau de filtres (relogement
// des groupes de tags / vues, règle R3). Testé en isolation : ordre, dédup par
// id, gating. Aucun rendu.

const fake_app = { has_sankey_plus: false } as unknown as Class_ApplicationData
const app_plus = { has_sankey_plus: true } as unknown as Class_ApplicationData

function section(over: Partial<Type_FilterPanelSection> & { id: string }): Type_FilterPanelSection {
  return {
    order: 10,
    title: () => over.id,
    render: () => null,
    ...over
  }
}

describe('#1243 Class_FilterPanelRegistry', () => {
  it('retourne les sections triées par ordre croissant', () => {
    const reg = new Class_FilterPanelRegistry()
    reg.register(section({ id: 'b', order: 20 }))
    reg.register(section({ id: 'a', order: 10 }))
    expect(reg.getSections(fake_app).map(s => s.id)).toEqual(['a', 'b'])
  })

  it('ré-enregistrer un id remplace la section (idempotence)', () => {
    const reg = new Class_FilterPanelRegistry()
    reg.register(section({ id: 'a', order: 10 }))
    reg.register(section({ id: 'a', order: 30 }))
    expect(reg.size).toBe(1)
    expect(reg.getSections(fake_app)[0].order).toBe(30)
  })

  it('le gating de licence filtre les sections', () => {
    const reg = new Class_FilterPanelRegistry()
    reg.register(section({ id: 'free' }))
    reg.register(section({ id: 'plus', gate: (app) => app.has_sankey_plus }))
    expect(reg.getSections(fake_app).map(s => s.id)).toEqual(['free'])
    expect(reg.getSections(app_plus).map(s => s.id)).toEqual(['free', 'plus'])
  })

  it('unregister retire la section', () => {
    const reg = new Class_FilterPanelRegistry()
    reg.register(section({ id: 'a' }))
    reg.unregister('a')
    expect(reg.getSections(fake_app)).toHaveLength(0)
    expect(reg.size).toBe(0)
  })

  it('un registre vide ne propose aucune section (onglet Éditer masqué en OS pur)', () => {
    const reg = new Class_FilterPanelRegistry()
    expect(reg.getSections(fake_app)).toHaveLength(0)
  })

  it('short_title est optionnel : le bouton d’onglet retombe sur title', () => {
    const reg = new Class_FilterPanelRegistry()
    reg.register(section({ id: 'long', title: () => 'Étiquettes des nœuds' }))
    reg.register(section({
      id: 'short', order: 20,
      title: () => 'Étiquettes des flux',
      short_title: () => 'Flux'
    }))
    const [a, b] = reg.getSections(fake_app)
    expect((a.short_title ?? a.title)(fake_app)).toBe('Étiquettes des nœuds')
    expect((b.short_title ?? b.title)(fake_app)).toBe('Flux')
  })
})
