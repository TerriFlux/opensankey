import * as fs from 'fs'
import * as path from 'path'
import { zodToJsonSchema } from 'zod-to-json-schema'

import { sankeyRootSchema } from './sankeyFormatSchema'

// #253 — Le JSON Schema publié (`sankey.schema.json`) est GÉNÉRÉ depuis le schéma
// zod `sankeyRootSchema` (source de vérité unique). Ce test garantit qu'il reste
// synchronisé : il échoue si le zod a changé sans régénérer l'artefact.
//
// Pour régénérer : `UPDATE_FORMAT_SCHEMA=1 pnpm --filter @terriflux/opensankey run test -- sankeyFormatSchema`
// (ou lancer ce fichier avec la variable d'env positionnée).

const SCHEMA_PATH = path.join(__dirname, 'sankey.schema.json')

function generate(): unknown {
  return zodToJsonSchema(sankeyRootSchema, {
    name: 'SankeyRoot',
    target: 'jsonSchema7',
    $refStrategy: 'none',
  })
}

describe('#253 — JSON Schema généré depuis le schéma zod', () => {
  it('produit un JSON Schema draft-07 avec la définition SankeyRoot', () => {
    const schema = generate() as Record<string, unknown>
    expect(schema.$schema).toContain('json-schema.org')
    expect(schema).toHaveProperty('definitions.SankeyRoot')
  })

  it('reste synchronisé avec sankey.schema.json publié', () => {
    const generated = JSON.stringify(generate(), null, 2) + '\n'
    if (process.env.UPDATE_FORMAT_SCHEMA) {
      fs.writeFileSync(SCHEMA_PATH, generated, 'utf-8')
      return
    }
    // Fins de ligne normalisées : sur Windows le checkout convertit l'artefact en CRLF alors que
    // la génération produit des \n — sans ça le test échoue hors CI Linux.
    const committed = fs.existsSync(SCHEMA_PATH)
      ? fs.readFileSync(SCHEMA_PATH, 'utf-8').replace(/\r\n/g, '\n')
      : ''
    expect(generated).toEqual(committed)
  })
})
