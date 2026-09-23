import { Class_ApplicationData } from './ApplicationData'
import {
  MAIN_ZONE_CANVAS_ID, MAIN_ZONE_SPREADSHEET_ID,
  MAIN_ZONE_FLOATING_DEFAULT_SIZE, MAIN_ZONE_FLOATING_MIN_SIZE, MAX_MAIN_ZONE_FLOATING
} from './MenuConfig'

/**
 * sa#563 (lots 1 a 3) — UN VOLET PEUT FLOTTER, et c est un occupant ORDINAIRE a une troisieme
 * place.
 *
 * La pop-up de presentation d un element etait un PANNEAU : un mecanisme parallele a celui des
 * volets, avec sa propre geometrie, sa propre persistance et son propre rendu, ou rien n etait
 * selectionnable ni reglable. Elle est devenue un volet de la grande zone, place 'floating'.
 *
 * Ces epreuves figent ce que le MODELE doit en dire, et rien de plus : la place existe, elle ne
 * prend aucune case, elle n emporte pas l invariant du volet principal, et les deux deplacements
 * n effacent rien. Le rendu (lisere, poignees, boutons) se verifie cote editeur.
 */

const newMc = () => new Class_ApplicationData(false).menu_configuration

describe('sa#563 un volet flottant est un occupant, a une troisieme place', () => {

  it('un volet flottant ne prend AUCUNE case de la grille', () => {
    const mc = newMc()
    mc.openMainZoneWindow({ kind: 'node', id: 'n1' }, 'osp.repr.unit', 'floating')
    // La grille n a pas bouge : le canevas est toujours seul, principal.
    expect(mc.main_zone_grid_occupants.map(o => o.id)).toEqual([MAIN_ZONE_CANVAS_ID])
    expect(mc.mainZoneOccupantsIn('right')).toHaveLength(0)
    expect(mc.mainZoneOccupantsIn('bottom')).toHaveLength(0)
    expect(mc.mainZoneOccupantsIn('floating')).toHaveLength(1)
    // Et il ne reserve rien : un volet flottant se pose SUR le dessin, il ne le rogne pas.
    expect(mc.getMainZoneBottomReservedPx()).toBe(0)
  })

  it('il nait ACTIF : c est lui que regle la colonne d outils (lot 3)', () => {
    const mc = newMc()
    const id = mc.openMainZoneWindow({ kind: 'node', id: 'n1' }, 'osp.repr.unit', 'floating')
    expect(mc.main_zone_active_id).toBe(id)
    expect(mc.isMainZoneFloating(id)).toBe(true)
  })

  it('il a TOUJOURS une geometrie, bornee', () => {
    const mc = newMc()
    const id = mc.openMainZoneWindow({ kind: 'node', id: 'n1' }, 'osp.repr.unit', 'floating')
    const born = mc.mainZoneOccupantById(id)?.geometry
    expect(born).toBeDefined()
    expect(born?.w).toBe(MAIN_ZONE_FLOATING_DEFAULT_SIZE.w)
    // Une taille absurde est ramenee dans les bornes, jamais refusee en silence.
    mc.setMainZoneOccupantGeometry(id, { x: -500, y: -500, w: 10, h: 10 })
    const clamped = mc.mainZoneOccupantById(id)?.geometry
    expect(clamped?.w).toBe(MAIN_ZONE_FLOATING_MIN_SIZE.w)
    expect(clamped?.h).toBe(MAIN_ZONE_FLOATING_MIN_SIZE.h)
    expect(clamped?.x).toBe(0)
    expect(clamped?.y).toBe(0)
  })

  it('un volet flottant se FERME toujours, meme s il est le dernier volet ouvert', () => {
    // `hideMainZoneOccupant` refuse de retirer le dernier occupant — une grande zone vide n a
    // rien pour se rallumer. Ce refus ne vaut que pour la GRILLE : la croix d un volet flottant
    // est le seul moyen de s en debarrasser, et il ne laisse aucune case vide derriere lui.
    const mc = newMc()
    const id = mc.openMainZoneWindow({ kind: 'node', id: 'n1' }, 'osp.repr.unit', 'floating')
    expect(mc.hideMainZoneOccupant(id)).toBe(true)
    expect(mc.isMainZoneOccupant(id)).toBe(false)
    // Le canevas, dernier occupant de la grille, reste inamovible.
    expect(mc.hideMainZoneOccupant(MAIN_ZONE_CANVAS_ID)).toBe(false)
  })

  it('un volet flottant n est JAMAIS promu fenetre principale par la normalisation', () => {
    // Le defaut qu on ferme : sans occupant de grille, la promotion prenait « le premier venu »,
    // et un volet qu on vient d ouvrir au-dessus du diagramme devenait le diagramme.
    const mc = newMc()
    const id = mc.openMainZoneWindow({ kind: 'node', id: 'n1' }, 'osp.repr.unit', 'floating')
    // On vide la grille par la porte de l etat d URL (le geste d auteur, lui, refuse) : elle
    // conserve les fenetres a identifiant propre et remplace le reste, donc il ne reste que le
    // volet flottant — le cas que la normalisation doit rattraper.
    mc.setMainZoneOccupantIds([])
    expect(mc.mainZonePlaceOf(id)).toBe('floating')
    // La grande zone a retrouve son canevas, principal.
    expect(mc.main_zone_main_id).toBe(MAIN_ZONE_CANVAS_ID)
  })

  it('« mettre en principale » un flottant renvoie le diagramme a droite, et non flotter', () => {
    const mc = newMc()
    const id = mc.openMainZoneWindow({ kind: 'node', id: 'n1' }, 'osp.repr.unit', 'floating')
    mc.makeMainZoneOccupantMain(id)
    expect(mc.mainZonePlaceOf(id)).toBe('main')
    expect(mc.mainZonePlaceOf(MAIN_ZONE_CANVAS_ID)).toBe('right')
  })
})

describe('sa#563 (lot 2) les deux deplacements n effacent rien', () => {

  it('« Ancrer en volet » puis « Faire flotter » gardent sujet, nature, reglages et geometrie', () => {
    const mc = newMc()
    const id = mc.openMainZoneWindow({ kind: 'node', id: 'n1' }, 'osp.repr.unit', 'floating')
    mc.setMainZoneOccupantGeometry(id, { x: 300, y: 200, w: 480, h: 420 })
    mc.setMainZonePaneOptions(id, 'n1', { value_mode: 'value' })
    const before = mc.mainZonePaneOptionsOf(id, 'n1')['value_mode']

    // Ancrer en volet : il rejoint la grande zone.
    mc.setMainZoneOccupantPlace(id, 'right')
    expect(mc.mainZonePlaceOf(id)).toBe('right')
    expect(mc.mainZoneOccupantById(id)?.subject).toEqual({ kind: 'node', id: 'n1' })
    expect(mc.mainZoneOccupantById(id)?.representation).toBe('osp.repr.unit')
    expect(mc.mainZonePaneOptionsOf(id, 'n1')['value_mode']).toBe(before)

    // Faire flotter : il en ressort AU MEME ENDROIT.
    mc.setMainZoneOccupantPlace(id, 'floating')
    expect(mc.mainZoneOccupantById(id)?.geometry).toEqual({ x: 300, y: 200, w: 480, h: 420 })
    expect(mc.mainZonePaneOptionsOf(id, 'n1')['value_mode']).toBe(before)
  })

  it('faire flotter un volet de la grille lui donne une geometrie, sans lui en voler une', () => {
    const mc = newMc()
    mc.showMainZoneOccupant(MAIN_ZONE_SPREADSHEET_ID, 'right')
    expect(mc.mainZoneOccupantById(MAIN_ZONE_SPREADSHEET_ID)?.geometry).toBeUndefined()
    mc.setMainZoneOccupantPlace(MAIN_ZONE_SPREADSHEET_ID, 'floating')
    expect(mc.mainZoneOccupantById(MAIN_ZONE_SPREADSHEET_ID)?.geometry).toBeDefined()
    // Le diagramme est reste la fenetre principale : le tableur n a rien pris a personne.
    expect(mc.main_zone_main_id).toBe(MAIN_ZONE_CANVAS_ID)
  })
})

describe('sa#563 le plafond de cinq volets flottants', () => {

  it('le sixieme ferme le plus ANCIEN, et jamais un volet de la grille', () => {
    const mc = newMc()
    const ids: string[] = []
    for (let i = 0; i < MAX_MAIN_ZONE_FLOATING; i++) {
      ids.push(mc.openMainZoneWindow({ kind: 'node', id: 'n' + i }, 'osp.repr.unit', 'floating'))
    }
    expect(mc.mainZoneOccupantsIn('floating')).toHaveLength(MAX_MAIN_ZONE_FLOATING)

    mc.enforceMainZoneFloatingCap('')
    const sixth = mc.openMainZoneWindow({ kind: 'node', id: 'n9' }, 'osp.repr.unit', 'floating')
    expect(mc.mainZoneOccupantsIn('floating')).toHaveLength(MAX_MAIN_ZONE_FLOATING)
    expect(mc.isMainZoneOccupant(ids[0])).toBe(false)
    expect(mc.isMainZoneOccupant(sixth)).toBe(true)
    // Le diagramme n a pas ete compte dans le plafond : il n a jamais flotte.
    expect(mc.isMainZoneOccupant(MAIN_ZONE_CANVAS_ID)).toBe(true)
  })
})

describe('sa#563 la geometrie survit au fichier', () => {

  it('la place et la geometrie se relisent telles quelles', () => {
    const mc = newMc()
    const id = mc.openMainZoneWindow({ kind: 'link', id: 'l1' }, 'os.repr.element_info', 'floating')
    mc.setMainZoneOccupantGeometry(id, { x: 120, y: 90, w: 500, h: 400 })
    const json = mc.mainZoneStateToJSON()

    const reread = newMc()
    reread.mainZoneStateFromJSON(json)
    const back = reread.mainZoneOccupantById(id)
    expect(back?.place).toBe('floating')
    expect(back?.geometry).toEqual({ x: 120, y: 90, w: 500, h: 400 })
    expect(back?.subject).toEqual({ kind: 'link', id: 'l1' })
  })

  it('un fichier SANS volet flottant n ecrit aucune geometrie', () => {
    // La cle ne parait que la ou elle dit quelque chose : un document d aujourd hui doit rester
    // identique a celui qu ecrivait la version d avant ce lot.
    const mc = newMc()
    const occupants = mc.mainZoneStateToJSON()['occupants'] as { [id: string]: unknown }
    Object.values(occupants).forEach(entry => {
      expect(Object.keys(entry as object)).not.toContain('geometry')
    })
  })
})
