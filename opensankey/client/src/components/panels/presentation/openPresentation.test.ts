import {
  placePopupNear, matchesPresentationTrigger, MAX_PRESENTATION_POPUPS,
  presentationPanelId, isPresentationPanelId, elementIdOfPanel
} from './openPresentation'
import type { Class_ApplicationData } from '../../../types/ApplicationData'
import type { Type_PopupGeometry } from '../../../types/PanelManager'

// OS#305 Lot 4 — placement des pop-ups et déclenchement, testés sur un modèle
// de panneaux factice (aucun rendu).

const fakeApp = (opts: {
  popups?: Record<string, Type_PopupGeometry>
  trigger?: 'hover' | 'shift' | 'alt'
} = {}): Class_ApplicationData => {
  const popups = opts.popups ?? {}
  return {
    menu_configuration: {
      panels: {
        open_ids: Object.keys(popups),
        getMode: (id: string) => (id in popups ? 'popup' : null),
        getPopupGeometry: (id: string) => popups[id] ?? null,
        presentation_trigger: opts.trigger ?? 'shift'
      }
    }
  } as unknown as Class_ApplicationData
}

describe('#305 identité des panneaux de présentation', () => {
  it('préfixe, reconnaît et retrouve l\'id d\'élément', () => {
    const id = presentationPanelId('noeud A')
    expect(isPresentationPanelId(id)).toBe(true)
    expect(isPresentationPanelId('config')).toBe(false)
    expect(elementIdOfPanel(id)).toBe('noeud A')
  })
})

describe('#305 placePopupNear — juxtaposition et anti-collision', () => {
  it('pose la pop-up À DROITE du point d\'ancrage', () => {
    const g = placePopupNear(fakeApp(), { x: 100, y: 200 }, 'moi')
    expect(g.x).toBeGreaterThan(100)
  })

  it('bascule à GAUCHE quand la droite déborde de la fenêtre', () => {
    const near_right = { x: window.innerWidth - 20, y: 200 }
    const g = placePopupNear(fakeApp(), near_right, 'moi')
    expect(g.x).toBeLessThan(near_right.x)
    expect(g.x + g.w).toBeLessThanOrEqual(window.innerWidth)
  })

  it('borne toujours la pop-up dans la fenêtre', () => {
    const g = placePopupNear(fakeApp(), { x: -500, y: -500 }, 'moi')
    expect(g.x).toBeGreaterThanOrEqual(0)
    expect(g.y).toBeGreaterThanOrEqual(0)
    expect(g.x + g.w).toBeLessThanOrEqual(window.innerWidth)
    expect(g.y + g.h).toBeLessThanOrEqual(window.innerHeight)
  })

  it('DÉCALE la pop-up quand elle recouvrirait une pop-up déjà posée', () => {
    const anchor = { x: 100, y: 200 }
    const seule = placePopupNear(fakeApp(), anchor, 'moi')
    // La même position est déjà occupée par une autre pop-up.
    const encombre = fakeApp({ popups: { autre: seule } })
    const g = placePopupNear(encombre, anchor, 'moi')
    const overlap = g.x < seule.x + seule.w && seule.x < g.x + g.w
      && g.y < seule.y + seule.h && seule.y < g.y + g.h
    expect(overlap).toBe(false)
  })

  it('ignore SA PROPRE géométrie dans la détection de collision', () => {
    const anchor = { x: 100, y: 200 }
    const seule = placePopupNear(fakeApp(), anchor, 'moi')
    // 'moi' est déjà ouverte à cette place : elle ne doit pas se fuir elle-même.
    const app = fakeApp({ popups: { moi: seule } })
    expect(placePopupNear(app, anchor, 'moi')).toEqual(seule)
  })

  it('sans ancre, place la pop-up au centre', () => {
    const g = placePopupNear(fakeApp(), undefined, 'moi')
    expect(g.x).toBeCloseTo(Math.round(window.innerWidth / 2 - g.w / 2), -1)
  })
})

describe('#305 matchesPresentationTrigger — grammaire du document', () => {
  it('« survol » accepte tout survol', () => {
    const app = fakeApp({ trigger: 'hover' })
    expect(matchesPresentationTrigger(app, {})).toBe(true)
  })

  it('« MAJ » exige la touche MAJ', () => {
    const app = fakeApp({ trigger: 'shift' })
    expect(matchesPresentationTrigger(app, {})).toBe(false)
    expect(matchesPresentationTrigger(app, { shiftKey: true })).toBe(true)
    expect(matchesPresentationTrigger(app, { altKey: true })).toBe(false)
  })

  it('« Alt » exige la touche Alt', () => {
    const app = fakeApp({ trigger: 'alt' })
    expect(matchesPresentationTrigger(app, { altKey: true })).toBe(true)
    expect(matchesPresentationTrigger(app, { shiftKey: true })).toBe(false)
  })
})

describe('#305 plafond de pop-ups', () => {
  it('est borné, pour ne pas noyer le diagramme sous les pop-ups', () => {
    expect(MAX_PRESENTATION_POPUPS).toBeGreaterThan(0)
    expect(MAX_PRESENTATION_POPUPS).toBeLessThanOrEqual(10)
  })
})
