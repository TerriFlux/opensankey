import { legendContextRows, type Type_DimensionForColumn } from './legendColumn'

// sa#664 — Julien, 14/10 (SOCLE, filieres) : la colonne ne disait plus l unite, le territoire ni la cereale.

const dim = (id: string, name: string, selected: string[], extra: Partial<Type_DimensionForColumn> = {}): Type_DimensionForColumn =>
  ({ id, name, selected_tags_list: selected.map(n => ({ name: n })), ...extra })

test('une ligne de rappel par dimension qui ne porte pas la couleur', () => {
  const rows = legendContextRows([
    dim('unite', 'Unité', ['kt']),
    dim('territoire', 'Territoire', ['France entière']),
    dim('campagne', 'Campagne', ['2023-24']),
    dim('cereale', 'Céréale', ['Blé tendre'])
  ])
  expect(rows.map(r => r.label)).toEqual([
    'Unité : kt', 'Territoire : France entière', 'Campagne : 2023-24', 'Céréale : Blé tendre'
  ])
})

test('ni la dimension qui colore, ni une case, ni un niveau, ni des noeuds', () => {
  const rows = legendContextRows([
    dim('filiere', 'Filière', ['Céréales', 'Lait'], { draws_bands: true }),
    dim('donnees', 'Données', ['Calculées'], { reader_control: { kind: 'toggle' } }),
    dim('niveau', 'Niveau', ['2'], { reader_control: { kind: 'level' } }),
    dim('pays', 'Pays', ['France'], { drawing: 'nodes' }),
    dim('unite', 'Unité', ['kt'])
  ])
  expect(rows.map(r => r.label)).toEqual(['Unité : kt'])
})

test('plusieurs membres montres : une selection, aucun : pas de ligne', () => {
  const rows = legendContextRows([
    dim('annee', 'Année', ['2015', '2019']),
    dim('vide', 'Vide', [])
  ])
  expect(rows.map(r => r.label)).toEqual(['Année : Sélection de années'])
})
