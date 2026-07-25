// Import STAN — choix de la couche (FlowLayer) avant conversion.
//
// Un fichier STAN porte une topologie unique mais des valeurs par COUCHE
// (substance/grandeur : Debiet, COD, TN…), chacune avec sa propre unité
// d'affichage. open_stan n'importe qu'UNE couche : quand le fichier en a
// plusieurs, ce panneau propose le même choix que le dropdown « Layer » de
// STAN. Les périodes, elles, sont toutes importées (groupe de dataTags) et
// n'appellent pas de choix.
//
// Panneau draggable (pas de Modal pure), même patron que ImageImportModal.

import React, { useRef, useState } from 'react'
import Draggable, { DraggableProps } from 'react-draggable'

// react-draggable : les typings embarqués rendent les props optionnelles, mais
// @types/react-draggable (tiré par la résolution fraîche du CI) les rend requises.
// On relâche le type ici pour que le build passe quelle que soit la source des typings.
const DraggableComponent = Draggable as unknown as React.ComponentClass<Partial<DraggableProps>>
import {
  Button,
  Box,
  Text,
  CloseButton,
  Select,
} from '@chakra-ui/react'
import { Class_ApplicationData } from '../../types/ApplicationData'

export type Type_StanMeta = {
  periods: { id: number, code: string | null }[]
  layers: { id: number, name: string | null }[]
}

const L = (lang: string, m: Record<string, string>) => m[lang] ?? m.en

/** POST open_stan et charge le résultat. layer_id absent = première couche. */
export const importStanFile = (
  new_data: Class_ApplicationData,
  file: File,
  layer_id?: number
) => {
  const form_data = new FormData()
  form_data.append('file_content', file)
  if (layer_id !== undefined) form_data.append('layer_id', String(layer_id))
  return fetch(window.location.origin + new_data.url_prefix + 'open_stan', {
    method: 'POST',
    body: form_data
  }).then(response => {
    if (!response.ok) throw new Error(`open_stan HTTP error! status: ${response.status}`)
    return response.json()
  }).then(json_data => new_data.fromJSON(json_data))
}

/**
 * Périodes et couches d'un fichier STAN (endpoint stan_meta). Rejette en cas
 * d'erreur HTTP : l'appelant retombe alors sur l'import direct (1ère couche).
 */
export const fetchStanMeta = (
  new_data: Class_ApplicationData,
  file: File
): Promise<Type_StanMeta> => {
  const form_data = new FormData()
  form_data.append('file_content', file)
  return fetch(window.location.origin + new_data.url_prefix + 'stan_meta', {
    method: 'POST',
    body: form_data
  }).then(response => {
    if (!response.ok) throw new Error(`stan_meta HTTP error! status: ${response.status}`)
    return response.json() as Promise<Type_StanMeta>
  })
}

export const ModalStanLayerChoice = ({
  new_data,
  file,
  meta,
  onClose,
}: {
  new_data: Class_ApplicationData
  file: File
  meta: Type_StanMeta
  onClose: () => void
}) => {
  const { i18n } = new_data
  const langCode = i18n.language?.substring(0, 2) ?? 'en'
  // 'zh' est le seul code réduit à 2 lettres qui ne corresponde pas au code de ressource ('zh-CN').
  const lang = (['fr', 'es', 'de', 'it', 'ja'].includes(langCode)) ? langCode : (langCode === 'zh' ? 'zh-CN' : 'en')

  const [layerId, setLayerId] = useState<number>(meta.layers[0]?.id ?? 0)
  const [busy, setBusy] = useState(false)
  const nodeRef = useRef(null)

  const handleImport = () => {
    setBusy(true)
    importStanFile(new_data, file, layerId)
      .catch((error) => console.error('Error in open_stan - ' + String(error)))
      .finally(() => { setBusy(false); onClose() })
  }

  return (
    <DraggableComponent
      nodeRef={nodeRef}
      handle='.stan-import-handle'
      defaultPosition={{ x: window.innerWidth / 3, y: window.innerHeight / 5 }}
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
        width='360px'
        overflow='hidden'
        display='flex'
        flexDirection='column'
      >
        {/* Barre de titre draggable */}
        <Box
          className='stan-import-handle'
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
            {L(lang, { fr: 'Import STAN', en: 'STAN import', es: 'Importación STAN', de: 'STAN-Import', it: 'Importazione STAN',
              'zh-CN': 'STAN 导入',
              ja: 'STAN の取り込み' })}
          </Text>
          <CloseButton size='sm' onClick={onClose} />
        </Box>

        {/* Corps : choix de la couche */}
        <Box px={3} py={2}>
          <Text fontSize='xs' color='gray.600' mb={2}>
            {L(lang, {
              fr: 'Ce fichier contient plusieurs couches (substances). Choisir celle à importer :',
              en: 'This file contains several layers (substances). Pick the one to import:',
              es: 'Este archivo contiene varias capas (sustancias). Elija la que desea importar:',
              de: 'Diese Datei enthält mehrere Ebenen (Substanzen). Wählen Sie die zu importierende:',
              it: 'Questo file contiene più livelli (sostanze). Scegli quello da importare:',
              'zh-CN': '该文件包含多个层（物质）。请选择要导入的层：',
              ja: 'このファイルには複数のレイヤー（物質）が含まれています。取り込むものを選択してください：',
            })}
          </Text>
          <Select
            size='sm'
            value={layerId}
            onChange={(e) => setLayerId(Number(e.target.value))}
          >
            {meta.layers.map(layer => (
              <option key={layer.id} value={layer.id}>
                {layer.name || `Layer ${layer.id}`}
              </option>
            ))}
          </Select>
          {meta.periods.length > 1 && (
            <Text fontSize='2xs' color='gray.500' mt={2}>
              {L(lang, {
                fr: `Les ${meta.periods.length} périodes seront importées comme jeux de données.`,
                en: `All ${meta.periods.length} periods will be imported as data sets.`,
                es: `Los ${meta.periods.length} períodos se importarán como conjuntos de datos.`,
                de: `Alle ${meta.periods.length} Perioden werden als Datensätze importiert.`,
                it: `Tutti i ${meta.periods.length} periodi saranno importati come set di dati.`,
              })}
            </Text>
          )}
        </Box>

        {/* Pied */}
        <Box px={3} py={2} borderTop='1px solid' borderColor='gray.200' display='flex' justifyContent='flex-end' gap={2}>
          <Button size='xs' variant='ghost' onClick={onClose}>
            {L(lang, { fr: 'Annuler', en: 'Cancel', es: 'Cancelar', de: 'Abbrechen', it: 'Annulla',
              'zh-CN': '取消',
              ja: 'キャンセル' })}
          </Button>
          <Button
            size='xs'
            colorScheme='blue'
            isLoading={busy}
            onClick={handleImport}
          >
            {L(lang, { fr: 'Importer', en: 'Import', es: 'Importar', de: 'Importieren', it: 'Importa',
              'zh-CN': '导入',
              ja: '取り込み' })}
          </Button>
        </Box>
      </Box>
    </DraggableComponent>
  )
}
