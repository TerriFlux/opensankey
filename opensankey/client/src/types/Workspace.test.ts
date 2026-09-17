// os#1385 lot 1 — L'ESPACE DE TRAVAIL naît, et le document devient un document.
//
// Ce que ce fichier verrouille, c'est exactement ce que les quatre applications
// « accidentelles » de la session devaient contourner à la main avant lui : la langue, les
// licences et le mode de page recopiés un par un, le conteneur hors écran posé deux fois, la
// configuration de menus rachetée pour seulement charger un fichier. Un document naît
// maintenant DANS un espace de travail, qui les lui donne tous d'un coup.

import { Class_Workspace, OFFSCREEN_CONTAINER_SELECTOR } from './Workspace'
import { Class_ApplicationData } from './ApplicationData'
import { DRAW_TOPIC, PANELS_TOPIC } from './EventBus'
import type { Type_JSON } from './Utils'

const deepClone = <T>(o: T): T => JSON.parse(JSON.stringify(o)) as T

describe('os#1385 — Class_Workspace : les documents', () => {

  it('createDocument enregistre le document et nomme le premier affichable main', () => {
    const ws = new Class_Workspace(false)
    expect(ws.documents.length).toBe(0)
    expect(ws.main).toBeNull()

    const doc_a = ws.createDocument()
    expect(ws.documents).toContain(doc_a)
    expect(ws.main).toBe(doc_a)
    expect(doc_a.is_main).toBe(true)
    expect(doc_a.workspace).toBe(ws)

    // Le second est enregistré, mais le principal ne change pas de main.
    const doc_b = ws.createDocument()
    expect(ws.documents.length).toBe(2)
    expect(ws.main).toBe(doc_a)
    expect(doc_b.is_main).toBe(false)
  })

  it('un document hors ecran nest jamais le document principal', () => {
    const ws = new Class_Workspace(false)
    const hidden = ws.createDocument({ offscreen: true })
    expect(ws.documents).toContain(hidden)
    expect(ws.main).toBeNull()
    expect(hidden.is_main).toBe(false)
  })

  it('forgetDocument retire le document et libere main', () => {
    const ws = new Class_Workspace(false)
    const doc = ws.createDocument()
    ws.forgetDocument(doc)
    expect(ws.documents).not.toContain(doc)
    expect(ws.main).toBeNull()
  })

  it('le constructeur booleen cree un espace de travail prive dont le document est main', () => {
    const doc = new Class_ApplicationData(true)
    expect(doc.workspace).toBeInstanceOf(Class_Workspace)
    expect(doc.workspace.main).toBe(doc)
    expect(doc.is_main).toBe(true)
    // Le mode de page vient de cet espace privé, plus de la zone de dessin.
    expect(doc.is_static).toBe(true)
    expect(doc.drawing_area.static).toBe(true)
    // Deux documents booléens ne partagent rien.
    const other = new Class_ApplicationData(false)
    expect(other.workspace).not.toBe(doc.workspace)
    expect(other.is_static).toBe(false)
  })
})

describe('os#1385 — hors ecran : le conteneur est pose sur la FABRIQUE', () => {

  it('offscreen pose le conteneur sur la zone courante ET sur toute zone creee ensuite', () => {
    const ws = new Class_Workspace(false)
    const hidden = ws.createDocument({ offscreen: true })
    expect(hidden.drawing_area.container_selector).toBe(OFFSCREEN_CONTAINER_SELECTOR)
    // Le chargement en crée d'autres en chemin (vue lourde extraite, source de mise en page),
    // et l'une d'elles dessine : c'est la fabrique qu'il faut envelopper, pas la première zone.
    expect(hidden.createNewDrawingArea().container_selector).toBe(OFFSCREEN_CONTAINER_SELECTOR)
    // Et un reset() en construit une neuve, qui doit hériter du même conteneur.
    hidden.reset()
    expect(hidden.drawing_area.container_selector).toBe(OFFSCREEN_CONTAINER_SELECTOR)
  })

  it('un document affiche garde le conteneur principal', () => {
    const ws = new Class_Workspace(false)
    const doc = ws.createDocument()
    expect(doc.drawing_area.container_selector).toBe('#sankey_app')
  })
})

describe('os#1385 — ce que lespace de travail donne a un document secondaire', () => {

  it('langue, licences et mode de page sont ceux de lespace, sans aucune recopie', () => {
    const ws = new Class_Workspace(true)
    const marker = ((key: string) => 'TRADUIT:' + key) as unknown as Class_ApplicationData['t']
    ws.t = marker
    ws.has_sankey_plus = true
    ws.has_sankey_afm = true
    ws.has_sankey_dev = true

    const second = ws.createDocument({ offscreen: true })
    expect(second.t).toBe(marker)
    expect(second.has_sankey_plus).toBe(true)
    expect(second.has_sankey_afm).toBe(true)
    expect(second.has_sankey_dev).toBe(true)
    expect(second.is_static).toBe(true)
    // Les options de publication sont l'objet de l'espace, pas une copie : les viewers
    // React MUTENT ses champs et le document doit voir la mutation.
    expect(second.publish_options).toBe(ws.publish_options)
  })

  it('ecrire une licence par le document ecrit dans lespace de travail', () => {
    const ws = new Class_Workspace(false)
    const doc_a = ws.createDocument()
    const doc_b = ws.createDocument({ offscreen: true })
    expect(doc_b.has_sankey_plus).toBe(false)
    doc_a.has_sankey_plus = true
    expect(ws.has_sankey_plus).toBe(true)
    expect(doc_b.has_sankey_plus).toBe(true)
  })
})

describe('os#1385 — la configuration de menus : hote partage, document propre', () => {

  it('deux documents partagent les panneaux de lhote', () => {
    const ws = new Class_Workspace(false)
    const doc_a = ws.createDocument()
    const doc_b = ws.createDocument()
    expect(doc_a.menu_configuration).not.toBe(doc_b.menu_configuration)
    expect(doc_a.menu_configuration.panels).toBe(doc_b.menu_configuration.panels)
    expect(doc_a.menu_configuration.panels).toBe(ws.menu_configuration.panels)
  })

  it('un topic dHOTE traverse les documents, un topic de DOCUMENT non', () => {
    const ws = new Class_Workspace(false)
    const doc_a = ws.createDocument()
    const doc_b = ws.createDocument()

    let host_heard = 0
    let document_heard = 0
    doc_a.menu_configuration.subscribe(PANELS_TOPIC, () => { host_heard++ })
    doc_a.menu_configuration.subscribe(DRAW_TOPIC, () => { document_heard++ })

    doc_b.menu_configuration.notify(PANELS_TOPIC)
    doc_b.menu_configuration.notify(DRAW_TOPIC)

    // Les panneaux sont de l'hôte : un seul bus, quel que soit le document qui parle.
    expect(host_heard).toBe(1)
    // Le dessin est du DOCUMENT : une fenêtre qui regarde B ne doit pas se redessiner
    // parce que A s'est dessiné (c'est toute la raison d'un bus par document).
    expect(document_heard).toBe(0)

    doc_a.menu_configuration.notify(DRAW_TOPIC)
    expect(document_heard).toBe(1)
  })
})

describe('os#1385 — persistance : seul le document principal ecrit la disposition de lhote', () => {

  /**
   * Un fichier valide, avec un bloc `panels` qui demande une barre latérale large.
   *
   * os#1385 (lot 4) — À LA RACINE, donc un fichier ANTÉRIEUR à la clé `workspace` : c'est
   * exactement la forme dont la relecture doit rester capable (repli racine).
   */
  const fileWithPanels = (source: Class_ApplicationData, width_px: number): Type_JSON => {
    const file = source.toJSON() as Type_JSON
    delete file['workspace']
    file['panels'] = {
      sidebar_id: '', sidebar_width_px: width_px, sidebar_open: false, popups: {}
    } as unknown as Type_JSON
    return file
  }

  it('un document secondaire ne remplace pas les panneaux de lutilisateur', () => {
    const ws = new Class_Workspace(false)
    const doc_a = ws.createDocument()
    const doc_b = ws.createDocument({ offscreen: true })
    const host_panels = ws.menu_configuration.panels
    host_panels.sidebar_width_px = 300

    const file = fileWithPanels(doc_a, 500)

    // Ouvrir une fenêtre sur une autre feuille remplaçait la barre latérale de
    // l'utilisateur par celle enregistrée dans cette feuille-là.
    doc_b.fromJSON(deepClone(file), {}, false)
    expect(host_panels.sidebar_width_px).toBe(300)

    // Le document principal, lui, la restaure comme avant.
    doc_a.fromJSON(deepClone(file), {}, false)
    expect(host_panels.sidebar_width_px).toBe(500)
  })

  it('un document secondaire ne resérialise pas les panneaux de lhote', () => {
    const ws = new Class_Workspace(false)
    ws.createDocument()
    const second = ws.createDocument({ offscreen: true })
    // os#1385 (lot 4) — les panneaux sont sous la clé racine `workspace`, plus à la racine.
    expect('workspace' in (second.toJSON() as Type_JSON)).toBe(false)
    const main_json = ws.main!.toJSON() as Type_JSON
    expect('panels' in main_json).toBe(false)
    expect('panels' in (main_json['workspace'] as Type_JSON)).toBe(true)
  })
})

describe('os#1385 — sheetApplication rend un document de lespace de travail', () => {

  it('lapplication de lecture dune feuille est un document hors ecran, sans recopie', () => {
    const ws = new Class_Workspace(false)
    const marker = ((key: string) => 'TRADUIT:' + key) as unknown as Class_ApplicationData['t']
    ws.t = marker
    const doc = ws.createDocument()
    // Une seconde feuille : la première devient un instantané, donc chargeable à part.
    doc.createNewSheet(false)
    const first_sheet = doc.sheets_order[0]

    const sheet_app = doc.sheetApplication(first_sheet)
    expect(sheet_app).not.toBeNull()
    expect(sheet_app).not.toBe(doc)
    expect(sheet_app!.workspace).toBe(ws)
    expect(ws.documents).toContain(sheet_app!)
    expect(sheet_app!.is_main).toBe(false)
    // Rien n'a été recopié : c'est le même objet de traduction, le même mode de page.
    expect(sheet_app!.t).toBe(marker)
    expect(sheet_app!.is_static).toBe(doc.is_static)
    expect(sheet_app!.drawing_area.container_selector).toBe(OFFSCREEN_CONTAINER_SELECTOR)
    // Le cache rend la MÊME application tant que l'instantané n'a pas changé.
    expect(doc.sheetApplication(first_sheet)).toBe(sheet_app)
  })

  it('supprimer une feuille retire son document de lespace de travail', () => {
    const ws = new Class_Workspace(false)
    const doc = ws.createDocument()
    doc.createNewSheet(false)
    const first_sheet = doc.sheets_order[0]
    const sheet_app = doc.sheetApplication(first_sheet)!
    expect(ws.documents).toContain(sheet_app)
    doc.deleteSheet(first_sheet, false)
    expect(ws.documents).not.toContain(sheet_app)
  })
})
