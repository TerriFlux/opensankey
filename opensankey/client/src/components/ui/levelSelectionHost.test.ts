import { Class_ApplicationData } from '../../types/ApplicationData'
import { applyLevelSelection } from './levelSelectionHost'

if (typeof globalThis.structuredClone !== 'function') {
  globalThis.structuredClone = <T>(o: T): T => JSON.parse(JSON.stringify(o)) as T
}

// os#1522 — DEPUIS « MIXTE », CHOISIR UN NIVEAU RE-AGREGE PUIS APPLIQUE, EN UN SEUL PAS D ANNULATION.
// La liste de niveau passe `resetLocalHierarchy` en `prepare` : il doit tourner AVANT la lecture de
// l etat de depart (niveau courant, noeuds visibles), et dans le MEME instantane.

describe('os#1522 — changer de niveau depuis une coupe irreguliere', () => {
  const monter = () => {
    const app = new Class_ApplicationData(false)
    app.drawing_area.bypass_redraws = true
    const sankey = app.drawing_area.sankey
    const niveaux = sankey.addLevelTagGroup('niv', 'Niveau')
    niveaux.addTag('Niveau 1', 'n1')
    niveaux.addTag('Niveau 2', 'n2')
    niveaux.selectTagsFromId('n1')
    return { app, sankey, niveaux }
  }

  test('prepare tourne avant le changement, et un seul Annuler defait les deux', () => {
    const { app, sankey, niveaux } = monter()
    const nom_avant = sankey.name
    const vu_par_prepare: string[] = []
    applyLevelSelection(app, niveaux, 'n2', () => undefined, () => {
      vu_par_prepare.push(niveaux.selected_tags_list.map(t => t.id).join(','))
      sankey.name = 'apres prepare'
    })
    expect(vu_par_prepare).toEqual(['n1'])
    expect(niveaux.selected_tags_list.map(t => t.id)).toEqual(['n2'])
    expect(sankey.name).toBe('apres prepare')

    app.history.applyUndo()
    const relu = app.drawing_area.sankey
    expect(relu.name).toBe(nom_avant)
    expect(relu.level_taggs_dict['niv'].selected_tags_list.map(t => t.id)).toEqual(['n1'])
    expect(app.history.can_undo).toBe(false)
  })

  test('sans prepare, le geste est celui d avant', () => {
    const { app, niveaux } = monter()
    applyLevelSelection(app, niveaux, 'n2')
    expect(niveaux.selected_tags_list.map(t => t.id)).toEqual(['n2'])
  })
})
