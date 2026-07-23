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

// AJUSTEMENT #5 — ÉDITEUR DE DISPOSITION : l'auteur arrange ses blocs par
// glisser-déposer, contenant par contenant.
//
// Ce que l'éditeur montre est exactement ce que le lecteur verra : il consomme
// `layoutFor`, le même point de vérité que le rendu (PresentationPanels). Un
// éditeur qui aurait sa propre idée de la disposition ferait composer à
// l'aveugle.
//
// Trois zones de dépôt, et c'est tout le vocabulaire :
//  - une RANGÉE existante   -> le bloc s'y range côte à côte avec les autres ;
//  - « nouvelle rangée »    -> il prend une rangée pour lui, sous les autres ;
//  - « nouvel onglet »      -> il ouvre un onglet ;
//  - la RÉSERVE (en bas)    -> il disparaît de ce contenant, sans quitter le
//                              document (il reste disponible pour les deux
//                              autres, et pour être rapatrié ici).
//
// Toute édition commence par `normalizeAllLayouts` : l'ordre de la liste devient
// alors sans effet sur l'affichage, ce qui permet de la réordonner pour ranger
// une rangée sans bousculer les deux autres contenants (cf. le modèle).

import React from 'react'
import { Box, Button, Input, Text } from '@chakra-ui/react'
import { DragDropContext, Draggable, Droppable, DropResult } from 'react-beautiful-dnd'

import type { Class_ApplicationData } from '../../../types/ApplicationData'
import type { Type_PanelMode } from '../../../types/PanelManager'
import { default_font_size } from '../../../css/Theme'
import {
  layoutFor, normalizeAllLayouts, unplaceBlock, clearLayout,
  tabLabelAt, setTabLabel, MAX_TABS, MAX_COLS,
  type Type_Composition, type Type_TabLabels
} from '../../../types/PresentationComposition'
import { presentation_block_registry } from './PresentationBlockRegistry'
// La règle de dépôt vit à part, en module pur : c'est là que se logent les
// erreurs d'index, et un test la couvre sans avoir à simuler un glisser.
import {
  applyDrop, cellDropId, newRowDropId, newColDropId, NEW_TAB, TRAY
} from './presentationDrop'

const chip_style: React.CSSProperties = {
  border: '1px solid #cbd5e0',
  borderRadius: '4px',
  background: 'white',
  padding: '0.2rem 0.25rem',
  fontSize: default_font_size,
  minWidth: 0
}

export const PresentationLayoutEditor = ({
  app_data, mode, composition, labels, writeComposition, writeLabels
}: {
  app_data: Class_ApplicationData
  /** Contenant en cours d'arrangement. */
  mode: Type_PanelMode
  composition: Type_Composition
  labels: Type_TabLabels
  writeComposition: (next: Type_Composition) => void
  writeLabels: (next: Type_TabLabels) => void
}) => {
  const { t } = app_data
  const tabs = layoutFor(composition, mode)
  const hidden = composition.filter(e => !e.show[mode])

  const labelOf = (block: string) =>
    presentation_block_registry.get(block)?.label(app_data) ?? block

  const onDragEnd = ({ draggableId, destination }: DropResult) => {
    if (!destination) return
    const next = applyDrop(composition, mode, draggableId, destination.droppableId, destination.index)
    if (next !== composition) writeComposition(next)
  }

  const Chip = ({ block, index }: { block: string, index: number }) => (
    <Draggable draggableId={block} index={index}>
      {(provided, snapshot) => (
        <Box
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          style={{
            ...chip_style,
            flex: '1 1 0',
            boxShadow: snapshot.isDragging ? '0 2px 8px rgba(0,0,0,0.2)' : undefined,
            ...(provided.draggableProps.style ?? {})
          }}
          title={labelOf(block)}
        >
          <Box style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
            <Text
              as='span'
              style={{
                flex: 1, minWidth: 0, overflow: 'hidden',
                textOverflow: 'ellipsis', whiteSpace: 'nowrap'
              }}
            >
              {labelOf(block)}
            </Text>
            <Button
              size='xs' variant='menuconfigpanel_del_button'
              sx={{ paddingInline: '0.25rem', minWidth: 'auto', width: 'auto', flex: 'none' }}
              title={t('presentation.hide_here', {
                defaultValue: 'Retirer de ce contenant (le bloc reste dans le document)'
              })}
              onClick={() => writeComposition(
                unplaceBlock(normalizeAllLayouts(composition), block, mode))}
            >×</Button>
          </Box>
        </Box>
      )}
    </Draggable>
  )

  /** Zone de dépôt vide et discrète (nouvelle rangée / nouvel onglet). */
  const DropStrip = ({ id, label }: { id: string, label: string }) => (
    <Droppable droppableId={id} direction='horizontal'>
      {(provided, snapshot) => (
        <Box
          ref={provided.innerRef}
          {...provided.droppableProps}
          style={{
            border: '1px dashed',
            borderColor: snapshot.isDraggingOver ? '#4299e1' : '#e2e8f0',
            background: snapshot.isDraggingOver ? 'rgba(66,153,225,0.08)' : undefined,
            borderRadius: '4px',
            padding: '0.15rem 0.3rem',
            fontSize: '0.68rem',
            opacity: snapshot.isDraggingOver ? 1 : 0.6,
            textAlign: 'center'
          }}
        >
          {label}
          <Box style={{ display: 'none' }}>{provided.placeholder}</Box>
        </Box>
      )}
    </Droppable>
  )

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Box style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>

        {tabs.length === 0 && (
          <Box style={{ fontSize: default_font_size, opacity: 0.7, padding: '0.2rem 0.1rem' }}>
            {t('presentation.layout_empty', {
              defaultValue: 'Aucun bloc dans ce contenant. Faites-en glisser un depuis la réserve.'
            })}
          </Box>
        )}

        {tabs.map((cols, tab_index) => (
          <Box
            key={tab_index}
            style={{
              border: '1px solid #e2e8f0', borderRadius: '4px', padding: '0.25rem'
            }}
          >
            {/* Bandeau de l'onglet : son nom, et — sur le PREMIER onglet
                seulement — la zone « nouvel onglet ». Elle est placée là, en
                haut à droite, parce que c'est l'endroit où le nouvel onglet
                apparaîtra : la zone de dépôt occupe la place de son résultat. */}
            <Box style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              {/* Le nom ne sert qu'à partir de DEUX onglets : tant qu'il n'y en
                  a qu'un, le lecteur ne voit aucune barre d'onglets. */}
              {tabs.length > 1 ? (
                <Input
                  size='xs'
                  flex='1'
                  variant='menuconfigpanel_option_input'
                  placeholder={t('presentation.tab_name', { defaultValue: 'Nom de l\'onglet' })}
                  defaultValue={tabLabelAt(labels, mode, tab_index)}
                  // onBlur : un point d'undo par frappe de touche serait inutilisable.
                  onBlur={(e) => {
                    if (e.target.value !== tabLabelAt(labels, mode, tab_index)) {
                      writeLabels(setTabLabel(labels, mode, tab_index, e.target.value))
                    }
                  }}
                />
              ) : <Box style={{ flex: 1 }} />}
              {tab_index === 0 && tabs.length < MAX_TABS && (
                <Box style={{ flex: 'none', minWidth: '7rem' }}>
                  <DropStrip
                    id={NEW_TAB}
                    label={t('presentation.drop_new_tab', { defaultValue: '＋ onglet' })}
                  />
                </Box>
              )}
            </Box>

            {/* LE TABLEAU : des colonnes côte à côte, chacune empilant ses
                rangées, et une zone « nouvelle colonne » à droite. */}
            <Box style={{ display: 'flex', gap: '0.25rem', alignItems: 'flex-start', paddingTop: '0.2rem' }}>
              {cols.map((rows, col_index) => (
                <Box
                  key={col_index}
                  style={{
                    flex: '1 1 0', minWidth: 0,
                    display: 'flex', flexDirection: 'column', gap: '0.2rem'
                  }}
                >
                  {rows.map((cell, row_index) => (
                    <Droppable
                      key={row_index}
                      droppableId={cellDropId(tab_index, col_index, row_index)}
                      direction='horizontal'
                    >
                      {(provided, snapshot) => (
                        <Box
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          style={{
                            display: 'flex', gap: '0.2rem', alignItems: 'stretch',
                            padding: '0.1rem',
                            borderRadius: '4px',
                            background: snapshot.isDraggingOver ? 'rgba(66,153,225,0.08)' : undefined
                          }}
                        >
                          {cell.map((entry, i) => (
                            <Chip key={entry.block} block={entry.block} index={i} />
                          ))}
                          {provided.placeholder}
                        </Box>
                      )}
                    </Droppable>
                  ))}
                  <DropStrip
                    id={newRowDropId(tab_index, col_index)}
                    label={t('presentation.drop_new_row', { defaultValue: '＋ rangée' })}
                  />
                </Box>
              ))}
              {cols.length < MAX_COLS && (
                <Box style={{ flex: 'none', width: '5.5rem', alignSelf: 'stretch' }}>
                  <DropStrip
                    id={newColDropId(tab_index)}
                    label={t('presentation.drop_new_col', { defaultValue: '＋ colonne' })}
                  />
                </Box>
              )}
            </Box>
          </Box>
        ))}

        {/* RÉSERVE : les blocs du document absents de CE contenant. C'est aussi
            la zone où l'on relâche un bloc pour l'en retirer. */}
        <Box>
          <Box layerStyle='menuconfigpanel_option_name'>
            {t('presentation.tray', { defaultValue: 'Réserve (non affichés ici)' })}
          </Box>
          <Droppable droppableId={TRAY} direction='horizontal'>
            {(provided, snapshot) => (
              <Box
                ref={provided.innerRef}
                {...provided.droppableProps}
                style={{
                  display: 'flex', gap: '0.2rem', flexWrap: 'wrap', minHeight: '1.6rem',
                  padding: '0.15rem', borderRadius: '4px',
                  border: '1px dashed',
                  borderColor: snapshot.isDraggingOver ? '#4299e1' : '#e2e8f0',
                  background: snapshot.isDraggingOver ? 'rgba(66,153,225,0.08)' : undefined
                }}
              >
                {hidden.map((entry, i) => (
                  <Draggable key={entry.block} draggableId={entry.block} index={i}>
                    {(dp) => (
                      <Box
                        ref={dp.innerRef}
                        {...dp.draggableProps}
                        {...dp.dragHandleProps}
                        style={{ ...chip_style, opacity: 0.75, ...(dp.draggableProps.style ?? {}) }}
                      >
                        {labelOf(entry.block)}
                      </Box>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </Box>
            )}
          </Droppable>
        </Box>

        {tabs.length > 0 && (
          <Button
            size='xs'
            variant='menuconfigpanel_option_button'
            alignSelf='flex-start'
            sx={{ paddingInline: '0.4rem', minWidth: 'auto', width: 'auto' }}
            title={t('presentation.stack_tooltip', {
              defaultValue: 'Un bloc par rangée, un seul onglet — sans rien masquer'
            })}
            onClick={() => writeComposition(clearLayout(composition, mode))}
          >
            {t('presentation.stack', { defaultValue: 'Remettre en pile' })}
          </Button>
        )}
      </Box>
    </DragDropContext>
  )
}
