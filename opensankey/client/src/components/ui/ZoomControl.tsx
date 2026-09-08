// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2025 TerriFlux
// ==================================================================================================
// Author        : Vincent LE DOZE & Vincent CLAVEL & Julien Alapetite for TerriFlux
// ==================================================================================================

/**
 * `ComponentZoomControl` — indicateur de niveau de zoom + boutons -/+, primitive d'interface
 * PARTAGÉE.
 *
 * os#1383 — Déplacé de `opensankey-editor/components/topmenus/MenuBottom.tsx`, où il n'était
 * atteignable que par l'éditeur et les pages qu'il publie : un viewer MIT embarqué sans topbar
 * (`examples/cartofob`) n'avait aucun moyen de rendre le zoom au lecteur, alors que le zoom
 * molette y est le plus souvent verrouillé (`lock_zoom`). Le composant est DÉPLACÉ, pas recopié :
 * l'éditeur importe celui-ci, et le viewer le rend à droite quand l'option `zoom_control` est posée.
 *
 * 100 % = échelle d'une page vide (k = 1). Le clic sur le pourcentage remet à 100 %. S'abonne à
 * `ZOOM_TOPIC` pour suivre le zoom en direct (molette incluse).
 *
 * `variant` / `size` : ceux du thème de l'application par défaut ; le viewer MIT, qui monte un
 * `ChakraProvider` sans thème, passe des variantes Chakra natives.
 */

import React from 'react'
import { Button, ButtonGroup, Text } from '@chakra-ui/react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlus, faMinus } from '@fortawesome/free-solid-svg-icons'

import { OSTooltip } from './OSTooltip'
import { useModelBinding } from '../../hooks/useModelBinding'
import { ZOOM_TOPIC } from '../../types/EventBus'
import type { Class_ApplicationData } from '../../types/ApplicationData'

export const ZOOM_STEP_FACTOR = Math.SQRT2

export const ComponentZoomControl = ({ app_data, variant = 'toolbar_button_6', size }: {
  app_data: Class_ApplicationData,
  variant?: string,
  size?: string
}) => {
  const { t, drawing_area } = app_data
  // Re-render à chaque tick de zoom (molette / boutons / recadrages) via le bus.
  useModelBinding(undefined, (r) => app_data.menu_configuration.subscribe(ZOOM_TOPIC, r))
  const btn_size = size ?? (app_data.is_static ? 'sizeToolbarButtonStatic' : 'sizeToolbarButton')
  const percent = Math.round(drawing_area.getZoomScale() * 100)
  return <ButtonGroup className='toolbar_bottom_zoom' isAttached orientation='vertical'>
    <OSTooltip placement='left' label={t('Banner.tooltipZoomIn')}>
      <Button variant={variant} size={btn_size}
        onClick={() => drawing_area.zoomByFactor(ZOOM_STEP_FACTOR)}>
        <FontAwesomeIcon icon={faPlus} />
      </Button>
    </OSTooltip>
    <OSTooltip placement='left' label={t('Banner.tooltipZoomReset')}>
      <Button variant={variant} size={btn_size}
        onClick={() => drawing_area.zoomToScale(1)}>
        <Text fontSize='2xs' lineHeight='1' fontWeight='semibold'>{percent}%</Text>
      </Button>
    </OSTooltip>
    <OSTooltip placement='left' label={t('Banner.tooltipZoomOut')}>
      <Button variant={variant} size={btn_size}
        onClick={() => drawing_area.zoomByFactor(1 / ZOOM_STEP_FACTOR)}>
        <FontAwesomeIcon icon={faMinus} />
      </Button>
    </OSTooltip>
  </ButtonGroup>
}
