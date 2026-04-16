import React, { useState, useRef } from 'react'
import Draggable from 'react-draggable'
import {
  Button,
  Box,
  Text,
  CloseButton,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  useToast,
} from '@chakra-ui/react'
import FileSaver from 'file-saver'
import { Class_ApplicationData } from '../../types/ApplicationData'

// Sheet definitions with labels and grouping
const SHEET_GROUPS = [
  {
    label_fr: 'Structure',
    label_en: 'Structure',
    label_es: 'Estructura',
    label_de: 'Struktur',
    label_it: 'Struttura',
    sheets: [
      { key: 'tags', label_fr: 'Étiquettes', label_en: 'Tags', label_es: 'Etiquetas', label_de: 'Tags', label_it: 'Etichette', checked: true },
      { key: 'nodes', label_fr: 'Nœuds', label_en: 'Nodes', label_es: 'Nodos', label_de: 'Knoten', label_it: 'Nodi', checked: false },
      { key: 'products', label_fr: 'Produits', label_en: 'Products', label_es: 'Productos', label_de: 'Produkte', label_it: 'Prodotti', checked: true },
      { key: 'sectors', label_fr: 'Secteurs', label_en: 'Sectors', label_es: 'Sectores', label_de: 'Sektoren', label_it: 'Settori', checked: true },
      { key: 'exchanges', label_fr: 'Échanges', label_en: 'Exchanges', label_es: 'Intercambios', label_de: 'Austausche', label_it: 'Scambi', checked: false },
      { key: 'ter', label_fr: 'TER', label_en: 'TER', label_es: 'TER', label_de: 'TER', label_it: 'TER', checked: true },
    ],
  },
  {
    label_fr: 'Données',
    label_en: 'Data',
    label_es: 'Datos',
    label_de: 'Daten',
    label_it: 'Dati',
    sheets: [
      { key: 'data', label_fr: 'Valeurs', label_en: 'Values', label_es: 'Valores', label_de: 'Werte', label_it: 'Valori', checked: true },
      { key: 'min_max', label_fr: 'Min Max', label_en: 'Min Max', label_es: 'Mín Máx', label_de: 'Min Max', label_it: 'Min Max', checked: false },
      { key: 'stocks', label_fr: 'Stocks', label_en: 'Stocks', label_es: 'Existencias', label_de: 'Bestände', label_it: 'Scorte', checked: false },
    ],
  },
  {
    label_fr: 'Contraintes',
    label_en: 'Constraints',
    label_es: 'Restricciones',
    label_de: 'Einschränkungen',
    label_it: 'Vincoli',
    sheets: [
      { key: 'constraints', label_fr: 'Contraintes', label_en: 'Constraints', label_es: 'Restricciones', label_de: 'Einschränkungen', label_it: 'Vincoli', checked: false },
      { key: 'ratio_flux', label_fr: 'Ratio Flux', label_en: 'Ratio Flux', label_es: 'Ratio Flujo', label_de: 'Fluss-Verhältnis', label_it: 'Rapporto Flusso', checked: false },
    ],
  },
  {
    label_fr: 'Résultats',
    label_en: 'Results',
    label_es: 'Resultados',
    label_de: 'Ergebnisse',
    label_it: 'Risultati',
    sheets: [
      { key: 'results', label_fr: 'Résultats', label_en: 'Results', label_es: 'Resultados', label_de: 'Ergebnisse', label_it: 'Risultati', checked: false },
      { key: 'analysis', label_fr: 'Analyse', label_en: 'Analysis', label_es: 'Análisis', label_de: 'Analyse', label_it: 'Analisi', checked: false },
    ],
  },
  {
    label_fr: 'Doc',
    label_en: 'Doc',
    label_es: 'Doc',
    label_de: 'Dok',
    label_it: 'Doc',
    sheets: [
      { key: 'readme', label_fr: 'Readme', label_en: 'Readme', label_es: 'Léame', label_de: 'Readme', label_it: 'Leggimi', checked: true },
    ],
  },
]

function getInitialChecked(): Record<string, boolean> {
  const checked: Record<string, boolean> = {}
  for (const group of SHEET_GROUPS) {
    for (const sheet of group.sheets) {
      checked[sheet.key] = sheet.checked
    }
  }
  return checked
}

const tabSx = {
  display: 'inline-flex !important', width: 'auto !important', height: 'auto !important',
  padding: '2px 8px !important', margin: '0 !important', borderRadius: '4px !important',
  fontSize: '0.75rem', fontWeight: 'semibold', cursor: 'pointer',
  border: '1px solid', borderColor: 'gray.300', color: 'gray.600',
  _selected: { bg: 'gray.100', color: 'gray.800', borderColor: 'gray.500' },
}

export const ModalExcelTemplate = ({
  new_data,
  show,
  setShow,
}: {
  new_data: Class_ApplicationData
  show: boolean
  setShow: (v: boolean) => void
}) => {
  const { i18n } = new_data
  const langCode = i18n.language?.substring(0, 2) ?? 'en'
  const lang = (['fr', 'es', 'de', 'it'].includes(langCode)) ? langCode : 'en'
  const labelKey = ('label_' + lang) as 'label_fr' | 'label_en' | 'label_es' | 'label_de' | 'label_it'

  const [checked, setChecked] = useState<Record<string, boolean>>(getInitialChecked)
  const [loading, setLoading] = useState(false)
  const toast = useToast()
  const nodeRef = useRef(null)

  const toggle = (key: string) => {
    setChecked((prev: Record<string, boolean>) => ({ ...prev, [key]: !prev[key] }))
  }

  const selectedSheets = Object.entries(checked)
    .filter(([, v]) => v)
    .map(([k]) => k)

  const countInGroup = (gi: number) =>
    SHEET_GROUPS[gi].sheets.filter((s) => checked[s.key]).length

  const toggleGroup = (gi: number, on: boolean) => {
    setChecked((prev: Record<string, boolean>) => {
      const next = { ...prev }
      for (const s of SHEET_GROUPS[gi].sheets) next[s.key] = on
      return next
    })
  }

  const handleDownload = async () => {
    if (selectedSheets.length === 0) return
    setLoading(true)
    try {
      const resp = await fetch('/opensankey/menus/excel_template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sheets: selectedSheets, lang }),
      })
      if (!resp.ok) throw new Error(await resp.text())
      const blob = await resp.blob()
      FileSaver.saveAs(blob, 'template_afm.xlsx')
      setShow(false)
    } catch (e) {
      toast({
        title: ({ fr: 'Erreur', en: 'Error', es: 'Error', de: 'Fehler', it: 'Errore' } as Record<string, string>)[lang] ?? 'Error',
        description: String(e),
        status: 'error',
        duration: 5000,
      })
    } finally {
      setLoading(false)
    }
  }

  if (!show) return null

  return (
    <Draggable
      nodeRef={nodeRef}
      handle='.excel-template-handle'
      defaultPosition={{ x: window.innerWidth / 4, y: window.innerHeight / 4 }}
      bounds={{ left: 0, top: 0 }}
    >
      <Box
        ref={nodeRef}
        position='fixed'
        zIndex={1500}
        bg='white'
        borderRadius='md'
        boxShadow='xl'
        border='1px solid'
        borderColor='gray.200'
        width='440px'
        overflow='hidden'
        display='flex'
        flexDirection='column'
      >
        {/* Draggable title bar */}
        <Box
          className='excel-template-handle'
          bg='gray.100'
          px={3}
          py={2}
          cursor='grab'
          display='flex'
          justifyContent='space-between'
          alignItems='center'
          borderBottom='1px solid'
          borderColor='gray.300'
          _active={{ cursor: 'grabbing' }}
        >
          <Text fontWeight='bold' fontSize='sm'>
            {({ fr: 'Fichier Excel vierge', en: 'Blank Excel file', es: 'Archivo Excel en blanco', de: 'Leere Excel-Datei', it: 'File Excel vuoto' } as Record<string, string>)[lang] ?? 'Blank Excel file'}
          </Text>
          <CloseButton size='sm' onClick={() => setShow(false)} />
        </Box>

        {/* Body with tabs */}
        <Box px={3} py={2}>
          <Tabs variant='unstyled' isLazy>
            <TabList sx={{
              display: 'flex !important', flexDirection: 'row !important', flexWrap: 'wrap',
              gap: '4px', mb: '1', alignItems: 'center', height: 'fit-content !important',
              minHeight: '0 !important', padding: '0 !important', border: 'none !important',
            }}>
              {SHEET_GROUPS.map((group, gi) => {
                const cnt = countInGroup(gi)
                const label = group[labelKey] ?? group.label_en
                return (
                  <Tab key={gi} sx={cnt > 0 ? { ...tabSx, _selected: { bg: 'blue.50', color: 'blue.700', borderColor: 'blue.400' } } : tabSx}>
                    {label}{cnt > 0 ? ` (${cnt})` : ''}
                  </Tab>
                )
              })}
            </TabList>
            <TabPanels border='1px solid' borderColor='gray.200' borderRadius='4px'>
              {SHEET_GROUPS.map((group, gi) => (
                <TabPanel key={gi} p='2'>
                  <Box display='flex' flexWrap='wrap' gap='6px'>
                    {group.sheets.map((sheet) => (
                      <Button
                        key={sheet.key}
                        size='sm'
                        variant={checked[sheet.key]
                          ? 'menuconfigpanel_option_button_activated'
                          : 'menuconfigpanel_option_button'}
                        onClick={() => toggle(sheet.key)}
                      >
                        {sheet[labelKey] ?? sheet.label_en}
                      </Button>
                    ))}
                  </Box>
                  <Box mt={2} display='flex' gap={2}>
                    <Button size='xs' variant='link' onClick={() => toggleGroup(gi, true)}>
                      {({ fr: 'Tout', en: 'All', es: 'Todo', de: 'Alle', it: 'Tutto' } as Record<string, string>)[lang] ?? 'All'}
                    </Button>
                    <Button size='xs' variant='link' onClick={() => toggleGroup(gi, false)}>
                      {({ fr: 'Aucun', en: 'None', es: 'Ninguno', de: 'Keine', it: 'Nessuno' } as Record<string, string>)[lang] ?? 'None'}
                    </Button>
                  </Box>
                </TabPanel>
              ))}
            </TabPanels>
          </Tabs>
        </Box>

        {/* Footer */}
        <Box px={3} py={2} borderTop='1px solid' borderColor='gray.200' display='flex' justifyContent='flex-end' gap={2}>
          <Button size='xs' variant='ghost' onClick={() => setShow(false)}>
            {({ fr: 'Annuler', en: 'Cancel', es: 'Cancelar', de: 'Abbrechen', it: 'Annulla' } as Record<string, string>)[lang] ?? 'Cancel'}
          </Button>
          <Button
            size='xs'
            colorScheme='blue'
            onClick={handleDownload}
            isLoading={loading}
            isDisabled={selectedSheets.length === 0}
          >
            {({ fr: 'Télécharger', en: 'Download', es: 'Descargar', de: 'Herunterladen', it: 'Scarica' } as Record<string, string>)[lang] ?? 'Download'} ({selectedSheets.length})
          </Button>
        </Box>
      </Box>
    </Draggable>
  )
}
