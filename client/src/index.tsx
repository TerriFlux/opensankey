import './deps/OpenSankey+/deps/OpenSankey/css/main.css'
import './deps/OpenSankey+/css/style_elements_sankey.css'
import './deps/OpenSankey+/css/react-quill.css'
import './css/Login.css'
import './css/Register.css'
import React, { FC, useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import './traductions/traduction'
import i18next from './traductions/traduction'
import { SankeyApp } from './AppSA'
import { Class_ApplicationDataSA } from './ApplicationDataSA'
import { loadUniversalJSON } from './deps/OpenSankey+/deps/OpenSankey/Persistence/UniversalJSONCompression'
import { Type_JSON } from './deps/OpenSankey+/deps/OpenSankey/types/Utils'
import { useTranslation } from 'react-i18next'

declare const window: Window &
  typeof globalThis & {
    sankey: {
      publish?: boolean
      diagram?: string
    }
  }

window.React = React
const browserLang = navigator.language.slice(0, 2)
const supportedLangs = ['fr', 'en', 'es', 'de', 'it']
i18next.changeLanguage(supportedLangs.includes(browserLang) ? browserLang : 'en')

const container = document.getElementById('react-container') as Element | DocumentFragment
const root = createRoot(container)



const App: FC = () => {
  const [dataApp, setDataApp] = useState<Class_ApplicationDataSA | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)

  const translation = useTranslation('translation', { useSuspense: false })
  useEffect(() => {
    const initializeApp = async () => {
      const newDataApp = new Class_ApplicationDataSA(!!window.sankey?.publish)
      newDataApp.t = translation.t
      newDataApp.i18n = translation.i18n
      if (window.sankey && window.sankey.diagram) {
        setIsLoading(true)

        // Afficher le toast d'attente
        newDataApp.sendWaitingToast(() => {
          console.log('Chargement du diagramme en cours...')
        })

        try {
          console.log(window.sankey.diagram)
          newDataApp.file_name = window.sankey.diagram

          const data = await loadUniversalJSON(window.sankey.diagram as string)
          newDataApp.fromJSON(data as Type_JSON)
          newDataApp.file_name = window.sankey.diagram as string

          setDataApp(newDataApp)
        } catch (error) {
          console.error('Erreur lors du chargement du JSON:', error)
          // Gérer l'erreur si nécessaire
          setDataApp(newDataApp) // Ou gérer différemment selon vos besoins
        } finally {
          setIsLoading(false)
        }
      } else {
        // Pas de diagramme à charger, initialiser directement
        setDataApp(newDataApp)
      }
    }

    initializeApp()
  }, [])

  if (isLoading || !dataApp) {
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