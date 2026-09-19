// os#1431 — UN CONTROLE QUI S AFFICHE MAIS N ECRIT PAS EST PIRE QU UN CONTROLE ABSENT.
//
// Constate par Julien le 19/09 sur le mode de valeur d une etoile : les trois boutons paraissent,
// l etat courant est bien marque, et cliquer ne fait rien. Un `select` natif masquait ce genre de
// panne — le DOM garde la valeur cliquee meme si personne ne l ecrit —, un groupe de boutons non :
// il se peint entierement depuis la valeur qu on lui donne.
//
// Ce test tient donc les DEUX moities du contrat, pour la forme segmentee comme pour la liste :
// ce qui est peint vient de la valeur, et cliquer appelle l ecriture avec le choix.

import React, { act } from 'react'
import { createRoot, Root } from 'react-dom/client'

import { figureAttribute } from './figureAttribute'
import { FigureAttributesForm } from './FigureAttributesForm'
import type { Type_FigureAttributesConfig, Type_OptionBag } from './Figure'

;(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const labels7 = (fr: string) => ({
  en: fr, fr, es: fr, de: fr, it: fr, 'zh-CN': fr, ja: fr
})

/** Une nature a un seul reglage : un regime a trois etats, en boutons. */
const CONFIG: Type_FigureAttributesConfig = {
  value_mode: figureAttribute<string>('percent', 'style', labels7('Mode de valeur'), undefined, {
    kind: 'segmented',
    choices: [
      { value: 'percent', labels: labels7('Pourcentages') },
      { value: 'value', labels: labels7('Valeurs') },
      { value: 'normalized', labels: labels7('Normalise') }
    ]
  })
}

/** L application reduite a ce que le formulaire lui demande : traduire. */
const appStub = () => ({ t: (key: string) => key }) as never

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

const render = (options: Type_OptionBag, setOptions: (next: Type_OptionBag) => void): void => {
  act(() => {
    root.render(<FigureAttributesForm
      app_data={appStub()}
      config={CONFIG}
      options={options}
      setOptions={setOptions}
    />)
  })
}

/** Les boutons du groupe segmente, dans l ordre affiche. */
const buttons = (): HTMLButtonElement[] =>
  [...container.querySelectorAll('button')].filter(b => ['Pourcentages', 'Valeurs', 'Normalise']
    .includes(b.textContent ?? ''))

describe('os#1431 la forme segmentee', () => {
  test('peint l etat COURANT, et lui seul', () => {
    render({ value_mode: 'normalized' }, () => undefined)
    const pressed = buttons().filter(b => b.getAttribute('aria-pressed') === 'true')
    expect(pressed.map(b => b.textContent)).toEqual(['Normalise'])
  })

  test('cliquer ECRIT le choix, sans toucher au reste du sac', () => {
    const writes: Type_OptionBag[] = []
    render({ value_mode: 'normalized', neutral_colors: true }, next => writes.push(next))

    const target = buttons().find(b => b.textContent === 'Valeurs')
    expect(target).toBeTruthy()
    act(() => { target?.click() })

    expect(writes).toHaveLength(1)
    expect(writes[0].value_mode).toBe('value')
    // Le sac est rendu ENTIER : l appelant ecrit un sac, pas une cle.
    expect(writes[0].neutral_colors).toBe(true)
  })

  test('le defaut d usine se peint quand le sac ne dit rien', () => {
    render({}, () => undefined)
    const pressed = buttons().filter(b => b.getAttribute('aria-pressed') === 'true')
    expect(pressed.map(b => b.textContent)).toEqual(['Pourcentages'])
  })
})
