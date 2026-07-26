// OS#1337 — test de fumée, complément d'`elementInitCycle.test.ts` : ici on ÉVALUE vraiment
// les modules, au lieu de raisonner sur les sources.
//
// Ce qui a cassé le démarrage (cf. db8b44a49) : le graphe des Elements entré par
// `Element.tsx`, qui refermait un cycle sur `class Class_Handler extends Class_BaseElement`
// et jetait « can't access lexical declaration 'Class_BaseElement' before initialization ».
// Chaque cas ci-dessous entre le graphe par une arête différente, sur un registre de modules
// neuf : c'est justement l'arête d'entrée qui décide si un cycle latent explose ou non.
//
// Portée limitée, assumée : entrer par `editor/traductions` (ce que fait `index.tsx`, qu'on
// ne peut pas importer puisqu'il monte React pour de vrai) est hors d'atteinte — jest 27 ne
// sait pas résoudre le champ `exports` de `@chakra-ui/utils`, et corriger cela demanderait
// un `moduleNameMapper` dans le bloc `jest` que CRA/CI refusent. C'est le test de graphe qui
// couvre tous les chemins ; celui-ci constate le symptôme sur les entrées atteignables.

describe('#1337 le graphe des Elements s\'évalue sans TDZ', () => {
  beforeEach(() => {
    // Sans registre neuf, les modules déjà évalués par le cas précédent masqueraient le
    // problème : le cycle ne mord qu'à la PREMIÈRE évaluation.
    jest.resetModules()
  })

  it('entré par Element (l\'ordre qui a cassé le démarrage)', () => {
    expect(() => {
      /* eslint-disable @typescript-eslint/no-var-requires */
      require('./Element')
      require('./Handler')
      require('./SelectionZone')
      /* eslint-enable @typescript-eslint/no-var-requires */
    }).not.toThrow()
  })

  it('entré par Handler, celui qui porte le `extends` au niveau module', () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    expect(() => require('./Handler').Class_Handler).not.toThrow()
  })

  it('entré par SelectionZone', () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    expect(() => require('./SelectionZone').Class_ZoneSelection).not.toThrow()
  })

  it('entré par types/Utils, la porte de l\'ancien cycle', () => {
    expect(() => {
      /* eslint-disable @typescript-eslint/no-var-requires */
      require('../types/Utils')
      require('./Element')
      /* eslint-enable @typescript-eslint/no-var-requires */
    }).not.toThrow()
  })
})
