import * as fs from 'fs'
import * as path from 'path'

import { Class_ApplicationData } from '../types/ApplicationData'
import type { Class_DataTag } from '../types/Tag'
import type { Class_NodeElement } from './Node'
import type { Type_JSON } from '../types/Utils'

// ==================================================================================================
// #371 — Un cadre englobant QUI PORTE DES FLUX PROPRES doit rester dessiné tant qu'il
// a un membre visible, même quand ces flux sont nuls / `structurally_absent` pour la
// sélection de dataTags courante.
//
// Réciproque du #364 (masquer un cadre vidé), diagnostiquée en le traitant : le cadre
// était éliminé par `checkIfLinksVisibilitiesAreOK` AVANT d'atteindre la règle
// orphelin, donc n'atteignait jamais la porte du #364 ; un cadre SANS aucun flux
// propre sortait, lui, par le `return true` du cas « 0 lien » et restait affiché.
// Deux cadres au contenu visible identique tombaient ainsi de part et d'autre.
//
// La correction est venue de `Class_NodeElement.is_visible_as_container_frame` (#368),
// qui ouvre à `is_visible` une troisième porte ne consultant PAS les flux propres.
// Ce test verrouille la politique sur le cas de #371, que #368 n'exerçait pas : le
// masquage y venait d'un ORDRE DE CALCUL au premier rendu, ici d'une sélection de
// dataTags — deux chemins distincts vers la même porte.
//
// Le fichier de repro est celui joint à l'issue : deux cadres identiques à un détail
// près, chacun avec deux enfants (l'un mesuré sur les deux axes, l'autre absent sur
// l'axe B) ; seul le premier porte en plus un flux propre `→ Cible`, mesuré sur
// l'axe A et `structurally_absent` sur l'axe B. Sur l'axe B les deux groupes ont donc
// exactement le même contenu visible : toute différence de rendu vient du flux propre.
// ==================================================================================================

if (typeof globalThis.structuredClone !== 'function') {
  globalThis.structuredClone = <T>(o: T): T => JSON.parse(JSON.stringify(o)) as T
}

const FIXTURE = path.join(__dirname, '__fixtures__', 'ticket371_container_frame_own_links.json')

function loadRepro(mutate?: (json: Type_JSON) => void): Class_ApplicationData {
  const json = JSON.parse(fs.readFileSync(FIXTURE, 'utf-8')) as Type_JSON
  if (mutate) mutate(json)
  const app = new Class_ApplicationData(false)
  app.fromJSON(json as never, {}, false)
  return app
}

/** Sélectionne une seule tranche du groupe « Axe » (bannière `one`, comme dans l'app). */
function selectAxis(app: Class_ApplicationData, tag_id: string) {
  const tagg = app.drawing_area.sankey.data_taggs_dict['axe']
  expect(tagg).toBeDefined()
  tagg.tags_list.forEach(tag => {
    // setSelected/setUnSelected (et non le setter nu `is_selected`) : eux seuls
    // mettent à jour le fingerprint dont dépend le recalcul des visibilités.
    if (tag.id === tag_id) (tag as Class_DataTag).setSelected()
    else (tag as Class_DataTag).setUnSelected()
  })
}

function node(app: Class_ApplicationData, id: string): Class_NodeElement {
  const n = app.drawing_area.sankey.nodes_dict[id]
  expect(n).toBeDefined()
  return n as Class_NodeElement
}

describe('#371 — cadre englobant portant des flux propres nuls pour la sélection', () => {
  it('affiche les deux cadres et leurs quatre membres sur l\'axe A (état de départ)', () => {
    const app = loadRepro()
    selectAxis(app, 'axe A')

    expect(node(app, 'GroupeAvecFluxPropre').is_visible).toBe(true)
    expect(node(app, 'GroupeSansFluxPropre').is_visible).toBe(true)
    expect(node(app, 'EnfantMesure').is_visible).toBe(true)
    expect(node(app, 'EnfantAbsent').is_visible).toBe(true)
    expect(node(app, 'TemoinMesure').is_visible).toBe(true)
    expect(node(app, 'TemoinAbsent').is_visible).toBe(true)
  })

  it('garde le cadre à flux propre sur l\'axe B, où son seul flux est structurellement absent', () => {
    const app = loadRepro()
    selectAxis(app, 'axe B')

    // Le contenu visible des deux groupes est identique : un enfant mesuré, un absent.
    expect(node(app, 'EnfantMesure').is_visible).toBe(true)
    expect(node(app, 'EnfantAbsent').is_visible).toBe(false)
    expect(node(app, 'TemoinMesure').is_visible).toBe(true)
    expect(node(app, 'TemoinAbsent').is_visible).toBe(false)

    // Donc les deux cadres doivent l'être aussi. C'est le défaut de #371 : seul le
    // premier disparaissait, à cause de son unique flux propre `structurally_absent`.
    expect(node(app, 'GroupeSansFluxPropre').is_visible).toBe(true)
    expect(node(app, 'GroupeAvecFluxPropre').is_visible).toBe(true)
  })

  it('masque toujours les deux cadres quand plus aucun membre n\'est visible (#364)', () => {
    // Garde du sens SOUSTRACTIF : la porte ouverte par #368 pour le cas de #371 ne
    // doit pas ressusciter les cadres vidés. Cas dérivé du même fichier — on rend
    // aussi les deux enfants mesurés absents sur l'axe B, ce qui vide les deux
    // cadres exactement comme un axe de ventilation qui ne concerne pas la filière.
    const app = loadRepro(json => {
      const links = json['links'] as Record<string, Type_JSON>;
      ['EnfantMesure---Cible', 'TemoinMesure---Cible'].forEach(id => {
        const per_axis = (links[id]['value'] as Type_JSON)['kt'] as Type_JSON
        per_axis['axe B'] = { structurally_absent: true } as never
      })
    })
    selectAxis(app, 'axe B')

    expect(node(app, 'EnfantMesure').is_visible).toBe(false)
    expect(node(app, 'TemoinMesure').is_visible).toBe(false)
    expect(node(app, 'GroupeAvecFluxPropre').is_visible).toBe(false)
    expect(node(app, 'GroupeSansFluxPropre').is_visible).toBe(false)
  })
})
