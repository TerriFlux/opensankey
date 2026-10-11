import { applyViewerOptions, getPublishOptions, PUBLISH_FLAG_DEFAULTS } from './PublishOptions'
import type { Type_PublishFlag } from './PublishOptions'

// 11/10/2026 — os#1511, lot 6 : LES OPTIONS BOOLEENNES D UNE PAGE PUBLIEE ONT UNE SEULE TABLE DE
// DEFAUTS (`PUBLISH_FLAG_DEFAULTS`), lue par getPublishOptions, la modale d OS+ et les props du viewer.

const w = window as unknown as { sankey?: Record<string, unknown> }
afterEach(() => { delete w.sankey })

describe('os#1511 lot 6 — une table pour les options de publication', () => {
  test('sans reglage, chaque option vaut son defaut de la table', () => {
    w.sankey = {}
    const o = getPublishOptions() as unknown as Record<string, unknown>
    ;(Object.keys(PUBLISH_FLAG_DEFAULTS) as Type_PublishFlag[]).forEach(k => expect(o[k]).toBe(PUBLISH_FLAG_DEFAULTS[k]))
  })
  test('un reglage pose l emporte, une valeur non booleenne retombe au defaut', () => {
    w.sankey = { topbar: false, badge: 'oui' }
    const o = getPublishOptions()
    expect(o.topbar).toBe(false)
    expect(o.badge).toBe(PUBLISH_FLAG_DEFAULTS.badge)
  })
  test('le viewer recoit les options booleennes en props, hors le mode publie et l info', () => {
    w.sankey = {}
    applyViewerOptions({ topbar: false, pane_picker: true, lock_zoom: true })
    expect(w.sankey).toMatchObject({ publish: true, topbar: false, pane_picker: true, lock_zoom: true })
    applyViewerOptions({ app_info: false } as unknown as Parameters<typeof applyViewerOptions>[0])
    expect(w.sankey?.app_info).toBeUndefined()
  })
})
