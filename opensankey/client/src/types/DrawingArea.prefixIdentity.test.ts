// os#1438 — LE PREFIXE DES IDENTIFIANTS DOM EST UNE QUESTION D IDENTITE, PLUS UNE DE PLACE.
//
// Le prefixe existe pour UNE raison : deux canevas dans le MEME document DOM se disputent
// `#g_drawing`, `#draw_zoom`, `#os_drop_shadow` — quatorze doublons mesures au lot 0.
//
// Le critere etait la PLACE (`container_selector === '#sankey_app'`), et c etait le bon choix
// ALORS : le lot 0 avait montre que « je suis la zone affichee de mon application » ne distingue
// rien des qu il y a deux applications. Ce n est plus vrai depuis le LOT 1 — l espace de travail a
// un document principal UNIQUE, donc le couple « principal ET zone affichee » est unique par
// construction, et il SURVIT au deplacement du canevas la ou le selecteur de conteneur change.
//
// CE QUE CA DEBLOQUE : detacher le canevas principal dans une fenetre de navigateur sans retourner
// a chaud les identifiants dont dependent l export SVG, les empreintes de rendu de corpus, les
// vignettes de vues et les cibles du tour guide.
//
// CE FICHIER FIGE LA NEUTRALITE, cas par cas, parce que c est la seule chose qui rende le
// changement sur. Si l un de ces cas bascule un jour, ce ne sera pas « un identifiant qui change » :
// ce sera un export, une empreinte de corpus et une vignette qui changent le meme jour, sans que
// rien ne le dise.

import { Class_Workspace } from './Workspace'
import { OFFSCREEN_CONTAINER_SELECTOR } from './Workspace'

if (typeof globalThis.structuredClone !== 'function') {
  globalThis.structuredClone = <T>(o: T): T => JSON.parse(JSON.stringify(o)) as T
}

describe('os#1438 le prefixe des identifiants structurels', () => {

  it('le canevas du document PRINCIPAL n est pas prefixe', () => {
    // Le cas de tous les jours, et celui qui doit rester identique a l octet pres : c est lui que
    // citent les exports, les empreintes et le tour guide.
    const ws = new Class_Workspace(false)
    const main = ws.createDocument()

    expect(main.drawing_area.dom_id_prefix).toBe('')
    expect(main.drawing_area.domId('g_drawing')).toBe('g_drawing')
    expect(main.drawing_area.is_main_document_canvas).toBe(true)
  })

  it('le canevas du principal reste NU meme cadre dans une pile', () => {
    // Cadre, il n est plus en disposition ordinaire, mais il est toujours LE canevas du principal
    // et il est toujours seul dans la page.
    const ws = new Class_Workspace(false)
    const main = ws.createDocument()
    main.main_zone_canvas_frame = { left: 0, top: 0, width: 400, height: 300 }

    expect(main.drawing_area.dom_id_prefix).toBe('')
  })

  it('le canevas du principal reste NU meme DEPLACE hors de la page', () => {
    // LE SEUL CAS QUI CHANGE, et c est le but : une fenetre fille est un AUTRE document DOM, le
    // canevas y est seul, il n y a aucune collision a prevenir. Avec l ancien critere — la place —
    // il se serait renomme en chemin, et l export SVG aurait change de forme selon que la fenetre
    // etait detachee ou non, ce qu aucun appelant n attend d un export.
    const ws = new Class_Workspace(false)
    const main = ws.createDocument()
    main.showIn('#ailleurs', null)

    expect(main.drawing_area.is_in_main_container).toBe(false)
    expect(main.drawing_area.dom_id_prefix).toBe('')
    expect(main.drawing_area.domId('draw_zoom')).toBe('draw_zoom')
  })

  it('le canevas d un AUTRE document est prefixe', () => {
    // Une feuille ouverte dans un volet, une source Excel, une brique : elles dessinent dans la
    // meme page que le principal, et c est exactement la collision du lot 0.
    const ws = new Class_Workspace(false)
    const main = ws.createDocument()
    const autre = ws.createDocument({ offscreen: true })

    expect(autre.is_main).toBe(false)
    expect(autre.drawing_area.dom_id_prefix).not.toBe('')
    expect(autre.drawing_area.domId('g_drawing')).not.toBe(main.drawing_area.domId('g_drawing'))
  })

  it('une AUTRE zone du principal est prefixee : un document en a plusieurs, une seule est affichee', () => {
    // Apercu unitaire, vue en coulisse, zone de mise en page temporaire. `is_main` ne suffit donc
    // pas : c est l identite de la ZONE qui tranche, et c est la seconde moitie du critere.
    const ws = new Class_Workspace(false)
    const main = ws.createDocument()
    const en_coulisse = main.createNewDrawingArea()

    expect(en_coulisse).not.toBe(main.drawing_area)
    expect(en_coulisse.is_main_document_canvas).toBe(false)
    expect(en_coulisse.dom_id_prefix).not.toBe('')
  })

  it('un document hors ecran est prefixe, ou qu il croie etre', () => {
    const ws = new Class_Workspace(false)
    ws.createDocument()
    const cache = ws.createDocument({ offscreen: true })

    expect(cache.drawing_area.container_selector).toBe(OFFSCREEN_CONTAINER_SELECTOR)
    expect(cache.drawing_area.dom_id_prefix).not.toBe('')
  })

  it('remplacer la zone affichee transporte le prefixe nu avec elle', () => {
    // Un changement de vue REMPLACE la zone de dessin (cf. `replaceDrawingArea`). Le critere
    // designe la zone AFFICHEE, pas un objet donne : la neuve doit hériter du prefixe nu, et
    // l ancienne le perdre — sinon deux zones du meme document le porteraient, ce qui est
    // exactement la collision qu on previent.
    const ws = new Class_Workspace(false)
    const main = ws.createDocument()
    const ancienne = main.drawing_area
    const neuve = main.createNewDrawingArea()
    expect(neuve.dom_id_prefix).not.toBe('')

    main.replaceDrawingArea(neuve)

    expect(neuve.dom_id_prefix).toBe('')
    expect(ancienne.dom_id_prefix).not.toBe('')
  })
})

describe('os#1438 ce que le prefixe nu garantit aux lecteurs du dehors', () => {

  it('les identifiants du principal ne dependent PAS de son identifiant de diagramme', () => {
    // C est ce qui fait qu un export SVG a la meme forme d un fichier a l autre. Un prefixe
    // porterait `drawing_area.id`, qui vient du fichier de l utilisateur.
    const ws = new Class_Workspace(false)
    const main = ws.createDocument()
    const avant = main.drawing_area.domId('g_elements_sankey')

    // `id` derive du sankey : c est lui qu on change, comme le fait une bascule de vue.
    main.drawing_area.sankey.id = 'un_identifiant_venu_du_fichier'

    expect(main.drawing_area.domId('g_elements_sankey')).toBe(avant)
  })

  it('le selecteur vise par attribut, et non par #, car un prefixe peut porter n importe quoi', () => {
    const ws = new Class_Workspace(false)
    ws.createDocument()
    const autre = ws.createDocument({ offscreen: true })
    autre.drawing_area.sankey.id = 'vue:avec des espaces.et.des.points'

    const selecteur = autre.drawing_area.domIdSelector('g_drawing')

    expect(selecteur.startsWith('[id="')).toBe(true)
    expect(() => document.querySelectorAll(selecteur)).not.toThrow()
  })
})
