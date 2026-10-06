// sa#606 — fichiers joints d'une page publiée (`window.sankey.attachments`) : ce que l'auteur offre
// au téléchargement en haut de la page, sous SON libellé, dans la langue de la page. La publication
// les pose sous `attachments/` et les annonce ; le viewer n'accepte que des liens RELATIFS à la page.
import { getPublishOptions, parseAttachments, attachmentHref, attachmentLabel } from './PublishOptions'

const LABEL = { fr: 'Télécharger les données', en: 'Download the data' }

describe('sa#606 getPublishOptions — attachments', () => {
  afterEach(() => {
    delete window.sankey
    window.history.replaceState(null, '', '/')
  })

  it('page qui ne déclare rien : aucun fichier, le parc existant ne bouge pas', () => {
    window.sankey = { publish: true }
    expect(getPublishOptions().attachments).toEqual([])
  })

  it('le libellé suit la langue de la page (?lang=)', () => {
    window.sankey = { publish: true, attachments: [{ file: 'attachments/donnees.xlsx', label: LABEL }] }
    window.history.replaceState(null, '', '/?lang=en')
    expect(getPublishOptions().attachments).toEqual([
      { href: 'attachments/donnees.xlsx', label: 'Download the data' }])
    window.history.replaceState(null, '', '/?lang=fr')
    expect(getPublishOptions().attachments[0].label).toBe('Télécharger les données')
  })

  it('langue non traduite : texte sans langue, puis le français, puis le nom du fichier', () => {
    expect(attachmentLabel({ '': 'Données', en: 'Data' }, 'de', 'a.xlsx')).toBe('Données')
    expect(attachmentLabel(LABEL, 'de', 'a.xlsx')).toBe('Télécharger les données')
    expect(attachmentLabel('Notice', 'en', 'n.pdf')).toBe('Notice')
    expect(attachmentLabel(undefined, 'fr', 'attachments/n.pdf')).toBe('n.pdf')
  })

  it('un lien qui sortirait de la page est écarté', () => {
    expect(attachmentHref('attachments/donnees.xlsx')).toBe('attachments/donnees.xlsx')
    for (const bad of ['../x.xlsx', 'a/../../x.xlsx', '/etc/passwd', '\\\\hote\\x', 'https://ailleurs/x',
      'javascript:alert(1)', '', 42]) {
      expect(attachmentHref(bad)).toBeNull()
    }
    expect(parseAttachments([{ file: '../x' }, 'attachments/ok.csv', null], 'fr')).toEqual([
      { href: 'attachments/ok.csv', label: 'ok.csv' }])
  })
})
