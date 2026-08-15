// sa#283 — Tests PURS de la résolution du porteur d'échelle (échelle par dataTag
// généralisée, principe du UnitTag étendu). Cf. ScaleResolution.ts.
import { resolveScaleCarrier, Type_ScaleCarrierGroupInfo } from './ScaleResolution'

const tag = (tag_id: string, is_selected: boolean, own_scale?: number) => ({ tag_id, is_selected, own_scale })

describe('sa#283 — resolveScaleCarrier (pur)', () => {
  it('aucun tag scale → undefined (échelle de la zone de dessin)', () => {
    const groups: Type_ScaleCarrierGroupInfo[] = [
      { group_id: 'campagne', is_unit: false, tags: [tag('c2019', true), tag('c2020', false)] },
    ]
    expect(resolveScaleCarrier(groups)).toBeUndefined()
  })

  it('groupe unite SEUL : porteur = tag d unite DE LA VALEUR, jamais la selection', () => {
    const groups: Type_ScaleCarrierGroupInfo[] = [
      { group_id: 'unite', is_unit: true, tags: [tag('kt', true, 100), tag('kwh', true, 5000)] },
    ]
    // Avec contexte de valeur : le tag d unite de la valeur porte (comportement historique).
    expect(resolveScaleCarrier(groups, { group_id: 'unite', tag_id: 'kwh' }))
      .toEqual({ group_id: 'unite', tag_id: 'kwh', scale: 5000 })
    expect(resolveScaleCarrier(groups, { group_id: 'unite', tag_id: 'kt' }))
      .toEqual({ group_id: 'unite', tag_id: 'kt', scale: 100 })
    // Sans contexte de valeur (flux sans valeur) : rien — comme avant la generalisation.
    expect(resolveScaleCarrier(groups)).toBeUndefined()
  })

  it('groupe ordinaire : l unique tag SELECTIONNE a echelle propre porte', () => {
    const groups: Type_ScaleCarrierGroupInfo[] = [
      { group_id: 'cereale', is_unit: false, tags: [tag('ble', true, 35000), tag('millet', false, 100)] },
    ]
    expect(resolveScaleCarrier(groups)).toEqual({ group_id: 'cereale', tag_id: 'ble', scale: 35000 })
  })

  it('tag scale NON selectionne : ignore', () => {
    const groups: Type_ScaleCarrierGroupInfo[] = [
      { group_id: 'cereale', is_unit: false, tags: [tag('ble', true), tag('millet', false, 100)] },
    ]
    expect(resolveScaleCarrier(groups)).toBeUndefined()
  })

  it('plusieurs tags scales selectionnes dans un groupe ordinaire : agregat ambigu, groupe ignore', () => {
    const groups: Type_ScaleCarrierGroupInfo[] = [
      { group_id: 'amont', is_unit: false, tags: [tag('a', true, 7)] },
      { group_id: 'cereale', is_unit: false, tags: [tag('ble', true, 35000), tag('millet', true, 100)] },
    ]
    // cereale (dernier) ambigu → le groupe precedent porte.
    expect(resolveScaleCarrier(groups)).toEqual({ group_id: 'amont', tag_id: 'a', scale: 7 })
  })

  it('cereale + unite : le groupe le plus TARDIF de taggs_order gagne', () => {
    const unite: Type_ScaleCarrierGroupInfo = { group_id: 'unite', is_unit: true, tags: [tag('kt', true, 100)] }
    const cereale: Type_ScaleCarrierGroupInfo = { group_id: 'cereale', is_unit: false, tags: [tag('ble', true, 35000)] }
    const value_unit = { group_id: 'unite', tag_id: 'kt' }
    // [unite, cereale] : cereale bat unite.
    expect(resolveScaleCarrier([unite, cereale], value_unit))
      .toEqual({ group_id: 'cereale', tag_id: 'ble', scale: 35000 })
    // [cereale, unite] : unite (via la valeur) bat cereale.
    expect(resolveScaleCarrier([cereale, unite], value_unit))
      .toEqual({ group_id: 'unite', tag_id: 'kt', scale: 100 })
  })

  it('echelle invalide (0, negative, non finie) : le tag ne porte pas', () => {
    const groups: Type_ScaleCarrierGroupInfo[] = [
      { group_id: 'cereale', is_unit: false, tags: [tag('ble', true, 0)] },
      { group_id: 'campagne', is_unit: false, tags: [tag('c1', true, -5), tag('c2', false)] },
    ]
    expect(resolveScaleCarrier(groups)).toBeUndefined()
  })

  it('groupe le plus tardif sans porteur : on remonte au precedent', () => {
    const groups: Type_ScaleCarrierGroupInfo[] = [
      { group_id: 'cereale', is_unit: false, tags: [tag('ble', true, 35000)] },
      { group_id: 'campagne', is_unit: false, tags: [tag('c2019', true), tag('c2020', false, 12)] },
    ]
    expect(resolveScaleCarrier(groups)).toEqual({ group_id: 'cereale', tag_id: 'ble', scale: 35000 })
  })
})
