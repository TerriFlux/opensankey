// ==================================================================================================
// os#1383 — UNE ESPÈCE + UN MODE = UNE ÉCHELLE, QUEL QUE SOIT LE CHEMIN.
//
// Les deux plafonds de `Class_ScaleOverrides` s'appliquent l'un après l'autre sur la même échelle :
// la référence d'épaisseur par view tag, puis la hauteur maximale de nœud. Chacun défaisait sa
// surcharge « sauf si une autre source a recalculé depuis » — et voyait la surcharge de l'AUTRE.
// Il renonçait donc à défaire la sienne et adoptait comme base une échelle qui la contenait déjà.
//
// Mesuré sur CARTOFOB avant correctif : en alternant chêne et pin maritime en mode absolu, le
// dessin grandissait de 111 unités À CHAQUE aller-retour, sans fin — les nœuds passant de 536 à
// 662 en trois tours. Le recadrage compensait en rapetissant le diagramme, d'où le symptôme vécu :
// « le dessin se recalcule sur une toute petite partie de l'écran ».
//
// Ces tests verrouillent l'IDEMPOTENCE : rejouer la même frame ne doit jamais déplacer l'échelle.
//
// ⚠️ CE QU'ILS NE FONT PAS — vérifié, pas supposé : ils passent AUSSI sur le code d'avant le
// correctif. Ce ne sont donc PAS des tests de non-régression du défaut d'os#1383, et il ne faut pas
// leur prêter cette valeur. Le cliquet demande que les DEUX plafonds tirent en même temps ET qu'un
// tiers (la bascule de mode, qui écrit `_scale` directement) passe entre deux frames ; ce diagramme
// synthétique ne reproduit pas cette conjonction. Le défaut n'a été constaté et le correctif validé
// que sur le vrai CARTOFOB, en navigateur (cf. os#1383 : +111 unités par aller-retour avant, série
// stable après). Reproduire le cliquet en test unitaire reste à faire.
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

/** Une frame de dessin, dans l ordre reel de `drawElements`. */
function frame(da: ReturnType<typeof makeApp>['da']) {
  da.applyViewTagScaleReference()
  da.applyMaximumNodeScale()
  return da._scale
}

describe('os#1383 — les plafonds d echelle sont idempotents', () => {
  it('rejouer la meme frame ne deplace plus l echelle', () => {
    const { da } = makeApp()
    const premiere = frame(da)
    // Sans le correctif, chaque frame repartait de l echelle deja plafonnee : le cliquet.
    expect(frame(da)).toBeCloseTo(premiere, 9)
    expect(frame(da)).toBeCloseTo(premiere, 9)
    expect(frame(da)).toBeCloseTo(premiere, 9)
  })

  it('le plafond de hauteur de nœud ne fait plus prendre la surcharge de l autre pour une base', () => {
    const { da } = makeApp()
    da.maximum_node = 50
    const premiere = frame(da)
    // C est le cas qui produisait la derive : les deux plafonds actifs en meme temps.
    expect(frame(da)).toBeCloseTo(premiere, 9)
    expect(frame(da)).toBeCloseTo(premiere, 9)
  })

  it('une echelle posee DELIBEREMENT devient la base et n est pas defaite a la frame suivante', () => {
    const { da } = makeApp()
    frame(da)
    // Le setter public invalide les bases memorisees : le choix de l utilisateur fait foi.
    da.scale = 7000
    expect(da._scale).toBeCloseTo(7000, 9)
    // La frame suivante peut replafonner, mais elle ne restaure JAMAIS l ancienne base.
    const apres = frame(da)
    expect(apres).toBeGreaterThanOrEqual(7000)
    expect(frame(da)).toBeCloseTo(apres, 9)
  })
})
