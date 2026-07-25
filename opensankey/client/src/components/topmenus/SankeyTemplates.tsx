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

import React, { useState, useEffect, useRef, MutableRefObject } from 'react'
import {
  Box,
  Button,
  CloseButton,
  Image,
  Text
} from '@chakra-ui/react'
import {
  FaThumbtack, FaPlay, FaPause, FaStepBackward, FaStepForward,
  FaCaretDown, FaCaretRight, FaCheckCircle
} from 'react-icons/fa'
import ReactMarkdown from 'react-markdown'

import { Class_ApplicationData } from '../../types/ApplicationData'
import { Type_JSON } from '../../types/Utils'
import { Type_AdditionalMenus, TEMPLATE_GALLERY_WIDTH_PX } from '../../types/MenuConfig'
import { useMainZone } from '../spreadsheet/MainZoneTabs'
import { CONVERTER_CONFIGS } from '../dialogs/PersistenceProcessDialogConfigs'
import { loadSankeymaticTemplate } from '../../Persistence/sankeymaticLoad'
import { applyEsankeyFile } from '../../Persistence/esankeyLoad'
import { decompressGzipDataFixed } from '../../Persistence/UniversalJSONCompression'

// TYPES ================================================================================

/**
 * Source d'une galerie. Toutes ont le même index (categories + templates) et
 * sont CONSOLIDÉES dans un panneau unique (onglet par catégorie) ; seules
 * changent la racine des fichiers et les dialogues de chargement :
 *  - 'sankeydata'    : les modèles, dans le submodule SankeyData ;
 *  - 'mfadata'       : la sankeythèque, nos études publiées, dans MFAData ;
 *  - 'esankey-local' : galerie réservée aux DÉVELOPPEURS (os#1281), les démos
 *    e!Sankey d'un dossier pointé par ESANKEY_CORPUS_DIR côté serveur. Corpus
 *    propriétaire : jamais committé ni publié — il est transporté à la main sur
 *    les serveurs. La source n'existe que si ESANKEY_CORPUS_DIR est défini ET
 *    que le backend est en mode debug (poste de dev) ou que la requête vient
 *    d'un compte développeur (serveurs déployés) ; sinon 404, ses modèles
 *    n'apparaissent pas.
 * Une source absente (404, index vide, pas de JSON) ne contribue simplement
 * aucun modèle : le panneau montre les onglets des catégories restantes.
 */
export type Type_TemplateSource = 'sankeydata' | 'mfadata' | 'esankey-local'

/** Ordre de chargement ET de préséance des catégories dans le panneau consolidé. */
const GALLERY_SOURCES: Type_TemplateSource[] = ['sankeydata', 'esankey-local', 'mfadata']

/**
 * Onglet (« tab ») auquel appartient un modèle. Un onglet regroupe une ou
 * plusieurs catégories :
 *  - toute la sankeythèque (source MFAData : études, filières, recherche,
 *    clients) est réunie sous un onglet unique 'sankeytheque' ;
 *  - le reste garde un onglet par catégorie (opensankey, maps, web, sankeymatic,
 *    stan, esankey) — la galerie e!Sankey de dev, catégorisée 'esankey' côté
 *    serveur, fusionne donc avec le modèle e!Sankey publié.
 */
const templateTab = (template: Type_TemplateInfos): string =>
  template.source === 'mfadata' ? 'sankeytheque' : template.category

/** Ordre des onglets ; un onglet non listé (catégorie inattendue) passe à la fin. */
const TAB_ORDER = ['opensankey', 'maps', 'web', 'sankeymatic', 'stan', 'esankey', 'sankeytheque']

export type Type_TemplateInfos = {
  'title'?: { [lang: string]: string };
  'file_path': string;
  'img_path'?: string;
  'lang': string;
  'category': string;
  // Dossier (étude) auquel appartient le modèle : id d'une entrée de `groups`
  // de l'index, préfixé par la source côté client comme les ids de modèles.
  'group'?: string;
  // Variantes de langue d'un meme diagramme (galerie e!Sankey locale) :
  // lang -> file_path. file_path reste la variante par defaut.
  'variants'?: { [lang: string]: string };
  // Source d'origine du modèle, posée côté client à la fusion des index :
  // détermine la racine de service des fichiers et le mode de chargement.
  'source'?: Type_TemplateSource;
};
export type Type_TemplatesInfos = { [id: string]: Type_TemplateInfos; };
export type Type_TemplatesIndexes = { [category: string]: string[]; };

/**
 * Dossier d'étude déclaré par l'index d'une galerie (`groups` top-level, posé
 * par la sankeythèque MFAData) : porte le nom affiché, localisable. L'ordre des
 * sections suit l'ordre des modèles dans l'index, pas celui du dictionnaire.
 *
 * Les autres champs reprennent ce que la publication (GitLab Pages) lit déjà
 * dans le dossier de l'étude, via scripts/generate_sankeytheque_index.py :
 * `abstract` est le chapô du README (extrait à la génération, donc affichable
 * sans requête), `readme` le chemin du README complet (chargé à la demande),
 * `img_path` son image_front et `validated` la présence d'un marqueur .stamped.
 */
export type Type_TemplateGroupInfos = {
  'title'?: { [lang: string]: string };
  'abstract'?: { [lang: string]: string };
  'readme'?: { [lang: string]: string };
  'img_path'?: string;
  'validated'?: boolean;
};
export type Type_TemplateGroups = { [id: string]: Type_TemplateGroupInfos; };

// HELPERS ==============================================================================

export declare const window: Window & typeof globalThis

/** URL de service d'un fichier de galerie (vignette, modèle binaire...). */
const assetUrl = (path: string, source: Type_TemplateSource) => {
  const url = window.location.origin + '/opensankey/menus/templates_asset/' + path
  if (source === 'mfadata') return url + '?source=mfadata'
  if (source === 'esankey-local') return url + '?source=esankey-local'
  return url
}

/**
 * Charge un modèle STAN (.smfa SQLite / .zmfa XML gzippé) : binaire non-JSON, la
 * conversion est déléguée au serveur (open_stan), comme l'import fichier de MenuTop.
 */
const loadStanTemplate = (
  new_data: Class_ApplicationData,
  file_path: string
) => {
  const root = window.location.origin
  fetch(assetUrl(file_path, 'sankeydata'))
    .then(response => response.blob())
    .then(blob => {
      const form_data = new FormData()
      const filename = file_path.split('/').pop() as string
      form_data.append('file_content', new File([blob], filename))
      // Métriques d'usage : le GET du fichier de modèle est déjà compté comme
      // « import » ; ce marqueur évite au serveur de recompter le POST.
      form_data.append('origin', 'template')
      return fetch(root + new_data.url_prefix + 'open_stan', {
        method: 'POST',
        body: form_data
      })
    })
    .then(response => response.json())
    .then(json_data => new_data.fromJSON(json_data))
    .catch((error) => {
      console.error('Error in loadStanTemplate - ' + error.toString())
    })
}

/**
 * Charge un modèle e!Sankey (.sankey = ZIP + XML) : dézippé et parsé 100 % côté
 * front, comme l'import fichier de MenuTop.
 */
const loadEsankeyTemplate = (
  new_data: Class_ApplicationData,
  file_path: string,
  source: Type_TemplateSource = 'sankeydata'
) => {
  fetch(assetUrl(file_path, source))
    .then(response => response.arrayBuffer())
    .then(buffer => applyEsankeyFile(buffer, new_data))
    .catch((error) => {
      console.error('Error in loadEsankeyTemplate - ' + error.toString())
    })
}

/**
 * Charge un modèle JSON : récupéré en un seul GET, dézippé et chargé côté front.
 *
 * Le serveur n'a rien à convertir ici — il ne fait que servir un fichier — d'où
 * le court-circuit du converter (convert/launch + polling check_process +
 * retrieve_result, soit 3 aller-retours et un état en session Flask pour ouvrir
 * puis refermer un dialogue). templates_asset applique la tolérance
 * .json/.json.gz, sert le .gz brut et le rend cacheable (304).
 */
const loadJsonTemplate = (
  new_data: Class_ApplicationData,
  file_path: string,
  source: Type_TemplateSource
) => {
  new_data.sendWaitingToast(
    async () => {
      const response = await fetch(assetUrl(file_path, source))
      if (!response.ok) {
        throw new Error('chargement: ' + response.status + ' ' + response.statusText)
      }
      const buffer = await response.arrayBuffer()
      const decompressed = await decompressGzipDataFixed(buffer)
      new_data.fromJSON(JSON.parse(decompressed) as Type_JSON, {})
    },
    {
      success: { title: new_data.t('toast.load_json.success.title') },
      loading: { title: new_data.t('toast.load_json.loading.title') },
      error: { title: new_data.t('toast.load_json.error.title') }
    }
  )
}

/**
 * Charge une entrée de galerie dans l'application.
 *
 * Les formats importés (SankeyMATIC .txt, e!Sankey .sankey, STAN .smfa/.zmfa) ne
 * concernent que les modèles : parse front pour les deux premiers, conversion
 * serveur pour STAN. Le JSON se charge en direct (loadJsonTemplate). Seul le
 * .xlsx passe encore par le converter, avec les dialogues de la source :
 * `load_example_json` résout contre SankeyData, `load_sankeytheque_excel`
 * contre MFAData (example_root).
 */
export const loadTemplate = (
  new_data: Class_ApplicationData,
  file_path: string,
  source: Type_TemplateSource = 'sankeydata'
) => {
  if (source === 'sankeydata' && file_path.endsWith('.txt')) {
    // Modèle SankeyMATIC natif : parsé côté front (pas de converter JSON).
    loadSankeymaticTemplate(file_path, new_data)
    return
  }
  if (source === 'sankeydata' && /\.(smfa|zmfa)$/i.test(file_path)) {
    loadStanTemplate(new_data, file_path)
    return
  }
  // e!Sankey (.sankey) : depuis les modèles SankeyData ou la galerie locale de
  // dev (os#1281). Le loader passe la source à assetUrl pour cibler la bonne racine.
  if ((source === 'sankeydata' || source === 'esankey-local') && file_path.endsWith('.sankey')) {
    loadEsankeyTemplate(new_data, file_path, source)
    return
  }
  // Un .json / .json.gz s'ouvre directement, sans dialogue : le serveur ne
  // convertit rien. Un .xlsx doit passer par le parser (dialogue excel), dont la
  // conversion tourne vraiment dans un thread — le converter garde tout son sens.
  if (!/\.xlsx$/i.test(file_path)) {
    loadJsonTemplate(new_data, file_path, source)
    return
  }
  // Mapping inchangé pour le .xlsx : côté sankeydata, c'est bien load_example_json
  // qui était utilisé, convert/launch basculant en input_format='excel' d'après
  // l'extension. (Aucun .xlsx dans l'index des modèles à ce jour.)
  const config = source === 'mfadata'
    ? CONVERTER_CONFIGS['load_sankeytheque_excel']
    : CONVERTER_CONFIGS['load_example_json']
  new_data.menu_configuration.ref_universal_converter_set_config.current(config, file_path, true)
  new_data.menu_configuration.dict_setter_show_dialog.ref_setter_show_modal_file_converter.current(true)
}

/**
 * Récupère la bibliothèque CONSOLIDÉE de modèles auprès du serveur (une fois au
 * montage) : les trois sources sont interrogées en parallèle et fusionnées en un
 * seul index, puis regroupées en ONGLETS (voir templateTab). Renvoie :
 *  - `templates` : les modèles (id préfixé par la source pour éviter toute
 *    collision, champ `source` posé sur chacun) ;
 *  - `indexes` : catégorie -> ids, ordre d'index.json ;
 *  - `groups` : dossiers d'étude déclarés par les index (ids préfixés par la
 *    source, comme les modèles), pour les sections repliables de la sankeythèque ;
 *  - `tabs` : onglets ordonnés (TAB_ORDER puis inattendus) ;
 *  - `tab_categories` : onglet -> catégories qu'il regroupe (ordre d'affichage
 *    des modèles de l'onglet) ;
 *  - `source_tab` : source -> son onglet, pour présélectionner (sankeythèque,
 *    e!Sankey de dev).
 */
export const useTemplatesLibrary = (
  additionalMenu: MutableRefObject<Type_AdditionalMenus>
) => {
  const [templates, setTemplates] = useState<Type_TemplatesInfos>({})
  const [indexes, setIndexes] = useState<Type_TemplatesIndexes>({})
  const [groups, setGroups] = useState<Type_TemplateGroups>({})
  const [tabs, setTabs] = useState<string[]>([])
  const [tab_categories, setTabCategories] = useState<{ [tab: string]: string[] }>({})
  const [source_tab, setSourceTab] = useState<{ [s in Type_TemplateSource]?: string }>({})

  useEffect(() => {
    const url = window.location.origin + '/opensankey/menus/templates'
    Promise.all(GALLERY_SOURCES.map(source =>
      fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          module: additionalMenu.current.template_module_key,
          source
        })
      })
        .then(response => {
          // Un backend sans route modèles (ou une page d'erreur HTML) ne doit pas
          // finir dans JSON.parse : on ne parse que du JSON annoncé comme tel.
          // Une source inactive (e!Sankey hors dev, MFAData absent) répond 404 :
          // elle ne contribue rien.
          if (!response.ok || !(response.headers.get('content-type') ?? '').includes('application/json')) {
            return null
          }
          return response.json()
        })
        .catch(() => null)
        .then(json_data => ({ source, json_data }))
    ))
      .then(results => {
        const new_templates: Type_TemplatesInfos = {}
        const new_indexes: Type_TemplatesIndexes = {}
        const new_groups: Type_TemplateGroups = {}
        const new_tab_categories: { [tab: string]: string[] } = {}
        const new_source_tab: { [s in Type_TemplateSource]?: string } = {}
        results.forEach(({ source, json_data }) => {
          if (!json_data || !('templates' in json_data)) return
          // Dossiers d'étude de la source, préfixés comme les ids de modèles.
          Object.entries((json_data['groups'] ?? {}) as Type_TemplateGroups)
            .forEach(([gid, infos]) => { new_groups[source + '|' + gid] = infos })
          Object.entries(json_data['templates'] as Type_TemplatesInfos)
            .forEach(([id, template]) => {
              const uid = source + '|' + id
              const full = {
                ...template,
                source,
                group: template.group ? source + '|' + template.group : undefined
              }
              new_templates[uid] = full
              const category = template['category']
              if (!(category in new_indexes))
                new_indexes[category] = []
              new_indexes[category].push(uid)
              const tab = templateTab(full)
              if (!(tab in new_tab_categories))
                new_tab_categories[tab] = []
              if (!new_tab_categories[tab].includes(category))
                new_tab_categories[tab].push(category)
              // Premier onglet non vide d'une source : cible de présélection.
              if (!(source in new_source_tab))
                new_source_tab[source] = tab
            })
        })
        // Onglets ordonnés : TAB_ORDER d'abord, inattendus (catégorie non prévue)
        // à la fin dans leur ordre d'apparition.
        const present = Object.keys(new_tab_categories)
        setTabs([
          ...TAB_ORDER.filter(tab => present.includes(tab)),
          ...present.filter(tab => !TAB_ORDER.includes(tab))
        ])
        setTemplates(new_templates)
        setIndexes(new_indexes)
        setGroups(new_groups)
        setTabCategories(new_tab_categories)
        setSourceTab(new_source_tab)
      })
      .catch((err) => {
        console.error('Error in fetch templates - ' + err.toString())
      })
  }, [])

  return { templates, indexes, groups, tabs, tab_categories, source_tab }
}

/**
 * Vignette d'un modèle. Certains modèles (formats importés) n'ont pas d'image de
 * prévisualisation : on affiche alors un aplat portant leur titre.
 */
const TemplateThumbnail = ({ title, img_path, max_height, className, source }:{
  title: string
  img_path?: string
  max_height: string
  className?: string
  source: Type_TemplateSource
}) => {
  if (img_path === undefined)
    return <Box
      display='flex'
      alignItems='center'
      justifyContent='center'
      height={max_height}
      background='gray.100'
      borderRadius='4px'
      padding='0.5rem'
    >
      <Text fontSize='sm' color='gray.600' textAlign='center' margin='0'>
        {title}
      </Text>
    </Box>
  return <Image
    className={className}
    src={assetUrl(img_path, source)}
    style={{ 'objectFit': 'contain', 'maxHeight': max_height, 'width': '100%' }}
  />
}

/**
 * README de présentation d'un dossier d'étude, chargé À LA DEMANDE (le chapô,
 * lui, vient de l'index et s'affiche sans requête).
 *
 * Les images du README ne sont volontairement PAS rendues : leurs chemins sont
 * relatifs au dépôt MFAData et ne sont pas déclarés dans l'index, donc pas
 * servis (la liste blanche protège le contenu non publié). Le site publié, lui,
 * les réécrit à la génération — c'est le rendu de référence, vers lequel les
 * liens du README pointent en s'ouvrant dans un nouvel onglet.
 */
const GroupReadme = ({ path, source, error_label }:{
  path: string
  source: Type_TemplateSource
  error_label: string
}) => {
  const [text, setText] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let cancelled = false
    setText(null)
    setFailed(false)
    fetch(assetUrl(path, source))
      .then(response => {
        if (!response.ok) throw new Error(String(response.status))
        return response.text()
      })
      .then(content => { if (!cancelled) setText(content) })
      .catch(() => { if (!cancelled) setFailed(true) })
    return () => { cancelled = true }
  }, [path, source])

  if (failed)
    return <Text fontSize='xs' color='gray.400' margin='0.3rem 0'>{error_label}</Text>
  if (text === null)
    return <Text fontSize='xs' color='gray.400' margin='0.3rem 0'>…</Text>
  return <Box
    fontSize='xs'
    color='gray.600'
    lineHeight='1.45'
    maxHeight='16rem'
    overflowY='auto'
    padding='0.4rem 0.5rem'
    background='#f8faf9'
    border='1px solid #eef2f0'
    borderRadius='6px'
    // Le README est écrit pour une page pleine largeur : on ramène les titres à
    // l'échelle du panneau et on borne les blocs qui déborderaient.
    sx={{
      '& h1, & h2, & h3, & h4': { fontSize: 'xs', fontWeight: '700', margin: '0.5rem 0 0.2rem 0' },
      '& h1:first-of-type': { marginTop: '0' },
      '& p, & ul, & ol': { margin: '0 0 0.4rem 0' },
      '& ul, & ol': { paddingLeft: '1rem' },
      '& a': { color: '#55897A', textDecoration: 'underline' },
      '& code': { fontSize: '0.9em' },
      '& pre, & table': { overflowX: 'auto', maxWidth: '100%' },
      '& hr': { margin: '0.4rem 0', borderColor: '#e6ebe9' }
    }}
  >
    <ReactMarkdown
      components={{
        img: () => null,
        a: ({ href, children }) =>
          <a href={href} target='_blank' rel='noopener noreferrer'>{children}</a>
      }}
    >{text}</ReactMarkdown>
  </Box>
}

/**
 * Fichier à charger pour un modèle : la variante dans la langue de l'application
 * quand elle existe, sinon la variante par défaut (file_path).
 */
const templateFilePath = (
  new_data: Class_ApplicationData,
  template: Type_TemplateInfos
) => {
  return template.variants?.[new_data.i18n.language] ?? template.file_path
}

/** Titre localisé d'un modèle, avec repli en puis id (sans le préfixe de source). */
const templateTitle = (
  new_data: Class_ApplicationData,
  id: string,
  template: Type_TemplateInfos
) => {
  return template.title?.[new_data.i18n.language]
    ?? template.title?.['en']
    ?? id.split('|').slice(1).join('|')
}

// COMPONENTS ===========================================================================

/**
 * Galerie de modèles ancrée à droite, CONSOLIDÉE : les trois sources (modèles
 * SankeyData, sankeythèque MFAData, corpus e!Sankey de dev) sont fusionnées dans
 * un panneau unique, avec un onglet par catégorie en haut (OpenSankey, cartes,
 * classiques du web, SankeyMATIC, STAN, e!Sankey, puis les catégories de la
 * sankeythèque). Deux façons de l'obtenir :
 *  - automatiquement à l'ARRIVÉE tant que le diagramme est vide : vitrine pour le
 *    nouveau visiteur (un clic charge un exemple riche). Elle s'efface d'elle-même
 *    dès que l'utilisateur travaille : diagramme non vide (modèle chargé, fichier
 *    ouvert, cache restauré), première interaction avec le canvas (création
 *    manuelle) ou fermeture explicite ;
 *  - explicitement, via Menu -> Nouveau -> « À partir d'un modèle » (et le splash
 *    screen), qui passent par ref_setter_show_modal_templates_lib. Ouverte ainsi,
 *    elle reste affichée même sur un diagramme non vide, jusqu'au choix d'un modèle
 *    ou à sa fermeture.
 *
 * L'épingle neutralise TOUTES les fermetures implicites (clic canvas, diagramme
 * non vide, choix d'un modèle) : on peut ainsi essayer les modèles l'un après
 * l'autre. Seul le bouton de fermeture la referme alors. Comme le panneau de
 * config (#1243), épinglée elle quitte l'overlay et entre dans le système de
 * fenêtrage : dockée à droite, elle réserve sa largeur (getRightChromeReservedPx)
 * et la zone de dessin se recadre à gauche.
 */
export const TemplateGalleryPanel = ({ new_data, additionalMenu }:{
  new_data: Class_ApplicationData
  additionalMenu: MutableRefObject<Type_AdditionalMenus>
}) => {
  const [dismissed, setDismissed] = useState(false)
  // L'épinglage vit dans le modèle (et non en useState) : il réserve de la
  // largeur, donc le diagramme et la colonne tableur/doc doivent le lire.
  // useMainZone -> re-render quand la réserve change (ici comme ailleurs).
  useMainZone(new_data)
  const pinned = new_data.menu_configuration.template_gallery_pinned
  const setPinned = (v: boolean) => { new_data.menu_configuration.template_gallery_pinned = v }
  // Panneau UNIQUE et consolidé : toutes les sources fusionnées, un onglet par
  // regroupement (voir templateTab). `forced_open` = ouverture explicite (menu /
  // splash / sankeythèque), qui survit à un diagramme non vide.
  const [forced_open, setForcedOpen] = useState(false)
  // Onglet sélectionné ; null tant qu'aucun choix -> premier onglet disponible.
  const [selected_tab, setSelectedTab] = useState<string | null>(null)

  // Player (diaporama) : enchaîne les modèles de l'ONGLET COURANT l'un après
  // l'autre. `playing` pilote la temporisation ; `current_id` sert au surlignage
  // et au repli automatique de la liste sur la vignette en cours. L'index courant
  // vit dans une ref (l'intervalle ne se réabonne pas à chaque avance).
  const [playing, setPlaying] = useState(false)
  const [current_id, setCurrentId] = useState<string | null>(null)
  const play_index_ref = useRef(0)
  const cards_ref = useRef<{ [id: string]: HTMLElement | null }>({})

  const { templates, indexes, groups, tabs, tab_categories, source_tab } = useTemplatesLibrary(additionalMenu)

  // Dossiers d'étude repliés. `null` = état par défaut, calculé au rendu (tous
  // repliés sauf le premier de l'onglet) ; un Set dès la première interaction.
  const [collapsed_groups, setCollapsedGroups] = useState<Set<string> | null>(null)
  // Dossier dont le README complet est déployé (un seul à la fois).
  const [open_readme, setOpenReadme] = useState<string | null>(null)

  // Ouverture depuis le menu / le splash screen : le panneau remplace l'ancienne modale.
  new_data.menu_configuration.dict_setter_show_dialog
    .ref_setter_show_modal_templates_lib.current = (open) => {
      const is_open = typeof open === 'function' ? open(forced_open) : open
      setForcedOpen(is_open)
    }
  // Ouverture sur l'onglet d'une source donnée (la sankeythèque côté SA, la
  // galerie e!Sankey de dev) : même panneau, onglet présélectionné.
  new_data.menu_configuration.dict_setter_show_dialog
    .ref_setter_show_gallery_source.current = (src) => {
      const requested = typeof src === 'function' ? src(null) : src
      if (requested === null) {
        setForcedOpen(false)
        return
      }
      setForcedOpen(true)
      const tab = source_tab[requested]
      if (tab) setSelectedTab(tab)
    }

  // Onglet effectif : le choix de l'utilisateur s'il pointe un onglet encore
  // servi, sinon le premier onglet.
  const current_tab = (selected_tab && selected_tab in tab_categories)
    ? selected_tab
    : (tabs[0] ?? null)

  // Catégories de l'onglet courant (sous-titres) et liste à plat des modèles dans
  // l'ordre d'affichage : c'est la séquence que parcourent le player et les
  // boutons précédent/suivant.
  const current_tab_categories = current_tab ? (tab_categories[current_tab] ?? []) : []
  const ordered_all = current_tab_categories.flatMap(category => indexes[category] ?? [])
  const current_pos = current_id ? ordered_all.indexOf(current_id) : -1

  // Découpe une liste d'ids en sections par dossier d'étude (`group`), dans
  // l'ordre de première apparition ; les modèles sans dossier forment des
  // sections anonymes (grille à plat, cas des galeries sans `groups`).
  const groupSections = (ids: string[]) => {
    const sections: { group: string | null, ids: string[] }[] = []
    ids.forEach(id => {
      const g = templates[id]?.group ?? null
      const section = sections.find(s => s.group === g)
      if (section) section.ids.push(id)
      else sections.push({ group: g, ids: [id] })
    })
    return sections
  }

  // Dossiers de l'onglet courant, dans l'ordre d'affichage. Par défaut seul le
  // premier est déplié : la sankeythèque compte des centaines d'entrées.
  const current_tab_groups = current_tab_categories
    .flatMap(category => groupSections(indexes[category] ?? []))
    .flatMap(section => section.group === null ? [] : [section.group])
  const collapsed = collapsed_groups ?? new Set(current_tab_groups.slice(1))

  const toggleGroup = (gid: string) => {
    const next = new Set(collapsed)
    if (next.has(gid)) next.delete(gid)
    else next.add(gid)
    setCollapsedGroups(next)
  }

  /**
   * Valeur d'un champ multilingue d'un dossier (nom affiché, chapô, chemin du
   * README) dans la langue de l'application, avec repli sur en, fr, puis la
   * première déclarée.
   */
  const groupLocalized = (gid: string, field: 'title' | 'abstract' | 'readme') => {
    const values = groups[gid]?.[field]
    if (!values) return undefined
    return values[new_data.i18n.language]
      ?? values['en'] ?? values['fr'] ?? Object.values(values)[0]
  }

  /** Nom affiché d'un dossier d'étude, localisé, avec repli sur son id. */
  const groupTitle = (gid: string) =>
    groupLocalized(gid, 'title') ?? gid.split('|').slice(1).join('|')

  // Charge le modèle à la position `i` (bouclage) et le marque comme courant.
  const showTemplateAt = (i: number) => {
    if (ordered_all.length === 0) return
    const idx = ((i % ordered_all.length) + ordered_all.length) % ordered_all.length
    const id = ordered_all[idx]
    play_index_ref.current = idx
    setCurrentId(id)
    loadTemplate(new_data, templateFilePath(new_data, templates[id]), templates[id].source)
  }

  // Lecture automatique : un intervalle avance d'un cran à chaque tick. Snapshot de
  // l'onglet pris au démarrage (la bibliothèque ne change pas tant que la galerie
  // est ouverte), d'où l'intervalle qui ne dépend que de `playing`.
  useEffect(() => {
    if (!playing) return
    const cats = current_tab ? (tab_categories[current_tab] ?? []) : []
    const flat = cats.flatMap(category => indexes[category] ?? [])
    if (flat.length === 0) { setPlaying(false); return }
    const show = (i: number) => {
      const idx = ((i % flat.length) + flat.length) % flat.length
      const id = flat[idx]
      play_index_ref.current = idx
      setCurrentId(id)
      loadTemplate(new_data, templateFilePath(new_data, templates[id]), templates[id].source)
    }
    show(play_index_ref.current)
    const timer = window.setInterval(() => show(play_index_ref.current + 1), 3500)
    return () => window.clearInterval(timer)
  }, [playing])

  // Le modèle courant (player ou navigation) déplie son dossier d'étude : sans
  // quoi sa vignette resterait invisible dans une section repliée.
  useEffect(() => {
    if (!current_id) return
    const gid = templates[current_id]?.group
    if (gid && collapsed.has(gid)) {
      const next = new Set(collapsed)
      next.delete(gid)
      setCollapsedGroups(next)
    }
  }, [current_id])

  // Replie la liste sur la vignette en cours (player ou navigation manuelle).
  // Dépend aussi du repli : la vignette peut n'exister qu'après le dépliage.
  useEffect(() => {
    if (current_id)
      cards_ref.current[current_id]?.scrollIntoView({ block: 'nearest' })
  }, [current_id, collapsed_groups])

  // Changement d'onglet : on repart d'une séquence vierge, repli par défaut.
  useEffect(() => {
    setPlaying(false)
    setCurrentId(null)
    play_index_ref.current = 0
    setCollapsedGroups(null)
  }, [current_tab])

  // Démarrer/arrêter le player. Au démarrage, on force l'ouverture pour que le
  // panneau survive aux chargements successifs (sinon il se referme sur un diagramme
  // non vide) sans pour autant le docker comme l'épingle.
  const togglePlay = () => {
    if (!playing) setForcedOpen(true)
    setPlaying(p => !p)
  }

  // Première interaction avec la zone de dessin -> la galerie s'efface. Écoute au
  // niveau document (capture) : #draw_zoom est recréé à chaque draw(), un listener
  // posé dessus serait perdu.
  useEffect(() => {
    const onPointerDown = (evt: PointerEvent) => {
      if ((evt.target as Element | null)?.closest?.('#draw_zoom'))
        setDismissed(true)
    }
    document.addEventListener('pointerdown', onPointerDown, true)
    return () => document.removeEventListener('pointerdown', onPointerDown, true)
  }, [])

  // drawing_area lue en LIVE (elle est remplacée au reset/changement de vue).
  // Le parent (SankeyMenu) re-rend via ref_to_menu_updater, appelé notamment par
  // updateAllMenuComponents() après tout fromJSON : la condition est réévaluée
  // dès qu'un diagramme est chargé.
  const da = new_data.drawing_area
  const diagram_empty = (da.sankey?.nodes_list?.length ?? 0) === 0

  if (new_data.is_static || !new_data.is_editable)
    return <></>
  if (!pinned && !forced_open && (dismissed || !diagram_empty))
    return <></>
  if (tabs.length === 0 || current_tab === null)
    return <></>

  // Habillage de l'onglet courant : la sankeythèque garde son titre et son
  // invite ; l'onglet e!Sankey rappelle la nature du corpus local quand la
  // galerie réservée aux devs est active (sans elle, il ne contient que les
  // modèles publiés).
  const is_theque_tab = current_tab === 'sankeytheque'
  const is_esankey_dev_tab = source_tab['esankey-local'] === current_tab

  const mc = new_data.menu_configuration
  // Épinglée, la galerie se docke à GAUCHE du chrome déjà réservé (colonne
  // d'outils + config épinglée) : de droite à gauche, outils | config | galerie
  // | dessin. Sa propre largeur n'entre pas dans cet offset (elle la réserve).
  const docked_right = mc.getToolsColumnWidthPx() + mc.getConfigPanelPinnedReservedPx()
  const top = da.getNavBarHeight() + (pinned ? 0 : da.fit_margin)
  const bottom = da.getBottomBarHeight() + (pinned ? 0 : da.fit_margin)
  const right = pinned ? docked_right : da.fit_margin / 2 + mc.getToolsColumnWidthPx()

  const ACCENT = '#55897A'   // tertiaire.3, accent de l'app

  // Rendu d'une vignette (réutilisé par onglet simple ou sous-catégories).
  const renderCard = (id: string) => {
    const is_current = id === current_id
    const template = templates[id]
    const variant_langs = Object.keys(template.variants ?? {})
    // Charge une variante du modèle, avec les mêmes effets de bord que le clic
    // sur la vignette (surlignage, reprise du player, fermeture).
    const openTemplate = (file_path: string) => {
      play_index_ref.current = ordered_all.indexOf(id)
      setCurrentId(id)
      loadTemplate(new_data, file_path, template.source)
      // Épinglée ou en lecture, la galerie survit au chargement : on enchaîne.
      if (!pinned && !playing) setForcedOpen(false)
    }
    return <Box
      key={id}
      ref={(el: HTMLElement | null) => { cards_ref.current[id] = el }}
      role='group'
      cursor='pointer'
      overflow='hidden'
      background='white'
      border='1px solid'
      borderColor={is_current ? ACCENT : '#e6ebe9'}
      boxShadow={is_current ? '0 0 0 1px ' + ACCENT : '0 1px 2px rgba(16, 24, 40, 0.04)'}
      borderRadius='10px'
      transition='transform .12s ease, box-shadow .12s ease, border-color .12s ease'
      _hover={{
        transform: 'translateY(-2px)',
        boxShadow: '0 6px 18px rgba(16, 24, 40, 0.12)',
        borderColor: ACCENT
      }}
      // Clic manuel : le player suit la sélection (surlignage + reprise ici).
      onClick={() => openTemplate(templateFilePath(new_data, template))}
    >
      <Box
        height='96px'
        background='#f6f8f7'
        borderBottom='1px solid #eef2f0'
        display='flex'
        alignItems='center'
        justifyContent='center'
        overflow='hidden'
      >
        <TemplateThumbnail
          title={templateTitle(new_data, id, template)}
          img_path={template.img_path}
          max_height='96px'
          source={template.source ?? 'sankeydata'}
        />
      </Box>
      <Box padding='0.4rem 0.5rem 0.5rem 0.5rem'>
        <Text
          fontSize='xs'
          fontWeight='600'
          textAlign='center'
          color='gray.700'
          margin='0'
          noOfLines={2}
          minHeight='2.1em'
          lineHeight='1.05em'
          title={templateTitle(new_data, id, template)}
        >
          {templateTitle(new_data, id, template)}
        </Text>
        {variant_langs.length > 1 &&
          <Box display='flex' flexWrap='wrap' justifyContent='center' gap='0.25rem' marginTop='0.35rem'>
            {variant_langs.map(lang =>
              <Box
                key={lang}
                as='button'
                fontSize='0.62rem'
                fontWeight='600'
                lineHeight='1'
                letterSpacing='0.02em'
                padding='0.15rem 0.3rem'
                borderRadius='4px'
                color={lang === new_data.i18n.language ? 'white' : ACCENT}
                background={lang === new_data.i18n.language ? ACCENT : '#eaf1ee'}
                _hover={{ background: ACCENT, color: 'white' }}
                transition='background .1s, color .1s'
                onClick={(evt: React.MouseEvent) => {
                  evt.stopPropagation()
                  openTemplate(template.variants![lang])
                }}
              >
                {lang.toUpperCase()}
              </Box>)}
          </Box>}
      </Box>
    </Box>
  }

  // Grille 2 colonnes de vignettes pour une liste d'ids.
  const renderGrid = (ids: string[]) =>
    <Box
      display='grid'
      gridTemplateColumns='repeat(2, minmax(0, 1fr))'
      gap='0.5rem'
    >
      {ids.map(renderCard)}
    </Box>

  // Liste d'ids rendue en sections par dossier d'étude : un en-tête repliable
  // par dossier (nom affiché déclaré par l'index), grille à plat pour les
  // modèles sans dossier — les galeries sans `groups` gardent leur rendu actuel.
  const renderSections = (ids: string[]) =>
    groupSections(ids).map(({ group, ids: section_ids }, i) => {
      if (group === null)
        return <Box key={'flat_' + i} marginTop='0.4rem'>{renderGrid(section_ids)}</Box>
      const is_collapsed = collapsed.has(group)
      const abstract = groupLocalized(group, 'abstract')
      const readme = groupLocalized(group, 'readme')
      const readme_open = open_readme === group
      const source = templates[section_ids[0]]?.source ?? 'sankeydata'
      return <Box key={group} marginTop='0.35rem'>
        <Box
          display='flex'
          alignItems='center'
          gap='0.35rem'
          padding='0.3rem 0.2rem'
          borderRadius='6px'
          color='gray.600'
          _hover={{ background: '#f2f5f4', color: 'gray.800' }}
          transition='background .1s, color .1s'
        >
          <Box
            as='button'
            display='flex'
            alignItems='center'
            gap='0.35rem'
            flex='1'
            minWidth='0'
            textAlign='left'
            color='inherit'
            onClick={() => toggleGroup(group)}
          >
            <Box as='span' fontSize='0.7rem' color={ACCENT} flex='none'>
              {is_collapsed ? <FaCaretRight /> : <FaCaretDown />}
            </Box>
            {/* Couverture de l'étude (image_front du dossier), la même que celle
                qui illustre sa page sur le site publié. */}
            {groups[group]?.img_path && <Image
              src={assetUrl(groups[group].img_path as string, source)}
              flex='none'
              width='1.6rem'
              height='1.6rem'
              borderRadius='4px'
              objectFit='cover'
              background='#f6f8f7'
            />}
            <Text fontSize='xs' fontWeight='600' margin='0' noOfLines={1} flex='1'>
              {groupTitle(group)}
            </Text>
          </Box>
          {/* Étude validée : marqueur .stamped, le même que celui qui autorise la
              publication du dossier sur le site. */}
          {groups[group]?.validated && <Box
            as='span'
            flex='none'
            fontSize='0.7rem'
            color={ACCENT}
            title={new_data.t('templates.group_validated')}
          >
            <FaCheckCircle />
          </Box>}
          <Text fontSize='0.65rem' color='gray.400' margin='0' flex='none'>
            {section_ids.length}
          </Text>
        </Box>
        {/* Présentation de l'étude. Le chapô vient de l'index (extrait du README
            à la génération) : il s'affiche sans requête. Le README entier ne part
            en réseau qu'au clic sur « lire la présentation ». Le lien est écrit en
            toutes lettres : une icône seule passait inaperçue, d'autant que les
            premiers dossiers de la liste n'ont pas encore de README. */}
        {(abstract || readme) && !readme_open && <Box margin='0 0 0.35rem 1.05rem'>
          {abstract && <Text
            fontSize='0.68rem'
            color='gray.500'
            lineHeight='1.35'
            margin='0'
            noOfLines={is_collapsed ? 2 : 4}
          >
            {abstract}
          </Text>}
          {readme && <Box
            as='button'
            fontSize='0.66rem'
            fontWeight='600'
            color={ACCENT}
            textDecoration='underline'
            marginTop='0.1rem'
            _hover={{ opacity: 0.75 }}
            onClick={() => setOpenReadme(group)}
          >
            {new_data.t('templates.group_readme_open')}
          </Box>}
        </Box>}
        {readme_open && readme && <Box margin='0 0 0.4rem 0'>
          <GroupReadme
            path={readme}
            source={source}
            error_label={new_data.t('templates.group_readme_error')}
          />
          <Box
            as='button'
            fontSize='0.66rem'
            fontWeight='600'
            color={ACCENT}
            textDecoration='underline'
            marginTop='0.2rem'
            marginLeft='0.2rem'
            _hover={{ opacity: 0.75 }}
            onClick={() => setOpenReadme(null)}
          >
            {new_data.t('templates.group_readme_close')}
          </Box>
        </Box>}
        {!is_collapsed && <Box marginTop='0.25rem' marginBottom='0.4rem'>
          {renderGrid(section_ids)}
        </Box>}
      </Box>
    })

  const iconBtnSx = { paddingInline: '0.3rem', minWidth: 'auto', width: 'auto', flex: 'none' }

  return <Box
    className={pinned ? 'template_gallery_panel_pinned' : 'template_gallery_panel'}
    position='fixed'
    top={top + 'px'}
    right={right + 'px'}
    width={TEMPLATE_GALLERY_WIDTH_PX + 'px'}
    // Dockée : elle occupe toute la hauteur entre les barres, comme le panneau
    // de config épinglé. Flottante : elle s'arrête à son contenu.
    bottom={pinned ? bottom + 'px' : undefined}
    maxHeight={pinned ? undefined : 'calc(100vh - ' + (top + bottom) + 'px)'}
    zIndex={pinned ? 26 : 20}
    background='white'
    border={pinned ? undefined : '1px solid #e2e8f0'}
    borderLeft='1px solid #e2e8f0'
    borderRadius={pinned ? undefined : '10px'}
    boxShadow={pinned ? undefined : '0 10px 30px rgba(16, 24, 40, 0.18)'}
    display='flex'
    flexDirection='column'
    overflow='hidden'
  >
    <Box
      display='flex'
      alignItems='center'
      justifyContent='space-between'
      padding='0.6rem 0.75rem'
      borderBottom='1px solid #eef2f0'
    >
      <Text fontWeight='700' fontSize='sm' color='gray.800' margin='0'>
        {new_data.t(is_theque_tab ? 'Menu.sankeytheque' : 'Menu.templates')}
      </Text>
      <Box display='flex' alignItems='center' gap='0.25rem'>
        {ordered_all.length > 1 && <>
          <Button
            size='xs'
            variant='menuconfigpanel_option_button'
            sx={iconBtnSx}
            title={new_data.t('templates.prev')}
            onClick={() => showTemplateAt((current_pos < 0 ? 0 : current_pos) - 1)}
          >
            <FaStepBackward />
          </Button>
          <Button
            size='xs'
            variant={playing
              ? 'menuconfigpanel_option_button_activated'
              : 'menuconfigpanel_option_button'}
            sx={iconBtnSx}
            title={new_data.t(playing ? 'templates.pause' : 'templates.play')}
            onClick={togglePlay}
          >
            {playing ? <FaPause /> : <FaPlay />}
          </Button>
          <Button
            size='xs'
            variant='menuconfigpanel_option_button'
            sx={iconBtnSx}
            title={new_data.t('templates.next')}
            onClick={() => showTemplateAt((current_pos < 0 ? -1 : current_pos) + 1)}
          >
            <FaStepForward />
          </Button>
          {current_pos >= 0 && <Text fontSize='xs' color='gray.500' margin='0 0.15rem'>
            {(current_pos + 1) + '/' + ordered_all.length}
          </Text>}
        </>}
        <Button
          size='xs'
          variant={pinned
            ? 'menuconfigpanel_option_button_activated'
            : 'menuconfigpanel_option_button'}
          sx={iconBtnSx}
          title={new_data.t(pinned ? 'templates.unpin' : 'templates.pin')}
          onClick={() => setPinned(!pinned)}
        >
          <FaThumbtack style={{ transform: pinned ? 'none' : 'rotate(45deg)' }} />
        </Button>
        <CloseButton
          size='sm'
          onClick={() => { setPlaying(false); setForcedOpen(false); setDismissed(true); setPinned(false) }}
        />
      </Box>
    </Box>
    {/* Barre d'onglets : toutes les sources consolidées (modèles OpenSankey,
        cartes, classiques du web, SankeyMATIC, STAN, e!Sankey, puis la
        SankeyThèque). Pilules qui reviennent à la ligne — pas de défilement
        (donc pas de scrollbar au ras du bandeau). */}
    <Box
      display='flex'
      flexWrap='wrap'
      gap='0.3rem'
      padding='0.5rem 0.75rem'
      borderBottom='1px solid #eef2f0'
    >
      {tabs.map(tab => {
        const active = tab === current_tab
        return <Box
          key={tab}
          as='button'
          flex='none'
          whiteSpace='nowrap'
          fontSize='xs'
          fontWeight={active ? '700' : '500'}
          lineHeight='1'
          padding='0.3rem 0.55rem'
          borderRadius='999px'
          color={active ? 'white' : 'gray.600'}
          background={active ? ACCENT : '#eef2f0'}
          transition='background .12s, color .12s'
          _hover={{ background: active ? ACCENT : '#e0e7e4' }}
          onClick={() => setSelectedTab(tab)}
        >
          {new_data.t('templates.categories.' + tab)}
        </Box>
      })}
    </Box>
    <Text
      fontSize='xs'
      color='gray.500'
      margin='0'
      padding='0.5rem 0.75rem 0.4rem 0.75rem'
    >
      {is_esankey_dev_tab
        ? 'Galerie réservée aux développeurs (ESANKEY_CORPUS_DIR) — corpus propriétaire, non publié.'
        : new_data.t(is_theque_tab ? 'templates.sankeytheque_hint' : 'templates.gallery_hint')}
    </Text>
    {/* Un seul niveau : les dossiers d'étude (sections repliables) se suivent
        dans l'ordre de l'index, sans sous-titre par catégorie — les catégories
        ne servent plus qu'à ordonner ordered_all. */}
    <Box overflowY='auto' padding='0 0.75rem 0.75rem 0.75rem'>
      <Box marginTop='0.5rem'>{renderSections(ordered_all)}</Box>
    </Box>
  </Box>
}
