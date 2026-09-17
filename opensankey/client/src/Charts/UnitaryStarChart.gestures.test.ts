import { drawUnitaryStar } from './UnitaryStarChart'
import { REPR_ID_ATTR, REPR_KIND_ATTR } from '../Representations/RepresentationContextMenu'
import type {
  Type_UnitaryStar,
  Type_UnitaryStarGestureTarget,
  Type_UnitaryStarInteractions
} from './unitaryStarTypes'

/**
 * os#1422 — LES GESTES DE L ETOILE : elle DESIGNE, elle ne modifie rien.
 *
 * Ce que ces tests figent est la frontiere, pas le confort : le moteur rend une CIBLE
 * (centre, ruban, nœud d une branche) et ouvre un champ de saisie sur un libellé ; ce qui
 * arrive ensuite au document est l affaire de l appelant. Un moteur qui se mettrait a
 * connaitre le modele reviendrait a la copie que l etoile a precisement remplacee.
 *
 * Deux regles qui ne se voient qu ici :
 *  - un clic simple ne part PAS quand c est le debut d un double-clic, et le delai n est paye
 *    que la ou un double-clic veut dire quelque chose ;
 *  - perdre le focus ANNULE. On renomme un objet du document : un nom a moitie tape qu un clic
 *    ailleurs validerait en silence serait une modification que personne n a demandee.
 */

// jsdom ne fait aucune mise en page : les moteurs lisent clientWidth/clientHeight au trace.
const mount = (): HTMLElement => {
  const container = document.createElement('div')
  Object.defineProperty(container, 'clientWidth', { value: 400 })
  Object.defineProperty(container, 'clientHeight', { value: 300 })
  document.body.appendChild(container)
  return container
}

const star = (): Type_UnitaryStar => ({
  center_label: 'Scierie',
  center_text: '',
  inputs: [{ id: 'in_1', label: 'Foret', value: 60, text: '60', color: '#888' }],
  outputs: [{ id: 'out_1', label: 'Sciage', value: 60, text: '60', color: '#888' }],
  is_empty: false
})

const draw = (interactions: Type_UnitaryStarInteractions) => {
  const container = mount()
  const handle = drawUnitaryStar(container, star(), { interactions })
  return { container, handle }
}

const at = (container: HTMLElement, kind: string, id?: string): Element =>
  container.querySelector(
    id === undefined ? `[${REPR_KIND_ATTR}="${kind}"]` : `[${REPR_KIND_ATTR}="${kind}"][${REPR_ID_ATTR}="${id}"]`
  )!

const click = (target: Element, detail = 1) => target.dispatchEvent(
  new MouseEvent('click', { bubbles: true, cancelable: true, detail, clientX: 10, clientY: 10 })
)
const dblclick = (target: Element) => target.dispatchEvent(
  new MouseEvent('dblclick', { bubbles: true, cancelable: true, detail: 2 })
)
const press = (target: Element, x: number, y: number) => target.dispatchEvent(
  new MouseEvent('mousedown', { bubbles: true, cancelable: true, clientX: x, clientY: y })
)
const key = (input: HTMLInputElement, name: string) => input.dispatchEvent(
  new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: name })
)

const inputOf = (container: HTMLElement): HTMLInputElement | null =>
  container.querySelector('input')

beforeEach(() => { jest.useFakeTimers() })
afterEach(() => {
  jest.useRealTimers()
  document.body.innerHTML = ''
})

describe('les cibles que l etoile designe', () => {

  it('rend le CENTRE quand on clique le nœud central', () => {
    const seen: Type_UnitaryStarGestureTarget[] = []
    const { container } = draw({ onClick: t => seen.push(t) })
    click(at(container, 'center'))
    expect(seen).toEqual([{ kind: 'center' }])
  })

  it('rend le NŒUD D EN FACE quand on clique le libelle d une branche', () => {
    // Le libelle ecrit le nom de l autre extremite : le viser, c est viser ce nœud-la. Il porte
    // pourtant l identifiant du FLUX, le seul que l etoile transporte — c est l appelant qui
    // remonte du flux au nœud.
    const seen: Type_UnitaryStarGestureTarget[] = []
    const { container } = draw({ onClick: t => seen.push(t) })
    click(at(container, 'branch_node', 'in_1'))
    expect(seen).toEqual([{ kind: 'branch_node', link_id: 'in_1' }])
  })

  it('rend le FLUX quand on clique le ruban ou son talon', () => {
    const seen: Type_UnitaryStarGestureTarget[] = []
    const { container } = draw({ onClick: t => seen.push(t) })
    click(at(container, 'ribbon', 'out_1'))
    expect(seen).toEqual([{ kind: 'ribbon', link_id: 'out_1' }])
  })

  it('ne declenche rien sur le fond de la figure', () => {
    const seen: Type_UnitaryStarGestureTarget[] = []
    const { container } = draw({ onClick: t => seen.push(t) })
    click(container.querySelector('svg > g')!)
    expect(seen).toEqual([])
  })

  it('ne declenche rien quand le geste etait un glissement', () => {
    // Le navigateur emet quand meme un clic apres un glisser-deposer qui revient sur le meme
    // element : selectionner un flux parce qu on a voulu faire defiler la case serait une
    // action non demandee.
    const seen: Type_UnitaryStarGestureTarget[] = []
    const { container } = draw({ onClick: t => seen.push(t) })
    const center = at(container, 'center')
    press(center, 200, 200)
    click(center)
    expect(seen).toEqual([])
  })

  it('reste une image quand l appelant ne declare aucun geste', () => {
    // Aucun ecouteur n est pose : ni le clic ni le double-clic ne produisent quoi que ce soit,
    // et une vignette d apercu ne paie rien pour des gestes qu elle n offre pas.
    const container = mount()
    const handle = drawUnitaryStar(container, star())
    click(at(container, 'center'))
    dblclick(at(container, 'center'))
    handle.beginRename({ kind: 'center' })
    expect(inputOf(container)).toBeNull()
  })
})

describe('clic simple et double-clic', () => {

  const renaming = (): Type_UnitaryStarInteractions['rename'] => ({
    canRename: t => t.kind !== 'ribbon',
    current: t => t.kind === 'center' ? 'Scierie' : 'Foret',
    commit: () => undefined
  })

  it('retient le clic simple le temps de voir venir un double-clic', () => {
    const seen: Type_UnitaryStarGestureTarget[] = []
    const { container } = draw({ onClick: t => seen.push(t), rename: renaming() })
    click(at(container, 'center'))
    // Rien n est parti tout de suite : un second clic peut encore arriver.
    expect(seen).toEqual([])
    jest.advanceTimersByTime(500)
    expect(seen).toEqual([{ kind: 'center' }])
  })

  it('ne paie AUCUN delai la ou le double-clic ne veut rien dire', () => {
    // Un ruban ne se renomme pas : le clic part immediatement. Le delai n existe que pour
    // proteger un geste qui existe, pas pour ralentir la selection partout.
    const seen: Type_UnitaryStarGestureTarget[] = []
    const { container } = draw({ onClick: t => seen.push(t), rename: renaming() })
    click(at(container, 'ribbon', 'in_1'))
    expect(seen).toEqual([{ kind: 'ribbon', link_id: 'in_1' }])
  })

  it('annule le clic simple quand le double-clic arrive', () => {
    const seen: Type_UnitaryStarGestureTarget[] = []
    const { container } = draw({ onClick: t => seen.push(t), rename: renaming() })
    const center = at(container, 'center')
    click(center)
    click(center, 2)
    dblclick(center)
    jest.advanceTimersByTime(500)
    expect(seen).toEqual([])
    expect(inputOf(container)).not.toBeNull()
  })
})

describe('le renommage en place', () => {

  const renaming = (commit: (t: Type_UnitaryStarGestureTarget, v: string) => void) => ({
    canRename: () => true,
    current: (t: Type_UnitaryStarGestureTarget) => t.kind === 'center' ? 'Scierie' : 'Foret',
    commit
  })

  it('ouvre un champ pre-rempli sur le centre au double-clic', () => {
    const { container } = draw({ rename: renaming(() => undefined) })
    dblclick(at(container, 'center'))
    expect(inputOf(container)?.value).toBe('Scierie')
  })

  it('ouvre un champ pre-rempli sur le libelle d une branche', () => {
    const { container } = draw({ rename: renaming(() => undefined) })
    dblclick(at(container, 'branch_node', 'in_1'))
    expect(inputOf(container)?.value).toBe('Foret')
  })

  it('valide sur Entree, et une seule fois', () => {
    const commits: Array<[Type_UnitaryStarGestureTarget, string]> = []
    const { container } = draw({ rename: renaming((t, v) => { commits.push([t, v]) }) })
    dblclick(at(container, 'branch_node', 'in_1'))
    const input = inputOf(container)!
    input.value = '  Foret domaniale  '
    key(input, 'Enter')
    expect(commits).toEqual([[{ kind: 'branch_node', link_id: 'in_1' }, 'Foret domaniale']])
    // Le champ est parti : l appelant va redessiner, et un champ encore ouvert se ferait
    // emporter au milieu de son propre commit.
    expect(inputOf(container)).toBeNull()
  })

  it('ne valide ni un nom inchange ni un nom vide', () => {
    const commits: string[] = []
    const { container } = draw({ rename: renaming((_t, v) => { commits.push(v) }) })
    dblclick(at(container, 'center'))
    key(inputOf(container)!, 'Enter')
    expect(commits).toEqual([])

    dblclick(at(container, 'center'))
    const input = inputOf(container)!
    input.value = '   '
    key(input, 'Enter')
    expect(commits).toEqual([])
  })

  it('renonce sur Echap', () => {
    const commits: string[] = []
    const { container } = draw({ rename: renaming((_t, v) => { commits.push(v) }) })
    dblclick(at(container, 'center'))
    const input = inputOf(container)!
    input.value = 'Autre chose'
    key(input, 'Escape')
    expect(commits).toEqual([])
    expect(inputOf(container)).toBeNull()
  })

  it('renonce quand le champ perd le focus', () => {
    const commits: string[] = []
    const { container } = draw({ rename: renaming((_t, v) => { commits.push(v) }) })
    dblclick(at(container, 'center'))
    const input = inputOf(container)!
    input.value = 'Autre chose'
    input.dispatchEvent(new FocusEvent('blur'))
    expect(commits).toEqual([])
    expect(inputOf(container)).toBeNull()
  })

  it('garde les touches pour lui : ni Suppr ni Echap ne remontent a l application', () => {
    // Sans cette barriere, taper dans le champ pilote les raccourcis du diagramme : « Suppr »
    // effacerait le nœud qu on est en train de renommer.
    const heard: string[] = []
    const ear = (e: Event) => { heard.push((e as KeyboardEvent).key) }
    document.body.addEventListener('keydown', ear)
    const { container } = draw({ rename: renaming(() => undefined) })
    dblclick(at(container, 'center'))
    const input = inputOf(container)!
    key(input, 'Delete')
    key(input, 'Escape')
    document.body.removeEventListener('keydown', ear)
    expect(heard).toEqual([])
  })

  it('ne renomme rien quand l appelant refuse cette cible', () => {
    const { container } = draw({
      rename: { canRename: () => false, current: () => 'Scierie', commit: () => undefined }
    })
    dblclick(at(container, 'center'))
    expect(inputOf(container)).toBeNull()
  })

  it('ne renomme rien sans contrat de renommage, ni au double-clic ni par la poignee', () => {
    const { container, handle } = draw({ onClick: () => undefined })
    dblclick(at(container, 'center'))
    expect(inputOf(container)).toBeNull()
    handle.beginRename({ kind: 'center' })
    expect(inputOf(container)).toBeNull()
  })

  it('ouvre la saisie a la demande de l appelant, sans double-clic', () => {
    // C est ce que le menu contextuel appelle : « Renommer » n a pas de double-clic a offrir.
    const { container, handle } = draw({ rename: renaming(() => undefined) })
    handle.beginRename({ kind: 'center' })
    expect(inputOf(container)?.value).toBe('Scierie')
  })

  it('n ouvre pas de saisie sur un ruban : un flux n a pas de libelle dans l etoile', () => {
    const { container, handle } = draw({ rename: renaming(() => undefined) })
    handle.beginRename({ kind: 'ribbon', link_id: 'in_1' })
    expect(inputOf(container)).toBeNull()
  })

  it('n ouvre jamais deux champs a la fois', () => {
    const { container } = draw({ rename: renaming(() => undefined) })
    dblclick(at(container, 'center'))
    dblclick(at(container, 'branch_node', 'out_1'))
    expect(container.querySelectorAll('input')).toHaveLength(1)
    expect(inputOf(container)?.value).toBe('Foret')
  })

  it('le champ disparait avec la figure qu on redessine', () => {
    const container = mount()
    const handle = drawUnitaryStar(container, star(), { interactions: { rename: renaming(() => undefined) } })
    handle.beginRename({ kind: 'center' })
    expect(inputOf(container)).not.toBeNull()
    drawUnitaryStar(container, star(), {})
    expect(inputOf(container)).toBeNull()
  })
})
