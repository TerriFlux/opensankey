# -*- coding: utf-8 -*-
"""Compare ordering criteria against the crossing oracle across ALL nodes of several
fixtures. C0 = current #266 (atan2(stack, ecart)). C1 = Alexandre's proposal: within a
direction group, sort by ecart (proximity) toward the extremity, stack as tie-break.
Reports, per node/side: cross(C0), cross(C1), brute optimum (n<=8), and stored."""
import sys, itertools, math
sys.path.insert(0, ".")
import io_order_analysis as A

DIR = 1000.0

def ecart(f):
    return A._ecart_midpoint(f) or 1e-9

# --- C0 : current #266 -------------------------------------------------------
def C0(flows):
    grp = lambda f: 0.0 if f["du"] < 0 else DIR
    key = lambda f: grp(f) + math.atan2(f["du"], ecart(f))
    return sorted(range(len(flows)), key=lambda i: key(flows[i]))

# --- C1 : proximity-within-group (Alexandre) --------------------------------
# up group (du<0): small ecart -> top extremity  => sort by (+ecart), stack asc tie
# down group (du>=0): small ecart -> bottom extremity => sort by (-ecart), stack asc tie
def C1(flows):
    def key(i):
        f = flows[i]
        up = f["du"] < 0
        grp = 0.0 if up else DIR
        e = ecart(f)
        return (grp, e if up else -e, f["du"])
    return sorted(range(len(flows)), key=key)

# --- C2 : proximity primary, but signed by stack sign, atan2 as fine tie -----
def C2(flows):
    def key(i):
        f = flows[i]
        up = f["du"] < 0
        grp = 0.0 if up else DIR
        e = ecart(f)
        return (grp, e if up else -e, math.atan2(f["du"], e))
    return sorted(range(len(flows)), key=key)

CRITS = [("C0_current", C0), ("C1_prox", C1), ("C2_prox+atan", C2)]

def brute_opt(flows):
    if len(flows) > 7: return None
    best = 99
    for p in itertools.permutations(range(len(flows))):
        c = A.count_crossings(flows, list(p))
        if c < best: best = c
    return best

def stored_names(d, nid, side):
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
    return out

def scan(path, label):
    d = A.load(path)
    print("\n########## %s ##########" % label)
    tot = {name: 0 for name, _ in CRITS}
    tot["opt"] = 0; tot["n_opt"] = 0
    worse = []
    for nid, n in d["nodes"].items():
        for side in ("left", "right", "top", "bottom"):
            flows = A.collect_side(d, nid, side)
            if len(flows) < 2: continue
            name2i = {f["name"]: i for i, f in enumerate(flows)}
            cc = {name: A.count_crossings(flows, fn(flows)) for name, fn in CRITS}
            opt = brute_opt(flows)
            sn = stored_names(d, nid, side)
            st = A.count_crossings(flows, [name2i[s] for s in sn]) if len(sn) == len(flows) and all(s in name2i for s in sn) else None
            for name, _ in CRITS: tot[name] += cc[name]
            if opt is not None: tot["opt"] += opt; tot["n_opt"] += 1
            flag = ""
            if cc["C1_prox"] > cc["C0_current"]: flag += " C1>C0"
            if opt is not None and cc["C1_prox"] > opt: flag += " C1>OPT"
            if len(flows) >= 4 or flag:
                print("  %-30s %-6s n=%-2d C0=%-2d C1=%-2d C2=%-2d opt=%-4s stored=%-4s%s" % (
                    (n.get("name", nid))[:30], side, len(flows), cc["C0_current"], cc["C1_prox"], cc["C2_prox+atan"],
                    opt if opt is not None else "-", st if st is not None else "-", flag))
    print("  ---- TOTALS: " + "  ".join("%s=%d" % (name, tot[name]) for name, _ in CRITS) +
          "  opt(n=%d)=%d" % (tot["n_opt"], tot["opt"]))

scan("SOCLE_Vin_Detail_par_segment.gz", "VIN (Détail par segment)")
scan("ovin_caprin.gz", "OVIN-CAPRIN")
