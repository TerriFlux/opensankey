import {
  placePopupNear, matchesPresentationTrigger, MAX_PRESENTATION_POPUPS,
  presentationPanelId, isPresentationPanelId, elementIdOfPanel, openPresentationFor,
  opensPresentationOnClick, tooltipWouldRenderSomething, hoverOnTextOpensPresentation
} from './openPresentation'
import { presentation_block_registry } from './PresentationBlockRegistry'
import type { Class_ApplicationData } from '../../../types/ApplicationData'
// sa#563 — le routage du clic se juge sur un VRAI document : c est le modele de la grande zone
// qui decide, et un faux objet de panneaux ne saurait rien en dire.
import { Class_ApplicationData as Class_ApplicationDataReal } from '../../../types/ApplicationData'
import { Class_PanelManager, type Type_PopupGeometry } from '../../../types/PanelManager'
import { Class_EventBus } from '../../../types/EventBus'

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

describe('le CLIC n\'ouvre la présentation qu\'en LECTURE', () => {
  // En édition, cliquer est le geste de travail de l'auteur (sélectionner,
  // choisir avant de déplacer, enchaîner sur plusieurs éléments) : une pop-up
  // « valeur + unité » à chaque clic était subie, pas demandée. L'auteur garde
  // le chemin du lecteur par le SURVOL (déclencheur par élément).
  const appWith = (is_editable: boolean) =>
    ({ is_editable }) as unknown as Class_ApplicationData

  it('lecteur : le clic ouvre', () => {
    expect(opensPresentationOnClick(appWith(false))).toBe(true)
  })

  it('éditeur : le clic n\'ouvre pas', () => {
    expect(opensPresentationOnClick(appWith(true))).toBe(false)
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

// Une zone de texte sans description : tous ses blocs rendent null. Ouvrir
// quand même son info-bulle n affichait que le pis-aller « Rien à afficher pour
// cet élément » — désormais elle ne s ouvre pas du tout.
describe('tooltipWouldRenderSomething — info-bulle vide = pas ouverte', () => {
  const app = {} as unknown as Class_ApplicationData
  // Non « link-like » -> composition de NŒUD, qui contient os.block.free_text.
  const element = { id: 'zdt', getElementProperty: () => undefined } as never
  const BLOCK = 'os.block.free_text'

  afterEach(() => presentation_block_registry.unregister(BLOCK))

  it('registre pas encore peuple : comportement historique, on ouvre', () => {
    expect(tooltipWouldRenderSomething(app, element)).toBe(true)
  })

  it('tous les blocs rendent null : rien a montrer, on n ouvre pas', () => {
    presentation_block_registry.register({
      id: BLOCK, target: 'node', order: 1, label: () => '', render: () => null
    })
    expect(tooltipWouldRenderSomething(app, element)).toBe(false)
  })

  it('un bloc rend du contenu : il y a a montrer, on ouvre', () => {
    presentation_block_registry.register({
      id: BLOCK, target: 'node', order: 1, label: () => '', render: () => 'contenu'
    })
    expect(tooltipWouldRenderSomething(app, element)).toBe(true)
  })
})

// #542 — une entrée de légende montre la définition de son étiquette ou de son
// groupe : au survol nu, texte compris, et jamais en pop-up vide.
describe('#542 entrées de légende', () => {
  const legendEntry = (trigger?: 'hover' | 'shift' | 'alt') => ({
    id: 'legend-tag-fiab-fiable',
    getElementProperty: (k: string) => (k === 'tooltip_trigger' ? trigger : undefined)
  })
  const ordinary = { id: 'zdt', getElementProperty: () => undefined }
  const BLOCK = 'os.block.free_text'
  const realApp = () => {
    const panels = new Class_PanelManager(new Class_EventBus())
    return { app: { menu_configuration: { panels } } as unknown as Class_ApplicationData, panels }
  }

  afterEach(() => presentation_block_registry.unregister(BLOCK))

  it('déclencheur par défaut : survol nu ; un déclencheur explicite reste prioritaire', () => {
    expect(matchesPresentationTrigger(legendEntry(), {})).toBe(true)
    expect(matchesPresentationTrigger(legendEntry('shift'), {})).toBe(false)
    // Les autres éléments gardent MAJ + survol.
    expect(matchesPresentationTrigger(ordinary, {})).toBe(false)
  })

  it('le texte d\'une entrée est survolable, pas celui des autres éléments', () => {
    expect(hoverOnTextOpensPresentation(legendEntry())).toBe(true)
    expect(hoverOnTextOpensPresentation(ordinary)).toBe(false)
    expect(hoverOnTextOpensPresentation(fakeElement())).toBe(false)
  })

  it('clic sur une entrée SANS définition : aucune pop-up', () => {
    presentation_block_registry.register({
      id: BLOCK, target: 'node', order: 1, label: () => '', render: () => null
    })
    const { app, panels } = realApp()
    expect(openPresentationFor(app, legendEntry(), { x: 100, y: 100 })).toBe(false)
    expect(panels.open_ids).toEqual([])
  })

  it('clic sur une entrée AVEC définition : la pop-up s\'ouvre', () => {
    presentation_block_registry.register({
      id: BLOCK, target: 'node', order: 1, label: () => '', render: () => 'Fiable : …'
    })
    const { app, panels } = realApp()
    expect(openPresentationFor(app, legendEntry(), { x: 100, y: 100 })).toBe(true)
    expect(panels.getMode(presentationPanelId('legend-tag-fiab-fiable'))).toBe('popup')
  })

  it('hors légende, le clic ouvre comme avant même sans contenu', () => {
    presentation_block_registry.register({
      id: BLOCK, target: 'node', order: 1, label: () => '', render: () => null
    })
    const { app } = realApp()
    expect(openPresentationFor(app, ordinary, { x: 100, y: 100 })).toBe(true)
  })
})

describe('#305 plafond de pop-ups', () => {
  it('est borné, pour ne pas noyer le diagramme sous les pop-ups', () => {
    expect(MAX_PRESENTATION_POPUPS).toBeGreaterThan(0)
    expect(MAX_PRESENTATION_POPUPS).toBeLessThanOrEqual(10)
  })
})

// OS#321 — le clic sur un élément ouvre une pop-up TRANSITOIRE, et recliquer le
// même élément la referme (bascule). Testé sur un vrai modèle de panneaux : ce
// sont ses invariants qu'on éprouve, pas le rendu.

describe('#321 présentation au clic : transitoire et bascule', () => {
  const realApp = () => {
    const panels = new Class_PanelManager(new Class_EventBus())
    const app = {
      menu_configuration: { panels }
    } as unknown as Class_ApplicationData
    return { app, panels }
  }
  const element = (id: string) => ({
    id, getElementProperty: () => undefined
  })

  it('la pop-up d\'un élément n\'est pas épinglée', () => {
    const { app, panels } = realApp()
    expect(openPresentationFor(app, element('n1'), { x: 100, y: 100 })).toBe(true)
    expect(panels.getMode(presentationPanelId('n1'))).toBe('popup')
    expect(panels.isPinned(presentationPanelId('n1'))).toBe(false)
  })

  it('sélectionner les éléments l\'un après l\'autre n\'empile pas les fenêtres', () => {
    const { app, panels } = realApp()
    openPresentationFor(app, element('n1'), { x: 100, y: 100 })
    // Le clic sur n2 congédie d'abord les transitoires (PanelDismissLayer).
    panels.dismissTransientPopups()
    openPresentationFor(app, element('n2'), { x: 300, y: 100 })
    expect(panels.open_ids).toEqual([presentationPanelId('n2')])
  })

  it('recliquer le même élément REFERME sa pop-up', () => {
    const { app, panels } = realApp()
    openPresentationFor(app, element('n1'), { x: 100, y: 100 })
    panels.dismissTransientPopups()
    expect(openPresentationFor(app, element('n1'), { x: 100, y: 100 })).toBe(false)
    expect(panels.getMode(presentationPanelId('n1'))).toBeNull()
  })

  it('une pop-up ÉPINGLÉE survit au clic et ne saute pas sous le curseur', () => {
    const { app, panels } = realApp()
    openPresentationFor(app, element('n1'), { x: 100, y: 100 })
    const id = presentationPanelId('n1')
    panels.setPinned(id, true)
    const posee = panels.getPopupGeometry(id)
    panels.dismissTransientPopups()
    openPresentationFor(app, element('n1'), { x: 700, y: 400 })
    expect(panels.getMode(id)).toBe('popup')
    expect(panels.getPopupGeometry(id)).toEqual(posee)
  })
})

/**
 * sa#563 (lots 1 a 3) — LE CLIC SUR UN ELEMENT OUVRE UN VOLET, pas un panneau.
 *
 * La pop-up de presentation etait un PANNEAU : un mecanisme parallele a celui des volets, ou rien
 * n etait ni selectionnable, ni reglable, ni deplacable, et que la colonne d outils ignorait.
 * Elle est devenue un occupant de la grande zone, place 'floating'.
 *
 * DEUX REPLIS SUBSISTENT, et ils ne sont pas des restes : une page SANS grande zone (le viewer du
 * paquet MIT ne monte pas `MainZoneTabs`) et une ZONE DE LEGENDE (ni noeud ni flux, donc pas un
 * sujet de volet) gardent la pop-up. Ces epreuves figent les trois chemins.
 */
describe('sa#563 le clic ouvre un volet flottant quand la grande zone est la', () => {
  const node = (id: string) => ({ id, getElementProperty: () => undefined }) as never
  const link = (id: string) => ({
    id, source: { name: 'A' }, target: { name: 'B' }, getElementProperty: () => undefined
  }) as never

  const hostedApp = () => {
    const app = new Class_ApplicationDataReal(false)
    app.menu_configuration.main_zone_hosted = true
    return app
  }

  it('un NOEUD : un volet flottant de nature « Infos », actif, et aucun panneau', () => {
    const app = hostedApp()
    expect(openPresentationFor(app, node('n1'), { x: 100, y: 100 })).toBe(true)
    const mc = app.menu_configuration
    const floating = mc.mainZoneOccupantsIn('floating')
    expect(floating).toHaveLength(1)
    expect(floating[0].subject).toEqual({ kind: 'node', id: 'n1' })
    expect(floating[0].representation).toBe('os.repr.element_info')
    expect(mc.main_zone_active_id).toBe(floating[0].id)
    // Aucun panneau ouvert : le chemin parallele n est pas emprunte.
    expect(mc.panels.open_ids).toHaveLength(0)
  })

  it('un FLUX : meme volet, sujet « link »', () => {
    const app = hostedApp()
    openPresentationFor(app, link('l1'), { x: 100, y: 100 })
    expect(app.menu_configuration.mainZoneOccupantsIn('floating')[0].subject)
      .toEqual({ kind: 'link', id: 'l1' })
  })

  it('recliquer le meme element DESIGNE son volet au lieu d en empiler un second', () => {
    const app = hostedApp()
    openPresentationFor(app, node('n1'), { x: 100, y: 100 })
    const first = app.menu_configuration.mainZoneOccupantsIn('floating')[0].id
    // On designe une autre fenetre entre-temps, pour verifier que le second clic la ramene.
    app.menu_configuration.activateMainZoneCanvas()
    openPresentationFor(app, node('n1'), { x: 700, y: 400 })
    expect(app.menu_configuration.mainZoneOccupantsIn('floating')).toHaveLength(1)
    expect(app.menu_configuration.main_zone_active_id).toBe(first)
  })

  it('SANS grande zone, la pop-up de panneau reste le contenant (viewer du paquet MIT)', () => {
    const app = new Class_ApplicationDataReal(false)
    expect(app.menu_configuration.main_zone_hosted).toBe(false)
    openPresentationFor(app, node('n1'), { x: 100, y: 100 })
    expect(app.menu_configuration.mainZoneOccupantsIn('floating')).toHaveLength(0)
    expect(app.menu_configuration.panels.getMode(presentationPanelId('n1'))).toBe('popup')
  })
})
