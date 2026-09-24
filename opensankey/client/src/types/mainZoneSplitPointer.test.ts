// LA POIGNEE DU SEPARATEUR SE POSE SOUS LA SOURIS (os#1507).
//
// Julien, 24/09/2026 : « quand on attrape les fenetres et qu on bouge la barre de separation, ca
// ne suit pas du tout la souris ». La poignee etait DESSINEE dans la zone de contenu
// (`content_w - largeur de la colonne droite`) et PILOTEE par rapport a la fenetre
// (`clientX / innerWidth`) : elle se posait donc a `clientX - reserve de droite`.
//
// Ce que ce test tient, c est l ALLER-RETOUR entre les deux conversions. Elles vivent cote a cote
// dans MenuConfig precisement parce qu elles doivent s annuler, et rien d autre ne le verifie :
// une correction de l une sans l autre repasserait au vert sur un test qui ne regarderait qu une
// seule d entre elles.

import {
  mainZoneRightColumnWidthPx, mainZoneSplitRatioForPointer,
  MAIN_ZONE_MIN_RIGHT_PX, MAIN_ZONE_MIN_MAIN_PX
} from './MenuConfig'

/** Ou se pose le bord gauche de la colonne droite, pour un ratio et une reserve donnes. */
const dividerX = (ratio: number, window_w: number, reserve_px: number): number => {
  const content_w = window_w - reserve_px
  return content_w - mainZoneRightColumnWidthPx(ratio, window_w)
}

describe('os#1507 la poignee du separateur suit la souris', () => {

  // Les trois reserves qui existent vraiment : rien, la colonne d outils seule (48 px), et la
  // colonne plus un panneau epingle (420 px au minimum). C est la troisieme qui a fait dire
  // « pas du tout » — pres de 500 px d ecart.
  const reserves = [0, 48, 48 + 420]
  const window_w = 1600

  reserves.forEach(reserve => {
    it('reserve de ' + reserve + ' px : la poignee se pose ou est le curseur', () => {
      const content_w = window_w - reserve
      // Des abscisses qui laissent la colonne droite dans ses bornes, sinon c est le clamp qu on
      // mesurerait et non la conversion.
      const xs = [content_w - MAIN_ZONE_MIN_RIGHT_PX - 200, content_w - MAIN_ZONE_MIN_RIGHT_PX - 50]
      xs.forEach(x => {
        const ratio = mainZoneSplitRatioForPointer(x, content_w, window_w)
        expect(dividerX(ratio, window_w, reserve)).toBeCloseTo(x, 6)
      })
    })
  })

  it('L ANCIENNE FORMULE se trompait EXACTEMENT de la reserve', () => {
    // La contre-verification : sans elle, on ne saurait pas si le test ci-dessus mesure la
    // correction ou une identite qui aurait toujours ete vraie.
    const reserve = 48 + 420
    const content_w = window_w - reserve
    const x = content_w - MAIN_ZONE_MIN_RIGHT_PX - 100
    const ancien_ratio = x / window_w
    expect(dividerX(ancien_ratio, window_w, reserve)).toBeCloseTo(x - reserve, 6)
  })

  it('les bornes restent celles de la colonne droite', () => {
    // Pousser la poignee a l extreme droite ne fait pas disparaitre la colonne : elle garde sa
    // largeur minimale, et le ratio reste une fraction de la FENETRE (rien a migrer).
    const reserve = 48
    const content_w = window_w - reserve
    const ratio = mainZoneSplitRatioForPointer(content_w, content_w, window_w)
    expect(mainZoneRightColumnWidthPx(ratio, window_w)).toBe(MAIN_ZONE_MIN_RIGHT_PX)
    // Et a l extreme gauche, c est la zone principale qui garde la sienne.
    const ratio_gauche = mainZoneSplitRatioForPointer(0, content_w, window_w)
    expect(mainZoneRightColumnWidthPx(ratio_gauche, window_w))
      .toBe(window_w - MAIN_ZONE_MIN_MAIN_PX)
  })

  it('une largeur de fenetre nulle ne produit pas NaN', () => {
    // Le cas du rendu hors ecran (onglet cache, capture de vignette) : une division par zero
    // ecrirait NaN dans l etat persiste, et la mise en page ne s en releverait pas au rechargement.
    expect(mainZoneSplitRatioForPointer(100, 0, 0)).toBe(0.5)
  })
})
