import { containerFrameIsEmptied, isContainerFrame, hasVisibleFrameMember, Type_ContainerFrameDim } from './containerFrameVisibility'

// Garde de régression pour l'issue #364 — sur un diagramme filtré par un groupe de
// dataTags (ici un axe de ventilation), les cadres englobants des groupes SANS
// donnée pour la sélection courante restaient affichés, vides, avec leur libellé,
// empilés en haut à gauche du diagramme.
//
// Cause : un parent en `container_mode` n'a aucun flux VISIBLE par construction (le
// mode englobant masque les siens et donne la parole à ceux de ses enfants). Il
// tombait donc dans la règle « nœud orphelin » de `Class_NodeElement.orphan_visible`
// — dont l'option par-nœud `shape_orphan_node_visible` est activée PAR DÉFAUT — qui
// le maintenait affiché. Ses enfants, eux, disparaissaient correctement : leurs
// propres flux sont nuls ou `structurally_absent` pour la sélection.
//
// Correctif : un cadre dont aucun membre n'est visible est masqué. Ce test isole la
// POLITIQUE PURE ; la cascade de visibilité (dataTags → flux → nœud) reste du
// ressort de `Class_NodeElement`.

const dim = (
  container_mode: unknown,
  visibilities: boolean[]
): Type_ContainerFrameDim => ({
  container_mode,
  children: visibilities.map(is_visible => ({ is_visible })),
})

describe('#364 — containerFrameIsEmptied : masquage d\'un cadre englobant sans membre visible', () => {
  it('masque le cadre dont aucun enfant n\'est visible (le défaut de #364)', () => {
    // Cas mesuré sur l'axe « Signe de qualité (SIQO) » : la filière « Sucre » n'est
    // pas concernée, son unique enfant est masqué, le cadre restait pourtant là.
    expect(containerFrameIsEmptied([dim('in_children_out_children', [false])])).toBe(true)
  })

  it('garde le cadre dès qu\'UN enfant reste visible', () => {
    expect(containerFrameIsEmptied([dim('in_children_out_children', [false, true, false])])).toBe(false)
  })

  it('ne touche pas à un nœud ordinaire (aucune dimension en mode englobant)', () => {
    // Sans cette porte, tout parent désagrégé « simple » (force_show_children, donc
    // container_mode nul) verrait la règle orphelin lui échapper.
    expect(containerFrameIsEmptied([dim(null, [false, false])])).toBe(false)
    expect(containerFrameIsEmptied([])).toBe(false)
  })

  it('ne touche pas à un nœud sans enfant, fût-il marqué d\'un mode englobant', () => {
    // Un cadre sans membre n'est pas un cadre vidé par la sélection : c'est un nœud
    // que rien n'englobe. Il reste soumis à la règle orphelin d'origine.
    expect(containerFrameIsEmptied([dim('in_children_out_children', [])])).toBe(false)
  })

  it('juge sur l\'UNION des dimensions englobantes (nœud à plusieurs nomenclatures)', () => {
    // Un même parent peut englober selon deux dimensions : il suffit d'un membre
    // visible sur l'une pour que le cadre ait quelque chose à entourer.
    const dims = [dim('in_children_out_children', [false]), dim('in_children_out_children', [true])]
    expect(containerFrameIsEmptied(dims)).toBe(false)
    expect(containerFrameIsEmptied([dims[0], dim('in_children_out_children', [false])])).toBe(true)
  })

  it('ignore les enfants d\'une dimension NON englobante', () => {
    // Les enfants d'une désagrégation simple prennent la place du parent au lieu de
    // s'y loger : ils ne sont pas des membres du cadre.
    expect(containerFrameIsEmptied([
      dim('in_children_out_children', [false]),
      dim(null, [true]),
    ])).toBe(true)
  })

  it('vaut pour tous les modes englobants, pas seulement in_children_out_children', () => {
    // Les autres modes laissent au parent des flux propres visibles : la règle
    // orphelin ne s'y déclenche pas et la question ne se pose pas. Mais si elle se
    // pose, la réponse est la même — le cadre n'a rien à entourer.
    expect(containerFrameIsEmptied([dim('in_parent_out_children', [false])])).toBe(true)
  })

  it('expose les deux moitiés de la décision', () => {
    expect(isContainerFrame([dim('in_children_out_children', [false])])).toBe(true)
    expect(isContainerFrame([dim(null, [true])])).toBe(false)
    expect(hasVisibleFrameMember([dim('in_children_out_children', [false, true])])).toBe(true)
    expect(hasVisibleFrameMember([dim(null, [true])])).toBe(false)
  })
})

// Garde de régression pour l'issue #368 — la décision RÉCIPROQUE. Au premier rendu,
// un cadre englobant PORTANT des flux propres tous invisibles pour la sélection
// courante n'était pas dessiné du tout, alors qu'un cadre n'en portant AUCUN restait
// affiché par la règle orphelin : deux résultats visuels différents pour deux cadres
// qui ne se distinguent que par un détail de modélisation. Mesuré sur le modèle
// transversal SOCLE « Détail des modes de production » (millésime 2015) : les cadres
// « Céréales » (2 flux propres) et « Œufs » (5) manquaient, « Vin » et
// « Oléoprotéagineux » (0 flux propre) étaient là.
//
// Correctif : `Class_NodeElement.is_visible_as_container_frame` dessine le cadre dès
// qu'il a un membre visible, sans consulter ses flux — `hasVisibleFrameMember` sert
// donc désormais les deux sens de la même politique.
describe('#368 — hasVisibleFrameMember : affichage d\'un cadre englobant à membre visible', () => {
  it('dessine le cadre qui a un membre visible, qu\'il porte ou non des flux propres', () => {
    // La fonction ne voit délibérément AUCUN flux : c'est là tout le correctif — le
    // « Céréales » à 2 flux invisibles et le « Vin » à 0 flux donnent la même vue.
    expect(hasVisibleFrameMember([dim('in_children_out_children', [true, false])])).toBe(true)
    expect(hasVisibleFrameMember([dim('in_children_out_children', [false, false, true])])).toBe(true)
  })

  it('est exactement le complémentaire de containerFrameIsEmptied sur un vrai cadre', () => {
    // Les deux décisions ne peuvent jamais être vraies ensemble ni fausses ensemble
    // dès qu'il s'agit d'un cadre englobant : masquer (#364) et dessiner (#368)
    // partagent le même pivot.
    for (const visibilities of [[true], [false], [true, false], [false, false]]) {
      const dims = [dim('in_children_out_children', visibilities)]
      expect(hasVisibleFrameMember(dims)).toBe(!containerFrameIsEmptied(dims))
    }
  })

  it('ne réveille aucun nœud ordinaire : la porte exige un mode englobant', () => {
    // Un parent désagrégé « simple » (container_mode nul) reste soumis à la règle des
    // flux : ses enfants prennent sa place, ils ne sont pas les membres d'un cadre.
    expect(hasVisibleFrameMember([dim(null, [true, true])])).toBe(false)
    expect(hasVisibleFrameMember([])).toBe(false)
    // Idem pour une feuille marquée d'un mode englobant sans aucun enfant : rien à
    // entourer, donc rien à forcer.
    expect(hasVisibleFrameMember([dim('in_children_out_children', [])])).toBe(false)
  })

  it('juge sur l\'UNION des dimensions englobantes', () => {
    // Cadre selon deux nomenclatures : un seul membre visible suffit à le dessiner.
    expect(hasVisibleFrameMember([
      dim('in_children_out_children', [false, false]),
      dim('in_children_out_children', [true]),
    ])).toBe(true)
    // Un enfant visible porté par une dimension NON englobante ne compte pas.
    expect(hasVisibleFrameMember([
      dim('in_children_out_children', [false]),
      dim(null, [true]),
    ])).toBe(false)
  })
})
