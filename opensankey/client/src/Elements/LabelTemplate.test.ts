// OS#1314 — moteur de gabarits à jetons. Module FEUILLE : testable sans DOM et
// sans tirer le graphe d'imports du cœur (même précaution que legendItems).

import {
  applyTemplate, canonicalToken, cleanTemplateResult, LEGEND_TEMPLATE_TOKENS,
  LINK_TEMPLATE_TOKENS, NODE_TEMPLATE_TOKENS, resolveAssignedTagToken,
  resolveTagGroupToken, templateTokenLabel
} from './LabelTemplate'
import { legendEntryText } from './legendItems'

describe('applyTemplate', () => {
  const resolve = (token: string) => {
    if (token === 'Value') return '120'
    if (token === 'Unit') return 't'
    if (token === 'Empty') return ''
    return null
  }

  it('remplace les jetons connus et garde le texte statique', () => {
    expect(applyTemplate('Total : {Value} {Unit}', resolve)).toBe('Total : 120 t')
  })

  it('laisse tel quel un jeton INCONNU (la faute de frappe reste visible)', () => {
    expect(applyTemplate('{Value} {Valeur}', resolve)).toBe('120 {Valeur}')
  })

  it('tolère les espaces dans les accolades', () => {
    expect(applyTemplate('{ Value }', resolve)).toBe('120')
  })

  it('ne touche pas un texte sans accolade', () => {
    expect(applyTemplate('Charbon', resolve)).toBe('Charbon')
    expect(applyTemplate('', resolve)).toBe('')
  })

  it('nettoie les séparateurs orphelins laissés par un jeton vide', () => {
    expect(applyTemplate('{Empty}: {Value}', resolve)).toBe('120')
    expect(applyTemplate('{Value} : {Empty}', resolve)).toBe('120')
  })

  it('retire une paire de délimiteurs devenue vide', () => {
    expect(applyTemplate('{Value} [{Empty}]', resolve)).toBe('120')
    expect(applyTemplate('{Value} ({Empty})', resolve)).toBe('120')
    expect(applyTemplate('{Value} [{Unit}]', resolve)).toBe('120 [t]')
  })

  it('ne nettoie qu\'aux extrémités de chaque ligne', () => {
    expect(applyTemplate('{Value}\n{Empty} - {Unit}', resolve)).toBe('120\nt')
    // Séparateur INTERNE conservé : on ne devine pas ce que l'auteur voulait.
    expect(applyTemplate('{Value} - {Empty} - {Unit}', resolve)).toBe('120 - - t')
  })

  it('cleanTemplateResult est idempotent sur un texte propre', () => {
    expect(cleanTemplateResult('Charbon : 120 t')).toBe('Charbon : 120 t')
  })
})

describe('resolveTagGroupToken', () => {
  const data_taggs = [{ name: 'Annee', selected_tags_list: [{ display_name: '2024' }] }]
  const view_taggs = [
    { name: 'Zoom', view_mode: true, selected_tags_list: [{ display_name: 'Detail' }] },
    { name: 'Scenario', view_mode: false, selected_tags_list: [{ display_name: 'Tendanciel' }] }
  ]

  it('rend la valeur sélectionnée d\'un groupe de data tags', () => {
    expect(resolveTagGroupToken('Annee', data_taggs, view_taggs)).toBe('2024')
  })

  it('rend la valeur d\'un view tag SEULEMENT si le filtre de vue est actif', () => {
    expect(resolveTagGroupToken('Zoom', data_taggs, view_taggs)).toBe('Detail')
    expect(resolveTagGroupToken('Scenario', data_taggs, view_taggs)).toBe('')
  })

  it('rend null (jeton inconnu) hors des groupes', () => {
    expect(resolveTagGroupToken('Value', data_taggs, view_taggs)).toBeNull()
  })
})

describe('resolveAssignedTagToken', () => {
  const tags = [
    { display_name: 'Charbon', group: { id: 'g1', name: 'Materiau' } },
    { display_name: 'Route', group: { id: 'g2', name: 'Mode' } }
  ]

  it('{Tag} rend tous les tags assignés', () => {
    expect(resolveAssignedTagToken('Tag', tags)).toBe('Charbon, Route')
  })

  it('{Tag:groupe} cible un groupe par nom ou par id', () => {
    expect(resolveAssignedTagToken('Tag:Mode', tags)).toBe('Route')
    expect(resolveAssignedTagToken('Tag:g1', tags)).toBe('Charbon')
  })

  it('groupe sans tag assigné → vide (et non le jeton brut)', () => {
    expect(resolveAssignedTagToken('Tag:Absent', tags)).toBe('')
  })

  it('rend null hors de la famille Tag', () => {
    expect(resolveAssignedTagToken('Value', tags)).toBeNull()
  })
})

describe('catalogue de jetons', () => {
  it('replie les alias e!Sankey sur le jeton officiel', () => {
    expect(canonicalToken('Quantity', LINK_TEMPLATE_TOKENS)).toBe('Value')
    expect(canonicalToken('UnitName', LINK_TEMPLATE_TOKENS)).toBe('Unit')
    expect(canonicalToken('PercentProcessSource', LINK_TEMPLATE_TOKENS)).toBe('PercentSourceOut')
    expect(canonicalToken('PercentArrow', LINK_TEMPLATE_TOKENS)).toBeNull()
  })

  it('propose des jetons distincts et bien formés', () => {
    const catalogs = [LINK_TEMPLATE_TOKENS, NODE_TEMPLATE_TOKENS, LEGEND_TEMPLATE_TOKENS]
    catalogs.forEach(catalog => {
      const tokens = catalog.map(def => def.token)
      expect(new Set(tokens).size).toBe(tokens.length)
      tokens.forEach(token => expect(token).toMatch(/^\{[A-Za-z:]*\}$/))
    })
  })

  it('libelle un jeton dans les 7 langues, zh-CN inclus (pas de slice(0,2))', () => {
    const def = LINK_TEMPLATE_TOKENS[0]
    expect(templateTokenLabel(def, 'fr')).toBe(def.labels.fr)
    expect(templateTokenLabel(def, 'zh-CN')).toBe(def.labels['zh-CN'])
    expect(templateTokenLabel(def, 'ja')).toBe(def.labels.ja)
    // Langue inconnue → repli anglais.
    expect(templateTokenLabel(def, 'pt-BR')).toBe(def.labels.en)
  })
})

describe('legendEntryText', () => {
  const group = { id: 'g1', name: 'Materiaux', use_colors: true, selected_tags_list: [] }
  const tag = {
    id: 't1', name: 'charbon', display_name: 'Charbon', color: '#000000',
    resolved_unit: { unit: { name: 'kt' } }
  }

  it('sans gabarit : le nom long du tag (comportement historique)', () => {
    expect(legendEntryText(tag, group, '')).toBe('Charbon')
  })

  it('avec gabarit : jetons {Name}, {Unit}, {Group}', () => {
    expect(legendEntryText(tag, group, '{Name} [{UnitName}]')).toBe('Charbon [kt]')
    expect(legendEntryText(tag, group, '{Group} — {Name}')).toBe('Materiaux — Charbon')
  })

  it('tag sans unité : le crochet vide disparaît', () => {
    const no_unit = { ...tag, resolved_unit: undefined }
    expect(legendEntryText(no_unit, group, '{Name} [{Unit}]')).toBe('Charbon')
  })
})
