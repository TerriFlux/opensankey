import { Class_NodeTagGroup } from './TagGroup'
import type { Class_Sankey } from './Sankey'

// Minimal stand-in: a tag group only touches sankey.nodeTagsUpdated() when a
// tag is (un)selected. Everything else under test stays inside the group.
const fakeSankey = { nodeTagsUpdated: () => { /* no-op */ } } as unknown as Class_Sankey

function makeGroup(
  id: string,
  name: string,
  tags: Array<[string, string]> // [tag_id, tag_name]
): Class_NodeTagGroup {
  const group = new Class_NodeTagGroup(id, name, fakeSankey, false)
  tags.forEach(([tag_id, tag_name]) => group.addTag(tag_name, tag_id))
  return group
}

// Regression guard for the "Aucune sélection" bug: updateFromJSON matches two
// node-tag groups by NAME even when their group id AND tag ids differ (e.g. a
// JSON whose tags were renamed). _copyFrom used to overwrite tags_order with the
// SOURCE's tag ids, which — since tags_list is derived from tags_order — emptied
// tags_list, so the sync loops ran on nothing and every tag was orphaned
// (exported as tags={}). Tags must be preserved instead.
describe('AFMBase Class_NodeTagGroup.copyFrom — renamed group preserves tags', () => {
  it('keeps tags when matched group + tags share names but differ by id', () => {
    const current = makeGroup('matieres', 'Matières', [
      ['biomasse', 'Biomasse'],
      ['metal', 'Metal'],
    ])
    const source = makeGroup('extraction', 'Matières', [
      ['mf1 biomass', 'Biomasse'],
      ['mf2 metal', 'Metal'],
    ])
    // current_tag_id -> source_tag_id, as updateFrom builds it by matching names.
    const matching_tags_id = { biomasse: 'mf1 biomass', metal: 'mf2 metal' }

    current.copyFrom(source, matching_tags_id)

    // Bug: current.tags_list became []. Fix: the current ids survive, in the
    // source's order, with attributes copied over.
    expect(current.tags_list.map(t => t.id)).toEqual(['biomasse', 'metal'])
    expect(current.tags_list.map(t => t.name)).toEqual(['Biomasse', 'Metal'])
  })

  it('still syncs when ids are identical (no matching map needed)', () => {
    const current = makeGroup('g', 'G', [['a', 'A'], ['b', 'B']])
    const source = makeGroup('g2', 'G', [['a', 'A'], ['b', 'B'], ['c', 'C']])

    current.copyFrom(source, {})

    expect(current.tags_list.map(t => t.id)).toEqual(['a', 'b', 'c'])
  })
})
