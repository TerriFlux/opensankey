import React, { FC, MutableRefObject, useRef, useState, useEffect } from 'react'
import {Box,Button,Textarea} from '@chakra-ui/react'

import { SankeyLinkSelectionSimple } from '../deps/OpenSankey/components/configmenus/SankeyMenuConfigurationLinks'
import { WrapperBoxSubSectionMenu } from '../deps/OpenSankey/components/configmenus/MenuCommon'
import { Class_LinkElement } from '../deps/OpenSankey/Elements/Link'
import { OSTooltip } from '../deps/OpenSankey/components/configmenus/MenuCommon'
import { Class_ApplicationDataOSP } from '../types/ApplicationDataOSP'

/**
 * Create tootltip modification menu
 */
export const MenuConfigurationLinksTooltip = ({new_data}:{new_data: Class_ApplicationDataOSP}) => {
  const { t } = new_data

  let selected_links: Class_LinkElement[]
  if (!new_data.menu_configuration.is_selector_only_for_visible_links) {
    // All availables links
    selected_links = new_data.drawing_area.selected_links_list_sorted
  }
  else {
    // Only visible links
    selected_links = new_data.drawing_area.visible_and_selected_links_list_sorted
  }

  // Editor state ----------------------------------------------------------------------
  const [editor_content_tooltip, setEditorContentTooltip] = useState('')
  const [isInitialized, setIsInitialized] = useState(false)
  const [, setCount] = useState(0)
  const inputRef = useRef() as MutableRefObject<HTMLTextAreaElement>

  // Fonction pour obtenir le texte initial
  const getInitialTooltipText = (): string => {
    if (selected_links.length > 0 && selected_links[0]._link_tooltip.tooltip_text) {
      return selected_links[0]._link_tooltip.tooltip_text
    }
    return ''
  }

  // Fonction de mise à jour complète
  const updateEditorContent = () => {
    const initialText = getInitialTooltipText()
    setEditorContentTooltip(initialText)
    if (inputRef.current) {
      inputRef.current.value = initialText
    }
    setIsInitialized(true)
  }

  // useEffect pour l'initialisation et les changements de sélection
  useEffect(() => {
    // Force la mise à jour après le prochain render
    const timer = setTimeout(() => {
      updateEditorContent()
    }, 10) // Petit délai pour s'assurer que les liens sont à jour

    return () => clearTimeout(timer)
  }, [selected_links.length, selected_links[0]?.id]) // Dépend aussi de l'ID du premier lien

  // Force une mise à jour si le contenu n'est pas initialisé et qu'on a des liens
  useEffect(() => {
    if (!isInitialized && selected_links.length > 0) {
      updateEditorContent()
    }
  })

  // Check if there is difference between original text and current editor content
  const originalText = selected_links.length > 0 ? (selected_links[0]._link_tooltip.tooltip_text || '') : ''
  const hasChanges = originalText !== editor_content_tooltip

  const applyEditor = () => {
    const dict_old_value: { [x: string]: string } = {}
    selected_links.forEach(link => {
      dict_old_value[link.id] = link._link_tooltip.tooltip_text || ''
    })

    const _applyEditor = () => {
      selected_links.forEach(link => {
        link._link_tooltip.tooltip_text = editor_content_tooltip
      })
      // Toggle saving indicator
      new_data.menu_configuration.ref_to_save_in_cache_indicator.current(false)
    }
    
    const inv_applyEditor = () => {
      selected_links.forEach(link => {
        link._link_tooltip.tooltip_text = dict_old_value[link.id]
      })
      updateEditorContent()
    }

    new_data.history.saveUndo(inv_applyEditor)
    new_data.history.saveRedo(_applyEditor)

    _applyEditor()
  }

  // Reset to original values
  const resetTextEditor = () => {
    updateEditorContent()
  }

  // Link with new_data components updater
  new_data.menu_configuration.ref_to_menu_config_links_tooltips_updater.current = () => { 
    setCount(a => a + 1)
    setIsInitialized(false) // Force la réinitialisation
    // Double délai pour s'assurer que tout est mis à jour
    setTimeout(() => {
      updateEditorContent()
    }, 20)
  }

  // Handle textarea changes
  const handleTextareaChange = (evt: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditorContentTooltip(evt.target.value)
  }

  // JSX Components ---------------------------------------------------------------------
  const content = <WrapperBoxSubSectionMenu new_data={new_data} title={t('Noeud.IB')}>
    <>
      <OSTooltip label={new_data.has_sankey_plus ? t('Flux.tooltips.IB') : t('Menu.sankeyOSPDisabled')}>
        <Textarea
          isDisabled={!new_data.has_sankey_plus}
          rows={5}
          ref={inputRef}
          value={editor_content_tooltip}
          onChange={handleTextareaChange}
        />
      </OSTooltip>
      <Box as='span' layerStyle='options_2cols'>
        <Button
          variant='menuconfigpanel_option_button_left'
          isDisabled={!hasChanges}
          backgroundColor='red.200'
          onClick={resetTextEditor}
        >
          {t('Menu.annuler')}
        </Button>
        <Button
          variant='menuconfigpanel_option_button_right'
          isDisabled={!hasChanges}
          onClick={applyEditor}
        >
          {t('Menu.submit')}
        </Button>
      </Box>
    </>
  </WrapperBoxSubSectionMenu>

  return (
    <>
      <SankeyLinkSelectionSimple new_data={new_data} />
      {selected_links.length > 0 ? content : null}
    </>
  )
}