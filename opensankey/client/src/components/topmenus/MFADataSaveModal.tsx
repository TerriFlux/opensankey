import React, { useState, useRef, useEffect } from 'react'
import Draggable, { DraggableProps } from 'react-draggable'

// react-draggable : les typings embarqués rendent les props optionnelles, mais
// @types/react-draggable (tiré par la résolution fraîche du CI) les rend requises.
// On relâche le type ici pour que le build passe quelle que soit la source des typings.
const DraggableComponent = Draggable as unknown as React.ComponentClass<Partial<DraggableProps>>
import {
  Button,
  Box,
  Text,
  Code,
  CloseButton,
  Input,
} from '@chakra-ui/react'
import { Class_ApplicationData } from '../../types/ApplicationData'

const L = (lang: string, m: Record<string, string>) => m[lang] ?? m.en

type Type_SaveResult = {
  ok: boolean
  saved?: boolean
  committed?: boolean
  pushed?: boolean
  path?: string
  commit?: string
  detail?: string
}

/**
 * Réenregistrement en place d'une étude de la SANKEYTHÈQUE — RÉSERVÉ AUX DÉVELOPPEURS.
 *
 * Boucle courte pour tenir les diagrammes publiés à jour : ouvrir l'étude depuis la
 * galerie, la corriger dans l'app, la réenregistrer par-dessus le fichier de MFAData.
 * Le filet est git : le serveur écrit un .json indenté (diff relisible), committe au
 * nom du compte développeur et pousse. Rien n'est écrasé en silence.
 *
 * Le panneau n'est ouvrable que si le diagramme affiché VIENT de la sankeythèque
 * (`sankeytheque_origin`, posée au chargement et effacée par tout autre chargement) :
 * le chemin d'écriture n'est jamais saisi, il est repris de l'index — lequel fait
 * liste blanche côté serveur.
 */
export const ModalMFADataSave = ({
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

  const origin = new_data.sankeytheque_origin
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<Type_SaveResult | null>(null)
  const nodeRef = useRef(null)

  // Message de commit proposé à chaque ouverture : le titre de l'étude suffit à
  // rendre l'historique de MFAData lisible, et reste modifiable.
  useEffect(() => {
    if (!show) return
    setResult(null)
    setMessage(origin ? 'sankeytheque: mise a jour de ' + origin.title : '')
  }, [show, origin?.file_path])

  if (!show || !origin) return null

  const close = () => {
    setBusy(false)
    setShow(false)
  }

  const handleSave = async () => {
    setBusy(true)
    setResult(null)
    try {
      const response = await fetch(
        window.location.origin + new_data.url_prefix + 'menus/templates_save',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            file_path: origin.file_path,
            message,
            // Même sérialisation que l'enregistrement JSON du menu Fichier : le
            // bypass évite les redessins déclenchés par la traversée du modèle.
            json: new_data.drawing_area.withBypassRedraws(() => new_data.toJSON(), false),
          }),
        }
      )
      if (!response.ok) {
        // 404 = route fermée (compte non développeur) ou chemin hors index.
        setResult({ ok: false, detail: response.status + ' ' + response.statusText })
        return
      }
      setResult(await response.json() as Type_SaveResult)
    } catch (error) {
      setResult({ ok: false, detail: String(error) })
    } finally {
      setBusy(false)
    }
  }

  const status = () => {
    if (!result) return null
    if (!result.ok) {
      return {
        color: 'red.600',
        text: L(lang, {
          fr: 'Échec', en: 'Failed', es: 'Error', de: 'Fehlgeschlagen', it: 'Fallito',
          'zh-CN': '失败',
        }) + (result.saved ? L(lang, {
          fr: ' (fichier écrit, git incomplet)', en: ' (file written, git incomplete)',
          es: ' (archivo escrito, git incompleto)', de: ' (Datei geschrieben, git unvollständig)',
          it: ' (file scritto, git incompleto)',
          'zh-CN': '（文件已写入，git 未完成）',
        }) : '') + ' — ' + (result.detail ?? ''),
      }
    }
    if (!result.committed) {
      return {
        color: 'gray.600',
        text: L(lang, {
          fr: 'Aucune modification à enregistrer.', en: 'Nothing to save.',
          es: 'Nada que guardar.', de: 'Nichts zu speichern.', it: 'Niente da salvare.',
          'zh-CN': '没有需要保存的内容。',
        }),
      }
    }
    if (!result.pushed) {
      return {
        color: 'orange.600',
        text: L(lang, {
          fr: 'Commit local créé (' + result.commit + '), push refusé — à finir à la main : ',
          en: 'Local commit created (' + result.commit + '), push refused — finish by hand: ',
          es: 'Commit local creado (' + result.commit + '), push rechazado: ',
          de: 'Lokaler Commit erstellt (' + result.commit + '), Push abgelehnt: ',
          it: 'Commit locale creato (' + result.commit + '), push rifiutato: ',
        }) + (result.detail ?? ''),
      }
    }
    return {
      color: 'green.600',
      text: L(lang, {
        fr: 'Enregistré, committé et poussé (' + result.commit + ').',
        en: 'Saved, committed and pushed (' + result.commit + ').',
        es: 'Guardado, commit y push (' + result.commit + ').',
        de: 'Gespeichert, committet und gepusht (' + result.commit + ').',
        it: 'Salvato, commit e push (' + result.commit + ').',
      }),
    }
  }

  const current_status = status()

  return (
    <DraggableComponent
      nodeRef={nodeRef}
      handle='.mfadata-save-handle'
      defaultPosition={{ x: window.innerWidth / 4, y: window.innerHeight / 6 }}
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
        width='520px'
        maxHeight='80vh'
        overflow='hidden'
        display='flex'
        flexDirection='column'
      >
        {/* Barre de titre déplaçable */}
        <Box
          className='mfadata-save-handle'
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
            {L(lang, {
              fr: 'Enregistrer dans la sankeythèque (dev)',
              en: 'Save to the sankey library (dev)',
              es: 'Guardar en la biblioteca (dev)',
              de: 'In der Sankey-Bibliothek speichern (dev)',
              it: 'Salva nella libreria (dev)',
              'zh-CN': '保存到桑基图库（开发）',
            })}
          </Text>
          <CloseButton size='sm' onClick={close} />
        </Box>

        <Box px={3} py={3} overflowY='auto'>
          <Text fontSize='xs' color='gray.600' mb={1}>
            {L(lang, {
              fr: 'Le diagramme affiché remplacera ce fichier de MFAData :',
              en: 'The current diagram will replace this MFAData file:',
              es: 'El diagrama actual reemplazará este archivo de MFAData:',
              de: 'Das aktuelle Diagramm ersetzt diese MFAData-Datei:',
              it: 'Il diagramma corrente sostituirà questo file di MFAData:',
              'zh-CN': '当前图表将替换该 MFAData 文件：',
            })}
          </Text>
          <Code fontSize='xs' display='block' whiteSpace='normal' wordBreak='break-all' mb={3} p={1}>
            {origin.file_path}
          </Code>

          <Text fontSize='xs' fontWeight='semibold' mb={1}>
            {L(lang, {
              fr: 'Message de commit', en: 'Commit message', es: 'Mensaje de commit',
              de: 'Commit-Nachricht', it: 'Messaggio di commit',
              'zh-CN': '提交信息',
            })}
          </Text>
          <Input
            size='sm'
            value={message}
            onChange={(e) => setMessage((e.target as HTMLInputElement).value)}
            mb={3}
          />

          <Box display='flex' alignItems='center' gap={2}>
            <Button
              size='sm'
              colorScheme='blue'
              isLoading={busy}
              onClick={handleSave}
            >
              {L(lang, {
                fr: 'Enregistrer, committer et pousser',
                en: 'Save, commit and push',
                es: 'Guardar, commit y push',
                de: 'Speichern, committen und pushen',
                it: 'Salva, commit e push',
                'zh-CN': '保存、提交并推送',
              })}
            </Button>
            <Button size='sm' variant='ghost' onClick={close}>
              {L(lang, { fr: 'Fermer', en: 'Close', es: 'Cerrar', de: 'Schließen', it: 'Chiudi',
              'zh-CN': '关闭' })}
            </Button>
          </Box>

          {current_status && (
            <Text fontSize='xs' color={current_status.color} mt={3}>
              {current_status.text}
            </Text>
          )}
        </Box>
      </Box>
    </DraggableComponent>
  )
}
