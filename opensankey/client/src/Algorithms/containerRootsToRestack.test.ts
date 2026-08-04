import { containerRootsToRestack, Type_ContainerCandidate } from './NodePositioningGeometry'

// Garde de régression pour l'issue #365 — à la réouverture d'un fichier, deux enfants successifs
// d'un cadre englobant (`container_mode`) se chevauchaient.
//
// Mécanisme. Un fichier ≥ 1.1.5 enregistre les nœuds par leur CENTRE (`node_pos_is_center`). À
// l'ouverture, le placement global rétablit chaque enfant individuellement (coin = centre −
// hauteur/2). Or un centre enregistré sous un datatag ne vaut que pour LES HAUTEURS DE CE
// DATATAG : rouvrir sous un autre datatag rapproche deux enfants de la moitié de l'écart de
// hauteur. C'est `restackContainerChildren` qui doit rattraper ça en ré-empilant la pile depuis
// le haut du cadre — sauf qu'il ne parcourait que les cadres VISIBLES.
//
// Et un cadre peut très bien être masqué pendant que ses membres sont dessinés : sa visibilité
// suit ses flux PROPRES, qu'un cadre en `in_children_out_children` n'a par construction pas à
// montrer (cf. #368). Le ré-empilement ne se déclenchait donc pas à l'ouverture, et se
// déclenchait au premier changement de datatag — d'où un premier rendu chevauché puis un
// affichage correct ensuite.
//
// Mesuré sur le modèle SOCLE « Détail des modes de production », fichier enregistré sous le
// millésime 2023 (centres de Maïs grain et Blé tendre espacés de 219,22 px) :
//   2015 — écart requis 249,10 → chevauchement 29,88 px
//   2019 — écart requis 239,31 → chevauchement 20,09 px
//   2023 — écart requis 219,22 → 0
//
// Ce test isole la SÉLECTION des cadres (la seule chose corrigée) ; l'empilement lui-même est
// inchangé et reste du ressort de `stackContainerChildren`.

const cadre = (): Type_ContainerCandidate => ({
  dimensions_as_parent: [{ container_mode: 'in_children_out_children' }],
  dimensions_as_child: [],
})

const feuille = (): Type_ContainerCandidate => ({
  dimensions_as_parent: [],
  dimensions_as_child: [{ container_mode: 'in_children_out_children' }],
})

describe('#365 — containerRootsToRestack : quels cadres voient leurs enfants ré-empilés', () => {
  it('retient un cadre englobant de premier niveau', () => {
    const c = cadre()
    expect(containerRootsToRestack([c, feuille()])).toEqual([c])
  })

  it('retient un cadre MASQUÉ (le défaut de #365)', () => {
    // Le cœur du correctif : la sélection ne doit pas lire `is_visible`. Un cadre sans flux
    // propre visible était masqué, ses enfants n'étaient pas ré-empilés, et ils rouvraient
    // chevauchés. On lui pose ici la propriété pour verrouiller le fait qu'elle est ignorée.
    const c = { ...cadre(), is_visible: false }
    expect(containerRootsToRestack([c])).toEqual([c])
  })

  it('écarte un nœud ordinaire (ni parent ni enfant de cadre)', () => {
    expect(containerRootsToRestack([{ dimensions_as_parent: [], dimensions_as_child: [] }]))
      .toEqual([])
  })

  it('écarte une dimension hiérarchique SANS container_mode (désagrégation simple)', () => {
    // Un parent de dimension ordinaire n'est pas un cadre : ses enfants sont placés par la
    // désagrégation, pas par un empilement de cadre.
    expect(containerRootsToRestack([{
      dimensions_as_parent: [{}], dimensions_as_child: [],
    }])).toEqual([])
  })

  it('écarte un SOUS-cadre imbriqué (il est traité par la descente de sa racine)', () => {
    // Empiler un sous-cadre pour lui-même ajouterait ses marges entre deux groupes de feuilles
    // et casserait l'écart au 2ᵉ niveau — l'empilement est à plat depuis la racine.
    expect(containerRootsToRestack([{
      dimensions_as_parent: [{ container_mode: 'in_children_out_children' }],
      dimensions_as_child: [{ container_mode: 'in_children_out_children' }],
    }])).toEqual([])
  })

  it('retient un cadre parent de PLUSIEURS dimensions dont une seule est englobante', () => {
    const c = {
      dimensions_as_parent: [{}, { container_mode: 'in_children_out_parent' }],
      dimensions_as_child: [],
    }
    expect(containerRootsToRestack([c])).toEqual([c])
  })
})
