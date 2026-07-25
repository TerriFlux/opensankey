// #1255 — Scénario de la visite guidée « premier geste ».
//
// Ce qui est testé ici est le CONTRAT du scénario, pas le rendu @reactour : longueur du tour,
// gating par l'état du diagramme au lancement, avancement automatique sur détection du geste, et
// surtout la règle de nettoyage (ne jamais retirer ce que l'utilisateur a tracé).
//
// Class_ApplicationData est trop lourde à instancier ici : on lui substitue un faux minimal qui
// n'expose que ce que Class_GuidedTour consomme réellement.

import { Class_GuidedTour } from './GuidedTour'
import type { Class_ApplicationData } from './ApplicationData'
import { INSPECTOR_TAB_VALUE_ID } from './inspectorTabIds'

type FakeNode = { id: string }
type FakeLink = { id: string, valueCurrent: number | null, source: FakeNode, target: FakeNode }

const makeFakeAppData = (initial_node_ids: string[] = []) => {
  const nodes: Record<string, FakeNode> = {}
  initial_node_ids.forEach(id => { nodes[id] = { id } })
  const links: FakeLink[] = []
  let seq = 0

  const sankey = {
    get nodes_list() { return Object.values(nodes) },
    get nodes_dict() { return nodes },
    get links_list() { return links },
    addNewDefaultLink: jest.fn(() => {
      const source: FakeNode = { id: `auto_n${seq++}` }
      const target: FakeNode = { id: `auto_n${seq++}` }
      nodes[source.id] = source
      nodes[target.id] = target
      const link: FakeLink = { id: `auto_l${seq++}`, valueCurrent: null, source, target }
      links.push(link)
      return link
    }),
    // Reproduit le contrat du vrai deleteNode : supprimer un nœud emporte ses flux.
    deleteNode: jest.fn((node: FakeNode) => {
      delete nodes[node.id]
      for (let i = links.length - 1; i >= 0; i--) {
        if (links[i].source.id === node.id || links[i].target.id === node.id) links.splice(i, 1)
      }
    }),
    draw: jest.fn(),
  }

  // Mode souris et sélection vivent hors de l'objet : s'y référer depuis ses propres méthodes
  // rendrait son type implicite.
  const mouse_mode = { current: 'selection' as 'selection' | 'edition' }
  const selection = { elements: [] as unknown[], links: [] as FakeLink[] }
  const drawing_area = {
    sankey,
    mouse_mode,
    isInEditionMode: jest.fn(() => mouse_mode.current === 'edition'),
    setToModeEdition: jest.fn((_: boolean) => { mouse_mode.current = _ ? 'edition' : 'selection' }),
    areaAutoFit: jest.fn(),
    draw: jest.fn(),
    get selected_elements_list() { return selection.elements },
    get selected_links_list() { return selection.links },
    purgeSelection: jest.fn(() => { selection.elements = []; selection.links = [] }),
    addElementToSelection: jest.fn((el: unknown) => {
      selection.elements.push(el)
      if (links.includes(el as FakeLink)) selection.links.push(el as FakeLink)
    }),
  }

  const menu_configuration = {
    ref_menu_opened: { current: [false, jest.fn()] as [boolean, (b: boolean) => void] },
    ref_to_menu_config_updater: { current: jest.fn() },
    updateAllComponentsRelatedToToolbar: jest.fn(),
    openConfigMenu: jest.fn(),
    closeConfigMenu: jest.fn(),
    updateInspector: jest.fn(),
    inspector_requested_tab_id: null as string | null,
  }

  const app_data = {
    t: (key: string) => key,
    drawing_area,
    menu_configuration,
    setSteps: jest.fn(),
    // Le vrai reset() remplace la zone de dessin par une neuve : ici on vide le diagramme.
    reset: jest.fn(() => {
      Object.keys(nodes).forEach(id => delete nodes[id])
      links.length = 0
    }),
  }
  return {
    app_data: app_data as unknown as Class_ApplicationData,
    sankey,
    drawing_area,
    menu_configuration,
    selection,
    /**
     * Simule le geste de l'utilisateur : un flux tracé à la souris. Comme le vrai tracé, il laisse
     * le flux ET ses deux nœuds sélectionnés — c'est cette multi-sélection que l'étape « valeur »
     * doit réduire.
     */
    drawLinkByHand: () => {
      const source: FakeNode = { id: 'user_src' }
      const target: FakeNode = { id: 'user_trgt' }
      nodes[source.id] = source
      nodes[target.id] = target
      const link: FakeLink = { id: 'user_link', valueCurrent: null, source, target }
      links.push(link)
      selection.elements = [link, source, target]
      selection.links = [link]
      return link
    },
  }
}

/** Le scénario n'ajoute les étapes « enregistrer » et « aide » que si leur cible est dans le DOM. */
const mountTargets = () => {
  document.body.innerHTML =
    '<button class="topbar_button_save_in_cache"></button>' +
    '<button class="menutop_button_aide"></button>'
}

describe('#1255 — visite guidée « premier geste »', () => {

  beforeEach(() => {
    jest.useFakeTimers()
    mountTargets()
  })

  afterEach(() => {
    jest.clearAllTimers()
    jest.useRealTimers()
    document.body.innerHTML = ''
  })

  describe('lancement — le diagramme en cours est le travail de l\'utilisateur', () => {

    it('repart TOUJOURS de la première étape', () => {
      // Le TourProvider garde `currentStep` d'un lancement à l'autre : sans remise à zéro, une
      // visite terminée (ou abandonnée) se rouvre sur sa dernière étape.
      const fake = makeFakeAppData()
      const tour = new Class_GuidedTour(fake.app_data)
      const goToStep = jest.fn()
      tour.control = { goToStep }

      tour.start(jest.fn())
      expect(goToStep).toHaveBeenCalledWith(0)

      // Y compris pour un relancement après une visite menée jusqu'au bout.
      goToStep.mockClear()
      tour.finish()
      tour.start(jest.fn())
      expect(goToStep).toHaveBeenCalledWith(0)
    })

    it('sur diagramme vide : rien à effacer, aucune question posée', () => {
      const fake = makeFakeAppData()
      const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true)
      const openTour = jest.fn()

      new Class_GuidedTour(fake.app_data).start(openTour)

      expect(confirmSpy).not.toHaveBeenCalled()
      expect(fake.app_data.reset).not.toHaveBeenCalled()
      expect(openTour).toHaveBeenCalled()
      confirmSpy.mockRestore()
    })

    it('sur diagramme existant : demande la permission, puis efface si elle est donnée', () => {
      const fake = makeFakeAppData(['a', 'b'])
      fake.drawLinkByHand()
      const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true)
      const tour = new Class_GuidedTour(fake.app_data)

      tour.start(jest.fn())

      expect(confirmSpy).toHaveBeenCalled()
      expect(fake.app_data.reset).toHaveBeenCalled()
      expect(fake.sankey.nodes_list).toHaveLength(0)
      // Le diagramme étant vide APRÈS l'effacement, le tour attend bien les gestes.
      const steps = tour.buildSteps()
      steps[0].action?.(null)
      expect(fake.drawing_area.setToModeEdition).toHaveBeenCalledWith(true)
      confirmSpy.mockRestore()
    })

    it('permission refusée : rien n\'est supprimé et la visite a lieu quand même', () => {
      const fake = makeFakeAppData(['a', 'b'])
      const link = fake.drawLinkByHand()
      const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(false)
      const openTour = jest.fn()
      const tour = new Class_GuidedTour(fake.app_data)

      tour.start(openTour)

      expect(fake.app_data.reset).not.toHaveBeenCalled()
      expect(fake.sankey.links_list).toEqual([link])
      expect(openTour).toHaveBeenCalled()
      // ...en mode descriptif : aucun geste attendu sur le diagramme conservé.
      const steps = tour.buildSteps()
      steps[0].action?.(null)
      expect(fake.drawing_area.setToModeEdition).not.toHaveBeenCalled()
      confirmSpy.mockRestore()
    })
  })

  it('tient en 8 étapes au plus et ne pointe le bouton Aide qu\'une seule fois', () => {
    const { app_data } = makeFakeAppData()
    const steps = new Class_GuidedTour(app_data).buildSteps()

    expect(steps.length).toBeLessThanOrEqual(8)
    const aide_steps = steps.filter(step => step.selector === '.menutop_button_aide')
    expect(aide_steps).toHaveLength(1)
  })

  // Le piège qui a coûté deux allers-retours : @reactour mesure la cible d'une étape au moment où
  // elle devient active et ne rattrape PAS une cible qui apparaît ensuite (son mutationObservables
  // ne teste que les nœuds ajoutés eux-mêmes, or Chakra monte le tiroir dans un Portal dont le
  // nœud ajouté est le conteneur). Une cible absente est mesurée à 0×0 et l'infobulle part dans le
  // coin de l'écran. D'où les deux invariants ci-dessous.
  it('ouvre le panneau de config dès la construction, pour que ses cibles préexistent', () => {
    const { app_data, menu_configuration } = makeFakeAppData()
    new Class_GuidedTour(app_data).buildSteps()

    expect(menu_configuration.openConfigMenu).toHaveBeenCalled()
  })

  it('ne vise que des cibles stables, jamais un élément qui apparaît en cours d\'étape', () => {
    const { app_data } = makeFakeAppData()
    const selectors = new Class_GuidedTour(app_data).buildSteps().map(step => step.selector)

    // `.tour_link_value` n'existait qu'une fois l'onglet Valeur ouvert — donc après le début de
    // l'étape : cible mesurée à 0×0. On vise le panneau, présent depuis la construction.
    expect(selectors).not.toContain('.tour_link_value')
    expect(selectors).toEqual([
      '#g_drawing',
      '.drawer_menu_config',
      '.inspector_breadcrumb',
      '.topbar_button_save_in_cache',
      '.menutop_button_aide',
    ])
  })

  it('n\'ajoute pas une étape dont la cible est absente du DOM', () => {
    document.body.innerHTML = '' // ni bouton d'enregistrement, ni menu Aide
    const { app_data } = makeFakeAppData()
    const selectors = new Class_GuidedTour(app_data).buildSteps().map(step => step.selector)

    expect(selectors).not.toContain('.topbar_button_save_in_cache')
    expect(selectors).not.toContain('.menutop_button_aide')
  })

  describe('diagramme vide au lancement', () => {

    it('passe en mode édition et avance tout seul quand l\'utilisateur trace un flux', () => {
      const fake = makeFakeAppData()
      const tour = new Class_GuidedTour(fake.app_data)
      const goToStep = jest.fn()
      tour.control = { goToStep }
      const steps = tour.buildSteps()

      steps[0].action?.(null)
      expect(fake.drawing_area.setToModeEdition).toHaveBeenCalledWith(true)

      // Rien ne s'est encore passé : le tour attend.
      jest.advanceTimersByTime(1000)
      expect(goToStep).not.toHaveBeenCalled()

      fake.drawLinkByHand()
      jest.advanceTimersByTime(400)
      expect(goToStep).toHaveBeenCalledWith(1)

      // La scrutation s'arrête d'elle-même : pas d'avancement en boucle.
      goToStep.mockClear()
      jest.advanceTimersByTime(2000)
      expect(goToStep).not.toHaveBeenCalled()
    })

    it('avance quand une valeur est saisie sur le flux', () => {
      const fake = makeFakeAppData()
      const tour = new Class_GuidedTour(fake.app_data)
      const goToStep = jest.fn()
      tour.control = { goToStep }
      const steps = tour.buildSteps()

      const link = fake.drawLinkByHand()
      steps[1].action?.(null)
      jest.advanceTimersByTime(1000)
      expect(goToStep).not.toHaveBeenCalled()

      link.valueCurrent = 42
      jest.advanceTimersByTime(400)
      expect(goToStep).toHaveBeenCalledWith(2)
    })

    it('réduit au flux seul la multi-sélection laissée par le tracé (nœud+nœud+flux)', () => {
      const fake = makeFakeAppData()
      const tour = new Class_GuidedTour(fake.app_data)
      tour.control = { goToStep: jest.fn() }
      const steps = tour.buildSteps()

      const link = fake.drawLinkByHand()
      expect(fake.selection.elements).toHaveLength(3) // état réel après le tracé

      steps[1].action?.(null)

      expect(fake.drawing_area.purgeSelection).toHaveBeenCalled()
      expect(fake.selection.elements).toEqual([link])
      expect(fake.menu_configuration.openConfigMenu).toHaveBeenCalled()
    })

    it('re-rend l\'inspecteur : le tiroir est DÉJÀ ouvert, openConfigMenu n\'y suffit pas', () => {
      const fake = makeFakeAppData()
      // Le tracé a ouvert le tiroir : openConfigMenu sera un no-op, et sans re-render explicite
      // l'inspecteur resterait sur son premier onglet (Forme) — le champ de valeur n'existerait pas.
      fake.menu_configuration.ref_menu_opened.current = [true, jest.fn()]
      const tour = new Class_GuidedTour(fake.app_data)
      tour.control = { goToStep: jest.fn() }
      const steps = tour.buildSteps()

      fake.drawLinkByHand()
      steps[1].action?.(null)

      expect(fake.menu_configuration.updateInspector).toHaveBeenCalled()
      expect(fake.menu_configuration.inspector_requested_tab_id).toBe(INSPECTOR_TAB_VALUE_ID)
    })

    it('ne re-sélectionne pas un flux déjà seul en sélection', () => {
      const fake = makeFakeAppData()
      const tour = new Class_GuidedTour(fake.app_data)
      tour.control = { goToStep: jest.fn() }
      const steps = tour.buildSteps()

      const link = fake.drawLinkByHand()
      fake.selection.elements = [link]
      fake.selection.links = [link]

      steps[1].action?.(null)
      expect(fake.drawing_area.purgeSelection).not.toHaveBeenCalled()
      expect(fake.selection.elements).toEqual([link])
    })

    it('demande l\'onglet Valeur : sans lui le champ de valeur n\'est pas dans le DOM', () => {
      const fake = makeFakeAppData()
      const tour = new Class_GuidedTour(fake.app_data)
      tour.control = { goToStep: jest.fn() }
      const steps = tour.buildSteps()

      fake.drawLinkByHand()
      steps[1].action?.(null)
      expect(fake.menu_configuration.inspector_requested_tab_id).toBe(INSPECTOR_TAB_VALUE_ID)

      // L'utilisateur reprend la main sur les onglets dès la sortie de l'étape...
      steps[1].actionAfter?.(null)
      expect(fake.menu_configuration.inspector_requested_tab_id).toBeNull()

      // ...et l'étape suivante (l'inspecteur) n'impose aucun onglet.
      steps[2].action?.(null)
      expect(fake.menu_configuration.inspector_requested_tab_id).toBeNull()
    })

    it('lève la demande d\'onglet même si le tour est abandonné pendant l\'étape', () => {
      const fake = makeFakeAppData()
      const tour = new Class_GuidedTour(fake.app_data)
      tour.control = { goToStep: jest.fn() }
      const steps = tour.buildSteps()

      fake.drawLinkByHand()
      steps[1].action?.(null)
      tour.finish()

      expect(fake.menu_configuration.inspector_requested_tab_id).toBeNull()
    })

    it('crée un flux de repli si l\'utilisateur atteint l\'étape « valeur » sans avoir tracé', () => {
      const fake = makeFakeAppData()
      const tour = new Class_GuidedTour(fake.app_data)
      tour.control = { goToStep: jest.fn() }
      const steps = tour.buildSteps()

      steps[0].action?.(null)
      steps[0].actionAfter?.(null)
      expect(fake.sankey.links_list).toHaveLength(0) // rien tant qu'on n'est pas arrivé à l'étape

      steps[1].action?.(null)
      expect(fake.sankey.links_list).toHaveLength(1)
      expect(fake.sankey.links_list[0].valueCurrent).toBe(100)
    })

    it('retire le flux de repli à la fin du tour', () => {
      const fake = makeFakeAppData()
      const tour = new Class_GuidedTour(fake.app_data)
      tour.control = { goToStep: jest.fn() }
      const steps = tour.buildSteps()

      steps[1].action?.(null)
      expect(fake.sankey.links_list).toHaveLength(1)

      tour.finish()
      expect(fake.sankey.links_list).toHaveLength(0)
      expect(fake.sankey.nodes_list).toHaveLength(0)
    })

    it('ne touche JAMAIS au flux tracé par l\'utilisateur', () => {
      const fake = makeFakeAppData()
      const tour = new Class_GuidedTour(fake.app_data)
      tour.control = { goToStep: jest.fn() }
      const steps = tour.buildSteps()

      steps[0].action?.(null)
      const link = fake.drawLinkByHand()
      link.valueCurrent = 7
      steps[0].actionAfter?.(null)
      steps[1].action?.(null)

      // Ni flux de repli en doublon, ni valeur réécrite...
      expect(fake.sankey.links_list).toHaveLength(1)
      steps[1].actionAfter?.(null)
      expect(link.valueCurrent).toBe(7)

      // ...et rien n'est supprimé à la fin.
      tour.finish()
      expect(fake.sankey.links_list).toEqual([link])
    })

    it('abandonner le tour dès la 1re étape ne laisse aucun contenu derrière lui', () => {
      const fake = makeFakeAppData()
      const tour = new Class_GuidedTour(fake.app_data)
      tour.control = { goToStep: jest.fn() }
      const steps = tour.buildSteps()

      steps[0].action?.(null)
      steps[0].actionAfter?.(null) // @reactour déclenche l'actionAfter au démontage
      tour.finish()

      expect(fake.sankey.links_list).toHaveLength(0)
      expect(fake.sankey.nodes_list).toHaveLength(0)
    })
  })

  describe('diagramme existant (relance depuis Aide)', () => {

    it('n\'attend aucun geste, ne bascule pas le mode souris et ne crée rien', () => {
      const fake = makeFakeAppData(['a', 'b'])
      const link = fake.drawLinkByHand()
      link.valueCurrent = 12
      const tour = new Class_GuidedTour(fake.app_data)
      const goToStep = jest.fn()
      tour.control = { goToStep }
      const steps = tour.buildSteps()

      steps[0].action?.(null)
      steps[1].action?.(null)
      jest.advanceTimersByTime(2000)

      expect(goToStep).not.toHaveBeenCalled()
      expect(fake.drawing_area.setToModeEdition).not.toHaveBeenCalled()
      expect(fake.sankey.addNewDefaultLink).not.toHaveBeenCalled()
    })

    it('ne supprime rien à la fin du tour', () => {
      const fake = makeFakeAppData(['a', 'b'])
      const link = fake.drawLinkByHand()
      const tour = new Class_GuidedTour(fake.app_data)
      tour.control = { goToStep: jest.fn() }
      tour.buildSteps()

      tour.finish()
      expect(fake.sankey.links_list).toEqual([link])
      expect(fake.sankey.deleteNode).not.toHaveBeenCalled()
    })
  })

  describe('tiroir de configuration', () => {

    it('est refermé à la fin si le tour l\'a ouvert', () => {
      const fake = makeFakeAppData()
      const tour = new Class_GuidedTour(fake.app_data)
      tour.buildSteps() // tiroir fermé au lancement

      tour.finish()
      expect(fake.menu_configuration.closeConfigMenu).toHaveBeenCalled()
    })

    it('est laissé ouvert s\'il l\'était déjà avant le tour', () => {
      const fake = makeFakeAppData()
      fake.menu_configuration.ref_menu_opened.current = [true, jest.fn()]
      const tour = new Class_GuidedTour(fake.app_data)
      tour.buildSteps()

      tour.finish()
      expect(fake.menu_configuration.closeConfigMenu).not.toHaveBeenCalled()
    })
  })
})
