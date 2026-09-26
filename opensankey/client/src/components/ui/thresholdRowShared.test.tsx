// 26/09/2026 — LE MEME GESTE A LE MEME VISAGE, SUR UN SANKEY COMME SUR UNE COURONNE.
//
// Julien : « il faut que tu reflechisses en terme de SIMILARITE : je veux que le look and feel,
// l UI/UX, soit le meme pour l ensemble des figures, et qu on reutilise au max les memes
// elements. »
//
// ── CE QU IL Y AVAIT AVANT, MESURE ───────────────────────────────────────────────────────────
//
// Le diagramme reglait ses QUATRE seuils (flux, etiquette, noeud, stock) par un curseur suivi
// d une case chiffree — et ecrivait cette ligne quatre fois, en clair, dans `Toolbar.tsx`. Une
// figure, elle, ne connaissait que `kind: 'number'` : un `<input type="number">` nu. Le meme
// geste — « a partir de quelle taille est-ce que ca s affiche » — avait deux visages selon qu on
// le posait sur un Sankey ou sur une couronne.
//
// ── CE QUE CE FICHIER TIENT ──────────────────────────────────────────────────────────────────
//
// Que la sorte `slider` d une figure rende LA LIGNE, et non un champ nu : un curseur, avec le nom
// et le nombre. Le jour ou quelqu un la recablerait sur un `<Input>`, ce test rougit.
//
// La migration des quatre lignes du diagramme se verifie autrement, et mieux : `Toolbar.tsx`
// n importe plus AUCUN `Slider` de Chakra. Le lint le dit, et c est une preuve qu un test ne
// donnerait pas — il ne resterait rien a importer si la ligne partagee n etait pas utilisee.

import React, { act } from 'react'
import { createRoot, Root } from 'react-dom/client'

import { ThresholdRow } from './ThresholdRow'

;(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true

let container: HTMLDivElement
let root: Root

beforeEach(() => {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
})

afterEach(() => {
  act(() => root.unmount())
  container.remove()
})

const rendu = (node: React.ReactNode): void => { act(() => { root.render(node) }) }

/** Le curseur : Chakra lui pose `role="slider"` et les attributs ARIA de sa plage. */
const curseur = (): HTMLElement | null => document.body.querySelector('[role="slider"]')

describe('la ligne de seuil partagee', () => {

  it('elle porte un NOM, un CURSEUR et un NOMBRE', () => {
    rendu(<ThresholdRow label='Nommer au-dessus de' value={3} max={25} onChange={() => undefined} />)

    expect(document.body.textContent).toContain('Nommer au-dessus de')
    expect(curseur()).toBeTruthy()
    expect(document.body.querySelector('input[type="number"]')).toBeTruthy()
  })

  it('le curseur ANNONCE sa plage et sa valeur', () => {
    // Ce sont ces trois attributs qui font qu un curseur se lit — et qu il se pilote au clavier.
    rendu(<ThresholdRow label='Seuil' value={3} min={0} max={25} onChange={() => undefined} />)

    expect(curseur()?.getAttribute('aria-valuenow')).toBe('3')
    expect(curseur()?.getAttribute('aria-valuemin')).toBe('0')
    expect(curseur()?.getAttribute('aria-valuemax')).toBe('25')
  })

  it('LA CASE CHIFFREE EST UN EMPLACEMENT : l editeur y glisse la sienne', () => {
    // C est ce qui permet de partager la ligne SANS descendre l inspecteur dans le paquet de base
    // (`ConfigMenuNumberInput` vit dans l editeur, et la frontiere d architecture est testee).
    rendu(<ThresholdRow
      label='Seuil' value={3} max={25} onChange={() => undefined}
      numberSlot={<span data-test='la-case-de-l-editeur'>3</span>}
    />)

    expect(document.body.querySelector('[data-test="la-case-de-l-editeur"]')).toBeTruthy()
    // Et la simple n est alors PAS rendue : deux cases pour un seuil seraient deux verites.
    expect(document.body.querySelector('input[type="number"]')).toBeNull()
  })

  it('LA SAISIE RESTE DANS LES BORNES DU CURSEUR', () => {
    // Les deux commandes reglent la meme chose : elles ne peuvent pas accepter des valeurs
    // differentes. Sans cette borne, taper 900 laisserait le curseur au bout et le reglage a 900.
    const vus: number[] = []
    rendu(<ThresholdRow label='Seuil' value={3} max={25} onChange={v => vus.push(v)} />)
    const case_chiffree = document.body.querySelector('input[type="number"]') as HTMLInputElement

    // ⚠️ PAR LE SETTER NATIF, et non `.value = …` : React garde sa propre trace de la valeur d un
    // champ controle et AVALE l evenement quand elle n a pas bouge a ses yeux. C est le piege
    // classique du test d un input React, et il fait passer un composant juste pour cassé.
    act(() => {
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
      setter?.call(case_chiffree, '900')
      case_chiffree.dispatchEvent(new Event('input', { bubbles: true }))
    })

    expect(vus).toEqual([25])
  })
})
