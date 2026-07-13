# -*- coding: utf-8 -*-
"""Generate the exact orders Alexandre's rule produces, to hard-code as test
assertions. Mirrors ioOrderGeometry.ts orderKey exactly."""
import sys
sys.path.insert(0, ".")
import io_order_analysis as A

def alex_order(rows, nx, ny):
    # rows: list of (id, side, ox, oy, curve_node)
    def key(r):
        _id, side, ox, oy, cn = r
        horiz = side in ('left', 'right')
        stack = (oy - ny) if horiz else (ox - nx)
        reach = abs((ox - nx) if horiz else (oy - ny))
        anchor = reach * cn
        up = stack < 0
        srank = {'right': 0, 'bottom': 1, 'left': 2, 'top': 3}[side]
        return (srank, 0 if up else 1, anchor if up else -anchor, stack)
    return [r[0] for r in sorted(rows, key=key)]

# --- synthetic cases (curve_node default 0.05 unless given) ---
cases = {
    "right targets below": (
        [('Viande', 'right', 1664, 455, .05), ('Porcs', 'right', 839, 877, .05),
         ('Abats', 'right', 1662, 888, .05), ('Coches', 'right', 837, 1377, .05)], 460, 191),
    "mixed directions": (
        [('farDown', 'right', 2000, 300, .05), ('closeUp', 'right', 500, -100, .05),
         ('closeDown', 'right', 500, 100, .05), ('farUp', 'right', 2000, -300, .05)], 0, 0),
    "bottom stacked": (
        [('C2', 'bottom', 1902, 1188, .05), ('C3', 'bottom', 1920, 1419, .05)], 772, 327),
    "top stacked": (
        [('C2', 'top', 2128, 1407, .05), ('C3', 'top', 2119, 1626, .05)], 2231, 1771),
    "drag base": (
        [('high', 'left', 2420, 1400, .05), ('low', 'left', 2420, 1600, .05)], 2928, 1737),
    "drag dragged": (
        [('high', 'left', 2420, 1400, .6), ('low', 'left', 2420, 1600, .05)], 2928, 1737),
    "single column": (
        [('b', 'right', 1000, 300, .05), ('a', 'right', 1010, 100, .05), ('c', 'right', 1005, 200, .05)], 0, 0),
    "cross-side": (
        [('top', 'top', 0, -500, .05), ('left', 'left', -500, 0, .05),
         ('right', 'right', 500, 0, .05), ('bottom', 'bottom', 0, 500, .05)], 0, 0),
}
for name, (rows, nx, ny) in cases.items():
    print("%-22s -> %s" % (name, alex_order(rows, nx, ny)))

# --- real nodes from fixtures ---
def real(path, node_id, side):
    d = A.load(path); nodes, links = d["nodes"], d["links"]
    n = nodes[node_id]; nx, ny = n["x"], n["y"]
    rows = []
    for lid in n.get("inputLinksId", []) + n.get("outputLinksId", []):
        if lid not in links: continue
        l = links[lid]; loc = l.get("local", {})
        if loc.get("shape_is_recycling"): continue
        is_src = (l["idSource"] == node_id)
        other = l["idTarget"] if is_src else l["idSource"]
        if "echange" in nodes.get(other, {}).get("tags", {}).get("type de noeud", []): continue
        o = nodes[other]
        if A.side_of(nx, ny, o["x"], o["y"]) != side: continue
        cn = (loc.get("shape_starting_curve") if is_src else loc.get("shape_ending_curve"))
        cn = 0.05 if cn is None else cn
        rows.append((o.get("name", other), side, o["x"], o["y"], cn))
    return rows, nx, ny

print()
rows, nx, ny = real("SOCLE_Vin_Detail_par_segment.gz", "AutresIaa", "left")
print("AUTRES IAA node=(%.4f,%.4f):" % (nx, ny))
for r in rows: print("   ", r)
print("  ORDER:", alex_order(rows, nx, ny))
print()
rows, nx, ny = real("ovin_caprin.gz", "Exportations", "left")
print("EXPORTATIONS node=(%.4f,%.4f):" % (nx, ny))
for r in rows: print("   ", r)
print("  ORDER:", alex_order(rows, nx, ny))
