import { Class_InspectorRegistry, type Type_InspectorSection } from './InspectorRegistry'
import type { Class_ApplicationData } from '../../../types/ApplicationData'

// #1243 — Registre de sections d'inspecteur, testé en isolation (aucun rendu :
// seules la résolution par cible, la dédup par id, le gating et l'ordre comptent).

const fake_app = { has_sankey_plus: false } as unknown as Class_ApplicationData

function section(over: Partial<Type_InspectorSection> & { id: string }): Type_InspectorSection {
  return {
    target: 'node',
    order: 10,
    hue: 'data',
    title: () => over.id,
    render: () => null,
    ...over
  }
}

describe('#1243 Class_InspectorRegistry', () => {
  it('retourne les sections de la cible, triées par ordre croissant', () => {
    const reg = new Class_InspectorRegistry()
    reg.register(section({ id: 'b', order: 20 }))
    reg.register(section({ id: 'a', order: 10 }))
    reg.register(section({ id: 'other', target: 'link' }))
    expect(reg.getSectionsFor('node', fake_app).map(s => s.id)).toEqual(['a', 'b'])
  })

  it('ré-enregistrer un id remplace la section (idempotence)', () => {
    const reg = new Class_InspectorRegistry()
    reg.register(section({ id: 'a', order: 10 }))
    reg.register(section({ id: 'a', order: 30 }))
    const got = reg.getSectionsFor('node', fake_app)
    expect(got).toHaveLength(1)
    expect(got[0].order).toBe(30)
  })

  it('le gating de licence filtre les sections', () => {
    const reg = new Class_InspectorRegistry()
    reg.register(section({ id: 'free' }))
    reg.register(section({ id: 'plus', gate: (app) => app.has_sankey_plus }))
    expect(reg.getSectionsFor('node', fake_app).map(s => s.id)).toEqual(['free'])
    const app_plus = { has_sankey_plus: true } as unknown as Class_ApplicationData
    expect(reg.getSectionsFor('node', app_plus).map(s => s.id)).toEqual(['free', 'plus'])
  })

  it('une section multi-cibles apparaît pour chacune de ses cibles', () => {
    const reg = new Class_InspectorRegistry()
    reg.register(section({ id: 'shared', target: ['node', 'link'] }))
    expect(reg.getSectionsFor('node', fake_app)).toHaveLength(1)
    expect(reg.getSectionsFor('link', fake_app)).toHaveLength(1)
    expect(reg.getSectionsFor('view', fake_app)).toHaveLength(0)
  })

  it('unregister retire la section', () => {
    const reg = new Class_InspectorRegistry()
    reg.register(section({ id: 'a' }))
    reg.unregister('a')
    expect(reg.getSectionsFor('node', fake_app)).toHaveLength(0)
    expect(reg.size).toBe(0)
  })
})
