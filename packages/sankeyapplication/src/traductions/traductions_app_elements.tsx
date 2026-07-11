
// THE TRANSLATIONS
// (tip move them in a JSON file and import them,
// or even better, manage them separated from your code: https://react.i18next.com/guides/multiple-translation-files)
export const resources_app_elements = {
  //=======================================================
  //EN
  //=======================================================
  en: {
    translation: {
      'connect': 'LogIn',
      MEP: {
        onValidate: 'Don\'t forget to load the file',
        load_icon: 'Load an icon library (from icomoon)',
        'onBlurNoEnter': 'Exit editor to update the data',
        show_image: 'Show image',
      },
      Menu: {
        'LL': 'Text Area / Image Area',
        'view': 'View',
        'unit': 'Unitary Sankey',
        'afm': 'AFM',
        'afm_tools': 'Tools',
        'excel': 'Extract data',
        'pub': 'Publish',
        'setResolutionPNG': 'Select the desired export resolution',
        'setResolutionPDF': 'Select the desired export resolution',
        'sankeyPlusDisabled': 'Parameter disabled because you don\'t have OpenSankey+',
        'featureLocked': 'Locked',
        'featureBeta': 'Beta-test',

        'home': 'Master',
        'addView': 'Add',
        'updateView': 'Update',
        'precView': 'Prev.',
        'nextView': 'Next',

        'toBeautify': 'Beautify JSON file',
        'updateFOZdd': 'Update Foreign object on drawing area',

        'import_icon': 'Select icon',
        'import_icon_from_pack': 'Import icons from pack',
        'filter_by_name': 'Filter by name',

        'presentation_OS': 'OpenSankey is a web application that makes it easy to create Sankey diagrams.\n\n It\'s available free of charge and includes simple functions for creating nodes, flows, and labeling them to aggregate or filter their display on the diagram.\n\n The 15-node limit for use without an account can be lifted by creating a license-free account.\n\n',
        'presentation_OS_limit_node': 'The 15-node limit for use without an account can be lifted by creating a free account.\n\n',
        'presentation_OSP': 'OpenSankey+ is a paid license that unlocks new features for creating beautiful Sankey diagrams for presentations.\n\nThis license includes advanced formatting features such as the addition of illustrative images or icons for nodes, the addition of color gradients on flows and animations, and more.\n\n But above all, OpenSankey+ lets you generate slideshows to explain your Sankey diagrams, thanks to the "Views" mechanism, which records their visual states (with / without certain filters activated, for example) to simplify navigation between them.\n\n',
        'presentation_OSS': 'SankeySuite is a paid license that unlocks all the advanced charting and analysis features of Sankey.\n\n This license includes flow data reconciliation functionalities to identify inconsistencies or calculate flows whose values are not directly accessible.\n\n It also includes OpenSankey+ functionalities.\n\n',
        sankeytheque: 'Sankeytheque',
        afm_reconcil: 'MFA',
        afm_reconcil_excel: 'Reconciling an excel file',
        view_actual_file: 'Views',
        other_file: 'Other file',
        trade_close: 'Close to node',
        preference_content: {
          deletePalette: 'Delete palette',
          deleteColorPalette_tooltip: 'Delete selected color from palette',
          addColorPalette_tooltip: 'Add a color to the palette',
          color: 'Color',
          color_head: 'Create & edit color palette',
          color_item_1: '- Click on bottom button to add a palette',
          color_item_2: '- Click on the right button to add a color to the palette',
          color_item_3: '- Click on colored square to edit it\'s color',
          color_item_4: '- Right click on colored square to select it and click on the delete button next to palette title',

          tag: 'Tags',
          tag_head: 'Create & edit tags',
          tag_node: 'Node\'s tags',
          tag_flow: 'Flow\'s tags',
          tag_data: 'Data\'s tags',
          tag_item_1: '- Create & edit tags group that you can insert in current sankey',
          tag_item_2: '- To insert a tag\'s group : select a group in 3rd sub-section then click on insert',
          tag_item_3: '- If the group selected is already inserted in sankey you can still modify it for user & modify it in sankey by re-clicking on insert button',
          tag_head_insert: 'Group insertion',
          tag_insert: 'Insert',
          tag_insert_text: 'Select a group to insert :',

          style: 'Style',
          style_head: 'Create & edit style',
          style_edit_head_node_styles_visual: 'Edit visual node style',
          style_edit_head_node_styles_context: 'Edit label node style',
          style_edit_head_flow_styles_visual: 'Edit visual flow style',
          style_edit_head_flow_styles_context: 'Edit label flow style',
          style_edit_head: 'Edit node/flow style',
          style_insert_head: 'Insert in sankey',
          style_item_1: '- Create & edit style that you can insert in current sankey',
          style_item_2: '- To insert a style : select a style in 3rd sub-section then click on insert',
          style_item_3: '- If the style selected is already inserted in sankey you can still modify it for user & modify it in sankey by re-clicking on insert button',
          style_head_insert: 'Style insertion',
          style_insert: 'Insert style',
          style_update: 'Modify style',
          style_insert_text: 'Select a style to insert :',

          icon: 'Icon',
          icon_head: 'Icon\'s importation',
          icon_item_1: '- To import icons, click o, card Import then select a .svg file',
          icon_item_2: '- After importing an incon you can modify it\'s title by clicking on the text',

        },
        Transformation: {
          'amp_short': 'Trans.',
          'amp': 'Modify the layout',
          'amp_import': 'From another diagram',
          'amp_manuelle': 'Positioning',
          'trans_topo': 'Topological',
          'fmep': 'Other diagram',
          'ad': 'Apply',
          'undo': 'Undo',
          'Shortcuts': 'Selection shortcuts',
          'unSelectAll': 'None',
          'selectAll': 'All',
          'selectDefault': 'Default',
          'Topology': 'Additions and deletions',
          'Geometry': 'Sizes and positions',
          'Attribut': 'Attributes',
          'Tags': 'Tags',
          'Values': 'Flow values',
          'Views': 'Views',
          'freeLabels': 'Text areas',
          'addNode': 'Add Nodes',
          'removeNode': 'Remove Nodes',
          'addFlux': 'Add Flows',
          'removeFlux': 'Remove Flows',
          'PosNoeud': 'Nodes',
          'posFlux': 'Flows',
          'attrNode': 'Nodes',
          'attrFlux': 'Flows',
          'tagLevel': 'Detail levels',
          'tagNode': 'Nodes',
          'tagFlux': 'Flows',
          'tagData': 'Data',
          'tagNode_assign': 'Assign a tag',
          'tagFlux_assign': 'Assign a tag',
          'attrGeneral': 'Drawing area',
          'title': 'Transformations',
          'disabled_view': 'Impossible to import views into a view; to import them, go to the master data',
          'list_icon': 'Icon catalog',
          'list_icon_tooltip': 'Import icon list used in imported layout to the current data.'
        },
        tooltips: {
          publish: 'Publish online',
          export: 'Export as image',
          reconcil: 'Reconcile data',
          tool_afm: 'Use annex tools for reconciliation',
          view: 'Show/hide the view bar (create, navigate and manage views)',
          sankeytheque: 'Open the Sankey library: browse and load example diagrams',
        },
        xl_check: 'Excel checks',
        ter_gen: 'Gen. Supply-Use table'
      },

      Noeud: {
        'plns': 'Parameter for selected nodes',
        'img_visibility': 'Image visibility',
        'img_src': 'Source',
        'HL': 'Hyperlink',
        'open_HL': 'Open',
        'illustration': 'Illustration',
        'illustration_type': 'Illustration Type',
        tabs: {
          'icon': 'Icon',
          'fo': 'Illustration',
          'hl': 'Hyperlink'
        },
        apparence: {
          'HideAlone': 'Hide if intermediate',
          'toScale': 'Node out of scale',
          'Orientation': 'Orientation',
        },
        icon: {
          'icon': 'Icon',
          'Visibilité': 'Visibility of icons',
          'si': 'Select icon',
          'couleur': 'Color',
          'rIN': 'Size ratio icon/node',
          'Aucun': 'None',
          'icon_catalog': 'Select an icon from the catalog'
        },
        foreign_object: {
          'Visibilité': 'Visibility',
          'raw': 'Raw editor',
          'not_activated': 'Set visibility to activate'
        },
        FO: {
          'FO': 'Text',
          'content': 'Content',
          'submit': 'Submit',
          'cancel': 'Cancel'
        },
      },
      Flux: {
        'asf': 'Apply style to links having this style',
        data: {
          'scientificNotation': 'Display the value in scientific notation',
          'fla': 'Display free links',
          'astr': 'Display structure',
        },

      },
      UserNav: {
        'to_con': 'Sign in',
        'to_reg': 'Sign up',
        'to_buy': 'Sign up',
        'to_app': 'Back to the application',
        'to_acc': 'My account',
        'to_dbd': 'Dashboard',
        'to_dashboard': 'Dashboard',
        'to_logout': 'Log out',
        tooltip: {
          'to_con': 'Log in or create an account',
          'to_reg': 'Sign up',
          'to_buy': 'Sign up',
          'to_app': 'Back to the application',
          'to_acc': 'My account',
          'to_dbd': 'Dashboard',
          'to_dashboard': 'Open dashboard',
          'to_logout': 'Log out'
        }
      },
      Register: {
        presentation: {
          'title': 'Bring your diagrams to life with OpenSankey+',
          'text': '<table>\
                    <tr>\
                      <td>\
                        <p>\
                          <b>OpenSankey+ is a storytelling tool designed for those who wish to present flow data in a way that is both clear and visually appealing.\
                          <br><br>\
                          Precise, impactful, and beautiful: a Sankey diagram is worth a thousand words.</b>\
                        </p>\
                        <p>OpenSankey+ offers an enhanced version of the basic OpenSankey, enriched with a slideshow mode, ideal for presentations and storytelling.</p>\
                      </td>\
                      <td>\
                        <img src="https://terriflux.com/wp-content/uploads/2023/07/Tolkien.png" style="margin:20px">\
                      </td>\
                    </tr>\
                    <tr>\
                      <td>\
                        <p>Specifically, OpenSankey+ allows the creation of enriched diagrams with:</p>\
                        <ul style="padding-left: 1rem; ">\
                          <li>Floating labels to enhance the graphical representation</li>\
                          <li>Icons to illustrate nodes</li>\
                          <li>Gradient representations on flows</li>\
                          <li>Management of complex hierarchies</li>\
                          <li>Sankey animations with progressive appearance effects or a succession of “views” showing changes over time</li>\
                        </ul>\
                      </td>\
                      <td>\
                        <img src="https://terriflux.com/wp-content/uploads/2023/07/FiliereColza-980x359.jpg.webp" style="margin:20px">\
                      </td>\
                    </tr>\
                  </table>',
          'buy_opensankeyplus_monthly': 'For 50 euros a year, I want OpenSankey+ !',
          'buy_opensankeyplus_annual': 'For 300 euros a year, I want OpenSankey+ !',
          'choose_plan': 'Choose an OpenSankey+ license.'
        },
        account: {
          'title': 'First create your account',
          id: {
            'label': 'E-mail',
            'placeholder': 'E-mail is needed to create your account',
            'error': 'Please enter a valid e-mail address.'
          },
          pwd: {
            'label': 'Password',
            'placeholder': 'Choose a good password',
            'error': 'Password must have more than eight characters, with at least one letter, one number, and one special character.',
            'show': 'show',
            'hide': 'hide',
          },
          'fn': 'First Name',
          'ln': 'Last Name',
          msg: {
            'ok': 'Account created — you are now signed in. A confirmation email has been sent.',
            'err_captcha': 'Captcha is invalid',
            'err_email_invalid': 'Email is not valid',
            'err_email_exists': 'An account already exists with this e-mail',
            'nok': 'An error has occurred, could not create account.'
          },
          'btn_terms': 'Please read and accept the terms and conditions',
          'create_account': 'Sign up'
        },
        validation: {
          'title': 'Account validation',
          msg: {
            'ok': 'This account has been successfully validated.',
            'nok': 'Error, wrong link',
            'account_already_created': 'This account has already been validated',
            'redirect': 'You will be redirected to the license checkout page.',
          }
        }
      },
      terms_of_uses: {
        'title': 'Terms and conditions of use',
        'accept': 'Accept the terms and conditions of use'
      },
      Paiement: {
        'win_header_buy': 'Create and share Sankey diagrams like a pro.',
        'win_header_success': 'Thank you for your subscription to OpenSankey+',
        'win_header_error': 'Oops, something went wrong',
        'win_content_success': 'OpenSankey+ is now activated for your account.',
        'win_content_success_setpw': 'Your licence is active and your account has been created. We sent an email to {{email}} — follow the link inside to set your password and sign in (remember to check your spam folder).',
        'link_full_pricing': 'Full pricing & feature details on terriflux.com',
        'link_legal': 'Legal notice',
        'win_content_error': 'Something went wrong during the payment process',
        'btn_checkout': 'I want OpenSankey+ !'
      },
      Login: {
        'title': 'Connect to the application',
        'con': 'Login',
        id: {
          'label': 'E-mail',
          'placeholder': '',
          'error': 'Please enter a valid e-mail address.'
        },
        pwd: {
          'label': 'Password',
          'placeholder': '',
          'show': 'show',
          'hide': 'hide',
        },
        msg: {
          'ok': '',
          'err_server': 'An error occurred when calling the server',
          'err_login': 'Error, your e-mail or password is incorrect, please check your login information and try again',
        },
        forgot: {
          'title': 'Reset password',
          'ask': 'Password forgotten?',
          'sub': 'Reset',
          msg: {
            'ok': 'The password has been successfully reset.',
            'mail_sent': 'A password reset e-mail has been sent to you.',
            'err_server': 'An error occurred when calling the server',
            'err_user_already_connected': 'Error, you\'re already logged in.',
            'err_user_inexistant': 'Error, the given account does not exist',
            'err_token_expire': 'Error, the request has expired.'
          }
        }
      },
      UserPages: {
        login_modify: {
          'title': 'Your login details',
          'pwd': 'Change password',
          'del': 'Delete account',
          email_modal: {
            'title': 'Confirm e-mail modification with your password',
            'btn': 'Apply modification'
          },
          pwd_modal: {
            'title': 'Confirm password modification with the code received by e-mail',
            'input_token': 'Received code',
            'btn': 'Apply password modification'
          },
          del_modal: {
            'title': 'Do you really want to delete your account?',
            'desc': 'Warning: This action will delete your account, your data, and stop your OpenSankey+ subscription if present.',
            'fdback': 'Why do you want to delete your account? (optional)',
            'fdback_default': '-',
            'fdback_customer_service': 'Customer service was less than expected',
            'fdback_low_quality': 'Quality was less than expected',
            'fdback_missing_features': 'Some features are missing',
            'fdback_switched_service': 'I’m switching to a different service',
            'fdback_too_complex': 'Ease of use was less than expected',
            'fdback_too_expensive': 'It’s too expensive',
            'fdback_unused': 'I don’t use the service enough',
            'fdback_other': 'Other reason',
            'comment': 'How can we improve? (optional)',
            'pwd_confirm': 'Enter your password to confirm',
            'btn_confirm': 'Delete account and all data',
            'btn_cancel': 'I want to keep my account',
          },
          btns: {
            'set_email': 'Change E-mail',
            'set_pwd': 'Change password',
            'del_account': 'Delete account'
          },
          msgs: {
            'ok_email': 'E-mail has been successfully changed',
            'prs_email': 'Processing e-mail change',
            'err_email_regex': 'E-mail is not valid',
            'err_email_failed': 'The e-mail could not be modified',
            'ok_pwd': 'The password has been successfully changed',
            'prs_pwd': 'A password reset e-mail has been sent to you.',
            'err_pwd_failed': 'Password change request error',
            'ok_del': 'Account has been deleted. Returning to the main page.',
            'err_del': 'Account deletion request error. Please check your password.',
          },
        },
        infos_modify: {
          'title': 'Your personal information',
          btns: {
            'set_fn': 'Apply modification',
            'set_ln': 'Apply modification',
          },
          msgs: {
            'ok_firstname': 'First name has been successfully modified',
            'err_firstname': 'The first name modification could not be applied',
            'ok_lastname': 'The last name has been successfully modified',
            'err_lastname': 'The last name modification could not be applied',
          },
        },
        license: {
          'title': 'License information',
          'exp_until': 'Next renewal: ',
          btns: {
            'mng_sub': 'Manage subscription',
            'add_sub': 'Subscribe a licence',
          },
        },
        'OS+_lic': 'OpenSankey+ license',
        'SS_lic': 'SankeySuite license',
        'update_lic': 'Register new license number',
        'win_acc_infos': 'Account details',
        'win_db_template': 'Available templates',
        'db_desc_template': 'Template description',
        'usr_no_lic': 'No license currently registered',
        'usr_lic_validdate': 'Date of validity: ',
        'usr_lic_expdate': 'Expired on: ',
        'usr_lic_valid': 'Valid license',
        'usr_lic_invalid': 'Invalid license',
        'usr_lic_deactivated': 'License deactivated',
        'usr_lic_err': 'License number invalid',
        'err_get_user_infos': 'Error while trying to access the user\'s information',
        'err_get_OS+_infos': 'Error while trying to access the OpenSankey+ license server',
        'err_get_SS_infos': 'Error while trying to access the SankeySuite license server'
      },

      welcome: {
        news: 'What\'s new in this version',
        news_unavailable: 'Release notes are not available.',
        view: 'Buttons to navigate through the different views of the Sankey',
        features: 'Feature recap by licence',
        features_intro: 'This table summarises the features unlocked by each licence — OpenSankey+, SankeySuite (MFA) and developer access.',
        features_col_feature: 'Feature',
        features_col_plus: 'OpenSankey+',
        features_col_afm: 'SankeySuite',
        features_col_dev: 'Dev',
        breadcrumbs: {
          intro: 'Overview',
          features: 'Licence recap',
          news: 'Updates',
        },
        news_content: {
          230803: {
            main_title: 'August 03, 2023: New features',
            main_content: 'We added new features to make it easier to manipulate Sankey diagrams',
            sub_title_1: 'Right-click with many options',
            sub_content_1: 'From now on, a lot of actions on nodes, links, and even drawing areas are accessible by right-clicking on the concerned elements.',
            sub_title_2: 'Multiple selection frame',
            sub_content_2: 'Multiple selections of nodes can now be made with selection frames.',
            sub_title_3: 'Ease the expansion of your diagrams',
            sub_content_3: 'The drawing area can be expanded in any direction by dragging nodes/flows/text boxes/captions in the chosen direction.',
            image1: 'clic droit noeud EN.PNG',
            image2: 'clic droit flux EN.PNG',
            image3: 'clic droit fond EN.PNG',
            image4: 'Zone de selection.PNG'
          },
          230908: {
            main_title: 'September 08, 2023',
            main_content: 'Visual enhancement of configuration menu',
            sub_title_1: 'Visual redesign of the input in the configuration menu',
            sub_content_1: 'Configuration menu inputs have been reshaped with more visible labels and logos for buttons to better understand their usefulness.',
            sub_title_2: 'Data checkpoint',
            sub_content_2: 'At any time, you can make a quick backup of your current diagram. Once the backup is done, you can continue to develop your diagram and, if the changes made do not please you, reload the application to find your diagram at the time of backup.',
            img1: 'menu_config_enhanced_en.PNG',
            img2: 'menu_config_enhanced_zdd_en.PNG',
            img3: 'menu_last_save_en.PNG',
          }
        },
        caroussel: {
          Image0: 'Welcome to TerriFlux\'s toolsuite OpenSankey, OpenSankey+, and SankeySuite',
          Image1: 'Understand your flows, represent them with Sankey diagrams',
          Image2: 'Quickly import your data or draw your diagrams directly',
          Image3: 'Clarify the information represented',
          Image40: 'Give the necessary depth of understanding',
          Image41: 'Give the necessary depth to understanding',
          Image5: 'Create interactive & didactic infographics',
          Image6: 'Create interactive & didactic infographics',
          descr: {
            Image0: 'These tools make it easy to create flow diagrams',
            Image1: 'In this representation mode, the thickness of each arrow is proportional to the value of the flow it represents.',
            Image2: 'Create your diagrams from Excel spreadsheets or via the interactive drawing area.',
            Image3: 'Make your diagrams easy to read with integrated node, flow, and data labeling.',
            Image40: 'Aggregation levels allow you to represent your flows in several levels of detail.',
            Image41: 'Each level of detail can be directly selected to display only what is useful.',
            Image5: 'Explain your achievements simply with the automatic legend system and the addition of text boxes.',
            Image6: 'Create beautiful diagrams by directly integrating images or icons.'
          }
        }
      },
      'useSankeyThequeJSON': 'Open (json)',
      'useSankeyThequeEXCEL': 'Open (excel)',
      'dl': 'Download excel',
      'elements_sankey+_blocked': 'Blocked diagram elements (OpenSankey+)',
      'mfa_blocked': 'Blocked diagram elements (MFASankey)',
      'elements_sankey+_blocked_long': 'Some Sankey elements are not visible because they come from OpenSankey+ and your account does not have this module',
      'elements_mfa_blocked_long': 'Some Sankey elements are not visible because they come from MFASankey and your account does not have this module',
    },
  },
  //=======================================================
  //FR
  //=======================================================
  fr: {
    translation: {
      'connect': 'Connexion',
      MEP: {
        onValidate: 'Pensez à ouvrir le fichier',
        'onBlurNoEnter': 'quitter la zone d\'édition pour mettre à jour sur la zone de dessin',
        show_image: 'Image',
      },
      Menu: {
        'diagramme': 'Diagrammes',
        'LL': 'Édition d\'objets',
        'view': 'Vues',
        'unit': 'Sankey Unitaire',
        'afm': 'AFM',
        'afm_tools': 'Outils',
        'excel': 'Extraire données',
        'pub': 'Publier',
        'setResolutionPNG': 'Choisissez la résolution désirée pour l\'exportation',
        'setResolutionPDF': 'Choisissez la résolution désirée pour l\'exportation',
        'sankeyPlusDisabled': 'Paramètre désactivé car vous n\'avez pas OpenSankey+',
        'featureLocked': 'Licence',

        'home': 'Maître',
        'addView': 'Ajout',
        'updateView': 'M-à-j',
        'precView': 'Préc.',
        'nextView': 'Suiv.',

        'toBeautify': 'Embellir le fichier JSON',

        'updateFOZdd': 'Mettre à jour sur la zone de dessin',

        'import_icon': 'Sélection d\'une icône',
        'import_icon_from_pack': 'Importer le groupe d\'icône',
        'filter_by_name': 'Filtrer par nom ',

        'presentation_OS': 'OpenSankey et une application web qui permet de réaliser simplement des diagrammes de Sankey.\n\nCelle-ci est accessible gratuitement, et inclut les fonctionnalités simples de création de nœuds, de flux et leur étiquetage afin d\'agréger ou de filtrer leur affichage sur le diagramme.\n\n',
        'presentation_OS_limit_node': 'La création d\'un compte gratuit permet de lever la limitation de 15 nœuds fixée pour un usage sans compte.\n\n',
        'presentation_OSP': 'OpenSankey+ est une licence payante qui permet de débloquer de nouvelles fonctionnalités pour la réalisation de beaux diagrammes de Sankey pour des présentations.\n\n Cette licence inclut des fonctionnalités de mise en forme avancées comme l\'ajout d\'images ou d\'icônes illustratifs pour les noeuds, l\'ajout de gradients de couleurs sur les flux et d\'animations, etc.\n\n Mais surtout, OpenSankey+ permet de générer des diaporamas explicatifs de vos diagrammes de Sankey grâce au mécanisme des "Vues", qui enregistre les états visuel de celui-ci (avec / sans certains filtres activés par exemple) pour simplifier la navigation entre eux.\n\n',
        'presentation_OSS': 'SankeySuite est une licence payante qui permet de débloquer toutes les usages avancés de réalisation et d\'analyse des diagrammes de Sankey.\n\nCette licence inclut les fonctionnalités de réconciliation des données de flux afin de relever des incohérences ou de calculer des flux dont les valeurs ne sont pas accessibles directement.\n\n Elle inclut aussi les fonctionnalités de OpenSankey+.\n\n',
        sankeytheque: 'Sankeythèque',
        afm_reconcil: 'AFM',
        afm_reconcil_excel: 'Réconcilier un fichier Excel',
        view_actual_file: 'Vues',
        other_file: 'Autre fichier',
        trade_close: 'Près du noeud',

        preference_content: {
          deletePalette: 'Supprimer la palette',
          deleteColorPalette_tooltip: 'Supprime les couleurs sélectionnées de la palette',
          addColorPalette_tooltip: 'Ajoute une couleur à la palette',
          color: 'Couleur',
          color_head: 'Création & édition de palette de couleur',
          color_item_1: '- Pour créer une palette, cliquez sur le bouton du bas',
          color_item_2: '- Pour ajouter une couleur à la palette, cliquez sur le bouton à droite du titre de la palette',
          color_item_3: '- Pour éditer une couleur de la palette, cliquez sur un carré de la palette',
          color_item_4: '- Pour supprimer une couleur, sélectionnez avec un clique droit sur les couleurs que vous souhaitez supprimer puis cliquez sur le boutton de suppression',

          tag: 'Étiquettes',
          tag_node: 'Étiquettes de noeuds',
          tag_flow: 'Étiquettes de flux',
          tag_data: 'Étiquettes de données',
          tag_head: 'Création, édition et insertion de groupes d\'étiquettes',
          tag_item_1: '- Créer et éditer des groupes d\'étiquettes que vous pourrez ensuite insérer dans chaque sankey que vous faites',
          tag_item_2: '- Pour insérer un groupe d\'étiquette dans le sankey, sélectionnez le groupe souhaité dans le 3ème sous-menu puis cliquez sur insérer',
          tag_item_3: '- Si le groupe sélectionné est déjà présent dans le sankey il est possible de le modifier en cliquant sur le même bouton que pour l\'insérer',
          tag_head_insert: 'Insertion du groupe',
          tag_insert: 'Insérer',
          tag_insert_text: 'Sélectionner un groupe d\'étiquette que vous voulez insérer dans l\'application :',

          style: 'Style',
          style_head: 'Création, édition et insertion de style',
          style_edit_head_node_styles_visual: 'Édition du style visuel de noeuds',
          style_edit_head_node_styles_context: 'Édition du style des libellés de noeuds',
          style_edit_head_flow_styles_visual: 'Édition du style visuel de flux',
          style_edit_head_flow_styles_context: 'Édition du style des libellés de flux',
          style_edit_head: 'Édition de style de noeuds ou flux',
          style_insert_head: 'Insertion de style dans l\'application',
          style_item_1: '- Créer et éditer des styles que vous pourrez ensuite insérer dans chaque sankey que vous faites',
          style_item_2: '- Pour insérer un style dans le sankey, sélectionnez le style souhaité dans le 3ème sous-menu puis cliquez sur insérer',
          style_item_3: '- Si le style sélectionné est déjà présent dans le sankey il est possible de le modifier en cliquant sur le même bouton que pour l\'insérer',
          style_head_insert: 'Insertion du style',
          style_insert: 'Insérer style',
          style_update: 'Modifier style',
          style_insert_text: 'Sélectionner un style que voulez insérer/modifier dans l\'application :',

          icon: 'Icône',
          icon_head: 'Importation des icônes',
          icon_item_1: '- Pour importer des icônes cliquez sur la carte Importer puis sélectionner les fichiers .svg que vous voulez importer',
          icon_item_2: '- Après avoir importé une icône, vous pouvez modifier son titre en cliquant dessus',

        },

        Transformation: {
          'disabled_view': 'Impossible d\'importer des vues dans une vue. Pour le faire, positionnez-vous sur le diagramme de Sankey maître.',
          'list_icon': 'Catalogue d\'icône',
          'list_icon_tooltip': 'Importe la liste des icônes utilisées dans les données importées vers les données actuelles.'
        },

        tooltips: {

          'PrevViewButton': 'Charge la vue précédente',
          'NextViewButton': 'Charge la vue suivante',
          'saveView': 'Sauvegarder localement dans le navigateur (mémoire cache)',
          'home': 'Retourne aux données maître',
          'buttonCreateView': 'Sur les données maîtres: crée une vue / sur une vue: clone la vue',
          'buttonCloneView': 'Copie la vue actuelle en une nouvelle vue indépendante de l\'original ',
          'buttonImportView': 'Importe un diagramme dans cette vue (remplace la vue diagramme actuelle)',
          'buttonExportView': 'Exporte la vue actuelle en tant que donnée de diagramme',
          publish: 'Mettre en ligne',
          export: 'Exporter comme une image',
          reconcil: 'Réconcilier les données',
          tool_afm: 'Utiliser des outils annexes à la réconciliation',
          view: 'Afficher/masquer la barre des vues (créer, naviguer et gérer les vues)',
          sankeytheque: 'Ouvrir la Sankeythèque : parcourir et charger des diagrammes d\'exemple',
        },
        xl_check: 'Vérif. excel',
        featureBeta: 'Experimental',
        ter_gen: 'Génération T.E.R'
      },

      Noeud: {
        'plns': 'Paramètres pour les noeuds sélectionnés',
        'img_visibility': 'Visibilité de l\'image',
        'img_src': 'Source',
        'HL': 'Hyperlien',
        'open_HL': 'Ouvrir',
        'illustration': 'Illustration',
        'illustration_type': 'Type d\'illustration',
        tabs: {
          'icon': 'Icône',
          'fo': 'Illustration',
          'hl': 'Hyperlien'
        },
        apparence: {
          'HideAlone': 'Masquer si intermédiaire',
          'toScale': 'Hors échelle',
          'Orientation': 'Orientation',
        },
        icon: {
          'icon': 'Icône',
          'Visibilité': 'Visibilité des icônes',
          'si': 'Sélectionner l\'icône',
          'couleur': 'Couleur',
          'rIN': 'Ratio taille icône/noeud',
          'Aucun': 'Aucun',
          'icon_catalog': 'Catalogue d\'icône'
        },
        foreign_object: {
          'Visibilité': 'Contenu enrichi',
          'raw': 'Editeur brut',
          'not_activated': 'Pour activer l\'editeur, activer la visibilité'
        },
        FO: {
          'FO': 'Texte',
          'content': 'Contenu',
          'submit': 'Ok',
          'cancel': 'Annuler'
        },
      },
      Flux: {
        'asf': 'Appliquer le Style aux flux',
        data: {
          'scientificNotation': 'En notation scientifique',
          'fla': 'Flux nuls indéterminés visibles',
          'astr': 'Affichage structure',
        },
      },
      UserNav: {
        'to_con': 'Connectez vous',
        'to_reg': 'Créez un compte',
        'to_buy': 'Créez un compte',
        'to_app': 'Retour à l\'application',
        'to_acc': 'Mon compte',
        'to_dbd': 'Dashboard',
        'to_dashboard': 'Dashboard',
        'to_logout': 'Déconnexion',
        tooltip: {
          'to_con': 'Connectez vous',
          'to_reg': 'Créez un compte',
          'to_buy': 'Créez un compte',
          'to_app': 'Retour à l\'application',
          'to_acc': 'Mon compte',
          'to_dbd': 'Dashboard',
          'to_dashboard': 'Ouvrir le dashboard',
          'to_logout': 'Se déconnecter'
        }
      },
      Register: {
        presentation: {
          'title': 'Donnez vie à vos diagrammes avec OpenSankey+',
          'text': '<table><tr><td><p><b>OpenSankey+ est un outil de storytelling conçu pour ceux qui souhaitent présenter des données de flux de manière à la fois claire et visuellement attrayante.\
          <br><br>Juste, parlant et beau : un Sankey vaut mille mots.</b></p>\
          <p>OpenSankey+ propose une version d’OpenSankey de base enrichie avec un mode diaporama, idéale pour les présentations et le storytelling.</p></td>\
          <td><img src="https://terriflux.com/wp-content/uploads/2023/07/Tolkien.png" style="margin:20px"></td></tr>\
          <tr><td><p>Concrètement, OpenSankey+ permet de créer des diagrammes enrichis avec des :</p>\
          <ul style="padding-left: 1rem; ">\
          <li>Labels flottants pour agrémenter la représentation graphique</li>\
          <li>Icônes pour illustrer les nœuds</li>\
          <li>Représentations de gradients sur les flux</li>\
          <li>Gestions de hiérarchies complexes</li>\
          <li>Animations des Sankey par des effets d’apparence progressive ou par une succession de « vues » montrant des évolutions</li></ul></td>\
          <td><img src="https://terriflux.com/wp-content/uploads/2023/07/FiliereColza-980x359.jpg.webp" style="margin:20px"></td><tr></table>\
          ',
          'buy_opensankeyplus_monthly': '50 euros mensuel',
          'buy_opensankeyplus_annual': '300 euros annuel',
          'choose_plan': 'Choisissez une license OpenSankey+.',
          'trial_month': 'Un mois d\'essai en utilisant le code WELCOME'
        },
        account: {
          'title': 'Créer un compte',
          id: {
            'label': 'E-mail',
            'placeholder': 'Veuillez saisir votre e-mail',
            'error': 'L\'adresse e-mail n\'est pas valide'
          },
          pwd: {
            'label': 'Mot de passe',
            'placeholder': 'Choisissez un bon mot de passe',
            'error': 'Le mot de passe doit comporter plus de huit caractères, dont au moins une lettre, un chiffre et un caractère spécial',
            'show': 'montrer',
            'hide': 'cacher',
          },
          'fn': 'Prénom',
          'ln': 'Nom',
          msg: {
            'ok': 'Compte créé — vous êtes maintenant connecté. Un e-mail de confirmation vous a été envoyé.',
            'nok': 'Une erreur s\'est produite. Le compte n\'a pas pu être créé',
            'err_captcha': 'Le captcha n\'est pas valide',
            'err_email_invalid': 'L\'adresse e-mail fournie n\'est pas valide',
            'err_email_exists': 'Un compte existe déjà avec cette adresse e-mail',
          },
          'btn_terms': 'Lire et accepter les conditions d\'utilisation',
          'create_account': 'Créer le compte'
        },
        validation: {
          'title': 'Validation du compte',
          msg: {
            'ok': 'Ce compte a été validé avec succés.',
            'nok': 'Erreur, lien corrompu',
            'account_already_created': 'Ce compte a déjà été validé.',
            'redirect': 'Vous allez être redirigé vers la page de souscription.',
          },
        }
      },
      terms_of_uses: {
        'title': 'Conditions d\'utilisation',
        'accept': 'Accepter les conditions d\'utilisation'
      },
      Paiement: {
        'win_header_buy': 'Acheter OpenSankey+',
        'win_header_success': 'Merci d\'avoir choisi OpenSankey+',
        'win_header_error': 'Oups, le paiement n\'a pas abouti',
        'win_content_buy': 'Créez et partagez vos diagrammes de Sankey comme un pro.',
        'win_content_success': 'Les fonctionnalités d\'OpenSankey+ sont maintenant activées pour votre compte.',
        'win_content_success_setpw': 'Votre licence est active et votre compte a été créé. Un email a été envoyé à {{email}} : suivez le lien pour définir votre mot de passe et vous connecter (pensez à vérifier vos spams).',
        'link_full_pricing': 'Détail des offres et tarifs sur terriflux.com',
        'link_legal': 'Mentions légales',
        'win_content_error': 'Quelque chose s\'est mal passé pendant le processus de paiement.',
        'btn_checkout': 'Je veux OpenSankey+ !'
      },
      osplus_presentation: {
        'title': 'Licence OpenSankey+',
        'text': 'osplus_presentation_fr.html'
      },
      Login: {
        'title': 'Se connecter à l\'application',
        'con': 'Connexion',
        id: {
          'label': 'E-mail',
          'placeholder': '',
          'error': 'L\'adresse e-mail n\'est pas valide'
        },
        pwd: {
          'label': 'Mot de passe',
          'placeholder': '',
          'show': 'montrer',
          'hide': 'cacher',
        },
        msg: {
          'ok': '',
          'err_server': 'Une erreur est survenue lors de l\'appel au serveur',
          'err_login': 'Erreur, votre e-mail ou mot de passe est incorrect, veuillez vérifier vos informations de connexion et réessayer',
        },
        forgot: {
          'title': 'Reinitialiser le mot de passe',
          'ask': 'Mot de passe oublié ?',
          'sub': 'Réinitialiser',
          msg: {
            'ok': 'Le mot de passe a été remplacé avec succès.',
            'mail_sent': 'Un e-mail de réinitialisation du mot de passe vous a été envoyé.',
            'err_server': 'Une erreur est survenue lors de l\'appel au serveur',
            'err_user_already_connected': 'Erreur, vous êtes déjà connecté.',
            'err_user_inexistant': 'Erreur, ce compte n\'existe pas.',
            'err_token_expire': 'Erreur, la demande a expiré.'
          }
        }
      },
      UserPages: {
        login_modify: {
          'title': 'Vos identifiants de connexion',
          'pwd': 'Changer mot de passe',
          'del': 'Supprimer le compte',
          email_modal: {
            'title': 'Confirmer la modification de l\'e-mail avec votre mot de passe',
            'btn': 'Appliquer la modification'
          },
          pwd_modal: {
            'title': 'Confirmer la modification du mot de passe avec le code reçu par e-mail',
            'input_token': 'Code reçu',
            'btn': 'Appliquer la modification'
          },
          del_modal: {
            'title': 'Souhaitez-vous vraiment supprimer votre compte ?',
            'desc': 'Attention : Cette action supprimera votre compte, vos données et stoppera votre abonnement à OpenSankey+ si présent.',
            'fdback': 'Pourquoi souhaitez vous supprimer votre compte ? (optionel)',
            'fdback_default': '-',
            'fdback_customer_service': 'Le service client n\'est pas satisfaisant',
            'fdback_low_quality': 'La qualité du logiciel n\'est pas satifaisante',
            'fdback_missing_features': 'Il manque certaines fonctionnalités',
            'fdback_switched_service': 'Je préfère une autre solution',
            'fdback_too_complex': 'Le logiciel est trop compliqué à utiliser',
            'fdback_too_expensive': 'Le logiciel est trop cher',
            'fdback_unused': 'Je ne l\'utilise pas',
            'fdback_other': 'Autre raison',
            'comment': 'Comment pourrions-nous nous améliorer ? (optionnel)',
            'pwd_confirm': 'Saissisez votre mot de passe pour confirmer',
            'btn_confirm': 'Supprimer le compte et toutes les données',
            'btn_cancel': 'Je souhaite garder mon compte',
          },
          btns: {
            'set_email': 'Modifier l\'e-mail',
            'set_pwd': 'Modifier le mot de passe',
            'del_account': 'Supprimer le compte'
          },
          msgs: {
            'ok_email': 'L\'e-mail a été modifié avec succès',
            'prs_email': 'Traitement du changement d\'e-mail',
            'err_email_regex': 'L\'e-mail n\'est pas valide',
            'err_email_failed': 'L\'e-mail n\'a pas pu être modifié',
            'ok_pwd': 'Le mot de passe a été modifié avec succes.',
            'prs_pwd': 'Un e-mail avec un code pour la modification du mot de passe vous a été envoyé.',
            'err_pwd_failed': 'Erreur sur la demande de modification de mot de passe.',
            'ok_del': 'Le compte a été supprimé. Retour à la page principale.',
            'err_del': 'Erreur sur la demande de suppression de compte. Veuillez verifier votre mot passe.',
          },
        },
        infos_modify: {
          'title': 'Vos informations personnelles',
          btns: {
            'set_fn': 'Appliquer modification',
            'set_ln': 'Appliquer modification',
          },
          msgs: {
            'ok_firstname': 'Le prénom a été modifié avec succes',
            'err_firstname': 'Le prénom choisi ne peut pas être appliqué',
            'ok_lastname': 'Le nom a été modifié avec succes',
            'err_lastname': 'Le nom choisi ne peut pas être appliqué',
          },
        },
        license: {
          'title': 'Votre licence',
          'exp_until': 'Prochain renouvellement : ',
          btns: {
            'mng_sub': 'Gérer l\'abonnement',
            'add_sub': 'Prendre une licence',
          },
        },
        'OS+_lic': 'Licence OpenSankey+',
        'SS_lic': 'Licence SankeySuite',
        'update_lic': 'Enregistrer',
        'win_acc_infos': 'Informations du compte',
        'win_db_template': 'Modèles proposés',
        'db_desc_template': 'Description du modèle',
        'usr_no_lic': 'Pas de licence enregistrée',
        'usr_lic_validdate': 'Date de validité : ',
        'usr_lic_expdate': 'Expirée depuis le : ',
        'usr_lic_valid': 'Licence valide',
        'usr_lic_invalid': 'Licence non valide',
        'usr_lic_deactivated': 'Licence desactivée',
        'usr_lic_err': 'Erreur numéro licence',
        'err_get_user_infos': 'Erreur lors de l\'accès aux données de l\'utilisateur',
        'err_get_OS+_infos': 'Erreur lors de l\'accès au serveur de licences OpenSankey+',
        'err_get_SS_infos': 'Erreur lors de l\'accès au serveur de licences SankeySuite'
      },
      welcome: {
        news: 'Nouveautés et Améliorations récentes',
        news_unavailable: 'Les notes de version ne sont pas disponibles.',
        view: 'Boutons permettant de naviguer entre les différentes vues du diagramme',
        features: 'Récapitulatif des fonctionnalités par licence',
        features_intro: 'Ce tableau récapitule les fonctionnalités débloquées par chacune des licences — OpenSankey+, SankeySuite (AFM) et accès développeur.',
        features_col_feature: 'Fonctionnalité',
        features_col_plus: 'OpenSankey+',
        features_col_afm: 'SankeySuite',
        features_col_dev: 'Dev',
        breadcrumbs: {
          features: 'Récap licences',
          news: 'Nouveautés',
        },
        news_content: {
          230803: {
            main_title: '03 Août 2023 : Nouvelles fonctionnalités',
            main_content: 'Pleins de nouvelles fonctionnalités pour faciliter la manipulation des diagrammes de Sankey',
            sub_title_1: 'Ajout d\'un clic droit avec options d\'édition',
            sub_content_1: 'Désormais, un certain nombre d\'options sur les noeuds, flux et zone de dessin sont accessible par clic droit sur les éléments concernés.',
            sub_title_2: 'Ajout d\'un cadre de selection multiple',
            sub_content_2: 'La selection multiple de noeuds peut maintenant se faire avec cadre de sélection.',
            sub_title_3: 'Possibilité d\'agrandir la zone de dessin',
            sub_content_3: 'La zone de dessin devient extensible dans toutes les directions en glissant les noeuds / flux / zones de texte / légende dans la direction choisie',
            image1: 'clic droit noeud.PNG',
            image2: 'clic droit flux.PNG',
            image3: 'clic droit fond.PNG',
            image4: 'Zone de selection.PNG'
          },
          230908: {
            main_title: '08 Septembre 2023 ',
            main_content: 'Amélioration graphique des menu de configuration',
            sub_title_1: 'Refonte visuel des inputs dans les menu de configuration',
            sub_content_1: 'Les inputs du menu de configuration ont été remis en formes avec des labels plus visibles et des logos pour les boutons afin de mieux comprendre leur utilité',
            sub_title_2: 'Point de contrôle des données',
            sub_content_2: 'A tous moment vous pouvez faire une sauvegarde rapide de votre diagramme en cours, une fois la sauvegarde faite vous pouvez continuer de développer votre diagramme et si les modifications faites ne vous plaise pas, recharchez l\'application pour retrouver votre diagramme au moment de la sauvegarde ',
            img1: 'menu_config_enhanced_fr.PNG',
            img2: 'menu_config_enhanced_zdd_fr.PNG',
            img3: 'menu_last_save_fr.PNG',
          }
        },
        caroussel: {
          Image0: 'Bienvenue sur la suite d\'outils OpenSankey, OpenSankey+ et SankeySuite de TerriFlux',
          Image1: 'Comprenez vos flux, Représentez les avec des diagrammes de Sankey',
          Image2: 'Importez rapidement vos données ou tracez directement vos diagrammes',
          Image3: 'Clarifiez l\'information représentée',
          Image40: 'Donnez la profondeur nécessaire à la compréhension',
          Image41: 'Donnez la profondeur nécessaire à la compréhension',
          Image5: 'Créez de véritables infographies didactiques',
          Image6: 'Créez de véritables infographies didactiques',
          descr: {
            Image0: 'Ces outils vous permettent de réaliser simplement des diagrammes de flux',
            Image1: 'Dans ce mode de réprésentation, l\'épaisseur de chaque flèche est proportionnelle à la valeur du flux qu\'elle représente.',
            Image2: 'Créez vos diagrammes à partir de tableurs Excel ou via l\'espace de dessin interactif',
            Image3: 'Facilitez la lecture de vos diagrammes grâce au système intégré d\'étiquetage des noeuds, des flux et des données',
            Image40: 'Les niveaux d\'agregations permettent de representer vos flux suivant plusieurs niveaux de détails',
            Image41: 'Chaque niveau de détails peut être individuellement selectionnés pour afficher seulement ce qui est utile',
            Image5: 'Expliquez simplement vos réalisations avec le système de légende automatique et l\'ajout de zones de texte',
            Image6: 'Créez de beaux diagrammes en y intégrant directement des images ou des icônes'
          }
        }
      },
      'useSankeyThequeJSON': 'Ouvrir (json)',
      'useSankeyThequeEXCEL': 'Ouvrir (excel)',
      'dl': 'Télécharger (excel)',
      'elements_sankey+_blocked': 'Elements du diagrame bloqués (OpenSankey+)',
      'elements_mfa_blocked': 'Elements du diagrame bloqués (MFASankey+)',
      'elements_sankey+_blocked_long': 'Certains éléments du Sankey ne sont pas visible car ils proviennent de OpenSankey+ et votre compte ne possède pas ce module',
      'elements_mfa_blocked_long': 'Certains éléments du Sankey ne sont pas visible car ils proviennent de MFASankey et votre compte ne possède pas ce module',
    },
  },
  //=======================================================
  //ES
  //=======================================================
  es: {
    translation: {
      'connect': 'Conexión',
      MEP: {
        onValidate: 'No olvide cargar el archivo',
        load_icon: 'Cargar una biblioteca de iconos (desde icomoon)',
        'onBlurNoEnter': 'Salga del editor para actualizar los datos',
        show_image: 'Mostrar imagen',
      },
      Menu: {
        'LL': 'Zona de texto / Zona de imagen',
        'view': 'Vistas',
        'unit': 'Sankey Unitario',
        'afm': 'AFM',
        'afm_tools': 'Herramientas',
        'excel': 'Extraer datos',
        'pub': 'Publicar',
        'setResolutionPNG': 'Seleccione la resolución deseada para la exportación',
        'setResolutionPDF': 'Seleccione la resolución deseada para la exportación',
        'sankeyPlusDisabled': 'Parámetro desactivado porque no tiene OpenSankey+',
        'featureLocked': 'Licencia',
        'featureBeta': 'Experimental',

        'home': 'Maestro',
        'addView': 'Añadir',
        'updateView': 'Actualizar',
        'precView': 'Ant.',
        'nextView': 'Sig.',

        'toBeautify': 'Embellecer archivo JSON',
        'updateFOZdd': 'Actualizar en el área de dibujo',

        'import_icon': 'Seleccionar icono',
        'import_icon_from_pack': 'Importar grupo de iconos',
        'filter_by_name': 'Filtrar por nombre',

        'presentation_OS': 'OpenSankey es una aplicación web que permite crear fácilmente diagramas de Sankey.\n\nEstá disponible de forma gratuita e incluye funciones simples para crear nodos, flujos y etiquetarlos para agregar o filtrar su visualización en el diagrama.\n\n',
        'presentation_OS_limit_node': 'El límite de 15 nodos para el uso sin cuenta puede eliminarse creando una cuenta gratuita.\n\n',
        'presentation_OSP': 'OpenSankey+ es una licencia de pago que desbloquea nuevas funcionalidades para crear hermosos diagramas de Sankey para presentaciones.\n\nEsta licencia incluye funciones avanzadas de formato como la adición de imágenes o iconos ilustrativos para nodos, gradientes de color en los flujos y animaciones, etc.\n\nSobre todo, OpenSankey+ permite generar presentaciones explicativas de sus diagramas de Sankey gracias al mecanismo de "Vistas", que registra los estados visuales del mismo (con/sin ciertos filtros activados, por ejemplo) para simplificar la navegación entre ellos.\n\n',
        'presentation_OSS': 'SankeySuite es una licencia de pago que desbloquea todos los usos avanzados de creación y análisis de diagramas de Sankey.\n\nEsta licencia incluye funcionalidades de reconciliación de datos de flujo para identificar inconsistencias o calcular flujos cuyos valores no son directamente accesibles.\n\nTambién incluye las funcionalidades de OpenSankey+.\n\n',
        sankeytheque: 'Sankeytheque',
        afm_reconcil: 'AFM',
        afm_reconcil_excel: 'Reconciliar un archivo Excel',
        view_actual_file: 'Vistas',
        other_file: 'Otro archivo',
        trade_close: 'Cerca del nodo',

        preference_content: {
          deletePalette: 'Eliminar paleta',
          deleteColorPalette_tooltip: 'Eliminar el color seleccionado de la paleta',
          addColorPalette_tooltip: 'Añadir un color a la paleta',
          color: 'Color',
          color_head: 'Crear y editar paleta de colores',
          color_item_1: '- Haga clic en el botón inferior para crear una paleta',
          color_item_2: '- Haga clic en el botón de la derecha para añadir un color a la paleta',
          color_item_3: '- Haga clic en un cuadrado de color para editarlo',
          color_item_4: '- Haga clic derecho en los colores que desea eliminar y luego haga clic en el botón de eliminación',

          tag: 'Etiquetas',
          tag_head: 'Crear y editar etiquetas',
          tag_node: 'Etiquetas de nodos',
          tag_flow: 'Etiquetas de flujos',
          tag_data: 'Etiquetas de datos',
          tag_item_1: '- Crear y editar grupos de etiquetas que puede insertar en cada Sankey que realice',
          tag_item_2: '- Para insertar un grupo de etiquetas: seleccione un grupo en la 3ª subsección y haga clic en insertar',
          tag_item_3: '- Si el grupo seleccionado ya está insertado en el Sankey, puede modificarlo haciendo clic de nuevo en el botón de inserción',
          tag_head_insert: 'Inserción del grupo',
          tag_insert: 'Insertar',
          tag_insert_text: 'Seleccione un grupo para insertar:',

          style: 'Estilo',
          style_head: 'Crear y editar estilo',
          style_edit_head_node_styles_visual: 'Editar estilo visual de nodos',
          style_edit_head_node_styles_context: 'Editar estilo de etiquetas de nodos',
          style_edit_head_flow_styles_visual: 'Editar estilo visual de flujos',
          style_edit_head_flow_styles_context: 'Editar estilo de etiquetas de flujos',
          style_edit_head: 'Editar estilo de nodos/flujos',
          style_insert_head: 'Insertar en el Sankey',
          style_item_1: '- Crear y editar estilos que puede insertar en cada Sankey que realice',
          style_item_2: '- Para insertar un estilo: seleccione un estilo en la 3ª subsección y haga clic en insertar',
          style_item_3: '- Si el estilo seleccionado ya está insertado en el Sankey, puede modificarlo haciendo clic de nuevo en el botón de inserción',
          style_head_insert: 'Inserción del estilo',
          style_insert: 'Insertar estilo',
          style_update: 'Modificar estilo',
          style_insert_text: 'Seleccione un estilo para insertar:',

          icon: 'Icono',
          icon_head: 'Importación de iconos',
          icon_item_1: '- Para importar iconos, haga clic en la tarjeta Importar y seleccione un archivo .svg',
          icon_item_2: '- Después de importar un icono, puede modificar su título haciendo clic en el texto',
        },
        Transformation: {
          'amp_short': 'Trans.',
          'amp': 'Modificar el diseño',
          'amp_import': 'Desde otro diagrama',
          'amp_manuelle': 'Posicionamiento',
          'trans_topo': 'Topológico',
          'fmep': 'Otro diagrama',
          'ad': 'Aplicar',
          'undo': 'Deshacer',
          'Shortcuts': 'Atajos de selección',
          'unSelectAll': 'Ninguno',
          'selectAll': 'Todos',
          'selectDefault': 'Por defecto',
          'Topology': 'Adiciones y eliminaciones',
          'Geometry': 'Tamaños y posiciones',
          'Attribut': 'Atributos',
          'Tags': 'Etiquetas',
          'Values': 'Valores de flujos',
          'Views': 'Vistas',
          'freeLabels': 'Zonas de texto',
          'addNode': 'Añadir nodos',
          'removeNode': 'Eliminar nodos',
          'addFlux': 'Añadir flujos',
          'removeFlux': 'Eliminar flujos',
          'PosNoeud': 'Nodos',
          'posFlux': 'Flujos',
          'attrNode': 'Nodos',
          'attrFlux': 'Flujos',
          'tagLevel': 'Niveles de detalle',
          'tagNode': 'Nodos',
          'tagFlux': 'Flujos',
          'tagData': 'Datos',
          'tagNode_assign': 'Asignar una etiqueta',
          'tagFlux_assign': 'Asignar una etiqueta',
          'attrGeneral': 'Área de dibujo',
          'title': 'Transformaciones',
          'disabled_view': 'No es posible importar vistas en una vista; para hacerlo, vaya a los datos maestros',
          'list_icon': 'Catálogo de iconos',
          'list_icon_tooltip': 'Importar la lista de iconos utilizados en el diseño importado a los datos actuales.'
        },
        tooltips: {
          publish: 'Publicar en línea',
          export: 'Exportar como imagen',
          reconcil: 'Reconciliar datos',
          tool_afm: 'Usar herramientas auxiliares para la reconciliación',
          view: 'Mostrar/ocultar la barra de vistas (crear, navegar y gestionar vistas)',
          sankeytheque: 'Abrir la Sankeyteca: explorar y cargar diagramas de ejemplo',
        },
        xl_check: 'Verif. Excel',
        ter_gen: 'Gen. tabla oferta-utilización'
      },

      Noeud: {
        'plns': 'Parámetros para los nodos seleccionados',
        'img_visibility': 'Visibilidad de la imagen',
        'img_src': 'Fuente',
        'HL': 'Hipervínculo',
        'open_HL': 'Abrir',
        'illustration': 'Ilustración',
        'illustration_type': 'Tipo de ilustración',
        tabs: {
          'icon': 'Icono',
          'fo': 'Ilustración',
          'hl': 'Hipervínculo'
        },
        apparence: {
          'HideAlone': 'Ocultar si es intermedio',
          'toScale': 'Nodo fuera de escala',
          'Orientation': 'Orientación',
        },
        icon: {
          'icon': 'Icono',
          'Visibilité': 'Visibilidad de iconos',
          'si': 'Seleccionar icono',
          'couleur': 'Color',
          'rIN': 'Relación tamaño icono/nodo',
          'Aucun': 'Ninguno',
          'icon_catalog': 'Seleccionar un icono del catálogo'
        },
        foreign_object: {
          'Visibilité': 'Visibilidad',
          'raw': 'Editor sin formato',
          'not_activated': 'Active la visibilidad para activar'
        },
        FO: {
          'FO': 'Texto',
          'content': 'Contenido',
          'submit': 'Enviar',
          'cancel': 'Cancelar'
        },
      },
      Flux: {
        'asf': 'Aplicar estilo a los flujos con este estilo',
        data: {
          'scientificNotation': 'Mostrar el valor en notación científica',
          'fla': 'Mostrar flujos libres',
          'astr': 'Mostrar estructura',
        },
      },
      UserNav: {
        'to_con': 'Iniciar sesión',
        'to_reg': 'Registrarse',
        'to_buy': 'Registrarse',
        'to_app': 'Volver a la aplicación',
        'to_acc': 'Mi cuenta',
        'to_dbd': 'Panel de control',
        'to_dashboard': 'Panel de control',
        'to_logout': 'Cerrar sesión',
        tooltip: {
          'to_con': 'Iniciar sesión o crear una cuenta',
          'to_reg': 'Registrarse',
          'to_buy': 'Registrarse',
          'to_app': 'Volver a la aplicación',
          'to_acc': 'Mi cuenta',
          'to_dbd': 'Panel de control',
          'to_dashboard': 'Abrir panel de control',
          'to_logout': 'Cerrar sesión'
        }
      },
      Register: {
        presentation: {
          'title': 'Dé vida a sus diagramas con OpenSankey+',
          'text': '<table>\
                    <tr>\
                      <td>\
                        <p>\
                          <b>OpenSankey+ es una herramienta de storytelling diseñada para quienes desean presentar datos de flujo de manera clara y visualmente atractiva.\
                          <br><br>\
                          Preciso, impactante y hermoso: un Sankey vale más que mil palabras.</b>\
                        </p>\
                        <p>OpenSankey+ ofrece una versión mejorada de OpenSankey básico, enriquecida con un modo de presentación, ideal para presentaciones y storytelling.</p>\
                      </td>\
                      <td>\
                        <img src="https://terriflux.com/wp-content/uploads/2023/07/Tolkien.png" style="margin:20px">\
                      </td>\
                    </tr>\
                    <tr>\
                      <td>\
                        <p>En concreto, OpenSankey+ permite crear diagramas enriquecidos con:</p>\
                        <ul style="padding-left: 1rem; ">\
                          <li>Etiquetas flotantes para mejorar la representación gráfica</li>\
                          <li>Iconos para ilustrar los nodos</li>\
                          <li>Representaciones de gradientes en los flujos</li>\
                          <li>Gestión de jerarquías complejas</li>\
                          <li>Animaciones de Sankey con efectos de aparición progresiva o una sucesión de "vistas" que muestran cambios a lo largo del tiempo</li>\
                        </ul>\
                      </td>\
                      <td>\
                        <img src="https://terriflux.com/wp-content/uploads/2023/07/FiliereColza-980x359.jpg.webp" style="margin:20px">\
                      </td>\
                    </tr>\
                  </table>',
          'buy_opensankeyplus_monthly': 'Por 50 euros al año, ¡quiero OpenSankey+!',
          'buy_opensankeyplus_annual': 'Por 300 euros al año, ¡quiero OpenSankey+!',
          'choose_plan': 'Elija una licencia OpenSankey+.'
        },
        account: {
          'title': 'Primero cree su cuenta',
          id: {
            'label': 'E-mail',
            'placeholder': 'Se necesita un e-mail para crear su cuenta',
            'error': 'Por favor, introduzca una dirección de e-mail válida.'
          },
          pwd: {
            'label': 'Contraseña',
            'placeholder': 'Elija una buena contraseña',
            'error': 'La contraseña debe tener más de ocho caracteres, con al menos una letra, un número y un carácter especial.',
            'show': 'mostrar',
            'hide': 'ocultar',
          },
          'fn': 'Nombre',
          'ln': 'Apellido',
          msg: {
            'ok': 'Cuenta creada — ya has iniciado sesión. Te hemos enviado un e-mail de confirmación.',
            'err_captcha': 'El captcha no es válido',
            'err_email_invalid': 'El e-mail no es válido',
            'err_email_exists': 'Ya existe una cuenta con este e-mail',
            'nok': 'Se ha producido un error, no se pudo crear la cuenta.'
          },
          'btn_terms': 'Lea y acepte los términos y condiciones',
          'create_account': 'Registrarse'
        },
        validation: {
          'title': 'Validación de la cuenta',
          msg: {
            'ok': 'Esta cuenta ha sido validada con éxito.',
            'nok': 'Error, enlace incorrecto',
            'account_already_created': 'Esta cuenta ya ha sido validada',
            'redirect': 'Será redirigido a la página de pago de la licencia.',
          }
        }
      },
      terms_of_uses: {
        'title': 'Términos y condiciones de uso',
        'accept': 'Aceptar los términos y condiciones de uso'
      },
      Paiement: {
        'win_header_buy': 'Cree y comparta diagramas de Sankey como un profesional.',
        'win_header_success': 'Gracias por su suscripción a OpenSankey+',
        'win_header_error': 'Ups, algo salió mal',
        'win_content_success': 'OpenSankey+ está ahora activado para su cuenta.',
        'win_content_success_setpw': 'Su licencia está activa y su cuenta ha sido creada. Hemos enviado un correo a {{email}}: siga el enlace para definir su contraseña e iniciar sesión (revise su carpeta de spam).',
        'link_full_pricing': 'Detalle de ofertas y precios en terriflux.com',
        'link_legal': 'Aviso legal',
        'win_content_error': 'Algo salió mal durante el proceso de pago',
        'btn_checkout': '¡Quiero OpenSankey+!'
      },
      Login: {
        'title': 'Conectarse a la aplicación',
        'con': 'Iniciar sesión',
        id: {
          'label': 'E-mail',
          'placeholder': '',
          'error': 'Por favor, introduzca una dirección de e-mail válida.'
        },
        pwd: {
          'label': 'Contraseña',
          'placeholder': '',
          'show': 'mostrar',
          'hide': 'ocultar',
        },
        msg: {
          'ok': '',
          'err_server': 'Se ha producido un error al llamar al servidor',
          'err_login': 'Error, su e-mail o contraseña es incorrecto, por favor verifique sus datos de conexión e inténtelo de nuevo',
        },
        forgot: {
          'title': 'Restablecer contraseña',
          'ask': '¿Contraseña olvidada?',
          'sub': 'Restablecer',
          msg: {
            'ok': 'La contraseña se ha restablecido con éxito.',
            'mail_sent': 'Se le ha enviado un e-mail de restablecimiento de contraseña.',
            'err_server': 'Se ha producido un error al llamar al servidor',
            'err_user_already_connected': 'Error, ya está conectado.',
            'err_user_inexistant': 'Error, la cuenta indicada no existe',
            'err_token_expire': 'Error, la solicitud ha expirado.'
          }
        }
      },
      UserPages: {
        login_modify: {
          'title': 'Sus datos de conexión',
          'pwd': 'Cambiar contraseña',
          'del': 'Eliminar cuenta',
          email_modal: {
            'title': 'Confirme la modificación del e-mail con su contraseña',
            'btn': 'Aplicar modificación'
          },
          pwd_modal: {
            'title': 'Confirme la modificación de la contraseña con el código recibido por e-mail',
            'input_token': 'Código recibido',
            'btn': 'Aplicar modificación de contraseña'
          },
          del_modal: {
            'title': '¿Realmente desea eliminar su cuenta?',
            'desc': 'Atención: Esta acción eliminará su cuenta, sus datos y cancelará su suscripción a OpenSankey+ si la tiene.',
            'fdback': '¿Por qué desea eliminar su cuenta? (opcional)',
            'fdback_default': '-',
            'fdback_customer_service': 'El servicio al cliente no cumplió las expectativas',
            'fdback_low_quality': 'La calidad no cumplió las expectativas',
            'fdback_missing_features': 'Faltan algunas funcionalidades',
            'fdback_switched_service': 'Estoy cambiando a otro servicio',
            'fdback_too_complex': 'La facilidad de uso no cumplió las expectativas',
            'fdback_too_expensive': 'Es demasiado caro',
            'fdback_unused': 'No uso el servicio lo suficiente',
            'fdback_other': 'Otra razón',
            'comment': '¿Cómo podemos mejorar? (opcional)',
            'pwd_confirm': 'Introduzca su contraseña para confirmar',
            'btn_confirm': 'Eliminar cuenta y todos los datos',
            'btn_cancel': 'Quiero mantener mi cuenta',
          },
          btns: {
            'set_email': 'Cambiar e-mail',
            'set_pwd': 'Cambiar contraseña',
            'del_account': 'Eliminar cuenta'
          },
          msgs: {
            'ok_email': 'El e-mail se ha cambiado con éxito',
            'prs_email': 'Procesando el cambio de e-mail',
            'err_email_regex': 'El e-mail no es válido',
            'err_email_failed': 'No se pudo modificar el e-mail',
            'ok_pwd': 'La contraseña se ha cambiado con éxito',
            'prs_pwd': 'Se le ha enviado un e-mail de restablecimiento de contraseña.',
            'err_pwd_failed': 'Error en la solicitud de cambio de contraseña',
            'ok_del': 'La cuenta ha sido eliminada. Volviendo a la página principal.',
            'err_del': 'Error en la solicitud de eliminación de cuenta. Por favor, verifique su contraseña.',
          },
        },
        infos_modify: {
          'title': 'Su información personal',
          btns: {
            'set_fn': 'Aplicar modificación',
            'set_ln': 'Aplicar modificación',
          },
          msgs: {
            'ok_firstname': 'El nombre se ha modificado con éxito',
            'err_firstname': 'No se pudo aplicar la modificación del nombre',
            'ok_lastname': 'El apellido se ha modificado con éxito',
            'err_lastname': 'No se pudo aplicar la modificación del apellido',
          },
        },
        license: {
          'title': 'Información de licencia',
          'exp_until': 'Próxima renovación: ',
          btns: {
            'mng_sub': 'Gestionar suscripción',
            'add_sub': 'Suscribirse a una licencia',
          },
        },
        'OS+_lic': 'Licencia OpenSankey+',
        'SS_lic': 'Licencia SankeySuite',
        'update_lic': 'Registrar nuevo número de licencia',
        'win_acc_infos': 'Detalles de la cuenta',
        'win_db_template': 'Plantillas disponibles',
        'db_desc_template': 'Descripción de la plantilla',
        'usr_no_lic': 'No hay licencia registrada actualmente',
        'usr_lic_validdate': 'Fecha de validez: ',
        'usr_lic_expdate': 'Expirada el: ',
        'usr_lic_valid': 'Licencia válida',
        'usr_lic_invalid': 'Licencia no válida',
        'usr_lic_deactivated': 'Licencia desactivada',
        'usr_lic_err': 'Número de licencia no válido',
        'err_get_user_infos': 'Error al intentar acceder a la información del usuario',
        'err_get_OS+_infos': 'Error al intentar acceder al servidor de licencias OpenSankey+',
        'err_get_SS_infos': 'Error al intentar acceder al servidor de licencias SankeySuite'
      },

      welcome: {
        news: 'Novedades de esta versión',
        news_unavailable: 'Las notas de la versión no están disponibles.',
        view: 'Botones para navegar entre las diferentes vistas del Sankey',
        features: 'Resumen de funcionalidades por licencia',
        features_intro: 'Esta tabla resume las funcionalidades habilitadas por cada licencia — OpenSankey+, SankeySuite (MFA) y acceso desarrollador.',
        features_col_feature: 'Funcionalidad',
        features_col_plus: 'OpenSankey+',
        features_col_afm: 'SankeySuite',
        features_col_dev: 'Dev',
        breadcrumbs: {
          intro: 'Resumen',
          features: 'Resumen licencias',
          news: 'Novedades',
        },
        news_content: {
          230803: {
            main_title: '3 de agosto de 2023: Nuevas funcionalidades',
            main_content: 'Hemos añadido nuevas funcionalidades para facilitar la manipulación de diagramas de Sankey',
            sub_title_1: 'Clic derecho con muchas opciones',
            sub_content_1: 'A partir de ahora, muchas acciones sobre nodos, flujos e incluso el área de dibujo son accesibles haciendo clic derecho en los elementos correspondientes.',
            sub_title_2: 'Marco de selección múltiple',
            sub_content_2: 'La selección múltiple de nodos ahora se puede hacer con marcos de selección.',
            sub_title_3: 'Facilitar la expansión de sus diagramas',
            sub_content_3: 'El área de dibujo se puede ampliar en cualquier dirección arrastrando nodos/flujos/zonas de texto/leyendas en la dirección elegida.',
            image1: 'clic droit noeud EN.PNG',
            image2: 'clic droit flux EN.PNG',
            image3: 'clic droit fond EN.PNG',
            image4: 'Zone de selection.PNG'
          },
          230908: {
            main_title: '8 de septiembre de 2023',
            main_content: 'Mejora visual del menú de configuración',
            sub_title_1: 'Rediseño visual de las entradas en el menú de configuración',
            sub_content_1: 'Las entradas del menú de configuración se han rediseñado con etiquetas más visibles y logos para los botones para comprender mejor su utilidad.',
            sub_title_2: 'Punto de control de datos',
            sub_content_2: 'En cualquier momento, puede hacer una copia de seguridad rápida de su diagrama actual. Una vez hecha la copia, puede continuar desarrollando su diagrama y, si los cambios realizados no le satisfacen, recargar la aplicación para recuperar su diagrama en el momento de la copia de seguridad.',
            img1: 'menu_config_enhanced_en.PNG',
            img2: 'menu_config_enhanced_zdd_en.PNG',
            img3: 'menu_last_save_en.PNG',
          }
        },
        caroussel: {
          Image0: 'Bienvenido a la suite de herramientas OpenSankey, OpenSankey+ y SankeySuite de TerriFlux',
          Image1: 'Comprenda sus flujos, represéntelos con diagramas de Sankey',
          Image2: 'Importe rápidamente sus datos o dibuje directamente sus diagramas',
          Image3: 'Clarifique la información representada',
          Image40: 'Dé la profundidad necesaria a la comprensión',
          Image41: 'Dé la profundidad necesaria a la comprensión',
          Image5: 'Cree infografías interactivas y didácticas',
          Image6: 'Cree infografías interactivas y didácticas',
          descr: {
            Image0: 'Estas herramientas permiten crear fácilmente diagramas de flujo',
            Image1: 'En este modo de representación, el grosor de cada flecha es proporcional al valor del flujo que representa.',
            Image2: 'Cree sus diagramas a partir de hojas de cálculo Excel o mediante el área de dibujo interactiva.',
            Image3: 'Facilite la lectura de sus diagramas gracias al sistema integrado de etiquetado de nodos, flujos y datos.',
            Image40: 'Los niveles de agregación permiten representar sus flujos en varios niveles de detalle.',
            Image41: 'Cada nivel de detalle se puede seleccionar directamente para mostrar solo lo que es útil.',
            Image5: 'Explique sus logros simplemente con el sistema de leyenda automática y la adición de zonas de texto.',
            Image6: 'Cree hermosos diagramas integrando directamente imágenes o iconos.'
          }
        }
      },
      'useSankeyThequeJSON': 'Abrir (json)',
      'useSankeyThequeEXCEL': 'Abrir (excel)',
      'dl': 'Descargar Excel',
      'elements_sankey+_blocked': 'Elementos del diagrama bloqueados (OpenSankey+)',
      'mfa_blocked': 'Elementos del diagrama bloqueados (MFASankey)',
      'elements_sankey+_blocked_long': 'Algunos elementos del Sankey no son visibles porque provienen de OpenSankey+ y su cuenta no tiene este módulo',
      'elements_mfa_blocked_long': 'Algunos elementos del Sankey no son visibles porque provienen de MFASankey y su cuenta no tiene este módulo',
    },
  },
  //=======================================================
  //DE
  //=======================================================
  de: {
    translation: {
      'connect': 'Anmelden',
      MEP: {
        onValidate: 'Vergessen Sie nicht, die Datei zu laden',
        load_icon: 'Eine Symbolbibliothek laden (von icomoon)',
        'onBlurNoEnter': 'Editor verlassen, um die Daten zu aktualisieren',
        show_image: 'Bild anzeigen',
      },
      Menu: {
        'LL': 'Textbereich / Bildbereich',
        'view': 'Ansichten',
        'unit': 'Unitäres Sankey',
        'afm': 'AFM',
        'afm_tools': 'Werkzeuge',
        'excel': 'Daten extrahieren',
        'pub': 'Veröffentlichen',
        'setResolutionPNG': 'Wählen Sie die gewünschte Exportauflösung',
        'setResolutionPDF': 'Wählen Sie die gewünschte Exportauflösung',
        'sankeyPlusDisabled': 'Parameter deaktiviert, da Sie OpenSankey+ nicht besitzen',
        'featureLocked': 'Lizenz',
        'featureBeta': 'Experimentell',

        'home': 'Master',
        'addView': 'Hinzufügen',
        'updateView': 'Aktualisieren',
        'precView': 'Vorh.',
        'nextView': 'Nächste',

        'toBeautify': 'JSON-Datei verschönern',
        'updateFOZdd': 'Auf der Zeichenfläche aktualisieren',

        'import_icon': 'Symbol auswählen',
        'import_icon_from_pack': 'Symbolpaket importieren',
        'filter_by_name': 'Nach Name filtern',

        'presentation_OS': 'OpenSankey ist eine Webanwendung, mit der Sie einfach Sankey-Diagramme erstellen können.\n\nSie ist kostenlos verfügbar und enthält einfache Funktionen zum Erstellen von Knoten, Flüssen und deren Beschriftung, um ihre Anzeige im Diagramm zu aggregieren oder zu filtern.\n\n',
        'presentation_OS_limit_node': 'Die Begrenzung auf 15 Knoten für die Nutzung ohne Konto kann durch die Erstellung eines kostenlosen Kontos aufgehoben werden.\n\n',
        'presentation_OSP': 'OpenSankey+ ist eine kostenpflichtige Lizenz, die neue Funktionen für die Erstellung schöner Sankey-Diagramme für Präsentationen freischaltet.\n\nDiese Lizenz umfasst erweiterte Formatierungsfunktionen wie das Hinzufügen von illustrativen Bildern oder Symbolen für Knoten, Farbverläufe auf Flüssen und Animationen usw.\n\nVor allem ermöglicht OpenSankey+ die Erstellung von erklärenden Präsentationen Ihrer Sankey-Diagramme dank des "Ansichten"-Mechanismus, der die visuellen Zustände aufzeichnet (mit/ohne bestimmte aktivierte Filter, zum Beispiel), um die Navigation zwischen ihnen zu vereinfachen.\n\n',
        'presentation_OSS': 'SankeySuite ist eine kostenpflichtige Lizenz, die alle fortgeschrittenen Erstellungs- und Analysefunktionen von Sankey-Diagrammen freischaltet.\n\nDiese Lizenz umfasst Funktionen zur Abstimmung von Flussdaten, um Inkonsistenzen zu erkennen oder Flüsse zu berechnen, deren Werte nicht direkt zugänglich sind.\n\nSie enthält auch die Funktionen von OpenSankey+.\n\n',
        sankeytheque: 'Sankeytheque',
        afm_reconcil: 'AFM',
        afm_reconcil_excel: 'Eine Excel-Datei abstimmen',
        view_actual_file: 'Ansichten',
        other_file: 'Andere Datei',
        trade_close: 'Nahe am Knoten',

        preference_content: {
          deletePalette: 'Palette löschen',
          deleteColorPalette_tooltip: 'Ausgewählte Farbe aus der Palette löschen',
          addColorPalette_tooltip: 'Eine Farbe zur Palette hinzufügen',
          color: 'Farbe',
          color_head: 'Farbpalette erstellen und bearbeiten',
          color_item_1: '- Klicken Sie auf die untere Schaltfläche, um eine Palette zu erstellen',
          color_item_2: '- Klicken Sie auf die rechte Schaltfläche, um eine Farbe zur Palette hinzuzufügen',
          color_item_3: '- Klicken Sie auf ein farbiges Quadrat, um es zu bearbeiten',
          color_item_4: '- Klicken Sie mit der rechten Maustaste auf die Farben, die Sie löschen möchten, und klicken Sie dann auf die Schaltfläche Löschen',

          tag: 'Tags',
          tag_head: 'Tags erstellen und bearbeiten',
          tag_node: 'Knoten-Tags',
          tag_flow: 'Fluss-Tags',
          tag_data: 'Daten-Tags',
          tag_item_1: '- Tag-Gruppen erstellen und bearbeiten, die Sie in jedes Sankey einfügen können',
          tag_item_2: '- Um eine Tag-Gruppe einzufügen: wählen Sie eine Gruppe im 3. Unterabschnitt und klicken Sie auf Einfügen',
          tag_item_3: '- Wenn die ausgewählte Gruppe bereits im Sankey eingefügt ist, können Sie sie durch erneutes Klicken auf die Einfüge-Schaltfläche ändern',
          tag_head_insert: 'Gruppeneinfügung',
          tag_insert: 'Einfügen',
          tag_insert_text: 'Wählen Sie eine Gruppe zum Einfügen:',

          style: 'Stil',
          style_head: 'Stil erstellen und bearbeiten',
          style_edit_head_node_styles_visual: 'Visuellen Knotenstil bearbeiten',
          style_edit_head_node_styles_context: 'Beschriftungsstil der Knoten bearbeiten',
          style_edit_head_flow_styles_visual: 'Visuellen Flussstil bearbeiten',
          style_edit_head_flow_styles_context: 'Beschriftungsstil der Flüsse bearbeiten',
          style_edit_head: 'Knoten-/Flussstil bearbeiten',
          style_insert_head: 'In Sankey einfügen',
          style_item_1: '- Stile erstellen und bearbeiten, die Sie in jedes Sankey einfügen können',
          style_item_2: '- Um einen Stil einzufügen: wählen Sie einen Stil im 3. Unterabschnitt und klicken Sie auf Einfügen',
          style_item_3: '- Wenn der ausgewählte Stil bereits im Sankey eingefügt ist, können Sie ihn durch erneutes Klicken auf die Einfüge-Schaltfläche ändern',
          style_head_insert: 'Stileinfügung',
          style_insert: 'Stil einfügen',
          style_update: 'Stil ändern',
          style_insert_text: 'Wählen Sie einen Stil zum Einfügen:',

          icon: 'Symbol',
          icon_head: 'Symbol-Import',
          icon_item_1: '- Um Symbole zu importieren, klicken Sie auf die Karte Importieren und wählen Sie eine .svg-Datei',
          icon_item_2: '- Nach dem Import eines Symbols können Sie seinen Titel durch Klicken auf den Text ändern',
        },
        Transformation: {
          'amp_short': 'Trans.',
          'amp': 'Layout ändern',
          'amp_import': 'Von einem anderen Diagramm',
          'amp_manuelle': 'Positionierung',
          'trans_topo': 'Topologisch',
          'fmep': 'Anderes Diagramm',
          'ad': 'Anwenden',
          'undo': 'Rückgängig',
          'Shortcuts': 'Auswahlkürzel',
          'unSelectAll': 'Keine',
          'selectAll': 'Alle',
          'selectDefault': 'Standard',
          'Topology': 'Hinzufügungen und Löschungen',
          'Geometry': 'Größen und Positionen',
          'Attribut': 'Attribute',
          'Tags': 'Tags',
          'Values': 'Flusswerte',
          'Views': 'Ansichten',
          'freeLabels': 'Textbereiche',
          'addNode': 'Knoten hinzufügen',
          'removeNode': 'Knoten entfernen',
          'addFlux': 'Flüsse hinzufügen',
          'removeFlux': 'Flüsse entfernen',
          'PosNoeud': 'Knoten',
          'posFlux': 'Flüsse',
          'attrNode': 'Knoten',
          'attrFlux': 'Flüsse',
          'tagLevel': 'Detailstufen',
          'tagNode': 'Knoten',
          'tagFlux': 'Flüsse',
          'tagData': 'Daten',
          'tagNode_assign': 'Ein Tag zuweisen',
          'tagFlux_assign': 'Ein Tag zuweisen',
          'attrGeneral': 'Zeichenfläche',
          'title': 'Transformationen',
          'disabled_view': 'Es ist nicht möglich, Ansichten in eine Ansicht zu importieren; gehen Sie dazu zu den Masterdaten',
          'list_icon': 'Symbolkatalog',
          'list_icon_tooltip': 'Symbolliste aus dem importierten Layout in die aktuellen Daten importieren.'
        },
        tooltips: {
          publish: 'Online veröffentlichen',
          export: 'Als Bild exportieren',
          reconcil: 'Daten abstimmen',
          tool_afm: 'Hilfswerkzeuge für die Abstimmung verwenden',
          view: 'Ansichtsleiste ein-/ausblenden (Ansichten erstellen, navigieren und verwalten)',
          sankeytheque: 'Sankey-Bibliothek öffnen: Beispieldiagramme durchsuchen und laden',
        },
        xl_check: 'Excel-Prüfung',
        ter_gen: 'Aufkommens-Verwendungs-Tabelle generieren'
      },

      Noeud: {
        'plns': 'Parameter für ausgewählte Knoten',
        'img_visibility': 'Bildsichtbarkeit',
        'img_src': 'Quelle',
        'HL': 'Hyperlink',
        'open_HL': 'Öffnen',
        'illustration': 'Illustration',
        'illustration_type': 'Illustrationstyp',
        tabs: {
          'icon': 'Symbol',
          'fo': 'Illustration',
          'hl': 'Hyperlink'
        },
        apparence: {
          'HideAlone': 'Ausblenden, wenn Zwischenknoten',
          'toScale': 'Knoten nicht maßstabsgetreu',
          'Orientation': 'Orientierung',
        },
        icon: {
          'icon': 'Symbol',
          'Visibilité': 'Sichtbarkeit der Symbole',
          'si': 'Symbol auswählen',
          'couleur': 'Farbe',
          'rIN': 'Größenverhältnis Symbol/Knoten',
          'Aucun': 'Keines',
          'icon_catalog': 'Ein Symbol aus dem Katalog auswählen'
        },
        foreign_object: {
          'Visibilité': 'Sichtbarkeit',
          'raw': 'Roh-Editor',
          'not_activated': 'Sichtbarkeit aktivieren, um zu aktivieren'
        },
        FO: {
          'FO': 'Text',
          'content': 'Inhalt',
          'submit': 'Absenden',
          'cancel': 'Abbrechen'
        },
      },
      Flux: {
        'asf': 'Stil auf Flüsse mit diesem Stil anwenden',
        data: {
          'scientificNotation': 'Wert in wissenschaftlicher Notation anzeigen',
          'fla': 'Freie Flüsse anzeigen',
          'astr': 'Struktur anzeigen',
        },
      },
      UserNav: {
        'to_con': 'Anmelden',
        'to_reg': 'Registrieren',
        'to_buy': 'Registrieren',
        'to_app': 'Zurück zur Anwendung',
        'to_acc': 'Mein Konto',
        'to_dbd': 'Dashboard',
        'to_dashboard': 'Dashboard',
        'to_logout': 'Abmelden',
        tooltip: {
          'to_con': 'Anmelden oder Konto erstellen',
          'to_reg': 'Registrieren',
          'to_buy': 'Registrieren',
          'to_app': 'Zurück zur Anwendung',
          'to_acc': 'Mein Konto',
          'to_dbd': 'Dashboard',
          'to_dashboard': 'Dashboard öffnen',
          'to_logout': 'Abmelden'
        }
      },
      Register: {
        presentation: {
          'title': 'Erwecken Sie Ihre Diagramme mit OpenSankey+ zum Leben',
          'text': '<table>\
                    <tr>\
                      <td>\
                        <p>\
                          <b>OpenSankey+ ist ein Storytelling-Werkzeug für alle, die Flussdaten klar und visuell ansprechend präsentieren möchten.\
                          <br><br>\
                          Präzise, wirkungsvoll und schön: Ein Sankey-Diagramm sagt mehr als tausend Worte.</b>\
                        </p>\
                        <p>OpenSankey+ bietet eine erweiterte Version des grundlegenden OpenSankey, angereichert mit einem Präsentationsmodus, ideal für Präsentationen und Storytelling.</p>\
                      </td>\
                      <td>\
                        <img src="https://terriflux.com/wp-content/uploads/2023/07/Tolkien.png" style="margin:20px">\
                      </td>\
                    </tr>\
                    <tr>\
                      <td>\
                        <p>Konkret ermöglicht OpenSankey+ die Erstellung angereicherter Diagramme mit:</p>\
                        <ul style="padding-left: 1rem; ">\
                          <li>Schwebende Beschriftungen zur Verbesserung der grafischen Darstellung</li>\
                          <li>Symbole zur Illustration der Knoten</li>\
                          <li>Farbverlaufsdarstellungen auf Flüssen</li>\
                          <li>Verwaltung komplexer Hierarchien</li>\
                          <li>Sankey-Animationen mit progressiven Erscheinungseffekten oder einer Abfolge von "Ansichten", die Veränderungen im Zeitverlauf zeigen</li>\
                        </ul>\
                      </td>\
                      <td>\
                        <img src="https://terriflux.com/wp-content/uploads/2023/07/FiliereColza-980x359.jpg.webp" style="margin:20px">\
                      </td>\
                    </tr>\
                  </table>',
          'buy_opensankeyplus_monthly': 'Für 50 Euro pro Jahr möchte ich OpenSankey+!',
          'buy_opensankeyplus_annual': 'Für 300 Euro pro Jahr möchte ich OpenSankey+!',
          'choose_plan': 'Wählen Sie eine OpenSankey+-Lizenz.'
        },
        account: {
          'title': 'Erstellen Sie zunächst Ihr Konto',
          id: {
            'label': 'E-Mail',
            'placeholder': 'Eine E-Mail-Adresse wird für die Kontoerstellung benötigt',
            'error': 'Bitte geben Sie eine gültige E-Mail-Adresse ein.'
          },
          pwd: {
            'label': 'Passwort',
            'placeholder': 'Wählen Sie ein sicheres Passwort',
            'error': 'Das Passwort muss mehr als acht Zeichen enthalten, mit mindestens einem Buchstaben, einer Zahl und einem Sonderzeichen.',
            'show': 'anzeigen',
            'hide': 'ausblenden',
          },
          'fn': 'Vorname',
          'ln': 'Nachname',
          msg: {
            'ok': 'Konto erstellt — Sie sind jetzt angemeldet. Eine Bestätigungs-E-Mail wurde gesendet.',
            'err_captcha': 'Captcha ist ungültig',
            'err_email_invalid': 'E-Mail ist ungültig',
            'err_email_exists': 'Ein Konto mit dieser E-Mail existiert bereits',
            'nok': 'Ein Fehler ist aufgetreten, das Konto konnte nicht erstellt werden.'
          },
          'btn_terms': 'Bitte lesen und akzeptieren Sie die Allgemeinen Geschäftsbedingungen',
          'create_account': 'Registrieren'
        },
        validation: {
          'title': 'Kontovalidierung',
          msg: {
            'ok': 'Dieses Konto wurde erfolgreich validiert.',
            'nok': 'Fehler, ungültiger Link',
            'account_already_created': 'Dieses Konto wurde bereits validiert',
            'redirect': 'Sie werden zur Lizenz-Zahlungsseite weitergeleitet.',
          }
        }
      },
      terms_of_uses: {
        'title': 'Allgemeine Geschäftsbedingungen',
        'accept': 'Die Allgemeinen Geschäftsbedingungen akzeptieren'
      },
      Paiement: {
        'win_header_buy': 'Erstellen und teilen Sie Sankey-Diagramme wie ein Profi.',
        'win_header_success': 'Vielen Dank für Ihr Abonnement von OpenSankey+',
        'win_header_error': 'Ups, etwas ist schiefgelaufen',
        'win_content_success': 'OpenSankey+ ist jetzt für Ihr Konto aktiviert.',
        'win_content_success_setpw': 'Ihre Lizenz ist aktiv und Ihr Konto wurde erstellt. Wir haben eine E-Mail an {{email}} gesendet — folgen Sie dem Link, um Ihr Passwort festzulegen und sich anzumelden (prüfen Sie auch Ihren Spam-Ordner).',
        'win_content_error': 'Beim Zahlungsvorgang ist etwas schiefgelaufen',
        'btn_checkout': 'Ich möchte OpenSankey+!'
      },
      Login: {
        'title': 'Bei der Anwendung anmelden',
        'con': 'Anmelden',
        id: {
          'label': 'E-Mail',
          'placeholder': '',
          'error': 'Bitte geben Sie eine gültige E-Mail-Adresse ein.'
        },
        pwd: {
          'label': 'Passwort',
          'placeholder': '',
          'show': 'anzeigen',
          'hide': 'ausblenden',
        },
        msg: {
          'ok': '',
          'err_server': 'Beim Aufruf des Servers ist ein Fehler aufgetreten',
          'err_login': 'Fehler, Ihre E-Mail oder Ihr Passwort ist falsch, bitte überprüfen Sie Ihre Anmeldedaten und versuchen Sie es erneut',
        },
        forgot: {
          'title': 'Passwort zurücksetzen',
          'ask': 'Passwort vergessen?',
          'sub': 'Zurücksetzen',
          msg: {
            'ok': 'Das Passwort wurde erfolgreich zurückgesetzt.',
            'mail_sent': 'Eine E-Mail zum Zurücksetzen des Passworts wurde an Sie gesendet.',
            'err_server': 'Beim Aufruf des Servers ist ein Fehler aufgetreten',
            'err_user_already_connected': 'Fehler, Sie sind bereits angemeldet.',
            'err_user_inexistant': 'Fehler, das angegebene Konto existiert nicht',
            'err_token_expire': 'Fehler, die Anfrage ist abgelaufen.'
          }
        }
      },
      UserPages: {
        login_modify: {
          'title': 'Ihre Anmeldedaten',
          'pwd': 'Passwort ändern',
          'del': 'Konto löschen',
          email_modal: {
            'title': 'E-Mail-Änderung mit Ihrem Passwort bestätigen',
            'btn': 'Änderung anwenden'
          },
          pwd_modal: {
            'title': 'Passwortänderung mit dem per E-Mail erhaltenen Code bestätigen',
            'input_token': 'Erhaltener Code',
            'btn': 'Passwortänderung anwenden'
          },
          del_modal: {
            'title': 'Möchten Sie Ihr Konto wirklich löschen?',
            'desc': 'Warnung: Diese Aktion löscht Ihr Konto, Ihre Daten und beendet Ihr OpenSankey+-Abonnement, falls vorhanden.',
            'fdback': 'Warum möchten Sie Ihr Konto löschen? (optional)',
            'fdback_default': '-',
            'fdback_customer_service': 'Der Kundenservice hat die Erwartungen nicht erfüllt',
            'fdback_low_quality': 'Die Qualität hat die Erwartungen nicht erfüllt',
            'fdback_missing_features': 'Es fehlen einige Funktionen',
            'fdback_switched_service': 'Ich wechsle zu einem anderen Dienst',
            'fdback_too_complex': 'Die Benutzerfreundlichkeit hat die Erwartungen nicht erfüllt',
            'fdback_too_expensive': 'Es ist zu teuer',
            'fdback_unused': 'Ich nutze den Dienst nicht genug',
            'fdback_other': 'Anderer Grund',
            'comment': 'Wie können wir uns verbessern? (optional)',
            'pwd_confirm': 'Geben Sie Ihr Passwort zur Bestätigung ein',
            'btn_confirm': 'Konto und alle Daten löschen',
            'btn_cancel': 'Ich möchte mein Konto behalten',
          },
          btns: {
            'set_email': 'E-Mail ändern',
            'set_pwd': 'Passwort ändern',
            'del_account': 'Konto löschen'
          },
          msgs: {
            'ok_email': 'Die E-Mail wurde erfolgreich geändert',
            'prs_email': 'E-Mail-Änderung wird verarbeitet',
            'err_email_regex': 'Die E-Mail ist ungültig',
            'err_email_failed': 'Die E-Mail konnte nicht geändert werden',
            'ok_pwd': 'Das Passwort wurde erfolgreich geändert',
            'prs_pwd': 'Eine E-Mail zum Zurücksetzen des Passworts wurde an Sie gesendet.',
            'err_pwd_failed': 'Fehler bei der Passwortänderungsanfrage',
            'ok_del': 'Das Konto wurde gelöscht. Rückkehr zur Hauptseite.',
            'err_del': 'Fehler bei der Kontolöschungsanfrage. Bitte überprüfen Sie Ihr Passwort.',
          },
        },
        infos_modify: {
          'title': 'Ihre persönlichen Daten',
          btns: {
            'set_fn': 'Änderung anwenden',
            'set_ln': 'Änderung anwenden',
          },
          msgs: {
            'ok_firstname': 'Der Vorname wurde erfolgreich geändert',
            'err_firstname': 'Die Vornamenänderung konnte nicht angewendet werden',
            'ok_lastname': 'Der Nachname wurde erfolgreich geändert',
            'err_lastname': 'Die Nachnamenänderung konnte nicht angewendet werden',
          },
        },
        license: {
          'title': 'Lizenzinformationen',
          'exp_until': 'Nächste Verlängerung: ',
          btns: {
            'mng_sub': 'Abonnement verwalten',
            'add_sub': 'Lizenz abonnieren',
          },
        },
        'OS+_lic': 'OpenSankey+-Lizenz',
        'SS_lic': 'SankeySuite-Lizenz',
        'update_lic': 'Neue Lizenznummer registrieren',
        'win_acc_infos': 'Kontodetails',
        'win_db_template': 'Verfügbare Vorlagen',
        'db_desc_template': 'Vorlagenbeschreibung',
        'usr_no_lic': 'Derzeit keine Lizenz registriert',
        'usr_lic_validdate': 'Gültigkeitsdatum: ',
        'usr_lic_expdate': 'Abgelaufen am: ',
        'usr_lic_valid': 'Gültige Lizenz',
        'usr_lic_invalid': 'Ungültige Lizenz',
        'usr_lic_deactivated': 'Lizenz deaktiviert',
        'usr_lic_err': 'Ungültige Lizenznummer',
        'err_get_user_infos': 'Fehler beim Zugriff auf die Benutzerinformationen',
        'err_get_OS+_infos': 'Fehler beim Zugriff auf den OpenSankey+-Lizenzserver',
        'err_get_SS_infos': 'Fehler beim Zugriff auf den SankeySuite-Lizenzserver'
      },

      welcome: {
        news: 'Neuigkeiten in dieser Version',
        news_unavailable: 'Die Versionshinweise sind nicht verfügbar.',
        view: 'Schaltflächen zum Navigieren zwischen den verschiedenen Ansichten des Sankey',
        features: 'Funktionsübersicht nach Lizenz',
        features_intro: 'Diese Tabelle fasst die Funktionen zusammen, die durch die jeweilige Lizenz freigeschaltet werden — OpenSankey+, SankeySuite (MFA) und Entwicklerzugang.',
        features_col_feature: 'Funktion',
        features_col_plus: 'OpenSankey+',
        features_col_afm: 'SankeySuite',
        features_col_dev: 'Dev',
        breadcrumbs: {
          intro: 'Übersicht',
          features: 'Lizenzübersicht',
          news: 'Neuigkeiten',
        },
        news_content: {
          230803: {
            main_title: '3. August 2023: Neue Funktionen',
            main_content: 'Wir haben neue Funktionen hinzugefügt, um die Handhabung von Sankey-Diagrammen zu erleichtern',
            sub_title_1: 'Rechtsklick mit vielen Optionen',
            sub_content_1: 'Ab sofort sind viele Aktionen auf Knoten, Flüsse und sogar der Zeichenfläche per Rechtsklick auf die betreffenden Elemente zugänglich.',
            sub_title_2: 'Mehrfachauswahlrahmen',
            sub_content_2: 'Mehrfachauswahl von Knoten kann nun mit Auswahlrahmen durchgeführt werden.',
            sub_title_3: 'Erleichterung der Erweiterung Ihrer Diagramme',
            sub_content_3: 'Die Zeichenfläche kann in jede Richtung erweitert werden, indem Knoten/Flüsse/Textbereiche/Legenden in die gewünschte Richtung gezogen werden.',
            image1: 'clic droit noeud EN.PNG',
            image2: 'clic droit flux EN.PNG',
            image3: 'clic droit fond EN.PNG',
            image4: 'Zone de selection.PNG'
          },
          230908: {
            main_title: '8. September 2023',
            main_content: 'Visuelle Verbesserung des Konfigurationsmenüs',
            sub_title_1: 'Visuelles Redesign der Eingaben im Konfigurationsmenü',
            sub_content_1: 'Die Eingaben im Konfigurationsmenü wurden mit besser sichtbaren Beschriftungen und Logos für Schaltflächen umgestaltet, um deren Nutzen besser zu verstehen.',
            sub_title_2: 'Daten-Kontrollpunkt',
            sub_content_2: 'Sie können jederzeit eine schnelle Sicherung Ihres aktuellen Diagramms erstellen. Nach der Sicherung können Sie Ihr Diagramm weiterentwickeln, und wenn Ihnen die Änderungen nicht gefallen, die Anwendung neu laden, um Ihr Diagramm zum Zeitpunkt der Sicherung wiederherzustellen.',
            img1: 'menu_config_enhanced_en.PNG',
            img2: 'menu_config_enhanced_zdd_en.PNG',
            img3: 'menu_last_save_en.PNG',
          }
        },
        caroussel: {
          Image0: 'Willkommen bei der Werkzeugsuite OpenSankey, OpenSankey+ und SankeySuite von TerriFlux',
          Image1: 'Verstehen Sie Ihre Flüsse, stellen Sie sie mit Sankey-Diagrammen dar',
          Image2: 'Importieren Sie schnell Ihre Daten oder zeichnen Sie Ihre Diagramme direkt',
          Image3: 'Klären Sie die dargestellten Informationen',
          Image40: 'Geben Sie dem Verständnis die nötige Tiefe',
          Image41: 'Geben Sie dem Verständnis die nötige Tiefe',
          Image5: 'Erstellen Sie interaktive und didaktische Infografiken',
          Image6: 'Erstellen Sie interaktive und didaktische Infografiken',
          descr: {
            Image0: 'Diese Werkzeuge ermöglichen es, einfach Flussdiagramme zu erstellen',
            Image1: 'In diesem Darstellungsmodus ist die Dicke jedes Pfeils proportional zum Wert des dargestellten Flusses.',
            Image2: 'Erstellen Sie Ihre Diagramme aus Excel-Tabellen oder über den interaktiven Zeichenbereich.',
            Image3: 'Erleichtern Sie die Lesbarkeit Ihrer Diagramme dank des integrierten Beschriftungssystems für Knoten, Flüsse und Daten.',
            Image40: 'Aggregationsebenen ermöglichen die Darstellung Ihrer Flüsse in mehreren Detailstufen.',
            Image41: 'Jede Detailstufe kann direkt ausgewählt werden, um nur das Nützliche anzuzeigen.',
            Image5: 'Erklären Sie Ihre Ergebnisse einfach mit dem automatischen Legendensystem und dem Hinzufügen von Textbereichen.',
            Image6: 'Erstellen Sie schöne Diagramme durch direkte Integration von Bildern oder Symbolen.'
          }
        }
      },
      'useSankeyThequeJSON': 'Öffnen (JSON)',
      'useSankeyThequeEXCEL': 'Öffnen (Excel)',
      'dl': 'Excel herunterladen',
      'elements_sankey+_blocked': 'Gesperrte Diagrammelemente (OpenSankey+)',
      'mfa_blocked': 'Gesperrte Diagrammelemente (MFASankey)',
      'elements_sankey+_blocked_long': 'Einige Sankey-Elemente sind nicht sichtbar, da sie von OpenSankey+ stammen und Ihr Konto dieses Modul nicht besitzt',
      'elements_mfa_blocked_long': 'Einige Sankey-Elemente sind nicht sichtbar, da sie von MFASankey stammen und Ihr Konto dieses Modul nicht besitzt',
    },
  },
  //=======================================================
  //IT
  //=======================================================
  it: {
    translation: {
      'connect': 'Accesso',
      MEP: {
        onValidate: 'Non dimenticare di caricare il file',
        load_icon: 'Caricare una libreria di icone (da icomoon)',
        'onBlurNoEnter': 'Uscire dall\'editor per aggiornare i dati',
        show_image: 'Mostra immagine',
      },
      Menu: {
        'LL': 'Area di testo / Area immagine',
        'view': 'Viste',
        'unit': 'Sankey Unitario',
        'afm': 'AFM',
        'afm_tools': 'Strumenti',
        'excel': 'Estrarre dati',
        'pub': 'Pubblicare',
        'setResolutionPNG': 'Selezionare la risoluzione desiderata per l\'esportazione',
        'setResolutionPDF': 'Selezionare la risoluzione desiderata per l\'esportazione',
        'sankeyPlusDisabled': 'Parametro disattivato perché non possiedi OpenSankey+',
        'featureLocked': 'Licenza',
        'featureBeta': 'Sperimentale',

        'home': 'Master',
        'addView': 'Aggiungi',
        'updateView': 'Aggiorna',
        'precView': 'Prec.',
        'nextView': 'Succ.',

        'toBeautify': 'Abbellire file JSON',
        'updateFOZdd': 'Aggiornare nell\'area di disegno',

        'import_icon': 'Seleziona icona',
        'import_icon_from_pack': 'Importa gruppo di icone',
        'filter_by_name': 'Filtra per nome',

        'presentation_OS': 'OpenSankey è un\'applicazione web che permette di creare facilmente diagrammi di Sankey.\n\nÈ disponibile gratuitamente e include funzioni semplici per creare nodi, flussi e etichettarli per aggregare o filtrare la loro visualizzazione nel diagramma.\n\n',
        'presentation_OS_limit_node': 'Il limite di 15 nodi per l\'uso senza account può essere rimosso creando un account gratuito.\n\n',
        'presentation_OSP': 'OpenSankey+ è una licenza a pagamento che sblocca nuove funzionalità per creare bellissimi diagrammi di Sankey per le presentazioni.\n\nQuesta licenza include funzionalità avanzate di formattazione come l\'aggiunta di immagini o icone illustrative per i nodi, gradienti di colore sui flussi e animazioni, ecc.\n\nSoprattutto, OpenSankey+ permette di generare presentazioni esplicative dei vostri diagrammi di Sankey grazie al meccanismo delle "Viste", che registra gli stati visivi dello stesso (con/senza certi filtri attivati, per esempio) per semplificare la navigazione tra di essi.\n\n',
        'presentation_OSS': 'SankeySuite è una licenza a pagamento che sblocca tutti gli usi avanzati di creazione e analisi di diagrammi di Sankey.\n\nQuesta licenza include funzionalità di riconciliazione dei dati di flusso per identificare incoerenze o calcolare flussi i cui valori non sono direttamente accessibili.\n\nInclude anche le funzionalità di OpenSankey+.\n\n',
        sankeytheque: 'Sankeytheque',
        afm_reconcil: 'AFM',
        afm_reconcil_excel: 'Riconciliare un file Excel',
        view_actual_file: 'Viste',
        other_file: 'Altro file',
        trade_close: 'Vicino al nodo',

        preference_content: {
          deletePalette: 'Elimina tavolozza',
          deleteColorPalette_tooltip: 'Elimina il colore selezionato dalla tavolozza',
          addColorPalette_tooltip: 'Aggiungi un colore alla tavolozza',
          color: 'Colore',
          color_head: 'Crea e modifica tavolozza colori',
          color_item_1: '- Clicca sul pulsante in basso per creare una tavolozza',
          color_item_2: '- Clicca sul pulsante a destra per aggiungere un colore alla tavolozza',
          color_item_3: '- Clicca su un quadrato colorato per modificarlo',
          color_item_4: '- Clicca con il tasto destro sui colori che vuoi eliminare, poi clicca sul pulsante di eliminazione',

          tag: 'Etichette',
          tag_head: 'Crea e modifica etichette',
          tag_node: 'Etichette dei nodi',
          tag_flow: 'Etichette dei flussi',
          tag_data: 'Etichette dei dati',
          tag_item_1: '- Crea e modifica gruppi di etichette che puoi inserire in ogni Sankey che realizzi',
          tag_item_2: '- Per inserire un gruppo di etichette: seleziona un gruppo nella 3ª sottosezione e clicca su inserisci',
          tag_item_3: '- Se il gruppo selezionato è già inserito nel Sankey, puoi modificarlo cliccando di nuovo sul pulsante di inserimento',
          tag_head_insert: 'Inserimento del gruppo',
          tag_insert: 'Inserisci',
          tag_insert_text: 'Seleziona un gruppo da inserire:',

          style: 'Stile',
          style_head: 'Crea e modifica stile',
          style_edit_head_node_styles_visual: 'Modifica stile visivo dei nodi',
          style_edit_head_node_styles_context: 'Modifica stile delle etichette dei nodi',
          style_edit_head_flow_styles_visual: 'Modifica stile visivo dei flussi',
          style_edit_head_flow_styles_context: 'Modifica stile delle etichette dei flussi',
          style_edit_head: 'Modifica stile nodi/flussi',
          style_insert_head: 'Inserisci nel Sankey',
          style_item_1: '- Crea e modifica stili che puoi inserire in ogni Sankey che realizzi',
          style_item_2: '- Per inserire uno stile: seleziona uno stile nella 3ª sottosezione e clicca su inserisci',
          style_item_3: '- Se lo stile selezionato è già inserito nel Sankey, puoi modificarlo cliccando di nuovo sul pulsante di inserimento',
          style_head_insert: 'Inserimento dello stile',
          style_insert: 'Inserisci stile',
          style_update: 'Modifica stile',
          style_insert_text: 'Seleziona uno stile da inserire:',

          icon: 'Icona',
          icon_head: 'Importazione delle icone',
          icon_item_1: '- Per importare icone, clicca sulla scheda Importa e seleziona un file .svg',
          icon_item_2: '- Dopo aver importato un\'icona, puoi modificarne il titolo cliccando sul testo',
        },
        Transformation: {
          'amp_short': 'Trasf.',
          'amp': 'Modificare il layout',
          'amp_import': 'Da un altro diagramma',
          'amp_manuelle': 'Posizionamento',
          'trans_topo': 'Topologico',
          'fmep': 'Altro diagramma',
          'ad': 'Applica',
          'undo': 'Annulla',
          'Shortcuts': 'Scorciatoie di selezione',
          'unSelectAll': 'Nessuno',
          'selectAll': 'Tutti',
          'selectDefault': 'Predefinito',
          'Topology': 'Aggiunte e rimozioni',
          'Geometry': 'Dimensioni e posizioni',
          'Attribut': 'Attributi',
          'Tags': 'Etichette',
          'Values': 'Valori dei flussi',
          'Views': 'Viste',
          'freeLabels': 'Aree di testo',
          'addNode': 'Aggiungi nodi',
          'removeNode': 'Rimuovi nodi',
          'addFlux': 'Aggiungi flussi',
          'removeFlux': 'Rimuovi flussi',
          'PosNoeud': 'Nodi',
          'posFlux': 'Flussi',
          'attrNode': 'Nodi',
          'attrFlux': 'Flussi',
          'tagLevel': 'Livelli di dettaglio',
          'tagNode': 'Nodi',
          'tagFlux': 'Flussi',
          'tagData': 'Dati',
          'tagNode_assign': 'Assegna un\'etichetta',
          'tagFlux_assign': 'Assegna un\'etichetta',
          'attrGeneral': 'Area di disegno',
          'title': 'Trasformazioni',
          'disabled_view': 'Non è possibile importare viste in una vista; per farlo, andate ai dati master',
          'list_icon': 'Catalogo icone',
          'list_icon_tooltip': 'Importa la lista delle icone utilizzate nel layout importato nei dati attuali.'
        },
        tooltips: {
          publish: 'Pubblicare online',
          export: 'Esporta come immagine',
          reconcil: 'Riconciliare i dati',
          tool_afm: 'Utilizzare strumenti ausiliari per la riconciliazione',
          view: 'Mostra/nascondi la barra delle viste (creare, navigare e gestire le viste)',
          sankeytheque: 'Apri la Sankeyteca: sfogliare e caricare diagrammi di esempio',
        },
        xl_check: 'Verifica Excel',
        ter_gen: 'Gen. tabella risorse-impieghi'
      },

      Noeud: {
        'plns': 'Parametri per i nodi selezionati',
        'img_visibility': 'Visibilità dell\'immagine',
        'img_src': 'Fonte',
        'HL': 'Collegamento ipertestuale',
        'open_HL': 'Apri',
        'illustration': 'Illustrazione',
        'illustration_type': 'Tipo di illustrazione',
        tabs: {
          'icon': 'Icona',
          'fo': 'Illustrazione',
          'hl': 'Collegamento ipertestuale'
        },
        apparence: {
          'HideAlone': 'Nascondi se intermedio',
          'toScale': 'Nodo fuori scala',
          'Orientation': 'Orientamento',
        },
        icon: {
          'icon': 'Icona',
          'Visibilité': 'Visibilità delle icone',
          'si': 'Seleziona icona',
          'couleur': 'Colore',
          'rIN': 'Rapporto dimensione icona/nodo',
          'Aucun': 'Nessuno',
          'icon_catalog': 'Seleziona un\'icona dal catalogo'
        },
        foreign_object: {
          'Visibilité': 'Visibilità',
          'raw': 'Editor grezzo',
          'not_activated': 'Attiva la visibilità per attivare'
        },
        FO: {
          'FO': 'Testo',
          'content': 'Contenuto',
          'submit': 'Invia',
          'cancel': 'Annulla'
        },
      },
      Flux: {
        'asf': 'Applica lo stile ai flussi con questo stile',
        data: {
          'scientificNotation': 'Visualizza il valore in notazione scientifica',
          'fla': 'Visualizza flussi liberi',
          'astr': 'Visualizza struttura',
        },
      },
      UserNav: {
        'to_con': 'Accedi',
        'to_reg': 'Registrati',
        'to_buy': 'Registrati',
        'to_app': 'Torna all\'applicazione',
        'to_acc': 'Il mio account',
        'to_dbd': 'Pannello di controllo',
        'to_dashboard': 'Pannello di controllo',
        'to_logout': 'Disconnetti',
        tooltip: {
          'to_con': 'Accedi o crea un account',
          'to_reg': 'Registrati',
          'to_buy': 'Registrati',
          'to_app': 'Torna all\'applicazione',
          'to_acc': 'Il mio account',
          'to_dbd': 'Pannello di controllo',
          'to_dashboard': 'Apri pannello di controllo',
          'to_logout': 'Disconnetti'
        }
      },
      Register: {
        presentation: {
          'title': 'Date vita ai vostri diagrammi con OpenSankey+',
          'text': '<table>\
                    <tr>\
                      <td>\
                        <p>\
                          <b>OpenSankey+ è uno strumento di storytelling progettato per chi desidera presentare dati di flusso in modo chiaro e visivamente attraente.\
                          <br><br>\
                          Preciso, efficace e bello: un Sankey vale più di mille parole.</b>\
                        </p>\
                        <p>OpenSankey+ offre una versione migliorata di OpenSankey base, arricchita con una modalità presentazione, ideale per presentazioni e storytelling.</p>\
                      </td>\
                      <td>\
                        <img src="https://terriflux.com/wp-content/uploads/2023/07/Tolkien.png" style="margin:20px">\
                      </td>\
                    </tr>\
                    <tr>\
                      <td>\
                        <p>In concreto, OpenSankey+ permette di creare diagrammi arricchiti con:</p>\
                        <ul style="padding-left: 1rem; ">\
                          <li>Etichette fluttuanti per migliorare la rappresentazione grafica</li>\
                          <li>Icone per illustrare i nodi</li>\
                          <li>Rappresentazioni di gradienti sui flussi</li>\
                          <li>Gestione di gerarchie complesse</li>\
                          <li>Animazioni Sankey con effetti di apparizione progressiva o una successione di "viste" che mostrano cambiamenti nel tempo</li>\
                        </ul>\
                      </td>\
                      <td>\
                        <img src="https://terriflux.com/wp-content/uploads/2023/07/FiliereColza-980x359.jpg.webp" style="margin:20px">\
                      </td>\
                    </tr>\
                  </table>',
          'buy_opensankeyplus_monthly': 'Per 50 euro all\'anno, voglio OpenSankey+!',
          'buy_opensankeyplus_annual': 'Per 300 euro all\'anno, voglio OpenSankey+!',
          'choose_plan': 'Scegliete una licenza OpenSankey+.'
        },
        account: {
          'title': 'Prima create il vostro account',
          id: {
            'label': 'E-mail',
            'placeholder': 'È necessaria un\'e-mail per creare il vostro account',
            'error': 'Inserite un indirizzo e-mail valido.'
          },
          pwd: {
            'label': 'Password',
            'placeholder': 'Scegliete una buona password',
            'error': 'La password deve contenere più di otto caratteri, con almeno una lettera, un numero e un carattere speciale.',
            'show': 'mostra',
            'hide': 'nascondi',
          },
          'fn': 'Nome',
          'ln': 'Cognome',
          msg: {
            'ok': 'Account creato — ora hai effettuato l\'accesso. Ti abbiamo inviato un\'e-mail di conferma.',
            'err_captcha': 'Il captcha non è valido',
            'err_email_invalid': 'L\'e-mail non è valida',
            'err_email_exists': 'Un account con questa e-mail esiste già',
            'nok': 'Si è verificato un errore, impossibile creare l\'account.'
          },
          'btn_terms': 'Leggete e accettate i termini e le condizioni',
          'create_account': 'Registrati'
        },
        validation: {
          'title': 'Validazione dell\'account',
          msg: {
            'ok': 'Questo account è stato validato con successo.',
            'nok': 'Errore, link non valido',
            'account_already_created': 'Questo account è già stato validato',
            'redirect': 'Sarete reindirizzati alla pagina di pagamento della licenza.',
          }
        }
      },
      terms_of_uses: {
        'title': 'Termini e condizioni d\'uso',
        'accept': 'Accettare i termini e le condizioni d\'uso'
      },
      Paiement: {
        'win_header_buy': 'Create e condividete diagrammi di Sankey come un professionista.',
        'win_header_success': 'Grazie per il vostro abbonamento a OpenSankey+',
        'win_header_error': 'Ops, qualcosa è andato storto',
        'win_content_success': 'OpenSankey+ è ora attivato per il vostro account.',
        'win_content_success_setpw': 'La vostra licenza è attiva e il vostro account è stato creato. Abbiamo inviato un\'email a {{email}}: seguite il link per impostare la password e accedere (controllate anche la cartella spam).',
        'win_content_error': 'Qualcosa è andato storto durante il processo di pagamento',
        'btn_checkout': 'Voglio OpenSankey+!'
      },
      Login: {
        'title': 'Connettersi all\'applicazione',
        'con': 'Accedi',
        id: {
          'label': 'E-mail',
          'placeholder': '',
          'error': 'Inserite un indirizzo e-mail valido.'
        },
        pwd: {
          'label': 'Password',
          'placeholder': '',
          'show': 'mostra',
          'hide': 'nascondi',
        },
        msg: {
          'ok': '',
          'err_server': 'Si è verificato un errore durante la chiamata al server',
          'err_login': 'Errore, la vostra e-mail o password è errata, verificate i vostri dati di accesso e riprovate',
        },
        forgot: {
          'title': 'Reimpostare la password',
          'ask': 'Password dimenticata?',
          'sub': 'Reimposta',
          msg: {
            'ok': 'La password è stata reimpostata con successo.',
            'mail_sent': 'Vi è stata inviata un\'e-mail per la reimpostazione della password.',
            'err_server': 'Si è verificato un errore durante la chiamata al server',
            'err_user_already_connected': 'Errore, siete già connessi.',
            'err_user_inexistant': 'Errore, l\'account indicato non esiste',
            'err_token_expire': 'Errore, la richiesta è scaduta.'
          }
        }
      },
      UserPages: {
        login_modify: {
          'title': 'I vostri dati di accesso',
          'pwd': 'Cambiare password',
          'del': 'Eliminare account',
          email_modal: {
            'title': 'Confermate la modifica dell\'e-mail con la vostra password',
            'btn': 'Applicare la modifica'
          },
          pwd_modal: {
            'title': 'Confermate la modifica della password con il codice ricevuto via e-mail',
            'input_token': 'Codice ricevuto',
            'btn': 'Applicare la modifica della password'
          },
          del_modal: {
            'title': 'Volete davvero eliminare il vostro account?',
            'desc': 'Attenzione: questa azione eliminerà il vostro account, i vostri dati e interromperà il vostro abbonamento a OpenSankey+ se presente.',
            'fdback': 'Perché volete eliminare il vostro account? (opzionale)',
            'fdback_default': '-',
            'fdback_customer_service': 'Il servizio clienti non ha soddisfatto le aspettative',
            'fdback_low_quality': 'La qualità non ha soddisfatto le aspettative',
            'fdback_missing_features': 'Mancano alcune funzionalità',
            'fdback_switched_service': 'Sto passando a un altro servizio',
            'fdback_too_complex': 'La facilità d\'uso non ha soddisfatto le aspettative',
            'fdback_too_expensive': 'È troppo caro',
            'fdback_unused': 'Non uso il servizio abbastanza',
            'fdback_other': 'Altro motivo',
            'comment': 'Come possiamo migliorare? (opzionale)',
            'pwd_confirm': 'Inserite la vostra password per confermare',
            'btn_confirm': 'Eliminare account e tutti i dati',
            'btn_cancel': 'Voglio mantenere il mio account',
          },
          btns: {
            'set_email': 'Cambiare e-mail',
            'set_pwd': 'Cambiare password',
            'del_account': 'Eliminare account'
          },
          msgs: {
            'ok_email': 'L\'e-mail è stata cambiata con successo',
            'prs_email': 'Elaborazione del cambio di e-mail',
            'err_email_regex': 'L\'e-mail non è valida',
            'err_email_failed': 'Non è stato possibile modificare l\'e-mail',
            'ok_pwd': 'La password è stata cambiata con successo',
            'prs_pwd': 'Vi è stata inviata un\'e-mail per la reimpostazione della password.',
            'err_pwd_failed': 'Errore nella richiesta di cambio password',
            'ok_del': 'L\'account è stato eliminato. Ritorno alla pagina principale.',
            'err_del': 'Errore nella richiesta di eliminazione dell\'account. Verificate la vostra password.',
          },
        },
        infos_modify: {
          'title': 'Le vostre informazioni personali',
          btns: {
            'set_fn': 'Applicare la modifica',
            'set_ln': 'Applicare la modifica',
          },
          msgs: {
            'ok_firstname': 'Il nome è stato modificato con successo',
            'err_firstname': 'Non è stato possibile applicare la modifica del nome',
            'ok_lastname': 'Il cognome è stato modificato con successo',
            'err_lastname': 'Non è stato possibile applicare la modifica del cognome',
          },
        },
        license: {
          'title': 'Informazioni sulla licenza',
          'exp_until': 'Prossimo rinnovo: ',
          btns: {
            'mng_sub': 'Gestire abbonamento',
            'add_sub': 'Sottoscrivere una licenza',
          },
        },
        'OS+_lic': 'Licenza OpenSankey+',
        'SS_lic': 'Licenza SankeySuite',
        'update_lic': 'Registrare nuovo numero di licenza',
        'win_acc_infos': 'Dettagli dell\'account',
        'win_db_template': 'Modelli disponibili',
        'db_desc_template': 'Descrizione del modello',
        'usr_no_lic': 'Nessuna licenza attualmente registrata',
        'usr_lic_validdate': 'Data di validità: ',
        'usr_lic_expdate': 'Scaduta il: ',
        'usr_lic_valid': 'Licenza valida',
        'usr_lic_invalid': 'Licenza non valida',
        'usr_lic_deactivated': 'Licenza disattivata',
        'usr_lic_err': 'Numero di licenza non valido',
        'err_get_user_infos': 'Errore durante l\'accesso alle informazioni dell\'utente',
        'err_get_OS+_infos': 'Errore durante l\'accesso al server di licenze OpenSankey+',
        'err_get_SS_infos': 'Errore durante l\'accesso al server di licenze SankeySuite'
      },

      welcome: {
        news: 'Novità di questa versione',
        news_unavailable: 'Le note di rilascio non sono disponibili.',
        view: 'Pulsanti per navigare tra le diverse viste del Sankey',
        features: 'Riepilogo delle funzionalità per licenza',
        features_intro: 'Questa tabella riepiloga le funzionalità sbloccate da ciascuna licenza — OpenSankey+, SankeySuite (MFA) e accesso sviluppatore.',
        features_col_feature: 'Funzionalità',
        features_col_plus: 'OpenSankey+',
        features_col_afm: 'SankeySuite',
        features_col_dev: 'Dev',
        breadcrumbs: {
          intro: 'Panoramica',
          features: 'Riepilogo licenze',
          news: 'Novità',
        },
        news_content: {
          230803: {
            main_title: '3 agosto 2023: Nuove funzionalità',
            main_content: 'Abbiamo aggiunto nuove funzionalità per facilitare la manipolazione dei diagrammi di Sankey',
            sub_title_1: 'Clic destro con molte opzioni',
            sub_content_1: 'D\'ora in poi, molte azioni su nodi, flussi e persino l\'area di disegno sono accessibili facendo clic destro sugli elementi interessati.',
            sub_title_2: 'Riquadro di selezione multipla',
            sub_content_2: 'La selezione multipla dei nodi può ora essere effettuata con riquadri di selezione.',
            sub_title_3: 'Facilitare l\'espansione dei diagrammi',
            sub_content_3: 'L\'area di disegno può essere espansa in qualsiasi direzione trascinando nodi/flussi/aree di testo/legende nella direzione scelta.',
            image1: 'clic droit noeud EN.PNG',
            image2: 'clic droit flux EN.PNG',
            image3: 'clic droit fond EN.PNG',
            image4: 'Zone de selection.PNG'
          },
          230908: {
            main_title: '8 settembre 2023',
            main_content: 'Miglioramento visivo del menu di configurazione',
            sub_title_1: 'Ridisegno visivo degli input nel menu di configurazione',
            sub_content_1: 'Gli input del menu di configurazione sono stati ridisegnati con etichette più visibili e loghi per i pulsanti per comprenderne meglio l\'utilità.',
            sub_title_2: 'Punto di controllo dei dati',
            sub_content_2: 'In qualsiasi momento, potete fare un salvataggio rapido del vostro diagramma attuale. Una volta effettuato il salvataggio, potete continuare a sviluppare il vostro diagramma e, se le modifiche apportate non vi soddisfano, ricaricare l\'applicazione per ritrovare il diagramma al momento del salvataggio.',
            img1: 'menu_config_enhanced_en.PNG',
            img2: 'menu_config_enhanced_zdd_en.PNG',
            img3: 'menu_last_save_en.PNG',
          }
        },
        caroussel: {
          Image0: 'Benvenuti nella suite di strumenti OpenSankey, OpenSankey+ e SankeySuite di TerriFlux',
          Image1: 'Comprendete i vostri flussi, rappresentateli con diagrammi di Sankey',
          Image2: 'Importate rapidamente i vostri dati o disegnate direttamente i vostri diagrammi',
          Image3: 'Chiarite l\'informazione rappresentata',
          Image40: 'Date la profondità necessaria alla comprensione',
          Image41: 'Date la profondità necessaria alla comprensione',
          Image5: 'Create infografiche interattive e didattiche',
          Image6: 'Create infografiche interattive e didattiche',
          descr: {
            Image0: 'Questi strumenti permettono di creare facilmente diagrammi di flusso',
            Image1: 'In questa modalità di rappresentazione, lo spessore di ogni freccia è proporzionale al valore del flusso che rappresenta.',
            Image2: 'Create i vostri diagrammi da fogli di calcolo Excel o tramite l\'area di disegno interattiva.',
            Image3: 'Facilitate la lettura dei vostri diagrammi grazie al sistema integrato di etichettatura di nodi, flussi e dati.',
            Image40: 'I livelli di aggregazione permettono di rappresentare i vostri flussi in diversi livelli di dettaglio.',
            Image41: 'Ogni livello di dettaglio può essere selezionato direttamente per visualizzare solo ciò che è utile.',
            Image5: 'Spiegate semplicemente i vostri risultati con il sistema di legenda automatica e l\'aggiunta di aree di testo.',
            Image6: 'Create bellissimi diagrammi integrando direttamente immagini o icone.'
          }
        }
      },
      'useSankeyThequeJSON': 'Apri (JSON)',
      'useSankeyThequeEXCEL': 'Apri (Excel)',
      'dl': 'Scarica Excel',
      'elements_sankey+_blocked': 'Elementi del diagramma bloccati (OpenSankey+)',
      'mfa_blocked': 'Elementi del diagramma bloccati (MFASankey)',
      'elements_sankey+_blocked_long': 'Alcuni elementi del Sankey non sono visibili perché provengono da OpenSankey+ e il vostro account non possiede questo modulo',
      'elements_mfa_blocked_long': 'Alcuni elementi del Sankey non sono visibili perché provengono da MFASankey e il vostro account non possiede questo modulo',
    },
  }
}