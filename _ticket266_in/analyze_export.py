# -*- coding: utf-8 -*-
import sys, itertools
sys.path.insert(0, ".")
import io_order_analysis as A

d = A.load(sys.argv[1] if len(sys.argv) > 1 else "ovin_caprin.gz")
nodes, links = d["nodes"], d["links"]
NID = "Exportations"
n = nodes[NID]
print("Exportations : x=%.1f y=%.1f" % (n["x"], n["y"]))

def stored_names(side):
    nx, ny = n["x"], n["y"]
    order = n.get("links_order") or (n.get("inputLinksId", []) + n.get("outputLinksId", []))
    out = []
    for lid in order:
        if lid not in links: continue
        l = links[lid]; loc = l.get("local", {})
        if loc.get("shape_is_recycling"): continue
        o = l["idSource"] if l["idTarget"] == NID else l["idTarget"]
        if "echange" in nodes.get(o, {}).get("tags", {}).get("type de noeud", []): continue
        if A.side_of(nx, ny, nodes[o]["x"], nodes[o]["y"]) != side: continue
        out.append(nodes[o].get("name", o))
    return out

for side in ("left", "right", "top", "bottom"):
    flows = A.collect_side(d, NID, side)
    if len(flows) < 2: continue
    print("\n=== side %s : %d flows ===" % (side, len(flows)))
    for f in sorted(flows, key=lambda f: f["du"]):
        print("  %-34s du=%+6.0f vo=%5.0f ce=%.4f cs=%.4f  ecart=%6.1f" %
              (f["name"], f["du"], f["vo"], f["ce"], f["cs"], A._ecart_midpoint(f)))
    name2i = {f["name"]: i for i, f in enumerate(flows)}
    pol = A.proposed_order(flows)
    print("  POLICY : cross=%d  order=%s" % (A.count_crossings(flows, pol), [flows[i]["name"] for i in pol]))
    sn = stored_names(side)
    if len(sn) == len(flows) and all(s in name2i for s in sn):
        print("  STORED : cross=%d  order=%s" % (A.count_crossings(flows, [name2i[s] for s in sn]), sn))
    if len(flows) <= 9:
        best, bestc = None, 99
        for p in itertools.permutations(range(len(flows))):
            c = A.count_crossings(flows, list(p))
            if c < bestc: bestc, best = c, p
        print("  OPTIMUM: cross=%d  order=%s" % (bestc, [flows[i]["name"] for i in best]))
