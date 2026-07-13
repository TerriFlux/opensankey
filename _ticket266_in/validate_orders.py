# -*- coding: utf-8 -*-
"""Cross-check, with the reference oracle, the crossing counts my TS test will
assert: Autres IAA (policy vs #205 stored) and the ovine Exportations multi-column
case (policy vs the old #205 order coded in the existing test)."""
import sys, math
sys.path.insert(0, ".")
import io_order_analysis as A

fixture = sys.argv[1]

def frame(side, ox, oy, nx, ny, cn=0.05, co=0.05):
    dx, dy = ox - nx, oy - ny
    horiz = side in ('left', 'right')
    return dict(name="", du=(dy if horiz else dx), vo=abs(dx if horiz else dy), ce=cn, cs=co)

def cross_of_names(flows, name2i, order_names):
    return A.count_crossings(flows, [name2i[n] for n in order_names])

print("=== Autres IAA (fixture) ===")
data = A.load(fixture)
flows = A.collect_side(data, "AutresIaa", "left")
name2i = {f["name"]: i for i, f in enumerate(flows)}
proposed = A.proposed_order(flows)
print("policy order :", [flows[i]["name"] for i in proposed])
print("policy crossings :", A.count_crossings(flows, proposed))
print("#205 stored crossings :", cross_of_names(
    flows, name2i,
    ["Vin récolté", "Vin blanc récolté", "Marc de raisin", "Lies de vin", "Vin pour eau-de-vie récolté"]))

print()
print("=== ovine Exportations (synthetic coords, node 2928,1737, all left, curve .05) ===")
rows = [
    ('VAgneau', 1866, 420), ('VOvins', 1872, 796), ('VCaprine', 1884, 945),
    ('Abats', 1884, 1032), ('Proteines', 2422, 1570), ('CorpsGras', 2420, 1649),
    ('C3alim', 1874, 1642), ('Agneaux', 931, 1076), ('OvinsRef', 931, 1426),
    ('CaprinsRef', 928, 1590),
]
NX, NY = 2928, 1737
flows2 = [frame('left', ox, oy, NX, NY) for (_, ox, oy) in rows]
for f, (nm, _, _) in zip(flows2, rows):
    f["name"] = nm
name2i2 = {f["name"]: i for i, f in enumerate(flows2)}
proposed2 = A.proposed_order(flows2)
print("policy order :", [flows2[i]["name"] for i in proposed2])
print("policy crossings :", A.count_crossings(flows2, proposed2))
old_order = ['VAgneau', 'VOvins', 'VCaprine', 'Abats', 'Proteines', 'CorpsGras',
             'C3alim', 'Agneaux', 'OvinsRef', 'CaprinsRef']
print("old #205-test order crossings :", cross_of_names(flows2, name2i2, old_order))
