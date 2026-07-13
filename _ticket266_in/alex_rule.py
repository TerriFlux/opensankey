# -*- coding: utf-8 -*-
"""Alexandre's proposed rule, tested precisely with the oracle on both fixtures.
Rule: (1) split by opposite-node centre (up-going above down-going). (2) within a
group, sort by the x-distance of the flow's node-side ANCHOR to the reorg node,
ascending for the up group / descending for the down group; tie-break by the
opposite node's y. We test several readings of 'anchor x-distance'."""
import sys, math
sys.path.insert(0, ".")
import io_order_analysis as A
DIR = 1000.0
ec = lambda f: A._ecart_midpoint(f) or 1e-9

# anchor-distance readings (all in the reach>=0 frame toward the opposite node)
AD = {
    "reach*ce": lambda f: f["vo"] * f["ce"],                    # ending_curve_point distance
    "reach*ce/2": lambda f: f["vo"] * f["ce"] / 2,             # midpoint node-anchor..curve-handle
    "midpoints(ecart)": lambda f: ec(f),                       # my #266 ecart (2 handles)
    "reach": lambda f: f["vo"],                                # raw source x-distance
}

def make_alex(adname, tie_sign=+1):
    ad = AD[adname]
    def crit(flows):
        def key(i):
            f = flows[i]; up = f["du"] < 0
            grp = 0 if up else 1
            d = ad(f)
            primary = d if up else -d          # up: asc ; down: desc
            return (grp, primary, tie_sign * f["du"])
        return sorted(range(len(flows)), key=key)
    return crit

def C0(flows):
    return sorted(range(len(flows)), key=lambda i: (0.0 if flows[i]["du"] < 0 else DIR) + math.atan2(flows[i]["du"], ec(flows[i])))

CRITS = [("C0", C0)]
for nm in AD:
    CRITS.append(("Alex[%s]" % nm, make_alex(nm)))

def total_and_key(fn):
    dv = A.load("SOCLE_Vin_Detail_par_segment.gz"); do = A.load("ovin_caprin.gz")
    t = 0
    for d in (dv, do):
        for nid, n in d["nodes"].items():
            for s in ("left", "right", "top", "bottom"):
                fl = A.collect_side(d, nid, s)
                if len(fl) >= 2: t += A.count_crossings(fl, fn(fl))
    def one(d, name, side):
        nid = [k for k, v in d["nodes"].items() if v.get("name") == name][0]
        return A.count_crossings(A.collect_side(d, nid, side), fn(A.collect_side(d, nid, side)))
    exp = one(do, "Exportations", "left")
    aia = one(dv, "Autres IAA", "left")
    dispo = one(dv, "Disponibilités rouge", "right")
    veau = one(dv, "Vin pour eau-de-vie récolté", "left")
    return t, exp, aia, dispo, veau

print("%-20s total  Export(ov)  AutresIAA  DispoRouge  VinEauDeVie" % "criterion")
for name, fn in CRITS:
    t, exp, aia, dispo, veau = total_and_key(fn)
    print("%-20s %-5d  %-10d  %-9d  %-10d  %d" % (name, t, exp, aia, dispo, veau))
