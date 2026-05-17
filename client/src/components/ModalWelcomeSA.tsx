// Standard libs
import React, { useState, useEffect } from 'react'
import { Box, Heading, Spinner, Tbody, Td, Th, Thead, Tr } from '@chakra-ui/react'
import ReactMarkdown, { type Components } from 'react-markdown'

// Chakra's CSSReset flattens h1..h6 to inherit, which makes raw <h2>/<h3>
// rendered by react-markdown indistinguishable from body text. Re-map them
// onto Chakra Heading so the WHATSNEW sections stay visually structured.
const whatsnewComponents: Components = {
  h2: ({ children }) => (
    <Heading as='h2' size='lg' marginTop='1.5rem' marginBottom='0.75rem'>{children}</Heading>
  ),
  h3: ({ children }) => (
    <Heading as='h3' size='md' marginTop='1rem' marginBottom='0.5rem'>{children}</Heading>
  ),
}

// OpenSankey libs
import {
  ModalWelcome,
  ModalWelcomeContent,
  buildShortcutsContent
} from '../deps/OpenSankey+/deps/OpenSankey/components/welcome/ModalWelcome'
import { Class_ApplicationData } from '../deps/OpenSankey+/deps/OpenSankey/types/ApplicationData'
import { FeaturesMatrixSA } from './FeaturesMatrixSA'

// WHATSNEW.md is a single file with sections separated by <!-- LANG:xx --> markers.
// We slice out the section that matches the active UI language, falling back to English
// then to the whole document if no marker is found.
const extractLanguageSection = (markdown: string, lang: string): string => {
  const headMarker = new RegExp(`<!--\\s*LANG:${lang}\\s*-->`, 'i')
  const headMatch = headMarker.exec(markdown)
  if (!headMatch) return ''
  const after = markdown.slice(headMatch.index + headMatch[0].length)
  const nextRel = after.search(/<!--\s*LANG:[a-z-]+\s*-->/i)
  return nextRel < 0 ? after : after.slice(0, nextRel)
}

const WhatsNewContent = ({ app_data }: { app_data: Class_ApplicationData }) => {
  const { t, i18n } = app_data
  const [content, setContent] = useState<string | null>(null)
  const [error, setError] = useState<boolean>(false)
  const lang = (i18n?.language ?? 'en').split('-')[0].toLowerCase()

  useEffect(() => {
    let cancelled = false
    setContent(null)
    setError(false)
    fetch('./WHATSNEW.md')
      .then(r => (r.ok ? r.text() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then(text => {
        if (cancelled) return
        const section =
          extractLanguageSection(text, lang) ||
          extractLanguageSection(text, 'en') ||
          text
        setContent(section.trim())
      })
      .catch(() => { if (!cancelled) setError(true) })
    return () => { cancelled = true }
  }, [lang])

  if (error) {
    return <Box padding='1rem'>{t('welcome.news_unavailable')}</Box>
  }
  if (content === null) {
    return <Box padding='1rem'><Spinner size='sm' /></Box>
  }
  return <Box
    display='block'
    overflowY='scroll'
    overflowX='hidden'
    height='100%'
    width='100%'
    paddingRight='1rem'
    className='whatsnew-markdown'
  >
    <ReactMarkdown components={whatsnewComponents}>{content}</ReactMarkdown>
  </Box>
}

export const ModalWelcomeBuilderSA = ({ app_data }: { app_data: Class_ApplicationData }) => {
  const [, setCount] = useState(0)
  app_data.menu_configuration.dict_setter_show_dialog.ref_setter_modal_welcome_active_page.current = () => setCount(a => a + 1)

  const { t } = app_data
  const [page_links, page_content] = ModalWelcomeContent(app_data)

  // Mirror the OSP shortcut extension (we bypass ModalWelcomeBuilderOSP so we can
  // inject the SA-level "news" tab; keeping the OSP block here avoids dropping it).
  page_content['rc'] = buildShortcutsContent(app_data, {
    extraSectionsBeforeKeyboard: <>
      <Thead><Th colSpan={2}>{t('Menu.rcc_titre_OSP')}</Th></Thead>
      <Tbody>
        <Tr><Td>{t('Menu.rcc_osp_cs_bold')}</Td><Td>{t('Menu.rcc_osp_cs')}</Td></Tr>
        <Tr><Td>{t('Menu.rcc_F7_bold')}</Td><Td>{t('Menu.rcc_F7')}</Td></Tr>
        <Tr><Td>{t('Menu.rcc_F8_bold')}</Td><Td>{t('Menu.rcc_F8')}</Td></Tr>
        <Tr><Td>{t('Menu.rcc_F9_bold')}</Td><Td>{t('Menu.rcc_F9')}</Td></Tr>
      </Tbody>
    </>
  })

  page_links['features'] = <>{t('welcome.breadcrumbs.features')}</>
  page_content['features'] = <FeaturesMatrixSA app_data={app_data} />

  page_links['news'] = <>{t('welcome.breadcrumbs.news')}</>
  page_content['news'] = <WhatsNewContent app_data={app_data} />

  return <ModalWelcome
    app_data={app_data}
    external_pagination={page_links}
    external_content={page_content}
  />
}
