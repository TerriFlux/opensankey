// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2026 TerriFlux
// ==================================================================================================
// Author        : TerriFlux
// ==================================================================================================

// sa#593 — EXPORTER UN TABLEAU TEL QU'IL EST AFFICHÉ, en Excel (.xlsx) ou en CSV.
//
// Un module pour TOUT tableau, et non pour le seul Tableau croisé : celui qui dessine un tableau
// décrit ce qu'il montre (`Type_ExportTable` — lignes visibles, dans l'ordre affiché) et pose les
// deux boutons dans son en-tête (`appendTableExportButtons`) ; le reste est ici.
//
// RIEN NE PASSE PAR LE SERVEUR. L'export Excel du diagramme passe par `/opensankey/convert/launch` ;
// le lecteur d'une page publiée n'a pas ce chemin. Le classeur s'écrit donc dans le navigateur :
// quelques fichiers XML (le format OOXML minimal qu'Excel, LibreOffice et openpyxl ouvrent) zippés
// par jszip, déjà embarqué pour les fichiers `.esankey`. Aucune bibliothèque de plus.
//
// LES NOMBRES RESTENT DES NOMBRES : une cellule numérique s'écrit en nombre, à pleine précision, et
// c'est le FORMAT de la cellule qui donne les décimales affichées. L'unité vit dans sa colonne, pas
// collée à la valeur — sinon Excel lit du texte et plus rien ne se calcule.

import JSZip from 'jszip'

/** Une cellule : du texte, un nombre, ou rien (cellule vide). */
export type Type_ExportCell = string | number | null

export interface Type_ExportColumn {
  label: string
  /**
   * `text` : écrit tel quel. `number` : un nombre, `decimals` décimales affichées dans Excel.
   * `share` : une part (0..1), affichée en pourcentage dans Excel ; le CSV garde la fraction.
   */
  kind: 'text' | 'number' | 'share'
  /** Décimales AFFICHÉES par Excel (format de cellule) ; la valeur, elle, n'est jamais arrondie. */
  decimals?: number
}

export interface Type_ExportRow {
  /** Une cellule par colonne, dans l'ordre de `columns`. */
  cells: Type_ExportCell[]
  /** Retrait de la première cellule (sous-niveau d'une hiérarchie) : 0 par défaut. */
  depth?: number
  /** Ligne de total ou de sous-total : en gras dans Excel. */
  strong?: boolean
}

export interface Type_ExportTable {
  /** Ce que mesure le tableau : nomme le fichier et la feuille du classeur. */
  title: string
  columns: Type_ExportColumn[]
  /** Les lignes VISIBLES, dans l'ordre affiché (filtres et tri appliqués). */
  rows: Type_ExportRow[]
}

export type Type_TableExportFormat = 'xlsx' | 'csv'

const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

/** Le séparateur décimal du CSV selon la langue de l'interface (Excel en français attend la virgule). */
export const csvDecimalOf = (lang: string): '.' | ',' =>
  ['en', 'zh-CN', 'ja'].includes(lang) ? '.' : ','

/** Un nom de fichier sûr sous Windows, tiré du titre. */
export const tableFileName = (title: string, format: Type_TableExportFormat): string =>
  `${title.replace(/[\\/:*?"<>|]+/g, '_').trim() || 'table'}.${format}`

const isNumber = (v: Type_ExportCell): v is number => typeof v === 'number' && Number.isFinite(v)

// ── CSV ──────────────────────────────────────────────────────────────────────────────────────────

/**
 * Le CSV du tableau. Séparateur `;` (Excel en français l'attend), séparateur décimal au choix de
 * l'appelant, nombres à pleine précision (le CSV sert à recalculer), retrait des sous-niveaux par
 * deux espaces. SANS le BOM : c'est `tableCsvBlob` qui l'ajoute au fichier.
 */
export const tableToCsv = (table: Type_ExportTable, options: { decimal?: '.' | ',' } = {}): string => {
  const decimal = options.decimal ?? '.'
  const esc = (s: string) => /[;"\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  const cell = (v: Type_ExportCell): string => {
    if (v === null || v === undefined) return ''
    if (typeof v === 'number') return isNumber(v) ? String(v).replace('.', decimal) : ''
    return esc(v)
  }
  const header = table.columns.map(c => esc(c.label)).join(';')
  const lines = table.rows.map(r => r.cells.map((v, i) =>
    i === 0 && typeof v === 'string' && r.depth ? esc('  '.repeat(r.depth) + v) : cell(v)
  ).join(';'))
  return [header, ...lines].join('\r\n')
}

/** Le fichier CSV : UTF-8 précédé du BOM, pour qu'Excel lise les accents sans qu'on le lui dise. */
export const tableCsvBlob = (table: Type_ExportTable, options: { decimal?: '.' | ',' } = {}): Blob =>
  new Blob(['﻿' + tableToCsv(table, options)], { type: 'text/csv;charset=utf-8' })

// ── XLSX ─────────────────────────────────────────────────────────────────────────────────────────

/** Échappe un texte pour XML, en retirant les caractères de contrôle qu'XML 1.0 refuse. */
const xml = (s: string): string => s
  // eslint-disable-next-line no-control-regex
  .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F￾￿]/g, '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/** A, B, …, Z, AA, AB… : la lettre de la colonne `i` (base 0). */
export const xlsxColumnName = (i: number): string => {
  let n = i + 1
  let name = ''
  while (n > 0) {
    const r = (n - 1) % 26
    name = String.fromCharCode(65 + r) + name
    n = Math.floor((n - 1) / 26)
  }
  return name
}

/** Un nom de feuille qu'Excel accepte : 31 caractères au plus, sans `[]:*?/\`, jamais vide. */
export const xlsxSheetName = (title: string): string => {
  const name = title.replace(/[[\]:*?/\\]+/g, ' ').replace(/^'+|'+$/g, '').replace(/\s+/g, ' ').trim().slice(0, 31).trim()
  return name || 'Table'
}

/** Le format de nombre d'Excel pour `decimals` décimales, séparateur de milliers compris. */
const numberFormatCode = (decimals: number): string =>
  decimals > 0 ? `#,##0.${'0'.repeat(decimals)}` : '#,##0'

/**
 * Les styles de cellule, créés à la demande : une combinaison (format, gras, retrait) = un style.
 * L'index 0 est le style par défaut d'Excel ; l'en-tête est en gras.
 */
class XlsxStyles {
  private formats: string[] = []
  private xfs: { numFmt: number, bold: boolean, indent: number }[] = [{ numFmt: 0, bold: false, indent: 0 }]
  private keys = new Map<string, number>([['0|0|0', 0]])

  /** L'index du style ; `format` = code de format Excel, `''` pour le format général. */
  of(format: string, bold: boolean, indent: number): number {
    let numFmt = 0
    if (format !== '') {
      let i = this.formats.indexOf(format)
      if (i < 0) { this.formats.push(format); i = this.formats.length - 1 }
      numFmt = 164 + i // les formats propres commencent à 164 (0..163 sont réservés par Excel)
    }
    const key = `${numFmt}|${bold ? 1 : 0}|${indent}`
    let s = this.keys.get(key)
    if (s === undefined) {
      this.xfs.push({ numFmt, bold, indent })
      s = this.xfs.length - 1
      this.keys.set(key, s)
    }
    return s
  }

  xml(): string {
    const fmts = this.formats.length > 0
      ? `<numFmts count="${this.formats.length}">${this.formats.map((f, i) => `<numFmt numFmtId="${164 + i}" formatCode="${xml(f)}"/>`).join('')}</numFmts>`
      : ''
    const xfs = this.xfs.map(x => {
      const attrs = [`numFmtId="${x.numFmt}"`, `fontId="${x.bold ? 1 : 0}"`, 'fillId="0"', 'borderId="0"', 'xfId="0"']
      if (x.numFmt) attrs.push('applyNumberFormat="1"')
      if (x.bold) attrs.push('applyFont="1"')
      if (x.indent) return `<xf ${attrs.join(' ')} applyAlignment="1"><alignment horizontal="left" indent="${x.indent}"/></xf>`
      return `<xf ${attrs.join(' ')}/>`
    }).join('')
    return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
      fmts +
      '<fonts count="2"><font><sz val="11"/><name val="Calibri"/><family val="2"/></font>' +
      '<font><b/><sz val="11"/><name val="Calibri"/><family val="2"/></font></fonts>' +
      '<fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills>' +
      '<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>' +
      '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
      `<cellXfs count="${this.xfs.length}">${xfs}</cellXfs>` +
      '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>' +
      '</styleSheet>'
  }
}

/** Le XML de la feuille : en-tête figé en première ligne, largeurs de colonne d'après le contenu. */
const sheetXml = (table: Type_ExportTable, styles: XlsxStyles): string => {
  const header_style = styles.of('', true, 0)
  const widths = table.columns.map(c => c.label.length)
  const textCell = (ref: string, text: string, s: number) =>
    `<c r="${ref}" t="inlineStr"${s ? ` s="${s}"` : ''}><is><t xml:space="preserve">${xml(text)}</t></is></c>`

  const rows: string[] = []
  rows.push(`<row r="1">${table.columns.map((c, i) => textCell(`${xlsxColumnName(i)}1`, c.label, header_style)).join('')}</row>`)
  table.rows.forEach((r, ri) => {
    const n = ri + 2
    const cells = table.columns.map((col, ci) => {
      const v = r.cells[ci]
      const ref = `${xlsxColumnName(ci)}${n}`
      const bold = !!r.strong
      if (isNumber(v)) {
        const format = col.kind === 'share' ? '0.0%' : col.kind === 'number' ? numberFormatCode(col.decimals ?? 0) : ''
        const s = styles.of(format, bold, 0)
        widths[ci] = Math.max(widths[ci], String(Math.round(v)).length + (col.decimals ?? 0) + 3)
        return `<c r="${ref}"${s ? ` s="${s}"` : ''}><v>${v}</v></c>`
      }
      if (typeof v === 'string' && v !== '') {
        const indent = ci === 0 ? Math.min(r.depth ?? 0, 15) : 0
        widths[ci] = Math.max(widths[ci], v.length + 2 * indent)
        return textCell(ref, v, styles.of('', bold, indent))
      }
      return ''
    }).join('')
    rows.push(`<row r="${n}">${cells}</row>`)
  })
  const cols = table.columns.length > 0
    ? `<cols>${widths.map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${Math.min(60, Math.max(8, w + 2))}" customWidth="1"/>`).join('')}</cols>`
    : ''
  return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
    '<sheetViews><sheetView workbookViewId="0">' +
    '<pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/>' +
    '<selection pane="bottomLeft" activeCell="A2" sqref="A2"/>' +
    '</sheetView></sheetViews>' +
    cols +
    `<sheetData>${rows.join('')}</sheetData>` +
    '</worksheet>'
}

/** Le classeur (.xlsx), une feuille, octet par octet. */
export const tableToXlsx = (table: Type_ExportTable): Promise<Uint8Array> =>
  xlsxZip(table).generateAsync({ type: 'uint8array', compression: 'DEFLATE' })

/** Le fichier du classeur, prêt à télécharger. */
export const tableXlsxBlob = (table: Type_ExportTable): Promise<Blob> =>
  xlsxZip(table).generateAsync({ type: 'blob', compression: 'DEFLATE', mimeType: XLSX_MIME })

/** Les parties du classeur, une feuille : le paquet OOXML minimal. */
const xlsxZip = (table: Type_ExportTable): JSZip => {
  const styles = new XlsxStyles()
  const sheet = sheetXml(table, styles)
  const zip = new JSZip()
  zip.file('[Content_Types].xml',
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
    '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
    '<Default Extension="xml" ContentType="application/xml"/>' +
    '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
    '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>' +
    '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
    '</Types>')
  zip.file('_rels/.rels',
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>' +
    '</Relationships>')
  zip.file('xl/workbook.xml',
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
    `<sheets><sheet name="${xml(xlsxSheetName(table.title))}" sheetId="1" r:id="rId1"/></sheets>` +
    '</workbook>')
  zip.file('xl/_rels/workbook.xml.rels',
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>' +
    '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>' +
    '</Relationships>')
  zip.file('xl/worksheets/sheet1.xml', sheet)
  zip.file('xl/styles.xml', styles.xml())
  return zip
}

// ── TÉLÉCHARGER ──────────────────────────────────────────────────────────────────────────────────

const saveBlob = (blob: Blob, file_name: string) => {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = file_name
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 0)
}

/** Télécharge le tableau au format demandé ; le fichier se nomme d'après le titre du tableau. */
export const downloadTable = async (
  table: Type_ExportTable,
  format: Type_TableExportFormat,
  options: { decimal?: '.' | ',' } = {}
): Promise<void> => {
  const blob = format === 'xlsx' ? await tableXlsxBlob(table) : tableCsvBlob(table, options)
  saveBlob(blob, tableFileName(table.title, format))
}

// ── LES BOUTONS ──────────────────────────────────────────────────────────────────────────────────

/**
 * Pose les deux boutons d'export (Excel, CSV) dans l'en-tête d'un tableau ; rend leur démontage.
 * L'en-tête est celui du TABLEAU, dans le corps de la figure, et non celui du volet : en
 * publication, l'en-tête des volets est masqué (`publish_options.canvas_header`), et le lecteur
 * doit pouvoir exporter.
 */
export const appendTableExportButtons = (
  parent: HTMLElement,
  o: {
    /** Infobulles déjà traduites. */
    titles: { xlsx: string, csv: string }
    on_export: (format: Type_TableExportFormat) => void
  }
): (() => void) => {
  const group = document.createElement('div')
  group.className = 'table_export'
  Object.assign(group.style, { display: 'flex', gap: '4px', flex: '0 0 auto' })
  const buttons = (['xlsx', 'csv'] as Type_TableExportFormat[]).map(format => {
    const button = document.createElement('button')
    button.type = 'button'
    button.className = `table_export_${format}`
    button.textContent = format === 'xlsx' ? 'Excel' : 'CSV'
    button.title = o.titles[format]
    button.setAttribute('aria-label', o.titles[format])
    Object.assign(button.style, {
      font: 'inherit', fontSize: '12px', padding: '2px 8px', cursor: 'pointer', borderRadius: '4px',
      border: '1px solid rgba(127,127,127,0.5)', background: 'transparent', color: 'inherit'
    })
    const click = () => o.on_export(format)
    button.addEventListener('click', click)
    group.appendChild(button)
    return { button, click }
  })
  parent.appendChild(group)
  return () => {
    buttons.forEach(({ button, click }) => button.removeEventListener('click', click))
    group.remove()
  }
}
