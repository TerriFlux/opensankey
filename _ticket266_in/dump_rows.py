# -*- coding: utf-8 -*-
"""Emit ready-to-paste make() rows (id, side, ox, oy, curve_node, curve_opposite)
for given (node name, side) pairs, plus the node centre and brute optimum."""
import gzip, json, sys, itertools
sys.path.insert(0, ".")
import io_order_analysis as A

data = A.load(sys.argv[1])
nodes, links = data["nodes"], data["links"]
name2id = {}
for nid, n in nodes.items():
    name2id.setdefault(n.get("name", nid), nid)

def is_ech(nid):
    return "echange" in nodes.get(nid, {}).get("tags", {}).get("type de noeud", [])

targets = [("Disponibilités rouge", "right"), ("Exportations", "top")]
for name, side in targets:
    nid = name2id[name]
    n = nodes[nid]; nx, ny = n["x"], n["y"]
    print("// %s (%s) — node centre (%.4f, %.4f)" % (name, side, nx, ny))
    flows = A.collect_side(data, nid, side)
    opt = None
    if len(flows) <= 8:
        opt = min(A.count_crossings(flows, list(p)) for p in itertools.permutations(range(len(flows))))
    pol = A.count_crossings(flows, A.proposed_order(flows))
    print("//   n=%d  policy=%d  brute_optimum=%s" % (len(flows), pol, opt))
    for lid in n.get("inputLinksId", []) + n.get("outputLinksId", []):
        if lid not in links: continue
        l = links[lid]; loc = l.get("local", {})
        if loc.get("shape_is_recycling"): continue
        is_source = (l["idSource"] == nid)
        other = l["idTarget"] if is_source else l["idSource"]
        if is_ech(other): continue
        o = nodes[other]
        if A.side_of(nx, ny, o["x"], o["y"]) != side: continue
        cs = loc.get("shape_starting_curve"); ce = loc.get("shape_ending_curve")
        cn = (cs if is_source else ce); co = (ce if is_source else cs)
        cn_s = "" if cn is None else (", %s" % cn)
        co_s = "" if co is None else (", %s" % co)
        # if only opposite is set we still must pass node first; emit explicit 0.05 when needed
        if cn is None and co is not None:
            cn_s = ", 0.05"
        print("      ['%s', '%s', %.4f, %.4f%s%s]," % (
            o.get("name", other), side, o["x"], o["y"], cn_s, co_s))
    print()
