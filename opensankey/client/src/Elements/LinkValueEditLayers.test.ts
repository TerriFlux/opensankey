import { Class_ApplicationData } from '../types/ApplicationData'

// ==================================================================================================
// os#1359 — LA SAISIE VA DANS LA COUCHE QUE LON REGARDE.
//
// Les donnees collectees et les resultats reconcilies sont deux jeux distincts, et la
// reconciliation ne fusionne jamais les seconds dans les premiers. Le setter de valeur, lui,
// ecrivait toujours dans le collecte ET jetait le resultat : corriger un affichage en mode
// « Calculees » ecrasait donc une donnee dentree que lutilisateur ne voyait meme pas, et
// perdait la reconciliation dans le meme geste.
//
// Ces tests fixent la regle : on ecrit la couche affichee, lautre survit.
// ==================================================================================================

if (typeof globalThis.structuredClone !== 'function') {
  globalThis.structuredClone = <T>(o: T): T => JSON.parse(JSON.stringify(o)) as T
}

/** Un flux unique entre deux noeuds, sans aucune valeur posee. */
function buildDiagram() {
  const app = new Class_ApplicationData(false)
  const { drawing_area } = app
  const { sankey } = drawing_area
  const source = sankey.addNewNode('source', 'Source')
  const cible = sankey.addNewNode('cible', 'Cible')
  source.position_u = 1
  cible.position_u = 2
  const lien = sankey.addNewLink(source, cible)
  return { app, drawing_area, sankey, lien }
}

/** Le meme flux, mais reconcilie : 100 collectes, 110 sortis du solveur. */
function buildReconciledDiagram() {
  const built = buildDiagram()
  const value = built.lien.value!
  // Ordre impose : `valueData` perime le resultat, il faut donc poser la donnee AVANT.
  value.valueData = 100
  value.valueResult = 110
  return built
}

describe('os#1359 — une saisie de valeur necrase plus lautre couche', () => {

  it('sans reconciliation, la saisie reste la donnee collectee', () => {
    const { lien } = buildDiagram()
    lien.valueCurrent = 42
    expect(lien.value!.valueData).toBe(42)
    expect(lien.value!.valueResult).toBeNull()
  })

  it('en couche Calculees, corriger un flux reconcilie preserve la donnee collectee', () => {
    const { drawing_area, lien } = buildReconciledDiagram()
    drawing_area.type_data = 'reconciled'
    lien.valueCurrent = 120
    expect(lien.value!.valueResult).toBe(120)
    expect(lien.value!.valueData).toBe(100)
    expect(lien.valueCurrent).toBe(120)
  })

  it('en couche Collectees, la saisie ecrit la donnee et perime le resultat', () => {
    const { drawing_area, lien } = buildReconciledDiagram()
    // `data_source` seul ne suffit pas : `interval_display` vaut 'free_value' par defaut, et
    // la couche effectivement lue reste alors le reconcilie. Le setter `type_data` pose les deux.
    drawing_area.type_data = 'data'
    lien.valueCurrent = 130
    expect(lien.value!.valueData).toBe(130)
    expect(lien.value!.valueResult).toBeNull()
  })

  it('revenir en arriere sur une correction daffichage rend le flux intact', () => {
    const { drawing_area, lien } = buildReconciledDiagram()
    drawing_area.type_data = 'reconciled'
    // Ce que fait `Class_LinkElement.updateLinks` : il memorise la valeur affichee et la
    // repose par le meme setter. Avant os#1359, ce retour ecrivait le collecte et la donnee
    // dentree ne revenait jamais.
    const avant = lien.valueCurrent
    lien.valueCurrent = 120
    lien.valueCurrent = avant
    expect(lien.value!.valueResult).toBe(110)
    expect(lien.value!.valueData).toBe(100)
  })

  it('la valeur destination suit la meme regle', () => {
    const { drawing_area, lien } = buildReconciledDiagram()
    const value = lien.value!
    value.valueDataTarget = 90
    value.valueResultTarget = 95
    drawing_area.type_data = 'reconciled'
    lien.valueCurrentTarget = 99
    expect(value.valueResultTarget).toBe(99)
    expect(value.valueDataTarget).toBe(90)
  })

})
