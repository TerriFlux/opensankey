// ==================================================================================================
// os#1383 — DEUX ÉCHELLES, PAS UNE : la base de l'utilisateur et l'effective de la frame.
//
// Les trois règles de frame (échelle adaptée, référence d'épaisseur par view tag, plafond de
// hauteur de nœud) écrivaient toutes DANS `_scale`, l'échelle absolue de l'utilisateur, en
// s'engageant à la restaurer à la frame suivante « sauf si une autre source l'avait recalculée ».
// Chacune voyait la surcharge de l'autre, l'adoptait comme base, et l'échelle adaptée d'une vue
// finissait dans `user_scale`. Mesuré sur CARTOFOB : le stock, à 1585 px partout à l'ouverture,
// tombait à 619 px après un aller-retour absolu → adapté, puis 767 / 1585 / 773 selon la vue.
//
// Désormais `_scale` n'est écrit que par l'utilisateur (setter `scale`), le chargement et la
// copie ; les règles n'écrivent que `_scale_effective`, remis à la base en tête de chaque frame.
// Ces tests verrouillent cela : la base ne bouge JAMAIS sous les règles, l'effective est
// reproductible, et le plafond exact du mode adapté remplit dans les deux sens.
// ==================================================================================================
import { Class_ApplicationData } from './ApplicationData'

if (typeof globalThis.structuredClone !== 'function') {
  globalThis.structuredClone = <T>(o: T): T => JSON.parse(JSON.stringify(o)) as T
}

const DA_SCALE = 1000

/** Diagramme minimal portant les DEUX plafonds : reference d epaisseur par view tag ET maximum_node. */
function makeApp() {
  const app = new Class_ApplicationData(false)
  const da = app.drawing_area
  da.bypass_redraws = true
  const sankey = da.sankey
  const source = sankey.addNewNodeWithName('Recolte')
  const target = sankey.addNewNodeWithName('Collecte')
  const link = sankey.addNewLink(source, target)
  link.valueCurrent = 35000
  da._scale = DA_SCALE
  da._scaleValueToPx.domain([0, DA_SCALE])

  const vtg = sankey.addViewTagGroup('vues', 'Vues')
  vtg.view_mode = true
  const essence = vtg.addTag('Essence', 'essence')
  essence.setSelected()
  da.setScaleReferenceForViewTag('essence', link.id, 100)

  return { app, da, sankey, link }
}

/** Une frame de dessin, dans l ordre reel de `drawElements` (sans adaptation). */
function frame(da: ReturnType<typeof makeApp>['da'], exact = false) {
  da.beginScaleFrame()
  da.applyViewTagScaleReference()
  da.applyMaximumNodeScale(exact)
  return da.scale
}

describe('os#1383 — la base de l utilisateur ne bouge jamais sous les regles de frame', () => {
  it('les plafonds ecrivent l echelle effective, pas la base', () => {
    const { da } = makeApp()
    const effective = frame(da)
    // Le flux de reference fait 35000/1000*100 = 3500 px > 100 : le plafond mord.
    expect(effective).toBeGreaterThan(DA_SCALE)
    expect(da.base_scale).toBe(DA_SCALE)
    expect(da._scale).toBe(DA_SCALE)
  })

  it('rejouer la meme frame rend la meme echelle effective, sans cliquet', () => {
    const { da } = makeApp()
    da.maximum_node = 50
    const premiere = frame(da)
    // C etait le cas qui produisait la derive : les deux plafonds actifs en meme temps.
    expect(frame(da)).toBeCloseTo(premiere, 9)
    expect(frame(da)).toBeCloseTo(premiere, 9)
    expect(da.base_scale).toBe(DA_SCALE)
  })

  it('une echelle posee DELIBEREMENT devient la base et la frame repart d elle', () => {
    const { da } = makeApp()
    frame(da)
    da.scale = 7000
    expect(da.base_scale).toBe(7000)
    // Juste apres le setter, aucune surcharge : l effective EST la base.
    expect(da.scale).toBe(7000)
    const apres = frame(da)
    expect(apres).toBeGreaterThanOrEqual(7000)
    expect(frame(da)).toBeCloseTo(apres, 9)
    expect(da.base_scale).toBe(7000)
  })

  it('le plafond exact (mode adapte sans reference) remplit dans les DEUX sens', () => {
    const { da, sankey } = makeApp()
    // La reference d epaisseur (100 px) reste posee : a grande base elle ne mord pas, et en
    // exact c est le plafond qui a le dernier mot — il s applique apres elle.
    da.maximum_node = 200
    // Grande base : le plus haut nœud est bien plus petit que le plafond.
    da.scale = 1e6
    const petit = frame(da, false)
    // Semantique « maximum » : rien ne depasse, rien ne bouge.
    expect(petit).toBe(1e6)
    const exact = frame(da, true)
    // Exact : l echelle DESCEND pour que le plus haut nœud atteigne le plafond.
    expect(exact).toBeLessThan(1e6)
    let tallest = 0
    sankey.visible_nodes_list.forEach(n => { tallest = Math.max(tallest, n.getNaturalShapeHeight()) })
    expect(tallest).toBeCloseTo(200, 6)
    // Et la base n a pas bouge.
    expect(da.base_scale).toBe(1e6)
    // Reproductible.
    expect(frame(da, true)).toBeCloseTo(exact, 9)
  })
})
