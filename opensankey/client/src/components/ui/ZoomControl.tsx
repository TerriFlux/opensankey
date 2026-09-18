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
 * os#1409 — IL VISE LA FENÊTRE ACTIVE DE LA GRANDE ZONE, plus le seul diagramme. Il était câblé
 * en dur sur `app_data.drawing_area` : il zoomait le dessin pendant qu'on regardait la grille,
 * laquelle portait son propre curseur en bas — une commande unique en apparence, doublée d'une
 * autre dans la vue voisine. La bascule est celle du sélecteur de nature (os#1399) : fenêtre
 * active, puis nature, puis ce que cette nature déclare (cf. `RepresentationZoom`).
 *
 * LE POURCENTAGE N'A PAS LA MÊME DÉFINITION PARTOUT : 100 % est l'échelle d'une page vide pour
 * le diagramme, le ratio 1 d'Univer pour la grille. Chaque nature nomme son échelle neutre ; ce
 * composant affiche un pourcentage, il n'en impose pas la définition.
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
import { useActiveDocument } from '../../hooks/useActiveDocument'
import { ZOOM_TOPIC, MAIN_ZONE_TOPIC } from '../../types/EventBus'
import { representationLabel } from '../../Representations/RepresentationRegistry'
import {
  activeWindowZoom, activeZoomPercent, applyZoomStep, canZoomStep, resetZoomToNeutral,
  DEFAULT_ZOOM_STEP
} from '../../Representations/RepresentationZoom'
import { activeWindowRepresentation } from '../../types/CreationToolScope'
import type { Class_ApplicationData } from '../../types/ApplicationData'

/**
 * Le cran des boutons -/+. Conservé ici sous son nom d'origine pour les appelants qui
 * l'importaient ; la valeur vit désormais avec les capacités de zoom, où chaque nature peut
 * déclarer la sienne.
 */
export const ZOOM_STEP_FACTOR = DEFAULT_ZOOM_STEP

export const ComponentZoomControl = ({ app_data: host_app_data, variant = 'toolbar_button_6', size }: {
  app_data: Class_ApplicationData,
  variant?: string,
  size?: string
}) => {
  // os#1385 (D3/D5) — LE CONTRÔLE ZOOME LE DOCUMENT ACTIF. Sans grande zone (viewer MIT, plateau
  // unitaire, tests) il n'y a qu'un document et le crochet rend celui qu'on lui passe : rien ne
  // change là-bas. Avec deux canevas à l'écran, il vise celui qu'on regarde — la colonne
  // d'outils qui le rend appartient à l'hôte et ne bascule pas, elle.
  const app_data = useActiveDocument(host_app_data)
  const { t } = app_data
  // Re-render à chaque tick de zoom (molette / boutons / recadrages) via le bus. Le contrat des
  // capacités (cf. Type_RepresentationZoom) veut que TOUTE nature notifie ce sujet quand son
  // échelle bouge, y compris hors de ce contrôle — sinon l'indicateur resterait figé sur la
  // dernière valeur posée par les boutons en mentant sur ce que montre l'écran. Le diagramme le
  // fait depuis toujours ; la grille le fait depuis l'événement de zoom d'Univer.
  // os#1385 — ZOOM_TOPIC est un topic de DOCUMENT : on se réabonne au bus de l'actif.
  useModelBinding(undefined, (r) => app_data.menu_configuration.subscribe(ZOOM_TOPIC, r), [app_data])
  // Et un re-render quand on CHANGE de fenêtre : la cible du contrôle change alors, ainsi que
  // son pourcentage. Même abonnement que la colonne d'outils (os#1401).
  useModelBinding(undefined, (r) => app_data.menu_configuration.subscribe(MAIN_ZONE_TOPIC, r), [app_data])
  const btn_size = size ?? (app_data.is_static ? 'sizeToolbarButtonStatic' : 'sizeToolbarButton')

  const target = activeWindowZoom(app_data)

  // LA NATURE ACTIVE NE ZOOME PAS : le contrôle RESTE EN PLACE, grisé, et dit pourquoi au
  // survol — un garde-fou n'est jamais muet (règle posée par os#1401). Le nom de la nature
  // vient du registre ; à défaut (fichier écrit par une version qui offrait une nature qu'on ne
  // connaît plus), son identifiant, qui vaut mieux qu'un guillemet vide.
  const active_window = activeWindowRepresentation(app_data)
  const out_of_scope = target === null
  const reason = out_of_scope
    ? t('Banner.zoom_out_of_scope', {
      window: representationLabel(active_window ?? '', app_data) || (active_window ?? '')
    }) as string
    : ''
  const percent = target !== null ? activeZoomPercent(target) : 100

  // Grisé SANS l'attribut `disabled` du DOM : un bouton désactivé au sens du navigateur n'émet
  // plus d'événement de souris, et l'infobulle qui dit POURQUOI ne s'ouvrirait jamais.
  const dimmed = (blocked: boolean) => ({
    'aria-disabled': blocked ? true : undefined,
    opacity: blocked ? 0.4 : undefined,
    cursor: blocked ? ('not-allowed' as const) : undefined
  })
  const no_room_in = !out_of_scope && target !== null && !canZoomStep(target, 1)
  const no_room_out = !out_of_scope && target !== null && !canZoomStep(target, -1)

  return <ButtonGroup className='toolbar_bottom_zoom' isAttached orientation='vertical'>
    <OSTooltip placement='left' label={out_of_scope ? reason : t('Banner.tooltipZoomIn')}>
      <Button variant={variant} size={btn_size} {...dimmed(out_of_scope || no_room_in)}
        onClick={() => { if (target !== null) applyZoomStep(target, 1) }}>
        <FontAwesomeIcon icon={faPlus} />
      </Button>
    </OSTooltip>
    <OSTooltip placement='left' label={out_of_scope ? reason : t('Banner.tooltipZoomReset')}>
      <Button variant={variant} size={btn_size} {...dimmed(out_of_scope)}
        onClick={() => { if (target !== null) resetZoomToNeutral(target) }}>
        <Text fontSize='2xs' lineHeight='1' fontWeight='semibold'>{percent}%</Text>
      </Button>
    </OSTooltip>
    <OSTooltip placement='left' label={out_of_scope ? reason : t('Banner.tooltipZoomOut')}>
      <Button variant={variant} size={btn_size} {...dimmed(out_of_scope || no_room_out)}
        onClick={() => { if (target !== null) applyZoomStep(target, -1) }}>
        <FontAwesomeIcon icon={faMinus} />
      </Button>
    </OSTooltip>
  </ButtonGroup>
}
