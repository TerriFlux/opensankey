// os#1467 — TOUTE NATURE SERT LE SOCLE COMMUN.
//
// Julien : « chaque graphe est a la fois quelque chose de general, avec des attributs communs a
// tous les graphes, et des attributs specifiques. Il faut les deux, ce n est pas l un ou l autre.
// Et tout le look and feel doit etre similaire d un graphe a l autre, comme sur Excel. »
//
// CE FICHIER EST LA MOITIE QUI MANQUAIT. Le catalogue declare chaque question une fois et chaque
// nature pioche ce qui a du sens chez elle (os#1425) : c est le modele d Excel, et il marche. Mais
// tout y etait FACULTATIF — d ou des natures inegales, chacune servant ce dont on se souvenait le
// jour ou on l a ecrite. Le sunburst sert 56 reglages, la couronne et les barres en servaient 27.
//
// L ecart ne se voyait nulle part : rien ne cassait, chaque figure fonctionnait, et seul l usage
// disait qu on ne peut pas mettre en gras le nom d un secteur de couronne alors qu on le peut sur
// un sunburst. C est le pire genre de defaut — celui qui se decouvre a l ecran, un par un, et que
// j ai corrige trois fois de suite sans voir qu il n y en avait qu un.

import {
  FIGURE_COMMON_HONOURS, figureCommonMisses
} from './figureCommonHonours'
// os#1467 — ON LIT LES DECLARATIONS, PAS LE MODULE QUI LES ENREGISTRE. Importer
// `registerOSPRepresentations` entrainerait React et, de proche en proche, un module ESM que le
// jest de ce paquet ne sait pas lire : la suite echouerait AU CHARGEMENT. C est la raison d etre
// de `analysisFigureAttributes` (cf. son en-tete).
import { BARS_ATTRIBUTES, DONUT_ATTRIBUTES } from './analysisFigureAttributes'
// os#1473 — et le sunburst, maintenant qu ils vivent tous dans le meme paquet.
import { SUNBURST_ATTRIBUTES } from './sunburstAttributes'

if (typeof globalThis.structuredClone !== 'function') {
  globalThis.structuredClone = <T>(o: T): T => JSON.parse(JSON.stringify(o)) as T
}

/**
 * Les natures qui dessinent des PARTS — celles que le socle engage.
 *
 * ⚠️ CETTE LISTE EST LE DERNIER ENDROIT OU L ON EN TIENT UNE, et elle est vouee a fondre. Depuis
 * os#1479, une nature declaree par `registerFigureNature` sert le socle PAR CONSTRUCTION — il n y a
 * plus de chemin pour l oublier — et c est `figureNature.test` qui le grave, sur une nature d essai
 * qui ne nomme aucune cle du socle.
 *
 * Restent ici les natures qui declarent leurs attributs a la main. Le sunburst en est une : son
 * trace ne lit pas `part_aspect`, il compose le style de ses secteurs lui-meme, et le faire passer
 * par la porte unique demanderait de le reecrire. La couronne et les barres y sont encore parce que
 * leurs jeux complets (`DONUT_ATTRIBUTES`, `BARS_ATTRIBUTES`) sont lus ailleurs qu au registre.
 */
const NATURES: [string, { [k: string]: unknown }][] = [
  ['sunburst', SUNBURST_ATTRIBUTES as unknown as { [k: string]: unknown }],
  ['couronne', DONUT_ATTRIBUTES as unknown as { [k: string]: unknown }],
  ['barres', BARS_ATTRIBUTES as unknown as { [k: string]: unknown }]
]

describe('os#1467 les trois natures servent le socle commun', () => {

  NATURES.forEach(([nom, attributes]) => {
    it(`la ${nom} ne laisse aucune question du socle sans reponse`, () => {
      const misses = figureCommonMisses(attributes)

      // Le message porte la LISTE : ce qu on veut lire quand ce test tombe, c est quelles
      // questions cette figure ne sait pas poser.
      expect(misses).toEqual([])
    })
  })

  it('le socle nest pas vide, et il ne se vide pas par megarde', () => {
    // Garde-fou du garde-fou : un socle reduit a rien ferait passer les tests ci-dessus sans rien
    // verifier. Le nombre exact n est pas la question — qu il reste substantiel, si.
    expect(FIGURE_COMMON_HONOURS.length).toBeGreaterThan(30)
  })

  it('os#1477 les six cles qui ATTENDAIENT y sont entrees', () => {
    // Elles etaient tenues dehors expres (`FIGURE_COMMON_HONOURS_A_VENIR`, retiree depuis) : un
    // socle qu on ne tient pas devient un test rouge qu on apprend a ignorer. Ce qui les retenait
    // n etait pas une declaration mais du DESSIN — la couronne et les barres montaient leur titre
    // par un traceur qui n en portait que cinq reglages sur onze.
    const attendaient = [
      'title_italic', 'title_font_family', 'title_color', 'title_align', 'title_wrap', 'text_zones'
    ]
    attendaient.forEach(cle => expect(FIGURE_COMMON_HONOURS).toContain(cle))
    // Et la consequence, qui est le vrai sujet : les TROIS natures les servent. Les cas ci-dessus
    // le disent deja pour le socle entier ; celui-ci nomme ce que ce lot a change.
    NATURES.forEach(([nom, attributes]) => {
      const manquantes = attendaient.filter(cle => attributes[cle] === undefined)
      expect([nom, manquantes]).toEqual([nom, []])
    })
  })
})
