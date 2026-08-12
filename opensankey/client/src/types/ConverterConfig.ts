// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2025 TerriFlux
// ==================================================================================================

/**
 * `ConverterConfig` — forme de configuration d'un convertisseur, contrat PARTAGE.
 *
 * OS#1331 : cette interface etait declaree dans `components/dialogs/PersistenceProcessDialogConfigs`,
 * parti dans le paquet editeur, alors que `types/MenuConfig` (viewer) la reference. Un `import type`
 * ne cree pas de dependance a l'execution, mais il en cree une A LA COMPILATION : le viewer ne
 * pouvait plus type-checker sans l'editeur, ce qui rendait le decoupage en paquets impossible.
 *
 * Lecon a retenir : le test de frontiere (`architectureBoundary.test.ts`) ne garde que les aretes
 * RUNTIME. Les aretes de type sont invisibles pour lui et doivent etre traquees separement avant tout
 * decoupage.
 */

/**
 * Nature de l'entree attendue par un convertisseur.
 *
 * sa#424 (lot 2) — les trois formats ETRANGERS (SankeyMATIC, STAN, e!Sankey)
 * rejoignent cette liste. Ils vivaient auparavant hors du dialogue, derriere des
 * `<input type=file>` caches du menu : ils n'avaient donc ni bandeau d'erreur,
 * ni terminal, ni options, et un fichier illisible echouait en silence dans la
 * console (famille du #381).
 *
 * Ils ne portent aucune option de format : `FormatConfigStructure` etant un
 * `Record<string, ...>`, les tables d'attributs n'ont pas a les declarer, et les
 * seaux d'options retombent sur `base`.
 */
export type FormatType =
  | 'base' | 'excel' | 'json' | 'blob' | 'example_excel' | 'example_json'
  | 'sankeymatic' | 'stan' | 'esankey'

export interface ConverterConfig {
  // Textes
  title: string
  launch_button_label: string
  success_status?: string
  failure_status?: string
  // Backend
  server_endpoint: string

  // Racine de résolution serveur des fichiers d'exemple (input_format
  // example_excel / example_json). 'sankeydata' (défaut) = templates + tutoriels
  // migrés dans le submodule SankeyData (env SANKEY_DATA) ; 'mfadata' = contenu
  // de la sankeythèque (Etudes/Clients), servi par /menus/examples depuis
  // MFAData et pas encore migré. Forwardé tel quel dans le form_data du launch.
  example_root?: 'sankeydata' | 'mfadata'

  input: {
    required: boolean
    format: {
      options?: FormatType[]
    }
  }
  output: {
    required: boolean
    format: {
      options?: FormatType[]
    }
  }

  // sa#424 (lot 1) — LE FORMAT DE SORTIE SUIT LE FORMAT D'ENTREE.
  //
  // Une fenetre « Ouvrir » unique doit accepter plusieurs formats d'entree alors
  // que le chemin de traitement, lui, differe : un JSON se lit entierement cote
  // client (json -> blob), un classeur Excel passe par le serveur puis est
  // recharge (excel -> json). Le moteur de lancement s'aiguille deja sur le
  // COUPLE (entree, sortie) ; il suffit donc que la sortie suive l'entree au
  // lieu d'etre figee dans la config.
  //
  // Absent = comportement historique : la sortie garde le format choisi par
  // l'utilisateur (ou le premier de ses options), independamment de l'entree.
  output_format_for_input?: Partial<Record<FormatType, FormatType>>

  // sa#424 (lot 1) — AUCUN FORMAT PRESELECTIONNE.
  //
  // Une fenetre d'ouverture ne doit rien presumer : preselectionner un format
  // revient a demander a l'utilisateur d'annoncer celui de son fichier, et le
  // selecteur du systeme n'affiche alors que ce format-la. Avec cette option,
  // aucune pastille n'est surlignee tant qu'aucun fichier n'est choisi et
  // qu'aucune pastille n'est cliquee, et le filtre presente d'abord TOUS les
  // formats pris en charge.
  //
  // Absent = comportement historique : le premier format des options est actif
  // des l'ouverture (correct pour les dialogues de conversion, ou le format
  // d'entree est une decision de l'utilisateur et non une propriete du fichier).
  no_default_input_format?: boolean

  // Optional per-attribute overrides applied on top of getDefault*Options when
  // initialize() resets the dialog state. Used by shortcut configs (e.g.
  // create_index, create_ter) to pre-select a subset of sheets/options instead
  // of starting from the global defaults. Keys are attribute names from
  // OUTPUT_ATTRIBUTES_CONFIG / INPUT_ATTRIBUTES_CONFIG.
  output_overrides_excel?: Record<string, unknown>
  output_overrides_json?: Record<string, unknown>
  output_overrides_base?: Record<string, unknown>
  input_overrides_excel?: Record<string, unknown>
  input_overrides_json?: Record<string, unknown>
  input_overrides_base?: Record<string, unknown>

  // Optional whitelist of attribute keys to render in the dialog options panel.
  // When set, the dialog only shows checkboxes for these keys; other attributes
  // keep their default/override values silently. Used by shortcuts like
  // create_index that should expose only "Index" + "Read-me" toggles.
  output_options_visible_excel?: string[]
  output_options_visible_json?: string[]
  output_options_visible_base?: string[]
  input_options_visible_excel?: string[]
  input_options_visible_json?: string[]
  input_options_visible_base?: string[]

  // Suppress the Layout tab. The default heuristic shows it whenever an Excel
  // input could feed the in-app sankey, which is wrong for pure save-to-file
  // shortcuts (create_index/ter/tes) where no diagram is reloaded.
  hide_layout_tab?: boolean

  // Force the terminal to stay open at the end of the process: no auto-save,
  // no auto-close. The user reads the log and clicks Télécharger / Réinit
  // explicitly. Used by ad-hoc shortcuts (create_index) where the verbose log
  // is the actual feedback.
  keep_terminal_open?: boolean
}
