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
import { Box, Button, Menu, MenuButton, MenuItem, MenuList, Text } from '@chakra-ui/react'

import type { Class_ApplicationData } from '../../../types/ApplicationData'
import type { Type_PanelMode } from '../../../types/PanelManager'
import type { Type_InspectorScope } from '../../configmenus/inspector/InspectorRegistry'
import { default_font_size } from '../../../css/Theme'
import {
  compositionFromJSON, compositionToJSON,
  tabLabelsFromJSON, tabLabelsToJSON,
  addBlock, removeBlock,
  type Type_Composition, type Type_TabLabels
} from '../../../types/PresentationComposition'
import { PresentationLayoutEditor } from './PresentationLayoutEditor'
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
const ATTR_TABS = 'presentation_tabs'

/** Vue structurelle minimale d'une cible d'attribut (élément OU style édité). */
type Attr_Target = {
  attributes: Record<string, unknown>
  getElementProperty: (k: typeof ATTR_BLOCKS | typeof ATTR_TABS) => unknown
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
  const labels = tabLabelsFromJSON(read_target?.getElementProperty(ATTR_TABS))
  const catalogue = catalogueFor(app_data, present_targets)
  const composer_mode = menu_configuration.presentation_composer_mode

  // --- Écriture (même patron que les autres attributs de style : undo + commit)
  // Plusieurs attributs à la fois quand ils forment UN geste (réinitialiser
  // efface composition et onglets) : sinon l'auteur devrait annuler deux fois
  // pour défaire ce qu'il a fait une fois.
  const writeAttrs = (changes: [key: string, value: unknown][]) => {
    if (targets.length === 0) return
    const before = targets.map(el => ({
      el, values: changes.map(([key]) => el.attributes[key])
    }))
    const commit = () => {
      menu_configuration.ref_to_save_in_cache_indicator.current(false)
      menu_configuration.updateInspector()
    }
    const apply = () => {
      targets.forEach(el => { changes.forEach(([key, value]) => { el.attributes[key] = value }) })
      commit()
    }
    const undo = () => {
      before.forEach(({ el, values }) => {
        changes.forEach(([key], i) => { el.attributes[key] = values[i] })
      })
      commit()
    }
    history.saveUndo(undo)
    history.saveRedo(apply)
    apply()
  }
  const writeAttr = (key: string, value: unknown) => writeAttrs([[key, value]])

  // On écrit TOUJOURS le tableau, même vide : un tableau vide est un choix
  // explicite (« ne rien montrer »), alors qu'un attribut ABSENT signifie
  // « jamais composé » et retombe sur le défaut, qui reproduit l'ancienne
  // info-bulle. C'est « Réinitialiser » qui remet l'attribut à l'état absent.
  const writeComposition = (next: Type_Composition) =>
    writeAttr(ATTR_BLOCKS, compositionToJSON(next))
  const writeLabels = (next: Type_TabLabels) =>
    writeAttr(ATTR_TABS, tabLabelsToJSON(next))
  // Réinitialiser efface la composition ET les noms d'onglets : des onglets
  // nommés sans disposition qui les porte ne voudraient plus rien dire.
  const resetComposition = () =>
    writeAttrs([[ATTR_BLOCKS, undefined], [ATTR_TABS, undefined]])

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
          isDisabled={!preview_element || !canPresent(app_data, preview_element)}
          title={t('presentation.preview_tooltip', {
            defaultValue: 'Ouvrir la présentation telle que la verra le lecteur'
          })}
          onClick={() => { if (preview_element) openPresentationFor(app_data, preview_element) }}
        >
          {t('presentation.preview', { defaultValue: 'Aperçu' })}
        </Button>
      </Box>

      {/* DISPOSITION (ajustement #5) — un onglet d'édition par CONTENANT.
          La disposition d'une info-bulle (compacte, deux colonnes) n'est pas
          celle d'un panneau latéral (étroit, empilé) : c'est la même
          composition, arrangée séparément. */}
      <Box>
        <Box layerStyle='menuconfigpanel_option_name'>
          {t('presentation.layout', { defaultValue: 'Disposition' })}
          {is_default && (
            <Text as='span' style={{ fontWeight: 400, opacity: 0.65, fontSize: '0.7rem' }}>
              {' — '}
              {t('presentation.is_default', { defaultValue: 'présentation par défaut' })}
            </Text>
          )}
        </Box>
        <Box style={{ display: 'flex', gap: '0.15rem', paddingBottom: '0.25rem' }}>
          {MODES.map(m => (
            <Button
              key={m}
              size='xs'
              flex='1'
              variant={composer_mode === m ? 'button_type_config_activated' : 'button_type_config'}
              onClick={() => { menu_configuration.presentation_composer_mode = m }}
            >
              {t(MODE_LABEL[m].key, { defaultValue: MODE_LABEL[m].fallback })}
            </Button>
          ))}
        </Box>
        <PresentationLayoutEditor
          app_data={app_data}
          mode={composer_mode}
          composition={composition}
          labels={labels}
          writeComposition={writeComposition}
          writeLabels={writeLabels}
        />
      </Box>

      {/* LES BLOCS DU DOCUMENT : ce qui EXISTE, indépendamment du contenant où
          ça s'affiche. On y ajoute, on en retire, on y règle ce qu'un bloc
          expose de réglable. Le placement, lui, se fait ci-dessus. */}
      <Box>
        <Box style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box layerStyle='menuconfigpanel_option_name'>
            {t('presentation.blocks', { defaultValue: 'Blocs du document' })}
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
            {composition.map(entry => {
              const block = presentation_block_registry.get(entry.block)
              // Bloc connu mais INDISPONIBLE ici (licence absente, hook OS+ non
              // injecté) : on ne l'affiche pas — l'auteur n'en ferait rien, et il
              // ne rend déjà rien. La composition, elle, le CONSERVE : le document
              // reste valable pour une installation qui en dispose.
              if (block?.gate && !block.gate(app_data)) return null
              const shown_in = MODES.filter(m => entry.show[m])
              return (
                <Box
                  key={entry.block}
                  style={{
                    border: '1px solid #e2e8f0', borderRadius: '4px',
                    padding: '0.25rem 0.3rem'
                  }}
                >
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
                        : entry.block + ' — ' + t('presentation.unknown_block', { defaultValue: 'bloc inconnu de cette version' })}
                    </Text>
                    {/* Où ce bloc apparaît, en toutes lettres : la disposition
                        ci-dessus le dit contenant par contenant, mais pas d'un
                        seul coup d'œil. */}
                    <Text as='span' style={{ fontSize: '0.65rem', opacity: 0.6, flex: 'none' }}>
                      {shown_in.length > 0
                        ? shown_in.map(m => t(MODE_LABEL[m].key, { defaultValue: MODE_LABEL[m].fallback })).join(' · ')
                        : t('presentation.nowhere', { defaultValue: 'nulle part' })}
                    </Text>
                    <Button
                      size='xs' variant='menuconfigpanel_del_button'
                      sx={{ paddingInline: '0.3rem', minWidth: 'auto', width: 'auto', flex: 'none' }}
                      title={t('presentation.remove', { defaultValue: 'Retirer du document' })}
                      onClick={() => writeComposition(removeBlock(composition, entry.block))}
                    >×</Button>
                  </Box>

                  {/* Sous-réglages propres au bloc, s'il en déclare. */}
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
