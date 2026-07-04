import React, { useState, useRef } from 'react'
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
  Input,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  IconButton,
  useToast,
} from '@chakra-ui/react'
import { Class_ApplicationData } from '../../types/ApplicationData'

// Tarifs $ / token (Opus 4.8) pour l'estimation de coût affichée.
const PRICE_IN = 5 / 1_000_000
const PRICE_OUT = 25 / 1_000_000

type Type_Flux = { source: string, target: string, value: number, estimated: boolean }
type Type_Node = { name: string, color: string, is_stock: boolean }
type Type_Structure = { title?: string, tags?: { name: string, color: string }[], nodes: Type_Node[], flux: Type_Flux[] }
type Type_Usage = { input_tokens: number | null, output_tokens: number | null } | null

const L = (lang: string, m: Record<string, string>) => m[lang] ?? m.en

export const ModalImageImport = ({
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

  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>('')
  const [structure, setStructure] = useState<Type_Structure | null>(null)
  const [usage, setUsage] = useState<Type_Usage>(null)
  const [quota, setQuota] = useState<{ used: number, limit: number } | null>(null)
  const [apiKey, setApiKey] = useState('')
  const [busy, setBusy] = useState<'' | 'extract' | 'import'>('')
  const toast = useToast()
  const nodeRef = useRef(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const reset = () => {
    setFile(null)
    setPreviewUrl('')
    setStructure(null)
    setUsage(null)
    setQuota(null)
    setBusy('')
    // apiKey volontairement conservée (évite de la retaper entre imports).
  }

  const close = () => {
    reset()
    setShow(false)
  }

  const onPickFile = (f: File | null) => {
    setStructure(null)
    setUsage(null)
    setFile(f)
    setPreviewUrl(f ? URL.createObjectURL(f) : '')
  }

  const errToast = (e: unknown) => toast({
    title: L(lang, { fr: 'Erreur', en: 'Error', es: 'Error', de: 'Fehler', it: 'Errore' }),
    description: String(e),
    status: 'error',
    duration: 6000,
  })

  const handleExtract = async () => {
    if (!file) return
    setBusy('extract')
    try {
      const form = new FormData()
      form.append('image', file)
      if (apiKey.trim()) form.append('anthropic_key', apiKey.trim())
      const resp = await fetch(window.location.origin + '/api/vision/extract', {
        method: 'POST',
        body: form,
      })
      const data = await resp.json()
      if (!resp.ok || !data.ok) throw new Error(data.error || resp.statusText)
      setStructure(data.structure as Type_Structure)
      setUsage(data.usage as Type_Usage)
      setQuota(data.quota ?? null)
    } catch (e) {
      errToast(e)
    } finally {
      setBusy('')
    }
  }

  const handleImport = async () => {
    if (!structure) return
    setBusy('import')
    try {
      const resp = await fetch(window.location.origin + '/api/vision/build', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ structure }),
      })
      const data = await resp.json()
      if (!resp.ok || !data.ok) throw new Error(data.error || resp.statusText)
      new_data.fromJSON(data.sankey)
      close()
    } catch (e) {
      errToast(e)
    } finally {
      setBusy('')
    }
  }

  const updateFlux = (idx: number, key: keyof Type_Flux, value: string) => {
    setStructure((prev) => {
      if (!prev) return prev
      const flux = prev.flux.slice()
      const row = { ...flux[idx] }
      if (key === 'value') row.value = Number(value)
      else if (key === 'source' || key === 'target') row[key] = value
      flux[idx] = row
      return { ...prev, flux }
    })
  }

  const removeFlux = (idx: number) => {
    setStructure((prev) => prev ? { ...prev, flux: prev.flux.filter((_, i) => i !== idx) } : prev)
  }

  if (!show) return null

  const estCost = usage && usage.input_tokens != null && usage.output_tokens != null
    ? (usage.input_tokens * PRICE_IN + usage.output_tokens * PRICE_OUT)
    : null

  return (
    <DraggableComponent
      nodeRef={nodeRef}
      handle='.image-import-handle'
      defaultPosition={{ x: window.innerWidth / 5, y: window.innerHeight / 8 }}
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
        width='560px'
        maxHeight='80vh'
        overflow='hidden'
        display='flex'
        flexDirection='column'
      >
        {/* Draggable title bar */}
        <Box
          className='image-import-handle'
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
            {L(lang, { fr: 'Importer depuis une image', en: 'Import from an image', es: 'Importar desde una imagen', de: 'Aus einem Bild importieren', it: 'Importa da un\'immagine' })}
          </Text>
          <CloseButton size='sm' onClick={close} />
        </Box>

        {/* Body */}
        <Box px={3} py={2} overflowY='auto'>
          <Box display='flex' gap={2} alignItems='center' mb={2}>
            <Button size='xs' onClick={() => fileInputRef.current?.click()}>
              {L(lang, { fr: 'Choisir une image', en: 'Choose image', es: 'Elegir imagen', de: 'Bild wählen', it: 'Scegli immagine' })}
            </Button>
            <Text fontSize='xs' color='gray.600' noOfLines={1}>
              {file ? file.name : L(lang, { fr: 'Aucun fichier', en: 'No file', es: 'Ningún archivo', de: 'Keine Datei', it: 'Nessun file' })}
            </Text>
            <Input
              ref={fileInputRef}
              type='file'
              accept='image/png,image/jpeg,image/gif,image/webp'
              display='none'
              onChange={(e) => onPickFile((e.target as HTMLInputElement).files?.[0] ?? null)}
            />
            <Button
              size='xs'
              colorScheme='blue'
              ml='auto'
              isLoading={busy === 'extract'}
              isDisabled={!file}
              onClick={handleExtract}
            >
              {L(lang, { fr: 'Extraire', en: 'Extract', es: 'Extraer', de: 'Extrahieren', it: 'Estrai' })}
            </Button>
          </Box>

          <Box mb={2}>
            <Input
              size='xs'
              type='password'
              autoComplete='off'
              value={apiKey}
              onChange={(e) => setApiKey((e.target as HTMLInputElement).value)}
              placeholder={L(lang, {
                fr: 'Clé Anthropic (optionnel — sinon quota inclus)',
                en: 'Anthropic key (optional — otherwise included quota)',
                es: 'Clave Anthropic (opcional — si no, cuota incluida)',
                de: 'Anthropic-Schlüssel (optional — sonst inkl. Kontingent)',
                it: 'Chiave Anthropic (opzionale — altrimenti quota inclusa)',
              })}
            />
          </Box>

          {previewUrl && (
            <Box mb={2} textAlign='center'>
              <img src={previewUrl} alt='preview' style={{ maxHeight: '160px', maxWidth: '100%', display: 'inline-block', border: '1px solid #e2e8f0', borderRadius: '4px' }} />
            </Box>
          )}

          {usage && (
            <Text fontSize='xs' color='gray.500' mb={1}>
              {L(lang, { fr: 'Tokens', en: 'Tokens', es: 'Tokens', de: 'Tokens', it: 'Token' })}: {usage.input_tokens ?? '?'} / {usage.output_tokens ?? '?'}
              {estCost != null ? ` — ≈ $${estCost.toFixed(3)}` : ''}
            </Text>
          )}
          {quota && (
            <Text fontSize='xs' color='gray.500' mb={2}>
              {L(lang, { fr: 'Quota mensuel', en: 'Monthly quota', es: 'Cuota mensual', de: 'Monatskontingent', it: 'Quota mensile' })}: {quota.used} / {quota.limit}
            </Text>
          )}

          {structure && (
            <>
              <Text fontSize='xs' fontWeight='semibold' mb={1}>
                {L(lang, { fr: 'Noeuds', en: 'Nodes', es: 'Nodos', de: 'Knoten', it: 'Nodi' })} ({structure.nodes.length})
              </Text>
              <Box display='flex' flexWrap='wrap' gap='4px' mb={2}>
                {structure.nodes.map((n, i) => (
                  <Badge key={i} colorScheme={n.is_stock ? 'purple' : 'gray'} fontSize='0.7em'>
                    {n.name}{n.is_stock ? ' (stock)' : ''}
                  </Badge>
                ))}
              </Box>

              <Text fontSize='xs' fontWeight='semibold' mb={1}>
                {L(lang, { fr: 'Flux', en: 'Flows', es: 'Flujos', de: 'Flüsse', it: 'Flussi' })} ({structure.flux.length})
              </Text>
              <Box maxHeight='30vh' overflowY='auto' border='1px solid' borderColor='gray.200' borderRadius='4px'>
                <Table size='sm' variant='simple'>
                  <Thead position='sticky' top='0' bg='gray.50'>
                    <Tr>
                      <Th px={1}>{L(lang, { fr: 'Origine', en: 'Source', es: 'Origen', de: 'Quelle', it: 'Origine' })}</Th>
                      <Th px={1}>{L(lang, { fr: 'Cible', en: 'Target', es: 'Destino', de: 'Ziel', it: 'Destinazione' })}</Th>
                      <Th px={1} isNumeric>{L(lang, { fr: 'Valeur', en: 'Value', es: 'Valor', de: 'Wert', it: 'Valore' })}</Th>
                      <Th px={1}></Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {structure.flux.map((f, i) => (
                      <Tr key={i} bg={f.estimated ? 'yellow.50' : undefined}>
                        <Td px={1}>
                          <Input size='xs' value={f.source} onChange={(e) => updateFlux(i, 'source', e.target.value)} />
                        </Td>
                        <Td px={1}>
                          <Input size='xs' value={f.target} onChange={(e) => updateFlux(i, 'target', e.target.value)} />
                        </Td>
                        <Td px={1} isNumeric>
                          <Input size='xs' type='number' value={Number.isFinite(f.value) ? f.value : ''} onChange={(e) => updateFlux(i, 'value', e.target.value)} textAlign='right' />
                        </Td>
                        <Td px={1}>
                          <IconButton
                            aria-label='remove'
                            size='xs'
                            variant='ghost'
                            icon={<span>×</span>}
                            onClick={() => removeFlux(i)}
                          />
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </Box>
              <Text fontSize='2xs' color='gray.500' mt={1}>
                {L(lang, {
                  fr: 'Lignes jaunes = valeurs estimées par le modèle, à vérifier.',
                  en: 'Yellow rows = values estimated by the model, please review.',
                  es: 'Filas amarillas = valores estimados por el modelo, revisar.',
                  de: 'Gelbe Zeilen = vom Modell geschätzte Werte, bitte prüfen.',
                  it: 'Righe gialle = valori stimati dal modello, da verificare.',
                })}
              </Text>
            </>
          )}
        </Box>

        {/* Footer */}
        <Box px={3} py={2} borderTop='1px solid' borderColor='gray.200' display='flex' justifyContent='flex-end' gap={2}>
          <Button size='xs' variant='ghost' onClick={close}>
            {L(lang, { fr: 'Annuler', en: 'Cancel', es: 'Cancelar', de: 'Abbrechen', it: 'Annulla' })}
          </Button>
          <Button
            size='xs'
            colorScheme='blue'
            isLoading={busy === 'import'}
            isDisabled={!structure || structure.flux.length === 0}
            onClick={handleImport}
          >
            {L(lang, { fr: 'Importer', en: 'Import', es: 'Importar', de: 'Importieren', it: 'Importa' })}
          </Button>
        </Box>
      </Box>
    </DraggableComponent>
  )
}
