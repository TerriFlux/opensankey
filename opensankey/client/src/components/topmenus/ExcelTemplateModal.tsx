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
    sheets: [
      { key: 'tags', label_fr: 'Étiquettes', label_en: 'Tags', checked: true },
      { key: 'nodes', label_fr: 'Nœuds', label_en: 'Nodes', checked: false },
      { key: 'products', label_fr: 'Produits', label_en: 'Products', checked: true },
      { key: 'sectors', label_fr: 'Secteurs', label_en: 'Sectors', checked: true },
      { key: 'exchanges', label_fr: 'Échanges', label_en: 'Exchanges', checked: false },
      { key: 'ter', label_fr: 'TER', label_en: 'TER', checked: true },
    ],
  },
  {
    label_fr: 'Données',
    label_en: 'Data',
    sheets: [
      { key: 'data', label_fr: 'Valeurs', label_en: 'Values', checked: true },
      { key: 'min_max', label_fr: 'Min Max', label_en: 'Min Max', checked: false },
      { key: 'stocks', label_fr: 'Stocks', label_en: 'Stocks', checked: false },
    ],
  },
  {
    label_fr: 'Contraintes',
    label_en: 'Constraints',
    sheets: [
      { key: 'constraints', label_fr: 'Contraintes', label_en: 'Constraints', checked: false },
      { key: 'ratio_flux', label_fr: 'Ratio Flux', label_en: 'Ratio Flux', checked: false },
    ],
  },
  {
    label_fr: 'Résultats',
    label_en: 'Results',
    sheets: [
      { key: 'results', label_fr: 'Résultats', label_en: 'Results', checked: false },
      { key: 'analysis', label_fr: 'Analyse', label_en: 'Analysis', checked: false },
    ],
  },
  {
    label_fr: 'Doc',
    label_en: 'Doc',
    sheets: [
      { key: 'readme', label_fr: 'Readme', label_en: 'Readme', checked: true },
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
  const lang = i18n.language?.startsWith('fr') ? 'fr' : 'en'
  const isFr = lang === 'fr'

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
        title: isFr ? 'Erreur' : 'Error',
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
            {isFr ? 'Fichier Excel vierge' : 'Blank Excel file'}
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
                const label = isFr ? group.label_fr : group.label_en
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
                        {isFr ? sheet.label_fr : sheet.label_en}
                      </Button>
                    ))}
                  </Box>
                  <Box mt={2} display='flex' gap={2}>
                    <Button size='xs' variant='link' onClick={() => toggleGroup(gi, true)}>
                      {isFr ? 'Tout' : 'All'}
                    </Button>
                    <Button size='xs' variant='link' onClick={() => toggleGroup(gi, false)}>
                      {isFr ? 'Aucun' : 'None'}
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
            {isFr ? 'Annuler' : 'Cancel'}
          </Button>
          <Button
            size='xs'
            colorScheme='blue'
            onClick={handleDownload}
            isLoading={loading}
            isDisabled={selectedSheets.length === 0}
          >
            {isFr ? 'Télécharger' : 'Download'} ({selectedSheets.length})
          </Button>
        </Box>
      </Box>
    </Draggable>
  )
}
