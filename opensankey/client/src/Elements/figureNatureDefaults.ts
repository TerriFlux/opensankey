// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2026 TerriFlux
// ==================================================================================================
// Author        : TerriFlux
// ==================================================================================================

// os#1501 — CE QU'UNE FIGURE FAIT QUAND SON STYLE NE DIT RIEN.
//
// Julien, capture à l'appui, dans la cascade de styles d'une couronne : « quand je sélectionne la
// couronne et je vais sur Valeur, ce ne sont pas les mêmes choses qui sont sélectionnées dans la
// config que celles qui sont affichées — par exemple Valeur n'est pas mis en ON dans config. Si je
// manipule ensuite ça se synchronise, mais pas au début. » Puis : « même le style pour les
// couronnes ne reflète pas le dessin ».
//
// ⚠️ UN STYLE RÉPOND TOUJOURS, ET C'EST LE PIÈGE. `Class_ElementStyle` porte TOUS les attributs du
// catalogue : interrogé sur une clé qu'il ne règle pas, il ne rend pas `undefined` mais la VALEUR
// D'USINE D'UN ÉLÉMENT — `value_label_is_visible` vaut donc `false`, parce qu'un nœud n'écrit pas
// sa valeur par défaut. Une couronne, elle, l'écrit (os#1489). L'inspecteur montrait donc `false`
// pendant que le dessin montrait la valeur, et les deux se « synchronisaient » au premier geste —
// parce qu'écrire la clé la rend enfin explicite des deux côtés.
//
// CE MODULE N'IMPORTE RIEN, ET C'EST DÉLIBÉRÉ : il est lu par le catalogue des attributs
// (`Elements`) et écrit par l'enregistrement des natures (`Representations`), deux couches que
// tout import croisé mettrait en cycle. Il ne porte qu'une table et deux fonctions.

/**
 * LES STYLES DE PART, ET LA FIGURE QUE CHACUN SERT.
 *
 * Quatre, et ils sont nommés : l'étage générique — servi aux trois natures, donc sans figure — et
 * un par nature (os#1462, `figure_part_nature_styles`).
 *
 * ⚠️ LES NOMS SONT RECOPIÉS DEPUIS `ElementStyle`, et un test tient les deux listes ensemble :
 * l'importer d'ici refermerait le cycle Element ↔ ElementsAttributesConfig.
 */
const PART_STYLE_NATURES: { readonly [style_id: string]: string } = {
  FigurePartStyle: '',
  DonutPartStyle: 'donut',
  BarPartStyle: 'bars',
  SunburstPartStyle: 'sunburst'
}

/**
 * La figure dont cet objet est le style — `''` pour l'étage générique, `null` si ce n'est pas un
 * style de part (un style de nœud, un élément, n'importe quoi d'autre).
 */
export const partStyleFigureNature = (el: unknown): string | null => {
  const id = (typeof el === 'object' && el !== null)
    ? (el as { [k: string]: unknown })['id']
    : undefined
  if (typeof id !== 'string') return null
  return id in PART_STYLE_NATURES ? PART_STYLE_NATURES[id] : null
}

/** Les valeurs d'usine déclarées, par nature de figure puis par clé. */
const _defaults: { [nature: string]: { [key: string]: unknown } } = {}

/**
 * CE QUE LA NATURE DÉCLARE, retenu au moment où elle s'enregistre.
 *
 * Appelé par `registerFigureNature` : une nature de plus est couverte le jour où on l'écrit, sans
 * que personne ait à penser à ce module. C'est la même discipline que le semis des styles.
 */
export const rememberFigureNatureDefaults = (
  nature: string,
  attributes: { [key: string]: { default?: unknown } }
): void => {
  if (!nature) return
  const bag: { [key: string]: unknown } = {}
  Object.entries(attributes).forEach(([key, attr]) => { bag[key] = attr.default })
  _defaults[nature] = bag
}

/** La valeur d'usine de cette nature pour cette clé, ou `undefined` si elle n'en déclare pas. */
export const figureNatureDefault = (nature: string, key: string): unknown =>
  nature ? _defaults[nature]?.[key] : undefined

/**
 * os#1502 — ET LA PART ELLE-MÊME, pour la même raison, dans l'autre sens.
 *
 * Julien, deux captures côte à côte : « le style a bien Valeur visible, mais si je vais sur la
 * PART elle-même, elle n'a pas Valeur visible — or elle devrait l'avoir puisque le style le dit,
 * et ce n'est pas une surcharge ».
 *
 * Une part résout ses attributs comme un élément : sa surcharge, ses styles, puis la valeur
 * d'usine d'un ÉLÉMENT. Ce dernier étage est le mauvais — ce que fait une part quand personne ne
 * dit rien, c'est ce que sa FIGURE fait. Le panneau montrait donc `false` pendant que le secteur
 * écrivait sa valeur.
 *
 * ⚠️ UN STYLE QUI PORTE LA CLÉ EXPLICITEMENT GAGNE, et c'est ce qui rend la règle sûre : le défaut
 * de nature n'arrive qu'en dernier, exactement là où la valeur d'usine d'élément arrivait.
 */
const figurePartElementDefault = (el: unknown, key: string): unknown => {
  const rec = (typeof el === 'object' && el !== null) ? el as { [k: string]: unknown } : null
  if (!rec || rec['is_figure_part'] !== true) return undefined
  const nature = typeof rec['figure_nature'] === 'string' ? rec['figure_nature'] as string : ''
  if (!nature) return undefined
  // LA PORTE DU TRACE, ET PAS UNE AUTRE : `Class_PartElement.isAttributeOverloaded` est exactement
  // ce que `partAspect` interroge pour savoir si la part DIT quelque chose — son sac propre, ou un
  // style CUSTOM (jamais le style par defaut, pre-rempli des valeurs d'usine d'un noeud, ni une
  // amorce). Poser la meme question ici fait converger le panneau et le dessin par construction :
  // ils ne peuvent plus repondre differemment sans que ce soit un vrai desaccord.
  const said = rec['isAttributeOverloaded']
  if (typeof said !== 'function') return undefined
  if ((said as (k: string) => boolean).call(el, key)) return undefined
  // CE QUE LA FIGURE A STAMPÉ SUR SES PARTS, quand la réponse dépend du dessin en cours.
  const stamped = figureStampedDefault(rec, key)
  if (stamped !== undefined) return stamped
  // LA DÉCLARATION DE LA FIGURE D'ABORD : elle seule peut dire qu'une couronne écrit sa valeur.
  const declared = figureNatureDefault(nature, key)
  if (declared !== undefined) return declared
  // 25/09/2026 — PUIS LE RÉGLAGE DE LA FIGURE LUI-MÊME, et c'est la règle GÉNÉRALE du lot.
  return figureStyleSaysFor(rec, key) ?? PART_DRAWING_DEFAULTS[nature]?.[key]
    ?? PART_DRAWING_DEFAULTS['']?.[key]
}

/**
 * 25/09/2026 — CE QUE LA FIGURE RÈGLE POUR TOUTES SES PARTS, SANS AUCUNE TABLE.
 *
 * LA RÈGLE, en une phrase : quand une part ne dit rien d'une clé que la FIGURE règle, ce qui est
 * dessiné est le réglage de la figure — donc c'est lui que le panneau doit annoncer.
 *
 * Elle vaut pour toute clé que `Type_FigureChartStyle` porte, et elle les porte sous LE MÊME NOM
 * que le catalogue des éléments (`name_label_font_size`, `value_label_is_visible`, …). Il n'y a
 * donc rien à déclarer et rien à tenir à jour : une clé ajoutée au style d'une figure est couverte
 * le jour où on l'écrit. C'est ce qui distingue cette règle des trois tables qui l'ont précédée —
 * elles nommaient les clés une par une, et chacune en oubliait.
 *
 * Mesuré : une barre s'écrit en 10 points (`BARS_STYLE_DEFAULTS`), une couronne en 11, et le
 * catalogue d'un NŒUD dit 11. Le panneau d'une barre annonçait donc 11 devant un dessin en 10.
 *
 * ⚠️ LA CHAÎNE VIDE N'EST PAS UNE VALEUR, c'est le marqueur « le tracé décide » du style d'une
 * figure (`name_label_font_family: ''`, `name_label_color: ''`). L'annoncer viderait le sélecteur
 * de police et le carré de couleur du panneau, ce qui serait un second mensonge à la place du
 * premier. On la laisse passer, et la clé retombe sur les tables ci-dessous ou sur le catalogue.
 */
const figureStyleSaysFor = (rec: { [k: string]: unknown }, key: string): unknown => {
  const style = rec['figure_style']
  if (typeof style !== 'object' || style === null) return undefined
  const value = (style as { [k: string]: unknown })[key]
  return value === '' ? undefined : value
}

/**
 * CE QUE LE TRACÉ D'UNE NATURE FAIT, là où ni la figure ni son catalogue ne le disent.
 *
 * La clé `''` vaut pour TOUTES les natures : elle dit ce que les tracés font tous pareil.
 *
 * ⚠️ CE N'EST PAS UNE LISTE DE RATTRAPAGE, et elle doit rester courte : une entrée ici est l'aveu
 * qu'un tracé décide quelque chose que personne ne peut lire ailleurs. La bonne place d'un réglage
 * est le style de la figure (ci-dessus, sans table) ou sa déclaration de nature.
 */
const PART_DRAWING_DEFAULTS: { readonly [nature: string]: { readonly [key: string]: unknown } } = {
  // os#1504 — LE CARTOUCHE NE SE PEINT PAS SANS QU'ON LE DEMANDE, et le panneau doit le dire.
  //
  // Julien : « le fond est sélectionné alors qu'on ne le voit pas ». `name_label_background_visible`
  // vaut VRAI au catalogue des éléments — un nœud qui affiche son cartouche l'affiche. Une part,
  // non : `drawFigureLabelBackground` ne peint que ce qu'elle DEMANDE (os#1468).
  '': {
    name_label_background_visible: false,
    value_label_background_visible: false
  },
  // 25/09/2026 — L'ORIENTATION D'UN LIBELLÉ DE COURONNE, ARBITRÉE PAR JULIEN.
  //
  // « Le défaut pour le libellé, il faut que ce soit horizontale avec un retour à la ligne
  // (utiliser la largeur) ; le truc en diagonale c'est trop moche. »
  //
  // C'est déjà ce que le tracé en place DESSINE — `arcLabelTransform` ne tourne que sur 'radial' ou
  // 'tangential' — pendant que le catalogue des éléments dit 'radial', parce qu'un disque, lui,
  // couche son texte le long du rayon. Le panneau annonçait donc « Radiale » au-dessus d'un texte
  // droit. Déclarer ici ne change aucun dessin : ça met le panneau d'accord avec lui.
  donut: {
    name_label_orientation: 'horizontal'
  },
  // Le disque, lui, tourne vraiment : c'est son défaut de tracé depuis toujours
  // (`SUNBURST_STYLE_DEFAULTS.label_orientation`), et un anneau étroit ne se lit pas autrement.
  sunburst: {
    name_label_orientation: 'radial'
  }
}

/**
 * CE QUE LA FIGURE A STAMPÉ, pour les clés dont la réponse dépend du DESSIN EN COURS.
 *
 * Deux clés à ce jour, et le même procédé pour les deux : la figure pose sur ses parts, au câblage
 * (`figurePartsWiring`), ce qu'elle est en train de faire ; on le relit ici. Ni la déclaration de la
 * nature — qui est une constante — ni la table neutre — qui l'est aussi — ne peuvent répondre à une
 * question dont la réponse change avec les données.
 *
 * ⚠️ LA TABLE NEUTRE NE SUFFIT PAS, et c'est ce qui justifie ce second étage : « sept barres OU un
 * libellé de plus de huit caractères » n'est pas une valeur, c'est une RÈGLE. Deux histogrammes du
 * même document répondent différemment.
 */
const figureStampedDefault = (rec: { [k: string]: unknown }, key: string): unknown => {
  // os#1503 — L'UNITÉ D'UNE PART SE LIT SUR CE QUE LA FIGURE ÉCRIT, et non au catalogue.
  //
  // `value_label_part_unit` est une clé d'ÉLÉMENT : la figure ne la déclare pas, donc le défaut de
  // nature n'a rien à en dire et l'inspecteur retombait sur celui d'un nœud — « Valeur », pendant
  // que la couronne dessinait des pourcentages. Ce que la figure fait est pourtant connu : c'est
  // son `value_label_percent`, stampé sur la part au câblage.
  if (key === 'value_label_part_unit') return partUnitOfPercent(rec['figure_value_percent'])
  // 24/09/2026 — L'ANGLE QUE LE TRACÉ VA DONNER À CETTE ÉTIQUETTE.
  //
  // Julien, l'ayant vu à l'écran : « au début le texte est en diagonal alors que les angles sont
  // mis à 0. Si on édite ça marche, mais au début ça ne correspond pas. »
  //
  // Il a raison mot pour mot, et c'est le défaut d'os#1505 : le repli `autoBarLabelAngle` vit dans
  // le TRACÉ, qui l'applique quand la part ne dit rien. Le panneau, lui, n'en savait rien et
  // retombait sur la valeur d'usine d'un nœud — zéro. Le champ annonçait donc l'inverse du dessin,
  // et les deux se « synchronisaient » au premier geste : écrire la clé la rend explicite des deux
  // côtés. C'est EXACTEMENT le défaut d'os#1501, une famille plus loin.
  if (key === 'name_label_text_angle') return rec['figure_name_label_angle']
  return undefined
}

/** Le choix du sélecteur d'unité qui correspond au pourcentage que la figure écrit. */
const partUnitOfPercent = (percent: unknown): string | undefined => {
  if (percent === 'total') return 'percent_total'
  if (percent === 'parent') return 'percent_parent'
  if (percent === 'none') return 'value'
  return undefined
}

/**
 * CE QUE MONTRE UN CHAMP D'INSPECTEUR QUAND IL ÉDITE UN STYLE DE PART QUI NE DIT RIEN.
 *
 * `undefined` dans tous les autres cas — le lecteur garde alors la règle d'avant, et aucun autre
 * élément ne change de comportement.
 *
 * LE STYLE GÉNÉRIQUE N'A PAS DE FIGURE : il sert les trois natures, et leurs défauts diffèrent.
 * Montrer celui d'une seule serait mentir sur deux — il garde donc la valeur d'usine d'élément,
 * qui est ce que la cascade rendra faute de mieux.
 */
export const figureStyleDefault = (el: unknown, key: string): unknown => {
  // os#1502 — LA PART ET SON STYLE POSENT LA MÊME QUESTION, et reçoivent la même réponse.
  const on_part = figurePartElementDefault(el, key)
  if (on_part !== undefined) return on_part
  const nature = partStyleFigureNature(el)
  if (nature === null) return undefined
  const explicit = (el as { isAttributeExplicit?: (k: string) => boolean }).isAttributeExplicit
  if (typeof explicit === 'function' && explicit.call(el, key)) return undefined
  // CE QUE LA FIGURE A STAMPÉ SUR SON STYLE, au câblage, comme sur ses parts.
  const stamped = figureStampedDefault(el as { [k: string]: unknown }, key)
  if (stamped !== undefined) return stamped
  // LE STYLE GÉNÉRIQUE N'A PAS DE FIGURE : il sert les trois natures, et ce qu'elles déclarent
  // diffère. On ne lui montre donc AUCUNE déclaration de nature — mais la table neutre, elle, ne
  // dépend d'aucune nature : elle dit ce que le tracé fait, et il le fait dans les trois.
  const declared = nature !== '' ? figureNatureDefault(nature, key) : undefined
  if (declared !== undefined) return declared
  // 24/09/2026 — ET LES MÊMES REPLIS QUE POUR UNE PART, ce qui manquait à os#1504.
  //
  // Julien : « pareil pour le fond, on a l'impression que ce n'est pas initialisé correctement — il
  // est montré ON alors qu'il est dessiné OFF ».
  //
  // La règle ne valait que pour une PART : son style répondait donc `true` là où elle répondait
  // `false`. Or les deux panneaux montrent le même réglage du même dessin — c'est la divergence
  // qu'os#1501 avait fermée dans l'autre sens, rouverte ici par une branche oubliée.
  return figureStyleSaysFor(el as { [k: string]: unknown }, key)
    ?? PART_DRAWING_DEFAULTS[nature]?.[key]
    ?? PART_DRAWING_DEFAULTS['']?.[key]
}
