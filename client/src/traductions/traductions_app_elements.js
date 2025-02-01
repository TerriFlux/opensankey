
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
        afm_reconcil_json: 'Reconciling actual sankey diagram',
        afm_reconcil_excel: 'Reconciling an excel file',
        view_actual_file: 'Views',
        other_file: 'Other file',
        trade_close: 'Close to node',
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
        }
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
      LL: {
        'hl': 'Height',
        'll': 'Width',
        'ft': 'Opacity',
        'cfl': 'Background Color',
        'bt': 'Invisible',
        'hide_border': 'Hide border',
        'display_border': 'Display border',
        'cbl': 'Border Color',
        'labels': 'Labels',
        'title': 'Title'
      },  
      UserNav: {
        'to_con': 'Sign in',
        'to_reg': 'Sign up',
        'to_buy': 'Try OpenSankey+',
        'to_app': 'Back to the application',
        'to_acc': 'My account',
        'to_dbd': 'Dashboard',
        tooltip:{
          'to_con': 'Log in or create an account',
          'to_reg': 'Sign up',
          'to_buy': 'Try OpenSankey+',
          'to_app': 'Back to the application',
          'to_acc': 'My account',
          'to_dbd': 'Dashboard'         
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
          'btn_next': 'I want OpenSankey+ !'
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
            'ok': 'Account created - You will receive a confirmation e-mail to validate your account',
            'err_captcha': 'Captcha is invalid',
            'err_email_invalid': 'Email is not valid',
            'err_email_exists': 'An account already exists with this e-mail',
            'nok': 'An error has occurred, could not create account.'
          },
          'btn_terms': 'Please read and accept the terms and conditions',
          'btn_next': 'Sign up'
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
          'title': 'OpenSankey+ license information',
          'exp_until': 'Next renewal: ',
          btns: {
            'mng_sub': 'Manage subscription',
            'add_sub': 'Switch to OpenSankey+',
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
      view: {
        'unit': 'Unit.',
        'storytelling': 'Storytelling',
        'select': 'Select View',
        'actual': 'Sankey master',
        'name': 'Name',
        'delete': 'Delete',
        'copy': 'Clone',
        'catalog': 'Catalog',
        'import': 'Import',
        'export': 'Download only the current view',
        'applyDisplayFromView': 'Apply the layout from another view',
        'ns': 'View not saved',
        'warn_ns': 'You are about to change your view before saving the current view, do you want to save the changes before changing your view?',
        'dont_save': 'Don\'t save',
        'save': 'Save the view',
        'exportAll': 'Export all views',
        'importMultiple': 'Import multiple views',
        'unit_node': 'Create a unitary view',
        'to_normal_view': 'Considering this view as non-exploring',
        'in_new': 'in a new view',
        'in_existing': 'in the view:',
        'template_unitary_zdt_content': 'Unitary Sankey build from:',
        'template_unitary_zdt_content_of_node': 'Unitary node:',
        'keep_master_var': 'Master variable',
        'setTransparentAttr': 'Choose variables value inherited from Master',
        'updateViewWithMasterVar': 'Update current view with selected parameter',
        'edit_name': 'Edit name',
        'modify_name_view': 'Modify the name of the view',
        'view_title_modal_select_link_ref_in_unitary_sankey': 'Values displayed',
        'choose_link_ref_sankey_unit': 'Values',
        'chose_io': 'Choose input or output links',
        'chose_node_to_configure': 'Choose a unitary node to configure',
        'chose_link_ref': 'Choose link referential to normalize Sankey',
        'prefix_copy': 'Copy of',
        'selectNodeForUnitaryView': 'Select a node to create a unitary Sankey from',
        'output_link': 'Output',
        'input_link': 'Input',
        legend_unit_sankey_values_links: 'Links value',
        legend_unit_sankey_percent_links: 'Percent compared to the sum of input or output',
        legend_unit_sankey_normalize_links: 'Standardized value by the link:',
        from_actual: 'From current data',
        from_excel: 'From Excel file',
        unit_from_excel: 'Unit. from Excel',
        select_excel_file: 'Choose an Excel file to extract unitary view from',
        select_data_source: 'Select an imported file',
        create_unit: 'Create unitary views',
        create: 'Create unitary view from selected nodes',
        unit_sankey_values_links: 'Display link values',
        unit_sankey_percent_links: 'Display link values as percent',
        unit_sankey_normalize_links: 'Display link values normalized by one or more link values',
        default_unit_view_name: 'Unitary view of node ',
  
        tooltips: {
          keep_master_var: 'Allow choosing variable value of the Sankey view to be from the Sankey master',
          catalog_data: 'Generate a catalog of views: gather views from different files',
  
          PrevViewButton: 'Display previous view',
          NextViewButton: 'Display next view',
          saveView: 'Save the modification of the view in master data',
          home: 'Return to master data (database from which views come from)',
          buttonCreateView: 'Generate a view from the current Sankey diagram',
          buttonCloneView: 'Copy the current view to a new one',
          buttonImportView: 'Import data as a view',
          buttonExportView: 'Export a view as data (without other views)',
          buttonCloneMasterAttrView: 'Transfer value from master data to the view elements',
          button_delete_actual_view: 'Delete current view',
          unit_from_excel: 'Excel: Generate views from one or more Excel files',
          choose_link_ref_sankey_unit: 'Choose link values to display'
        }
      },
      welcome: {
        news: 'What\'s new in this version',
        view: 'Buttons to navigate through the different views of the Sankey',
        breadcrumbs: {
          intro: 'Overview',
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
      reconciliation: {
        reconciliation: 'Reconciliation',
        success_status_optim: 'Download results',
        success_status_check_excel: 'Verification finished',
        success_status_create_ter: 'Creation finished',
        fail_status_optim: 'Fail to reconcile',
        fail_status_check_excel: 'Fail to verify',
        fail_status_create_ter: 'fail to create the TER',
        launch: 'Launch',
        processing: 'Processing...',
        open_file: 'Open the reconcilied file',
        reset: 'Reset',
        success: 'Success',
        infos: 'Infos',
        err: 'Errors',
        debug: 'Debug',
        input_parameter: 'Parameter and input data',
        input_excel: 'Entering excel file',
        input_layout: 'Layout file',
        check_scale_geo: 'Scale\'s descent',
        input_scale_geo: 'MFA file from supperior geographic level',
        check_analyse_uncert: 'Uncertainty analysis',
        input_analyse_uncert: 'Number of realisation',
        waiting_file: 'Choose an entering excel file'
      },
      'useSankeyThequeJSON':'Open (json)',
      'useSankeyThequeEXCEL':'Open (excel)',
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
        'sankeyPlusDisabled': 'Paramètre désactivé car vous n\'avez pas OpenSankey+',
        'featureLocked': 'Licence',
        'featureBeta': 'Beta-test',

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
        afm_reconcil_json: 'Réconcilier le diagramme de Sankey actuel',
        afm_reconcil_excel: 'Réconcilier un fichier Excel',
        view_actual_file: 'Vues',
        other_file: 'Autre fichier',
        trade_close: 'Près du noeud',
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
        }
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
          'icon_catalog': 'Sélectionner une icône depuis un catalogue'
        },
        foreign_object: {
          'Visibilité': 'Visibilité',
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
      LL: {
        'hl': 'Hauteur',
        'll': 'Largeur',
        'ft': 'Opacité',
        'cfl': 'Couleur fond',
        'bt': 'Invisible',
        'hide_border': 'Masquer la bordure',
        'display_border': 'Afficher la bordure',
        'cbl': 'Couleur bordure',
        'labels': 'Style police',

        'title': 'Titre'
      },
      UserNav: {
        'to_con': 'Se connecter',
        'to_reg': 'Créer un compte',
        'to_buy': 'Essayer OpenSankey+',
        'to_app': 'Retour à l\'application',
        'to_acc': 'Mon compte',
        'to_dbd': 'Dashboard',
        tooltip: {
          'to_con': 'Se connecter',
          'to_reg': 'Créer un compte',
          'to_buy': 'Accéder à des fonctionnalités avancés parmis lesquelles: utilisation d\'icônes, de zone de textes, et édition de vues.',
          'to_app': 'Retour à l\'application',
          'to_acc': 'Mon compte',
          'to_dbd': 'Dashboard'          
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
          'btn_next': 'Je veux OpenSankey+ !'
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
            'ok': 'Compte créé - Vous allez recevoir un e-mail afin de valider celui-ci.',
            'nok': 'Une erreur s\'est produite. Le compte n\'a pas pu être créé',
            'err_captcha': 'Le captcha n\'est pas valide',
            'err_email_invalid': 'L\'adresse e-mail fournie n\'est pas valide',
            'err_email_exists': 'Un compte existe déjà avec cette adresse e-mail',
          },
          'btn_terms': 'Lire et accepter les conditions d\'utilisation',
          'btn_next': 'Créer le compte'
        },
        validation: {
          'title': 'Validation du compte',
          msg: {
            'ok': 'Ce compte a été validé avec succes.',
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
            'fdback_too_expensive' : 'Le logiciel est trop cher',
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
          'title': 'Votre licence OpenSankey+',
          'exp_until': 'Prochain renouvellement : ',
          btns: {
            'mng_sub': 'Gérer l\'abonnement',
            'add_sub': 'Passer à OpenSankey+',
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
      view: {
        'unit': 'Unit.',
        'storytelling': 'Gestion des vues',
        'select': 'Sélection Vue',
        'actual': 'Sankey maître',
        'name': 'Nom',
        'delete': 'Suppr.',
        'copy': 'Cloner',
        'catalog': 'Catalog.',
        'import': 'Importer',
        'export': 'Télécharger uniquement la vue actuelle',
        'applyDisplayFromView': 'Appliquer la mise en page d\'une autre vue ',
        'ns': 'Vue non enregistrée',
        'warn_ns': 'Vous êtes sur le point de changer de vue avant d\'avoir sauvegardé la vue actuelle, voulez-vous sauvegarder les changements avant de changer de vue ?',
        'dont_save': 'Ne pas enregistrer',
        'save': 'Enregistrer la vue',
        'exportAll': 'Exporter toutes les vues',
        'importMultiple': 'Importer plusieurs vues',
        'unit_node': 'Créer une vue unitaire',
        'to_normal_view': 'Considerer la vue comme non-explorant',
        'in_new': 'dans une nouvelle vue',
        'in_existing': 'dans la vue :',
        'template_unitary_zdt_content': 'Vue unitaire construite à partir de :',
        'template_unitary_zdt_content_of_node': 'Noeud unitaire :',
        'keep_master_var': 'M.à.j',
        'setTransparentAttr': 'Choisir attributs hérité du sankey maître',
        'updateViewWithMasterVar': 'Mettre à jour la vue actuelle avec les paramètres sélectionnés',
        'edit_name': 'Editer le nom',
        'modify_name_view': 'Modifier le nom de la vue',
        'view_title_modal_select_link_ref_in_unitary_sankey': 'Valeurs affichées',
        'choose_link_ref_sankey_unit': 'Valeurs',
        'chose_io': 'Position du/des flux de référence par rapport au noeud unitaire',
        'chose_node_to_configure': 'Choisir un noeud unitaire à configurer',
        'chose_link_ref': 'Choisir le(s) flux de référence',
        'prefix_copy': 'Copie de',
        'selectNodeForUnitaryView': 'Choisissez un noeud pour créer un sankey unitaire',
        'output_link': 'Sortie',
        'input_link': 'Entrée',
        legend_unit_sankey_values_links: 'Valeurs des flux',
        legend_unit_sankey_percent_links: 'Pourcentages par rapport au total en entrée ou en sortie',
        legend_unit_sankey_normalize_links: 'Valeurs normalisées par rapport au flux',
        from_actual: 'Depuis les données actuel',
        from_excel: 'Depuis un fichier excel',
        unit_from_excel: 'Unit. excel',
        select_excel_file: 'Choix du fichier excel à partir duquel extraire des vues unitaires',
        select_data_source: 'Sélectionner un fichier importé',
        create: 'Créer des vues unitaires à partir des noeuds sélectionnés',
        create_unit: 'Générer des vues unitaires',
        unit_sankey_values_links: 'Afficher les valeurs des flux',
        unit_sankey_percent_links: 'Afficher les pourcentages des flux',
        unit_sankey_normalize_links: 'Afficher les valeurs des flux normalisés par rapport à des un/des flux de référence',
        default_unit_view_name: 'Vue unitaire du noeud ',

        tooltips: {
          keep_master_var: 'Permet de choisir des variables qui ont pour valeur ceux du sankey maître',
          catalog_data: 'Générer un catalogue de vues : rassembler des vues issues de fichiers différents',
          PrevViewButton: 'Afficher la vue précédente',
          NextViewButton: 'Afficher la vue suivante',
          saveView: 'Sauvegarder localement dans le navigateur (mémoire cache)',
          home: 'Revenir au Sankey maître (base de données d\'où sont issues les vues)',
          buttonCreateView: 'Générer une vue à partir du diagramme actuel',
          buttonCloneView: 'Copie la vue actuelle en une nouvelle vue indépendante de l\'original ',
          buttonImportView: 'Importe un diagramme dans cette vue (remplace la vue diagramme actuelle)',
          buttonExportView: 'Exporte la vue actuelle en tant que donnée de diagramme',
          buttonCloneMasterAttrView: 'Mettre à jour la vue actuelle en chargeant des éléments du Sankey Maître',
          buttonCreateViewUnitary: 'Générer une vue unitaire en choisissant un noeud du diagramme actuel',
          button_delete_actual_view: 'Supprimer la vue actuelle',
          unit_from_excel: 'Générer une ou plusieurs vue(s) unitaire(s) à partir d\'un ou plusieurs fichier(s) Excel',
          choose_link_ref_sankey_unit: 'Choisir les valeurs des flux à afficher',
        }
      },
      welcome: {
        news: 'Nouveautés et Améliorations récentes',
        view: 'Boutons permettant de naviguer entre les différentes vues du diagramme',
        breadcrumbs: {
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
      reconciliation: {
        reconciliation: 'Réconciliation',
        success_status_optim: 'Télécharger les résultats',
        success_status_check_excel: 'Vérification terminée',
        success_status_create_ter: 'Création Terminée',
        fail_status_optim: 'Echec de la réconciliation',
        fail_status_check_excel: 'Echec de la vérification',
        fail_status_create_ter: 'Echec de la création',
        launch: 'Lancer',
        processing: 'En traitement...',
        open_file: 'Ouvrir fichier reconcilié',
        reset: 'Réinitialiser',
        success: 'Succès',
        infos: 'Infos',
        err: 'Erreurs',
        debug: 'Debug',
        input_parameter: 'Paramètres et données d\'entrée',
        input_excel: 'Fichier d\'entrée excel',
        input_layout: 'Diagramme de mise en page',
        check_scale_geo: 'Descente d\'échelle',
        input_scale_geo: 'Fichier MFA du niveau géographique supérieur',
        check_analyse_uncert: 'Analyse d\'incertitude',
        input_analyse_uncert: 'Nombre de réalisations',
        waiting_file: 'Veuillez choisir un fichier d\'entrée excel'
      },
      'useSankeyThequeJSON':'Ouvrir (json)',
      'useSankeyThequeEXCEL':'Ouvrir (excel)',
      'dl': 'Télécharger (excel)',
      'elements_sankey+_blocked': 'Elements du diagrame bloqués (OpenSankey+)',
      'elements_mfa_blocked': 'Elements du diagrame bloqués (MFASankey+)',
      'elements_sankey+_blocked_long': 'Certains éléments du Sankey ne sont pas visible car ils proviennent de OpenSankey+ et votre compte ne possède pas ce module',
      'elements_mfa_blocked_long': 'Certains éléments du Sankey ne sont pas visible car ils proviennent de MFASankey et votre compte ne possède pas ce module',
    },
  }
}