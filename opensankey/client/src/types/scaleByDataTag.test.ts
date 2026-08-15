// sa#283 — Échelle par dataTag GÉNÉRALISÉE (principe du UnitTag étendu) : tests
// d'INTÉGRATION sur le modèle vivant. La sélection d'une tranche à échelle propre impose
// son échelle au rendu (épaisseur des flux), la désélection revient à l'échelle du dessin,
// et les fichiers historiques (échelles d'unité seules) gardent un comportement
// STRICTEMENT identique. Cf. ScaleResolution.ts.
import { Class_ApplicationData } from './ApplicationData'
import type { Class_DataTag } from './Tag'
import type { Class_DataTagGroup } from './TagGroup'
import type { Type_JSON } from './Utils'

if (typeof globalThis.structuredClone !== 'function') {
  globalThis.structuredClone = <T>(o: T): T => JSON.parse(JSON.stringify(o)) as T
}

const DA_SCALE = 1000

/** App headless : 2 nœuds, 1 flux, échelle de dessin posée à DA_SCALE (recette updateFrom). */
function makeApp() {
  const app = new Class_ApplicationData(false)
  app.drawing_area.bypass_redraws = true
  const sankey = app.drawing_area.sankey
  const source = sankey.addNewNodeWithName('Recolte')
  const target = sankey.addNewNodeWithName('Collecte')
  const link = sankey.addNewLink(source, target)
  app.drawing_area._scale = DA_SCALE
  app.drawing_area._scaleValueToPx.domain([0, DA_SCALE])
  return { app, sankey, link }
}

/** Groupe « cereale » (ordinaire, bannière one) : blé 35000 / millet 100, blé sélectionné. */
function addCerealeGroup(sankey: ReturnType<typeof makeApp>['sankey'], link: ReturnType<typeof makeApp>['link']) {
  const cereale = sankey.addDataTagGroup('cereale', 'Céréale', false)
  const ble = cereale.addTag('Blé tendre', 'ble') as Class_DataTag
  const millet = cereale.addTag('Millet', 'millet') as Class_DataTag
  ble.setSelected()
  millet.setUnSelected()
  link.valueForTag(ble)!.valueData = 35000
  link.valueForTag(millet)!.valueData = 100
  return { cereale, ble, millet }
}

describe('sa#283 — échelle par dataTag : sélection → échelle effective', () => {
  it('sans échelle propre : épaisseur à l échelle de la zone de dessin (comportement historique)', () => {
    const { link, sankey } = makeApp()
    addCerealeGroup(sankey, link)
    // 35000 à l'échelle DA 1000 → 35000/1000×100 px.
    expect(link.thickness).toBeCloseTo(35000 / DA_SCALE * 100, 6)
  })

  it('la tranche sélectionnée impose son échelle propre ; la bascule suit ; sans échelle → DA', () => {
    const { link, sankey } = makeApp()
    const { ble, millet } = addCerealeGroup(sankey, link)
    ble.own_scale = 35000
    millet.own_scale = 100

    // Blé sélectionné : 35000 à l'échelle 35000 → 100 px.
    expect(link.thickness).toBeCloseTo(100, 6)

    // Bascule sur millet : 100 à l'échelle 100 → 100 px (l'épaisseur RENDUE est stable,
    // c'est tout l'objet : une échelle par tranche).
    ble.setUnSelected()
    millet.setSelected()
    expect(link.thickness).toBeCloseTo(100, 6)

    // Retrait de l'échelle propre du millet : retour à l'échelle de la zone de dessin.
    millet.own_scale = undefined
    expect(link.thickness).toBeCloseTo(100 / DA_SCALE * 100, 6)
  })

  it('tag scalé NON sélectionné : ignoré (l échelle du dessin reste maîtresse)', () => {
    const { link, sankey } = makeApp()
    const { millet } = addCerealeGroup(sankey, link)
    millet.own_scale = 100 // millet scalé mais blé sélectionné (sans échelle propre)
    expect(link.thickness).toBeCloseTo(35000 / DA_SCALE * 100, 6)
  })

  it('NON-RÉGRESSION unité seule : le tag d unité DE LA VALEUR porte, strictement comme avant', () => {
    const { link, sankey } = makeApp()
    const unite = sankey.addDataTagGroup('unite', 'Unité', false)
    unite.is_unit = true
    const kt = unite.addTag('kt', 'kt') as Class_DataTag
    const kwh = unite.addTag('kWh', 'kwh') as Class_DataTag
    kt.setSelected()
    kwh.setUnSelected()
    kt.scale = 100
    kwh.scale = 5000
    link.valueForTag(kt)!.valueData = 50
    link.valueForTag(kwh)!.valueData = 2500

    // Valeur courante = tranche kt : échelle du tag d'unité kt (50/100×100 = 50 px),
    // l'échelle de la DA (1000) ne joue pas.
    expect(link.thickness).toBeCloseTo(50, 6)
    // Bascule d'unité : échelle kWh (2500/5000×100 = 50 px).
    kt.setUnSelected()
    kwh.setSelected()
    expect(link.thickness).toBeCloseTo(50, 6)
  })

  it('cereale + unite : le groupe le plus tardif de taggs_order gagne', () => {
    const { link, sankey } = makeApp()
    // unite créé AVANT cereale → cereale vient en dernier dans taggs_order → il gagne.
    const unite = sankey.addDataTagGroup('unite', 'Unité', false)
    unite.is_unit = true
    const kt = unite.addTag('kt', 'kt') as Class_DataTag
    kt.setSelected()
    kt.scale = 100
    const { ble } = addCerealeGroup(sankey, link)
    link.valueForTag(kt)!.valueData = 35000 // (re)pose la valeur après l'ajout du 2e groupe
    ble.own_scale = 35000
    expect(link.thickness).toBeCloseTo(100, 6) // échelle du blé (35000), pas du kt (100)
    // La céréale sélectionnée sans échelle propre → l'unité reprend la main.
    ble.own_scale = undefined
    expect(link.thickness).toBeCloseTo(35000 / 100 * 100, 6)
  })
})

describe('sa#283 — persistance de l échelle propre', () => {
  it('own_scale survit au round-trip ; un fichier legacy (scale sans scale_owned) n en porte pas', () => {
    const { app, link, sankey } = makeApp()
    const { ble, millet } = addCerealeGroup(sankey, link)
    ble.own_scale = 35000

    const saved = app.toJSON() as Type_JSON
    const app2 = new Class_ApplicationData(false)
    app2.drawing_area.bypass_redraws = true
    app2.fromJSON(structuredClone(saved) as Type_JSON, {}, false)
    const group2 = app2.drawing_area.sankey.data_taggs_dict['cereale'] as Class_DataTagGroup
    expect((group2.tags_dict['ble'] as Class_DataTag).own_scale).toBe(35000)
    expect((group2.tags_dict['millet'] as Class_DataTag).own_scale).toBeUndefined()

    // Fichier LEGACY simulé : on retire les drapeaux scale_owned — les `scale` résiduels
    // (défaut 10 sérialisé depuis toujours) ne doivent PAS devenir des échelles propres.
    const legacy = structuredClone(saved) as Type_JSON
    const taggs = ((legacy['dataTags'] as Type_JSON)['cereale'] as Type_JSON)['tags'] as Type_JSON
    expect(Object.keys(taggs).sort()).toEqual(['ble', 'millet']) // garde-fou sur la forme du fichier
    Object.values(taggs).forEach(tag_entry => { delete (tag_entry as Type_JSON)['scale_owned'] })
    const app3 = new Class_ApplicationData(false)
    app3.drawing_area.bypass_redraws = true
    app3.fromJSON(legacy, {}, false)
    const group3 = app3.drawing_area.sankey.data_taggs_dict['cereale'] as Class_DataTagGroup
    expect((group3.tags_dict['ble'] as Class_DataTag).own_scale).toBeUndefined()
    void millet
  })
})

describe('sa#283 — porteur de ScaleOverrides généralisé (référence d épaisseur par view tag)', () => {
  it('le recalage écrit dans le tag de la tranche sélectionnée quand elle porte une échelle, et le restaure', () => {
    const { app, link, sankey } = makeApp()
    const { ble } = addCerealeGroup(sankey, link)
    ble.own_scale = 35000 // épaisseur naturelle du flux : 100 px

    // View tag en mode filtre + référence d'épaisseur : plafond 50 px sur ce flux.
    const vtg = sankey.addViewTagGroup('vues', 'Vues')
    vtg.view_mode = true
    const essence = vtg.addTag('Essence', 'essence')
    essence.setSelected()
    app.drawing_area.setScaleReferenceForViewTag('essence', link.id, 50)

    // Épaisseur naturelle (100 px) > plafond (50 px) → le porteur est recalé, et le
    // porteur est le TAG DE LA CÉRÉALE (pas la zone de dessin) : new_scale = v×100/T.
    app.drawing_area.applyViewTagScaleReference()
    expect(ble.own_scale).toBeCloseTo(35000 * 100 / 50, 6)
    expect(app.drawing_area.scale).toBe(DA_SCALE) // la DA n'a pas bougé
    expect(link.thickness).toBeCloseTo(50, 6)

    // Frame suivante : la surcharge transitoire est restaurée sur le porteur.
    app.drawing_area.setScaleReferenceForViewTag('essence', undefined, 0)
    app.drawing_area.applyViewTagScaleReference()
    expect(ble.own_scale).toBeCloseTo(35000, 6)
    expect(link.thickness).toBeCloseTo(100, 6)
  })

  it('NON-RÉGRESSION : sans échelle propre, le porteur reste la zone de dessin', () => {
    const { app, link, sankey } = makeApp()
    addCerealeGroup(sankey, link) // aucun own_scale
    const vtg = sankey.addViewTagGroup('vues', 'Vues')
    vtg.view_mode = true
    const essence = vtg.addTag('Essence', 'essence')
    essence.setSelected()
    // Épaisseur naturelle : 35000/1000×100 = 3500 px > plafond 100 px.
    app.drawing_area.setScaleReferenceForViewTag('essence', link.id, 100)
    app.drawing_area.applyViewTagScaleReference()
    expect(app.drawing_area.scale).toBeCloseTo(35000 * 100 / 100, 6) // porteur = DA
    expect(link.thickness).toBeCloseTo(100, 6)
  })
})
