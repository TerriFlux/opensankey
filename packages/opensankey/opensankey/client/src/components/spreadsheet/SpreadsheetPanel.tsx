import React, { Suspense, useState } from 'react'
import { Box, Button, ButtonGroup, Center, Spinner } from '@chakra-ui/react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTableCells, faAlignLeft } from '@fortawesome/free-solid-svg-icons'
import { Class_ApplicationData } from '../../types/ApplicationData'
import { SankeyTextEditor } from './SankeyTextEditor'

// #241 — Sortir Univer du bundle de base : le tableur Univer (et sa dépendance très lourde
// @univerjs/presets, ~plusieurs Mo) est chargé À LA DEMANDE, uniquement quand l'utilisateur
// ouvre le tableur en mode grille. SpreadsheetPanel n'étant lui-même monté que lorsque le
// tableur est affiché (cf. MainZoneTabs), le chunk Univer ne part qu'à ce moment-là.
// Le composant est un export nommé : on l'adapte au format `default` attendu par React.lazy.
const UniverSpreadSheet = React.lazy(() =>
  import('./UniverSpreadSheet').then(m => ({ default: m.UniverSpreadSheet }))
)

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
          ? <Suspense fallback={<Center height='100%'><Spinner /></Center>}>
            <UniverSpreadSheet app_data={app_data} active={active && mode === 'grid'} />
          </Suspense>
          : <SankeyTextEditor app_data={app_data} />}
      </Box>
    </Box>
  )
}
