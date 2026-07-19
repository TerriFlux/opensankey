// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2025 TerriFlux
// ==================================================================================================
// Author        : Julien Alapetite for TerriFlux
// ==================================================================================================

// OS#1273 (lot E1) — Recherche d'élément dans le diagramme.
//
// Une barre de recherche (raccourci Ctrl+F, ou bouton de la colonne d'outils) qui filtre les
// nœuds, flux et zones de texte par nom/label. Sélectionner un résultat :
//   1. purge la sélection courante puis sélectionne l'élément trouvé (surlignage) — via les
//      primitives existantes purgeSelection / addElementToSelection ;
//   2. recadre la caméra dessus — via flyToNode (nœud) ou flyToPoint (flux / zone).
// Navigation entre résultats au clavier (↑/↓, Entrée) et par boutons Préc. / Suiv.
//
// Le composant tient son propre état (ouvert, requête, index actif) ; le raccourci clavier le
// bascule via le slot ref_toggle_search de MenuConfig (renseigné ici au montage).

import React, { useEffect, useMemo, useRef, useState } from 'react'
import Draggable, { DraggableProps } from 'react-draggable'
import {
  Box, HStack, VStack, Input, Button, Text, Checkbox
} from '@chakra-ui/react'
import { ChevronUpIcon, ChevronDownIcon, CloseIcon, SearchIcon } from '@chakra-ui/icons'

import { Class_ApplicationData } from '../../types/ApplicationData'
import { Class_NodeElement } from '../../Elements/Node'
import { Class_LinkElement } from '../../Elements/Link'
import { Class_ContainerElement } from '../../Elements/TextZone'

// react-draggable : les typings embarqués rendent les props optionnelles, mais
// @types/react-draggable (tiré par la résolution fraîche du CI) les rend requises.
const DraggableComponent = Draggable as unknown as React.ComponentClass<Partial<DraggableProps>>

type ElementType = 'node' | 'link' | 'container'

interface SearchResult {
  key: string
  type: ElementType
  label: string
  sublabel: string
  element: Class_NodeElement | Class_LinkElement | Class_ContainerElement
  // Chaîne concaténée (minuscule) sur laquelle porte la comparaison.
  haystack: string
}

// Libellés RECHERCHABLES d'un élément (nom + label effectif + noms des extrémités pour un flux).
const nodeHaystack = (n: Class_NodeElement) =>
  [n.name, n.name_label_effective].filter(Boolean).join(' ')
const containerHaystack = (c: Class_ContainerElement) =>
  [c.name, c.name_label_effective].filter(Boolean).join(' ')
const linkHaystack = (l: Class_LinkElement) =>
  [l.name, l.source.name, l.target.name].filter(Boolean).join(' ')

const collectResults = (
  app_data: Class_ApplicationData,
  query: string,
  only_visible: boolean
): SearchResult[] => {
  const { sankey } = app_data.drawing_area
  const q = query.trim().toLowerCase()
  if (q === '') return []

  const nodes = only_visible ? sankey.visible_nodes_list : sankey.nodes_list
  const links = only_visible ? sankey.visible_links_list : sankey.links_list
  const containers = only_visible ? sankey.visible_containers_list : sankey.containers_list

  const out: SearchResult[] = []

  nodes.forEach(n => {
    const haystack = nodeHaystack(n)
    if (haystack.toLowerCase().includes(q)) {
      out.push({
        key: 'node:' + n.id,
        type: 'node',
        label: n.name_label_effective || n.name,
        sublabel: app_data.t('search.type.node'),
        element: n,
        haystack
      })
    }
  })

  links.forEach(l => {
    const haystack = linkHaystack(l)
    if (haystack.toLowerCase().includes(q)) {
      out.push({
        key: 'link:' + l.id,
        type: 'link',
        label: `${l.source.name} → ${l.target.name}`,
        sublabel: app_data.t('search.type.link'),
        element: l,
        haystack
      })
    }
  })

  containers.forEach(c => {
    const haystack = containerHaystack(c)
    if (haystack.toLowerCase().includes(q)) {
      out.push({
        key: 'container:' + c.id,
        type: 'container',
        label: c.name_label_effective || c.name,
        sublabel: app_data.t('search.type.container'),
        element: c,
        haystack
      })
    }
  })

  return out
}

export const ElementSearchOverlay = ({ app_data }: { app_data: Class_ApplicationData }) => {
  const { t, drawing_area } = app_data
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [only_visible, setOnlyVisible] = useState(true)
  const [active, setActive] = useState(0)
  const input_ref = useRef<HTMLInputElement>(null)
  const node_ref = useRef<HTMLDivElement>(null)
  // Un premier Entrée cible le résultat actif ; les suivants naviguent. Remis à
  // zéro dès que la requête change (nouvelle liste de résultats).
  const visited_ref = useRef(false)

  // Slot clavier (Ctrl+F). Fonction de bascule stable via mise à jour fonctionnelle
  // (pas de closure périmée). Renseigné à chaque rendu, relâché au démontage.
  useEffect(() => {
    app_data.menu_configuration.ref_toggle_search.current = () => setOpen(o => !o)
    return () => { app_data.menu_configuration.ref_toggle_search.current = () => undefined }
  }, [app_data])

  // À l'ouverture : focus + sélection du texte pour ré-écrire vite.
  useEffect(() => {
    if (open) {
      // rAF : l'input vient d'être monté.
      requestAnimationFrame(() => {
        input_ref.current?.focus()
        input_ref.current?.select()
      })
    }
  }, [open])

  const results = useMemo(
    () => collectResults(app_data, query, only_visible),
    // app_data.language : rebâtit les sous-libellés traduits si la langue change.
    [app_data, query, only_visible, app_data.language]
  )

  // Borne l'index actif quand la liste de résultats change.
  useEffect(() => {
    setActive(a => (results.length === 0 ? 0 : Math.min(a, results.length - 1)))
  }, [results.length])

  // Sélectionne l'élément d'un résultat (surlignage) et recadre la caméra dessus.
  const focusResult = (r: SearchResult | undefined) => {
    if (!r) return
    drawing_area.purgeSelection()
    drawing_area.addElementToSelection(r.element)
    if (r.type === 'node') {
      drawing_area.flyToNode(r.element as Class_NodeElement)
    } else if (r.type === 'container') {
      const c = r.element as Class_ContainerElement
      drawing_area.flyToPoint(
        c.position_x + c.getShapeWidthToUse() / 2,
        c.position_y + c.getShapeHeightToUse() / 2
      )
    } else {
      const l = r.element as Class_LinkElement
      drawing_area.flyToPoint(
        (l.position_x_start + l.position_x_end) / 2,
        (l.position_y_start + l.position_y_end) / 2
      )
    }
  }

  const go = (delta: number) => {
    if (results.length === 0) return
    visited_ref.current = true
    const next = (active + delta + results.length) % results.length
    setActive(next)
    focusResult(results[next])
  }

  const close = () => {
    setOpen(false)
    setQuery('')
  }

  // Clavier DANS l'input : on gère la navigation ici et on stoppe la propagation
  // vers le gestionnaire global (document.onkeydown) — sinon Échap purgerait la
  // sélection et Entrée blurrerait l'input.
  const onInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault(); e.stopPropagation()
      close()
    } else if (e.key === 'Enter') {
      e.preventDefault(); e.stopPropagation()
      // Premier Entrée : cible le résultat actif ; ensuite navigue (suivant, ou
      // précédent avec Maj) — comme un Ctrl+F natif.
      if (results.length > 0) {
        if (!visited_ref.current) {
          visited_ref.current = true
          focusResult(results[active])
        } else {
          go(e.shiftKey ? -1 : 1)
        }
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault(); e.stopPropagation()
      go(1)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault(); e.stopPropagation()
      go(-1)
    }
  }

  if (!open) return null

  const no_result = query.trim() !== '' && results.length === 0

  return (
    <DraggableComponent
      nodeRef={node_ref}
      handle='.element-search-handle'
      defaultPosition={{ x: Math.max(0, window.innerWidth / 2 - 190), y: 70 }}
      bounds={{ left: 0, top: 0 }}
    >
      <Box
        ref={node_ref}
        className='ElementSearchOverlay'
        position='fixed'
        zIndex={1400}
        bg='white'
        borderRadius='md'
        boxShadow='xl'
        border='1px solid'
        borderColor='gray.200'
        width='380px'
        overflow='hidden'
        display='flex'
        flexDirection='column'
      >
        {/* Barre de saisie + navigation (poignée de déplacement) */}
        <HStack
          className='element-search-handle'
          spacing='0.3rem'
          px='0.4rem'
          py='0.35rem'
          bg='gray.50'
          cursor='grab'
          _active={{ cursor: 'grabbing' }}
        >
          <SearchIcon color='gray.500' boxSize='0.8rem' />
          <Input
            ref={input_ref}
            size='xs'
            variant='flushed'
            placeholder={t('search.placeholder')}
            value={query}
            // L'input ne doit pas déclencher le drag.
            onMouseDown={(e) => e.stopPropagation()}
            onChange={(e) => { setQuery(e.target.value); setActive(0); visited_ref.current = false }}
            onKeyDown={onInputKeyDown}
          />
          <Text fontSize='0.65rem' color='gray.500' whiteSpace='nowrap' minW='2.8rem' textAlign='right'>
            {results.length > 0
              ? t('search.counter', { current: active + 1, total: results.length })
              : (no_result ? t('search.no_result') : '')}
          </Text>
          <Button
            size='xs' variant='ghost' colorScheme='gray'
            minW='1.3rem' w='1.3rem' h='1.5rem' p='0'
            title={t('search.prev')} aria-label={t('search.prev')}
            isDisabled={results.length === 0}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={() => go(-1)}
          >
            <ChevronUpIcon />
          </Button>
          <Button
            size='xs' variant='ghost' colorScheme='gray'
            minW='1.3rem' w='1.3rem' h='1.5rem' p='0'
            title={t('search.next')} aria-label={t('search.next')}
            isDisabled={results.length === 0}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={() => go(1)}
          >
            <ChevronDownIcon />
          </Button>
          <Button
            size='xs' variant='ghost' colorScheme='gray'
            minW='1.3rem' w='1.3rem' h='1.5rem' p='0'
            title={t('search.close')} aria-label={t('search.close')}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={close}
          >
            <CloseIcon boxSize='0.55rem' />
          </Button>
        </HStack>

        {/* Liste des résultats */}
        {query.trim() !== '' && (
          <VStack
            align='stretch'
            spacing='0'
            maxH='16rem'
            overflowY='auto'
            borderTop='1px solid'
            borderColor='gray.100'
          >
            {results.map((r, i) => (
              <HStack
                key={r.key}
                spacing='0.4rem'
                px='0.5rem'
                py='0.25rem'
                cursor='pointer'
                bg={i === active ? 'blue.50' : 'transparent'}
                _hover={{ bg: i === active ? 'blue.100' : 'gray.50' }}
                onClick={() => { setActive(i); visited_ref.current = true; focusResult(r) }}
              >
                <Text
                  fontSize='0.6rem' color='gray.500'
                  minW='2.2rem' textTransform='uppercase' whiteSpace='nowrap'
                >
                  {r.sublabel}
                </Text>
                <Text fontSize='0.75rem' noOfLines={1} flex='1'>
                  {r.label || <Box as='span' color='gray.400'>—</Box>}
                </Text>
              </HStack>
            ))}
          </VStack>
        )}

        {/* Option : ne chercher que dans les éléments visibles */}
        <HStack px='0.5rem' py='0.25rem' borderTop='1px solid' borderColor='gray.100'>
          <Checkbox
            size='sm'
            isChecked={only_visible}
            onMouseDown={(e) => e.stopPropagation()}
            onChange={(e) => setOnlyVisible(e.target.checked)}
          >
            <Text fontSize='0.7rem'>{t('search.only_visible')}</Text>
          </Checkbox>
        </HStack>
      </Box>
    </DraggableComponent>
  )
}
