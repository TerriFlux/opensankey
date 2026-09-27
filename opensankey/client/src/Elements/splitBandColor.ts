// os#1510 — NUANCES DE BANDES SŒURS.
//
// Une bande éclatée prend la couleur de l'enfant qu'elle représente. Quand des sœurs partagent la
// même couleur (Céréales éclaté en « bruts » et « transformés », tous deux #1f77b4 dans le fichier
// SOCLE), leurs bandes étaient indiscernables. Ces sœurs reçoivent des nuances de cette couleur,
// de la plus sombre à la plus claire dans l'ordre des enfants ; une couleur portée par une seule
// sœur reste intacte.
import * as d3 from '../d3Modules'

const SPREAD = 0.18

export const shadeAmongSiblings = (colors: string[], index: number): string => {
  const own = colors[index]
  if (own === undefined) return own
  const key = own.trim().toLowerCase()
  const same = colors.reduce<number[]>((acc, c, j) => {
    if ((c ?? '').trim().toLowerCase() === key) acc.push(j)
    return acc
  }, [])
  if (same.length < 2) return own
  const hsl = d3.hsl(own)
  if (Number.isNaN(hsl.l)) return own
  const k = same.indexOf(index)
  const t = k / (same.length - 1) // 0 … 1
  hsl.l = Math.min(0.9, Math.max(0.15, hsl.l + (2 * t - 1) * SPREAD))
  return hsl.formatHex()
}
