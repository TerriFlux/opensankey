import {
  REPR_ID_ATTR,
  REPR_KIND_ATTR,
  attachRepresentationContextMenu,
  closeRepresentationContextMenu,
  currentRepresentationContextMenu,
  representationTargetAt
} from './RepresentationContextMenu'
import type {
  Type_RepresentationContext, Type_RepresentationEntry
} from './RepresentationRegistry'
import { drawUnitaryStar } from '../Charts/UnitaryStarChart'
import type { Type_UnitaryStar } from '../Charts/unitaryStarTypes'

/**
 * os#1393 - LE REPERAGE DE L ELEMENT CLIQUE DANS UNE REPRESENTATION.
 *
 * Deux choses a verrouiller, et ce sont les deux raisons d etre du mecanisme :
 *  - on retrouve l objet du modele depuis n importe quelle forme dessinee pour lui
 *    (le ruban, son talon, son libelle portent la meme etiquette) ;
 *  - DEUX ETOILES AFFICHEES EN MEME TEMPS repondent chacune pour elle-meme. C est ce que
 *    l etiquetage par `data-*` achete face aux identifiants DOM, qui sont globaux au
 *    document : avec eux, la seconde figure resoudrait sur les elements de la premiere.
 */

// Une etoile minimale, aux identifiants de flux distincts d une figure a l autre.
const star = (prefix: string): Type_UnitaryStar => ({
  center_label: `centre ${prefix}`,
  center_text: '',
  inputs: [{ id: `${prefix}_in`, label: 'amont', value: 60, text: '60', color: '#888' }],
  outputs: [{ id: `${prefix}_out`, label: 'aval', value: 60, text: '60', color: '#888' }],
  is_empty: false
})

// jsdom ne fait aucune mise en page : les moteurs lisent clientWidth/clientHeight au trace, il
// faut donc les poser a la main, sinon l etoile se replie sur son message de vide.
const drawnStar = (prefix: string): HTMLElement => {
  const container = document.createElement('div')
  Object.defineProperty(container, 'clientWidth', { value: 400 })
  Object.defineProperty(container, 'clientHeight', { value: 300 })
  document.body.appendChild(container)
  drawUnitaryStar(container, star(prefix))
  return container
}

/** Entree de registre factice : seul son `contextMenu` compte ici. */
const entryDeclaring = (
  declare: Type_RepresentationEntry['contextMenu']
): Type_RepresentationEntry => ({
  id: 'test.repr', scale: 'element', order: 1, label: () => 'test',
  host: 'component', contextMenu: declare
})

const fakeContext = (): Type_RepresentationContext => ({
  app_data: { drawing_area: { closeAllContextMenus: () => false } } as unknown as
    Type_RepresentationContext['app_data'],
  scale: 'element',
  element: null,
  options: {}
})

const rightClick = (target: Element) => target.dispatchEvent(
  new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: 10, clientY: 20 })
)

afterEach(() => {
  closeRepresentationContextMenu()
  document.body.innerHTML = ''
})

describe('representationTargetAt', () => {

  it('rend la nature et l identifiant portes par l element cliquable', () => {
    const container = drawnStar('a')
    const ribbon = container.querySelector(`[${REPR_KIND_ATTR}="ribbon"]`)!
    expect(representationTargetAt(ribbon, container)).toEqual({ kind: 'ribbon', id: 'a_in' })
  })

  it('remonte depuis une forme interne jusqu a l element etiquete', () => {
    // L info-bulle est un <title> ENFANT du ruban : le clic peut atterrir dessus, et c est bien
    // le flux qu on vise, pas la bulle.
    const container = drawnStar('a')
    const ribbon = container.querySelector(`[${REPR_KIND_ATTR}="ribbon"]`)!
    const title = ribbon.querySelector('title')!
    expect(representationTargetAt(title, container)).toEqual({ kind: 'ribbon', id: 'a_in' })
  })

  it('rend un identifiant nul quand l element n en porte pas', () => {
    // Le centre de l etoile : une nature, pas d identifiant de modele (l etoile ne transporte
    // pas celui de son nœud).
    const container = drawnStar('a')
    const center = container.querySelector(`[${REPR_KIND_ATTR}="center"]`)!
    expect(representationTargetAt(center, container)).toEqual({ kind: 'center', id: null })
  })

  it('rend null hors de tout element etiquete', () => {
    const container = drawnStar('a')
    expect(representationTargetAt(container, container)).toBeNull()
    expect(representationTargetAt(null, container)).toBeNull()
  })

  it('os#1397 : la racine de la figure est le FOND', () => {
    const container = drawnStar('a')
    const svg = container.querySelector('svg')!
    expect(representationTargetAt(svg, container)).toEqual({ kind: 'background', id: null })
  })

  it('os#1397 : ce qui n est rien en particulier retombe sur le fond', () => {
    // Le groupe de translation ne porte pas d etiquette : un clic dans le vide de la figure doit
    // ouvrir les reglages, pas rien. C est ce qui permettra de retirer la barre de la vignette.
    const container = drawnStar('a')
    const group = container.querySelector('svg > g')!
    expect(representationTargetAt(group, container)).toEqual({ kind: 'background', id: null })
    // Et le fond ne vole pas les elements qui, eux, sont etiquetes.
    const ribbon = container.querySelector(`[${REPR_KIND_ATTR}="ribbon"]`)!
    expect(representationTargetAt(ribbon, container)?.kind).toBe('ribbon')
  })

  it('refuse un element qui appartient a une AUTRE figure', () => {
    // Le cas qui condamne les identifiants DOM : deux figures dans la meme page.
    const first = drawnStar('a')
    const second = drawnStar('b')
    const ribbon_of_second = second.querySelector(`[${REPR_KIND_ATTR}="ribbon"]`)!
    expect(representationTargetAt(ribbon_of_second, first)).toBeNull()
    expect(representationTargetAt(ribbon_of_second, second)).toEqual({ kind: 'ribbon', id: 'b_in' })
  })
})

describe('attachRepresentationContextMenu', () => {

  it('ouvre le menu declare par la representation, et confisque celui du navigateur', () => {
    const container = drawnStar('a')
    const detach = attachRepresentationContextMenu(
      container,
      entryDeclaring(({ target }) => ({ config: {}, modifier: {}, path: `vu:${target.id}` })),
      fakeContext()
    )
    const ribbon = container.querySelector(`[${REPR_KIND_ATTR}="ribbon"]`)!
    const not_prevented = rightClick(ribbon)
    expect(not_prevented).toBe(false)
    expect(currentRepresentationContextMenu()?.path).toBe('vu:a_in')
    expect(currentRepresentationContextMenu()?.position).toEqual({ x: 10, y: 20 })
    detach()
  })

  it('laisse le menu du navigateur la ou la representation ne propose rien', () => {
    const container = drawnStar('a')
    const detach = attachRepresentationContextMenu(
      container, entryDeclaring(() => null), fakeContext()
    )
    const ribbon = container.querySelector(`[${REPR_KIND_ATTR}="ribbon"]`)!
    expect(rightClick(ribbon)).toBe(true)
    expect(currentRepresentationContextMenu()).toBeNull()
    detach()
  })

  it('ne pose aucun ecouteur quand la representation ne declare pas de menu', () => {
    const container = drawnStar('a')
    const detach = attachRepresentationContextMenu(
      container, entryDeclaring(undefined), fakeContext()
    )
    expect(rightClick(container.querySelector(`[${REPR_KIND_ATTR}="ribbon"]`)!)).toBe(true)
    expect(currentRepresentationContextMenu()).toBeNull()
    detach()
  })

  it('DEUX ETOILES affichees ensemble repondent chacune pour elle-meme', () => {
    const first = drawnStar('a')
    const second = drawnStar('b')
    const seen: string[] = []
    const declare = (figure: string): Type_RepresentationEntry['contextMenu'] =>
      ({ target }) => {
        seen.push(`${figure}/${target.id}`)
        return { config: {}, modifier: {}, path: `${figure}/${target.id}` }
      }
    const detach_first = attachRepresentationContextMenu(
      first, entryDeclaring(declare('premiere')), fakeContext()
    )
    const detach_second = attachRepresentationContextMenu(
      second, entryDeclaring(declare('seconde')), fakeContext()
    )

    rightClick(second.querySelector(`[${REPR_KIND_ATTR}="ribbon"][${REPR_ID_ATTR}="b_out"]`)!)
    expect(currentRepresentationContextMenu()?.path).toBe('seconde/b_out')
    rightClick(first.querySelector(`[${REPR_KIND_ATTR}="ribbon"][${REPR_ID_ATTR}="a_in"]`)!)
    expect(currentRepresentationContextMenu()?.path).toBe('premiere/a_in')
    // Et aucune des deux n a ete consultee pour le clic de l autre.
    expect(seen).toEqual(['seconde/b_out', 'premiere/a_in'])

    detach_first()
    detach_second()
  })

  it('le detachement rend le clic droit au navigateur', () => {
    const container = drawnStar('a')
    const detach = attachRepresentationContextMenu(
      container, entryDeclaring(() => ({ config: {}, modifier: {}, path: 'x' })), fakeContext()
    )
    detach()
    expect(rightClick(container.querySelector(`[${REPR_KIND_ATTR}="ribbon"]`)!)).toBe(true)
    expect(currentRepresentationContextMenu()).toBeNull()
  })
})
