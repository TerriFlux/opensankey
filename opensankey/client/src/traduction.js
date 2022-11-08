import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
// the translations
// (tip move them in a JSON file and import them,
// or even better, manage them separated from your code: https://react.i18next.com/guides/multiple-translation-files)
const resources = {
  en: {
    translation: {
      Menu:{
        'confSankey': 'Edition Sankey',
        'MEP':'Layout',
        'Noeuds':'Nodes',
        'EN':'Node Tags',
        'EdN':'Node Edition',
        'flux':'Link',
        'EF':'Link Tags',
        'ED':'Data Tags',
        'LL':'Free Label',
        'Leg':'Legends',
        'LegX':'Legend position X',
        'LegY':'Legend position Y',
        'LegWidth':'Width Legend',
        'Fichiers':'Files',
        'Edition':'Edition',
        'Formations':'Formations',
        'Exemples':'Examples',
        'Aide':'Help',

        'ouvrir':'Open',
        'enregistrer':'Save',
        'exporter':'Export',
        'preference':'Preférences',
        'reinit':'Reset',
        'pub':'Publish',
        'amp':'Apply Layout',
        'esn':'Edition Node Style',
        'esf':'Edition Link Style',
        'rc':'Keyboard Shortcut',
        'as':'Additional Help',
        'ca':'Pathway',
        'annuler':'Cancel',
        'pdd':'Publish/Update diagram',
        'fmep':'Layout File',
        'ad':'Apply disposition',
        'ns':'Name style'
    
      },
      MEP:{
        'Echelle':'Scale',
        'vp100':'value for 100px',
        'TCG':'Size grid square',
        'GV':'Grid visible',
        'AN':'Arrange Nodes',
        'EEN':'Gaps between Nodes',
        'Horizontal':'Horizontal',
        'Vertical':'Vertical',
        'PA':'Automatic positioning',
      },
      Tags:{
        'Nom':'Name',
        'Leg':'Legende',
        'tags':'Tags',
        'Bannière':'Banner',
        'Position':'Position',
        'Aucun':'None',
        'Unique':'Unique',
        'Multiple':'Multiple',
        'Visible':'Visible',
        'Couleur':'Color',
        'Forme':'Shape',
        'GE':'Tag Group',
        'selct':'Selected'

      },

      Noeud:{
        'Nom':'Name',
        'Style':'Style',
        'AS':'Apply Style',
        'TS':'Select all',
        apparence:{
          'apparence':'Appearence',
          'Visibilité':'Visibility',
          'Couleur':'Color',
          'Forme':'Shape',
          'Cercle':'Circle',
          'Rectangle':'Rectangle',
          'TML':'Width minimum',
          'TMH':'Height minimum',

          'asn':'Apply style to nodes'
            
        },
        labels:{
          'labels':'Labels',
          'vdb':'Label visibility',
          'pv':'Vertical position',
          'haut':'Top',
          'Milieu':'Middle',
          'Bas':'Bottom',
          'ph':'Horizontal position',
          'gauche':'Left',
          'droite':'rigth',
          'tp':'Police size',
          'police':'Police',
          'gras':'Bole',
          'maj':'Uppercase',
          'ita':'Italic',
          'cl':'Label box width',

          'vdv':'Value visibility ',

        },

        icon:{
          'icon':'Icon',
          'si':'Select icon',
          'couleur':'Color',
          'rIN':'Ratio Node/Icon',
          'Aucun':'None',
        },
        tags_node:{
          'tags':'Tags',
          'Appartenance':'Affiliation'
        },
        'IB':'Tooltip',
        agre:{
          'Agré':'Aggregations',
          'DC':'Cube dimensions',
          'Parent':'Parent',
          'CLE':'Copy childs links'
        },
        PF:{
          'PF':'Position link i/o',
          'FES':'Link input or output',
          'ent':'Input',
          'sort':'Output',
          'FRN':'Flow relation to the node',
          'g':'Left',
          'd':'Right',
          'ades':'Above',
          'edes':'Below',
          'lti':'Colored row for identification',
          'col':'Colored',
        }    
      },

      Flux:{
        'pdl':'Label police',
        'src':'Source',
        'trgt':'Target',
        'if':'Invert Link',
        'dzf':'Shift of link\'s z-index',
        'style':'Style',
        'as':'Apply Style',
        'asf':'Apply style to links',

        data:{
          'données':'Data',
          'vpp':'Value for parameter',
          'affichage':'Display'
        },
        apparence:{
          'apparence':'Appearence',
          'couleur':'Color',
          'grad':'Gradient',
          'hach':'Dashed',
          'of':'Orientation link',
          'pdc':'Center position',
          'eep':'Gap between handles',
          'type':'Type',
          'courbe':'Curve',
          'fleche':'Arrow',
          'recy':'Recycling',
          'courbure':'Curvature'
        },
        label:{
          'label':'Label',
          'len':'Black label',
          'lb':'White label',
          'lec':'Colored label',
          'acf':'Align label to link path',
          'pl':'Lateral position',
          'po':'Orthogonal position',
          'deb':'Start',
          'fin':'End',
          'dessous':'Above',
          'dessus':'Below',
          'pls':'Position the label with the mouse'
        }
      },
      LL:{
        'hl':'Label Height',
        'll':'Label Width',
        'ft':'Transparent Background',
        'cfl':'Background Color',
        'bt':'Transparent border',
        'cbl':'Border Color',
        'pvt':'Vertical  position',
        'at':'Texte alignment',
        'labels':'Labels',
        'gras':'Bold',
        'maj':'Uppercase',
        'ita':'Italic',
        'centre':'Centre'

      },
      Banner:{
        'fdf':'Link filtering',
        'fdn':'Node Filtering',
        'ndd':'Levels of detail',
        'sdd':'Data selection',
        'tl':'Download',
        'rslt':'Results',
        'ff':'Link filter',
        'filtre':'Filter',
        'fl':'Label filter',
        'fn':'Null Link',
        'visible':'Visible',
        'tooltipAdjust':'Readjust the drawing area to the screen size',
        'tooltipStructure':'Allows to display the structure of the diagram without proportion of the flows according to their value',
        'tooltipSelection':'Allows to drag the nodes',
        'tooltipHelp':'Additional information on the diagram',
        'tooltipAjoutNode':'Adds a node to the mouse click',
        'tooltipLiason':'Click then release between two existing nodes for linked with a stream',
      }
    }
  },
  //=======================================================
  //FR
  //=======================================================
  fr: {
    translation: {
      Menu:{
        'confSankey': 'Configuration Sankey',
        'MEP':'Mise en page',
        'Noeuds':'Noeuds',
        'EN':'Étiquettes Noeuds',
        'EdN':'Edition Noeuds',
        'flux':'Flux',
        'EF':'Étiquettes Flux',
        'ED':'Étiquettes Données',
        'LL':'Label Libres',
        'Leg':'Legendes',
        'LegX':'Légende X',
        'LegY':'Légende Y',
        'LegWidth':'Largeur Légende',
        'Fichiers':'Fichiers',
        'Edition':'Edition',
        'Formations':'Formations',
        'Exemples':'Exemples',
        'Aide':'Aide',

        'ouvrir':'Ouvrir',
        'enregistrer':'Enregistrer',
        'exporter':'Exporter',
        'preference':'Préférences',
        'reinit':'Réinitialiser',
        'pub':'Publier',
        'amp':'Appliquer mise en page',
        'esn':'Edition Style Noeud',
        'esf':'Edition Style Flux',
        'rc':'Raccourci Clavier',
        'as':'Aide Supplémentaire',
        'ca':'Chemin d\'accés',
        'annuler':'Annuler',
        'pdd':'Publication/Mise à jour du diagramme',
        'fmep':'Fichier de mise en page',
        'ad':'Appliquer Disposition',

        'ns':'Nom Style'
      },
      MEP:{
        'Echelle':'Echelle',
        'vp100':'valeur pour 100px',
        'TCG':'Taille Carré Grille',
        'GV':'Grille visible',
        'AN':'Arranger Noeuds',
        'EEN':'Ecart entre noeuds',
        'Horizontal':'Horizontal',
        'Vertical':'Vertical',
        'PA':'Positionnement automatique',
      },
      Tags:{
        'Nom':'Nom',
        'Leg':'Légende',
        'tags':'Étiquette',
        'Bannière':'Bannière',
        'Position':'Position',
        'Aucun':'Aucun',
        'Unique':'Unique',
        'Multiple':'Multiple',
        'Visible':'Visible',
        'Couleur':'Couleur',
        'Forme':'Forme',
        'GE':'Groupe d\'étiquettes',
        'selct':'Sélectionné'
      },
      Noeud:{
        'Nom':'Nom',
        'Style':'Style',
        'AS':'Appliquer Style',
        'TS':'Tout sélectionner',
        apparence:{
          'apparence':'Apparence',
          'Visibilité':'Visibilité',
          'Couleur':'Couleur',
          'Forme':'Forme',
          'Cercle':'Cercle',
          'Rectangle':'Rectangle',
          'TML':'Taille minimum Largeur',
          'TMH':'Taille minimum Hauteur',

          'asn':'Appliquer le style aux noeuds'
        },
        labels:{
          'labels':'Labels',
          'vdb':'Visibilité du label',
          'pv':'Position vertical',
          'haut':'Haut',
          'Milieu':'Milieu',
          'Bas':'Bas',
          'ph':'Position horizontal',
          'gauche':'Gauche',
          'droite':'Droite',
          'tp':'Taille police',
          'police':'Police',
          'gras':'Gras',
          'maj':'Majuscule',
          'ita':'Italique',
          'cl':'Coupure des labels',

          'vdv':'Visibilité de la valeur',

        },

        icon:{
          'icon':'Icon',
          'si':'Sélection Icon',
          'couleur':'Couleur',
          'rIN':'Ratio ICON/NOEUD',
          'Aucun':'Aucun',
        },
        tags_node:{
          'tags':'Étiquettes',
          'Appartenance':'Appartenance'
        },
        'IB':'Info-bulle',
        agre:{
          'Agré':'Agrégations',
          'DC':'Dimension du cube',
          'Parent':'Parent',
          'CLE':'Copier liens enfants'
        },
        PF:{
          'PF':'Position flux e/s',
          'FES':'Flux Entrant ou Sortant',
          'ent':'Entrant',
          'sort':'Sortant',
          'FRN':'Flux par rapport au noeud',
          'ades':'Au-Dessus',
          'edes':'En-Dessous',
          'lti':'Ligne tableau coloré pour identification',
          'col':'Coloré',
        }    
      },
      Flux:{
        'pdl':'Police des labels',
        'src':'Source',
        'trgt':'Cible',
        'if':'Inverse Flux',
        'dzf':'Déplacement z-index flux',
        'style':'Style',
        'as':'Appliquer Style',
        'asf':'Appliquer le Style aux flux',
        data:{
          'données':'Données',
          'vpp':'Valeur pour ces paramètres',
          'affichage':'Affichage'
        },
        apparence:{
          'apparence':'Appearence',
          'couleur':'Couleur',
          'grad':'Gradient',
          'hach':'Hachuré',
          'of':'Orientation flux',
          'pdc':'Position du centre',
          'eep':'Ecart entre poignées',
          'type':'Type',
          'courbe':'Courbe',
          'fleche':'Flèche',
          'recy':'Recyclage',
          'courbure':'Courbure'
        },
        label:{
          'label':'Label',
          'len':'Label en noir',
          'lb':'Label blanc',
          'lec':'Label en couleur',
          'acf':'Aligner avec le chemin du flux',
          'pl':'Position laterale',
          'po':'Position orthogonale',
          'deb':'Début',
          'fin':'Fin',
          'dessous':'Dessous',
          'dessus':'Dessus',
          'pls':'Positionner le label à la souris'
        }
      },
      LL:{
        'hl':'Hauteur Label',
        'll':'Largeur Label',
        'ft':'Fond transparent',
        'cfl':'Couleur Fond Label',
        'bt':'Bordure transparent',
        'cbl':'Couleur Bordure Label',
        'pvt':'Position vertical texte',
        'at':'Alignement texte',
        'labels':'Labels',
        'gras':'Gras',
        'maj':'Majuscule',
        'ita':'Italique',
        'centre':'Centre'
      },
      Banner:{
        'fdf':'Filtrage des flux',
        'fdn':'Filtrage des noeuds',
        'ndd':'Niveaux de détail',
        'sdd':'Sélection des données',
        'tl':'Téléchargements',
        'rslt':'Résultats',
        'ff':'Filtre Flux',
        'filtre':'Filtre',
        'fl':'Filtre Label',
        'fn':'Null Link',
        'visible':'Visible',
        'tooltipAdjust':'Permet de réajuster la zone de dessin à la taille de l\'écran',
        'tooltipStructure':'Permet d\'afficher la structure du diagramme sans proportion des flux selon leur valeur',
        'tooltipSelection':'Permet de drag les noeuds',
        'tooltipHelp':'Info supplementaires sur le diagramme',
        'tooltipAjoutNode':'Ajoute un noeud au click de la souris',
        'tooltipLiason':'Clické puis relacher entre deux noeuds existant pour les liés avec un flux',
      }
          
    }
  }
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next) // passes i18n down to react-i18next
  .init({
    resources,
    // lng: 'en', // language to use, more information here: https://www.i18next.com/overview/configuration-options#languages-namespaces-resources
    // you can use the i18n.changeLanguage function to change the language manually: https://www.i18next.com/overview/api#changelanguage
    // if you're using a language detector, do not define the lng option

    interpolation: {
      escapeValue: false // react already safes from xss
    }
  })

export default i18n