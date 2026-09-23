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

// os#1425 — LE CATALOGUE DES ATTRIBUTS DE FIGURE : tout celui des éléments, complété.
//
// « Reprendre littéralement tout ALL_ATTRIBUTES_CONFIG, le compléter au maximum, mais que chaque
// figure sache ce qui est pertinent et n'en garde qu'un sous-ensemble » (Julien, 18/09/2026,
// cf. NOTE-CATALOGUE-ATTRIBUTS.md). C'est le modèle d'Excel : un seul jeu de réglages de
// graphique, chaque type n'en montre que la part qui a un sens, et changer de type ne perd rien.
//
// CE FICHIER EST LE JEU UNIQUE. Une question qu'une figure se pose est déclarée ICI, une fois,
// dans les sept langues et avec son contrôle — jamais dans le fichier d'une nature. Une nature
// PIQUE ensuite son sous-ensemble (`honours`, cf. figureAttribute) : elle nomme les clés qu'elle
// honore et ne redéclare rien. Deux natures qui partagent une clé partagent donc son libellé, son
// contrôle et — puisque `figureOf` conserve la surcharge propre au changement de nature — son
// réglage.
//
// LES FAMILLES SONT NOMMÉES PAR LA QUESTION, JAMAIS PAR LA FIGURE : `parts_*` vaut pour les
// secteurs d'une couronne comme pour les barres d'un histogramme, `legend_*` pour toute figure à
// légende. Une clé qui ne vaudrait que pour une nature n'a pas sa place ici — elle reste dans la
// déclaration de cette nature (l'axe d'une couronne, le flux de référence d'une étoile : ce sont
// ses clés de NAVIGATION, qui ne se conservent pas d'une nature à l'autre, et c'est juste).
//
// POURQUOI UN SECOND OBJET ET NON UN AJOUT À `ALL_ATTRIBUTES_CONFIG` : un nœud et un flux
// définissent un accesseur PAR INSTANCE pour chaque clé de ce catalogue (Class_ProtoElement), et
// la persistance en compare chaque clé au défaut. Vingt clés de figure y coûteraient vingt
// accesseurs muets par élément d'un diagramme de mille. Le catalogue des figures REPREND donc
// celui des éléments par étalement et le complète — c'est littéralement « tout, complété » —
// sans rien coûter aux éléments. Le jour où le diagramme lui-même honorera `legend_*` (lot 4 de
// la note), il piquera dans le même objet.

import type { AttributeConfig } from '../Elements/ElementsAttributesConfig'
import { ALL_ATTRIBUTES_CONFIG, font_families } from '../Elements/ElementsAttributesConfig'
import type { Type_FigureControl } from './Figure'

/** Un libellé dans les sept langues du dépôt (sa#531). */
type Labels7 = {
  en: string, fr: string, es: string, de: string, it: string, 'zh-CN': string, ja: string
}

/**
 * Une entrée du catalogue : le patron des éléments, plus le CONTRÔLE qui la règle. Le contrôle
 * vit avec la clé parce qu'il en fait partie — un ordre de secteurs est une liste de quatre
 * choix quelle que soit la figure qui l'honore.
 */
export type Type_FigureCatalogueEntry = AttributeConfig<unknown> & { ui?: Type_FigureControl }

const choice = (value: string | number, labels: Labels7) => ({ value, labels })

/** Une entrée, en une ligne : valeur d'usine, catégorie (= famille), libellés, contrôle. */
const entry = <T>(
  default_value: T,
  category: string,
  labels: Labels7,
  tooltips: Labels7,
  ui?: Type_FigureControl
): Type_FigureCatalogueEntry => ({
  default: default_value,
  type: () => default_value,
  category,
  labels,
  tooltips,
  actions: undefined,
  ui
})

// ── legend_* : la légende d'une figure ───────────────────────────────────────────────────────
// Toute figure qui en dessine une. Le diagramme lui-même a la sienne (`default_legend_police`…),
// qui rejoindra ces clés au lot 4.
export const LEGEND_CONFIG = {
  legend_visible: entry<boolean>(true, 'legend', {
    en: 'Legend', fr: 'Légende', es: 'Leyenda', de: 'Legende', it: 'Legenda',
    'zh-CN': '图例', ja: '凡例'
  }, {
    en: 'Show the legend of the figure.', fr: 'Afficher la légende de la figure.',
    es: 'Mostrar la leyenda de la figura.', de: 'Legende der Abbildung anzeigen.',
    it: 'Mostrare la legenda della figura.', 'zh-CN': '显示图形的图例。', ja: '図の凡例を表示します。'
  }),
  legend_parts: entry<'auto' | 'all' | 'none'>('auto', 'legend', {
    en: 'Parts in the legend', fr: 'Les parts dans la légende', es: 'Las partes en la leyenda',
    de: 'Teile in der Legende', it: 'Le parti nella legenda', 'zh-CN': '图例中的部分', ja: '凡例に載せる部分'
  }, {
    en: 'Automatic lists only the parts the drawing could not name itself.',
    fr: 'Automatique ne liste que les parts que le dessin n’a pas pu nommer lui-même.',
    es: 'Automática solo enumera las partes que el dibujo no pudo nombrar.',
    de: 'Automatisch listet nur die Teile, die die Zeichnung nicht selbst benennen konnte.',
    it: 'Automatica elenca solo le parti che il disegno non ha potuto nominare.',
    'zh-CN': '自动模式只列出图中无法自行标注的部分。', ja: '自動では、図中に名前を書けなかった部分だけを並べます。'
  }, {
    kind: 'select',
    choices: [
      choice('auto', { en: 'Automatic', fr: 'Automatique', es: 'Automática', de: 'Automatisch', it: 'Automatica', 'zh-CN': '自动', ja: '自動' }),
      choice('all', { en: 'All', fr: 'Toutes', es: 'Todas', de: 'Alle', it: 'Tutte', 'zh-CN': '全部', ja: 'すべて' }),
      choice('none', { en: 'None', fr: 'Aucune', es: 'Ninguna', de: 'Keine', it: 'Nessuna', 'zh-CN': '无', ja: 'なし' })
    ],
    visibleIf: (o) => o['legend_visible'] !== false
  }),
  legend_levels: entry<boolean>(true, 'legend', {
    en: 'Levels in the legend', fr: 'Les niveaux dans la légende', es: 'Los niveles en la leyenda',
    de: 'Ebenen in der Legende', it: 'I livelli nella legenda', 'zh-CN': '图例中的层级', ja: '凡例に載せる階層'
  }, {
    en: 'Name what each ring or level is the cut of.', fr: 'Nommer de quoi chaque anneau ou niveau est la coupe.',
    es: 'Nombrar de qué es corte cada anillo o nivel.', de: 'Benennen, wovon jeder Ring oder jede Ebene der Schnitt ist.',
    it: 'Nominare di cosa è il taglio ogni anello o livello.', 'zh-CN': '说明每个环或层级按什么划分。',
    ja: '各リングや階層が何で区切られているかを示します。'
  }, { visibleIf: (o) => o['legend_visible'] !== false }),
  legend_position: entry<'right' | 'left' | 'bottom'>('right', 'legend', {
    en: 'Legend position', fr: 'Position de la légende', es: 'Posición de la leyenda',
    de: 'Position der Legende', it: 'Posizione della legenda', 'zh-CN': '图例位置', ja: '凡例の位置'
  }, {
    en: 'Where the legend sits around the drawing.', fr: 'Où la légende se pose autour du dessin.',
    es: 'Dónde se sitúa la leyenda alrededor del dibujo.', de: 'Wo die Legende um die Zeichnung liegt.',
    it: 'Dove si colloca la legenda attorno al disegno.', 'zh-CN': '图例在图形周围的位置。', ja: '図の周りで凡例を置く位置。'
  }, {
    kind: 'select',
    choices: [
      choice('right', { en: 'Right', fr: 'À droite', es: 'A la derecha', de: 'Rechts', it: 'A destra', 'zh-CN': '右侧', ja: '右' }),
      choice('left', { en: 'Left', fr: 'À gauche', es: 'A la izquierda', de: 'Links', it: 'A sinistra', 'zh-CN': '左侧', ja: '左' }),
      choice('bottom', { en: 'Below', fr: 'Dessous', es: 'Debajo', de: 'Unten', it: 'Sotto', 'zh-CN': '下方', ja: '下' })
    ],
    visibleIf: (o) => o['legend_visible'] !== false
  }),
  legend_font_size: entry<number>(12, 'legend', {
    en: 'Legend size', fr: 'Taille de la légende', es: 'Tamaño de la leyenda',
    de: 'Schriftgröße der Legende', it: 'Dimensione della legenda', 'zh-CN': '图例字号', ja: '凡例の文字サイズ'
  }, {
    en: 'Font size of the legend, in pixels.', fr: 'Taille de police de la légende, en pixels.',
    es: 'Tamaño de fuente de la leyenda, en píxeles.', de: 'Schriftgröße der Legende in Pixeln.',
    it: 'Dimensione del carattere della legenda, in pixel.', 'zh-CN': '图例字体大小（像素）。', ja: '凡例の文字サイズ（ピクセル）。'
  }, { kind: 'number', min: 6, max: 32, step: 1, visibleIf: (o) => o['legend_visible'] !== false }),
  legend_width: entry<number>(220, 'legend', {
    en: 'Legend width', fr: 'Largeur de la légende', es: 'Ancho de la leyenda',
    de: 'Breite der Legende', it: 'Larghezza della legenda', 'zh-CN': '图例宽度', ja: '凡例の幅'
  }, {
    en: 'At most, in pixels — the drawing takes the rest.', fr: 'Au plus, en pixels — le dessin prend le reste.',
    es: 'Como máximo, en píxeles: el dibujo ocupa el resto.', de: 'Höchstens, in Pixeln — der Rest gehört der Zeichnung.',
    it: 'Al massimo, in pixel: il disegno prende il resto.', 'zh-CN': '最大宽度（像素），其余空间留给图形。', ja: '最大幅（ピクセル）。残りは図に使われます。'
  }, { kind: 'number', min: 80, max: 600, step: 10, advanced: true, visibleIf: (o) => o['legend_visible'] !== false })
} as const

// ── parts_* : les parts d'un tout — secteurs, barres ───────────────────────────────────────
export const PARTS_CONFIG = {
  parts_order: entry<'value_desc' | 'value_asc' | 'name' | 'model'>('value_desc', 'parts', {
    en: 'Order of the parts', fr: 'Ordre des parts', es: 'Orden de las partes',
    de: 'Reihenfolge der Teile', it: 'Ordine delle parti', 'zh-CN': '各部分的顺序', ja: '部分の順序'
  }, {
    en: 'Model order is the only one that does not move when values change.',
    fr: 'L’ordre du modèle est le seul qui ne bouge pas quand les valeurs changent.',
    es: 'El orden del modelo es el único que no cambia cuando cambian los valores.',
    de: 'Nur die Reihenfolge des Modells bleibt, wenn sich die Werte ändern.',
    it: 'L’ordine del modello è l’unico che non cambia quando cambiano i valori.',
    'zh-CN': '只有模型顺序在数值变化时保持不变。', ja: 'モデルの順序だけは、値が変わっても動きません。'
  }, {
    kind: 'select',
    choices: [
      choice('value_desc', { en: 'Largest first', fr: 'Du plus grand au plus petit', es: 'De mayor a menor', de: 'Größte zuerst', it: 'Dal più grande al più piccolo', 'zh-CN': '从大到小', ja: '大きい順' }),
      choice('value_asc', { en: 'Smallest first', fr: 'Du plus petit au plus grand', es: 'De menor a mayor', de: 'Kleinste zuerst', it: 'Dal più piccolo al più grande', 'zh-CN': '从小到大', ja: '小さい順' }),
      choice('name', { en: 'By name', fr: 'Par nom', es: 'Por nombre', de: 'Nach Name', it: 'Per nome', 'zh-CN': '按名称', ja: '名前順' }),
      choice('model', { en: 'Model order', fr: 'Ordre du modèle', es: 'Orden del modelo', de: 'Reihenfolge des Modells', it: 'Ordine del modello', 'zh-CN': '模型顺序', ja: 'モデルの順序' })
    ]
  }),
  parts_color_source: entry<'palette' | 'model'>('palette', 'parts', {
    en: 'Colour of the parts', fr: 'Couleur des parts', es: 'Color de las partes',
    de: 'Farbe der Teile', it: 'Colore delle parti', 'zh-CN': '各部分的颜色', ja: '部分の色'
  }, {
    en: 'The figure’s palette, or the colour each object has in the diagram.',
    fr: 'La palette de la figure, ou la couleur que chaque objet a dans le diagramme.',
    es: 'La paleta de la figura, o el color que cada objeto tiene en el diagrama.',
    de: 'Die Palette der Abbildung oder die Farbe, die jedes Objekt im Diagramm hat.',
    it: 'La tavolozza della figura, o il colore che ogni oggetto ha nel diagramma.',
    'zh-CN': '图形调色板，或各对象在图中的颜色。', ja: '図のパレットか、図中で各オブジェクトが持つ色か。'
  }, {
    kind: 'select',
    choices: [
      choice('palette', { en: 'Figure palette', fr: 'Palette de la figure', es: 'Paleta de la figura', de: 'Palette der Abbildung', it: 'Tavolozza della figura', 'zh-CN': '图形调色板', ja: '図のパレット' }),
      choice('model', { en: 'Colour from the diagram', fr: 'Couleur du diagramme', es: 'Color del diagrama', de: 'Farbe aus dem Diagramm', it: 'Colore del diagramma', 'zh-CN': '图中的颜色', ja: '図の色' })
    ]
  }),
  parts_depth_shading: entry<boolean>(true, 'parts', {
    en: 'Lighten by depth', fr: 'Éclaircir selon la profondeur', es: 'Aclarar según la profundidad',
    de: 'Nach Tiefe aufhellen', it: 'Schiarire in base alla profondità', 'zh-CN': '按层级深浅变化', ja: '深さに応じて明るくする'
  }, {
    en: 'Hue says the branch, lightness says the level.', fr: 'La teinte dit la branche, la clarté dit le niveau.',
    es: 'El tono dice la rama, la claridad dice el nivel.', de: 'Der Farbton nennt den Zweig, die Helligkeit die Ebene.',
    it: 'La tinta dice il ramo, la chiarezza dice il livello.', 'zh-CN': '色相表示分支，明度表示层级。', ja: '色相が枝を、明度が階層を表します。'
  }, { visibleIf: (o) => o['parts_color_source'] !== 'model' }),
  // ── LA HIÉRARCHIE, DESCENDUE SANS PRENDRE UN ANNEAU DE PLUS (demande Julien, 23/09/2026) ───
  //
  // « Je voudrais que la couronne fonctionne comme le sunburst sur la désagrégation des nœuds,
  // mais au lieu de faire une couronne qui s'étend, le faire in place. »
  //
  // Le disque répond déjà à la question — il la répond EN AJOUTANT UN ANNEAU par niveau. Ici on
  // répond dans le MÊME anneau : un secteur déplié disparaît et ses enfants prennent son angle,
  // exactement comme un nœud déplié disparaît du Sankey derrière les siens. La figure montre
  // alors ce que le diagramme montre, au lieu de montrer ce qui existe.
  //
  // TROIS VALEURS, et la première est le dessin d'hier : une couronne enregistrée ne bouge pas.
  //  - 'off'     : un seul cran, les enfants directs de l'axe ;
  //  - 'diagram' : la FRONTIÈRE que le diagramme dessine — on descend sous un nœud déplié, on
  //                s'arrête sous un nœud replié. C'est ce qui fait que cliquer pour déplier
  //                change la couronne comme il change le dessin ;
  //  - 'leaves'  : jusqu'aux feuilles de la hiérarchie, quoi que le diagramme montre.
  parts_hierarchy: entry<'off' | 'diagram' | 'leaves'>('off', 'parts', {
    en: 'Descend the hierarchy', fr: 'Descendre la hiérarchie', es: 'Bajar por la jerarquía',
    de: 'Hierarchie absteigen', it: 'Scendere la gerarchia', 'zh-CN': '按层级下钻', ja: '階層を下る'
  }, {
    en: 'Children replace their parent in the same ring, instead of taking a ring of their own.',
    fr: 'Les enfants remplacent leur parent dans le même anneau, au lieu de prendre un anneau à eux.',
    es: 'Los hijos reemplazan a su padre en el mismo anillo, en vez de ocupar un anillo propio.',
    de: 'Kinder ersetzen ihren Elternknoten im selben Ring, statt einen eigenen Ring zu belegen.',
    it: 'I figli sostituiscono il genitore nello stesso anello, invece di prendersi un anello proprio.',
    'zh-CN': '子节点在同一环内取代父节点，而不是另占一环。',
    ja: '子は親と同じリングの中で親に置き換わり、独立したリングを取りません。'
  }, {
    kind: 'select',
    choices: [
      choice('off', { en: 'One level only', fr: 'Un seul niveau', es: 'Un solo nivel', de: 'Nur eine Ebene', it: 'Un solo livello', 'zh-CN': '仅一层', ja: '1 階層だけ' }),
      choice('diagram', { en: 'As the diagram shows it', fr: 'Comme le diagramme le montre', es: 'Como lo muestra el diagrama', de: 'So wie das Diagramm es zeigt', it: 'Come lo mostra il diagramma', 'zh-CN': '与图中展开状态一致', ja: '図が見せているとおり' }),
      choice('leaves', { en: 'Down to the leaves', fr: 'Jusqu’aux feuilles', es: 'Hasta las hojas', de: 'Bis zu den Blättern', it: 'Fino alle foglie', 'zh-CN': '直到叶节点', ja: '葉まで' })
    ]
  }),
  parts_group_under: entry<number>(0, 'parts', {
    en: 'Group parts under (% of the whole)', fr: 'Regrouper les parts sous (% du tout)',
    es: 'Agrupar las partes por debajo de (% del total)', de: 'Teile zusammenfassen unter (% des Ganzen)',
    it: 'Raggruppare le parti sotto (% del totale)', 'zh-CN': '低于此占比的部分合并（占整体 %）', ja: '全体に対する割合がこの値未満の部分をまとめる（%）'
  }, {
    en: 'Zero only folds what cannot be seen at all. A folded part joins “Others”.',
    fr: 'Zéro ne replie que ce qui ne se voit pas du tout. Une part repliée rejoint « Autres ».',
    es: 'Cero solo pliega lo que no puede verse. Una parte plegada pasa a «Otros».',
    de: 'Null faltet nur, was gar nicht sichtbar ist. Ein gefalteter Teil wandert in „Andere“.',
    it: 'Zero ripiega solo ciò che non si vede affatto. Una parte ripiegata finisce in «Altri».',
    'zh-CN': '设为 0 时只合并完全看不见的部分，合并后归入「其他」。', ja: '0 の場合は見えない分だけをまとめ、「その他」に入ります。'
  }, { kind: 'number', min: 0, max: 25, step: 0.5, advanced: true }),
  parts_max: entry<number>(0, 'parts', {
    en: 'Parts at most', fr: 'Parts au plus', es: 'Partes como máximo', de: 'Höchstens Teile',
    it: 'Parti al massimo', 'zh-CN': '最多显示的部分数', ja: '部分の最大数'
  }, {
    en: 'Beyond that the smallest join “Others”. Zero: no limit.', fr: 'Au-delà, les plus petites rejoignent « Autres ». Zéro : sans limite.',
    es: 'Más allá, las más pequeñas pasan a «Otros». Cero: sin límite.', de: 'Darüber hinaus wandern die kleinsten in „Andere“. Null: ohne Grenze.',
    it: 'Oltre, le più piccole finiscono in «Altri». Zero: senza limite.', 'zh-CN': '超出的最小部分归入「其他」。0 表示不限。', ja: '超えた分の小さい部分は「その他」に入ります。0 は無制限。'
  }, { kind: 'number', min: 0, max: 100, step: 1, advanced: true })
} as const

// ── centre_* : le centre d'une couronne ──────────────────────────────────────────────────────
export const CENTRE_CONFIG = {
  centre_content: entry<'both' | 'name' | 'value' | 'none'>('both', 'centre', {
    en: 'Centre shows', fr: 'Le centre affiche', es: 'El centro muestra', de: 'Die Mitte zeigt',
    it: 'Il centro mostra', 'zh-CN': '中心显示', ja: '中心の表示'
  }, {
    en: 'What is written in the hole of the ring.', fr: 'Ce qui s’écrit dans le trou de la couronne.',
    es: 'Lo que se escribe en el hueco del anillo.', de: 'Was im Loch des Rings steht.',
    it: 'Ciò che si scrive nel foro dell’anello.', 'zh-CN': '环形中心孔内显示的内容。', ja: 'リングの中心に書く内容。'
  }, {
    kind: 'select',
    choices: [
      choice('both', { en: 'Name and value', fr: 'Nom et valeur', es: 'Nombre y valor', de: 'Name und Wert', it: 'Nome e valore', 'zh-CN': '名称与数值', ja: '名前と値' }),
      choice('name', { en: 'Name only', fr: 'Nom seul', es: 'Solo el nombre', de: 'Nur Name', it: 'Solo il nome', 'zh-CN': '仅名称', ja: '名前のみ' }),
      choice('value', { en: 'Value only', fr: 'Valeur seule', es: 'Solo el valor', de: 'Nur Wert', it: 'Solo il valore', 'zh-CN': '仅数值', ja: '値のみ' }),
      choice('none', { en: 'Nothing', fr: 'Rien', es: 'Nada', de: 'Nichts', it: 'Niente', 'zh-CN': '不显示', ja: '表示しない' })
    ]
  }),
  centre_hole: entry<number>(22, 'centre', {
    en: 'Hole size (% of radius)', fr: 'Taille du trou (% du rayon)', es: 'Tamaño del hueco (% del radio)',
    de: 'Lochgröße (% des Radius)', it: 'Dimensione del foro (% del raggio)', 'zh-CN': '中心孔大小（半径 %）', ja: '中心の穴の大きさ（半径の %）'
  }, {
    en: 'The rings share what the hole leaves.', fr: 'Les anneaux se partagent ce que le trou laisse.',
    es: 'Los anillos se reparten lo que deja el hueco.', de: 'Die Ringe teilen sich, was das Loch übrig lässt.',
    it: 'Gli anelli si dividono ciò che il foro lascia.', 'zh-CN': '各环平分中心孔之外的空间。', ja: '穴が残した部分をリングで分け合います。'
  }, { kind: 'number', min: 5, max: 80, step: 1, advanced: true })
} as const

// ── interaction_* : ce que fait un geste sur la figure ───────────────────────────────────────
export const INTERACTION_CONFIG = {
  // Le défaut est DÉPLIER SEULEMENT : le zoom radial — le secteur cliqué passe au centre — a été
  // jugé déroutant (il change ce que la figure montre sans qu'on l'ait demandé) ; il reste là
  // pour qui le veut, sous « Avancé ».
  interaction_click: entry<'both' | 'zoom' | 'aggregate' | 'none'>('aggregate', 'interaction', {
    en: 'Clicking a part', fr: 'Le clic sur une part', es: 'Al hacer clic en una parte',
    de: 'Klick auf einen Teil', it: 'Il clic su una parte', 'zh-CN': '点击某部分时', ja: '部分をクリックすると'
  }, {
    en: 'Zoom stays inside the figure; expanding acts on the diagram.', fr: 'Le zoom reste dans la figure ; déplier agit sur le diagramme.',
    es: 'El zoom se queda en la figura; desplegar actúa sobre el diagrama.', de: 'Zoom bleibt in der Abbildung; Aufklappen wirkt auf das Diagramm.',
    it: 'Lo zoom resta nella figura; espandere agisce sul diagramma.', 'zh-CN': '放大只在图形内；展开会作用于主图。', ja: 'ズームは図の中だけ、展開は図全体に作用します。'
  }, {
    kind: 'select',
    choices: [
      choice('aggregate', { en: 'Expands it in the diagram', fr: 'Le déplie dans le diagramme', es: 'Lo despliega en el diagrama', de: 'Klappt ihn im Diagramm auf', it: 'Lo espande nel diagramma', 'zh-CN': '在图中展开', ja: '図で展開する' }),
      choice('zoom', { en: 'Zooms in only', fr: 'Zoome dedans seulement', es: 'Solo hace zoom', de: 'Zoomt nur hinein', it: 'Ingrandisce soltanto', 'zh-CN': '仅放大', ja: 'ズームのみ' }),
      choice('both', { en: 'Zooms in and expands it in the diagram', fr: 'Zoome dedans et le déplie dans le diagramme', es: 'Hace zoom y lo despliega en el diagrama', de: 'Zoomt hinein und klappt ihn im Diagramm auf', it: 'Ingrandisce e lo espande nel diagramma', 'zh-CN': '放大并在图中展开', ja: 'ズームし、図でも展開する' }),
      choice('none', { en: 'Does nothing', fr: 'Ne fait rien', es: 'No hace nada', de: 'Tut nichts', it: 'Non fa nulla', 'zh-CN': '无操作', ja: '何もしない' })
    ],
    advanced: true
  }),
  interaction_tooltip: entry<boolean>(true, 'interaction', {
    en: 'Tooltip on hover', fr: 'Info-bulle au survol', es: 'Información al pasar el ratón',
    de: 'Tooltip beim Überfahren', it: 'Suggerimento al passaggio', 'zh-CN': '悬停提示', ja: 'ホバー時のツールチップ'
  }, {
    en: 'Name, value and share of each part on hover.', fr: 'Nom, valeur et part de chaque part au survol.',
    es: 'Nombre, valor y proporción de cada parte al pasar el ratón.', de: 'Name, Wert und Anteil jedes Teils beim Überfahren.',
    it: 'Nome, valore e quota di ogni parte al passaggio.', 'zh-CN': '悬停时显示各部分的名称、数值和占比。', ja: 'ホバー時に各部分の名前・値・割合を表示します。'
  })
} as const

// ── notes_* : les mentions d'une figure ──────────────────────────────────────────────────────
export const NOTES_CONFIG = {
  notes_visible: entry<boolean>(true, 'notes', {
    en: 'Show warnings', fr: 'Afficher les avertissements', es: 'Mostrar las advertencias',
    de: 'Warnungen anzeigen', it: 'Mostrare gli avvisi', 'zh-CN': '显示提示', ja: '注意書きを表示'
  }, {
    en: 'Sum of independent roots, parents that do not match their children, truncated depth, parts out of scale.',
    fr: 'Somme de racines indépendantes, parents qui ne bouclent pas, profondeur tronquée, parts hors échelle.',
    es: 'Suma de raíces independientes, padres que no cuadran, profundidad truncada, partes fuera de escala.',
    de: 'Summe unabhängiger Wurzeln, nicht passende Elternknoten, abgeschnittene Tiefe, Teile außerhalb der Skala.',
    it: 'Somma di radici indipendenti, genitori che non quadrano, profondità troncata, parti fuori scala.',
    'zh-CN': '独立根节点之和、与子节点不平衡的父节点、被截断的层级、超出比例的部分。',
    ja: '独立したルートの合計、子と一致しない親、打ち切られた深さ、スケール外の部分。'
  })
} as const

// ── title_* : le titre d'une figure ──────────────────────────────────────────────────────────
// Arbitrage du 18/09 : une figure a un titre comme le diagramme a le sien, et il se règle sous
// le même onglet « Titre » de l'inspecteur. Caché d'usine : aucune figure enregistrée ne change.
// Un texte vide écrit le NOM DU SUJET (le nœud regardé) — c'est ce qu'on veut neuf fois sur dix.
export const TITLE_CONFIG = {
  title_visible: entry<boolean>(false, 'title', {
    en: 'Show a title', fr: 'Afficher un titre', es: 'Mostrar un título',
    de: 'Titel anzeigen', it: 'Mostrare un titolo', 'zh-CN': '显示标题', ja: 'タイトルを表示'
  }, {
    en: 'A title above or below the drawing, inside the figure.', fr: 'Un titre au-dessus ou au-dessous du dessin, dans la figure.',
    es: 'Un título encima o debajo del dibujo, dentro de la figura.', de: 'Ein Titel über oder unter der Zeichnung, innerhalb der Abbildung.',
    it: 'Un titolo sopra o sotto il disegno, dentro la figura.', 'zh-CN': '在图形内部、绘图上方或下方的标题。', ja: '図の内側、描画の上または下に置くタイトル。'
  }),
  title_text: entry<string>('', 'title', {
    en: 'Text', fr: 'Texte', es: 'Texto', de: 'Text', it: 'Testo', 'zh-CN': '文本', ja: 'テキスト'
  }, {
    en: 'Empty: the name of what the figure shows.', fr: 'Vide : le nom de ce que la figure montre.',
    es: 'Vacío: el nombre de lo que muestra la figura.', de: 'Leer: der Name dessen, was die Abbildung zeigt.',
    it: 'Vuoto: il nome di ciò che la figura mostra.', 'zh-CN': '留空则显示图形所展示对象的名称。', ja: '空なら図が示す対象の名前。'
  }, { kind: 'text', visibleIf: (o) => o['title_visible'] === true }),
  title_position: entry<'top' | 'bottom'>('top', 'title', {
    en: 'Position', fr: 'Position', es: 'Posición', de: 'Position', it: 'Posizione', 'zh-CN': '位置', ja: '位置'
  }, {
    en: 'Above or below the drawing.', fr: 'Au-dessus ou au-dessous du dessin.',
    es: 'Encima o debajo del dibujo.', de: 'Über oder unter der Zeichnung.',
    it: 'Sopra o sotto il disegno.', 'zh-CN': '绘图上方或下方。', ja: '描画の上か下か。'
  }, {
    kind: 'select',
    choices: [
      choice('top', { en: 'Above', fr: 'Au-dessus', es: 'Encima', de: 'Oben', it: 'Sopra', 'zh-CN': '上方', ja: '上' }),
      choice('bottom', { en: 'Below', fr: 'Au-dessous', es: 'Debajo', de: 'Unten', it: 'Sotto', 'zh-CN': '下方', ja: '下' })
    ],
    visibleIf: (o) => o['title_visible'] === true
  }),
  title_font_size: entry<number>(14, 'title', {
    en: 'Font size', fr: 'Taille de police', es: 'Tamaño de fuente', de: 'Schriftgröße', it: 'Dimensione del carattere', 'zh-CN': '字号', ja: 'フォントサイズ'
  }, {
    en: 'In pixels.', fr: 'En pixels.', es: 'En píxeles.', de: 'In Pixeln.', it: 'In pixel.', 'zh-CN': '以像素计。', ja: 'ピクセル単位。'
  }, { kind: 'number', min: 8, max: 40, step: 1, visibleIf: (o) => o['title_visible'] === true }),
  title_bold: entry<boolean>(true, 'title', {
    en: 'Bold', fr: 'Gras', es: 'Negrita', de: 'Fett', it: 'Grassetto', 'zh-CN': '加粗', ja: '太字'
  }, {
    en: 'A bold title.', fr: 'Un titre en gras.', es: 'Un título en negrita.', de: 'Ein fetter Titel.',
    it: 'Un titolo in grassetto.', 'zh-CN': '加粗的标题。', ja: '太字のタイトル。'
  }, { visibleIf: (o) => o['title_visible'] === true }),
  // os#1449 — CE QUE LE TITRE DU DIAGRAMME SAVAIT FAIRE ET PAS CELUI D'UNE FIGURE.
  //
  // Le titre du diagramme est une zone de texte : il a une police, une couleur, un alignement, il
  // se met en italique et il revient à la ligne. Celui d'une figure avait cinq réglages et un
  // traceur qui écrivait le reste EN DUR — centré, #2D3748, une ligne coupée aux points de
  // suspension. Les valeurs d'usine ci-dessous sont exactement ce que ce dur écrivait : aucune
  // figure enregistrée ne change d'aspect, et le mot manquant devient réglable.
  title_italic: entry<boolean>(false, 'title', {
    en: 'Italic', fr: 'Italique', es: 'Cursiva', de: 'Kursiv', it: 'Corsivo', 'zh-CN': '斜体', ja: '斜体'
  }, {
    en: 'A title in italics.', fr: 'Un titre en italique.', es: 'Un título en cursiva.',
    de: 'Ein kursiver Titel.', it: 'Un titolo in corsivo.', 'zh-CN': '斜体的标题。', ja: '斜体のタイトル。'
  }, { visibleIf: (o) => o['title_visible'] === true }),
  title_align: entry<'left' | 'middle' | 'right'>('middle', 'title', {
    en: 'Alignment', fr: 'Alignement', es: 'Alineación', de: 'Ausrichtung', it: 'Allineamento',
    'zh-CN': '对齐', ja: '配置'
  }, {
    en: 'Where the text sits on its line.', fr: 'Où le texte se pose sur sa ligne.',
    es: 'Dónde se sitúa el texto en su línea.', de: 'Wo der Text auf seiner Zeile steht.',
    it: 'Dove si colloca il testo sulla sua riga.', 'zh-CN': '文本在行内的位置。',
    ja: '行の中で文字が置かれる位置。'
  }, {
    kind: 'select',
    choices: [
      choice('left', { en: 'Left', fr: 'À gauche', es: 'A la izquierda', de: 'Links', it: 'A sinistra', 'zh-CN': '左对齐', ja: '左' }),
      choice('middle', { en: 'Centred', fr: 'Centré', es: 'Centrado', de: 'Zentriert', it: 'Centrato', 'zh-CN': '居中', ja: '中央' }),
      choice('right', { en: 'Right', fr: 'À droite', es: 'A la derecha', de: 'Rechts', it: 'A destra', 'zh-CN': '右对齐', ja: '右' })
    ],
    visibleIf: (o) => o['title_visible'] === true
  }),
  title_wrap: entry<boolean>(false, 'title', {
    en: 'Wrap the text', fr: 'Revenir à la ligne', es: 'Ajustar el texto',
    de: 'Text umbrechen', it: 'Mandare a capo', 'zh-CN': '自动换行', ja: '折り返す'
  }, {
    en: 'Otherwise a long title is cut with an ellipsis, on one line.',
    fr: 'Sinon un titre long est coupé par des points de suspension, sur une seule ligne.',
    es: 'De lo contrario, un título largo se corta con puntos suspensivos, en una sola línea.',
    de: 'Sonst wird ein langer Titel einzeilig mit Auslassungspunkten abgeschnitten.',
    it: 'Altrimenti un titolo lungo viene troncato con i puntini, su una sola riga.',
    'zh-CN': '否则较长的标题会在一行内以省略号截断。',
    ja: '折り返さない場合、長いタイトルは一行で省略記号により切り詰められます。'
  }, { visibleIf: (o) => o['title_visible'] === true }),
  title_font_family: entry<string>('', 'title', {
    en: 'Font', fr: 'Police', es: 'Fuente', de: 'Schriftart', it: 'Carattere', 'zh-CN': '字体', ja: 'フォント'
  }, {
    en: 'Empty: the font of the page.', fr: 'Vide : la police de la page.',
    es: 'Vacío: la fuente de la página.', de: 'Leer: die Schriftart der Seite.',
    it: 'Vuoto: il carattere della pagina.', 'zh-CN': '留空则使用页面字体。', ja: '空ならページのフォント。'
  }, {
    kind: 'select',
    choicesOf: () => [
      { value: '', label: '—' },
      ...font_families.map(f => ({ value: f, label: f.split(',')[0] }))
    ],
    advanced: true,
    visibleIf: (o) => o['title_visible'] === true
  }),
  title_color: entry<string>('#2D3748', 'title', {
    en: 'Colour', fr: 'Couleur', es: 'Color', de: 'Farbe', it: 'Colore', 'zh-CN': '颜色', ja: '色'
  }, {
    en: 'Colour of the title text.', fr: 'Couleur du texte du titre.',
    es: 'Color del texto del título.', de: 'Farbe des Titeltextes.',
    it: 'Colore del testo del titolo.', 'zh-CN': '标题文字的颜色。', ja: 'タイトル文字の色。'
  }, { kind: 'color', advanced: true, visibleIf: (o) => o['title_visible'] === true })
} as const

// ── label_positions : LES ÉTIQUETTES DÉPOSÉES À LA MAIN ──────────────────────────────────────
// os#1467 — REMONTÉE ICI DEPUIS LE SUNBURST, qui la déclarait chez lui. Depuis que la couronne et
// les barres sortent aussi leurs étiquettes (os#1463), trois natures en ont besoin : une clé que
// chacune redéclarerait serait trois clés, et le sac d une figure convertie d une nature à l autre
// perdrait ses positions au passage.
//
// Un dépôt, pas un réglage : la souris est son interface (d où `kind: none`), et sa sorte est
// 'identity' chez qui l honore — la position d une étiquette de CETTE figure n a pas d homologue
// sur une autre, ni sa place dans un style.
export const PLACED_LABELS_CONFIG = {
  label_positions: entry<unknown>(undefined, 'title', {
    en: 'Placed labels', fr: 'Étiquettes posées', es: 'Etiquetas colocadas',
    de: 'Platzierte Beschriftungen', it: 'Etichette posizionate', 'zh-CN': '已放置的标签',
    ja: '配置したラベル'
  }, {
    en: 'Where the author dragged each label that left the drawing.',
    fr: 'Où l’auteur a déposé chaque étiquette sortie du dessin.',
    es: 'Dónde ha colocado el autor cada etiqueta que salió del dibujo.',
    de: 'Wohin der Autor jede aus der Zeichnung herausgezogene Beschriftung gelegt hat.',
    it: 'Dove l’autore ha posato ogni etichetta uscita dal disegno.',
    'zh-CN': '作者把每个移出绘图的标签放在何处。',
    ja: '描画の外に出した各ラベルを作成者が置いた位置。'
  }, { kind: 'none' })
} as const

// ── text_zones : LES TEXTES QUE L'AUTEUR AJOUTE À UNE FIGURE ─────────────────────────────────
// os#1449, demande de Julien du 20/09 : « elles devraient pouvoir avoir aussi des zones de texte
// et autres éléments additionnels ». Une LISTE et non des clés numérotées — leur nombre n'est pas
// connu d'avance —, sur le patron de `label_positions` : un dépôt que la figure porte, sans
// contrôle champ à champ (d'où `kind: 'none'`). Le titre est la zone n° 0, décrite par `title_*`
// ci-dessus ; celles-ci sont les suivantes, et elles portent leur description en entier.
export const TEXTS_CONFIG = {
  text_zones: entry<unknown[]>([], 'title', {
    en: 'Text zones', fr: 'Zones de texte', es: 'Zonas de texto', de: 'Textbereiche',
    it: 'Zone di testo', 'zh-CN': '文本区域', ja: 'テキスト領域'
  }, {
    en: 'Text blocks the author adds above or below the drawing.',
    fr: 'Les blocs de texte que l’auteur ajoute au-dessus ou au-dessous du dessin.',
    es: 'Los bloques de texto que el autor añade encima o debajo del dibujo.',
    de: 'Textblöcke, die der Autor über oder unter der Zeichnung hinzufügt.',
    it: 'I blocchi di testo che l’autore aggiunge sopra o sotto il disegno.',
    'zh-CN': '作者在绘图上方或下方添加的文本块。',
    ja: '作成者が描画の上または下に追加するテキストの塊。'
  }, { kind: 'none' })
} as const

// ── scale_* : l'échelle d'une figure dans sa vignette ────────────────────────────────────────
// Arbitrage du 18/09 : un facteur en % de la place disponible, dès ce lot. Le diagramme, lui, a
// `user_scale` ; les deux se rapprocheront au lot 4.
export const SCALE_CONFIG = {
  scale_factor: entry<number>(100, 'scale', {
    en: 'Scale (% of the frame)', fr: 'Échelle (% du cadre)', es: 'Escala (% del marco)',
    de: 'Maßstab (% des Rahmens)', it: 'Scala (% del riquadro)', 'zh-CN': '缩放（占框架 %）', ja: '拡大率（枠に対する %）'
  }, {
    en: 'How much of the available room the drawing takes: 100 fills it, 50 leaves it half empty.',
    fr: 'La part de la place disponible que prend le dessin : 100 la remplit, 50 la laisse à moitié vide.',
    es: 'Qué parte del espacio disponible ocupa el dibujo: 100 lo llena, 50 lo deja medio vacío.',
    de: 'Wie viel des verfügbaren Raums die Zeichnung einnimmt: 100 füllt ihn, 50 lässt ihn halb leer.',
    it: 'Quanta parte dello spazio disponibile prende il disegno: 100 lo riempie, 50 lo lascia mezzo vuoto.',
    'zh-CN': '图形占可用空间的比例：100 填满，50 留一半空白。', ja: '利用できる領域のうち図が占める割合。100 で一杯、50 で半分。'
  }, { kind: 'number', min: 10, max: 100, step: 5 })
} as const

// ── Ce que les figures AJOUTENT aux familles d'étiquettes des éléments ───────────────────────
// Sous les préfixes `name_label_` / `value_label_` pour rejoindre les onglets Libellé et Valeur
// (cf. figureControls, `familyOfKey`), mais déclarés ICI et non dans BASE_LABEL_CONFIG : un nœud
// n'a pas d'étiquette radiale, et un flux dit déjà son pourcentage par `value_label_unit_type`
// (`%IS`, `%OS`, `%ID`…). Une figure, elle, n'a ni source ni destination.
export const FIGURE_LABEL_CONFIG = {
  name_label_orientation: entry<'radial' | 'tangential' | 'horizontal'>('radial', 'name_label', {
    en: 'Label orientation', fr: 'Orientation des étiquettes', es: 'Orientación de las etiquetas',
    de: 'Ausrichtung der Beschriftungen', it: 'Orientamento delle etichette', 'zh-CN': '标签方向', ja: 'ラベルの向き'
  }, {
    en: 'How a label runs inside its part.', fr: 'Comment une étiquette court dans sa part.',
    es: 'Cómo corre una etiqueta dentro de su parte.', de: 'Wie eine Beschriftung in ihrem Teil verläuft.',
    it: 'Come corre un’etichetta nella sua parte.', 'zh-CN': '标签在其所属部分中的走向。', ja: 'ラベルが部分の中でどの向きに並ぶか。'
  }, {
    kind: 'select',
    choices: [
      choice('radial', { en: 'Radial', fr: 'Radiale', es: 'Radial', de: 'Radial', it: 'Radiale', 'zh-CN': '径向', ja: '放射方向' }),
      choice('tangential', { en: 'Along the arc', fr: 'Le long de l’arc', es: 'A lo largo del arco', de: 'Entlang des Bogens', it: 'Lungo l’arco', 'zh-CN': '沿弧线', ja: '弧に沿って' }),
      choice('horizontal', { en: 'Horizontal', fr: 'Horizontale', es: 'Horizontal', de: 'Waagerecht', it: 'Orizzontale', 'zh-CN': '水平', ja: '水平' })
    ]
  }),
  name_label_strip_parent: entry<boolean>(false, 'name_label', {
    en: 'Drop what the previous ring says', fr: 'Ôter ce que l’anneau précédent dit déjà', es: 'Quitar lo que ya dice el anillo anterior',
    de: 'Weglassen, was der vorige Ring schon sagt', it: 'Togliere ciò che l’anello precedente dice già', 'zh-CN': '省略上一环已写的部分', ja: '前の環がすでに示す語を省く'
  }, {
    en: 'Under “Maize”, “Maize Organic” reads “Organic”: the parent’s name is removed from the start or end of the part’s name.',
    fr: 'Sous « Maïs », « Maïs Bio » s’écrit « Bio » : le nom du parent est ôté du début ou de la fin du nom de la part.',
    es: 'Bajo «Maíz», «Maíz Bio» se escribe «Bio»: el nombre del padre se quita del inicio o del final del nombre de la parte.',
    de: 'Unter „Mais“ wird „Mais Bio“ zu „Bio“: der Name des Elternteils wird am Anfang oder Ende des Teilnamens entfernt.',
    it: 'Sotto «Mais», «Mais Bio» si scrive «Bio»: il nome del genitore è tolto dall’inizio o dalla fine del nome della parte.',
    'zh-CN': '在“玉米”之下，“玉米 有机”写作“有机”：从部分名称的开头或末尾去掉父级名称。',
    ja: '「トウモロコシ」の下では「トウモロコシ 有機」が「有機」になります。部分名の先頭または末尾から親の名前を除きます。'
  }),
  name_label_callout: entry<boolean>(false, 'name_label', {
    en: 'Labels that do not fit: outside, with a line', fr: 'Étiquettes qui ne tiennent pas : dehors, reliées d’un trait',
    es: 'Etiquetas que no caben: fuera, unidas por una línea', de: 'Beschriftungen ohne Platz: außen, mit Linie',
    it: 'Etichette che non entrano: fuori, collegate da una linea', 'zh-CN': '放不下的标签：移到外部并用线连接', ja: '収まらないラベルは外に出して線で結ぶ'
  }, {
    en: 'A label its part cannot hold is placed outside the disc, linked to the part by a line. Drag it to place it where you want.',
    fr: 'Une étiquette que sa part ne peut pas tenir est posée hors du disque, reliée à la part par un trait. Glissez-la pour la placer où vous voulez.',
    es: 'Una etiqueta que su parte no puede contener se coloca fuera del disco, unida a la parte por una línea. Arrástrela para colocarla donde quiera.',
    de: 'Eine Beschriftung, die nicht in ihren Teil passt, wird außerhalb der Scheibe platziert und mit einer Linie verbunden. Ziehen Sie sie an den gewünschten Ort.',
    it: 'Un’etichetta che la sua parte non può contenere è posta fuori dal disco, collegata alla parte da una linea. Trascinala dove vuoi.',
    'zh-CN': '部分放不下的标签会放到圆盘外，并用线连到该部分。拖动即可放到想要的位置。',
    ja: '部分に収まらないラベルは円盤の外に置かれ、線で部分と結ばれます。ドラッグして好きな位置へ。'
  }),
  name_label_follow_diagram: entry<boolean>(true, 'name_label', {
    en: 'Name as the diagram names it', fr: 'Nom tel que le diagramme le nomme', es: 'Nombre tal como lo nombra el diagrama',
    de: 'Name, wie das Diagramm ihn nennt', it: 'Nome come lo nomina il diagramma', 'zh-CN': '与图中名称一致', ja: '図と同じ名前を使う'
  }, {
    en: 'Template, tag or ancestor — or, unchecked, the object’s own name.', fr: 'Gabarit, étiquette ou ancêtre — ou, décoché, le nom propre de l’objet.',
    es: 'Plantilla, etiqueta o ancestro — o, desmarcado, el nombre propio del objeto.', de: 'Vorlage, Tag oder Vorfahr — oder, abgewählt, der eigene Name des Objekts.',
    it: 'Modello, etichetta o antenato — o, deselezionato, il nome proprio dell’oggetto.', 'zh-CN': '模板、标签或上级；取消勾选则用对象自身名称。', ja: 'テンプレート・タグ・上位ノードによる名前。外すとオブジェクト自身の名前。'
  }, { advanced: true }),
  name_label_contrast_color: entry<boolean>(true, 'name_label', {
    en: 'Ink by contrast', fr: 'Encre par contraste', es: 'Tinta por contraste',
    de: 'Schriftfarbe nach Kontrast', it: 'Inchiostro per contrasto', 'zh-CN': '按对比度自动选色', ja: 'コントラストで文字色を決める'
  }, {
    en: 'White on a dark part, dark on a light one. Unchecked: the label colour.', fr: 'Blanc sur une part sombre, sombre sur une claire. Décoché : la couleur des étiquettes.',
    es: 'Blanco sobre una parte oscura, oscuro sobre una clara. Desmarcado: el color de las etiquetas.', de: 'Weiß auf dunklem Teil, dunkel auf hellem. Abgewählt: die Beschriftungsfarbe.',
    it: 'Bianco su una parte scura, scuro su una chiara. Deselezionato: il colore delle etichette.', 'zh-CN': '深色部分用白字，浅色部分用深字；取消则用标签颜色。', ja: '暗い部分は白、明るい部分は暗い文字。外すとラベルの色。'
  }, { advanced: true }),
  value_label_percent: entry<'none' | 'total' | 'parent'>('none', 'value_label', {
    en: 'Show a percentage', fr: 'Afficher un pourcentage', es: 'Mostrar un porcentaje',
    de: 'Prozentsatz anzeigen', it: 'Mostrare una percentuale', 'zh-CN': '显示百分比', ja: '割合を表示'
  }, {
    en: 'Of the whole figure, or of the part that contains this one.', fr: 'Du tout de la figure, ou de la part qui contient celle-ci.',
    es: 'Del total de la figura, o de la parte que contiene a esta.', de: 'Vom Ganzen der Abbildung oder vom Teil, der diesen enthält.',
    it: 'Del totale della figura, o della parte che contiene questa.', 'zh-CN': '相对于整个图形，或相对于包含它的上级部分。', ja: '図全体に対してか、それを含む部分に対してか。'
  }, {
    kind: 'select',
    choices: [
      choice('none', { en: 'None', fr: 'Aucun', es: 'Ninguno', de: 'Keiner', it: 'Nessuna', 'zh-CN': '不显示', ja: '表示しない' }),
      choice('total', { en: 'Of the whole', fr: 'Du tout', es: 'Del total', de: 'Vom Ganzen', it: 'Del totale', 'zh-CN': '占整体', ja: '全体に対して' }),
      choice('parent', { en: 'Of its parent', fr: 'De son parent', es: 'De su padre', de: 'Vom Elternteil', it: 'Del suo genitore', 'zh-CN': '占父级', ja: '親に対して' })
    ]
  })
} as const

/** Le contrôle des clés d'ÉLÉMENT qui en demandent un que leur type ne dit pas. */
const ELEMENT_CONTROLS: { [key: string]: Type_FigureControl } = {
  name_label_font_family: {
    kind: 'select',
    choicesOf: () => font_families.map(f => ({ value: f, label: f.split(',')[0] }))
  },
  name_label_color: { kind: 'color' },
  shape_border_color: { kind: 'color' },
  shape_color: { kind: 'color' },
  name_label_font_size: { kind: 'number', min: 4, max: 48, step: 1 },
  name_label_box_width: { kind: 'number', min: 20, max: 600, step: 10 },
  name_label_separator_part: {
    kind: 'select',
    choices: [
      choice('before', { en: 'Keep what is before', fr: 'Garder ce qui est avant', es: 'Conservar lo anterior', de: 'Behalten, was davor steht', it: 'Tenere ciò che precede', 'zh-CN': '保留分隔符之前', ja: '区切りの前を残す' }),
      choice('after', { en: 'Keep what is after', fr: 'Garder ce qui est après', es: 'Conservar lo posterior', de: 'Behalten, was danach steht', it: 'Tenere ciò che segue', 'zh-CN': '保留分隔符之后', ja: '区切りの後を残す' })
    ]
  },
  value_label_font_size: { kind: 'number', min: 4, max: 48, step: 1 },
  value_label_nb_significant_digits: { kind: 'number', min: 1, max: 12, step: 1 },
  value_label_nb_digit: { kind: 'number', min: 0, max: 12, step: 1 },
  shape_opacity: { kind: 'number', min: 0, max: 1, step: 0.05 },
  shape_border_thickness: { kind: 'number', min: 0, max: 8, step: 0.5 }
}

/**
 * LE CATALOGUE : tout celui des éléments, complété des familles des figures. Les clés d'élément
 * qui ont besoin d'un contrôle que leur type ne dit pas (une police, une couleur) le reçoivent
 * ici, une fois.
 */
export const FIGURE_ATTRIBUTES_CONFIG: { [key: string]: Type_FigureCatalogueEntry } = {
  ...Object.fromEntries(
    Object.entries(ALL_ATTRIBUTES_CONFIG as { [key: string]: AttributeConfig<unknown> })
      .map(([key, cfg]) => [key, { ...cfg, ui: ELEMENT_CONTROLS[key] }])
  ),
  ...LEGEND_CONFIG,
  ...PARTS_CONFIG,
  ...CENTRE_CONFIG,
  ...INTERACTION_CONFIG,
  ...NOTES_CONFIG,
  ...TITLE_CONFIG,
  ...TEXTS_CONFIG,
  ...SCALE_CONFIG,
  ...FIGURE_LABEL_CONFIG,
  ...PLACED_LABELS_CONFIG
}
