# -*- coding: utf-8 -*-
"""Detailed look at ONE node/side: flows, and several candidate orders with crossings,
to understand why C0 fails where the stored order reaches 0."""
import sys, math, itertools
sys.path.insert(0, ".")
import io_order_analysis as A

DIR = 1000.0
d = A.load(sys.argv[1]); NID = sys.argv[2]; SIDE = sys.argv[3]
nodes, links = d["nodes"], d["links"]
n = nodes[NID]; nx, ny = n["x"], n["y"]
# diagram span
xs = [nd["x"] for nd in nodes.values()]; ys = [nd["y"] for nd in nodes.values()]
span_x = max(xs) - min(xs); span_y = max(ys) - min(ys)

flows = A.collect_side(d, NID, SIDE)
name2i = {f["name"]: i for i, f in enumerate(flows)}
ec = lambda f: A._ecart_midpoint(f) or 1e-9

def C0(fl):
    key = lambda f: (0.0 if f["du"] < 0 else DIR) + math.atan2(f["du"], ec(f))
    return sorted(range(len(fl)), key=lambda i: key(fl[i]))
def C1(fl):
    def k(i):
        f = fl[i]; up = f["du"] < 0
        return (0.0 if up else DIR, ec(f) if up else -ec(f), f["du"])
    return sorted(range(len(fl)), key=k)
def R205(fl):  # historical: angle - sign(angle)*(|reach|*curve/span)
    sp = span_x if SIDE in ("left", "right") else span_y
    def k(i):
        f = fl[i]; ang = math.atan2(f["du"], f["vo"])
        within = ang - (1 if ang > 0 else -1 if ang < 0 else 0) * (f["vo"] * (f["ce"]/0.05) / max(1, sp))
        return (0.0 if f["du"] < 0 else DIR) + within
    return sorted(range(len(fl)), key=k)

def stored_order():
    order = n.get("links_order") or (n.get("inputLinksId", []) + n.get("outputLinksId", []))
    out = []
    for lid in order:
        if lid not in links: continue
        l = links[lid]; loc = l.get("local", {})
        if loc.get("shape_is_recycling"): continue
        o = l["idSource"] if l["idTarget"] == NID else l["idTarget"]
        if "echange" in nodes.get(o, {}).get("tags", {}).get("type de noeud", []): continue
        if A.side_of(nx, ny, nodes[o]["x"], nodes[o]["y"]) != SIDE: continue
        out.append(name2i[nodes[o].get("name", o)])
    return out

print("%s / %s  (span_x=%.0f span_y=%.0f)" % (NID, SIDE, span_x, span_y))
print("flows sorted by du (source stacking pos):")
for i in sorted(range(len(flows)), key=lambda i: flows[i]["du"]):
    f = flows[i]
    print("  %-30s du=%+6.0f vo=%5.0f ce=%.3f cs=%.3f ecart=%6.1f angle=%+.2f" %
          (f["name"], f["du"], f["vo"], f["ce"], f["cs"], ec(f), math.atan2(f["du"], f["vo"])))

for label, order in [("C0", C0(flows)), ("C1", C1(flows)), ("R205", R205(flows)), ("STORED", stored_order())]:
    names = [flows[i]["name"] for i in order]
    print("\n%-7s cross=%d" % (label, A.count_crossings(flows, order)))
    for p, i in enumerate(order): print("   %d. %s" % (p, flows[i]["name"]))
