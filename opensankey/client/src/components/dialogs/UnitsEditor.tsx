// OS#1286 — Éditeur du REGISTRE D'UNITÉS du diagramme (panneau draggable).
//
// Le registre (sankey.units) porte des GRANDEURS (Masse, Énergie…) contenant
// chacune ses UNITÉS (symbole + coefficient vers l'unité de base) et son unité
// d'affichage par défaut. Ouvert depuis l'onglet Valeur de l'inspecteur
// (sélecteur d'unité en mode « unité du modèle ») via
// dict_setter_show_dialog.ref_setter_show_units_editor.

import React from 'react'
import {
  Box, Button, Input, Radio,
  Table, Thead, Tbody, Tr, Th, Td,
} from '@chakra-ui/react'
import { Class_ApplicationData } from '../../types/ApplicationData'
import { Class_UnitType } from '../../types/Units'
import { MenuDraggable } from '../topmenus/SankeyMenus'
import { ConfigMenuNumberInput, OSTooltip } from '../configmenus/MenuCommon'
import { useModelBinding } from '../../hooks/useModelBinding'

/** Contenu de l'éditeur (une section par grandeur, unités en Table). */
const UnitsEditorContent = ({ app_data }: { app_data: Class_ApplicationData }) => {
  const { t, menu_configuration } = app_data
  const refreshThis = useModelBinding()
  const units = app_data.drawing_area.sankey.units

  // Toute édition du registre peut changer les labels de valeur affichés
  // (mode unit_model) : on redessine les labels et on notifie l'inspecteur.
  const commit = () => {
    const sankey = app_data.drawing_area.sankey
    sankey.links_list.forEach(l => l.drawValueLabel())
    sankey.nodes_list.forEach(n => n.drawValueLabel())
    menu_configuration.ref_to_save_in_cache_indicator.current(false)
    menu_configuration.updateInspector()
    refreshThis()
  }

  const renderUnitType = (ut: Class_UnitType) => (
    <Box key={ut.id} marginBottom='0.6rem'>
      {/* En-tête de grandeur : nom éditable + suppression. */}
      <Box display='flex' alignItems='center' gap='0.25rem' marginBottom='0.15rem'>
        <Input
          variant='menuconfigpanel_option_input'
          size='xs'
          fontWeight='bold'
          flex='1'
          minW='4rem'
          defaultValue={ut.name}
          onBlur={(evt) => { ut.name = evt.target.value; commit() }}
        />
        <Button
          variant='menuconfigpanel_del_button_in_table'
          flexShrink={0}
          onClick={() => { units.removeUnitType(ut.id); commit() }}
        >
          ✕
        </Button>
      </Box>
      {/* OS#1286 — échelle propre à la grandeur (bandes « de type unité »),
          même contrôle que l'échelle globale du dessin : quantité en unité de
          base pour 100 px ; vide = échelle du dessin. */}
      <Box display='flex' alignItems='center' gap='0.35rem' marginBottom='0.2rem'>
        <OSTooltip label={t('inspector.units.display_scale_tooltip')}>
          <Box flexShrink={0}>{t('inspector.units.display_scale')}</Box>
        </OSTooltip>
        <ConfigMenuNumberInput
          t={t}
          default_value={ut.display_scale ?? app_data.drawing_area.scale}
          minimum_value={1}
          stepper={true}
          unit_text={'unit. / 100 pixels'}
          function_on_blur={(val) => {
            ut.display_scale = (val !== null && val > 0) ? val : undefined
            commit()
          }}
        />
      </Box>
      <Table size='sm' variant='simple' sx={{ 'th, td': { px: '0.35rem', py: '0.15rem' } }}>
        <Thead>
          <Tr sx={{ 'th': { fontSize: '0.6rem', letterSpacing: 'normal' } }}>
            <Th>{t('inspector.units.symbol')}</Th>
            <Th>
              <OSTooltip label={t('inspector.units.coefficient_tooltip')}>
                {t('inspector.units.coefficient')}
              </OSTooltip>
            </Th>
            <Th width='1%'>
              <OSTooltip label={t('inspector.units.default_tooltip')}>
                {t('inspector.units.default')}
              </OSTooltip>
            </Th>
            <Th width='1%'></Th>
          </Tr>
        </Thead>
        <Tbody>
          {ut.units.map(unit => (
            <Tr key={unit.id}>
              <Td>
                <Input
                  variant='menuconfigpanel_option_input'
                  size='xs'
                  defaultValue={unit.name}
                  onBlur={(evt) => { unit.name = evt.target.value; commit() }}
                />
              </Td>
              <Td>
                <Input
                  variant='menuconfigpanel_option_input'
                  size='xs'
                  type='number'
                  defaultValue={String(unit.coefficient)}
                  onBlur={(evt) => {
                    const parsed = parseFloat(evt.target.value)
                    if (Number.isFinite(parsed) && parsed !== 0) unit.coefficient = parsed
                    commit()
                  }}
                />
              </Td>
              <Td width='1%' textAlign='center'>
                <Radio
                  isChecked={ut.default_unit_id === unit.id}
                  onChange={() => { ut.default_unit_id = unit.id; commit() }}
                />
              </Td>
              <Td width='1%'>
                <Button
                  variant='menuconfigpanel_del_button_in_table'
                  onClick={() => { ut.removeUnit(unit.id); commit() }}
                >
                  ✕
                </Button>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
      <Button
        size='xs'
        variant='menuconfigpanel_add_button'
        onClick={() => { ut.addUnit(t('inspector.units.new_unit_name'), 1); commit() }}
      >
        {t('inspector.units.add_unit')}
      </Button>
    </Box>
  )

  return (
    <Box
      maxHeight='60vh'
      overflowY='auto'
      fontSize='0.7rem'
      sx={{
        'input, .chakra-input__field, .chakra-select': { fontSize: '0.7rem' },
        'th': { fontSize: '0.6rem' },
      }}
    >
      {units.is_empty && (
        <Box marginBottom='0.5rem'>{t('inspector.units.empty')}</Box>
      )}
      {units.unit_types.map(renderUnitType)}
      <Button
        size='xs'
        variant='menuconfigpanel_add_button'
        onClick={() => {
          const ut = units.addUnitType(t('inspector.units.new_unit_type_name'))
          ut.addUnit(t('inspector.units.new_unit_name'), 1)
          commit()
        }}
      >
        {t('inspector.units.add_unit_type')}
      </Button>
    </Box>
  )
}

/** Panneau draggable monté en permanence (cf. SankeyMenus), affiché via
 * ref_setter_show_units_editor. */
export const UnitsEditorDialog = ({ app_data }: { app_data: Class_ApplicationData }) => {
  return (
    <MenuDraggable
      dict_hook_ref_setter_show_dialog_components={app_data.menu_configuration.dict_setter_show_dialog}
      dialog_name={'ref_setter_show_units_editor'}
      content={<UnitsEditorContent app_data={app_data} />}
      title={app_data.t('inspector.units.title')}
      minW={'22vw'}
      maxW={'32vw'}
    />
  )
}
