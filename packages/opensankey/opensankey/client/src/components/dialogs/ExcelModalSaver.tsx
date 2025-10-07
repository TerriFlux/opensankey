import {
  Box,
  Checkbox,
  Button
} from '@chakra-ui/react'
// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2025 TerriFlux
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.
// ==================================================================================================
// Author        : Vincent LE DOZE & Vincent CLAVEL & Julien Alapetite for TerriFlux
// ==================================================================================================
import React, { useState } from 'react'
import type { TFunction } from 'i18next'
import { Class_ApplicationData } from '../../types/ApplicationData'
import { WrapperCheckBoxSubSectionMenu, OSTooltip } from '../configmenus/MenuCommon'
import { MenuDraggable } from '../topmenus/SankeyMenus'

// Interface pour la configuration d'un attribut Excel
interface ExcelAttributeConfig<T> {
  default: T
  type: () => T
  category: string
  labels: { en: string; fr: string }
  tooltips: { en: string; fr: string }
}

// Configuration unifiée avec TOUT au même endroit
// ==================================================================================================
// CONFIGURATION UNIFIÉE EXCEL - ATTRIBUTS + TRADUCTIONS
// Source unique de vérité pour types, valeurs par défaut, labels et tooltips
// ==================================================================================================

// Interface pour la configuration d'un attribut Excel
interface ExcelAttributeConfig<T> {
  default: T
  type: () => T
  category: string
  labels: { en: string; fr: string }
  tooltips: { en: string; fr: string }
}

// Configuration unifiée avec TOUT au même endroit
export const EXCEL_ATTRIBUTES_CONFIG = {
  // =================== SHEET FORMATTING ===================
  with_sheet_formating: {
    default: true,
    type: (() => true) as (() => boolean),
    category: 'formatting' as const,

    labels: {
      en: 'Sheet formatting',
      fr: 'Formattage des onglets excel'
    },
    tooltips: {
      en: 'Activate auto formatting and colorizing of sheets',
      fr: 'Activer le formatage automatique et la colorisation des feuilles'
    }
  } satisfies ExcelAttributeConfig<boolean>,

  // =================== NODE CONFIGURATION ===================
  with_node: {
    default: true,
    type: (() => true) as (() => boolean),
    category: 'nodes' as const,

    labels: {
      en: 'Sheets nodes',
      fr: 'Onglets nœuds'
    },
    tooltips: {
      en: 'Activate writing of nodes related sheets',
      fr: 'Activer l\'écriture des feuilles liées aux nœuds'
    }
  } satisfies ExcelAttributeConfig<boolean>,

  has_separated_nodes_sheets: {
    default: false,
    type: (() => false) as (() => boolean),
    category: 'nodes' as const,

    labels: {
      en: 'Split among different sheets',
      fr: 'Répartition sur plusieurs feuilles'
    },
    tooltips: {
      en: 'Write separated nodes sheets given a criteria',
      fr: 'Écrire des feuilles de nœuds séparées selon un critère'
    }
  } satisfies ExcelAttributeConfig<boolean>,

  separated_nodes_sheets: {
    default: 'none' as 'dimensions' | 'families' | 'none',
    type: (() => 'none') as (() => 'dimensions' | 'families' | 'none'),
    category: 'nodes' as const,

    labels: {
      en: 'According to what criteria?',
      fr: 'Selon quel critère ?'
    },
    tooltips: {
      en: 'Criteria for separating nodes sheets. Accepted values: "dimensions", "families", "nodetags"',
      fr: 'Critère de séparation des feuilles de nœuds. Valeurs acceptées : "dimensions", "families", "nodetags"'
    }
  } satisfies ExcelAttributeConfig<'dimensions' | 'families' | 'none'>,

  // =================== DIMENSIONS CONFIGURATION ===================
  dimensions_to_ignore: {
    default: [] as string[],
    type: (() => []) as (() => string[]),
    category: 'dimensions' as const,

    labels: {
      en: 'Ignore level tag groups',
      fr: 'Ignorer groupes de dimensions'
    },
    tooltips: {
      en: 'Name of dimension to ignore on writing. Related children node will not be present.',
      fr: 'Nom des dimensions à ignorer lors de l\'écriture. Les nœuds enfants liés ne seront pas présents.'
    }
  } satisfies ExcelAttributeConfig<string[]>,

  dimensions_max_levels: {
    default: {} as { [x: string]: number },
    type: (() => ({})) as (() => { [x: string]: number }),
    category: 'dimensions' as const,

    labels: {
      en: 'Select max level for each level tag group',
      fr: 'Sélection du niveau max pour chaque groupe de dimensions'
    },
    tooltips: {
      en: 'Max level to write for each dimensions name. Related children below max level will not be present.',
      fr: 'Niveau max à écrire pour chaque nom de dimension. Les enfants liés en dessous du niveau max ne seront pas présents.'
    }
  } satisfies ExcelAttributeConfig<{ [x: string]: number }>,

  // =================== DATA TABLE CONFIGURATION ===================
  activate_data_table: {
    default: true,
    type: (() => true) as (() => boolean),
    category: 'data_table' as const,

    labels: {
      en: 'Sheet data',
      fr: 'Onglet données'
    },
    tooltips: {
      en: 'Activate writing of DATA_SHEET table',
      fr: 'Activer l\'écriture du tableau DATA_SHEET'
    }
  } satisfies ExcelAttributeConfig<boolean>,

  data_table_with_all_flux: {
    default: false,
    type: (() => false) as (() => boolean),
    category: 'data_table' as const,

    labels: {
      en: 'Include flux without data',
      fr: 'Inclure les flux sans données'
    },
    tooltips: {
      en: 'Activate writing of all flux in DATA_SHEET table',
      fr: 'Activer l\'écriture de tous les flux dans le tableau DATA_SHEET'
    }
  } satisfies ExcelAttributeConfig<boolean>,

  // =================== FLUX MATRIX CONFIGURATION ===================
  activate_flux_matrix: {
    default: true,
    type: (() => true) as (() => boolean),
    category: 'flux_matrix' as const,

    labels: {
      en: 'Sheet SUT or IOT',
      fr: 'Onglet TER ou TES'
    },
    tooltips: {
      en: 'Activate writing of IO_SHEET / TER_SHEET table',
      fr: 'Activer l\'écriture du tableau IO_SHEET / TER_SHEET'
    }
  } satisfies ExcelAttributeConfig<boolean>,

  flux_matrix_with_data: {
    default: false,
    type: (() => false) as (() => boolean),
    category: 'flux_matrix' as const,

    labels: {
      en: 'With data',
      fr: 'Avec données'
    },
    tooltips: {
      en: 'Activate writing of data in IO_SHEET / TER_SHEET table',
      fr: 'Activer l\'écriture des données dans le tableau IO_SHEET / TER_SHEET'
    }
  } satisfies ExcelAttributeConfig<boolean>,

  // =================== TAGS CONFIGURATION ===================
  with_tags: {
    default: true,
    type: (() => true) as (() => boolean),
    category: 'tags' as const,

    labels: {
      en: 'Include tags',
      fr: 'Inclure les étiquettes'
    },
    tooltips: {
      en: 'Activate writing of tags relations',
      fr: 'Activer l\'écriture des relations d\'étiquettes'
    }
  } satisfies ExcelAttributeConfig<boolean>,

  ignore_nodetaggroups: {
    default: [] as string[],
    type: (() => []) as (() => string[]),
    category: 'tags' as const,

    labels: {
      en: 'Ignore node tag groups',
      fr: 'Ignorer groupes d\'étiquettes de nœuds'
    },
    tooltips: {
      en: 'List of nodetaggroups name to ignore on rewriting',
      fr: 'Liste des noms de groupes d\'étiquettes de nœuds à ignorer lors de la réécriture'
    }
  } satisfies ExcelAttributeConfig<string[]>,

  ignore_fluxtaggroups: {
    default: [] as string[],
    type: (() => []) as (() => string[]),
    category: 'tags' as const,

    labels: {
      en: 'Ignore flow tag groups',
      fr: 'Ignorer groupes d\'étiquettes de flux'
    },
    tooltips: {
      en: 'List of fluxtaggroups name to ignore on rewriting',
      fr: 'Liste des noms de groupes d\'étiquettes de flux à ignorer lors de la réécriture'
    }
  } satisfies ExcelAttributeConfig<string[]>,

  ignore_datataggroups: {
    default: [] as string[][],
    type: (() => []) as (() => string[][]),
    category: 'tags' as const,

    labels: {
      en: 'Ignore data tag groups',
      fr: 'Ignorer groupes d\'étiquettes de données'
    },
    tooltips: {
      en: 'List of datataggroups name to ignore on rewriting with the dataTag we use when shorting values tree',
      fr: 'Liste des noms de groupes d\'étiquettes de données à ignorer lors de la réécriture avec l\'étiquette de données utilisée pour raccourcir l\'arbre de valeurs'
    }
  } satisfies ExcelAttributeConfig<string[][]>,

  // =================== CONSTRAINTS ===================
  write_ratio_constraints: {
    default: false,
    type: (() => false) as (() => boolean),
    category: 'constraints' as const,

    labels: {
      en: 'Sheet constraints',
      fr: 'Onglet contraintes'
    },
    tooltips: {
      en: 'Include ratio constraints in the Excel export',
      fr: 'Ecrire les contraintes simples dans l\'onglet contraintes'
    }
  } satisfies ExcelAttributeConfig<boolean>,

  layout: {
    default: true,
    type: (() => true) as (() => boolean),
    category: 'constraints' as const,

    labels: {
      en: 'Sheet layout',
      fr: 'Onglet mise en page'
    },
    tooltips: {
      en: 'Onglet qui contient la mise en page du digramme',
      fr: 'Onglet qui contient la mise en page du digramme'
    }
  } satisfies ExcelAttributeConfig<boolean>,

} as const

// Types générés automatiquement
export type ExcelAttributeKey = keyof typeof EXCEL_ATTRIBUTES_CONFIG
export type ExcelAttributeTypes = {
  [K in ExcelAttributeKey]: ReturnType<typeof EXCEL_ATTRIBUTES_CONFIG[K]['type']>
}

// Type principal pour excelOptionType
export type ExcelOptionType = ExcelAttributeTypes

// Valeurs par défaut générées automatiquement
export const DEFAULT_EXCEL_OPTIONS: ExcelOptionType = Object.keys(EXCEL_ATTRIBUTES_CONFIG).reduce(
  (acc, key) => {
    const typedKey = key as ExcelAttributeKey
    // @ts-expect-error xxx
    acc[typedKey] = EXCEL_ATTRIBUTES_CONFIG[typedKey].default
    return acc
  },
  {} as ExcelOptionType
)

// Fonctions utilitaires pour récupérer les traductions
export const getExcelLabel = (key: ExcelAttributeKey, lang: 'en' | 'fr'): string => {
  return EXCEL_ATTRIBUTES_CONFIG[key].labels[lang]
}

export const getExcelTooltip = (key: ExcelAttributeKey, lang: 'en' | 'fr'): string => {
  return EXCEL_ATTRIBUTES_CONFIG[key].tooltips[lang]
}

// Groupement par catégories
export const EXCEL_CATEGORIES = {
  formatting: ['with_sheet_formating'],
  nodes: ['with_node', 'has_separated_nodes_sheets', 'separated_nodes_sheets'],
  dimensions: ['dimensions_to_ignore', 'dimensions_max_levels'],
  data_table: ['activate_data_table', 'data_table_with_all_flux'],
  flux_matrix: ['activate_flux_matrix', 'flux_matrix_with_data'],
  tags: ['with_tags', 'ignore_nodetaggroups', 'ignore_fluxtaggroups', 'ignore_datataggroups'],
  constraints: ['write_ratio_constraints']
} as const

// Types
export interface ConfigurableCheckboxProps {
  t: TFunction
  onChange: (evt: React.ChangeEvent<HTMLInputElement>) => void
  propertyName: keyof ExcelOptionType
  options: ExcelOptionType
}

export interface AutoConfigCheckboxProps {
  propertyName: keyof ExcelOptionType
}

// Composant 1 : Checkbox générique qui prend onChange, propertyName et options
export const ConfigurableCheckbox = ({ t, onChange, propertyName, options }: ConfigurableCheckboxProps) => {
  return (
    <Checkbox
      variant='menuconfigpanel_option_checkbox'
      isChecked={options[propertyName] as boolean}
      onChange={onChange}
    >
      <OSTooltip label={t(`Menu.saveExcel.tooltips.${propertyName}`)}>
        {t(`Menu.saveExcel.${propertyName}`)}
      </OSTooltip>
    </Checkbox>
  )
}

/**
 * Return the modal when we try to save an excel file
 *
 * @param {{ uploadExcelImpl: any; handleCloseDialog: any; set_data: any; data: any; set_show_excel_dialog: any; url_prefix: any; postProcessLoadExcel: any; launch: any; }} { uploadExcelImpl, handleCloseDialog, set_data, data, set_show_excel_dialog,url_prefix,postProcessLoadExcel,launch }
 * @returns
 */

export const ExcelModalSaver = ({ app_data }: { app_data: Class_ApplicationData }) => {
  const { t } = app_data
  const [option_open, setOptionOpen] = useState(false)
  const [options, setOptions] = useState<ExcelOptionType>(DEFAULT_EXCEL_OPTIONS)

  // Composant 2 : Checkbox spécialisé qui utilise le premier et ne prend que propertyName
  const AutoConfigCheckbox = ({ propertyName }: AutoConfigCheckboxProps) => {
    const handleChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
      setOptions(prevOptions => ({
        ...prevOptions,
        [propertyName]: evt.target.checked
      }))
    }
    return (
      <ConfigurableCheckbox
        t={t}
        onChange={handleChange}
        propertyName={propertyName}
        options={options}
      />
    )
  }

  // const generateOptionsTaggList = (
  //   taggsList: Class_ProtoTagGroup[] | Class_LevelTagGroup[],
  //   optionsProperty: string
  // ) => {
  //   return taggsList.map((tag) => {
  //     return {
  //       'label': tag.name,
  //       'value': tag.id,
  //       // @ts-expect-error xxx
  //       selected: options[optionsProperty]?.includes(tag.id) ?? false
  //     }
  //   })
  // }

  // const content_node = <Box >
  //   {/* Select criteria for node split sheets */}
  //   <Box layerStyle='menuconfigpanel_option_name'>
  //     {t('Menu.saveExcel.nodeSheetsCriteria')}
  //   </Box>
  //   <ButtonGroup isAttached>
  //     <Button variant={options.separated_nodes_sheets === 'dimensions' ? 'menuconfigpanel_option_button_activated_left' : 'menuconfigpanel_option_button_left'} onClick={() => {
  //       if (options.separated_nodes_sheets === 'dimensions') options['separated_nodes_sheets'] = 'none'
  //       else options['separated_nodes_sheets'] = 'dimensions'
  //       setOptions(options)
  //     }}>
  //       {t('Menu.saveExcel.dim')}
  //     </Button>
  //     <Button variant={options.separated_nodes_sheets === 'families' ? 'menuconfigpanel_option_button_activated_center' : 'menuconfigpanel_option_button_center'} onClick={() => {
  //       if (options.separated_nodes_sheets === 'families') options['separated_nodes_sheets'] = 'none'
  //       else options['separated_nodes_sheets'] = 'families'
  //       setOptions(options)
  //     }}>
  //       {t('Menu.saveExcel.fam')}
  //     </Button>
  //   </ButtonGroup>
  // </Box>

  // const dim = <AutoConfigCheckbox propertyName='dimensions_to_ignore' />

  // {/* Select level tag group to ignore */ }
  // const level_tgg_group = <Box layerStyle='menuconfigpanel_row_2cols'>
  //   <Box>{t('Menu.saveExcel.ignDimTagg')}</Box>
  //   <OSMultiSelect
  //     t={app_data.t}
  //     elements={generateOptionsTaggList(sankey.level_taggs_list, 'dimensions_to_ignore')}
  //     onClick={(entries: typeElementSelectable) => {
  //       options['dimensions_to_ignore'] = []
  //       entries.forEach(sel => {
  //         options['dimensions_to_ignore']!.push(sel.value)
  //         delete (options?.dimensions_max_levels ?? {})[sel.value] //delete entrie in dimensions_max_levels
  //       })
  //       setOptions(options)
  //     }} />
  // </Box>

  // const dimensions_to_ignore = <Box layerStyle='menuconfigpanel_option_name'>
  //   {t('Menu.saveExcel.dimMaxLevel')}
  // </Box>
  // {/* For each level tag group select max level saved */ }
  // {
  //   app_data.drawing_area.sankey.level_taggs_list.map(lvl => {
  //     // If dimensions is ignored don't create a list to select max level
  //     if (options.dimensions_to_ignore?.includes(lvl.id))
  //       return <></>

  //     const dim_lvl_max_selected = ((options?.dimensions_max_levels ?? {})[lvl.id] ?? undefined)

  //     return <Box layerStyle='menuconfigpanel_row_2cols'>
  //       <Box layerStyle='menuconfigpanel_option_name'>
  //         {lvl.name}
  //       </Box>
  //       <Menu key={lvl.id}>
  //         <MenuButton
  //           as={Button}
  //           variant='menuconfigpanel_option_button'
  //           rightIcon={app_data.icon_library.icon_open_selector}
  //         >
  //           {dim_lvl_max_selected !== undefined ? lvl.tags_list[dim_lvl_max_selected].name : t('Menu.saveExcel.noMaxLevel')}
  //         </MenuButton>
  //         <MenuList>
  //           {lvl.tags_list.map((lvlTag, idx) => {
  //             return <MenuItem key={lvlTag.name}
  //               display='flex'
  //               onClick={() => {
  //                 if (!options['dimensions_max_levels'])
  //                   return
  //                 if (options['dimensions_max_levels'][lvl.id] == idx) delete options['dimensions_max_levels'][lvl.id]
  //                 else options['dimensions_max_levels'][lvl.id] = idx
  //                 setOptions(options)
  //               }}>
  //               {lvlTag.name}{checked((options?.dimensions_max_levels ?? {})[lvl.id] == idx)}
  //             </MenuItem>
  //           })}
  //         </MenuList>
  //       </Menu>
  //     </Box>
  //   })
  // }

  // const data_tag = <Box as='span' layerStyle='menuconfigpanel_part_title_2'>
  //   {t('Menu.saveExcel.PreferenceTag')}
  // </Box>
  // {
  //   options['ignore_datataggroups']?.map(ent => {
  //     const taggs_dict = app_data.drawing_area.sankey.data_taggs_dict
  //     return <Box layerStyle='menuconfigpanel_row_2cols'>
  //       <Box>{taggs_dict[ent[0]].name}</Box>
  //       <Select
  //         value={ent[1]}
  //         onChange={(evt) => {
  //           options['ignore_datataggroups']?.forEach(val => {
  //             if (val[0] == ent[0]) {
  //               val[1] = evt.target.value
  //             }
  //             setOptions(options)
  //           })
  //         }}>
  //         {taggs_dict[ent[0]].tags_list.map((tag, idx) => {
  //           return <option key={'val_' + idx} value={tag.id}>{tag.name}</option>
  //         })}
  //       </Select>
  //     </Box>
  //   })
  // }

  const content = <>
    <WrapperCheckBoxSubSectionMenu
      open={option_open}
      onClick={() => { setOptionOpen(!option_open) }}
      title='Options'>
      <>
        <AutoConfigCheckbox propertyName='with_node' />
        <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
          <AutoConfigCheckbox propertyName='activate_flux_matrix' />
          {options.activate_flux_matrix ? <AutoConfigCheckbox propertyName='flux_matrix_with_data' /> : <></>}
        </Box>
        <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
          <AutoConfigCheckbox propertyName='activate_data_table' />
          {options.activate_data_table ? <AutoConfigCheckbox propertyName='data_table_with_all_flux' /> : <></>}
        </Box>
        <AutoConfigCheckbox propertyName='write_ratio_constraints' />
        {/* { options.with_node ? <AutoConfigCheckbox propertyName='has_separated_nodes_sheets' /> : <></> }
        { options.with_node ? content_node : <></> }
        { options.with_node ? level_tgg_group: <></> }
        { options.with_node ? dim: <></> }
        { options.with_node ? dimensions_to_ignore: <></> }
        <AutoConfigCheckbox propertyName='with_tags' />
        <ConfigurableMultiSelect elements={generateOptionsTaggList(nodetaggroups,'ignore_nodetaggroups')} propertyName={'ignore_nodetaggroups'} />
        <ConfigurableMultiSelect elements={generateOptionsTaggList(fluxtaggroups,'ignore_fluxtaggroups')} propertyName={'ignore_fluxtaggroups'} />
        <ConfigurableMultiSelect elements={optionsDataTaggList} propertyName={'ignore_datataggroups'} />
        {data_tag} */}
        <AutoConfigCheckbox propertyName='layout' />
        <AutoConfigCheckbox propertyName='with_sheet_formating' />
      </>
    </WrapperCheckBoxSubSectionMenu>
    <Box layerStyle='menuconfigpanel_row_2cols'>
      <Box />
      <Button
        variant="menuconfigpanel_option_button_secondary"
        isActive
        size='sizeButtonDialog'
        onClick={() => {
          app_data.saveToExcel('/opensankey/', options)
        }}
      >{t('Menu.enregistrer')}</Button>
    </Box>
  </>

  return <MenuDraggable
    maxW='45vw'
    dict_hook_ref_setter_show_dialog_components={app_data.menu_configuration.dict_setter_show_dialog}
    dialog_name={'ref_setter_show_modal_excel_saver'}
    content={content}
    title={t('Menu.save_excel_file')} />

}
