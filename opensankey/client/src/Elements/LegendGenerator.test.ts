// OS#1254 — tests du générateur de légende : contenu (computeLegendItems),
// layout (layoutLegendItems) et texte d'échelle (computeScaleText), sans DOM.
//
// Importe les modules FEUILLES (legendItems/legendIds), pas LegendGenerator :
// ce dernier tire ElementsAttributesConfig, dont le graphe d'imports cyclique
// ne supporte pas d'être chargé par cette porte d'entrée sous jest.

import {
  computeLegendItems, computeScaleText, layoutLegendItems, legendEntryLabelShift, legendEntryRowHeight, renderableLegendItems,
  Type_LegendConfigValues, Type_SankeyForLegend
} from './legendItems'
import { isLegendChildId, isLegendElementId, isLegendFrameId } from './legendIds'

const base_config: Type_LegendConfigValues = {
  masked: false,
  managed: true,
  police: 16,
  bg_border: false,
  bg_color: '#ffffff',
  bg_opacity: 0,
  horizontal: false,
  width: 180,
  display_scale: false,
  scale_unit: '',
  scale_ratio: 1,
  show_dataTags: false,
  show_constraints: false,
  show_data_type: false,
  info_link_value_void: false,
  entry_template: ''
}

function makeTag(id: string, color = '#123456') {
  return { id, name: id, display_name: id.toUpperCase(), color }
}

// Élément (nœud/flux) minimal : porte un ensemble d'ids de tags
function makeElement(tag_ids: string[], valueCurrent: number | null = 1) {
  return {
    valueCurrent,
    hasGivenTag(t: { id: string }) { return tag_ids.includes(t.id) }
  }
}

function makeSankey(overrides: Partial<Type_SankeyForLegend> = {}): Type_SankeyForLegend {
  return {
    node_taggs_list: [],
    flux_taggs_list: [],
    data_taggs_list: [],
    visible_nodes_list: [],
    visible_links_list: [],
    ...overrides
  }
}

describe('OS#1254 — prédicats d\'ids', () => {
  it('reconnaît le cadre, les enfants, et rien d\'autre', () => {
    expect(isLegendFrameId('legend')).toBe(true)
    expect(isLegendChildId('legend')).toBe(false)
    expect(isLegendChildId('legend-tag-g1-t1')).toBe(true)
    expect(isLegendElementId('legend')).toBe(true)
    expect(isLegendElementId('legend-scale')).toBe(true)
    expect(isLegendElementId('legende')).toBe(false)
    expect(isLegendElementId('shape0')).toBe(false)
  })
})

describe('OS#1254 — computeLegendItems', () => {
  it('ignore les groupes sans use_colors', () => {
    const sankey = makeSankey({
      node_taggs_list: [
        { id: 'g1', name: 'G1', use_colors: false, selected_tags_list: [makeTag('t1')] }
      ],
      visible_nodes_list: [makeElement(['t1'])]
    })
    expect(computeLegendItems(sankey, base_config)).toEqual([])
  })

  it('émet titre de groupe + une entrée par tag porté par un élément visible', () => {
    const t1 = makeTag('t1', '#ff0000')
    const t2 = makeTag('t2', '#00ff00')
    const sankey = makeSankey({
      node_taggs_list: [
        { id: 'g1', name: 'Groupe 1', use_colors: true, selected_tags_list: [t1, t2] }
      ],
      // t1 porté par un nœud visible, t2 par personne
      visible_nodes_list: [makeElement(['t1'])]
    })
    const items = computeLegendItems(sankey, base_config)
    expect(items.map(i => i.id)).toEqual(['legend-group-g1', 'legend-tag-g1-t1'])
    expect(items[0]).toMatchObject({ text: 'Groupe 1', bold: true, starts_group: true })
    expect(items[1]).toMatchObject({
      text: 'T1', swatch_color: '#ff0000', tag_group_id: 'g1', tag_id: 't1'
    })
  })

  it('montre toujours les data tags sélectionnés (même sans élément porteur)', () => {
    const sankey = makeSankey({
      data_taggs_list: [
        { id: 'annee', name: 'Année', use_colors: true, selected_tags_list: [makeTag('2020')] }
      ]
    })
    const items = computeLegendItems(sankey, base_config)
    expect(items.map(i => i.id)).toEqual(['legend-group-annee', 'legend-tag-annee-2020'])
  })

  it('émet la ligne des data tags sélectionnés quand show_dataTags', () => {
    const sankey = makeSankey({
      data_taggs_list: [
        { id: 'annee', name: 'Année', use_colors: false, selected_tags_list: [makeTag('2020'), makeTag('2021')] }
      ]
    })
    const items = computeLegendItems(sankey, { ...base_config, show_dataTags: true })
    expect(items).toEqual([
      expect.objectContaining({ id: 'legend-datatag-annee', text: 'Année : 2020, 2021' })
    ])
  })

  it('émet l\'explication des flux pointillés seulement si option + flux à valeur nulle', () => {
    const sankey = makeSankey({
      visible_links_list: [makeElement([], null)]
    })
    const env = { t_dashed_links: 'Flux indéterminés' }
    expect(computeLegendItems(sankey, base_config, env)).toEqual([])
    const items = computeLegendItems(sankey, { ...base_config, info_link_value_void: true }, env)
    expect(items).toEqual([
      expect.objectContaining({ id: 'legend-info-dashed', text: 'Flux indéterminés' })
    ])
  })

  it('émet l\'échelle et le tableau des contraintes sur demande', () => {
    const items = computeLegendItems(
      makeSankey(),
      { ...base_config, display_scale: true, show_constraints: true },
      {},
      'Echelle : 50 t'
    )
    expect(items[0]).toMatchObject({ id: 'legend-scale', text: 'Echelle : 50 t' })
    const constraint_items = items.filter(i => i.id.startsWith('legend-constraint-'))
    expect(constraint_items).toHaveLength(6)
    expect(constraint_items[0].starts_group).toBe(true)
  })

  it('normalise les ids de tags/groupes exotiques (espaces, quotes)', () => {
    const tag = makeTag('l\'été 2020')
    const sankey = makeSankey({
      flux_taggs_list: [
        { id: 'mes tags', name: 'Mes tags', use_colors: true, selected_tags_list: [tag] }
      ],
      visible_links_list: [makeElement(['l\'été 2020'])]
    })
    const items = computeLegendItems(sankey, base_config)
    expect(items[1].id).toBe('legend-tag-mes_tags-l__t__2020')
  })
})

describe('sa#532 — étiquettes désélectionnées : l\'état est représentable', () => {
  // Un groupe de nodeTags à 3 étiquettes dont une désélectionnée. Le mock reproduit le
  // fait dur du modèle : une étiquette désélectionnée rend ses porteurs INVISIBLES
  // (Node.are_related_node_tags_selected), donc `visible_nodes_list` ne la porte pas
  // — elle n'apparaît que dans `nodes_list`. Un mock qui la mettrait dans les deux
  // listes ferait passer le test sans rien prouver.
  const t1 = { ...makeTag('t1', '#ff0000'), is_selected: true }
  const t2 = { ...makeTag('t2', '#00ff00'), is_selected: false }
  const t3 = { ...makeTag('t3', '#0000ff'), is_selected: true }

  function sankeyWithOneUnselected(): Type_SankeyForLegend {
    const visible = [makeElement(['t1', 't3'])]
    return makeSankey({
      node_taggs_list: [{
        id: 'g1', name: 'Groupe 1', use_colors: true,
        selected_tags_list: [t1, t3],
        tags_list: [t1, t2, t3]
      }],
      visible_nodes_list: visible,
      nodes_list: [...visible, makeElement(['t2'])]
    })
  }

  it('rend 3 entrées pour un groupe à 3 étiquettes dont 1 désélectionnée, une seule atténuée', () => {
    const items = computeLegendItems(sankeyWithOneUnselected(), base_config)
    const entries = items.filter(i => i.tag_id !== undefined)
    expect(entries).toHaveLength(3)
    expect(entries.map(i => i.tag_id)).toEqual(['t1', 't2', 't3'])
    expect(entries.map(i => i.dimmed)).toEqual([undefined, true, undefined])
    // Le texte et la pastille d'une entrée atténuée restent ceux du tag : c'est le
    // rendu (ticket du clic) qui la distinguera, pas son contenu.
    expect(entries[1]).toMatchObject({ text: 'T2', swatch_color: '#00ff00', tag_group_id: 'g1' })
  })

  it('une étiquette désélectionnée que RIEN ne porte reste hors légende (étiquette morte)', () => {
    const orphan = { ...makeTag('mort'), is_selected: false }
    const visible = [makeElement(['t1'])]
    const sankey = makeSankey({
      node_taggs_list: [{
        id: 'g1', name: 'Groupe 1', use_colors: true,
        selected_tags_list: [t1], tags_list: [t1, orphan]
      }],
      visible_nodes_list: visible,
      nodes_list: visible
    })
    const items = computeLegendItems(sankey, base_config)
    expect(items.filter(i => i.tag_id !== undefined).map(i => i.tag_id)).toEqual(['t1'])
  })

  it('un dataTag non sélectionné n\'est PAS atténué : sa sélection est un choix, pas un masquage', () => {
    // checkSelectionCoherence reselectionne d'office si la selection tombe a zero
    // (TagGroup.tsx) : une entree grisee « cliquez pour retablir » y mentirait.
    const y2020 = { ...makeTag('2020'), is_selected: true }
    const y2021 = { ...makeTag('2021'), is_selected: false }
    const sankey = makeSankey({
      data_taggs_list: [{
        id: 'annee', name: 'Année', use_colors: true,
        selected_tags_list: [y2020], tags_list: [y2020, y2021]
      }]
    })
    const items = computeLegendItems(sankey, base_config)
    expect(items.map(i => i.id)).toEqual(['legend-group-annee', 'legend-tag-annee-2020'])
  })

  it('modèle INCHANGÉ pour un appelant sans tags_list (rétro-compatibilité des mocks)', () => {
    const sankey = makeSankey({
      flux_taggs_list: [
        { id: 'g', name: 'G', use_colors: true, selected_tags_list: [makeTag('a')] }
      ],
      visible_links_list: [makeElement(['a'])]
    })
    const items = computeLegendItems(sankey, base_config)
    expect(items.map(i => i.id)).toEqual(['legend-group-g', 'legend-tag-g-a'])
    expect(items.every(i => i.dimmed === undefined)).toBe(true)
  })
})

describe('sa#532 — renderableLegendItems : ce qui est effectivement posé', () => {
  it('SA#549 — réglage allumé : les entrées atténuées sont rendues, à leur place', () => {
    const t1 = { ...makeTag('t1'), is_selected: true }
    const t2 = { ...makeTag('t2'), is_selected: false }
    const t3 = { ...makeTag('t3'), is_selected: false }
    const visible = [makeElement(['t1'])]
    const sankey = makeSankey({
      node_taggs_list: [{
        id: 'g1', name: 'Groupe 1', use_colors: true,
        selected_tags_list: [t1], tags_list: [t2, t1, t3]
      }],
      visible_nodes_list: visible,
      nodes_list: [...visible, makeElement(['t2', 't3'])]
    })
    const items = computeLegendItems(sankey, base_config)
    const rendered = renderableLegendItems(items, true)
    expect(rendered.map(i => i.id)).toEqual(['legend-group-g1', 'legend-tag-g1-t2', 'legend-tag-g1-t1', 'legend-tag-g1-t3'])
    expect(rendered.map(i => i.dimmed)).toEqual([undefined, true, undefined, true])
  })

  it('SA#549 — réglage allumé : un groupe entièrement masqué garde son titre et ses entrées', () => {
    const t1 = { ...makeTag('t1'), is_selected: false }
    const sankey = makeSankey({
      node_taggs_list: [{
        id: 'g1', name: 'Groupe 1', use_colors: true,
        selected_tags_list: [], tags_list: [t1]
      }],
      visible_nodes_list: [],
      nodes_list: [makeElement(['t1'])]
    })
    const rendered = renderableLegendItems(computeLegendItems(sankey, base_config), true)
    expect(rendered.map(i => i.id)).toEqual(['legend-group-g1', 'legend-tag-g1-t1'])
  })

  it('SA#549 — réglage allumé : une étiquette dont les éléments sont masqués par une autre garde sa place', () => {
    // Retour du test local : masquer « Indicative » retirait d'autres entrées, la légende
    // remontait sous le curseur et le reclic tombait sur l'entrée voisine.
    const a = { ...makeTag('a'), is_selected: true }
    const b = { ...makeTag('b'), is_selected: true }
    const all = [makeElement(['a']), makeElement(['b'])]
    const sankey = makeSankey({
      node_taggs_list: [{ id: 'g1', name: 'G1', use_colors: true, selected_tags_list: [a, b], tags_list: [a, b] }],
      visible_nodes_list: [all[0]],
      nodes_list: all
    })
    const ids = (show: boolean) =>
      renderableLegendItems(computeLegendItems(sankey, { ...base_config, show_hidden_tags: show }), show).map(i => i.id)
    expect(ids(false)).toEqual(['legend-group-g1', 'legend-tag-g1-a'])
    expect(ids(true)).toEqual(['legend-group-g1', 'legend-tag-g1-a', 'legend-tag-g1-b'])
  })

  it('écarte les entrées atténuées par défaut — le contenu rendu est celui d\'avant sa#532', () => {
    const t1 = { ...makeTag('t1'), is_selected: true }
    const t2 = { ...makeTag('t2'), is_selected: false }
    const visible = [makeElement(['t1'])]
    const sankey = makeSankey({
      node_taggs_list: [{
        id: 'g1', name: 'Groupe 1', use_colors: true,
        selected_tags_list: [t1], tags_list: [t1, t2]
      }],
      visible_nodes_list: visible,
      nodes_list: [...visible, makeElement(['t2'])]
    })
    const rendered = renderableLegendItems(computeLegendItems(sankey, base_config))
    expect(rendered.map(i => i.id)).toEqual(['legend-group-g1', 'legend-tag-g1-t1'])
  })

  it('un groupe ENTIÈREMENT désélectionné ne laisse pas de titre orphelin', () => {
    // Avant sa#532 un tel groupe n'émettait AUCUN item (displayed_tags vide) : le titre
    // et son cadre de bloc ne doivent pas apparaître maintenant que les étiquettes
    // désélectionnées sont décrites.
    const t1 = { ...makeTag('t1'), is_selected: false }
    const t2 = { ...makeTag('t2'), is_selected: false }
    const all = [makeElement(['t1', 't2'])]
    const sankey = makeSankey({
      node_taggs_list: [{
        id: 'g1', name: 'Groupe 1', use_colors: true,
        selected_tags_list: [], tags_list: [t1, t2]
      }],
      visible_nodes_list: [],
      nodes_list: all
    })
    const items = computeLegendItems(sankey, base_config)
    expect(items.map(i => i.id)).toEqual(['legend-group-g1', 'legend-tag-g1-t1', 'legend-tag-g1-t2'])
    expect(renderableLegendItems(items)).toEqual([])
  })

  it('ne touche pas aux lignes sans bloc (échelle, contraintes, infos)', () => {
    const items = computeLegendItems(
      makeSankey(),
      { ...base_config, display_scale: true, show_constraints: true },
      {},
      'Echelle : 50 t'
    )
    expect(renderableLegendItems(items)).toEqual(items)
  })
})

describe('OS#1254 — layoutLegendItems', () => {
  const items = [
    { id: 'a', text: 'Titre', bold: true, starts_group: true, own_line: true },
    { id: 'b', text: 'Entrée', swatch_color: '#f00' },
    { id: 'b2', text: 'Entrée 2', swatch_color: '#0f0' },
    { id: 'c', text: 'Autre groupe', starts_group: true, own_line: true }
  ]

  it('vertical : empile, jamais de x', () => {
    const pos = layoutLegendItems(items, base_config)
    expect(pos.map(p => p.id)).toEqual(['a', 'b', 'b2', 'c'])
    expect(pos.every(p => p.x === 0)).toBe(true)
    expect(pos[0].y).toBe(0)
    expect(pos[1].y).toBeGreaterThan(pos[0].y)
    expect(pos[2].y).toBeGreaterThan(pos[1].y)
    expect(pos[3].y).toBeGreaterThan(pos[2].y)
  })

  it('vertical : un texte long (wrap) réserve plusieurs lignes', () => {
    const long_items = [
      { id: 'long', text: 'x'.repeat(200) },
      { id: 'next', text: 'suivant' }
    ]
    const pos = layoutLegendItems(long_items, base_config)
    const single_line = base_config.police * 1.5
    expect(pos[1].y).toBeGreaterThan(single_line)
  })

  it('#556 — vertical : même écart entre deux noms, qu\'ils tiennent sur une ligne ou plusieurs', () => {
    const police = base_config.police
    const entries = [
      { id: 'un', text: 'Lait cru', swatch_color: '#f00' },
      { id: 'deux', text: 'Equilibrage des process Lait en PB, MP et MG - Projet RefFlux', swatch_color: '#0f0' },
      { id: 'trois', text: 'Hypothèse conditionné ne sert que les ménages', swatch_color: '#00f' },
      { id: 'quatre', text: 'ONRB', swatch_color: '#ff0' }
    ]
    // Lignes MESURÉES : elles l'emportent sur l'estimation
    const pos = layoutLegendItems(entries, base_config, new Map([['un', 1], ['deux', 2], ['trois', 3]]))
    // Chaque rangée = ses lignes à 1 police + le même écart de 0,5 police qu'entre deux noms d'une ligne
    expect(pos[1].y - pos[0].y).toBe(1.5 * police)
    expect(pos[2].y - pos[1].y).toBe(1.5 * police + police)
    expect(pos[3].y - pos[2].y).toBe(1.5 * police + 2 * police)
    // La dernière ligne d'un nom décalé (legendEntryLabelShift) finit à n polices du haut de sa
    // rangée : l'écart jusqu'au nom suivant vaut 0,5 police dans tous les cas.
    expect(legendEntryLabelShift(1, police)).toBe(0)
    expect(legendEntryLabelShift(3, police)).toBe(police)
    expect(pos[3].y - (pos[2].y + 3 * police)).toBe(0.5 * police)
    expect(legendEntryRowHeight(1, police)).toBe(1.5 * police)
  })

  it('horizontal : titre seul sur sa ligne, entrées enchaînées, nouveau groupe = nouvelle ligne', () => {
    const pos = layoutLegendItems(items, { ...base_config, horizontal: true })
    const line_height = base_config.police * 1.5
    // Titre sur sa propre ligne
    expect(pos[0]).toMatchObject({ x: 0, y: 0 })
    // Les deux entrées s'enchaînent sur la ligne suivante
    expect(pos[1]).toMatchObject({ x: 0, y: line_height })
    expect(pos[2].x).toBeGreaterThan(0)
    expect(pos[2].y).toBe(line_height)
    // Le titre du groupe suivant repart à la ligne
    expect(pos[3].x).toBe(0)
    expect(pos[3].y).toBeGreaterThan(line_height)
  })
})

describe('OS#1254 — computeScaleText', () => {
  it('échelle simple : moitié de l\'échelle du dessin, ratio appliqué', () => {
    expect(computeScaleText(100, [], base_config, 'Echelle')).toBe('Echelle : 50')
    expect(computeScaleText(100, [], { ...base_config, scale_ratio: 2 }, 'Echelle')).toBe('Echelle : 25')
  })

  it('unité du tag d\'unité sélectionné, remplacée par l\'unité utilisateur', () => {
    const data_taggs = [{
      id: 'unit', name: 'Unités', use_colors: false, is_unit: true,
      selected_tags_list: [{ ...makeTag('kt'), scale: 10, is_selected: true }]
    }]
    expect(computeScaleText(100, data_taggs, base_config, 'Echelle')).toBe('Echelle : 5 kt')
    expect(computeScaleText(100, data_taggs, { ...base_config, scale_unit: 'Mt' }, 'Echelle'))
      .toBe('Echelle : 5 Mt')
  })

  it('formatage : entier si >= 1, 3 chiffres significatifs sinon', () => {
    expect(computeScaleText(0.005, [], base_config, 'Echelle')).toBe('Echelle : 0.0025')
    expect(computeScaleText(3, [], base_config, 'Echelle')).toBe('Echelle : 1.5')
  })
})

describe('#542 — la définition suit l\'entrée de légende', () => {
  const FIABLE = 'Fiable : donnée présentant un très faible niveau d\'incertitude.'

  it('porte la définition du groupe sur le titre et celle de l\'étiquette sur son entrée', () => {
    const sankey = makeSankey({
      flux_taggs_list: [{
        id: 'fiab', name: 'Fiabilité des données', use_colors: true,
        description: 'Niveau de confiance de la donnée.',
        selected_tags_list: [{ ...makeTag('fiable'), description: FIABLE }, makeTag('indicative')]
      }],
      visible_links_list: [makeElement(['fiable', 'indicative'])]
    })
    const items = computeLegendItems(sankey, base_config)
    expect(items.map(i => [i.id, i.description])).toEqual([
      ['legend-group-fiab', 'Niveau de confiance de la donnée.'],
      ['legend-tag-fiab-fiable', FIABLE],
      ['legend-tag-fiab-indicative', undefined]
    ])
  })

  it('sans définition, ni vide ni blanche, l\'entrée ne gagne pas de clé', () => {
    const sankey = makeSankey({
      node_taggs_list: [{
        id: 'g', name: 'G', use_colors: true, description: '   ',
        selected_tags_list: [{ ...makeTag('a'), description: '' }]
      }],
      visible_nodes_list: [makeElement(['a'])]
    })
    const items = computeLegendItems(sankey, base_config)
    expect(items.every(i => !('description' in i))).toBe(true)
  })

  it('porte le texte de la langue COURANTE au moment du calcul', () => {
    // Le modèle résout la définition dans la langue active (getter du #537) :
    // la légende ne doit rien mettre en cache, une régénération suit la langue.
    const definitions: Record<string, string> = { fr: FIABLE, en: 'Reliable: very low uncertainty.' }
    let lang = 'fr'
    const tag = { ...makeTag('fiable'), get description() { return definitions[lang] } }
    const sankey = makeSankey({
      data_taggs_list: [{ id: 'fiab', name: 'Fiabilité', use_colors: true, selected_tags_list: [tag] }]
    })
    const entry = () => computeLegendItems(sankey, base_config).find(i => i.tag_id === 'fiable')
    expect(entry()?.description).toBe(FIABLE)
    lang = 'en'
    expect(entry()?.description).toBe('Reliable: very low uncertainty.')
  })

  it('la définition traverse renderableLegendItems', () => {
    const sankey = makeSankey({
      flux_taggs_list: [{
        id: 'fiab', name: 'Fiabilité', use_colors: true, description: 'Groupe',
        selected_tags_list: [{ ...makeTag('fiable'), description: FIABLE }]
      }],
      visible_links_list: [makeElement(['fiable'])]
    })
    const rendered = renderableLegendItems(computeLegendItems(sankey, base_config))
    expect(rendered.map(i => i.description)).toEqual(['Groupe', FIABLE])
  })
})

describe('#533 — « ce groupe porte une mise en forme »', () => {
  // La légende ne montrait que les groupes pilotant la COULEUR. Porter la
  // fiabilité par l'opacité « pour laisser le tag couleur libre » l'aurait donc
  // retirée de la légende — exactement l'information qu'on veut y lire.
  //
  // Le prédicat élargi se réduit à `use_colors` tant que le socle de format
  // (#537) n'a pas posé son porteur de style : les deux premiers cas fixent
  // cette équivalence, le troisième prouve que le terme à venir a bien prise.
  //
  // Les cas de figure sont montés sur un groupe de fluxTags à `use_colors=false`
  // parce que c'est le cas MESURÉ : les quatre groupes de fluxTags de
  // « [SOCLE] Lait de vache - Résultats.gz » y sont tous.

  it('laisse hors légende un groupe qui ne porte aucune mise en forme', () => {
    const sankey = makeSankey({
      flux_taggs_list: [
        { id: 'fiab', name: 'Fiabilité des données', use_colors: false, selected_tags_list: [makeTag('sure')] }
      ],
      visible_links_list: [makeElement(['sure'])]
    })
    expect(computeLegendItems(sankey, base_config)).toEqual([])
  })

  it('reste fermé de lui-même : porteur de style absent, undefined ou éteint', () => {
    // Groupes simulés : `has_style_patch` y est posé à la main. Sur les vraies
    // classes il dérive de `style_patch` (raccord du #537, cf.
    // types/TagGroup.hasStylePatch.test.ts) et vaut `false` pour tout groupe
    // sans patch — le cas réel de TOUS les groupes du parc.
    const avec = (has_style_patch?: boolean) => makeSankey({
      flux_taggs_list: [
        { id: 'fiab', name: 'Fiabilité des données', use_colors: false, has_style_patch, selected_tags_list: [makeTag('sure')] }
      ],
      visible_links_list: [makeElement(['sure'])]
    })
    expect(computeLegendItems(avec(undefined), base_config)).toEqual([])
    expect(computeLegendItems(avec(false), base_config)).toEqual([])
  })

  it('fait apparaître un groupe qui pilote autre chose que la couleur', () => {
    const sankey = makeSankey({
      flux_taggs_list: [
        { id: 'fiab', name: 'Fiabilité des données', use_colors: false, has_style_patch: true, selected_tags_list: [makeTag('sure')] }
      ],
      visible_links_list: [makeElement(['sure'])]
    })
    const items = computeLegendItems(sankey, base_config)
    expect(items.map(i => i.id)).toEqual(['legend-group-fiab', 'legend-tag-fiab-sure'])
    expect(items[0]).toMatchObject({ text: 'Fiabilité des données', bold: true })
  })
})
