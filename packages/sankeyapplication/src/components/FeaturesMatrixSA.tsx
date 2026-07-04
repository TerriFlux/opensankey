import React from 'react'
import { Box, Table, Tbody, Td, Th, Thead, Tr } from '@chakra-ui/react'
import { Class_ApplicationData } from 'open-sankey/src/types/ApplicationData'

type LicenceFlag = 'plus' | 'afm' | 'dev'

interface FeatureRow {
  fr: string
  en: string
  flags: LicenceFlag[]
}

// Derived from a code scan of has_sankey_plus / has_sankey_afm / has_sankey_dev
// gates across OS, OSP and SA layers. Update when new gated features are added.
const FEATURES: FeatureRow[] = [
  { fr: 'Catalogue de vues multiples',                 en: 'Multiple views catalog',                          flags: ['plus'] },
  { fr: 'Export animé (modale dédiée)',                en: 'Animated export modal',                           flags: ['plus'] },
  { fr: 'Image de fond du diagramme',                  en: 'Diagram background image',                        flags: ['plus'] },
  { fr: 'Icônes personnalisées sur les nœuds',         en: 'Custom node icons',                               flags: ['plus'] },
  { fr: 'Étiquettes en texte enrichi (rich text)',     en: 'Rich-text labels',                                flags: ['plus'] },
  { fr: 'Valeur cible sur les liens',                  en: 'Target value on links',                           flags: ['plus'] },
  { fr: 'Onglet AFM (analyse de flux de matières)',    en: 'MFA tab (material flow analysis)',                flags: ['afm'] },
  { fr: 'Colonnes calculées dans la feuille de calcul', en: 'Calculated columns in the spreadsheet',          flags: ['afm'] },
  { fr: 'Équilibre matière sur les nœuds',              en: 'Material balance on nodes',                      flags: ['afm'] },
  { fr: 'Résolution / réconciliation des flux (MFA)',   en: 'Material flow reconciliation',                   flags: ['afm'] },
  { fr: 'Stocks sur les nœuds',                         en: 'Node stocks',                                    flags: ['dev'] },
  { fr: 'Agrégation/désagrégation multi-niveaux (level tags)', en: 'Multi-level aggregation (level tags)',    flags: ['dev'] },
  { fr: 'Expansion/contraction des nœuds (gauche/droite)',     en: 'Node expansion/contraction (left/right)', flags: ['dev'] },
]

const mark = (on: boolean) => on ? '✓' : ''

export const FeaturesMatrixSA = ({ app_data }: { app_data: Class_ApplicationData }) => {
  const { t, i18n } = app_data
  const lang = (i18n?.language ?? 'en').split('-')[0].toLowerCase()
  const label = (row: FeatureRow) => lang === 'fr' ? row.fr : row.en

  return <Box
    display='block'
    overflowY='scroll'
    overflowX='hidden'
    height='100%'
    width='100%'
    paddingRight='1rem'
  >
    <Box paddingY='0.5rem'>
      {t('welcome.features_intro')}
    </Box>
    <Table variant='table_welcome_buttons'>
      <Thead>
        <Tr>
          <Th>{t('welcome.features_col_feature')}</Th>
          <Th textAlign='center'>{t('welcome.features_col_plus')}</Th>
          <Th textAlign='center'>{t('welcome.features_col_afm')}</Th>
          <Th textAlign='center'>{t('welcome.features_col_dev')}</Th>
        </Tr>
      </Thead>
      <Tbody>
        {FEATURES.map((row, idx) => (
          <Tr key={idx}>
            <Td>{label(row)}</Td>
            <Td textAlign='center'>{mark(row.flags.includes('plus'))}</Td>
            <Td textAlign='center'>{mark(row.flags.includes('afm'))}</Td>
            <Td textAlign='center'>{mark(row.flags.includes('dev'))}</Td>
          </Tr>
        ))}
      </Tbody>
    </Table>
  </Box>
}
