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
}

/** L'écart vertical minimal entre deux étiquettes d'une même colonne, en pixels. */
export const CALLOUT_STACK_GAP_PX = 2

const point = (r: number, a: number) => ({ x: r * Math.sin(a), y: -r * Math.cos(a) })

/**
 * Range les étiquettes détachées autour d'un disque de rayon `radius`. `gap` est l'écart du coude au
 * bord, `step` le palier horizontal entre le coude et le texte. Une étiquette absente de la carte
 * rendue ne tient pas dans `bounds` : elle se tait.
 */
export const layoutDonutCallouts = (
  requests: Type_CalloutRequest[], radius: number, gap: number, step: number = gap,
  bounds: Type_CalloutBounds = {}
): Map<string, Type_CalloutPlacement> => {
  const out = new Map<string, Type_CalloutPlacement>()
  const elbow_r = radius + gap
  const text_x = elbow_r + step
  ;([1, -1] as const).forEach(side => {
    let mine = requests
      .filter(r => (Math.sin(r.mid_angle) >= 0 ? 1 : -1) === side)
      // Trop large pour le cadre : elle ne tient d'aucune façon.
      .filter(r => bounds.half_width === undefined || text_x + (r.width ?? 0) <= bounds.half_width)
    if (bounds.half_height !== undefined) {
      // Les plus grandes d'abord, tant que la pile tient dans la hauteur du cadre.
      const room = 2 * bounds.half_height
      let used = 0
      const kept = new Set<Type_CalloutRequest>()
      ;[...mine].sort((a, b) => (b.weight ?? 0) - (a.weight ?? 0)).forEach(r => {
        const need = r.height + (kept.size > 0 ? CALLOUT_STACK_GAP_PX : 0)
        if (used + need <= room) { kept.add(r); used += need }
      })
      mine = mine.filter(r => kept.has(r))
    }
    const column = mine
      .map(r => ({ r, y: point(elbow_r, r.mid_angle).y }))
      .sort((a, b) => a.y - b.y)
    if (column.length === 0) return
    // Descente : chacune au moins sa demi-hauteur, celle de la précédente et 2 px sous elle.
    for (let i = 1; i < column.length; i++) {
      const prev = column[i - 1]
      const cur = column[i]
      const min_y = prev.y + (prev.r.height + cur.r.height) / 2 + CALLOUT_STACK_GAP_PX
      if (cur.y < min_y) cur.y = min_y
    }
    // Le cadre de la colonne : celui qui est donné, sinon la hauteur du disque et de son coude, ou
    // celle de la colonne si elle est plus haute — elle se centre alors sur le disque.
    const stacked = column.reduce((s, c) => s + c.r.height, 0) + CALLOUT_STACK_GAP_PX * (column.length - 1)
    const limit = bounds.half_height ?? Math.max(elbow_r, stacked / 2)
    const last = column[column.length - 1]
    if (last.y + last.r.height / 2 > limit) {
      // Remontée : la dernière revient au bas du cadre, les précédentes lui laissent la place.
      last.y = limit - last.r.height / 2
      for (let i = column.length - 2; i >= 0; i--) {
        const next = column[i + 1]
        const cur = column[i]
        const max_y = next.y - (next.r.height + cur.r.height) / 2 - CALLOUT_STACK_GAP_PX
        if (cur.y > max_y) cur.y = max_y
      }
    }
    const first = column[0]
    if (first.y - first.r.height / 2 < -limit) {
      // La remontée a trop poussé : on redescend la colonne d'un bloc (elle tient, cf. plus haut).
      const shift = -limit - (first.y - first.r.height / 2)
      column.forEach(c => { c.y += shift })
    }
    column.forEach(({ r, y }) => {
      out.set(r.id, {
        anchor: point(radius, r.mid_angle),
        elbow: point(elbow_r, r.mid_angle),
        x: side * text_x,
        y,
        side,
        text_anchor: side > 0 ? 'start' : 'end'
      })
    })
  })
  return out
}
