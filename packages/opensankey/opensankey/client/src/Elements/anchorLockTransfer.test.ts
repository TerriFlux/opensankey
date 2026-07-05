import { transferAnchorLock, AnchorLockState } from './anchorLockTransfer'

// Regression guard for issue #202 — « Appliquer la mise en page » ne transférait
// pas le cadenas d'ordre des flux E/S : sur la cible, tous les flux repassaient
// en réorganisation auto (cadenas rouverts).
//
// Cause : `Node.keepLinkOrderingFrom` recopiait l'ORDRE des flux (case Flux →
// « Tailles et positions ») mais ni là ni dans `Link.copyAttrFrom` l'état
// verrouillé/figé des ancres n'était transféré. La cible recevait un ordre « non
// verrouillé » → le premier recalcul auto le réécrasait.
//
// Correctif : transférer le cadenas AVEC l'ordre qu'il verrouille. Ce test isole
// la POLITIQUE PURE (sans le graphe d3/DOM de Class_LinkElement) : copier le flag
// ET le côté figé par extrémité, et normaliser le côté figé quand l'ancre est
// déverrouillée. `Side` est ici une simple chaîne stand-in.

type Side = 'left' | 'right'

describe("AFMBase issue #202 — transferAnchorLock copie flag + côté figé par extrémité", () => {
  it('copie le côté figé, pas seulement le flag (sinon la cible recalculerait son côté)', () => {
    const src: AnchorLockState<Side> = {
      source_side_locked: true, source_side_frozen: 'left',
      target_side_locked: true, target_side_frozen: 'right',
    }
    expect(transferAnchorLock(src)).toEqual(src)
  })

  it('extrémités indépendantes : une seule verrouillée', () => {
    const src: AnchorLockState<Side> = {
      source_side_locked: true, source_side_frozen: 'right',
      target_side_locked: false, target_side_frozen: undefined,
    }
    expect(transferAnchorLock(src)).toEqual(src)
  })

  it('source déverrouillée : le côté figé est normalisé à undefined (= relâche un verrou cible antérieur)', () => {
    // Une source « auto » (frozen résiduel mais locked=false) doit produire un
    // état franchement déverrouillé pour effacer un cadenas préexistant côté cible.
    const src: AnchorLockState<Side> = {
      source_side_locked: false, source_side_frozen: 'left',
      target_side_locked: false, target_side_frozen: 'right',
    }
    expect(transferAnchorLock(src)).toEqual({
      source_side_locked: false, source_side_frozen: undefined,
      target_side_locked: false, target_side_frozen: undefined,
    })
  })

  it('ne mute pas la source', () => {
    const src: AnchorLockState<Side> = {
      source_side_locked: true, source_side_frozen: 'left',
      target_side_locked: false, target_side_frozen: undefined,
    }
    const snapshot = { ...src }
    transferAnchorLock(src)
    expect(src).toEqual(snapshot)
  })
})
