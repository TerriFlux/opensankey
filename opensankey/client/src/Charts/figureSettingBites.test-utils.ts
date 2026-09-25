// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2026 TerriFlux
// ==================================================================================================
// Author        : Julien Alapetite for TerriFlux
// ==================================================================================================

// os#1481 — EST-CE QUE CE RÉGLAGE MORD SUR LE DESSIN ? La question posée à TOUS, d'un coup.
//
// ⚠️ CE FICHIER N'EST PAS DU CODE DE PRODUIT (cf. son suffixe `.test-utils`).
//
// Julien, après avoir listé cinq réglages inertes sur une couronne :
//
//   « On repart comme d'hab, où je te dis les choses une par une, au lieu de faire en sorte que ce
//   soit une méthode systématique pour faire tout d'un coup juste. C'est comme si tu ne vérifiais
//   pas que les attributs existants et visibles ont un code correspondant sur la figure concernée.
//   Et vice versa, que tous les codes de dessin ont un attribut visible pour les activer. C'est
//   pourtant à ce genre de choses que tu es fort. »
//
// Il a raison, et la critique porte sur la MÉTHODE, pas sur les cinq défauts. J'avais un audit —
// `notes/figures/attributs-un-par-un.md` — qui disait déjà que la moitié de ces clés n'était pas
// dessinée. Mais c'était un fichier TEXTE : il ne rougit jamais, il vieillit, et il se lit le jour
// où on pense à l'ouvrir. Une liste tenue à la main ne signale pas qu'elle est fausse.
//
// ── LA BIJECTION QU'ON VEUT TENIR ────────────────────────────────────────────────────────────
//
//   sens 1 — TOUT RÉGLAGE OFFERT MORD : si l'inspecteur le propose sur une part de cette nature,
//            le changer doit changer le dessin. Sinon c'est un bouton mort, et Julien le trouvera
//            avant nous.
//   sens 2 — TOUT CE QUI EST LU EST OFFERT : une clé que le lecteur commun consulte sans que
//            l'interface la propose est du code que personne ne peut allumer.
//
// ── COMMENT ON MESURE, ET POURQUOI PAS AUTREMENT ─────────────────────────────────────────────
//
// PAS EN LISANT LE CODE. Ça a déjà été essayé deux fois, et ça s'est trompé deux fois : le
// catalogue se CONSTRUIT par des fonctions (une lecture statique n'en voit qu'un tiers), et depuis
// que le lecteur commun COMPOSE ses clés (`${prefix}_${suffixe}`), aucune recherche littérale ne
// les retrouve. La mesure sous-comptait précisément la factorisation qu'elle devait mesurer.
//
// ON DESSINE DEUX FOIS. Une fois sans rien dire, une fois avec le réglage posé sur une part, et on
// compare le DOM. C'est grossier, c'est lent, et c'est la seule mesure qui ne puisse pas mentir :
// elle ne dit pas ce que le code a l'air de faire, elle dit ce qu'il a fait.
//
// CE QUE ÇA NE VOIT PAS, et qu'il faut savoir : jsdom ne met rien en page. Un réglage dont le seul
// effet est une MESURE — « masquer si ça dépasse », le retour à la ligne, la largeur de boîte —
// ne changera rien ici alors qu'il agit à l'écran. Ces clés-là sont nommées, pas devinées.

import type { Type_FigurePart } from './partAspect'

/** Ce qu'une nature doit fournir pour se faire interroger. */
export interface Type_BiteProbe {
  /** Le nom de la nature, tel que les styles de part le connaissent. */
  nature: string
  /** Dessine dans `container` avec ces parts. Appelé deux fois, sur deux conteneurs neufs. */
  draw: (container: HTMLElement) => void
  /** Les parts de la figure, par identifiant — celles que `draw` lira. */
  parts: { [id: string]: Type_FigurePart }
  /** L'identifiant de la part sur laquelle on pose le réglage d'essai. */
  probe_id: string
}

/**
 * UNE VALEUR D'ESSAI DIFFÉRENTE DU DÉFAUT, déduite du type de la valeur d'usine.
 *
 * `undefined` = on ne sait pas quoi essayer ; la clé est alors déclarée NON MESURABLE plutôt que
 * comptée inerte. Mieux vaut un trou avoué qu'un chiffre faux — c'est la leçon des deux audits
 * précédents.
 */
export const probeValue = (current: unknown, key?: string): unknown => {
  if (typeof current === 'boolean') return !current
  if (typeof current === 'number') return current === 7 ? 13 : 7
  if (typeof current === 'string') {
    // Une couleur se remplace par une couleur : poser 'zz' sur `fill` ne peindrait rien.
    if (/^#[0-9a-f]{3,8}$/i.test(current)) return current === '#123456' ? '#abcdef' : '#123456'
    // ⚠️ UNE VALEUR D'ESSAI QUE LE CODE REJETTE COMPTE UN RÉGLAGE VIVANT POUR MORT. Deux familles
    // de clés n'acceptent pas n'importe quelle chaîne, et leur poser « probe_a » ne prouve rien :
    //
    //  - un NOM D'ICÔNE doit exister au catalogue du document, sinon il n'y a rien à peindre et le
    //    tracé a raison de ne rien faire ;
    //  - un CHOIX DE LISTE (`*_horiz`, `*_vert`, `*_text_align`, l'orientation…) passe par
    //    `oneOfSaid`, qui écarte tout ce qui n'est pas de la liste.
    //
    // La valeur d'essai se prend donc DANS le domaine de la clé. Sans cela, le harnais compte mort
    // ce qui marche — l'erreur symétrique de celle qu'il vient de corriger, et aussi trompeuse.
    if (key !== undefined && PROBE_BY_KEY[key] !== undefined) {
      const choices = PROBE_BY_KEY[key]
      return choices.find(c => c !== current) ?? choices[0]
    }
    return current === 'probe_a' ? 'probe_b' : 'probe_a'
  }
  return undefined
}

/**
 * Le DOMAINE des clés dont la valeur n'est pas libre (cf. `probeValue`).
 *
 * `icon_icon_name` attend un nom que le catalogue du document connaît : les figures d'essai en
 * déclarent un, `epi`. Les autres sont des listes fermées, lues par `oneOfSaid`.
 */
const PROBE_BY_KEY: { [key: string]: string[] } = {
  icon_icon_name: ['epi'],
  name_label_horiz: ['left', 'middle', 'right'],
  value_label_horiz: ['left', 'middle', 'right'],
  name_label_vert: ['top', 'middle', 'bottom'],
  value_label_vert: ['top', 'middle', 'bottom'],
  name_label_text_align: ['left', 'middle', 'right'],
  value_label_text_align: ['left', 'middle', 'right'],
  name_label_orientation: ['radial', 'tangential', 'horizontal'],
  value_label_percent: ['none', 'total', 'parent'],
  value_label_unit_type: ['unit_model', 'custom'],
  name_label_separator_part: ['before', 'after'],
  value_label_separator_part: ['before', 'after'],
  value_label_part_unit: ['value', 'percent_total', 'percent_parent', 'custom']
}

/**
 * TOUTES les valeurs d'essai d'une clé, et pas seulement la première (os#1490).
 *
 * ⚠️ UN CHOIX PEUT ÊTRE SANS EFFET SUR UNE NATURE ET DÉCISIF SUR UNE AUTRE, parce que les figures
 * n'ont pas les mêmes défauts. « % du tout » posé sur une part de COURONNE ne change rien — la
 * couronne écrit déjà des pourcentages (os#1489) — quand il retourne l'étiquette d'une BARRE. Ne
 * juger un réglage que sur sa première valeur, c'est déclarer mort ce qui marche partout ailleurs.
 *
 * La question posée est donc : ce réglage a-t-il AU MOINS UNE valeur qui change le dessin ? C'est
 * la seule qui corresponde à ce que Julien vérifie à l'écran — il essaie les boutons du groupe.
 */
export const probeValues = (current: unknown, key?: string): unknown[] => {
  if (typeof current === 'string' && key !== undefined && PROBE_BY_KEY[key] !== undefined) {
    const others = PROBE_BY_KEY[key].filter(c => c !== current)
    return others.length > 0 ? others : [PROBE_BY_KEY[key][0]]
  }
  const only = probeValue(current, key)
  return only === undefined ? [] : [only]
}

// ── 25/09/2026 — LE TROISIÈME SENS DE LA BIJECTION ───────────────────────────────────────────
//
// Julien, excédé, après l'orientation d'un libellé de couronne affichée « Radiale » devant un texte
// horizontal : « je sais plus quoi faire, ça fait cinquante fois que je te le dis. Reprends le
// design s'il faut, mais fais quelque chose : c'est un mécanisme général qui doit marcher
// systématiquement pour toutes les figures, tous les éléments. »
//
// Il a raison, et les deux sens d'os#1481 ne pouvaient pas l'attraper. Ils demandent si un réglage
// MORD ; celui-ci mord parfaitement — poser « le long de l'arc » fait bien tourner le texte. Ce qui
// est faux, c'est ce que le panneau ANNONCE avant qu'on y touche.
//
//   sens 3 — TOUT RÉGLAGE OFFERT ANNONCE CE QUI EST DESSINÉ : la valeur que l'inspecteur montre
//            pour une part qui ne dit rien doit être celle que le tracé emploie déjà.
//
// ── COMMENT ON LE MESURE, ET POURQUOI C'EST LA BONNE MESURE ──────────────────────────────────
//
// Sans aucune table de correspondance entre une clé d'attribut et le champ d'aspect qu'elle nourrit
// — une telle table serait une troisième vérité à tenir à jour, donc une quatrième occasion de
// diverger. On pose la question comme l'auteur la pose à l'écran :
//
//   ÉCRIRE SUR LA PART LA VALEUR QUE LE PANNEAU AFFICHE NE DOIT RIEN CHANGER AU DESSIN.
//
// Si le panneau dit vrai, l'écrire est un geste sans effet : on rend explicite ce qui était déjà
// fait. S'il ment, le dessin bouge — et c'est exactement le « si on édite ça marche, mais au début
// ça ne correspond pas » que Julien a décrit trois fois de suite, sur trois clés différentes.
//
// C'est aussi la mesure la plus dure à truquer : elle ne lit ni le catalogue, ni les défauts de
// nature, ni le code du tracé. Elle compare deux DOM.

/** Ce que le panneau affiche pour cette clé sur cette part. Cf. `getConfigValues`. */
export type Type_Announced = (part: Type_FigurePart, key: string) => unknown

/** Le résultat de l'interrogation du sens 3. */
export interface Type_AnnounceResult {
  /** Les clés dont l'affichage correspond au dessin : l'écrire ne change rien. */
  honest: string[]
  /** Les clés dont l'affichage MENT : l'écrire déplace le dessin. */
  lying: string[]
  /** Les clés pour lesquelles le panneau n'affiche rien d'exploitable. */
  unmeasurable: string[]
}

/**
 * Pose sur la part la valeur que le panneau annonce, et regarde si le dessin bouge.
 *
 * Une sonde NEUVE par clé, pour la raison écrite dans `measureBites` : écrire une clé rend la part
 * surchargée pour toujours, et les essais suivants s'en trouveraient faussés.
 */
export const measureAnnounce = (
  makeProbe: () => Type_BiteProbe,
  keys: readonly string[],
  drawInto: (draw: (c: HTMLElement) => void) => string,
  announced: Type_Announced
): Type_AnnounceResult => {
  const out: Type_AnnounceResult = { honest: [], lying: [], unmeasurable: [] }
  keys.forEach(key => {
    const probe = makeProbe()
    const part = probe.parts[probe.probe_id]
    // ⚠️ ON DESSINE AVANT DE LIRE, et l'ordre n'est pas un détail : un tracé RAPPORTE ce qu'il a
    // décidé (`on_parts_resolved`), et ce rapport n'existe qu'une fois le dessin fait. Lire le
    // panneau d'abord mesurerait une figure que personne n'a encore dessinée — un état que
    // l'inspecteur ne voit jamais, puisqu'il s'ouvre sur une figure déjà à l'écran.
    const plain = drawInto(probe.draw)
    const value = announced(part, key)
    // Rien à écrire, rien à conclure : une clé sans valeur affichée ne peut ni mentir ni dire vrai.
    if (value === undefined || value === null) { out.unmeasurable.push(key); return }
    ;(part as unknown as { [k: string]: unknown })[key] = value
    if (drawInto(probe.draw) === plain) out.honest.push(key)
    else out.lying.push(key)
  })
  return out
}

/** Le résultat d'une interrogation, clé par clé. */
export interface Type_BiteResult {
  /** Les clés dont le changement a bien changé le dessin. */
  bites: string[]
  /** Les clés offertes dont le changement n'a RIEN changé : les boutons morts. */
  inert: string[]
  /** Les clés dont on n'a pas su fabriquer une valeur d'essai. */
  unmeasurable: string[]
}

/**
 * Pose chaque clé, l'une après l'autre, et regarde si le dessin bouge.
 *
 * Chaque essai repart d'une figure NEUVE (cf. le commentaire dans le corps) : deux réglages posés
 * ensemble se masqueraient l'un l'autre — une couleur sous un fond caché, une police sous un texte
 * éteint — et c'est l'effet de CHACUN qu'on veut.
 */
export const measureBites = (
  makeProbe: () => Type_BiteProbe,
  keys: readonly string[],
  drawInto: (draw: (c: HTMLElement) => void) => string
): Type_BiteResult => {
  const out: Type_BiteResult = { bites: [], inert: [], unmeasurable: [] }
  keys.forEach(key => {
    // ⚠️ UNE FIGURE NEUVE PAR ESSAI, et c'est le SECOND mensonge de ce harnais qu'il a fallu
    // corriger — plus vicieux que le premier.
    //
    // Écrire une clé sur une part la rend SURCHARGÉE, et lui rendre sa valeur d'origine ne la fait
    // pas se taire : elle DIT désormais cette valeur. Or certaines clés en éteignent d'autres —
    // `value_label_is_visible` remis à `false` cache la valeur de cette part, et les trente clés
    // `value_label_*` testées ensuite ne peuvent plus rien changer.
    //
    // Le harnais déclarait donc morte toute une famille qui marche, et la GELAIT dans sa liste :
    // il fabriquait la dette qu'il prétendait mesurer. Une sonde neuve par essai coûte quelques
    // centaines de millisecondes et supprime l'ordre des clés du raisonnement.
    const probe = makeProbe()
    const part = probe.parts[probe.probe_id] as unknown as { [k: string]: unknown }
    const before = part[key]
    const trials = probeValues(before, key)
    if (trials.length === 0) { out.unmeasurable.push(key); return }
    // ⚠️ L'ÉTAT DE RÉFÉRENCE SE REMESURE AVANT CHAQUE ESSAI, et c'est ce qui a rendu la première
    // version de ce harnais MENTEUSE : elle comparait tout à un unique dessin initial.
    //
    // Écrire une clé sur une part la rend SURCHARGÉE (`isAttributeOverloaded`), et lui rendre sa
    // valeur d'origine ne la fait pas se taire — c'est même toute la doctrine du lecteur commun :
    // une part est écoutée sur ce qu'elle DIT, pas sur ce qu'elle vaut. Chaque essai laissait donc
    // une trace, et à partir du second, TOUT différait du dessin initial : le harnais annonçait
    // 73 réglages vivants là où Julien en voyait cinq morts à l'écran.
    //
    // Un harnais de mesure qui ment est pire que pas de harnais : il endort exactement la
    // vérification qu'il prétend faire.
    // Chaque valeur d'essai repart d'une sonde neuve, pour la même raison que ci-dessus.
    const bites = trials.some((trial, rank) => {
      const fresh = rank === 0 ? probe : makeProbe()
      const on = fresh.parts[fresh.probe_id] as unknown as { [k: string]: unknown }
      const plain = drawInto(fresh.draw)
      on[key] = trial
      return drawInto(fresh.draw) !== plain
    })
    if (bites) out.bites.push(key)
    else out.inert.push(key)
  })
  return out
}
