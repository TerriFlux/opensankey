# -*- coding: utf-8 -*-
"""Sweep every node/side of the fixture with the reference oracle: policy crossings
vs brute-force optimum (n<=8) vs the stored #205 order crossings. Flags regressions
(policy worse than the stored order) and confirms true zeros."""
import sys, itertools
sys.path.insert(0, ".")
import io_order_analysis as A

data = A.load(sys.argv[1])
nodes, links = data["nodes"], data["links"]

def stored_order_names(node_id, side):
    """The rendered order (#205) for one side: links in their stored links_order,
    filtered to that side's middle flows, as source names."""
    n = nodes[node_id]
    nx, ny = n["x"], n["y"]
    def is_ech(nid):
        return "echange" in nodes.get(nid, {}).get("tags", {}).get("type de noeud", [])
    order = n.get("links_order") or (n.get("inputLinksId", []) + n.get("outputLinksId", []))
    names = []
    for lid in order:
        if lid not in links: continue
        l = links[lid]; loc = l.get("local", {})
        if loc.get("shape_is_recycling"): continue
        other = l["idSource"] if l["idTarget"] == node_id else l["idTarget"]
        if is_ech(other): continue
        if A.side_of(nx, ny, nodes[other]["x"], nodes[other]["y"]) != side: continue
        names.append(nodes[other].get("name", other))
    return names

problems = []
zeros = []
for nid, n in nodes.items():
    for side in ('left', 'right', 'top', 'bottom'):
        flows = A.collect_side(data, nid, side)
        if len(flows) < 2: continue
        name2i = {f["name"]: i for i, f in enumerate(flows)}
        pol = A.proposed_order(flows)
        pol_c = A.count_crossings(flows, pol)
        n_flows = len(flows)
        opt = None
        if n_flows <= 8:
            opt = min(A.count_crossings(flows, list(p)) for p in itertools.permutations(range(n_flows)))
        # stored #205 order crossings
        stored_names = stored_order_names(nid, side)
        st_c = None
        if len(stored_names) == n_flows and all(sn in name2i for sn in stored_names):
            st_c = A.count_crossings(flows, [name2i[sn] for sn in stored_names])
        tag = ""
        if opt is not None and pol_c > opt: tag += " POLICY>OPT"
        if st_c is not None and pol_c > st_c: tag += " POLICY>STORED"
        if pol_c == 0: zeros.append((n.get("name", nid), side, n_flows))
        line = "%-26s %-6s n=%-2d policy=%-2s opt=%-4s stored205=%-4s%s" % (
            (n.get("name", nid))[:26], side, n_flows, pol_c,
            (opt if opt is not None else "n/a"), (st_c if st_c is not None else "n/a"), tag)
        if tag: problems.append(line)
        # print everything with >=3 flows to see the panel
        if n_flows >= 3:
            print(line)

print("\n=== REGRESSIONS (policy worse than optimum or stored) ===")
for p in problems: print(p)
if not problems: print("(none)")
print("\n=== TRUE ZEROS (policy = 0 crossings) ===")
for z in zeros: print("  %-28s %-6s n=%d" % z)
