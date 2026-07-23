// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2026 TerriFlux
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction.
// ==================================================================================================
// Author        : TerriFlux
// ==================================================================================================

// OS#305 (Lot 2) — COMPOSEUR : l'interface par laquelle l'auteur décide de ce que
// verra son lecteur. Vit dans l'inspecteur (onglet « Présentation »).
//
// Décision #1 : ceci compose la présentation LECTEUR ; l'inspecteur d'édition
// reste entier à côté. On n'édite pas ici la valeur d'un nœud, on décide si le
// bloc « Valeur » apparaît, où, et dans quel ordre.
//
// Décision #2 : UNE liste ordonnée, trois cases de visibilité par bloc.
// Décision #5 : la composition vit sur le STYLE (portée « Styles ») et n'est
// surchargée sur les éléments qu'en portée « Sélection » — c'est le bandeau de
// portée de l'inspecteur qui commande, comme pour tout attribut de style.
// Décision #7 : contenant par défaut (choix unique) + alternatives permises.
// Décision #8 : la cible est ÉCRITE, jamais implicite.

import React from 'react'
import { Box, Button, Checkbox, Menu, MenuButton, MenuItem, MenuList, Text } from '@chakra-ui/react'

import type { Class_ApplicationData } from '../../../types/ApplicationData'
import type { Type_PanelMode } from '../../../types/PanelManager'
import type { Type_InspectorScope } from '../../configmenus/inspector/InspectorRegistry'
import { default_font_size } from '../../../css/Theme'
import {
  compositionFromJSON, compositionToJSON,
  containerPolicyFromJSON, containerPolicyToJSON,
  addBlock, removeBlock, toggleBlockVisibility, moveBlock,
  type Type_Composition, type Type_ContainerPolicy
} from '../../../types/PresentationComposition'
import {
  presentation_block_registry,
  type Type_PresentationBlock,
  type Type_PresentationTarget
} from './PresentationBlockRegistry'
import { registerBasePresentationBlocks } from './registerBaseBlocks'
import {
  openPresentationFor, canPresent, defaultCompositionFor, type Type_Presentable
} from './openPresentation'

// Le catalogue de base doit exister dès l'affichage du composeur.
registerBasePresentationBlocks()

const ATTR_BLOCKS = 'presentation_blocks'
const ATTR_CONTAINERS = 'presentation_containers'

/** Vue structurelle minimale d'une cible d'attribut (élément OU style édité). */
type Attr_Target = {
  attributes: Record<string, unknown>
  getElementProperty: (k: typeof ATTR_BLOCKS | typeof ATTR_CONTAINERS) => unknown
}

const MODES: Type_PanelMode[] = ['tooltip', 'popup', 'sidebar']
const MODE_LABEL: Record<Type_PanelMode, { key: string, fallback: string }> = {
  tooltip: { key: 'presentation.mode.tooltip', fallback: 'Info-bulle' },
  popup: { key: 'presentation.mode.popup', fallback: 'Pop-up' },
  sidebar: { key: 'presentation.mode.sidebar', fallback: 'Panneau' }
}

/** Types d'éléments réellement présents dans la sélection. */
const selectedPresentationTargets = (app_data: Class_ApplicationData): Type_PresentationTarget[] => {
  const da = app_data.drawing_area
  const out: Type_PresentationTarget[] = []
  if (da.selected_nodes_list.length > 0) out.push('node')
  if (da.selected_links_list.length > 0) out.push('link')
  if (da.selected_containers_list.length > 0) out.push('container')
  return out
}

/**
 * Catalogue proposé : INTERSECTION des blocs applicables à tous les types
 * sélectionnés. Sur une sélection mixte, on ne propose que ce qui vaut pour
 * TOUT le monde — sinon l'auteur ajouterait un bloc muet sur la moitié de sa
 * sélection.
 */
const catalogueFor = (
  app_data: Class_ApplicationData,
  targets: Type_PresentationTarget[]
): Type_PresentationBlock[] => {
  if (targets.length === 0) return []
  const lists = targets.map(t => presentation_block_registry.getBlocksFor(t, app_data))
  return lists.reduce((acc, list) => acc.filter(b => list.some(x => x.id === b.id)))
}

export const PresentationComposer = ({ app_data, scope }: {
  app_data: Class_ApplicationData
  scope: Type_InspectorScope
}) => {
  const { t, drawing_area, history, menu_configuration } = app_data

  const present_targets = selectedPresentationTargets(app_data)
  const edited_style = drawing_area.sankey.styles_dict[menu_configuration.ref_selected_style.current]

  const targets = (scope === 'style'
    ? [edited_style].filter(Boolean)
    : [
      ...drawing_area.selected_nodes_list,
      ...drawing_area.selected_links_list,
      ...drawing_area.selected_containers_list
    ]) as unknown as Attr_Target[]

  // Élément servant d'APERÇU : la présentation se lit toujours sur un élément
  // (via la cascade), même quand on compose au niveau du style.
  const preview_element = (
    drawing_area.selected_nodes_list[0]
    ?? drawing_area.selected_links_list[0]
    ?? drawing_area.selected_containers_list[0]
  ) as unknown as Type_Presentable | undefined

  const read_target = targets[0]
  // Attribut absent = jamais composé : on montre le DÉFAUT (l'équivalent de
  // l'ancienne info-bulle), pour que l'auteur parte de ce que voit son lecteur
  // plutôt que d'une page blanche.
  const raw_blocks = read_target?.getElementProperty(ATTR_BLOCKS)
  const is_default = raw_blocks === undefined || raw_blocks === null
  const composition = is_default && preview_element
    ? defaultCompositionFor(preview_element)
    : compositionFromJSON(raw_blocks)
  const policy = containerPolicyFromJSON(read_target?.getElementProperty(ATTR_CONTAINERS))
  const catalogue = catalogueFor(app_data, present_targets)

  // --- Écriture (même patron que les autres attributs de style : undo + commit)
  const writeAttr = (key: string, value: unknown) => {
    if (targets.length === 0) return
    const before = targets.map(el => ({ el, v: el.attributes[key] }))
    const commit = () => {
      menu_configuration.ref_to_save_in_cache_indicator.current(false)
      menu_configuration.updateInspector()
    }
    const apply = () => { targets.forEach(el => { el.attributes[key] = value }); commit() }
    const undo = () => { before.forEach(({ el, v }) => { el.attributes[key] = v }); commit() }
    history.saveUndo(undo)
    history.saveRedo(apply)
    apply()
  }

  // On écrit TOUJOURS le tableau, même vide : un tableau vide est un choix
  // explicite (« ne rien montrer »), alors qu'un attribut ABSENT signifie
  // « jamais composé » et retombe sur le défaut, qui reproduit l'ancienne
  // info-bulle. C'est « Réinitialiser » qui remet l'attribut à l'état absent.
  const writeComposition = (next: Type_Composition) =>
    writeAttr(ATTR_BLOCKS, compositionToJSON(next))
  const resetComposition = () => writeAttr(ATTR_BLOCKS, undefined)
  const writePolicy = (next: Type_ContainerPolicy) =>
    writeAttr(ATTR_CONTAINERS, containerPolicyToJSON(next))

  if (targets.length === 0) {
    return (
      <Box style={{ fontSize: default_font_size, opacity: 0.75, padding: '0.3rem 0.1rem' }}>
        {scope === 'style'
          ? t('presentation.no_style', { defaultValue: 'Aucun style sélectionné dans la cascade.' })
          : t('presentation.no_selection', { defaultValue: 'Sélectionnez un élément pour composer sa présentation.' })}
      </Box>
    )
  }

  const already = new Set(composition.map(e => e.block))
  const addable = catalogue.filter(b => !already.has(b.id))

  return (
    <Box style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>

      {/* CIBLE EXPLICITE (décision #8) : ce que l'on est en train de composer,
          + APERÇU : voir ce que verra le lecteur, par le même chemin que lui. */}
      <Box
        style={{
          display: 'flex', alignItems: 'center', gap: '0.3rem',
          fontSize: '0.7rem', opacity: 0.9, background: '#f7fafc',
          borderRadius: '4px', padding: '0.25rem 0.35rem'
        }}
      >
        <Box as='span' style={{ flex: 1, minWidth: 0 }}>
          {t('presentation.applies_to', { defaultValue: 'S\'applique à' })}
          {' : '}
          <Text as='span' style={{ fontWeight: 600 }}>
            {scope === 'style'
              ? t(edited_style?.name ?? '') || t('presentation.the_style', { defaultValue: 'le style édité' })
              : t('presentation.the_selection', { defaultValue: 'la sélection (surcharge)' })}
          </Text>
        </Box>
        <Button
          size='xs'
          variant='menuconfigpanel_option_button'
          sx={{ paddingInline: '0.4rem', minWidth: 'auto', width: 'auto', flex: 'none' }}
          // Désactivé exactement quand le lecteur ne verrait rien : l'auteur
          // apprend ainsi, sans essayer, que sa composition est vide.
          isDisabled={!preview_element || !canPresent(preview_element)}
          title={t('presentation.preview_tooltip', {
            defaultValue: 'Ouvrir la présentation telle que la verra le lecteur'
          })}
          onClick={() => { if (preview_element) openPresentationFor(app_data, preview_element) }}
        >
          {t('presentation.preview', { defaultValue: 'Aperçu' })}
        </Button>
      </Box>

      {/* CONTENANT PAR DÉFAUT + ALTERNATIVES (décision #7) : un choix unique, des
          cases — plutôt que deux booléens arbitrés par une priorité cachée. */}
      <Box>
        <Box layerStyle='menuconfigpanel_option_name'>
          {t('presentation.default_container', { defaultValue: 'Ouvrir par défaut dans' })}
        </Box>
        <Box style={{ display: 'flex', gap: '0.15rem', paddingTop: '0.2rem' }}>
          {MODES.map(mode => (
            <Button
              key={mode}
              size='xs'
              flex='1'
              variant={policy.default === mode
                ? 'button_type_config_activated'
                : 'button_type_config'}
              onClick={() => writePolicy({
                ...policy,
                default: mode,
                // L'invariant « le défaut est permis » est aussi appliqué à la lecture.
                allow: { ...policy.allow, [mode]: true }
              })}
            >
              {t(MODE_LABEL[mode].key, { defaultValue: MODE_LABEL[mode].fallback })}
            </Button>
          ))}
        </Box>
        <Box style={{ display: 'flex', gap: '0.6rem', paddingTop: '0.25rem', flexWrap: 'wrap' }}>
          {MODES.map(mode => (
            <Checkbox
              key={mode}
              size='sm'
              isChecked={policy.allow[mode]}
              // Le contenant par défaut ne peut pas être interdit.
              isDisabled={policy.default === mode}
              onChange={(e) => writePolicy({
                ...policy,
                allow: { ...policy.allow, [mode]: e.target.checked }
              })}
            >
              <Box as='span' style={{ fontSize: '0.7rem' }}>
                {t('presentation.allow_prefix', { defaultValue: 'Autoriser' })}
                {' '}
                {t(MODE_LABEL[mode].key, { defaultValue: MODE_LABEL[mode].fallback })}
              </Box>
            </Checkbox>
          ))}
        </Box>
      </Box>

      {/* LA LISTE (décision #2) : une seule composition, trois cases par bloc. */}
      <Box>
        <Box style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box layerStyle='menuconfigpanel_option_name'>
            {t('presentation.blocks', { defaultValue: 'Blocs affichés' })}
            {is_default && (
              <Text as='span' style={{ fontWeight: 400, opacity: 0.65, fontSize: '0.7rem' }}>
                {' — '}
                {t('presentation.is_default', { defaultValue: 'présentation par défaut' })}
              </Text>
            )}
          </Box>
          {!is_default && (
            <Button
              size='xs'
              variant='menuconfigpanel_option_button'
              sx={{ paddingInline: '0.4rem', minWidth: 'auto', width: 'auto', flex: 'none' }}
              title={t('presentation.reset_tooltip', {
                defaultValue: 'Revenir à la présentation par défaut'
              })}
              onClick={resetComposition}
            >
              {t('presentation.reset', { defaultValue: 'Réinitialiser' })}
            </Button>
          )}
          <Menu placement='bottom-end'>
            <MenuButton
              as={Button}
              size='xs'
              variant='menuconfigpanel_add_button'
              sx={{ height: 'auto', paddingBlock: '0.15rem', paddingInline: '0.5rem' }}
              isDisabled={addable.length === 0}
            >
              {t('presentation.add', { defaultValue: 'Ajouter' })}
            </MenuButton>
            <MenuList>
              {addable.map(b => (
                <MenuItem key={b.id} onClick={() => writeComposition(addBlock(composition, b.id))}>
                  {b.label(app_data)}
                </MenuItem>
              ))}
            </MenuList>
          </Menu>
        </Box>

        {composition.length === 0 ? (
          <Box style={{ fontSize: default_font_size, opacity: 0.7, padding: '0.3rem 0.1rem' }}>
            {t('presentation.empty', {
              defaultValue: 'Rien de composé : le lecteur ne verra aucun panneau pour cette cible.'
            })}
          </Box>
        ) : (
          <Box style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', paddingTop: '0.2rem' }}>
            {composition.map((entry, index) => {
              const block = presentation_block_registry.get(entry.block)
              // Bloc connu mais INDISPONIBLE ici (licence absente, hook OS+ non
              // injecté) : on ne l'affiche pas — l'auteur n'en ferait rien, et il
              // ne rend déjà rien. La composition, elle, le CONSERVE : le document
              // reste valable pour une installation qui en dispose.
              // On rend `null` plutôt que de filtrer, pour que `index` reste celui
              // de la composition complète (le réordonnancement en dépend).
              if (block?.gate && !block.gate(app_data)) return null
              return (
                <Box
                  key={entry.block}
                  style={{
                    border: '1px solid #e2e8f0', borderRadius: '4px',
                    padding: '0.25rem 0.3rem'
                  }}
                >
                  {/* Ligne 1 : nom du bloc + réordonner + retirer */}
                  <Box style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                    <Text
                      as='span'
                      style={{
                        flex: 1, minWidth: 0, fontSize: default_font_size, fontWeight: 600,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        // Un bloc INCONNU (venu d'une version plus récente) est
                        // affiché en grisé plutôt que masqué : l'auteur voit qu'il
                        // existe, et le modèle le conserve (cf. Lot 0).
                        opacity: block ? 1 : 0.55,
                        fontStyle: block ? 'normal' : 'italic'
                      }}
                      title={block ? block.label(app_data) : entry.block}
                    >
                      {block
                        ? block.label(app_data)
                        : `${entry.block} — ${t('presentation.unknown_block', { defaultValue: 'bloc inconnu de cette version' })}`}
                    </Text>
                    <Button
                      size='xs' variant='menuconfigpanel_option_button'
                      sx={{ paddingInline: '0.25rem', minWidth: 'auto', width: 'auto', flex: 'none' }}
                      isDisabled={index === 0}
                      title={t('presentation.move_up', { defaultValue: 'Monter' })}
                      onClick={() => writeComposition(moveBlock(composition, index, index - 1))}
                    >▲</Button>
                    <Button
                      size='xs' variant='menuconfigpanel_option_button'
                      sx={{ paddingInline: '0.25rem', minWidth: 'auto', width: 'auto', flex: 'none' }}
                      isDisabled={index === composition.length - 1}
                      title={t('presentation.move_down', { defaultValue: 'Descendre' })}
                      onClick={() => writeComposition(moveBlock(composition, index, index + 1))}
                    >▼</Button>
                    <Button
                      size='xs' variant='menuconfigpanel_del_button'
                      sx={{ paddingInline: '0.3rem', minWidth: 'auto', width: 'auto', flex: 'none' }}
                      title={t('presentation.remove', { defaultValue: 'Retirer' })}
                      onClick={() => writeComposition(removeBlock(composition, entry.block))}
                    >×</Button>
                  </Box>

                  {/* Ligne 2 : les TROIS cases de visibilité. */}
                  <Box style={{ display: 'flex', gap: '0.6rem', paddingTop: '0.15rem', flexWrap: 'wrap' }}>
                    {MODES.map(mode => (
                      <Checkbox
                        key={mode}
                        size='sm'
                        isChecked={entry.show[mode]}
                        onChange={() => writeComposition(
                          toggleBlockVisibility(composition, entry.block, mode))}
                      >
                        <Box as='span' style={{ fontSize: '0.7rem' }}>
                          {t(MODE_LABEL[mode].key, { defaultValue: MODE_LABEL[mode].fallback })}
                        </Box>
                      </Checkbox>
                    ))}
                  </Box>

                  {/* Ligne 3 : sous-réglages propres au bloc, s'il en déclare. */}
                  {block?.renderOptions && (
                    <Box style={{ paddingTop: '0.2rem' }}>
                      {block.renderOptions({
                        app_data,
                        options: entry.options ?? {},
                        setOptions: (next_options) => writeComposition(
                          composition.map(e => e.block === entry.block
                            ? { ...e, options: next_options }
                            : e))
                      })}
                    </Box>
                  )}
                </Box>
              )
            })}
          </Box>
        )}
      </Box>
    </Box>
  )
}
