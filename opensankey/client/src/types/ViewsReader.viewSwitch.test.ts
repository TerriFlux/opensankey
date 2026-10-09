import { ViewsReader } from './ViewsReader'
import { MASTER_VIEW_ID } from './ViewsQuery'
import { Class_ViewSwitchProgress, Type_ViewSwitchIndicator } from './viewSwitchProgress'
import type { Class_ApplicationData } from './ApplicationData'

// os#1368 — Le BRANCHEMENT entre les deux entrées de bascule et le corps du switch.
//
// `applyViewChange` n'est pas modifié par ce lot : caméra (os#1315 / #680), mode de position
// (`prev_position_mode`) et sélection de view tags restent posés par le même code, dans le même
// ordre. Ce qui est testé ici, c'est donc exactement ce qui a changé : QUI appelle ce corps, QUAND,
// et avec quel id — plus le fait que le chemin programmatique reste synchrone à la lettre.

const view = (name: string, is_light: boolean, window_only = false) => ({
  name, json: new Uint8Array(), is_light, window_only,
})

type Host = {
  views_dict: { [id: string]: ReturnType<typeof view> }
  views_order: string[]
  current_view_id: string
  master_view_name: string
  show_master_in_views: boolean
  master_drawing_area: unknown
  drawing_area: unknown
  publish_view_label_filter: string | null
  // sa#581 — l'hôte place les vues sur les volets de la grande zone : le double note ce qu'il place,
  // et combien de bascules lui sont parvenues comme gestes d'utilisateur.
  placed: string[]
  gestures: number
  isWindowOnlyView: (id: string) => boolean
  runAsViewGesture: (work: () => void) => void
  placeViewOnPanes: (id: string) => void
}

const makeHost = (current_view_id = MASTER_VIEW_ID): Host => {
  const host: Host = {
    views_dict: {
      light1: view('Vue légère 1', true),
      light2: view('Vue légère 2', true),
      heavy1: view('Vue lourde 1', false),
      // sa#581 — un volet de tableur enregistré : une vue qui n'est qu'un volet.
      pane1: view('Tableur', true, true),
    },
    views_order: ['light1', 'light2', 'heavy1'],
    current_view_id,
    master_view_name: '',
    show_master_in_views: false,
    master_drawing_area: { sankey: { view_taggs_list: [] } },
    drawing_area: { sankey: { view_taggs_list: [] }, container_selector: '#sankey_app' },
    publish_view_label_filter: null,
    placed: [],
    gestures: 0,
    isWindowOnlyView: (id) => !!host.views_dict[id]?.window_only,
    runAsViewGesture: (work) => { host.gestures += 1; work() },
    placeViewOnPanes: (id) => { host.placed.push(id) },
  }
  return host
}

/** Lecteur de test : le corps du switch est remplacé par un journal (aucun diagramme monté). */
class TestReader extends ViewsReader {
  public applied: string[] = []
  public fail_on: string | null = null

  constructor(
    host: Host,
    indicator?: Type_ViewSwitchIndicator,
    yield_to_browser?: () => Promise<void>
  ) {
    super(host as unknown as Class_ApplicationData)
    this.switch_progress = new Class_ViewSwitchProgress({ indicator, yield_to_browser })
  }

  protected override applyViewChange(id: string): void {
    if (id === this.fail_on) throw new Error('switch casse')
    this.applied.push(id)
    ;(this.host as unknown as Host).current_view_id = id
  }
}

const makeSpyIndicator = () => {
  const calls: string[] = []
  const indicator: Type_ViewSwitchIndicator = {
    show: () => { calls.push('show') },
    hide: () => { calls.push('hide') },
  }
  return { indicator, calls }
}

describe('os#1368 ViewsReader.setCurrentView — le chemin programmatique ne bouge pas', () => {
  it('reste strictement synchrone, indicateur present ou non', () => {
    const { indicator, calls } = makeSpyIndicator()
    const reader = new TestReader(makeHost(), indicator, () => Promise.resolve())
    reader.setCurrentView('heavy1')
    // Deja applique AU RETOUR : c est le contrat dont dependent l export de toutes les vues et
    // l application des options de publication a l ouverture.
    expect(reader.applied).toEqual(['heavy1'])
    expect(calls).toEqual([])
  })
})

describe('os#1368 ViewsReader.requestViewChange — le chemin interactif', () => {
  it('une vue lourde pose l indicateur, cede la main, puis applique le switch', async () => {
    const { indicator, calls } = makeSpyIndicator()
    const reader = new TestReader(makeHost(), indicator, async () => { calls.push('yield') })
    await reader.requestViewChange('heavy1')
    expect(calls).toEqual(['show', 'yield', 'hide'])
    expect(reader.applied).toEqual(['heavy1'])
  })

  it('une vue legere reste synchrone et sans indicateur', () => {
    const { indicator, calls } = makeSpyIndicator()
    const reader = new TestReader(makeHost(), indicator, () => Promise.resolve())
    const result = reader.requestViewChange('light1')
    expect(result).toBeUndefined()
    expect(reader.applied).toEqual(['light1'])
    expect(calls).toEqual([])
  })

  it('le retour au maitre reste synchrone et sans indicateur', () => {
    const { indicator, calls } = makeSpyIndicator()
    const reader = new TestReader(makeHost('heavy1'), indicator, () => Promise.resolve())
    reader.requestViewChange(MASTER_VIEW_ID)
    expect(reader.applied).toEqual([MASTER_VIEW_ID])
    expect(calls).toEqual([])
  })

  it('applique la MEME vue que le chemin programmatique', async () => {
    const { indicator } = makeSpyIndicator()
    const sync_reader = new TestReader(makeHost())
    const async_reader = new TestReader(makeHost(), indicator, () => Promise.resolve())
    sync_reader.setCurrentView('heavy1')
    await async_reader.requestViewChange('heavy1')
    expect(async_reader.applied).toEqual(sync_reader.applied)
  })

  it('l indicateur est retire meme quand le switch echoue', async () => {
    const { indicator, calls } = makeSpyIndicator()
    const reader = new TestReader(makeHost(), indicator, () => Promise.resolve())
    reader.fail_on = 'heavy1'
    await expect(reader.requestViewChange('heavy1')).rejects.toThrow('switch casse')
    expect(calls).toEqual(['show', 'hide'])
  })
})

describe('os#1368 ViewsReader — navigation enchainee', () => {
  it('suivant / precedent passent par le chemin interactif', async () => {
    const { indicator, calls } = makeSpyIndicator()
    const reader = new TestReader(makeHost('light2'), indicator, () => Promise.resolve())
    await reader.setCurrentViewToNext()
    expect(reader.applied).toEqual(['heavy1'])
    expect(calls).toEqual(['show', 'hide'])
  })

  it('une rafale de switches ne laisse pas l indicateur affiche', async () => {
    const { indicator, calls } = makeSpyIndicator()
    const reader = new TestReader(makeHost(), indicator, () => Promise.resolve())
    const first = reader.requestViewChange('heavy1')
    const second = reader.requestViewChange('light1')
    await Promise.all([first, second])
    // Ordre des gestes preserve : le dernier clic gagne, comme en synchrone.
    expect(reader.applied).toEqual(['heavy1', 'light1'])
    expect(calls).toEqual(['show', 'hide'])
  })

  it('un lien view:// vers une vue inexistante ne pose rien', () => {
    const { indicator, calls } = makeSpyIndicator()
    const reader = new TestReader(makeHost(), indicator, () => Promise.resolve())
    reader.navigateToView('vue_supprimee')
    expect(reader.applied).toEqual([])
    expect(calls).toEqual([])
  })
})

// sa#581 — Une vue enregistrée depuis un volet qui n'est pas un Sankey (tableur, JSON, leçon) ne
// porte pas de diagramme : y aller rappelle son volet, et le diagramme reste sur sa vue.
describe('sa#581 ViewsReader — une vue qui n est qu un volet', () => {
  it('le chemin programmatique rappelle son volet sans basculer le diagramme', () => {
    const host = makeHost('light1')
    const reader = new TestReader(host)
    reader.setCurrentView('pane1')
    expect(host.placed).toEqual(['pane1'])
    expect(reader.applied).toEqual([])
    expect(host.current_view_id).toBe('light1')
  })

  it('le chemin interactif aussi : un geste, sans indicateur', () => {
    const { indicator, calls } = makeSpyIndicator()
    const host = makeHost('light1')
    const reader = new TestReader(host, indicator, () => Promise.resolve())
    const result = reader.requestViewChange('pane1')
    expect(result).toBeUndefined()
    expect(host.placed).toEqual(['pane1'])
    expect(host.gestures).toBe(1)
    expect(reader.applied).toEqual([])
    expect(calls).toEqual([])
  })

  it('seule la bascule interactive vers une vue du diagramme est un geste', async () => {
    const host = makeHost()
    const reader = new TestReader(host, undefined, () => Promise.resolve())
    await reader.requestViewChange('light1')
    expect(host.gestures).toBe(1)
    // L'export de toutes les vues passe par ici : il ne doit ouvrir aucun volet.
    reader.setCurrentView('light2')
    expect(host.gestures).toBe(1)
    expect(reader.applied).toEqual(['light1', 'light2'])
  })
})
