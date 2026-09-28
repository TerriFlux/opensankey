import { Class_ApplicationData } from './ApplicationData'
import type { Class_DataTag } from './Tag'
import type { Class_DataTagGroup } from './TagGroup'

// jest 27 / jsdom n'expose pas structuredClone (utilise par Link.copyFrom)
if (typeof globalThis.structuredClone !== 'function') {
  globalThis.structuredClone = <T>(o: T): T => JSON.parse(JSON.stringify(o)) as T
}

// os#1511 lot 2, partie A — LE MODELE.
//
// Un noeud peut representer un AXE entier (« Monde » est l axe des pays) : au niveau courant, il
// se remplace par un noeud par membre visible. Les noeuds ainsi engendres sont TRANSITOIRES,
// jamais ecrits — seul l ATTACHEMENT l est. Ce qu on deplace a l ecran survit par la GEOMETRIE
// portee par le MEMBRE, qui est persistant, lui.

function monter() {
  const app = new Class_ApplicationData(false)
  const sankey = app.drawing_area.sankey
  const pays = sankey.addDataTagGroup('pays', 'Pays', false) as unknown as Class_DataTagGroup
  const monde = pays.addTag('Monde', 'monde') as Class_DataTag
  const europe = pays.addTag('Europe', 'europe') as Class_DataTag
  const afrique = pays.addTag('Afrique', 'afrique') as Class_DataTag
  const france = pays.addTag('France', 'france') as Class_DataTag
  const espagne = pays.addTag('Espagne', 'espagne') as Class_DataTag
  const maroc = pays.addTag('Maroc', 'maroc') as Class_DataTag
  europe.parent = monde
  afrique.parent = monde
  france.parent = europe
  espagne.parent = europe
  maroc.parent = afrique
  pays.levels = ['monde', 'regions', 'pays']
  const noeud = sankey.addNewNodeWithName('Monde')
  return { app, sankey, pays, monde, europe, afrique, france, espagne, maroc, noeud }
}

describe('os#1511 lot 2 — un noeud represente une dimension', () => {
  test('l attachement se pose et se lit', () => {
    const { pays, noeud } = monter()
    expect(noeud.is_driven_by_dimension).toBe(false)
    noeud.driving_dimension = pays
    expect(noeud.driving_dimension?.id).toBe('pays')
    expect(noeud.is_driven_by_dimension).toBe(true)
    noeud.driving_dimension = undefined
    expect(noeud.is_driven_by_dimension).toBe(false)
  })

  test('une dimension FANTOME laisse un noeud ordinaire', () => {
    const { noeud } = monter()
    // Cas d un fichier incoherent : mieux vaut un noeud ordinaire qu un noeud rattache a un
    // axe qui n existe pas.
    noeud.setDrivingDimensionId('dimension_qui_n_existe_pas')
    expect(noeud.driving_dimension).toBeUndefined()
    expect(noeud.is_driven_by_dimension).toBe(false)
  })
})

describe('os#1511 lot 2 — la geometrie est portee par le MEMBRE', () => {
  test('la position se pose, se lit, et n est pas partagee par reference', () => {
    const { france } = monter()
    expect(france.position).toBeUndefined()
    france.position = { x: 120, y: 340 }
    expect(france.position).toEqual({ x: 120, y: 340 })
    // On rend une COPIE : sans cela, muter l objet rendu deplacerait le membre en douce.
    const lu = france.position!
    lu.x = 999
    expect(france.position?.x).toBe(120)
  })

  test('une position NON FINIE est refusee', () => {
    const { france } = monter()
    france.position = { x: 10, y: 20 }
    france.position = { x: Number('pas un nombre'), y: 5 }
    // Elle ne place rien et se propagerait en silence dans le dessin : l ancienne reste.
    expect(france.position).toEqual({ x: 10, y: 20 })
  })

  test('les coordonnees geographiques se posent sur le membre', () => {
    const { france } = monter()
    france.latitude = 46.6
    france.longitude = 2.3
    expect(france.effective_coordinates).toEqual({ latitude: 46.6, longitude: 2.3 })
  })
})

describe('os#1511 lot 2 — un parent sans coordonnees prend le BARYCENTRE de ses feuilles', () => {
  test('une region se pose au milieu de ses pays, sans saisie', () => {
    const { europe, france, espagne } = monter()
    france.latitude = 46
    france.longitude = 2
    espagne.latitude = 40
    espagne.longitude = -4
    expect(europe.effective_coordinates).toEqual({ latitude: 43, longitude: -1 })
  })

  test('ses PROPRES coordonnees priment sur le barycentre', () => {
    const { europe, france, espagne } = monter()
    france.latitude = 46
    france.longitude = 2
    espagne.latitude = 40
    espagne.longitude = -4
    europe.latitude = 50
    europe.longitude = 10
    expect(europe.effective_coordinates).toEqual({ latitude: 50, longitude: 10 })
  })

  test('on moyenne les FEUILLES de la descendance, pas les enfants directs', () => {
    const { monde, france, espagne, maroc } = monter()
    // Europe a deux pays, Afrique un seul. Moyenner les deux REGIONS donnerait un poids egal a
    // l Afrique et a l Europe ; on moyenne les trois PAYS.
    france.latitude = 48
    france.longitude = 3
    espagne.latitude = 40
    espagne.longitude = 0
    maroc.latitude = 32
    maroc.longitude = -6
    expect(monde.effective_coordinates?.latitude).toBeCloseTo(40)
    expect(monde.effective_coordinates?.longitude).toBeCloseTo(-1)
  })

  test('sans aucune feuille situee, on ne place rien plutot qu au hasard', () => {
    const { monde } = monter()
    expect(monde.effective_coordinates).toBeUndefined()
  })
})

describe('os#1511 lot 2 — persistance ADDITIVE : un fichier sans rien ne change pas', () => {
  test('un membre jamais deplace n ecrit aucune cle de geometrie', () => {
    const { france } = monter()
    const json = france.toJSON()
    expect(json['x']).toBeUndefined()
    expect(json['y']).toBeUndefined()
    expect(json['latitude']).toBeUndefined()
    expect(json['longitude']).toBeUndefined()
  })

  test('la geometrie du membre SURVIT a l aller-retour — toute la raison de ce choix', () => {
    const { app, france } = monter()
    france.position = { x: 120, y: 340 }
    france.latitude = 46.6
    france.longitude = 2.3

    const json = app.toJSON()
    const relu = new Class_ApplicationData(false)
    relu.fromJSON(json)
    const groupe = relu.drawing_area.sankey.data_taggs_dict['pays'] as unknown as Class_DataTagGroup
    const france_relue = groupe.tags_dict['france'] as Class_DataTag
    expect(france_relue.position).toEqual({ x: 120, y: 340 })
    expect(france_relue.latitude).toBe(46.6)
    expect(france_relue.longitude).toBe(2.3)
  })

  test('l attachement du noeud SURVIT, et lui seul — aucun noeud engendre n est ecrit', () => {
    const { app, pays, noeud, sankey } = monter()
    noeud.driving_dimension = pays
    const noeuds_avant = sankey.nodes_list.length

    const json = app.toJSON()
    // On verifie d abord l ECRITURE, puis la relecture : sans cela un echec ne dit pas de quel
    // cote il vient.
    const noeud_ecrit = (json['nodes'] as Record<string, Record<string, unknown>>)[noeud.id]
    expect(noeud_ecrit['driving_dimension']).toBe('pays')

    const relu = new Class_ApplicationData(false)
    relu.fromJSON(json)
    const sankey_relu = relu.drawing_area.sankey
    const noeud_relu = sankey_relu.nodes_dict[noeud.id]
    expect(noeud_relu.driving_dimension?.id).toBe('pays')
    // Le fichier ne contient QUE le noeud qui represente l axe : les noeuds par membre sont
    // transitoires, ils se refabriqueront a l ouverture (partie B).
    expect(sankey_relu.nodes_list.length).toBe(noeuds_avant)
  })

  test('une position A MOITIE ecrite est ignoree plutot que completee', () => {
    const { france } = monter()
    const json = france.toJSON()
    json['x'] = 42
    france.fromJSON(json)
    // Un x sans y ne place rien : inventer la coordonnee manquante serait pire que de ne rien
    // poser du tout.
    expect(france.position).toBeUndefined()
  })
})
