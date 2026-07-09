import { Class_Theme, themeOpenSankey, themeFromJSON, themeSankeymaticPalette, DEFAULT_THEME_ID } from './Theme'

describe('Class_Theme', () => {
  test('le thème opensankey ne se prononce sur aucune couleur de nœud', () => {
    const theme = themeOpenSankey()
    expect(theme.id).toBe(DEFAULT_THEME_ID)
    // `by-tag` = comportement historique : la palette ne doit RIEN dire.
    expect(theme.palette.node_rule).toBe('by-tag')
    expect(theme.makeNodeColorPicker()).toBeNull()
    // Patch vide : `applyTheme` remet les styles de base à zéro, donc les défauts
    // usine reprennent la main. Le fond, lui, est déclaré pour que la bascule
    // aller-retour depuis sankeymatic (fond blanc) restitue le gris d'OpenSankey.
    expect(theme.styles).toEqual({})
    expect(theme.globals.couleur_fond_sankey).toBe('#f2f2f2')
  })

  test('la palette SankeyMATIC applique la rotation et cycle par premier mot', () => {
    // Category10 tourné de 6 démarre à e377c2.
    const theme = new Class_Theme({
      id: 'sankeymatic',
      palette: themeSankeymaticPalette('a', 6, 'source'),
      styles: {},
      globals: {},
    })
    const pick = theme.makeNodeColorPicker() as (n: string) => string
    expect(pick('Wages')).toBe('#e377c2')
    expect(pick('Other')).toBe('#7f7f7f')
    // La clé est le PREMIER mot : « Other Necessities » partage la teinte d'« Other ».
    expect(pick('Other Necessities')).toBe('#7f7f7f')
    // Stable d'un appel à l'autre.
    expect(pick('Wages')).toBe('#e377c2')
  })

  test('chaque picker rejoue l\'attribution depuis le début', () => {
    const theme = new Class_Theme({
      id: 'sankeymatic',
      palette: themeSankeymaticPalette('a', 0, 'source'),
      styles: {},
      globals: {},
    })
    // Le picker est à état : la 1re teinte va au 1er demandeur, quel qu'il soit.
    expect((theme.makeNodeColorPicker() as (n: string) => string)('Second')).toBe('#1f77b4')
    const fresh = theme.makeNodeColorPicker() as (n: string) => string
    expect(fresh('First')).toBe('#1f77b4')
    expect(fresh('Second')).toBe('#ff7f0e')
  })

  test('`node theme none` ne donne pas de palette', () => {
    const palette = themeSankeymaticPalette('none', 3, 'flow')
    expect(palette.colors).toEqual([])
    expect(palette.node_rule).toBe('none')
    const theme = new Class_Theme({ id: 'x', palette, styles: {}, globals: {} })
    expect(theme.makeNodeColorPicker()).toBeNull()
  })

  test('themeFromJSON retombe sur opensankey pour tout JSON inexploitable', () => {
    expect(themeFromJSON(undefined).id).toBe(DEFAULT_THEME_ID)
    expect(themeFromJSON({}).id).toBe(DEFAULT_THEME_ID)
    expect(themeFromJSON({ id: 'sankeymatic' }).id).toBe(DEFAULT_THEME_ID)
  })

  test('themeFromJSON restitue un thème complet, et toJSON fait l\'aller-retour', () => {
    const original = new Class_Theme({
      id: 'sankeymatic',
      palette: themeSankeymaticPalette('b', 3, 'target'),
      styles: { LinkStyle: { shape_opacity: 0.45 } },
      globals: { couleur_fond_sankey: '#ffffff' },
    })
    const restored = themeFromJSON(JSON.parse(JSON.stringify(original.toJSON())))
    expect(restored.id).toBe('sankeymatic')
    expect(restored.palette.offset).toBe(3)
    expect(restored.palette.link_rule).toBe('target')
    expect(restored.palette.colors).toEqual(original.palette.colors)
    const restoredPick = restored.makeNodeColorPicker() as (n: string) => string
    const originalPick = original.makeNodeColorPicker() as (n: string) => string
    expect(restoredPick('Wages')).toBe(originalPick('Wages'))
    expect(restored.globals.couleur_fond_sankey).toBe('#ffffff')
  })
})
