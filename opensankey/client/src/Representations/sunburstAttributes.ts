// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2026 TerriFlux
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction.
// ==================================================================================================
// Author        : TerriFlux
// ==================================================================================================

// os#1425 — CE QUE RÈGLE UNE COURONNE : ses clés de NAVIGATION, et le sous-ensemble du catalogue
// qu'elle honore.
//
// Ce fichier était long : il déclarait chaque réglage de mise en forme — libellés des sept
// langues, choix, contrôle — sous des noms à lui. Il ne déclare plus que deux choses :
//
//  1. SES CLÉS DE NAVIGATION, propres à elle par nature : la hiérarchie de départ, l'enchaînement
//     des axes, la profondeur, le régime de valeur d'un secteur parent, le côté d'un nœud d'où la
//     valeur se lit. Ce sont les questions « qu'est-ce qu'on lit », qui n'ont de sens que pour une
//     couronne et ne se conservent pas quand on passe à une autre nature — et c'est juste.
//
//  2. CE QU'ELLE PIQUE AU CATALOGUE (`FIGURE_ATTRIBUTES_CONFIG`, cf. figureCatalogue) : la forme,
//     les étiquettes, les valeurs, la légende, le centre, les parts, le geste du clic — sous les
//     mêmes noms, les mêmes libellés et les mêmes contrôles que toute autre figure, et que les
//     nœuds et les flux là où la question est la même. Elle ne dit que ce en quoi une clé diffère
//     chez elle : dix points de police et non vingt, un liséré blanc et non noir.
//
// Ce qu'elle ne pique pas n'apparaît nulle part : la position d'une étiquette (elle suit son
// secteur), ses marges, son encadré, l'icône. C'est la règle « garder toute l'interface, cacher
// ce qui n'a pas de sens » (arbitrage Julien, 18/09/2026).

import { figureAttribute, honours } from './figureAttribute'
import type { Labels7 } from './figureAttribute'
import type { Type_FigureAttributesConfig, Type_FigureChoiceContext, Type_OptionBag } from './Figure'
import { FIGURE_ATTRIBUTES_CONFIG } from './figureCatalogue'
import { sunburstDimensions } from '../Charts/SunburstHierarchy'
import type { Type_SunburstSankey } from '../Charts/SunburstHierarchy'

const G_READ = 'sunburst.group.read'

const choice = (value: string | number, labels: Labels7) => ({ value, labels })

/** Les hiérarchies du diagramme regardé — jamais figées : un axe ajouté apparaît de lui-même. */
const dimensionChoices = (ctx: Type_FigureChoiceContext) => {
  const sankey = ctx.app_data?.drawing_area?.sankey as Type_SunburstSankey | undefined
  if (!sankey?.nodes_list) return []
  return sunburstDimensions(sankey).map(d => ({ value: d.id, label: d.label }))
}

const is = (o: Type_OptionBag, key: string, fallback: boolean): boolean =>
  typeof o[key] === 'boolean' ? o[key] as boolean : fallback

/** Les étiquettes sont-elles écrites du tout ? Rien de ce qui les règle n'a de sens sinon. */
const labelled = (o: Type_OptionBag) => is(o, 'name_label_is_visible', true)
/** La valeur est-elle écrite à côté du nom ? */
const valued = (o: Type_OptionBag) => labelled(o) && is(o, 'value_label_is_visible', false)

// ── 1. Ce qu'on lit — propre à la couronne ────────────────────────────────────── navigation ──
const NAVIGATION: Type_FigureAttributesConfig = {
  dimension_id: figureAttribute<string | undefined>(undefined, 'navigation', {
    en: 'First hierarchy', fr: 'Première hiérarchie', es: 'Primera jerarquía',
    de: 'Erste Hierarchie', it: 'Prima gerarchia', 'zh-CN': '首个层级', ja: '最初の階層'
  }, undefined, { kind: 'select', choicesOf: dimensionChoices, group: G_READ }),

  chain_axes: figureAttribute<boolean>(true, 'navigation', {
    en: 'Chain the other hierarchies', fr: 'Enchaîner les autres hiérarchies',
    es: 'Encadenar las demás jerarquías', de: 'Weitere Hierarchien verketten',
    it: 'Concatenare le altre gerarchie', 'zh-CN': '串联其他层级', ja: '他の階層を連結する'
  }, {
    en: 'A node with no children left in the current hierarchy continues in the next one.',
    fr: 'Un nœud qui n’a plus d’enfants dans la hiérarchie courante continue dans la suivante.',
    es: 'Un nodo sin hijos en la jerarquía actual continúa en la siguiente.',
    de: 'Ein Knoten ohne Kinder in der aktuellen Hierarchie setzt in der nächsten fort.',
    it: 'Un nodo senza figli nella gerarchia corrente prosegue nella successiva.',
    'zh-CN': '当前层级中已无子节点的节点，将在下一层级继续展开。',
    ja: '現在の階層で子を持たないノードは、次の階層で続きます。'
  }, { group: G_READ, advanced: true }),

  max_depth: figureAttribute<number>(6, 'navigation', {
    en: 'Maximum depth', fr: 'Profondeur maximale', es: 'Profundidad máxima',
    de: 'Maximale Tiefe', it: 'Profondità massima', 'zh-CN': '最大深度', ja: '最大の深さ'
  }, {
    en: 'How many rings at most. Beyond that the hierarchy is cut, and the cut is reported.',
    fr: 'Combien d’anneaux au plus. Au-delà, la hiérarchie est coupée et la coupe est signalée.',
    es: 'Cuántos anillos como máximo. Más allá, la jerarquía se corta y el corte se indica.',
    de: 'Wie viele Ringe höchstens. Darüber hinaus wird die Hierarchie abgeschnitten.',
    it: 'Quanti anelli al massimo. Oltre, la gerarchia viene tagliata e il taglio segnalato.',
    'zh-CN': '最多绘制多少环。超出部分会被截断并加以提示。',
    ja: 'リングは最大でいくつか。超えた分は打ち切られ、その旨が示されます。'
  }, { kind: 'number', min: 1, max: 12, step: 1, group: G_READ, advanced: true }),

  value_mode: figureAttribute<'sum' | 'declared'>('sum', 'navigation', {
    en: 'A parent sector is worth', fr: 'Un secteur parent vaut',
    es: 'Un sector padre vale', de: 'Ein Elternsektor entspricht',
    it: 'Un settore padre vale', 'zh-CN': '父扇区的取值', ja: '親の扇形の値'
  }, {
    en: 'Sum of children: the geometry cannot lie, the gap is reported. Own value: what the children do not cover becomes an “Unallocated” sector.',
    fr: 'Somme des enfants : la géométrie ne peut pas mentir, l’écart est signalé. Valeur propre : ce que les enfants ne couvrent pas devient un secteur « Non réparti ».',
    es: 'Suma de los hijos: la geometría no puede mentir, la diferencia se indica. Valor propio: lo que los hijos no cubren se vuelve «Sin asignar».',
    de: 'Summe der Kinder: die Geometrie kann nicht lügen, die Abweichung wird gemeldet. Eigener Wert: was die Kinder nicht abdecken, wird „Nicht zugeordnet“.',
    it: 'Somma dei figli: la geometria non può mentire, lo scarto è segnalato. Valore proprio: ciò che i figli non coprono diventa «Non assegnato».',
    'zh-CN': '子节点之和：几何关系必然成立，差异会被标注。自身值：子节点未覆盖的部分成为「未分配」扇区。',
    ja: '子ノードの合計：図形は決して嘘をつかず、差は注記されます。自身の値：子が覆わない分は「未割当」になります。'
  }, {
    kind: 'select',
    choices: [
      choice('sum', {
        en: 'the sum of its children', fr: 'la somme de ses enfants', es: 'la suma de sus hijos',
        de: 'der Summe seiner Kinder', it: 'la somma dei suoi figli',
        'zh-CN': '其子节点之和', ja: '子ノードの合計'
      }),
      choice('declared', {
        en: 'its own value', fr: 'sa valeur propre', es: 'su propio valor',
        de: 'seinem eigenen Wert', it: 'il suo valore proprio',
        'zh-CN': '其自身的值', ja: '自身の値'
      })
    ],
    group: G_READ,
    advanced: true
  }),

  node_value_mode: figureAttribute<'max' | 'inputs' | 'outputs'>('max', 'navigation', {
    en: 'A node is worth', fr: 'Un nœud vaut', es: 'Un nodo vale',
    de: 'Ein Knoten entspricht', it: 'Un nodo vale', 'zh-CN': '节点的取值', ja: 'ノードの値'
  }, {
    en: 'Which side of the node the value is read from. Often makes no difference: on a balanced diagram inflows equal outflows.',
    fr: 'De quel côté du nœud la valeur se lit. Souvent sans effet : sur un diagramme bouclé, les entrées égalent les sorties.',
    es: 'De qué lado del nodo se lee el valor. A menudo sin efecto: en un diagrama equilibrado las entradas igualan las salidas.',
    de: 'Auf welcher Seite des Knotens der Wert gelesen wird. Meist ohne Wirkung: in einem ausgeglichenen Diagramm sind Zu- und Abflüsse gleich.',
    it: 'Da quale lato del nodo si legge il valore. Spesso senza effetto: in un diagramma bilanciato gli ingressi eguagliano le uscite.',
    'zh-CN': '从节点的哪一侧读取数值。通常没有差别：在平衡的图中流入等于流出。',
    ja: 'ノードのどちら側から値を読むか。多くの場合は差が出ません（平衡した図では流入と流出は等しい）。'
  }, {
    kind: 'select',
    choices: [
      choice('max', {
        en: 'the larger of its two sides', fr: 'le plus grand de ses deux côtés',
        es: 'el mayor de sus dos lados', de: 'der größeren seiner beiden Seiten',
        it: 'il maggiore dei suoi due lati', 'zh-CN': '两侧中的较大者', ja: '両側のうち大きい方'
      }),
      choice('inputs', {
        en: 'its inflows', fr: 'ses entrées', es: 'sus entradas', de: 'seiner Zuflüsse',
        it: 'i suoi ingressi', 'zh-CN': '流入量', ja: '流入量'
      }),
      choice('outputs', {
        en: 'its outflows', fr: 'ses sorties', es: 'sus salidas', de: 'seiner Abflüsse',
        it: 'le sue uscite', 'zh-CN': '流出量', ja: '流出量'
      })
    ],
    group: G_READ,
    advanced: true
  })
}

// ── 2. Ce qu'elle pique au catalogue ───────────────────────────────────────────────── style ──
// Les valeurs d'usine données ici sont celles DU TRACÉ là où elles diffèrent de celles d'un nœud
// ou d'une autre figure : dix points et non vingt, un liséré blanc et non noir, quatre chiffres
// significatifs, un trou à 22 % du rayon. Aucune couronne enregistrée ne change d'aspect.
const HONOURED = honours(FIGURE_ATTRIBUTES_CONFIG, {
  // Forme
  shape_opacity: { default: 1, advanced: true },
  shape_border_visible: {},
  shape_border_color: { default: '#ffffff', visibleIf: (o) => is(o, 'shape_border_visible', true) },
  shape_border_thickness: { advanced: true, visibleIf: (o) => is(o, 'shape_border_visible', true) },
  parts_color_source: {},
  parts_depth_shading: {},
  parts_order: {},
  parts_group_under: {},
  scale_factor: {},

  // Libellé
  name_label_is_visible: {},
  name_label_prune_if_unfitting: { visibleIf: labelled },
  name_label_orientation: { visibleIf: labelled },
  // Ce qu'un secteur écrit de son nom (demande Julien, 18/09) : ôter ce que l'anneau précédent
  // dit déjà, ou couper au séparateur comme sur un nœud ; et la largeur de boîte, au-delà de
  // laquelle le texte revient à la ligne.
  name_label_strip_parent: { visibleIf: labelled },
  name_label_separator: { visibleIf: labelled },
  name_label_separator_part: { visibleIf: (o) => labelled(o) && typeof o['name_label_separator'] === 'string' && o['name_label_separator'] !== '' },
  name_label_box_width: { visibleIf: labelled },
  name_label_callout: { visibleIf: labelled },
  name_label_font_family: { visibleIf: labelled },
  name_label_font_size: { default: 10, visibleIf: labelled },
  name_label_bold: { visibleIf: labelled },
  name_label_italic: { advanced: true, visibleIf: labelled },
  name_label_uppercase: { advanced: true, visibleIf: labelled },
  name_label_follow_diagram: { visibleIf: labelled },
  name_label_contrast_color: { visibleIf: labelled },
  name_label_color: {
    advanced: true,
    visibleIf: (o) => labelled(o) && !is(o, 'name_label_contrast_color', true)
  },

  // Valeur
  value_label_is_visible: { visibleIf: labelled },
  value_label_unit_visible: { visibleIf: valued },
  value_label_percent: { visibleIf: labelled },
  value_label_significant_digits: { default: true, visibleIf: valued },
  value_label_nb_significant_digits: {
    default: 4, visibleIf: (o) => valued(o) && is(o, 'value_label_significant_digits', true)
  },
  value_label_custom_digit: { advanced: true, visibleIf: valued },
  value_label_nb_digit: {
    advanced: true, visibleIf: (o) => valued(o) && is(o, 'value_label_custom_digit', false)
  },
  value_label_scientific_notation: { advanced: true, visibleIf: valued },

  // Titre — l'onglet Titre de l'inspecteur, comme pour le diagramme (arbitrage du 18/09)
  title_visible: {},
  title_text: {},
  title_position: {},
  title_font_size: {},
  title_bold: {},

  // Figure : centre, légende, mentions, gestes
  centre_content: {},
  centre_hole: {},
  legend_visible: {},
  legend_parts: {},
  legend_levels: {},
  legend_position: {},
  legend_font_size: {},
  legend_width: {},
  notes_visible: {},
  interaction_tooltip: {},
  interaction_click: {}
})

// ── 3. Ce que l'auteur pose À LA MAIN sur cette figure ────────────────────────────── identity ──
// Les étiquettes sorties du disque et déposées ailleurs (demande Julien, 18/09) : un dictionnaire
// par secteur, sans interface (la souris est l'interface), et de sorte 'identity' — la position
// d'une étiquette de CE disque n'a pas d'homologue sur un autre, ni sa place dans un style.
const PLACED: Type_FigureAttributesConfig = {
  label_positions: figureAttribute<{ [sector_id: string]: { x: number, y: number } } | undefined>(
    undefined, 'identity', {
      en: 'Placed labels', fr: 'Étiquettes posées', es: 'Etiquetas colocadas', de: 'Platzierte Beschriftungen',
      it: 'Etichette posizionate', 'zh-CN': '已放置的标签', ja: '配置したラベル'
    })
}

export const SUNBURST_ATTRIBUTES: Type_FigureAttributesConfig = { ...NAVIGATION, ...HONOURED, ...PLACED }
