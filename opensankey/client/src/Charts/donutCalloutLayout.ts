// 02/10/2026 — LES ÉTIQUETTES DÉTACHÉES DE LA COURONNE, RANGÉES COMME DANS TOUT DONUT.
//
// Julien, capture à l'appui : « non ça va pas, les labels détachés ». Posées à un écart de leur
// point d'arc (sa!832), les étiquettes des petites parts consécutives se collaient au bord, sur les
// secteurs voisins et les unes sur les autres, en escalier, avec des traits minuscules.
//
// LE PATRON CLASSIQUE, sans invention :
// - le trait part du bord extérieur de l'arc, au milieu angulaire du secteur ;
// - il coude à `rayon + écart`, sur la même direction radiale ;
// - l'étiquette se pose à droite du disque pour la moitié droite (ancrée au début), à gauche pour
//   la moitié gauche (ancrée à la fin), à x = ±(rayon + écart + palier) : jamais sur le disque ;
// - par côté, les étiquettes sont triées par hauteur et repoussées verticalement pour garantir
//   leur hauteur plus 2 px d'écart, puis la colonne est ramenée dans le cadre si elle en déborde.
//
// ET UN CADRE BORNÉ, QUAND IL L'EST (petits multiples : la case) : on ne garde, par côté, que ce
// qui tient sans chevauchement — les plus grandes parts d'abord, les autres se taisent.
//
// 02/10/2026 — CHACUNE RESTE PRÈS DE SON ANCRE (Julien, capture « Export par continent » : dix
// étiquettes empilées en colonne à gauche, un éventail de traits longs qui se croisent). La pile
// ne se comprime plus : les étiquettes sont admises une à une, les plus grandes parts d'abord, et
// la colonne se détend au plus juste (grappes posées au plus près de la hauteur voulue de leurs
// membres). Une étiquette qu'il faudrait pousser à plus de `CALLOUT_MAX_SHIFT_LINES` hauteurs de
// sa ligne de son ancre, ou hors du cadre, n'est pas admise : elle se tait, l'info-bulle reste.
//
// Fonction pure, sans DOM : le tracé (`drawDonutChart`) et son test la partagent.

/** Une étiquette à poser. */
export interface Type_CalloutRequest {
  id: string
  /** L'angle médian du secteur (0 = midi, sens horaire), en radians. */
  mid_angle: number
  height: number
  /** Sa largeur ; ne sert qu'à tenir un cadre borné en largeur. */
  width?: number
  /** Sa priorité quand tout ne tient pas : la valeur de la part. */
  weight?: number
}

export interface Type_CalloutPlacement {
  /** Le point du bord extérieur de l'arc d'où part le trait. */
  anchor: { x: number, y: number }
  /** Le coude, à `rayon + écart` sur la direction radiale. */
  elbow: { x: number, y: number }
  /** Le point d'ancrage du texte (centre vertical de l'étiquette). */
  x: number
  y: number
  side: 1 | -1
  text_anchor: 'start' | 'end'
}

export interface Type_CalloutBounds {
  /** La demi-hauteur du cadre, depuis le centre du disque. */
  half_height?: number
  /** La demi-largeur du cadre, depuis le centre du disque. */
  half_width?: number
  /** La largeur du cadre à droite et à gauche du centre, quand elles diffèrent (sinon `half_width`). */
  right_width?: number
  left_width?: number
}

/**
 * 05/10/2026 — LA MARGE DES ÉTIQUETTES DÉTACHÉES EST FIXE (Julien : « c'est bizarre que si on les
 * cache, ça change la taille de la couronne. Il ne faut pas les prendre en compte »). Le cadre se
 * réglait sur les étiquettes sorties (sa!827, sa!874) : passer de « Détacher » à « Masquer », changer
 * le seuil ou décocher une part faisait grandir ou rétrécir le disque.
 *
 * Désormais le rayon ne dépend QUE de la place : la demi-zone (figure moins légende et titres) moins
 * cette part, la même que des étiquettes sortent ou non. Les étiquettes détachées se rangent dans la
 * marge (`layoutDonutCallouts`, bornée par la zone) ; celles qui n'y tiennent pas se taisent,
 * l'info-bulle reste. Couronne, petits multiples (la case) et sunburst suivent la même règle.
 */
export const CALLOUT_MARGIN_RATIO = 0.2

/** Le rayon du disque dans une demi-zone de `half_zone` pixels : la marge fixe retirée. */
export const discRadiusInZone = (half_zone: number): number =>
  Math.max(0, half_zone) * (1 - CALLOUT_MARGIN_RATIO)

/** L'inverse : la demi-zone qu'un disque de rayon `radius` réclame, marge fixe comprise. */
export const zoneHalfOfDisc = (radius: number): number =>
  Math.max(0, radius) / (1 - CALLOUT_MARGIN_RATIO)

/** L'écart vertical minimal entre deux étiquettes d'une même colonne, en pixels. */
export const CALLOUT_STACK_GAP_PX = 2

/** Au-delà de ce nombre de hauteurs d'étiquette entre sa place et son ancre, elle se tait. */
export const CALLOUT_MAX_SHIFT_LINES = 1.5

const point = (r: number, a: number) => ({ x: r * Math.sin(a), y: -r * Math.cos(a) })

interface Type_Wanted { r: Type_CalloutRequest, want: number }

/**
 * La colonne détendue AU PLUS JUSTE : triées par hauteur voulue, les étiquettes qui se chevauchent
 * forment des grappes, chaque grappe se pose à la moyenne de ce que veulent ses membres (le moins de
 * déplacement total), dans [-limit, limit]. Rend le centre de chacune, ou null si la colonne ne
 * tient pas dans le cadre.
 */
const relaxColumn = (items: Type_Wanted[], limit: number): number[] | null => {
  const sorted = [...items].sort((a, b) => a.want - b.want)
  const total = sorted.reduce((s, c) => s + c.r.height, 0) + CALLOUT_STACK_GAP_PX * (sorted.length - 1)
  if (total > 2 * limit + 1e-9) return null
  interface Cluster { members: Type_Wanted[], offsets: number[], height: number, top: number }
  const placeOf = (c: Cluster) => {
    const ideal = c.members.reduce((s, m, k) => s + (m.want - m.r.height / 2 - c.offsets[k]), 0) / c.members.length
    c.top = Math.max(-limit, Math.min(limit - c.height, ideal))
  }
  const stack: Cluster[] = []
  sorted.forEach(m => {
    let cur: Cluster = { members: [m], offsets: [0], height: m.r.height, top: 0 }
    placeOf(cur)
    while (stack.length > 0) {
      const prev = stack[stack.length - 1]
      if (prev.top + prev.height + CALLOUT_STACK_GAP_PX <= cur.top + 1e-9) break
      stack.pop()
      const shift = prev.height + CALLOUT_STACK_GAP_PX
      cur = {
        members: [...prev.members, ...cur.members],
        offsets: [...prev.offsets, ...cur.offsets.map(o => o + shift)],
        height: prev.height + CALLOUT_STACK_GAP_PX + cur.height,
        top: 0
      }
      placeOf(cur)
    }
    stack.push(cur)
  })
  const ys = new Map<Type_Wanted, number>()
  stack.forEach(c => c.members.forEach((m, k) => ys.set(m, c.top + c.offsets[k] + m.r.height / 2)))
  return items.map(m => ys.get(m) as number)
}

/**
 * Range les étiquettes détachées autour d'un disque de rayon `radius`. `gap` est l'écart du coude au
 * bord, `step` le palier horizontal entre le coude et le texte. Une étiquette absente de la carte
 * rendue ne tient pas dans `bounds`, ou s'écarterait trop de son ancre : elle se tait.
 */
export const layoutDonutCallouts = (
  requests: Type_CalloutRequest[], radius: number, gap: number, step: number = gap,
  bounds: Type_CalloutBounds = {}
): Map<string, Type_CalloutPlacement> => {
  const out = new Map<string, Type_CalloutPlacement>()
  const elbow_r = radius + gap
  const text_x = elbow_r + step
  ;([1, -1] as const).forEach(side => {
    const room_w = (side > 0 ? bounds.right_width : bounds.left_width) ?? bounds.half_width
    const mine = requests
      .filter(r => (Math.sin(r.mid_angle) >= 0 ? 1 : -1) === side)
      // Trop large pour le cadre : elle ne tient d'aucune façon.
      .filter(r => room_w === undefined || text_x + (r.width ?? 0) <= room_w + 1e-6)
    if (mine.length === 0) return
    // Le cadre de la colonne : celui qui est donné, sinon le disque, son coude et une étiquette.
    const limit = bounds.half_height ?? elbow_r + Math.max(...mine.map(r => r.height))
    // Les plus grandes parts d'abord : chacune est admise si la colonne détendue la garde dans le
    // cadre ET laisse chaque étiquette déjà admise près de son ancre.
    let kept: Type_Wanted[] = []
    let ys: number[] = []
    ;[...mine].sort((a, b) => (b.weight ?? 0) - (a.weight ?? 0)).forEach(r => {
      const trial = [...kept, { r, want: point(elbow_r, r.mid_angle).y }]
      const at = relaxColumn(trial, limit)
      if (at === null) return
      const near = trial.every((m, k) => Math.abs(at[k] - m.want) <= CALLOUT_MAX_SHIFT_LINES * m.r.height + 1e-9)
      if (!near) return
      kept = trial
      ys = at
    })
    kept.forEach(({ r }, k) => {
      out.set(r.id, {
        anchor: point(radius, r.mid_angle),
        elbow: point(elbow_r, r.mid_angle),
        x: side * text_x,
        y: ys[k],
        side,
        text_anchor: side > 0 ? 'start' : 'end'
      })
    })
  })
  return out
}
