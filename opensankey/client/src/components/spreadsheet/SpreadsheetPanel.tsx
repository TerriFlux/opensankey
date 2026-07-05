import React, { useState } from 'react'
import { Box, Button, ButtonGroup } from '@chakra-ui/react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTableCells, faAlignLeft } from '@fortawesome/free-solid-svg-icons'
import { Class_ApplicationData } from '../../types/ApplicationData'
import { UniverSpreadSheet } from './UniverSpreadSheet'
import { SankeyTextEditor } from './SankeyTextEditor'

type Type_SheetMode = 'grid' | 'text'

/**
 * Panneau Tableur avec sélecteur de mode (grille Univer / éditeur texte
 * SankeyMATIC). Le sélecteur est au niveau du Tableur, comme demandé.
 * L'éditeur texte est monté à la volée : il se (re)sérialise sur le diagramme
 * courant à chaque bascule vers le mode Texte (sens « save »).
 */
export const SpreadsheetPanel = (
  { app_data, active }: { app_data: Class_ApplicationData, active: boolean }
) => {
  const { t } = app_data
  const [mode, setMode] = useState<Type_SheetMode>('grid')

  const tabStyle = (m: Type_SheetMode) => ({
    colorScheme: mode === m ? 'blue' : 'gray',
    variant: (mode === m ? 'solid' : 'ghost') as 'solid' | 'ghost',
  })

  return (
    <Box display='flex' flexDirection='column' height='100%' minHeight={0} minWidth={0}>
      <Box
        px={2}
        py={1}
        borderBottom='1px solid'
        borderColor='gray.200'
        display='flex'
        alignItems='center'
      >
        <ButtonGroup size='xs' isAttached>
          <Button {...tabStyle('grid')} onClick={() => setMode('grid')}>
            <Box as='span' mr='0.4em'><FontAwesomeIcon icon={faTableCells} /></Box>
            {t('Spreadsheet.mode_grid')}
          </Button>
          <Button {...tabStyle('text')} onClick={() => setMode('text')}>
            <Box as='span' mr='0.4em'><FontAwesomeIcon icon={faAlignLeft} /></Box>
            {t('Spreadsheet.mode_text')}
          </Button>
        </ButtonGroup>
      </Box>
      <Box flex='1 1 0' minHeight={0} minWidth={0}>
        {mode === 'grid'
          ? <UniverSpreadSheet app_data={app_data} active={active && mode === 'grid'} />
          : <SankeyTextEditor app_data={app_data} />}
      </Box>
    </Box>
  )
}
