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
  Link,
} from '@chakra-ui/react'
import { Class_ApplicationData } from '../../types/ApplicationData'
import { isVersionBelow } from '../../Persistence/persistenceMigrations'
import type { Type_JSON } from '../../types/Utils'

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

// Une page déjà en ligne susceptible de correspondre à l'étude ouverte
// (/api/publish/page_candidates) : aide à la saisie de l'adresse.
type Type_PageCandidate = {
  url: string
  portfolio: string
  leaf: string
  mtime: number | null
  signals: string[]
}

// État de la page visée (/api/publish/page_info). `viewer_version` est la version
// d'application du SITE publié : c'est elle qui relira le diagramme poussé.
type Type_PageInfo = {
  error?: string
  url?: string
  file?: string
  mtime?: number | null
  viewer_version?: string | null
  format_version?: number | null
  // Pile des versions restaurables : ce qu'un retour arrière remettrait en ligne.
  backup_count?: number
  last_backup?: number | null
}

// Compte rendu d'une mise à jour granulaire (/api/publish/page) ou d'un retour
// arrière (/api/publish/page_revert).
type Type_PageResult = {
  ok?: boolean
  error?: string
  url?: string
  file?: string
  backup?: string | null
  thumbnail?: string | null
  viewer_version?: string | null
  // Retour arrière : version remise en ligne et nombre de crans restants.
  restored_mtime?: number | null
  remaining?: number
}

const formatDate = (seconds: number | null | undefined): string => {
  if (!seconds) return '—'
  try {
    return new Date(seconds * 1000).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' })
  } catch {
    return '—'
  }
}

/**
 * Réenregistrement en place d'un modèle de GALERIE — RÉSERVÉ AUX DÉVELOPPEURS.
 *
 * Boucle courte pour tenir les diagrammes publiés à jour : ouvrir le modèle depuis la
 * galerie, le corriger dans l'app, le réenregistrer par-dessus son fichier. Deux
 * galeries sont concernées, selon `origin.source` : la sankeythèque (études de
 * MFAData) et les modèles (SankeyData). Le filet est git : le serveur écrit un .json
 * indenté (diff relisible), committe au nom du compte développeur et pousse dans le
 * dépôt correspondant. Rien n'est écrasé en silence.
 *
 * Le panneau n'est ouvrable que si le diagramme affiché VIENT d'une de ces galeries
 * (`sankeytheque_origin`, posée au chargement et effacée par tout autre chargement) :
 * le chemin d'écriture n'est jamais saisi, il est repris de l'index — lequel fait
 * liste blanche côté serveur.
 *
 * Second usage, indépendant du dépôt : l'ADRESSE DE PUBLICATION du diagramme. Elle
 * est mémorisée sur le diagramme (publish_settings.deployed_url) et permet de
 * remplacer les seules données de CETTE page en ligne — corriger un diagramme d'un
 * portfolio sans republier tout le site (cf. /api/publish/page).
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
  // Adresse de publication mémorisée SUR le diagramme (publish_settings) : posée
  // au déploiement de l'étude ouverte, sinon saisie/choisie ici — un portfolio est
  // publié depuis MFAData, l'app n'apprend l'adresse de la page que par ce champ.
  const [publish_url, setPublishUrl] = useState('')
  const [candidates, setCandidates] = useState<Type_PageCandidate[]>([])
  const [page_info, setPageInfo] = useState<Type_PageInfo | null>(null)
  // null = pas encore sondé ; false = routes absentes (OpenSankey seul, compte
  // non développeur, déploiement non configuré) -> le bloc entier disparaît.
  const [page_feature, setPageFeature] = useState<boolean | null>(null)
  const [page_busy, setPageBusy] = useState(false)
  const [page_result, setPageResult] = useState<Type_PageResult | null>(null)
  // Incrémenté après une mise à jour : relit l'état de la page pour que la date
  // affichée soit celle qu'on vient d'écrire, et non l'ancienne.
  const [page_reload, setPageReload] = useState(0)
  // Dernier geste effectué sur la page en ligne, pour libeller son compte rendu.
  const [page_action, setPageAction] = useState<'update' | 'revert'>('update')
  const nodeRef = useRef(null)

  const settings = (new_data.publish_settings ?? {}) as Record<string, unknown>
  // Dépôt visé, donc vocabulaire du dialogue : la sankeythèque (études MFAData)
  // ou les modèles (SankeyData). Le serveur applique la liste blanche de CETTE
  // source ; rien d'autre ne distingue les deux chemins.
  const is_sankeytheque = origin?.source !== 'sankeydata'
  const repo_name = is_sankeytheque ? 'MFAData' : 'SankeyData'
  const commit_prefix = is_sankeytheque ? 'sankeytheque' : 'modeles'

  // Message de commit proposé à chaque ouverture : le titre du modèle suffit à
  // rendre l'historique du dépôt lisible, et reste modifiable.
  useEffect(() => {
    if (!show) return
    setResult(null)
    setPageResult(null)
    setPageInfo(null)
    setMessage(origin ? commit_prefix + ': mise a jour de ' + origin.title : '')
    setPublishUrl(typeof settings.deployed_url === 'string' ? settings.deployed_url : '')
  }, [show, origin?.file_path])

  // Sonde les routes de mise à jour granulaire et propose les pages en ligne qui
  // ressemblent à cette étude. 404 = fonction absente : on n'affiche rien.
  useEffect(() => {
    if (!show || !origin) return
    fetch(window.location.origin + '/api/publish/page_candidates?path='
      + encodeURIComponent(origin.file_path))
      .then((response) => {
        if (!response.ok) { setPageFeature(false); return null }
        return response.json()
      })
      .then((data) => {
        if (!data) return
        setPageFeature(!!data.available)
        setCandidates(Array.isArray(data.candidates) ? data.candidates : [])
      })
      .catch(() => setPageFeature(false))
  }, [show, origin?.file_path])

  // État de la page visée, temporisé : c'est lui qui porte la version du site
  // publié, donc l'avertissement de rétrocompatibilité.
  useEffect(() => {
    if (!show || page_feature !== true) return
    if (!/^https?:\/\//.test(publish_url)) { setPageInfo(null); return }
    const timer = setTimeout(() => {
      fetch(window.location.origin + '/api/publish/page_info?url=' + encodeURIComponent(publish_url))
        .then((response) => (response.ok ? response.json() : null))
        .then((data) => setPageInfo(data ? data as Type_PageInfo : null))
        .catch(() => setPageInfo(null))
    }, 500)
    return () => clearTimeout(timer)
  }, [show, page_feature, publish_url, page_reload])

  if (!show || !origin) return null

  const close = () => {
    setBusy(false)
    setShow(false)
  }

  // L'adresse voyage AVEC le diagramme : elle est écrite dans publish_settings
  // avant toute sérialisation, pour être réenregistrée dans MFAData et retrouvée
  // à la prochaine ouverture de l'étude.
  const rememberUrl = () => {
    const next = { ...settings }
    if (publish_url) next.deployed_url = publish_url
    else delete next.deployed_url
    new_data.publish_settings = next as unknown as Type_JSON
    // Le diagramme en mémoire diffère désormais de sa dernière sauvegarde.
    new_data.menu_configuration.ref_to_save_in_cache_indicator.current(false)
  }

  // Appel commun aux deux gestes sur la page en ligne (remplacer / revenir en
  // arrière) : même compte rendu, même relecture de l'état après coup.
  const callPage = async (endpoint: string, body: Record<string, unknown>) => {
    setPageBusy(true)
    setPageResult(null)
    try {
      const response = await fetch(window.location.origin + endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: publish_url, ...body }),
      })
      const data = await response.json() as Type_PageResult
      setPageResult(response.ok
        ? data
        : { error: data.error ?? (response.status + ' ' + response.statusText) })
      if (response.ok) setPageReload((n) => n + 1)
    } catch (error) {
      setPageResult({ error: String(error) })
    } finally {
      setPageBusy(false)
    }
  }

  // Mise à jour GRANULAIRE : seules les données de cette page en ligne sont
  // remplacées. Le reste du site (pages voisines, navigation, assets) n'est pas
  // régénéré — c'est tout l'intérêt : refaire un diagramme sans toucher au reste.
  const handleUpdatePage = () => {
    setPageAction('update')
    rememberUrl()
    return callPage('/api/publish/page', {
      json: new_data.drawing_area.withBypassRedraws(() => new_data.toJSON(), false),
    })
  }

  // Filet : on va voir le site publié, c'est raté, on remet la version d'avant.
  // Chaque clic remonte d'un cran (pile), il n'alterne pas entre deux versions.
  const handleRevertPage = () => {
    setPageAction('revert')
    return callPage('/api/publish/page_revert', {})
  }

  const handleSave = async () => {
    setBusy(true)
    setResult(null)
    rememberUrl()
    try {
      const response = await fetch(
        window.location.origin + new_data.url_prefix + 'menus/templates_save',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            file_path: origin.file_path,
            source: origin.source,
            message,
            // Remonté aussi dans l'index de la sankeythèque : la galerie peut
            // alors offrir un lien « voir en ligne » sans ouvrir l'étude.
            published_url: publish_url,
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
          ja: '失敗',
        }) + (result.saved ? L(lang, {
          fr: ' (fichier écrit, git incomplet)', en: ' (file written, git incomplete)',
          es: ' (archivo escrito, git incompleto)', de: ' (Datei geschrieben, git unvollständig)',
          it: ' (file scritto, git incompleto)',
          'zh-CN': '（文件已写入，git 未完成）',
          ja: '（ファイルは書き込み済み、git は未完了）',
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
          ja: '保存する変更はありません。',
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

  // Rétrocompatibilité : le site en ligne embarque le viewer compilé du jour de sa
  // publication ; la mise à jour granulaire ne remplace QUE les données. Éditer en
  // 1.3 puis pousser dans un site publié en 1.2, c'est demander à l'ancien viewer
  // de relire un format qu'il ne connaît pas. On avertit, on n'interdit pas — la
  // sortie de secours est de republier le site entier (dialogue « Publier »).
  const online_version = page_info?.viewer_version ?? null
  const version_gap = !!online_version && isVersionBelow(online_version, new_data.version)

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
            {is_sankeytheque ? L(lang, {
              fr: 'Enregistrer dans la sankeythèque (dev)',
              en: 'Save to the sankey library (dev)',
              es: 'Guardar en la biblioteca (dev)',
              de: 'In der Sankey-Bibliothek speichern (dev)',
              it: 'Salva nella libreria (dev)',
              'zh-CN': '保存到桑基图库（开发）',
              ja: 'サンキーライブラリに保存（開発）',
            }) : L(lang, {
              fr: 'Enregistrer dans les modèles (dev)',
              en: 'Save to the templates (dev)',
              es: 'Guardar en las plantillas (dev)',
              de: 'In den Vorlagen speichern (dev)',
              it: 'Salva nei modelli (dev)',
              'zh-CN': '保存到模板库（开发）',
              ja: 'テンプレートに保存（開発）',
            })}
          </Text>
          <CloseButton size='sm' onClick={close} />
        </Box>

        <Box px={3} py={3} overflowY='auto'>
          <Text fontSize='xs' color='gray.600' mb={1}>
            {L(lang, {
              fr: 'Le diagramme affiché remplacera ce fichier de ' + repo_name + ' :',
              en: 'The current diagram will replace this ' + repo_name + ' file:',
              es: 'El diagrama actual reemplazará este archivo de ' + repo_name + ':',
              de: 'Das aktuelle Diagramm ersetzt diese ' + repo_name + '-Datei:',
              it: 'Il diagramma corrente sostituirà questo file di ' + repo_name + ':',
              'zh-CN': '当前图表将替换该 ' + repo_name + ' 文件：',
              ja: '現在の図がこの ' + repo_name + ' ファイルを置き換えます：',
            })}
          </Text>
          <Code fontSize='xs' display='block' whiteSpace='normal' wordBreak='break-all' mb={3} p={1}>
            {origin.file_path}
          </Code>

          {page_feature === true && <Box
            mb={3}
            p={2}
            borderWidth='1px'
            borderColor='gray.200'
            borderRadius='md'
            bg='gray.50'
          >
            <Text fontSize='xs' fontWeight='semibold' mb={1}>
              {L(lang, {
                fr: 'Adresse du site publié', en: 'Published site address',
                es: 'Dirección del sitio publicado', de: 'Adresse der veröffentlichten Seite',
                it: 'Indirizzo del sito pubblicato',
                'zh-CN': '已发布站点地址',
                ja: '公開サイトのアドレス',
              })}
            </Text>
            <Input
              size='sm'
              value={publish_url}
              placeholder='https://terriflux.com/portfolios/...'
              onChange={(e) => setPublishUrl((e.target as HTMLInputElement).value)}
              bg='white'
            />

            {/* Aide à la saisie : pages en ligne qui ressemblent à cette étude
                (même fichier de données, ou même chemin normalisé). */}
            {candidates.length > 0 && <Box mt={1}>
              <Text fontSize='2xs' color='gray.500'>
                {L(lang, {
                  fr: 'Pages en ligne correspondantes :', en: 'Matching online pages:',
                  es: 'Páginas en línea correspondientes:', de: 'Passende Seiten online:',
                  it: 'Pagine online corrispondenti:',
                  'zh-CN': '匹配的在线页面：',
                  ja: '一致するオンラインページ：',
                })}
              </Text>
              {candidates.slice(0, 5).map((c) => (
                <Box key={c.url} display='flex' alignItems='center' gap={1}>
                  <Button
                    variant='link'
                    size='xs'
                    colorScheme='blue'
                    fontWeight={publish_url === c.url ? 'bold' : 'normal'}
                    whiteSpace='normal'
                    wordBreak='break-all'
                    justifyContent='flex-start'
                    onClick={() => setPublishUrl(c.url)}
                  >
                    {c.url}
                  </Button>
                  <Text fontSize='2xs' color='gray.400' flexShrink={0}>
                    {c.signals.join('+')}
                  </Text>
                </Box>
              ))}
            </Box>}

            {page_info?.error && <Text fontSize='2xs' color='red.600' mt={1}>
              {page_info.error}
            </Text>}

            {page_info && !page_info.error && <Text fontSize='2xs' color='gray.500' mt={1}>
              {page_info.file} · {L(lang, {
                fr: 'en ligne depuis le ', en: 'online since ', es: 'en línea desde ',
                de: 'online seit ', it: 'online dal ',
                'zh-CN': '上线时间 ',
                ja: '公開日 ',
              })}{formatDate(page_info.mtime)}
              {online_version ? ' · v' + online_version : ''}
              {' · '}
              <Link href={page_info.url} isExternal color='blue.500'>↗</Link>
            </Text>}

            {version_gap && <Text fontSize='2xs' color='orange.700' mt={1}>
              {L(lang, {
                fr: 'Attention : ce site a été publié avec la version ' + online_version
                  + ' et vous éditez en ' + new_data.version + '. Seules les données seront'
                  + ' remplacées : le viewer en ligne, plus ancien, pourrait mal relire ce'
                  + ' diagramme. Republier le site entier met aussi à jour son application.',
                en: 'Warning: this site was published with version ' + online_version
                  + ' while you are editing in ' + new_data.version + '. Only the data will be'
                  + ' replaced: the older online viewer may fail to read this diagram.'
                  + ' Republishing the whole site also updates its application.',
                es: 'Atención: sitio publicado con la versión ' + online_version
                  + ', edición en ' + new_data.version + '. Solo se reemplazan los datos.',
                de: 'Achtung: Seite mit Version ' + online_version + ' veröffentlicht, Bearbeitung in '
                  + new_data.version + '. Nur die Daten werden ersetzt.',
                it: 'Attenzione: sito pubblicato con la versione ' + online_version
                  + ', modifica in ' + new_data.version + '. Solo i dati vengono sostituiti.',
                'zh-CN': '注意：该站点以 ' + online_version + ' 版发布，当前编辑版本为 '
                  + new_data.version + '，仅替换数据。',
                ja: '注意：このサイトはバージョン ' + online_version + ' で公開され、現在の編集は '
                  + new_data.version + ' です。データのみを置き換えます。',
              })}
            </Text>}

            <Button
              size='xs'
              mt={2}
              colorScheme={version_gap ? 'orange' : 'teal'}
              isLoading={page_busy}
              isDisabled={!publish_url || !!page_info?.error}
              onClick={handleUpdatePage}
            >
              {L(lang, {
                fr: 'Mettre à jour cette page en ligne',
                en: 'Update this page online',
                es: 'Actualizar esta página en línea',
                de: 'Diese Seite online aktualisieren',
                it: 'Aggiorna questa pagina online',
                'zh-CN': '更新此在线页面',
                ja: 'このページをオンラインで更新',
              })}
            </Button>

            {/* Filet de sécurité : on publie, on va voir le site, et si c'est
                raté on remet la version d'avant. Chaque clic remonte d'un cran
                dans les versions archivées (il n'alterne pas entre deux). */}
            {!!page_info?.backup_count && <Button
              size='xs'
              mt={2}
              ml={2}
              variant='outline'
              colorScheme='red'
              isLoading={page_busy}
              isDisabled={!publish_url}
              onClick={handleRevertPage}
              title={L(lang, {
                fr: 'Version archivée du ', en: 'Version archived on ',
                es: 'Versión archivada del ', de: 'Version archiviert am ',
                it: 'Versione archiviata del ',
                'zh-CN': '归档版本：',
                ja: 'アーカイブ日時：',
              }) + formatDate(page_info.last_backup)}
            >
              {L(lang, {
                fr: 'Revenir à la version précédente',
                en: 'Restore the previous version',
                es: 'Volver a la versión anterior',
                de: 'Vorherige Version wiederherstellen',
                it: 'Torna alla versione precedente',
                'zh-CN': '恢复上一版本',
                ja: '前のバージョンに戻す',
              })}
              {page_info.backup_count > 1 ? ' (' + page_info.backup_count + ')' : ''}
            </Button>}

            <Text fontSize='2xs' color='gray.500' mt={1}>
              {L(lang, {
                fr: 'Remplace les seules données de cette page. Le reste du site (autres'
                  + ' études, navigation, application) reste intact ; l\'ancienne version est'
                  + ' archivée dans versions/_pages/.',
                en: 'Replaces this page\'s data only. The rest of the site (other studies,'
                  + ' navigation, application) is untouched; the previous version is archived'
                  + ' in versions/_pages/.',
                es: 'Reemplaza solo los datos de esta página; el resto del sitio queda intacto.',
                de: 'Ersetzt nur die Daten dieser Seite; der Rest der Website bleibt unberührt.',
                it: 'Sostituisce solo i dati di questa pagina; il resto del sito resta intatto.',
                'zh-CN': '仅替换本页数据，站点其余部分保持不变。',
                ja: 'このページのデータのみを置き換えます。サイトの他の部分は変更されません。',
              })}
            </Text>

            {page_result && <Text
              fontSize='2xs'
              mt={2}
              color={page_result.error ? 'red.600' : 'green.600'}
            >
              {page_result.error ?? ((page_action === 'revert'
                ? L(lang, {
                  fr: 'Version précédente rétablie en ligne (' + formatDate(page_result.restored_mtime)
                    + ') — encore ' + (page_result.remaining ?? 0) + ' cran(s) en arrière',
                  en: 'Previous version restored online (' + formatDate(page_result.restored_mtime)
                    + ') — ' + (page_result.remaining ?? 0) + ' step(s) further back available',
                  es: 'Versión anterior restaurada en línea (' + formatDate(page_result.restored_mtime) + ')',
                  de: 'Vorherige Version online wiederhergestellt (' + formatDate(page_result.restored_mtime) + ')',
                  it: 'Versione precedente ripristinata online (' + formatDate(page_result.restored_mtime) + ')',
                  'zh-CN': '已恢复线上的上一版本（' + formatDate(page_result.restored_mtime) + '）',
                  ja: '前のバージョンをオンラインで復元しました（' + formatDate(page_result.restored_mtime) + '）',
                })
                : L(lang, {
                  fr: 'Page mise à jour en ligne', en: 'Page updated online',
                  es: 'Página actualizada en línea', de: 'Seite online aktualisiert',
                  it: 'Pagina aggiornata online',
                  'zh-CN': '页面已在线更新',
                  ja: 'ページをオンラインで更新しました',
                })) + ' (' + page_result.file + ')'
                + (page_result.thumbnail === 'refreshed'
                  ? L(lang, {
                    fr: ' — vignette régénérée.', en: ' — thumbnail regenerated.',
                    es: ' — miniatura regenerada.', de: ' — Miniatur neu erzeugt.',
                    it: ' — miniatura rigenerata.',
                    'zh-CN': ' — 缩略图已重新生成。',
                    ja: ' — サムネイルを再生成しました。',
                  })
                  : L(lang, {
                    fr: ' — vignette de carte inchangée.', en: ' — card thumbnail unchanged.',
                    es: ' — miniatura sin cambios.', de: ' — Kartenbild unverändert.',
                    it: ' — miniatura invariata.',
                    'zh-CN': ' — 卡片缩略图未变。',
                    ja: ' — カード画像は未変更です。',
                  })))}
            </Text>}
          </Box>}

          <Text fontSize='xs' fontWeight='semibold' mb={1}>
            {L(lang, {
              fr: 'Message de commit', en: 'Commit message', es: 'Mensaje de commit',
              de: 'Commit-Nachricht', it: 'Messaggio di commit',
              'zh-CN': '提交信息',
              ja: 'コミットメッセージ',
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
                ja: '保存してコミット・プッシュ',
              })}
            </Button>
            <Button size='sm' variant='ghost' onClick={close}>
              {L(lang, { fr: 'Fermer', en: 'Close', es: 'Cerrar', de: 'Schließen', it: 'Chiudi',
                'zh-CN': '关闭',
                ja: '閉じる' })}
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
