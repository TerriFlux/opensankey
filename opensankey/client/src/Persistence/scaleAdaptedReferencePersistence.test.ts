import { Class_ApplicationData } from '../types/ApplicationData'
import { getPublishOptions } from '../types/PublishOptions'
import type { Type_JSON } from '../types/Utils'

// os#1352 — RÉGIME de référence du mode « échelle adaptée » (`scale_adapted_reference`).
//
// sa#384 avait remplacé la règle « tenir la taille rendue d'un ÉLÉMENT de référence désigné » par
// « tenir la GRANDEUR du diagramme » (somme de la colonne la plus haute). Le remplacement était
// PUR : plus aucun moyen de retrouver l'ancien comportement. Or un document composé autour d'un
// élément de référence n'est pas équivalent sous les deux règles — CARTOFOB, calé sur le stock
// « Bois sur pied », voit même la colonne dimensionnante changer d'identité d'une vue d'essence à
// l'autre (constaté le 14/08 : la publication servie par le runtime 1.1.8 se comporte bien, la
// même donnée servie par 1.2.1 non).
//
// Les deux régimes coexistent donc, `diagram` restant le défaut. Ce fichier fige le CONTRAT :
// défaut, round-trip, rétro-compatibilité, option de page, et le signalement qui manquait à
// l'ancien régime. La démonstration CHIFFRÉE sur le vrai document est dans
// `Algorithms/scaleAdaptedCartofob.test.ts`.

function deepClone<T>(o: T): T {
  return JSON.parse(JSON.stringify(o)) as T
}

const reload = (json: Type_JSON): Class_ApplicationData => {
  const app = new Class_ApplicationData(false)
  app.fromJSON(deepClone(json) as never, {}, false)
  return app
}

describe('os#1352 — régime de référence de l\'« échelle adaptée » : persistance', () => {
  it('vaut `diagram` par défaut et n\'écrit alors aucune clé', () => {
    const app = new Class_ApplicationData(false)
    expect(app.drawing_area.scale_adapted_reference).toBe('diagram')
    const json = app.toJSON() as Type_JSON
    // Valeur usine : la clé n'est même pas écrite (aucun fichier existant ne grossit).
    expect(json['scale_adapted_reference']).toBeUndefined()
  })

  it('écrit et relit le régime `element`', () => {
    const app = new Class_ApplicationData(false)
    app.drawing_area.scale_adapted_reference = 'element'
    const json = app.toJSON() as Type_JSON
    expect(json['scale_adapted_reference']).toBe('element')
    expect(reload(json).drawing_area.scale_adapted_reference).toBe('element')
  })

  it('round-trippe `element` sur deux enregistrements successifs', () => {
    const app = new Class_ApplicationData(false)
    app.drawing_area.scale_adapted_reference = 'element'
    const once = app.toJSON() as Type_JSON
    const twice = reload(once).toJSON() as Type_JSON
    expect(twice['scale_adapted_reference']).toBe('element')
  })

  it('ouvre en `diagram` un fichier sans la clé, MÊME s\'il porte un élément de référence', () => {
    // Point de conception : la rétro-compatibilité n'est PAS automatique. Un fichier d'avant
    // sa#384 porte `shape_is_reference_flux` / `shape_is_reference_stock` — mais ces marqueurs
    // servent aussi au mode proportionnel et au plafond d'épaisseur par view tag, donc leur
    // présence ne prouve pas que l'auteur veut ce régime pour l'échelle adaptée. Surtout, tout
    // document publié depuis sa#384 a été composé sous le régime `diagram` : basculer sur le seul
    // vu d'un marqueur changerait leur apparence sans geste de leur auteur. Le régime est un
    // choix EXPLICITE (réglage du document, ou option de page pour comparer).
    const app = new Class_ApplicationData(false)
    const json = app.toJSON() as Type_JSON
    delete (json as Record<string, unknown>)['scale_adapted_reference']
    expect(reload(json).drawing_area.scale_adapted_reference).toBe('diagram')
  })

  it('ramène une valeur inconnue au défaut plutôt que d\'échouer', () => {
    const app = new Class_ApplicationData(false)
    const json = app.toJSON() as Record<string, unknown>
    json['scale_adapted_reference'] = 'grandeur_du_cosmos'
    expect(reload(json as Type_JSON).drawing_area.scale_adapted_reference).toBe('diagram')
  })
})

describe('os#1352 — option de page `scale_adapted_reference`', () => {
  const w = window as unknown as { sankey?: Record<string, unknown> }
  const previous = w.sankey
  afterEach(() => { w.sankey = previous })

  const read = (v: unknown) => {
    w.sankey = v === undefined ? {} : { scale_adapted_reference: v }
    return getPublishOptions().scale_adapted_reference
  }

  it('accepte les deux régimes et ignore le reste', () => {
    // Sert à COMPARER les deux régimes sur une page publiée sans refabriquer les données.
    expect(read('element')).toBe('element')
    expect(read('diagram')).toBe('diagram')
    // Valeur inconnue ou absente ⇒ null ⇒ le réglage du document est conservé (pas d'écrasement
    // silencieux par une option mal orthographiée).
    expect(read('autre')).toBeNull()
    expect(read(undefined)).toBeNull()
  })
})

describe('os#1352 — le régime `element` SIGNALE au lieu de figer l\'échelle en silence', () => {
  it('avertit quand aucun élément de référence n\'est désigné', () => {
    const app = new Class_ApplicationData(false)
    const da = app.drawing_area
    da.scale_adapted_reference = 'element'
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => { })
    try {
      // C'est exactement le défaut qui avait motivé le retrait du régime en sa#384 : l'échelle
      // n'était pas adaptée, et RIEN ne le disait.
      da.nodePositioning.applyAdaptedScale()
      expect(warn).toHaveBeenCalled()
      expect(String(warn.mock.calls[0][0])).toContain('échelle adaptée')
      expect(da.nodePositioning.scaleAdaptedWarning).toBeDefined()
    } finally {
      warn.mockRestore()
    }
  })

  it('ne journalise qu\'une fois tant que la sélection ne change pas', () => {
    const app = new Class_ApplicationData(false)
    const da = app.drawing_area
    da.scale_adapted_reference = 'element'
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => { })
    try {
      // Le dessin repasse par là à chaque frame : sans déduplication, la console se remplit.
      da.nodePositioning.applyAdaptedScale()
      da.nodePositioning.applyAdaptedScale()
      da.nodePositioning.applyAdaptedScale()
      expect(warn).toHaveBeenCalledTimes(1)
    } finally {
      warn.mockRestore()
    }
  })

  it('le régime `diagram` reste muet (aucun élément requis)', () => {
    const app = new Class_ApplicationData(false)
    const da = app.drawing_area
    expect(da.scale_adapted_reference).toBe('diagram')
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => { })
    try {
      da.nodePositioning.applyAdaptedScale()
      expect(warn).not.toHaveBeenCalled()
      expect(da.nodePositioning.scaleAdaptedWarning).toBeUndefined()
    } finally {
      warn.mockRestore()
    }
  })

  it('changer de régime oublie la capture (grandeurs non commensurables)', () => {
    const app = new Class_ApplicationData(false)
    const da = app.drawing_area
    da.nodePositioning.restoreScaleReference(1000, 42)
    expect(da.nodePositioning.scaleAdaptedReference).toEqual({ scale: 1000, magnitude: 42 })
    // Une hauteur de colonne et la taille d'un élément ne se comparent pas : garder la capture
    // ferait composer un ratio entre deux grandeurs sans rapport → saut d'échelle.
    da.scale_adapted_reference = 'element'
    expect(da.nodePositioning.scaleAdaptedReference).toBeUndefined()
  })
})
