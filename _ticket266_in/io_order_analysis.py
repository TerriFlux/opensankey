# -*- coding: utf-8 -*-
"""
io_order_analysis.py  --  reference implementation for sankeyapplication issue
"Ordre auto des flux E/S (#205) : critère milieu des poignées cote noeud".

Two things the dev can reuse as a TEST ORACLE:
  1. proposed_order(...)  -- the replacement ordering criterion (user's proposal):
     within a direction group, sort by atan2(dy, ecart) where `ecart` is the
     x-gap (v-gap for top/bottom sides) from the reorganized node to the MIDPOINT
     of that link's two node-side handles (ending_curve_point + ending_bezier_point).
     Guard fixed: shape_ending_curve == 0 is KEPT (not coerced to the 0.05 default).
  2. count_crossings(...) -- a faithful geometric crossing counter (OpenSankey S-curve
     path, sampled Bezier). Use it to assert an order has <= the crossings of the
     current heuristic. NB: exact counts are model-approximate (source anchor ~ node
     center; default tangents 0.25) -- validate the residual on tangled fans in the
     REAL renderer. A model "0" is a true 0.

Run:  python io_order_analysis.py "Détail par segment.gz"   (reproduces Autres IAA)
"""
import gzip, json, math, sys, itertools

ST = ET = 0.25          # shape_starting/ending_tangeant defaults (ElementsAttributesConfig)
DEFAULT_CURVE = 0.05    # shape_starting/ending_curve default
DIR = 1000.0

def load(path):
    op = gzip.open if path.endswith(".gz") else open
    with op(path, "rt", encoding="utf-8") as f:
        return json.load(f)

def side_of(nx, ny, ox, oy):
    dx, dy = ox - nx, oy - ny
    return ('right' if dx > 0 else 'left') if abs(dx) >= abs(dy) else ('bottom' if dy > 0 else 'top')

def collect_side(data, node_id, side):
    """Middle (non-echange, non-recycling) flows attaching on `side`, in a
    (u=stack, v=reach>=0 toward opposite) frame centered on the node."""
    nodes, links = data["nodes"], data["links"]
    n = nodes[node_id]; nx, ny = n["x"], n["y"]
    u_center = ny if side in ('left', 'right') else nx
    def is_ech(nid): return "echange" in nodes.get(nid, {}).get("tags", {}).get("type de noeud", [])
    def uv(px, py):
        return {'left': (py, nx - px), 'right': (py, px - nx),
                'top': (px, ny - py), 'bottom': (px, py - ny)}[side]
    out = []
    for lid in n.get("inputLinksId", []) + n.get("outputLinksId", []):
        if lid not in links: continue
        l = links[lid]; loc = l.get("local", {})
        if loc.get("shape_is_recycling"): continue
        other = l["idSource"] if l["idTarget"] == node_id else l["idTarget"]
        if is_ech(other): continue
        o = nodes[other]
        if side_of(nx, ny, o["x"], o["y"]) != side: continue
        uo, vo = uv(o["x"], o["y"])
        ce = loc.get("shape_ending_curve");   ce = DEFAULT_CURVE if ce is None else ce   # 0 KEPT
        cs = loc.get("shape_starting_curve"); cs = DEFAULT_CURVE if cs is None else cs
        out.append(dict(name=nodes[other].get("name", other), du=uo - u_center, vo=abs(vo), ce=ce, cs=cs))
    return out

# --- 1. the proposed ordering criterion -------------------------------------
def _ecart_midpoint(f):
    vo = f["vo"]
    v1 = vo - vo * f["cs"]          # starting_curve_point (near opposite)
    v5 = vo * f["ce"]               # ending_curve_point   (near node)  -- "1st handle"
    v4 = v5 + (v1 - v5) * ET        # ending_bezier_point  (near node)  -- "2nd handle"
    return (v5 + v4) / 2.0          # midpoint of the two node-side handles

def proposed_order(flows):
    grp = lambda f: 0.0 if f["du"] < 0 else DIR      # hard direction split (up/down resp. left/right)
    key = lambda f: grp(f) + math.atan2(f["du"], _ecart_midpoint(f) or 1e-9)
    return sorted(range(len(flows)), key=lambda i: key(flows[i]))

# --- 2. faithful crossing counter (OpenSankey S-curve, sampled) -------------
def _path(f, slot, samples=16):
    uo, vo = f["du"], f["vo"]
    v1 = vo - vo * f["cs"]; v5 = vo * f["ce"]; v2 = v1 + (v5 - v1) * ST; v4 = v5 + (v1 - v5) * ET
    P0, P1, P2, P3 = (uo, v1), (uo, v2), (slot, v4), (slot, v5)
    pts = [(uo, vo)]
    for i in range(samples + 1):
        t = i / samples; mt = 1 - t
        pts.append((mt**3*P0[0] + 3*mt*mt*t*P1[0] + 3*mt*t*t*P2[0] + t**3*P3[0],
                    mt**3*P0[1] + 3*mt*mt*t*P1[1] + 3*mt*t*t*P2[1] + t**3*P3[1]))
    pts.append((slot, 0.0))
    return pts

def _seg(p1, p2, p3, p4):
    ccw = lambda a, b, c: (c[1]-a[1])*(b[0]-a[0]) - (b[1]-a[1])*(c[0]-a[0])
    return ((ccw(p3,p4,p1) > 0) != (ccw(p3,p4,p2) > 0)) and ((ccw(p1,p2,p3) > 0) != (ccw(p1,p2,p4) > 0))

def count_crossings(flows, order_idx, W=200.0):
    n = len(order_idx); slots = [-W/2 + (p*(W/(n-1)) if n > 1 else 0) for p in range(n)]
    poly = {order_idx[p]: _path(flows[order_idx[p]], slots[p]) for p in range(n)}
    c = 0
    for p in range(n):
        for q in range(p+1, n):
            A, B = poly[order_idx[p]], poly[order_idx[q]]
            if any(_seg(A[i], A[i+1], B[j], B[j+1]) for i in range(len(A)-1) for j in range(len(B)-1)):
                c += 1
    return c

if __name__ == "__main__":
    path = sys.argv[1] if len(sys.argv) > 1 else "Détail par segment.gz"
    data = load(path)
    flows = collect_side(data, "AutresIaa", "left")
    order = proposed_order(flows)
    print("AutresIaa left side, proposed order (extremity->extremity):")
    for i in order: print("   ", flows[i]["name"])
    print("crossings, proposed order :", count_crossings(flows, order))
    # brute-force optimum for this small fan:
    opt = min(count_crossings(flows, list(p)) for p in itertools.permutations(range(len(flows))))
    print("crossings, brute optimum  :", opt)
