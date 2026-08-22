import { tiedFrameRefitLeft, Type_TiedFrameRefitInput } from './tiedFrameRefit'

// Garde de régression pour l'issue #363 — sur un diagramme à parents en mode
// englobant (`container_mode`), le cadre s'ouvrait DÉCALÉ À DROITE : il entourait
// les formes des enfants mais pas leurs libellés, placés à gauche et à l'extérieur
// (`name_label_horiz: 'left'` + `name_label_inside_horiz: false`). Un simple clic
// sur un membre le replaçait correctement.
//
// Cause : la TAILLE du cadre est label-incluse (`_envelopeSize` lit le `getBBox()`
// du SVG, donc le débord des libellés), mais son COIN ne l'était qu'en fin de drag
// (`expandToContainAttachedNodes`). Coin et taille venaient donc de deux sources
// différentes : le cadre avait la bonne largeur, translatée du débord. Mesuré sur
// le modèle SOCLE « Détail des modes de production » : décalages de 34 à 165 px
// selon la filière.
//
// Correctif : recaler le bord gauche à chaque dessin, une fois les libellés
// mesurés. Ce test isole la POLITIQUE PURE (quand suivre l'enveloppe), la mesure
// restant du ressort de `Class_NodeBase._computeEnvelopeBBox`.

const base: Type_TiedFrameRefitInput = {
  current_left: 260,
  envelope_min_x: 260,
  envelope_max_x: 450,
  margin_left: 0,
  margin_right: 0,
  shape_min_width: 0,
}

describe('#363 — tiedFrameRefitLeft : recalage horizontal du cadre englobant', () => {
  it('suit le débord des libellés à gauche (le défaut de #363)', () => {
    // Cas mesuré sur « Oléoprotéagineux » : libellé de « Tournesol » débordant de
    // 164,6 px à gauche du nœud.
    expect(tiedFrameRefitLeft({ ...base, envelope_min_x: 95.4 })).toBe(95.4)
  })

  it('ne bouge pas quand le cadre est déjà sur l\'enveloppe (idempotence)', () => {
    // Indispensable : la passe tourne à CHAQUE dessin ; si elle « bougeait »
    // toujours, chaque dessin redessinerait les cadres pour rien.
    expect(tiedFrameRefitLeft(base)).toBeNull()
  })

  it('tient compte de la marge gauche du cadre', () => {
    // La comparaison porte sur la boîte de CONTENU : bord = position_x + marge.
    // Ici le contenu commence à 265 et l'enveloppe à 95,4 → il faut suivre.
    expect(tiedFrameRefitLeft({
      ...base, current_left: 265, margin_left: 5, envelope_min_x: 95.4,
    })).toBe(95.4)
  })

  it('suit un resserrement des libellés quand la largeur du cadre est celle de l\'enveloppe', () => {
    // Symétrique du défaut : en police verrouillée, la largeur des libellés en
    // unités monde varie avec le zoom. Sans ce rattrapage, un dézoom suivi d'un
    // rezoom laisserait le cadre débordant à gauche de ses membres.
    expect(tiedFrameRefitLeft({
      ...base, current_left: 95.4, envelope_min_x: 150,
    })).toBe(150)
  })

  it('ne défait pas un cadre volontairement ÉLARGI (OS#1259)', () => {
    // shape_min_width (600) dépasse la largeur d'enveloppe (450 − 150 = 300) :
    // l'utilisateur a redimensionné le cadre à la main, son bord gauche reste.
    expect(tiedFrameRefitLeft({
      ...base, current_left: 95.4, envelope_min_x: 150, shape_min_width: 600,
    })).toBeNull()
  })

  it('un cadre élargi suit malgré tout un débord à GAUCHE (le cadre doit contenir ses membres)', () => {
    expect(tiedFrameRefitLeft({
      ...base, envelope_min_x: 95.4, shape_min_width: 600,
    })).toBe(95.4)
  })

  it('marges incluses dans la largeur d\'enveloppe comparée à shape_min_width', () => {
    // Enveloppe 300 + marges 2×20 = 340 : un shape_min_width de 340 n'est PAS un
    // élargissement manuel (le cadre est exactement ajusté) → on suit.
    expect(tiedFrameRefitLeft({
      ...base, current_left: 95.4, envelope_min_x: 150,
      margin_left: 20, margin_right: 20, shape_min_width: 340,
    })).toBe(150)
  })
})
