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
} = {}): Class_ApplicationData => {
  const popups = opts.popups ?? {}
  return {
    menu_configuration: {
      panels: {
        open_ids: Object.keys(popups),
        getMode: (id: string) => (id in popups ? 'popup' : null),
        getPopupGeometry: (id: string) => popups[id] ?? null
      }
    }
  } as unknown as Class_ApplicationData
}

// Élément factice porteur d'un déclencheur (attribut de style).
const fakeElement = (trigger?: 'hover' | 'shift' | 'alt') => ({
  getElementProperty: (k: string) => (k === 'tooltip_trigger' ? trigger : undefined)
}) as never

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

describe('matchesPresentationTrigger — déclencheur PROPRE À L\'ÉLÉMENT', () => {
  it('« survol » accepte tout survol', () => {
    expect(matchesPresentationTrigger(fakeElement('hover'), {})).toBe(true)
  })

  it('défaut (attribut absent) = MAJ + survol', () => {
    expect(matchesPresentationTrigger(fakeElement(undefined), {})).toBe(false)
    expect(matchesPresentationTrigger(fakeElement(undefined), { shiftKey: true })).toBe(true)
  })

  it('« MAJ » exige la touche MAJ', () => {
    expect(matchesPresentationTrigger(fakeElement('shift'), {})).toBe(false)
    expect(matchesPresentationTrigger(fakeElement('shift'), { shiftKey: true })).toBe(true)
    expect(matchesPresentationTrigger(fakeElement('shift'), { altKey: true })).toBe(false)
  })

  it('« Alt » exige la touche Alt', () => {
    expect(matchesPresentationTrigger(fakeElement('alt'), { altKey: true })).toBe(true)
    expect(matchesPresentationTrigger(fakeElement('alt'), { shiftKey: true })).toBe(false)
  })
})

describe('#305 plafond de pop-ups', () => {
  it('est borné, pour ne pas noyer le diagramme sous les pop-ups', () => {
    expect(MAX_PRESENTATION_POPUPS).toBeGreaterThan(0)
    expect(MAX_PRESENTATION_POPUPS).toBeLessThanOrEqual(10)
  })
})
