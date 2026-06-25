// ==================================================================================================
// The MIT License (MIT) - Copyright (c) 2025 TerriFlux
// ==================================================================================================
// Panneau « Doc » : éditeur de documentation markdown + aperçu rendu.
// Monté dans la grande zone (onglet "Doc" de MainZoneTabs), partage le slot droit comme le tableur.
//
// Le contenu est un champ unique au niveau ApplicationData (documentation_markdown), persisté en JSON
// avec le diagramme. L'édition met à jour le modèle en direct et marque les données comme non
// sauvegardées (l'indicateur du bouton checkpoint passe au rouge ; l'utilisateur sauve via Ctrl+S).
// ==================================================================================================

// External imports
import React, { useEffect, useRef, useState } from 'react'
import {
  Box, Button, IconButton, Textarea, Portal,
  Menu, MenuButton, MenuList, MenuItem, MenuGroup, MenuDivider
} from '@chakra-ui/react'
import { ChevronDownIcon, ExternalLinkIcon } from '@chakra-ui/icons'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'

import { Class_ApplicationData } from '../../types/ApplicationData'
import { Type_MainZoneDocLayout } from '../../types/MenuConfig'
import { randomId } from '../../types/Utils'

type Type_DocMode = 'edit' | 'preview' | 'split'

/* Styles minimaux pour le rendu markdown (Chakra réinitialise les balises HTML natives). */
const PREVIEW_STYLE: React.CSSProperties = {
  padding: '0.75rem 1rem',
  overflow: 'auto',
  height: '100%',
  lineHeight: 1.5,
  fontSize: '0.9rem',
  color: '#1a202c'
}

const PREVIEW_CSS = `
.os-md-preview h1 { font-size: 1.6em; font-weight: 600; margin: 0.6em 0 0.3em; }
.os-md-preview h2 { font-size: 1.35em; font-weight: 600; margin: 0.6em 0 0.3em; }
.os-md-preview h3 { font-size: 1.15em; font-weight: 600; margin: 0.6em 0 0.3em; }
.os-md-preview p { margin: 0.4em 0; }
.os-md-preview ul, .os-md-preview ol { margin: 0.4em 0; padding-left: 1.4em; }
.os-md-preview li { margin: 0.15em 0; }
.os-md-preview a { color: #3182ce; text-decoration: underline; }
.os-md-preview code { background: #edf2f7; padding: 0.1em 0.3em; border-radius: 3px; font-size: 0.85em; }
.os-md-preview pre { background: #edf2f7; padding: 0.6em 0.8em; border-radius: 5px; overflow: auto; }
.os-md-preview pre code { background: transparent; padding: 0; }
.os-md-preview blockquote { border-left: 3px solid #cbd5e0; margin: 0.5em 0; padding: 0.1em 0.8em; color: #4a5568; }
.os-md-preview table { border-collapse: collapse; margin: 0.5em 0; }
.os-md-preview th, .os-md-preview td { border: 1px solid #cbd5e0; padding: 0.2em 0.5em; }
.os-md-preview img { max-width: 100%; max-height: 300px; height: auto; }
.os-md-preview hr { border: none; border-top: 1px solid #e2e8f0; margin: 0.8em 0; }
`

/* urlTransform de react-markdown : autorise les images embarquées (data:image/...) que le
   sanitizer par défaut bloquerait, tout en gardant les protocoles sûrs habituels. */
const allowDataImages = (url: string): string => {
  if (url.startsWith('data:image/')) return url
  const m = url.match(/^([a-z][a-z0-9+.-]*):/i)
  if (!m) return url // URL relative
  return ['http', 'https', 'mailto', 'tel'].includes(m[1].toLowerCase()) ? url : ''
}

// Génère un identifiant d'ancre stable à partir du texte d'un titre : retire les accents,
// passe en minuscules, remplace tout ce qui n'est pas alphanumérique par « - ». Sert d'id aux
// titres rendus ET de cible aux liens internes `#ancre` (sommaire). Les deux usages partagent
// CETTE fonction : changer la règle ici garde sommaire et titres synchronisés.
const slugifyHeading = (s: string): string =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

// Extrait récursivement le texte brut d'un nœud React (pour calculer l'id d'un titre, qui peut
// contenir du gras, des maths, etc.).
const nodeText = (node: React.ReactNode): string => {
  if (node === null || node === undefined || node === false || node === true) return ''
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(nodeText).join('')
  if (React.isValidElement(node)) return nodeText((node.props as { children?: React.ReactNode }).children)
  return ''
}

// Fabrique un composant de titre Hn qui se dote d'un id slugifié, pour être la cible d'un lien
// interne `#ancre` (navigation dans le sommaire).
const makeHeading = (level: 1 | 2 | 3) =>
  ({ children }: { children?: React.ReactNode }) =>
    React.createElement(`h${level}`, { id: slugifyHeading(nodeText(children)) }, children)

const HeadingRenderers = { h1: makeHeading(1), h2: makeHeading(2), h3: makeHeading(3) }

// Libellés courts des positions de la doc (pour le bouton du menu).
const DOC_POS_LABEL: Record<Type_MainZoneDocLayout, string> = {
  'sheet-right': 'À droite du tableur',
  'sheet-left': 'À gauche du tableur',
  'sheet-top': 'Au-dessus du tableur',
  'sheet-bottom': 'En-dessous du tableur',
  'diagram-bottom': 'Sous le diagramme',
  'window-bottom': 'Bandeau bas'
}
// Positions « accolées au tableur » proposées dans le sous-groupe.
const SHEET_POSITIONS: [Type_MainZoneDocLayout, string][] = [
  ['sheet-right', 'À droite'],
  ['sheet-left', 'À gauche'],
  ['sheet-top', 'Au-dessus'],
  ['sheet-bottom', 'En-dessous']
]

const tab_btn_style = (active: boolean) => ({
  size: 'xs' as const,
  variant: 'ghost' as const,
  fontWeight: 'normal' as const,
  // width auto : sans cette surcharge le bouton hérite du width:100% global du thème
  // (Theme.tsx buttonBase) ; dans une rangée flex « wrap » chaque bouton occuperait alors
  // toute la largeur et s'empilerait verticalement. On veut une rangée compacte qui ne
  // passe à la ligne que si la largeur du panneau l'exige.
  width: 'auto' as const,
  color: active ? 'gray.900' : 'gray.600',
  bg: active ? 'gray.200' : 'transparent',
  _hover: { bg: 'gray.100' }
})

export const DocPanel = (
  {
    app_data, active,
    docLayout, setDocLayout,
    showDiagram, showSpreadsheet,
    detached, onToggleDetach
  }: {
    app_data: Class_ApplicationData,
    active: boolean,
    docLayout: Type_MainZoneDocLayout,
    setDocLayout: (v: Type_MainZoneDocLayout) => void,
    showDiagram: boolean,
    showSpreadsheet: boolean,
    // Détachement du panneau dans une fenêtre OS séparée (cf. usePipWindow). Optionnels : le panneau
    // reste fonctionnel sans, le bouton n'apparaît simplement pas.
    detached?: boolean,
    onToggleDetach?: () => void
  }
) => {
  // En mode publication (is_static sans publish_options.editable), la doc est en lecture seule :
  // on n'affiche que l'aperçu et on masque toute la barre d'édition (cf. is_editable, utilisé
  // partout ailleurs pour neutraliser l'édition).
  const editable = app_data.is_editable
  const [text, setText] = useState<string>(app_data.documentation_markdown)
  const [mode, setMode] = useState<Type_DocMode>('preview')
  const [viewSubmenuOpen, setViewSubmenuOpen] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const previewRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  // Fraction de défilement (0..1) du dernier panneau scrollé, pour conserver la position de
  // lecture en basculant entre Aperçu et Édition (sources et rendu n'ont pas la même hauteur,
  // donc on raisonne en proportion plutôt qu'en pixels).
  const scrollFracRef = useRef(0)

  const recordScroll = (el: HTMLElement | null) => {
    if (!el) return
    const max = el.scrollHeight - el.clientHeight
    scrollFracRef.current = max > 0 ? el.scrollTop / max : 0
  }

  const applyScroll = (el: HTMLElement | null) => {
    if (!el) return
    const max = el.scrollHeight - el.clientHeight
    el.scrollTop = max > 0 ? scrollFracRef.current * max : 0
  }

  // Au changement de mode, réapplique la fraction mémorisée au(x) panneau(x) désormais visible(s)
  // (après le paint, le temps que le contenu — textarea ou markdown rendu — soit mis en page).
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      if (mode !== 'preview') applyScroll(textareaRef.current)
      if (mode !== 'edit') applyScroll(previewRef.current)
    })
    return () => cancelAnimationFrame(id)
  }, [mode])

  // À l'activation de l'onglet, resynchroniser depuis le modèle (un nouveau fichier a pu être chargé).
  useEffect(() => {
    if (active) {
      setText(app_data.documentation_markdown)
    }
  }, [active])

  // Resynchronise même panneau déjà ouvert : chargement d'un fichier / nouveau diagramme déclenche
  // updateAllMenuComponents() qui appelle cette ref (cf. le tableur via ref_to_spreadsheet).
  useEffect(() => {
    app_data.menu_configuration.ref_to_doc.current = () => setText(app_data.documentation_markdown)
    return () => { app_data.menu_configuration.ref_to_doc.current = () => null }
  }, [app_data])

  const applyText = (value: string) => {
    setText(value)
    app_data.documentation_markdown = value
    // Marque les données comme non sauvegardées (indicateur du bouton checkpoint).
    app_data.menu_configuration.ref_to_save_in_cache_indicator.current(false)
  }

  const onChange = (value: string) => applyText(value)

  // Insère un snippet markdown à la position du curseur (ou à la fin si l'éditeur n'est pas focus).
  const insertAtCursor = (snippet: string) => {
    const ta = textareaRef.current
    const start = ta ? ta.selectionStart : text.length
    const end = ta ? ta.selectionEnd : text.length
    const next = text.slice(0, start) + snippet + text.slice(end)
    applyText(next)
    // Replace le curseur après le snippet inséré.
    requestAnimationFrame(() => {
      if (ta) {
        ta.focus()
        const pos = start + snippet.length
        ta.setSelectionRange(pos, pos)
      }
    })
  }

  // Embarque une image (data-URI base64) comme pièce jointe du modèle (map id -> data-URI) et insère
  // une RÉFÉRENCE COURTE `img://<id>` dans le texte, pour garder l'éditeur lisible. La pièce jointe
  // voyage avec le diagramme (persistée en JSON). Attention : le base64 gonfle le JSON / localStorage.
  const embedImage = (dataUrl: string, alt: string) => {
    const id = randomId()
    app_data.documentation_images[id] = dataUrl
    if (mode === 'preview') setMode('split')
    insertAtCursor(`\n![${alt}](img://${id})\n`)
  }

  // Insère un lien interne `[Nom de la vue](view://<id>)` à la position du curseur. Le libellé reprend
  // le nom courant de la vue (lisible même si la vue est renommée/supprimée ensuite).
  const insertViewLink = (id: string, name: string) => {
    if (mode === 'preview') setMode('split')
    insertAtCursor(`[${name}](view://${id})`)
  }

  // Génère un sommaire de toutes les vues : pour chaque vue, un titre H2 suivi du lien interne.
  const insertViewsOutline = () => {
    if (view_sources.length === 0) return
    if (mode === 'preview') setMode('split')
    const block = view_sources
      .map(({ id, name }) => `## ${name}\n[${name}](view://${id})`)
      .join('\n\n')
    insertAtCursor(`\n${block}\n`)
  }

  // Vues disponibles comme cibles de lien (vide en OpenSankey de base, peuplé en OpenSankey+).
  const view_sources = app_data.layout_view_sources

  const onPickImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0]
    e.target.value = '' // permet de re-sélectionner le même fichier ensuite
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => embedImage(String(reader.result), file.name.replace(/\.[^.]+$/, ''))
    reader.readAsDataURL(file)
  }

  // Colle une image depuis le presse-papier (capture d'écran, image copiée) directement dans
  // l'éditeur. Le texte collé normal garde le comportement par défaut.
  const onPaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData ? e.clipboardData.items : null
    if (!items) return
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const file = items[i].getAsFile()
        if (file) {
          e.preventDefault()
          const reader = new FileReader()
          reader.onload = () => embedImage(String(reader.result), 'image')
          reader.readAsDataURL(file)
          return
        }
      }
    }
  }

  // Résout les URLs du markdown pour l'aperçu : les références `img://<id>` -> data-URI de la map,
  // les liens internes `view://<id>` laissés tels quels (interceptés au clic par LinkRenderer),
  // sinon sanitization standard (autorise data:image/ et protocoles sûrs).
  const resolveUrl = (url: string): string => {
    if (url.startsWith('img://')) return app_data.documentation_images[url.slice(6)] || ''
    if (url.startsWith('view://')) return url
    return allowDataImages(url)
  }

  // Rendu personnalisé des liens : `view://<id>` active la vue correspondante au clic (navigation
  // interne, pas une vraie URL) ; les autres liens s'ouvrent normalement dans un nouvel onglet.
  const LinkRenderer = ({ href, children }: { href?: string, children?: React.ReactNode }) => {
    if (href && href.startsWith('view://')) {
      const view_id = href.slice(7)
      return (
        <a
          href={href}
          onClick={(e) => { e.preventDefault(); app_data.navigateToView(view_id) }}
          style={{ cursor: 'pointer' }}
        >
          {children}
        </a>
      )
    }
    // Lien interne `#ancre` (sommaire) : défile jusqu'au titre dont l'id correspond, dans
    // l'aperçu courant (et non la page entière, pour ne pas perturber le reste de l'app).
    if (href && href.startsWith('#')) {
      return (
        <a
          href={href}
          onClick={(e) => {
            e.preventDefault()
            const root = (e.currentTarget as HTMLElement).closest('.os-md-preview')
            const target = root ? root.querySelector('#' + CSS.escape(href.slice(1))) : null
            if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }}
          style={{ cursor: 'pointer' }}
        >
          {children}
        </a>
      )
    }
    return <a href={href} target='_blank' rel='noreferrer'>{children}</a>
  }

  const showEditor = editable && (mode === 'edit' || mode === 'split')
  // Aperçu visible dès que l'éditeur ne l'est pas (mode 'preview' ou lecture seule), ou en côte à côte.
  const showPreview = !showEditor || mode === 'split'

  return (
    <Box display='flex' flexDirection='column' height='100%' background='white'>
      <style>{PREVIEW_CSS}</style>
      {/* Barre d'outils : bascule Édition / Aperçu / Côte à côte */}
      <Box
        display='flex'
        flexWrap='wrap'
        justifyContent='space-between'
        alignItems='center'
        gap='0.25rem 0.5rem'
        padding='0.3rem 0.6rem'
        borderBottom='1px solid'
        borderColor='gray.200'
        flex='0 0 auto'
      >
        {/* Groupe gauche : libellé + sélecteur de position. flexWrap : sur panneau étroit
            (modes édition/côte à côte), le sélecteur de position « À droite du tableur » passe
            sous le libellé au lieu de déborder à droite hors du panneau. */}
        <Box display='flex' alignItems='center' flexWrap='wrap' gap='0.25rem 0.5rem' flex='0 1 auto' minWidth={0}>
          <Box fontSize='0.8rem' fontWeight='600' color='gray.700'>Documentation</Box>
          {/* Sélecteur de position de la doc dans la grande zone (masqué en aperçu seul et en lecture seule). */}
          {editable && mode !== 'preview' && (
            <Menu placement='bottom-start' isLazy>
              <MenuButton
                as={Button}
                size='xs'
                variant='outline'
                fontWeight='normal'
                width='auto'
                rightIcon={<ChevronDownIcon />}
              >
                {DOC_POS_LABEL[docLayout]}
              </MenuButton>
              <MenuList fontSize='0.85rem' zIndex={1600}>
                <MenuGroup title='Avec le tableur'>
                  {SHEET_POSITIONS.map(([pos, label]) => (
                    <MenuItem
                      key={pos}
                      pl='1.5rem'
                      isDisabled={!showSpreadsheet}
                      onClick={() => setDocLayout(pos)}
                      fontWeight={docLayout === pos ? 'bold' : 'normal'}
                    >
                      {docLayout === pos ? '✓ ' : ''}{label}
                    </MenuItem>
                  ))}
                </MenuGroup>
                <MenuDivider />
                <MenuItem
                  isDisabled={!showDiagram}
                  onClick={() => setDocLayout('diagram-bottom')}
                  fontWeight={docLayout === 'diagram-bottom' ? 'bold' : 'normal'}
                >
                  {docLayout === 'diagram-bottom' ? '✓ ' : ''}Sous le diagramme
                </MenuItem>
                <MenuItem
                  onClick={() => setDocLayout('window-bottom')}
                  fontWeight={docLayout === 'window-bottom' ? 'bold' : 'normal'}
                >
                  {docLayout === 'window-bottom' ? '✓ ' : ''}Bandeau bas (pleine largeur)
                </MenuItem>
              </MenuList>
            </Menu>
          )}
        </Box>
        {/* Groupe droit : boutons d'insertion et bascule de mode.
            flex='1 1 auto' + minWidth={0} + flexWrap : le groupe peut rétrécir sous sa largeur
            de contenu (au lieu de l'ancien flex='0 0 auto' qui forçait sa largeur intrinsèque et
            poussait « Aperçu » hors du panneau étroit) ; ses enfants (menu « Insérer » + rangée de
            boutons) s'empilent alors proprement, alignés à droite. */}
        <Box display='flex' alignItems='center' flexWrap='wrap' justifyContent='flex-end' gap='0.4rem' flex='1 1 auto' minWidth={0}>
          <input
            ref={fileInputRef}
            type='file'
            accept='image/*'
            style={{ display: 'none' }}
            onChange={onPickImage}
          />
          {/* Sélecteur d'insertion unique (image, lien vers une vue, sommaire) masqué en aperçu seul et en lecture seule. */}
          {editable && mode !== 'preview' && (
            <Menu placement='bottom-end' isLazy>
              <MenuButton
                as={Button}
                size='xs'
                variant='outline'
                fontWeight='normal'
                width='auto'
                rightIcon={<ChevronDownIcon />}
              >
                Insérer
              </MenuButton>
              <MenuList fontSize='0.85rem' zIndex={1600}>
                <MenuItem onClick={() => fileInputRef.current?.click()}>
                  Une image…
                </MenuItem>
                {view_sources.length > 0 && (
                  <>
                    <MenuItem onClick={insertViewsOutline}>
                      Titre + lien pour chaque vue
                    </MenuItem>
                    <MenuDivider />
                    {/* Sous-menu flyout des vues. Chakra v2 n'a pas de sous-menu natif : on contrôle
                        l'ouverture au survol (le clic sur un MenuItem-bouton fermerait le menu parent). */}
                    <Box
                      onMouseEnter={() => setViewSubmenuOpen(true)}
                      onMouseLeave={() => setViewSubmenuOpen(false)}
                    >
                      <Menu isOpen={viewSubmenuOpen} placement='right-start' gutter={0} offset={[0, 0]} isLazy>
                        <MenuButton as={MenuItem} closeOnSelect={false}>
                          <Box display='flex' alignItems='center' justifyContent='space-between'>
                            <Box>Lien vers une vue</Box>
                            <ChevronDownIcon style={{ height: '1rem', width: '1rem', transform: 'rotate(-90deg)' }} />
                          </Box>
                        </MenuButton>
                        <Portal>
                          <MenuList
                            fontSize='0.85rem'
                            zIndex={1700}
                            maxHeight='20rem'
                            overflowY='auto'
                            onMouseEnter={() => setViewSubmenuOpen(true)}
                            onMouseLeave={() => setViewSubmenuOpen(false)}
                            // Ascenseur masqué : cliquer dessus retirait le focus de l'item courant
                            // (blur) et fermait le menu parent « Insérer » (closeOnBlur). On garde le
                            // défilement à la molette mais sans barre cliquable.
                            sx={{
                              scrollbarWidth: 'none',
                              '::-webkit-scrollbar': { display: 'none' }
                            }}
                          >
                            {view_sources.map(({ id, name }) => (
                              <MenuItem key={id} onClick={() => insertViewLink(id, name)}>
                                {name}
                              </MenuItem>
                            ))}
                          </MenuList>
                        </Portal>
                      </Menu>
                    </Box>
                  </>
                )}
              </MenuList>
            </Menu>
          )}
          {/* Rangée des modes : Box flex « wrap » (et non un ButtonGroup, qui rend une ligne
              inline-flex non sécable — c'est ce qui faisait déborder « Aperçu » sur panneau étroit).
              Les boutons passent à la ligne un par un quand la largeur l'exige ; overflowX='auto'
              n'est qu'un dernier recours pour un panneau plus étroit qu'un seul bouton (ne contient
              aucun menu déroulant, donc pas de risque de rognage de popover). */}
          <Box display='flex' flexWrap='wrap' justifyContent='flex-end' gap='0.15rem' minWidth={0} overflowX='auto'>
            {/* Bascules de mode masquées en lecture seule (publication) : seul l'aperçu a du sens. */}
            {editable && (
              <>
                <Button {...tab_btn_style(mode === 'edit')} onClick={() => setMode('edit')}>Édition</Button>
                <Button {...tab_btn_style(mode === 'split')} onClick={() => setMode('split')}>Côte à côte</Button>
                <Button {...tab_btn_style(mode === 'preview')} onClick={() => setMode('preview')}>Aperçu</Button>
              </>
            )}
            {/* Détacher / ré-attacher la doc dans une fenêtre OS séparée (second écran).
                Icône seule (sans texte) pour rester cohérent avec le bouton du menu config. */}
            {onToggleDetach && (
              <IconButton
                {...tab_btn_style(!!detached)}
                aria-label='detach-doc'
                icon={<ExternalLinkIcon boxSize='0.8rem' />}
                minW='1.2rem'
                width='1.2rem'
                maxW='1.2rem'
                h='1.2rem'
                p='0'
                flexShrink={0}
                onClick={onToggleDetach}
                title={detached ? 'Ré-attacher la documentation dans la fenêtre principale' : 'Détacher la documentation dans une fenêtre séparée'}
              />
            )}
          </Box>
        </Box>
      </Box>

      {/* Corps : éditeur et/ou aperçu */}
      <Box display='flex' flex='1 1 auto' minHeight={0}>
        {showEditor && (
          <Box flex='1 1 50%' minWidth={0} borderRight={showPreview ? '1px solid' : undefined} borderColor='gray.200'>
            <Textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => onChange(e.target.value)}
              onScroll={(e) => recordScroll(e.currentTarget)}
              onPaste={onPaste}
              placeholder={'Rédigez la documentation de ce diagramme en markdown…\n\n# Titre\n\n- point 1\n- point 2'}
              height='100%'
              resize='none'
              border='none'
              borderRadius={0}
              fontFamily='monospace'
              fontSize='0.85rem'
              _focusVisible={{ boxShadow: 'none' }}
            />
          </Box>
        )}
        {showPreview && (
          <Box flex='1 1 50%' minWidth={0}>
            <div
              ref={previewRef}
              className='os-md-preview'
              style={PREVIEW_STYLE}
              onScroll={(e) => recordScroll(e.currentTarget)}
            >
              <ReactMarkdown
                remarkPlugins={[remarkMath]}
                rehypePlugins={[rehypeKatex]}
                urlTransform={resolveUrl}
                components={{ a: LinkRenderer, ...HeadingRenderers }}
              >{text}</ReactMarkdown>
            </div>
          </Box>
        )}
      </Box>
    </Box>
  )
}
