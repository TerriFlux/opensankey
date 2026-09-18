// os#1425 — DE LA DÉCLARATION D UNE NATURE AUX CONTROLES : c est ici que tout se decide, et
// c est pour ca que ce module est pur. Le composant ne fait que poser ce que cette liste dit.

import { figureAttribute } from './figureAttribute'
import { figureControlGroupsOf, figureControlsOf, controlKindOf } from './figureControls'
import type { Type_FigureAttributesConfig } from './Figure'

const labels7 = (fr: string) => ({
  en: fr + ' (en)', fr, es: fr, de: fr, it: fr, 'zh-CN': fr, ja: fr
})

const CONFIG: Type_FigureAttributesConfig = {
  axis: figureAttribute<string | undefined>(undefined, 'navigation', labels7('Axe'), undefined, {
    kind: 'select',
    choicesOf: () => [{ value: 'a', label: 'Axe A' }, { value: 'b', label: 'Axe B' }],
    group: 'g.read'
  }),
  chained: figureAttribute<boolean>(true, 'navigation', labels7('Enchainer'), undefined, {
    group: 'g.read'
  }),
  depth: figureAttribute<number>(6, 'style', labels7('Anneaux'), undefined, {
    kind: 'number', min: 1, max: 12, group: 'g.shape'
  }),
  unit_visible: figureAttribute<boolean>(false, 'style', labels7('Unite'), undefined, {
    group: 'g.shape', visibleIf: (o) => o['show_value'] === true
  }),
  // Une valeur composee n a pas d interface generique : un descripteur ne s edite pas dans un champ.
  descriptor: figureAttribute<unknown>({ decompose: null }, 'navigation', labels7('Descripteur')),
  root_ids: figureAttribute<string[] | undefined>(undefined, 'identity', labels7('Racine'))
}

describe('controlKindOf', () => {
  it('deduit la sorte de controle du type de la valeur d usine', () => {
    expect(controlKindOf(undefined, true, false)).toBe('checkbox')
    expect(controlKindOf(undefined, 6, false)).toBe('number')
    expect(controlKindOf(undefined, 'x', false)).toBe('text')
    expect(controlKindOf(undefined, 'x', true)).toBe('select')
  })

  it('ne rend aucune interface pour une valeur composee', () => {
    expect(controlKindOf(undefined, { a: 1 }, false)).toBe('none')
    expect(controlKindOf(undefined, ['a'], false)).toBe('none')
  })

  it('laisse la declaration commander quand elle dit la sorte', () => {
    expect(controlKindOf('color', 'x', false)).toBe('color')
    expect(controlKindOf('none', true, false)).toBe('none')
  })
})

describe('figureControlsOf', () => {
  const ctx = { app_data: {} }

  it('LA SORTE REPARTIT : l inspecteur ne voit pas ce que la navigation regle', () => {
    const style = figureControlsOf(CONFIG, {}, ['style'], 'fr', ctx).map(c => c.key)
    const nav = figureControlsOf(CONFIG, {}, ['navigation'], 'fr', ctx).map(c => c.key)
    expect(style).toEqual(['depth'])
    expect(nav).toEqual(['axis', 'chained'])
    // Ni l un ni l autre ne montre l identite : c est la fenetre qui la pose.
    expect([...style, ...nav]).not.toContain('root_ids')
  })

  it('resout les choix du MODELE au moment de rendre', () => {
    const [axis] = figureControlsOf(CONFIG, {}, ['navigation'], 'fr', ctx)
    expect(axis.kind).toBe('select')
    expect(axis.choices).toEqual([
      { value: 'a', label: 'Axe A' }, { value: 'b', label: 'Axe B' }
    ])
  })

  it('rend la valeur EFFECTIVE, et la valeur d usine quand la figure ne dit rien', () => {
    const [depth] = figureControlsOf(CONFIG, { depth: 3 }, ['style'], 'fr', ctx)
    expect(depth.value).toBe(3)
    const [factory] = figureControlsOf(CONFIG, {}, ['style'], 'fr', ctx)
    expect(factory.value).toBe(6)
  })

  it('cache un reglage dont la condition ne tient pas, sans toucher a sa valeur', () => {
    const hidden = figureControlsOf(CONFIG, { unit_visible: true }, ['style'], 'fr', ctx)
    expect(hidden.map(c => c.key)).not.toContain('unit_visible')
    const shown = figureControlsOf(
      CONFIG, { show_value: true, unit_visible: true }, ['style'], 'fr', ctx
    )
    expect(shown.find(c => c.key === 'unit_visible')?.value).toBe(true)
  })

  it('prend le libelle de la langue courante, avec repli sur l anglais', () => {
    const [fr] = figureControlsOf(CONFIG, {}, ['style'], 'fr', ctx)
    expect(fr.label).toBe('Anneaux')
    const [ru] = figureControlsOf(CONFIG, {}, ['style'], 'ru', ctx)
    expect(ru.label).toBe('Anneaux (en)')
  })
})

describe('figureControlGroupsOf', () => {
  it('range par groupe, dans l ordre de la premiere cle declaree', () => {
    const items = figureControlsOf(CONFIG, {}, ['style', 'navigation'], 'fr', { app_data: {} })
    expect(figureControlGroupsOf(items).map(g => g.group)).toEqual(['g.read', 'g.shape'])
  })
})
