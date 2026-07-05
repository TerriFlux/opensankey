import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Box, Button, ButtonGroup, Text, Textarea, useToast } from '@chakra-ui/react'
import { Class_ApplicationData } from '../../types/ApplicationData'
import { serializeSankeyToText } from './sankeyTextFormat'
import { applySankeymaticText } from '../../Persistence/sankeymaticLoad'

type Type_Layout = 'sankeymatic' | 'auto'

// Compte les lignes de flux (hors commentaires) pour l'indicateur : une ligne
// de flux SankeyMATIC contient `[valeur]`.
const countFlows = (text: string): number =>
  text.split(/\r?\n/).filter(l => {
    const t = l.trim()
    return t && !t.startsWith('//') && !t.startsWith(':') && /\[[\d*.]+\]/.test(t)
  }).length

/**
 * Éditeur texte (format SankeyMATIC natif) du diagramme courant, monté dans le
 * Tableur via le sélecteur Tableur/Texte. Bidirectionnel :
 *  - à l'ouverture, le diagramme est sérialisé en texte (sens « save ») ;
 *  - « Appliquer » reconstruit le diagramme à partir du texte via le parseur
 *    SankeyMATIC complet (couleurs, réglages, [*]…), en remplacement complet
 *    (annulable par Ctrl+Z). Le placement suit SankeyMATIC ou notre auto-layout
 *    selon l'option choisie.
 */
export const SankeyTextEditor = ({ app_data }: { app_data: Class_ApplicationData }) => {
  const { t } = app_data
  const toast = useToast()

  // Sérialisation initiale = état courant du diagramme (le composant est monté à
  // la bascule vers le mode Texte, donc reflète le diagramme à ce moment).
  const [text, setText] = useState(() => serializeSankeyToText(app_data.drawing_area.sankey))
  const [layout, setLayout] = useState<Type_Layout>('sankeymatic')
  const [busy, setBusy] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const flowCount = useMemo(() => countFlows(text), [text])

  const refreshFromDiagram = () => {
    setText(serializeSankeyToText(app_data.drawing_area.sankey))
  }

  // S'abonne au même canal que le tableur-grille (ref_to_spreadsheet, appelé sur
  // tout changement de liens : tracé de flux, suppression…) pour se resynchroniser.
  // Un seul des deux panneaux (grille/texte) est monté à la fois, donc pas de conflit
  // d'abonnement. On NE réécrit PAS pendant la frappe (textarea focus) pour ne pas
  // écraser une saisie en cours ; tracer un flux défocalise le textarea -> MAJ.
  useEffect(() => {
    const mc = app_data.menu_configuration
    const previous = mc.ref_to_spreadsheet.current
    mc.ref_to_spreadsheet.current = () => {
      if (document.activeElement !== textareaRef.current) {
        setText(serializeSankeyToText(app_data.drawing_area.sankey))
      }
    }
    return () => { mc.ref_to_spreadsheet.current = previous }
  }, [app_data])

  const handleApply = () => {
    if (flowCount === 0) return
    setBusy(true)
    // Laisse le bouton passer en état loading avant le travail synchrone.
    setTimeout(() => {
      try {
        // Parseur SankeyMATIC complet -> fromJSON (remplacement du diagramme,
        // positions natives SankeyMATIC).
        applySankeymaticText(text, app_data)
        if (layout === 'auto') {
          // Option : rejouer notre auto-layout par-dessus les positions natives.
          app_data.drawing_area.nodePositioning.computeAutoSankeyWithToast(true, true)
        }
        app_data.draw()
        app_data.menu_configuration.updateComponentRelatedToLinksData()
        toast({ title: t('Spreadsheet.text.applied'), status: 'success', duration: 3000 })
      }
      catch (e) {
        toast({ title: t('Spreadsheet.text.error'), description: String(e), status: 'error', duration: 6000 })
      }
      finally {
        setBusy(false)
      }
    }, 0)
  }

  const layoutBtn = (m: Type_Layout) => ({
    colorScheme: layout === m ? 'blue' : 'gray',
    variant: (layout === m ? 'solid' : 'outline') as 'solid' | 'outline',
    onClick: () => setLayout(m),
  })

  return (
    <Box display='flex' flexDirection='column' height='100%' minHeight={0} p={2} gap={2}>
      <Text fontSize='xs' color='gray.600'>
        {t('Spreadsheet.text.help')}
      </Text>
      <Textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        flex='1 1 0'
        minHeight={0}
        resize='none'
        fontFamily='mono'
        fontSize='xs'
        spellCheck={false}
        placeholder={'Wages [1500] Budget\nBudget [450] Taxes\n:Taxes #d74'}
      />
      <Box display='flex' alignItems='center' gap={2} flexWrap='wrap'>
        <Text fontSize='xs' color='gray.500'>
          {flowCount} {t('Spreadsheet.text.flows_recognized')}
        </Text>
        <Box display='flex' alignItems='center' gap={1} ml='auto'>
          <Text fontSize='xs' color='gray.600'>{t('Spreadsheet.text.layout')}</Text>
          <ButtonGroup size='xs' isAttached>
            <Button {...layoutBtn('sankeymatic')}>{t('Spreadsheet.text.layout_native')}</Button>
            <Button {...layoutBtn('auto')}>{t('Spreadsheet.text.layout_auto')}</Button>
          </ButtonGroup>
        </Box>
        <Button size='xs' variant='ghost' onClick={refreshFromDiagram}>
          {t('Spreadsheet.text.refresh')}
        </Button>
        <Button size='xs' colorScheme='blue' isLoading={busy} isDisabled={flowCount === 0} onClick={handleApply}>
          {t('Spreadsheet.text.apply')}
        </Button>
      </Box>
    </Box>
  )
}
