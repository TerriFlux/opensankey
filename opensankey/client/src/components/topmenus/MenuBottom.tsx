import React, { useState, useRef } from 'react'
import {
  Box, Button, ButtonGroup, Text, MenuItem, MenuDivider, MenuButton, Menu, MenuList, Portal,
  useSteps, Stepper, Step, StepIndicator, StepStatus, StepSeparator, StepTitle
} from '@chakra-ui/react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faLocationDot, faPercent, faRulerVertical, faPlus, faMinus, faCaretDown } from '@fortawesome/free-solid-svg-icons'
import { ConfigMenuNumberInput, OSTooltip } from '../configmenus/MenuCommon'
import { useModelBinding } from '../../hooks/useModelBinding'
import { ZOOM_TOPIC } from '../../types/EventBus'
import { Class_ApplicationData } from '../../types/ApplicationData'
import { Type_AutoFitMode } from '../../types/DrawingArea'
import { Class_DataTagGroup } from '../../types/TagGroup'

// Facteur multiplicatif d'un cran des boutons -/+ (deux crans consécutifs ≈ ×2).
const ZOOM_STEP_FACTOR = Math.SQRT2

/**
 * Right toolbar for some simple functionnality on the DA (Draw flow, recenter DA,...)
 *
 * @param {*} {
 *   new_data,
 * }
 * @return {*}
 */
export const ToolBarBottom = ({ new_data, right_offset }: {
  new_data: Class_ApplicationData,
  right_offset?: string | number
}) => {
  // #247 — re-render piloté par le modèle (lie le slot updater + cleanup au démontage).
  const refreshThis = useModelBinding(new_data.menu_configuration.ref_to_toolbar_bottom_updater)

  let btn_mouse_mode_edition = <></>
  if (!new_data.is_static) {
    btn_mouse_mode_edition = <ComponentMouseMode app_data={new_data} updateParentComponent={refreshThis} />
  }
  // Barre d'outils verticale (layerStyle 'toolbar_right'). En édition, on l'ancre en BAS
  // d'écran (au-dessus de la barre du bas), dans la même colonne que le bouton d'ouverture
  // du menu de configuration (`right_offset` = sa position), largeur 2rem pour aligner les
  // bords. Un zIndex supérieur au panneau de config (zIndex 30) la garde visible.
  // Le bouton « ? » d'aide a été déplacé dans le menu déroulant « Aide » (cf. MenuTop).
  const sizeBottomMenu = document.getElementsByClassName('BottomMenu')[0]?.getBoundingClientRect().height ?? 0
  // `right_offset` peut être un nombre (px, menu fermé) ou une string 'calc(...)' (menu ouvert).
  // Chakra interprète un `right` NUMÉRIQUE comme un multiple de l'échelle d'espacement
  // (×0.25rem) → on force l'unité px pour rester aligné sur le bouton config (style inline px).
  const right_css = typeof right_offset === 'number' ? right_offset + 'px' : right_offset
  // En mode statique (publish), le layerStyle `toolbar_right` fige `right: 1rem`. Quand la doc (ou
  // le tableur) occupe la colonne de droite, le diagramme se recadre à gauche mais la toolbar
  // resterait collée au bord droit, cachée sous le panneau doc (zIndex 20). On la décale vers la
  // gauche de la largeur réservée à droite (rightReserve = right_offset - fit_margin) tout en
  // gardant la base 1rem du layerStyle ; sans réserve on laisse undefined (position par défaut).
  const static_right_reserve = new_data.is_static
    ? Math.max(0, (typeof right_offset === 'number' ? right_offset : 0) - new_data.drawing_area.fit_margin)
    : 0
  const static_right = static_right_reserve > 0
    ? 'calc(1rem + ' + static_right_reserve + 'px)'
    : undefined
  return <Box
    layerStyle='toolbar_right'
    // zIndex relevé au-dessus de l'overlay doc/tableur (zIndex 20) quand la toolbar est décalée.
    zIndex={new_data.is_static ? (static_right_reserve > 0 ? 25 : undefined) : 40}
    width={new_data.is_static ? undefined : '2rem'}
    right={new_data.is_static ? static_right : right_css}
    top={new_data.is_static ? undefined : 'auto'}
    transform={new_data.is_static ? undefined : 'none'}
    bottom={new_data.is_static ? undefined
      : 'calc(' + sizeBottomMenu + 'px + ' + (new_data.drawing_area.fit_margin / 2) + 'px + 1rem)'}
  >
    {btn_mouse_mode_edition}
    {/* Groupe des modes de position (absolu / proportionnel / échelle) : agit sur le
        rendu, donc pertinent en publish. En mode statique il est piloté par l'option
        publish `toolbar` (indépendamment du groupe ajustement ci-dessous). */}
    {(!new_data.is_static || new_data.publish_options.toolbar) ? <ComponentPositionMode
      app_data={new_data}
      updateParentComponent={refreshThis}
    /> : <></>}
    {/* Groupe ajustement / verrous / plein écran : en mode statique, piloté par
        l'option publish `fit_toolbar`. En publish, le plein écran est masqué de ce groupe quand
        l'option `fullscreen` est active : il figure alors dans la barre du haut (cf. MenuTop). */}
    {(!new_data.is_static || new_data.publish_options.fit_toolbar) ? <ComponetStretchButtons
      app_data={new_data}
      updateParentComponent={refreshThis}
      hide_fullscreen={new_data.is_static && new_data.publish_options.fullscreen}
    /> : <></>}
    {/* Indicateur de zoom + boutons -/+ : même gate que le groupe ajustement en publish. */}
    {(!new_data.is_static || new_data.publish_options.fit_toolbar)
      ? <ComponentZoomControl app_data={new_data} /> : <></>}
  </Box>
}

export const ComponentMouseMode = (
  { app_data, updateParentComponent }: { app_data: Class_ApplicationData, updateParentComponent: () => void }) => {
  const { t, menu_configuration, drawing_area, icon_library } = app_data
  const size = app_data.is_static ? 'sizeToolbarButtonStatic' : 'sizeToolbarButton'
  { /* Boutons permettant soit de passer la souris en mode sélection soit en mode création noeud/flux */ }
  return <OSTooltip
    placement='left'
    label={t('Banner.tooltipLiason')}
    isAlwaysOpen={menu_configuration.show_splashscreen}
  >
    <ButtonGroup className='toolbar_bottom_mouse_mode' isAttached orientation='vertical'>
      <Button
        variant={drawing_area.isInEditionMode() ? 'toolbar_button_mouse_mode_activated' : 'toolbar_button_mouse_mode'}
        id='button_selection_edition'
        size={size}
        onClick={() => {
          // Sortir d'abord du mode « placer une zone de texte » (switchMode ne gère
          // que édition⇄sélection) : on repasse en sélection, puis la bascule ci-dessous.
          if (drawing_area.isInPlaceContainerMode()) drawing_area.exitPlaceContainerMode()
          if (!drawing_area.isInEditionMode()) {
            drawing_area.switchMode()
          }
          updateParentComponent()
        }}>
        {icon_library.icon_DA_edit}
      </Button>
      <Button
        variant={drawing_area.isInSelectionMode() ? 'toolbar_button_mouse_mode_activated' : 'toolbar_button_mouse_mode'}
        id='button_selection_edition'
        size={size}
        onClick={() => {
          if (drawing_area.isInPlaceContainerMode()) drawing_area.exitPlaceContainerMode()
          if (!drawing_area.isInSelectionMode()) {
            drawing_area.switchMode()
          }
          updateParentComponent()
        }}>
        {icon_library.icon_DA_selection}
      </Button>
      <Button
        variant={drawing_area.isInStylePaintMode() ? 'toolbar_button_mouse_mode_activated' : 'toolbar_button_mouse_mode'}
        isDisabled={!drawing_area.isInStylePaintMode() && drawing_area.selected_elements_list.length !== 1}
        size={size}
        onClick={() => {
          if (drawing_area.isInStylePaintMode()) {
            drawing_area.exitStylePaintMode()
          } else {
            const selected = drawing_area.selected_elements_list[0]
            if (selected) drawing_area.enterStylePaintMode(selected)
          }
          updateParentComponent()
        }}>
        {icon_library.icon_style_paint}
      </Button>
    </ButtonGroup>
  </OSTooltip>
}


export const ComponentPositionMode = ({ app_data, updateParentComponent }: { app_data: Class_ApplicationData, updateParentComponent: () => void }) => {
  const { t, drawing_area } = app_data
  const size = app_data.is_static ? 'sizeToolbarButtonStatic' : 'sizeToolbarButton'
  const mode = drawing_area.sankey.styles_dict['default'].shape_position_type
  // #1231 — Le mode « paramétrique » n'est plus un mode utilisateur : seuls Absolu et
  // Pourcentage. Bouton paramétrique retiré.
  return <ButtonGroup className='toolbar_bottom_position_mode' isAttached orientation='vertical'>
    <OSTooltip placement='left' label={t('Banner.posMode_absolute')}>
      <Button
        variant={mode === 'absolute' ? 'toolbar_button_position_mode_activated' : 'toolbar_button_position_mode'}
        size={size}
        onClick={() => {
          if (mode !== 'absolute') { drawing_area.setAbsoluteMode(); drawing_area.draw(); updateParentComponent() }
        }}>
        <FontAwesomeIcon icon={faLocationDot} />
      </Button>
    </OSTooltip>
    <OSTooltip placement='left' label={t('Banner.posMode_proportional')}>
      <Button
        variant={mode === 'proportional' ? 'toolbar_button_position_mode_activated' : 'toolbar_button_position_mode'}
        size={size}
        onClick={() => {
          if (mode !== 'proportional') { drawing_area.setProportionalMode(); drawing_area.draw(); updateParentComponent() }
        }}>
        <FontAwesomeIcon icon={faPercent} />
      </Button>
    </OSTooltip>
    <OSTooltip placement='left' label={t('Banner.posMode_scale_adapted')}>
      <Button
        variant={mode === 'scale_adapted' ? 'toolbar_button_position_mode_activated' : 'toolbar_button_position_mode'}
        size={size}
        onClick={() => {
          if (mode !== 'scale_adapted') { drawing_area.setScaleAdaptedMode(); updateParentComponent() }
        }}>
        <FontAwesomeIcon icon={faRulerVertical} />
      </Button>
    </OSTooltip>
  </ButtonGroup>
}

/**
 * Bouton plein écran isolé. Réutilisé dans le groupe ajustement (ComponetStretchButtons) et,
 * en publish, en bouton autonome quand `fit_toolbar` est masqué (option `fullscreen`).
 */
const ComponentFullscreenButton = (
  { app_data, updateParentComponent }: { app_data: Class_ApplicationData, updateParentComponent: () => void }
) => {
  const { t } = app_data
  const size = app_data.is_static ? 'sizeToolbarButtonStatic' : 'sizeToolbarButton'
  const logo_btn_fs = document.fullscreenElement ? app_data.icon_library.icon_enter_fullscreen : app_data.icon_library.icon_exit_fullscreen
  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen()
      app_data.drawing_area.draw()
    } else if (document.exitFullscreen) {
      await document.exitFullscreen()
      app_data.drawing_area.draw()
    }
    updateParentComponent()
  }
  return <OSTooltip
    placement='left'
    label={document.fullscreenElement ? t('Banner.quit_fullscreen') : t('Banner.fullscreen')}
  >
    <Button
      variant='toolbar_button_6'
      id='button_fullscreen'
      size={size}
      onClick={toggleFullscreen}
    >
      {logo_btn_fs}
    </Button>
  </OSTooltip>
}

/**
 * Indicateur de niveau de zoom + boutons -/+ (comme dans la plupart des logiciels), en complément
 * de la molette (Ctrl/Cmd+scroll). 100% = échelle d'une page vide (k=1). Le clic sur le pourcentage
 * remet à 100%. S'abonne à ZOOM_TOPIC pour suivre le zoom en direct (molette incluse).
 */
export const ComponentZoomControl = ({ app_data }: { app_data: Class_ApplicationData }) => {
  const { t, drawing_area } = app_data
  // Re-render à chaque tick de zoom (molette / boutons / recadrages) via le bus.
  useModelBinding(undefined, (r) => app_data.menu_configuration.subscribe(ZOOM_TOPIC, r))
  const size = app_data.is_static ? 'sizeToolbarButtonStatic' : 'sizeToolbarButton'
  const percent = Math.round(drawing_area.getZoomScale() * 100)
  return <ButtonGroup className='toolbar_bottom_zoom' isAttached orientation='vertical'>
    <OSTooltip placement='left' label={t('Banner.tooltipZoomIn')}>
      <Button variant='toolbar_button_6' size={size}
        onClick={() => drawing_area.zoomByFactor(ZOOM_STEP_FACTOR)}>
        <FontAwesomeIcon icon={faPlus} />
      </Button>
    </OSTooltip>
    <OSTooltip placement='left' label={t('Banner.tooltipZoomReset')}>
      <Button variant='toolbar_button_6' size={size}
        onClick={() => drawing_area.zoomToScale(1)}>
        <Text fontSize='2xs' lineHeight='1' fontWeight='semibold'>{percent}%</Text>
      </Button>
    </OSTooltip>
    <OSTooltip placement='left' label={t('Banner.tooltipZoomOut')}>
      <Button variant='toolbar_button_6' size={size}
        onClick={() => drawing_area.zoomByFactor(1 / ZOOM_STEP_FACTOR)}>
        <FontAwesomeIcon icon={faMinus} />
      </Button>
    </OSTooltip>
  </ButtonGroup>
}

/**
 *Buttons component to recenter DA horizontally or vertically
 *
 * @param {*} { new_data, updateParentComponent }
 * @return {*}
 */
export const ComponetStretchButtons = ({ app_data, updateParentComponent, hide_fullscreen }: { app_data: Class_ApplicationData, updateParentComponent: () => void, hide_fullscreen?: boolean }) => {
  // Use variable from class
  const { t } = app_data
  const size = app_data.is_static ? 'sizeToolbarButtonStatic' : 'sizeToolbarButton'
  // #680 — S'abonner à ZOOM_TOPIC : un zoom manuel (molette / boutons +-) repasse le mode à
  // 'none' (cf. DrawingArea.eventZoom / zoomByFactor) et notifie ZOOM_TOPIC. Sans cet abonnement
  // les boutons resteraient allumés visuellement après un zoom (l'état interne, lui, est bien
  // remis à 'none'). Même canal que l'indicateur de zoom (ComponentZoomControl).
  useModelBinding(undefined, (r) => app_data.menu_configuration.subscribe(ZOOM_TOPIC, r))

  // #680 — Les modes de cadrage sont des MODES persistants (un seul actif, ou aucun) et
  // non des actions ponctuelles. Tant qu'un mode est actif, la contrainte est maintenue
  // en permanence (cf. applyAutoFitMode / drag / zoom).
  // OS#1315 — UI ramenée à DEUX boutons : un bouton Fit unique (variantes tout/largeur/
  // hauteur dans son menu) + un bouton d'ancrage (centré / haut-gauche).
  const fit_mode = app_data.drawing_area.auto_fit_mode
  const fit_anchor = app_data.drawing_area.fit_anchor
  const setFitMode = (m: Type_AutoFitMode) => {
    const da = app_data.drawing_area
    da.auto_fit_mode = m
    da.applyAutoFitMode(true) // geste utilisateur explicite → zoom cinématique (no-op en 'none')
    updateParentComponent()
  }
  const toggleAnchor = () => {
    const da = app_data.drawing_area
    da.fit_anchor = (da.fit_anchor === 'center') ? 'top_left' : 'center'
    if (da.auto_fit_mode === 'none') {
      // Sans mode actif, le bascule doit avoir un effet IMMÉDIAT (sinon il ne se
      // verrait qu'au prochain chargement) : on applique une fois le cadrage
      // « d'arrivée » du nouvel ancrage — haut-gauche → caméra à (0,0), zoom 100 % ;
      // centré → recadrage centré ponctuel. La caméra reste ensuite libre.
      if (da.fit_anchor === 'top_left') da.resetCameraToOrigin()
      else da.recenterAnimated(true)
    } else {
      da.applyAutoFitMode(true) // ré-applique le mode actif avec le nouvel ancrage
    }
    updateParentComponent()
  }
  // L'icône du bouton Fit reflète la variante active (défaut : « tout visible »).
  const fit_icon = fit_mode === 'width' ? app_data.icon_library.icon_area_fit_horiz
    : fit_mode === 'height' ? app_data.icon_library.icon_area_fit_vert
      : app_data.icon_library.icon_recenter

  return <ButtonGroup className='toolbar_bottom_stretch' isAttached orientation='vertical'>
    {/* OS#1315 — clic = bascule du fit (applique la dernière variante immédiatement) ;
        le chevron dessous ouvre le menu des variantes. */}
    <OSTooltip placement='left' label={t('Banner.tooltipFitMenu')}>
      <Button
        variant={fit_mode !== 'none' ? 'toolbar_button_6_activated' : 'toolbar_button_6'}
        size={size}
        onClick={() => setFitMode(fit_mode === 'none' ? app_data.drawing_area.last_fit_variant : 'none')}>
        {fit_icon}
      </Button>
    </OSTooltip>
    <Menu placement='left-start'>
      <MenuButton as={Button}
        variant='toolbar_button_6'
        size={size}
        height='1rem'
        minHeight='1rem'
        padding={0}>
        <FontAwesomeIcon icon={faCaretDown} style={{ fontSize: '0.6rem' }} />
      </MenuButton>
      {/* Portal : la toolbar est en position:fixed avec son propre contexte d'empilement —
          une MenuList non portalisée s'ouvre clippée / hors écran. zIndex au-dessus de la
          toolbar (40) et des panneaux (20-30). */}
      <Portal>
        <MenuList minWidth='unset' zIndex={50}>
          <MenuItem icon={fit_mode === 'none' ? app_data.icon_library.icon_activated : <></>}
            onClick={() => setFitMode('none')}>{t('Banner.fitModeNone')}</MenuItem>
          <MenuItem icon={fit_mode === 'full' ? app_data.icon_library.icon_activated : <></>}
            onClick={() => setFitMode('full')}>{t('Banner.fitModeFull')}</MenuItem>
          <MenuItem icon={fit_mode === 'width' ? app_data.icon_library.icon_activated : <></>}
            onClick={() => setFitMode('width')}>{t('Banner.fitModeWidth')}</MenuItem>
          <MenuItem icon={fit_mode === 'height' ? app_data.icon_library.icon_activated : <></>}
            onClick={() => setFitMode('height')}>{t('Banner.fitModeHeight')}</MenuItem>
        </MenuList>
      </Portal>
    </Menu>

    <OSTooltip placement='left'
      label={fit_anchor === 'center' ? t('Banner.tooltipAnchorCenter') : t('Banner.tooltipAnchorTopLeft')}>
      <Button variant='toolbar_button_6' size={size}
        // OS#1315 — Ancrage : 'center' répartit le mou autour du contenu ; 'top_left'
        // épingle le monde (0,0) au coin (sans fit : le chargement ne bouge pas la caméra).
        onClick={toggleAnchor}>
        {fit_anchor === 'center' ? app_data.icon_library.icon_anchor_center : app_data.icon_library.icon_anchor_top_left}
      </Button>
    </OSTooltip>

    <OSTooltip
      placement='left'
      label={app_data.drawing_area.font_size_locked ? t('Banner.tooltipFontLocked') : t('Banner.tooltipFontUnlocked')}
    >
      <Button variant='toolbar_button_6'
        size={size}
        onClick={() => {
          app_data.drawing_area.font_size_locked = !app_data.drawing_area.font_size_locked
          updateParentComponent()
        }}>
        {app_data.drawing_area.font_size_locked
          ? app_data.icon_library.icon_font_size_locked
          : app_data.icon_library.icon_font_size_unlocked}
      </Button>
    </OSTooltip>

    <OSTooltip
      placement='left'
      label={app_data.drawing_area.size_locked ? t('Banner.tooltipSizeLocked') : t('Banner.tooltipSizeUnlocked')}
    >
      <Button variant='toolbar_button_6'
        size={size}
        onClick={() => {
          app_data.drawing_area.size_locked = !app_data.drawing_area.size_locked
          updateParentComponent()
        }}>
        {app_data.drawing_area.size_locked
          ? app_data.icon_library.icon_size_locked
          : app_data.icon_library.icon_size_unlocked}
      </Button>
    </OSTooltip>

    {/* En éditeur, le plein écran est déplacé dans la barre du haut (cf. TopBarFullscreenButton). */}
    {hide_fullscreen ? <></> : <ComponentFullscreenButton app_data={app_data} updateParentComponent={updateParentComponent} />}
  </ButtonGroup>
}

export const DrawerSequenceDataTagg = ({ new_data }: { new_data: Class_ApplicationData }) => {
  const { icon_library } = new_data
  const { icon_repeat_sequence, icon_play, icon_pause, icon_activated, icon_open_selector } = icon_library
  // #247 — re-render piloté par le modèle (lie le slot updater + cleanup au démontage).
  const refreshThis = useModelBinding(new_data.menu_configuration.ref_to_drawer_sequence_data_tag_updater)
  const [active_grp, setActiveGrp] = useState('')

  const list_grp_seq = new_data.drawing_area.sankey.getTagGroupsAsList('data_taggs').filter(grp => (grp as Class_DataTagGroup).banner == 'sequence')
  const dict_data_grp = new_data.drawing_area.sankey.getTagGroupsAsDict('data_taggs')
  const list_grp_seq_id = list_grp_seq.map(grp => grp.id)
  const has_sequence = list_grp_seq.length > 0

  if (has_sequence && !list_grp_seq_id.includes(active_grp)) {
    setActiveGrp(list_grp_seq_id[0])
  }
  const ref_set_number_input = useRef((_: string | null | undefined) => null)
  ref_set_number_input.current(String(new_data.menu_configuration.timeout_sequence))

  // Create stepper of active groupe
  const stepper_sequence: JSX.Element = <StepperDataTagg new_data={new_data} DataGroup={dict_data_grp[active_grp] as Class_DataTagGroup} />

  // Logo of the button to start/pause the sequence
  const logo_btn = !new_data.menu_configuration.is_playing_sequence ? icon_play : icon_pause
  const setter_timeout = <Box layerStyle='config_timeout_sequence' >
    <Box layerStyle='menuconfigpanel_option_name'>
      {new_data.t('Tags.sequence_timeout')}
    </Box>

    <ConfigMenuNumberInput
      t={new_data.t}
      default_value={new_data.menu_configuration.timeout_sequence}
      minimum_value={1}
      function_on_blur={(value) => {
        if (value) {
          if (value > 0) {
            new_data.menu_configuration.timeout_sequence = value
          }
        }
      }}
      unit_text='ms'
    />
  </Box>

  // If multiple dataTagg are a sequence we can add a Menu to choose which one we want to launch
  const select_active_grp = list_grp_seq.length > 1 ? <>
    {list_grp_seq.map((el, idx) => {
      return <MenuItem
        key={'select_grp_seq_' + idx}
        onClick={() => setActiveGrp(el.id)}
        icon={active_grp === el.id ? icon_activated : <></>}
        style={{ display: 'block' }}
      >
        {el.name}
      </MenuItem>
    })}
    <MenuDivider />
  </> : <></>

  // Menu with option like selective active sequence & timeout between steps
  const option_btn = <Menu>
    <MenuButton
      as={Button}
      size='xs'
      isDisabled={new_data.menu_configuration.is_playing_sequence}
      variant={new_data.menu_configuration.is_playing_sequence ? 'button_dataTagg_sequence_menu_play' : 'button_dataTagg_sequence_menu_pause'}
    >
      {icon_open_selector}
    </MenuButton>
    <MenuList>
      {select_active_grp}
      {setter_timeout}
    </MenuList>
  </Menu>

  return has_sequence ? (
    <Box
      layerStyle='box_sequence'
    >
      <ButtonGroup isAttached size='xs'>
        <Button
          variant={new_data.menu_configuration.is_playing_sequence ? 'button_dataTagg_sequence_play' : 'button_dataTagg_sequence_pause'}
          onClick={() => {
            // Either launch or stop data sequence
            if (new_data.menu_configuration.is_playing_sequence) {
              // Stop sequence
              new_data.menu_configuration.is_playing_sequence = false
            } else {
              // Start sequence
              new_data.menu_configuration.is_playing_sequence = true
              const curr_active_grp = new_data.drawing_area.sankey.getTagGroupsAsDict('data_taggs')[active_grp] as Class_DataTagGroup
              new_data.menu_configuration.launchDataSequence(curr_active_grp)
            }
            refreshThis()
          }}
        >
          {logo_btn}
        </Button>
        <Button
          variant={new_data.menu_configuration.is_sequence_loop ? 'button_dataTagg_sequence_play' : 'button_dataTagg_sequence_pause'}
          onClick={() => {
            // Switch 'is sequence loop' value
            new_data.menu_configuration.is_sequence_loop = !new_data.menu_configuration.is_sequence_loop
            refreshThis()
          }}>
          {icon_repeat_sequence}
        </Button>
        {option_btn}
      </ButtonGroup>
      {stepper_sequence}
    </Box>
  ) : <></>
}

// Compoenent returing a stepper of a dataTagg where each step is a tag of the group with visual indication to which tag is selected
const StepperDataTagg = ({ new_data, DataGroup }: { new_data: Class_ApplicationData, DataGroup: Class_DataTagGroup }) => {
  const stepper_sequence = DataGroup.tags_list.map((tag, idx) => { return { id_tag: tag.id, title: tag.display_name, selected: tag.is_selected, id: idx } })
  const selected_id = stepper_sequence.find(el => el.selected)?.id ?? -1
  const { activeStep, setActiveStep } = useSteps({
    index: selected_id,
    count: stepper_sequence.length,
  })

  if (activeStep !== -1 && activeStep !== selected_id) {
    setActiveStep(selected_id)
  }
  // Fucntion used when we click on a step to manually switch to clicked tag
  const switchCurrTag = (idx: number) => {
    DataGroup.selectTagsFromId(stepper_sequence[idx].id_tag)
    new_data.drawing_area.areaAutoFit()
    new_data.menu_configuration.updateAllComponentsRelatedToDataTags()
  }

  return <Box layerStyle='box_stepper'>
    {/* First stepper that have progression bar of the sequence with steps */}
    <Stepper index={activeStep} size={'xs'} variant='sequenceStepper'>
      {stepper_sequence.map((step, index) => (
        <Step key={index} onClick={() => switchCurrTag(index)}>
          <>
            <Box width='100%'>
              <Box display='flex' alignItems='center'>
                <StepIndicator
                  sx={{
                    '[data-status=complete] &': {
                      background: 'white',
                      borderWidth: '2px',
                      borderColor: 'secondaire.3',
                    },
                    '[data-status=active] &': {
                      background: 'primaire.3',
                      borderColor: 'secondaire.3',
                    },
                    '[data-status=incomplete] &': {
                      background: 'white',
                      borderColor: 'secondaire.3',
                    },
                  }}
                >
                  <StepStatus />

                </StepIndicator>

                <StepSeparator
                  sx={{
                    '[data-status=complete] &': {
                      background: 'lightgrey',
                    },
                    '[data-status=active] &': {
                      background: 'lightgrey',
                    },
                    '[data-status=incomplete] &': {
                      background: 'lightgrey',
                    },
                  }} />
              </Box>

            </Box>
          </>
        </Step>
      ))}
    </Stepper>

    {/* Second stepper just to have text well aligned with indicator */}
    <Stepper index={activeStep} size={'xs'} variant='sequenceStepper'>
      {stepper_sequence.map((step, index) => (
        <Step key={index} onClick={() => switchCurrTag(index)}>
          <>
            <Box width='100%'>
              <Box display='flex' alignItems='center'>

                <StepTitle >{step.title}</StepTitle>
              </Box>

            </Box>
          </>

        </Step>

      ))}
    </Stepper>
  </Box>
}