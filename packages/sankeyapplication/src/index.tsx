import '@terriflux/opensankey/src/css/main.css'
import '@terriflux/opensankey-plus/src/css/style_elements_sankey.css'
import '@terriflux/opensankey-plus/src/css/react-quill.css'
import './css/Login.css'
import './css/Register.css'
import React, { FC, useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import './traductions/traduction'
import i18next from './traductions/traduction'
import { SankeyApp } from './AppSA'
import { Class_ApplicationDataSA } from './ApplicationDataSA'
import { useTranslation } from 'react-i18next'
import { getForcedLanguage } from '@terriflux/opensankey/src/types/PublishOptions'

window.React = React
const browserLang = navigator.language.slice(0, 2)
const supportedLangs = ['fr', 'en', 'es', 'de', 'it']
// Langue imposée par la page hôte (?lang= ou window.sankey.language, cf. sites publiés) :
// prioritaire sur la préférence mémorisée.
const forcedLang = getForcedLanguage(supportedLangs)
if (forcedLang) {
  i18next.changeLanguage(forcedLang)
} else {
  // Ne forcer la langue du navigateur qu'au premier lancement : si l'utilisateur a déjà choisi une
  // langue, le LanguageDetector l'a mise en cache dans localStorage['i18nextLng'] et l'a restaurée à
  // l'init. La réécraser ici réinitialisait la langue à chaque rechargement (bug). On respecte donc
  // la préférence mémorisée et on ne retombe sur le navigateur que si elle est absente/invalide.
  const savedLang = localStorage.getItem('i18nextLng')
  if (!savedLang || !supportedLangs.includes(savedLang))
    i18next.changeLanguage(supportedLangs.includes(browserLang) ? browserLang : 'en')
}

const container = document.getElementById('react-container') as Element | DocumentFragment
const root = createRoot(container)



const App: FC = () => {
  const [dataApp, setDataApp] = useState<Class_ApplicationDataSA | null>(null)

  const translation = useTranslation('translation', { useSuspense: false })
  useEffect(() => {
    const newDataApp = new Class_ApplicationDataSA(!!window.sankey?.publish)
    newDataApp.t = translation.t
    newDataApp.i18n = translation.i18n
    // Le diagramme de publication (window.sankey.diagram) est chargé UNE SEULE FOIS
    // par OpenSankeyApp (son useEffect de montage), APRÈS createNewMenuConfiguration().
    // On ne fait PAS fromJSON ici : à ce stade menu_configuration et les refs de la
    // drawing area n'existent pas encore (createNewMenuConfiguration appelle le hook
    // useToast, donc n'est exécutable que dans le rendu d'OpenSankeyApp). Le faire ici
    // plantait fromJSON (purgeSelection) et faisait basculer is_static → double
    // chargement du .gz + erreurs console captées en mode publish (#196).
    if (typeof newDataApp.publish_options.diagram === 'string') {
      newDataApp.file_name = newDataApp.publish_options.diagram
    }
    setDataApp(newDataApp)
  }, [])

  if (!dataApp) {
    return (
      <>
        <style>
          {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
        </style>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          fontFamily: 'Arial, sans-serif'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              border: '4px solid #f3f3f3',
              borderTop: '4px solid #3498db',
              borderRadius: '50%',
              width: '50px',
              height: '50px',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 20px'
            }}></div>
            <p>Chargement des données en cours...</p>
          </div>
        </div>
      </>
    )
  }

  // Rendre SankeyApp une fois que tout est chargé
  return <SankeyApp new_data_app={dataApp} />
}

const renderPage = () => {
  root.render(<App />)
}

renderPage()