# -*- coding: utf-8 -*-
"""Search hybrid criteria that keep C0's multi-column strength AND fix Exportations.
Key insight: order by ecart, but tie-break by angle when ecarts are close
(=> log(ecart) primary + atan2 fine). Report totals on both fixtures + regressions."""
import sys, math, itertools
sys.path.insert(0, ".")
import io_order_analysis as A

DIR = 1000.0
FIX = ["SOCLE_Vin_Detail_par_segment.gz", "ovin_caprin.gz"]
ec = lambda f: A._ecart_midpoint(f) or 1e-9

def C0(fl):
    key = lambda f: (0.0 if f["du"] < 0 else DIR) + math.atan2(f["du"], ec(f))
    return sorted(range(len(fl)), key=lambda i: key(fl[i]))

def make_hlog(w):
    # tuple key: (grp, oriented log(ecart) scaled, atan2 tie). w scales the atan2 weight
    def crit(fl):
        def k(i):
            f = fl[i]; up = f["du"] < 0
            grp = 0 if up else 1
            le = math.log(ec(f))
            return (grp, le if up else -le, w * math.atan2(f["du"], ec(f)))
        return sorted(range(len(fl)), key=k)
    return crit

def make_blend(a):
    # continuous blend: atan2(du, ecart) but push toward middle by a*log(ecart)
    def crit(fl):
        def key(f):
            up = f["du"] < 0
            grp = 0.0 if up else DIR
            base = math.atan2(f["du"], ec(f))
            push = a * math.log(ec(f))           # bigger ecart -> more toward middle
            return grp + base + (push if up else -push)
        return sorted(range(len(fl)), key=lambda i: key(fl[i]))
    return crit

CRITS = [
    ("C0", C0),
    ("Hlog", make_hlog(1e-6)),        # ecart(log) primary, angle pure tie
    ("Hlog_w.05", make_hlog(0.05)),
    ("blend.3", make_blend(0.3)),
    ("blend.6", make_blend(0.6)),
    ("blend1.0", make_blend(1.0)),
]

def stored_cross(d, nid, side, flows, name2i):
    nodes, links = d["nodes"], d["links"]; n = nodes[nid]; nx, ny = n["x"], n["y"]
    order = n.get("links_order") or (n.get("inputLinksId", []) + n.get("outputLinksId", []))
    out = []
    for lid in order:
        if lid not in links: continue
        l = links[lid]; loc = l.get("local", {})
        if loc.get("shape_is_recycling"): continue
        o = l["idSource"] if l["idTarget"] == nid else l["idTarget"]
        if "echange" in nodes.get(o, {}).get("tags", {}).get("type de noeud", []): continue
        if A.side_of(nx, ny, nodes[o]["x"], nodes[o]["y"]) != side: continue
        out.append(nodes[o].get("name", o))
    if len(out) == len(flows) and all(s in name2i for s in out):
        return A.count_crossings(flows, [name2i[s] for s in out])
    return None

grand = {name: 0 for name, _ in CRITS}
regress = {name: [] for name, _ in CRITS}
for path in FIX:
    d = A.load(path)
    for nid, n in d["nodes"].items():
        for side in ("left", "right", "top", "bottom"):
            flows = A.collect_side(d, nid, side)
            if len(flows) < 2: continue
            name2i = {f["name"]: i for i, f in enumerate(flows)}
            stc = stored_cross(d, nid, side, flows, name2i)
            base = A.count_crossings(flows, C0(flows))
            for name, fn in CRITS:
                c = A.count_crossings(flows, fn(flows))
                grand[name] += c
                # regression vs the better of (C0, stored)
                ref = min([x for x in (base, stc) if x is not None])
                if c > ref:
                    regress[name].append("%s/%s %d>%d" % (n.get("name", nid)[:16], side, c, ref))

print("GRAND TOTALS (Vin+ovin, lower=better):")
for name, _ in CRITS:
    print("  %-12s total=%-4d  regressions_vs_best(C0,stored)=%d" % (name, grand[name], len(regress[name])))
print("\nExportations (ovin) specifically:")
d = A.load("ovin_caprin.gz"); flows = A.collect_side(d, "Exportations", "left")
for name, fn in CRITS:
    print("  %-12s cross=%d" % (name, A.count_crossings(flows, fn(flows))))
print("\nAutres IAA (Vin) specifically:")
d = A.load("SOCLE_Vin_Detail_par_segment.gz"); flows = A.collect_side(d, "AutresIaa", "left")
for name, fn in CRITS:
    print("  %-12s cross=%d" % (name, A.count_crossings(flows, fn(flows))))
print("\nDisponibilites rouge right (multi-col) :")
flows = A.collect_side(d, [k for k, v in d["nodes"].items() if v.get("name") == "Disponibilités rouge"][0], "right")
for name, fn in CRITS:
    print("  %-12s cross=%d" % (name, A.count_crossings(flows, fn(flows))))
