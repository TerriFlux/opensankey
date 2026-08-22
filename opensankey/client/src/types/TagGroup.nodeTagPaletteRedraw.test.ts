import { Class_ApplicationData } from './ApplicationData'
import type { Class_LinkElement } from '../Elements/Link'
import type { Class_NodeElement } from '../Elements/Node'
import type { Class_NodeTag } from './Tag'
import type { Class_NodeTagGroup } from './TagGroup'

// ==================================================================================================
// #374 — Activer la palette d'un groupe d'étiquettes de NŒUDS doit recolorer les flux
// tout de suite, et non au geste suivant.
//
// En règle de couleur `auto` (comme en `source` / `target` / `gradient`), la couleur d'un
// flux est dérivée des tags de ses nœuds source/cible, filtrés sur `tag.group.use_colors`
// (Class_LinkElement.getShapeColorToUse). Or écrire `use_colors` déclenche
// `updateTagsReferences()`, qui ne redessine que les RÉFÉRENCES des tags du groupe — et
// les références d'un Class_NodeTag sont les NŒUDS SEULS.
//
// Le nœud relaie bien un redessin vers ses flux (Class_NodeElement.updateLinksPositions),
// mais SOUS CONDITION : `need_to_draw` n'est vrai que si le dessin est complet, si la
// position d'accroche a bougé d'au moins 1 px, ou si la représentation DOM du flux manque
// (`isRelatedD3SelectionPresentAndSynced`). Une bascule de palette ne déplace rien et le
// DOM est en place : le relais ne part pas, et les flux gardent leur couleur jusqu'à un
// geste qui force leur redessin (changement de dataTag, décochage d'une étiquette) — d'où
// le contournement observé.
//
// ⚠️ Deux précautions de test qui en découlent :
//  - le défaut est un REDESSIN MANQUANT, pas un mauvais calcul : `getShapeColorToUse()`
//    rend déjà la bonne couleur juste après la bascule, correctif ou non. Une assertion
//    sur sa valeur de retour passerait sans rien prouver ;
//  - hors navigateur, les flux n'ont pas de DOM synchronisé, donc le relais du nœud part
//    TOUJOURS et masquerait le défaut. Les tests neutralisent donc `node.draw()` pour
//    mesurer ce que la bascule de palette redessine PAR ELLE-MÊME — c'est exactement ce
//    dont l'app manque quand le relais conditionnel ne part pas.
// ==================================================================================================

if (typeof globalThis.structuredClone !== 'function') {
  globalThis.structuredClone = <T>(o: T): T => JSON.parse(JSON.stringify(o)) as T
}

/**
 * Diagramme minimal : Source → Cible portant tous deux l'étiquette d'un groupe de nœuds
 * (palette éteinte au départ), plus un flux À L'ÉCART entre deux nœuds sans étiquette,
 * témoin de ciblage.
 */
function buildDiagram() {
  const app = new Class_ApplicationData(false)
  const sankey = app.drawing_area.sankey

  const source = sankey.addNewNode('src', 'Source')
  const target = sankey.addNewNode('tgt', 'Cible')
  const link = sankey.addNewLink(source, target) as Class_LinkElement
  link.shape_color_rule = 'auto'

  const other_source = sankey.addNewNode('src_hors', 'Source hors groupe')
  const other_target = sankey.addNewNode('tgt_hors', 'Cible hors groupe')
  const other_link = sankey.addNewLink(other_source, other_target) as Class_LinkElement
  other_link.shape_color_rule = 'auto'

  const tagg = sankey.addNodeTagGroup('groupe', 'Groupe de nœuds', false) as Class_NodeTagGroup
  const tag = tagg.addTag('Etiquette A') as Class_NodeTag
  tag.color = '#543005'
  tag.addReference(source)
  tag.addReference(target)

  // Coupe le relais nœud → flux (cf. en-tête) : ce qui reste mesuré est le redessin
  // que la bascule de palette provoque d'elle-même.
  const nodes = [source, target, other_source, other_target] as Class_NodeElement[]
  nodes.forEach(n => jest.spyOn(n, 'draw').mockImplementation(() => { /* relais neutralisé */ }))

  return { app, sankey, link, other_link, tagg }
}

afterEach(() => jest.restoreAllMocks())

describe('#374 — palette d\'un groupe d\'étiquettes de nœuds', () => {
  it('redessine les flux incidents dès l\'activation de la palette', () => {
    const { link, tagg } = buildDiagram()
    expect(tagg.use_colors).toBe(false)

    const draw_link = jest.spyOn(link, 'draw')

    tagg.use_colors = true

    // Sans le correctif : aucun appel — seuls les nœuds étaient redessinés.
    expect(draw_link).toHaveBeenCalled()
  })

  it('redessine aussi à l\'extinction de la palette (et donc sur le chemin undo/redo)', () => {
    const { link, tagg } = buildDiagram()
    tagg.use_colors = true

    const draw_link = jest.spyOn(link, 'draw')

    // `revertPalette` (Toolbar) repasse par ce même setter.
    tagg.use_colors = false

    expect(draw_link).toHaveBeenCalled()
  })

  it('ne redessine pas les flux étrangers au groupe', () => {
    const { other_link, tagg } = buildDiagram()

    const draw_other = jest.spyOn(other_link, 'draw')

    tagg.use_colors = true

    expect(draw_other).not.toHaveBeenCalled()
  })

  it('n\'appelle draw qu\'une fois par flux, même si ses deux extrémités sont étiquetées', () => {
    const { link, tagg } = buildDiagram()

    const draw_link = jest.spyOn(link, 'draw')

    tagg.use_colors = true

    // Source ET cible portent l'étiquette : sans déduplication, deux appels.
    expect(draw_link).toHaveBeenCalledTimes(1)
  })

  it('ne fait rien quand la valeur écrite est inchangée', () => {
    const { link, tagg } = buildDiagram()

    const draw_link = jest.spyOn(link, 'draw')

    tagg.use_colors = false

    expect(draw_link).not.toHaveBeenCalled()
  })
})
