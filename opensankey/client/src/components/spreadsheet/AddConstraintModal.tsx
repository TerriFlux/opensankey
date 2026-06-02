// ==================================================================================================
// The MIT License (MIT) - Copyright (c) 2025 TerriFlux
// ==================================================================================================
// Modale « Ajouter une contrainte » du tableur. Wizard guidé qui route vers l'une des trois listes
// du modèle (sankeyexcelparser#116 / #156) selon le type des deux termes :
//   - Flux/Nœud-total  vs  Flux/Nœud-total  -> ratio_flux_constraints
//   - Flux             vs  Stock            -> ratio_stock_flux_constraints
//   - Stock            vs  Δ stock          -> stock_chaining_constraints
// Opérateur =/≥/≤ -> coef/min/max (le chaînage de stock n'a que coef => seul = est permis).
// Sélecteurs de nœud filtrables (Popover + recherche) pour les longues listes.
// ==================================================================================================

import React, { useState, useRef, useEffect } from 'react'
import {
  Button, RadioGroup, Radio, HStack, VStack, Text, Input, Box, CloseButton,
  Popover, PopoverTrigger, PopoverContent, PopoverBody, PopoverArrow, Portal, FormControl, FormLabel
} from '@chakra-ui/react'
import { ChevronDownIcon } from '@chakra-ui/icons'

import { Class_ApplicationData } from '../../types/ApplicationData'

/* eslint-disable @typescript-eslint/no-explicit-any */

type TermType = 'flux' | 'node_total' | 'stock' | 'delta_stock'
type Operator = 'eq' | 'geq' | 'leq'
type Dir = 'in' | 'out'

const AGG = '*'

// Sélecteur de nœud filtrable (Popover + recherche), réutilisable pour chaque champ nœud.
const NodeSelect = (
  { nodes, value, onChange, placeholder }:
  { nodes: string[], value: string, onChange: (v: string) => void, placeholder: string }
) => {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const lc = search.trim().toLowerCase()
  const rows = nodes.filter((n) => !lc || n.toLowerCase().includes(lc))
  return (
    <Popover isOpen={isOpen} onClose={() => setIsOpen(false)} placement='bottom-start' isLazy>
      <PopoverTrigger>
        <Button
          size='xs' variant='outline' width='100%' justifyContent='space-between'
          rightIcon={<ChevronDownIcon />} fontWeight='normal'
          onClick={() => setIsOpen((o) => !o)}
        >
          <Text isTruncated maxW='180px' color={value ? 'inherit' : 'gray.400'}>
            {value || placeholder}
          </Text>
        </Button>
      </PopoverTrigger>
      <Portal>
        <PopoverContent width='240px' zIndex={2100}>
          <PopoverArrow />
          <PopoverBody>
            <Input
              size='xs' placeholder='Rechercher…' value={search} mb={2}
              onChange={(e) => setSearch(e.target.value)} autoFocus
            />
            <VStack align='stretch' spacing={0} maxH='220px' overflowY='auto'>
              {rows.map((n) => (
                <Box
                  key={n} px={2} py={1} fontSize='xs' cursor='pointer' borderRadius='sm'
                  _hover={{ bg: 'blue.50' }} bg={n === value ? 'blue.100' : undefined}
                  onClick={() => { onChange(n); setIsOpen(false); setSearch('') }}
                >
                  {n}
                </Box>
              ))}
              {rows.length === 0 && (
                <Text fontSize='xs' color='gray.500' fontStyle='italic'>Aucun nœud</Text>
              )}
            </VStack>
          </PopoverBody>
        </PopoverContent>
      </Portal>
    </Popover>
  )
}

// Un terme = un côté de la contrainte. Selon son type, on saisit un flux (orig+dest), un nœud-total
// (un nœud + sens entrants/sortants), un stock (un nœud) ou un Δ stock (un nœud).
const TermEditor = (
  { label, type, setType, allowedTypes, nodes, nodeByName, state, setState }:
  {
    label: string, type: TermType, setType: (t: TermType) => void, allowedTypes: TermType[],
    nodes: string[], nodeByName: { [name: string]: any }, state: any, setState: (s: any) => void
  }
) => {
  const TYPE_LABELS: { [k in TermType]: string } = {
    flux: 'Flux', node_total: 'Nœud (total)', stock: 'Stock', delta_stock: 'Δ stock'
  }
  // Flux : une fois un côté choisi, l'autre se limite aux extrémités d'un flux réel
  // (via input_links_list / output_links_list du nœud sélectionné).
  const uniq = (a: string[]) => Array.from(new Set(a)).sort((x, y) => x.localeCompare(y))
  const origNode = state.dest ? nodeByName[state.dest] : null
  const destNode = state.orig ? nodeByName[state.orig] : null
  const fluxOrigOptions = origNode
    ? uniq(origNode.input_links_list.map((l: any) => l.source.name))
    : nodes
  const fluxDestOptions = destNode
    ? uniq(destNode.output_links_list.map((l: any) => l.target.name))
    : nodes
  return (
    <Box borderWidth='1px' borderRadius='md' p={2}>
      <Text fontWeight='bold' fontSize='sm' mb={1}>{label}</Text>
      <RadioGroup size='sm' value={type} onChange={(v) => setType(v as TermType)} mb={2}>
        <HStack spacing={3}>
          {allowedTypes.map((t) => <Radio key={t} value={t}>{TYPE_LABELS[t]}</Radio>)}
        </HStack>
      </RadioGroup>
      {type === 'flux' && (
        <HStack>
          <NodeSelect nodes={fluxOrigOptions} value={state.orig || ''} placeholder='Origine'
            onChange={(v) => setState({ ...state, orig: v })} />
          <Text fontSize='xs'>→</Text>
          <NodeSelect nodes={fluxDestOptions} value={state.dest || ''} placeholder='Destination'
            onChange={(v) => setState({ ...state, dest: v })} />
        </HStack>
      )}
      {type === 'node_total' && (
        <HStack>
          <NodeSelect nodes={nodes} value={state.node || ''} placeholder='Nœud'
            onChange={(v) => setState({ ...state, node: v })} />
          <RadioGroup size='sm' value={state.dir || 'in'} onChange={(v) => setState({ ...state, dir: v as Dir })}>
            <HStack spacing={2}>
              <Radio value='in'>entrants</Radio>
              <Radio value='out'>sortants</Radio>
            </HStack>
          </RadioGroup>
        </HStack>
      )}
      {(type === 'stock' || type === 'delta_stock') && (
        <NodeSelect nodes={nodes} value={state.node || ''} placeholder='Nœud'
          onChange={(v) => setState({ ...state, node: v })} />
      )}
    </Box>
  )
}

// Convertit un terme nœud-total en couple (origine, destination) avec le wildcard "*".
const totalToPair = (node: string, dir: Dir): [string, string] =>
  dir === 'in' ? [AGG, node] : [node, AGG]

type ConstraintFamily = 'ratio_flux' | 'ratio_stock_flux' | 'stock_chaining'

export const AddConstraintModal = (
  { app_data, isOpen, onClose, onAdded }:
  {
    app_data: Class_ApplicationData, isOpen: boolean, onClose: () => void,
    onAdded?: (family: ConstraintFamily) => void
  }
) => {
  const sankey = app_data.drawing_area.sankey
  const nodes = (sankey.nodes_list as any[]).map((n) => n.name).sort((a, b) => a.localeCompare(b))
  // Map nom -> nœud, pour exploiter input_links_list / output_links_list lors du filtrage Flux.
  const nodeByName: { [name: string]: any } = {}
  ;(sankey.nodes_list as any[]).forEach((n) => { nodeByName[n.name] = n })

  const [t1Type, setT1Type] = useState<TermType>('flux')
  const [t2Type, setT2Type] = useState<TermType>('flux')
  const [t1, setT1] = useState<any>({})
  const [t2, setT2] = useState<any>({})
  const [op, setOp] = useState<Operator>('eq')
  const [value, setValue] = useState<string>('1')
  const [traduction, setTraduction] = useState<string>('')
  // La traduction est générée automatiquement par défaut ; dès que l'utilisateur la modifie,
  // on garde SON texte (traductionEdited) au lieu de l'auto-description.
  const [traductionEdited, setTraductionEdited] = useState(false)

  // Drag manuel : position:fixed + Portal (rendu au niveau body) -> déplaçable dans toute la fenêtre,
  // pas clippé par le conteneur du tableur. (react-draggable dans un Portal ne rendait pas.)
  const [pos, setPos] = useState<{ x: number, y: number } | null>(null)
  const dragOffset = useRef<{ dx: number, dy: number } | null>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragOffset.current) { return }
      setPos({ x: e.clientX - dragOffset.current.dx, y: e.clientY - dragOffset.current.dy })
    }
    const onUp = () => { dragOffset.current = null }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [])
  const startDrag = (e: React.MouseEvent) => {
    const rect = panelRef.current?.getBoundingClientRect()
    if (!rect) { return }
    dragOffset.current = { dx: e.clientX - rect.left, dy: e.clientY - rect.top }
    if (!pos) { setPos({ x: rect.left, y: rect.top }) }
  }

  // Types autorisés pour le terme 2 selon le terme 1 (filtrage des combinaisons valides).
  //  - Stock        -> seulement Δ stock (chaînage)
  //  - Nœud-total   -> Flux / Nœud-total (ratio flux ; pas de Stock car le côté flux ne peut pas être "*")
  //  - Flux         -> Flux / Nœud-total / Stock
  const t2Allowed: TermType[] =
    t1Type === 'stock' ? ['delta_stock']
      : t1Type === 'node_total' ? ['flux', 'node_total']
        : ['flux', 'node_total', 'stock']
  // Recale t2 si la combinaison devient invalide.
  if (!t2Allowed.includes(t2Type)) {
    setT2Type(t2Allowed[0])
  }

  // Famille de contrainte résolue (et donc liste cible).
  const family: 'ratio_flux' | 'ratio_stock_flux' | 'stock_chaining' | null =
    (t1Type === 'stock' && t2Type === 'delta_stock') ? 'stock_chaining'
      : (t1Type === 'flux' && t2Type === 'stock') ? 'ratio_stock_flux'
        : ((t1Type === 'flux' || t1Type === 'node_total') && (t2Type === 'flux' || t2Type === 'node_total')) ? 'ratio_flux'
          : null

  // Le chaînage de stock n'a que coef -> seul "=" est permis.
  const opDisabled = family === 'stock_chaining'
  if (opDisabled && op !== 'eq') {
    setOp('eq')
  }

  const num = (() => { const n = Number(value.replace(',', '.')); return isNaN(n) ? null : n })()
  const coef = op === 'eq' ? num : null
  const min = op === 'geq' ? num : null
  const max = op === 'leq' ? num : null

  // Validité du terme : tous les nœuds requis sont saisis.
  const termOk = (type: TermType, s: any): boolean =>
    type === 'flux' ? !!(s.orig && s.dest)
      : type === 'node_total' ? !!s.node
        : !!s.node
  const canAdd = !!family && termOk(t1Type, t1) && termOk(t2Type, t2) && num !== null

  const mainPair = (): [string, string] =>
    t1Type === 'flux' ? [t1.orig, t1.dest] : totalToPair(t1.node, (t1.dir as Dir) || 'in')

  const OP_LABEL: { [k in Operator]: string } = { eq: '=', geq: '≥', leq: '≤' }

  // Traduction générée automatiquement à partir des choix (par défaut ; surchargeable).
  const describeTerm = (type: TermType, s: any): string =>
    type === 'flux' ? `flux ${s.orig || '?'}→${s.dest || '?'}`
      : type === 'node_total' ? `total des ${s.dir === 'out' ? 'sortants' : 'entrants'} de ${s.node || '?'}`
        : type === 'stock' ? `stock de ${s.node || '?'}`
          : `Δ stock de ${s.node || '?'}`
  const autoTraduction =
    `${describeTerm(t1Type, t1)} ${OP_LABEL[op]} ${value || '?'} × ${describeTerm(t2Type, t2)}`
  const effectiveTraduction = (traductionEdited ? traduction : autoTraduction).trim() || null

  const add = () => {
    if (!canAdd || !family) {
      return
    }
    if (family === 'ratio_flux') {
      const [origin, destination] = mainPair()
      const [origin_ref, destination_ref] =
        t2Type === 'flux' ? [t2.orig, t2.dest] : totalToPair(t2.node, (t2.dir as Dir) || 'in')
      sankey.ratio_flux_constraints.push({
        origin, destination, origin_ref, destination_ref,
        coef, min, max, data_tag: null, data_tag_ref: null, traduction: effectiveTraduction
      })
    } else if (family === 'ratio_stock_flux') {
      const [origin, destination] = mainPair()
      sankey.ratio_stock_flux_constraints.push({
        origin, destination, coef, min, max,
        stock: t2.node, data_tag: null, data_tag_ref: null, traduction: effectiveTraduction
      })
    } else {
      sankey.stock_chaining_constraints.push({
        stock: t1.node, coef, delta_stock: t2.node,
        data_tag: null, data_tag_ref: null, traduction: effectiveTraduction
      })
    }
    // Bascule sur l'onglet de la famille + rebuild (géré par UniverSpreadSheet qui a l'API Univer).
    if (onAdded) {
      onAdded(family)
    }
    onClose()
  }

  if (!isOpen) {
    return null
  }

  const panelStyle: React.CSSProperties = {
    position: 'fixed',
    left: pos ? pos.x : '33vw',
    top: pos ? pos.y : '14vh',
    zIndex: 2000
  }

  return (
    <Portal>
      <Box
        ref={panelRef}
        style={panelStyle}
        layerStyle='menu_draggable_layout'
        minW='420px'
        maxW='40vw'
      >
        <Box
          className='title_menu'
          layerStyle='menu_draggable_title_layout'
          onMouseDown={startDrag}
          cursor='move'
          userSelect='none'
        >
          <Text justifySelf='start' fontStyle='h1' margin='0'>Ajouter une contrainte</Text>
          <CloseButton justifySelf='end' onClick={onClose} />
        </Box>
        <Box layerStyle='menu_draggable_content_layout'>
          <VStack align='stretch' spacing={3}>
            <TermEditor
              label='Terme 1' type={t1Type} setType={setT1Type}
              allowedTypes={['flux', 'node_total', 'stock']}
              nodes={nodes} nodeByName={nodeByName} state={t1} setState={setT1}
            />
            <HStack justify='center'>
              <RadioGroup size='sm' value={op} onChange={(v) => setOp(v as Operator)}>
                <HStack spacing={4}>
                  {(['eq', 'geq', 'leq'] as Operator[]).map((o) => (
                    <Radio key={o} value={o} isDisabled={opDisabled && o !== 'eq'}>{OP_LABEL[o]}</Radio>
                  ))}
                </HStack>
              </RadioGroup>
              <Input
                size='xs' width='90px' value={value} placeholder='coef'
                onChange={(e) => setValue(e.target.value)}
              />
              <Text fontSize='sm'>×</Text>
            </HStack>
            <TermEditor
              label='Terme 2 (référence)' type={t2Type} setType={setT2Type}
              allowedTypes={t2Allowed}
              nodes={nodes} nodeByName={nodeByName} state={t2} setState={setT2}
            />
            <FormControl>
              <HStack justify='space-between' mb={1}>
                <FormLabel fontSize='xs' m={0}>Traduction (auto, modifiable)</FormLabel>
                {traductionEdited && (
                  <Button size='xs' variant='link' colorScheme='blue'
                    onClick={() => { setTraductionEdited(false); setTraduction('') }}>
                      régénérer
                  </Button>
                )}
              </HStack>
              <Input
                size='xs'
                value={traductionEdited ? traduction : autoTraduction}
                onChange={(e) => { setTraduction(e.target.value); setTraductionEdited(true) }}
                placeholder='Description en langage naturel'
              />
            </FormControl>
            {!family && (
              <Text fontSize='xs' color='red.500'>Combinaison de termes non valide.</Text>
            )}
            <HStack justify='flex-end' spacing={2} pt={1}>
              <Button size='sm' variant='ghost' onClick={onClose}>Annuler</Button>
              <Button size='sm' colorScheme='blue' isDisabled={!canAdd} onClick={add}>Ajouter</Button>
            </HStack>
          </VStack>
        </Box>
      </Box>
    </Portal>
  )
}
