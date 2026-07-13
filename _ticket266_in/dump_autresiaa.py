# -*- coding: utf-8 -*-
"""Dump exact node/link geometry for the 'Autres IAA' node from the fixture,
as ready-to-paste test rows (id, side, ox, oy, curve_node, curve_opposite)."""
import gzip, json, sys

def load(path):
    op = gzip.open if path.endswith(".gz") else open
    with op(path, "rt", encoding="utf-8") as f:
        return json.load(f)

data = load(sys.argv[1])
nodes, links = data["nodes"], data["links"]
NID = "AutresIaa"
n = nodes[NID]
nx, ny = n["x"], n["y"]
print("NODE AutresIaa : x=%s y=%s  name=%r" % (nx, ny, n.get("name")))
print("tags:", n.get("tags", {}))
print()

def is_ech(nid):
    return "echange" in nodes.get(nid, {}).get("tags", {}).get("type de noeud", [])

def side_of(nx, ny, ox, oy):
    dx, dy = ox - nx, oy - ny
    return ('right' if dx > 0 else 'left') if abs(dx) >= abs(dy) else ('bottom' if dy > 0 else 'top')

for lid in n.get("inputLinksId", []) + n.get("outputLinksId", []):
    if lid not in links:
        continue
    l = links[lid]
    loc = l.get("local", {})
    is_source = (l["idSource"] == NID)
    other = l["idTarget"] if is_source else l["idSource"]
    o = nodes[other]
    ox, oy = o["x"], o["y"]
    side = side_of(nx, ny, ox, oy)
    # curve on THIS node's side vs opposite side, honouring the input/output sense
    cs = loc.get("shape_starting_curve")
    ce = loc.get("shape_ending_curve")
    curve_node = (cs if is_source else ce)
    curve_opp = (ce if is_source else cs)
    print("id=%-28r side=%-6s ox=%-6s oy=%-6s curve_node=%s curve_opposite=%s  recycling=%s echange=%s"
          % (o.get("name", other), side, ox, oy, curve_node, curve_opp,
             loc.get("shape_is_recycling"), is_ech(other)))
