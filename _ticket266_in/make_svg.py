# -*- coding: utf-8 -*-
"""Render the 5 inbound flows of 'Autres IAA' as faithful OpenSankey S-curves, in the
#205 stored order (crossings) vs the #266 policy order (no crossing). Emits an SVG."""
import sys
sys.path.insert(0, ".")
import io_order_analysis as A

data = A.load(sys.argv[1])
flows = A.collect_side(data, "AutresIaa", "left")   # name, du, vo, ce, cs
name2i = {f["name"]: i for i, f in enumerate(flows)}

order_205 = ["Vin récolté", "Vin blanc récolté", "Marc de raisin", "Lies de vin", "Vin pour eau-de-vie récolté"]
order_fix = [flows[i]["name"] for i in A.proposed_order(flows)]

COLORS = {
    "Vin récolté": "#4C78A8", "Vin blanc récolté": "#72B7B2",
    "Vin pour eau-de-vie récolté": "#54A24B", "Lies de vin": "#EECA3B",
    "Marc de raisin": "#E45756",
}
SHORT = {
    "Vin récolté": "Vin récolté", "Vin blanc récolté": "Vin blanc récolté",
    "Vin pour eau-de-vie récolté": "Vin pour eau-de-vie", "Lies de vin": "Lies de vin",
    "Marc de raisin": "Marc de raisin",
}

PW, PH = 380, 320
X_NODE, X_SRC0, YC = 330, 55, 165
SY = 0.104
VO_MAX = max(f["vo"] for f in flows)
SX = (X_NODE - X_SRC0) / VO_MAX
STACK = 150.0

def scr(u, v):
    return (X_NODE - v * SX, YC + u * SY)

def path_for(f, slot):
    pts = A._path(f, slot, samples=20)
    xy = [scr(u, v) for (u, v) in pts]
    return "M %.1f %.1f " % xy[0] + " ".join("L %.1f %.1f" % p for p in xy[1:])

def render_panel(order, title, ox):
    idx = [name2i[n] for n in order]
    n = len(idx)
    slots = [-STACK/2 + p*(STACK/(n-1)) for p in range(n)]
    cross = A.count_crossings(flows, idx)
    P = ['<g transform="translate(%d,0)">' % ox]
    P.append('<text x="%d" y="24" font-size="14" font-weight="700" fill="currentColor" text-anchor="middle">%s</text>' % (PW/2, title))
    badge = "#c0392b" if cross > 0 else "#1e8449"
    lab = ("%d croisements" % cross) if cross != 1 else "1 croisement"
    P.append('<rect x="%d" y="34" width="130" height="22" rx="11" fill="%s"/>' % (PW/2-65, badge))
    P.append('<text x="%d" y="49" font-size="12.5" font-weight="700" fill="#fff" text-anchor="middle">%s</text>' % (PW/2, lab))
    ytop = YC + slots[0]*SY - 14
    ybot = YC + slots[-1]*SY + 14
    P.append('<rect x="%d" y="%.1f" width="13" height="%.1f" rx="3" fill="#6b7280"/>' % (X_NODE, ytop, ybot-ytop))
    P.append('<text x="%.1f" y="%.1f" font-size="11.5" font-weight="600" fill="currentColor" text-anchor="middle">Autres IAA</text>' % (X_NODE+6, ybot+18))
    for p, i in enumerate(idx):
        f = flows[i]; nm = f["name"]
        w = 8 if nm == "Marc de raisin" else 6
        P.append('<path d="%s" fill="none" stroke="%s" stroke-width="%d" stroke-opacity="0.9" stroke-linecap="round"/>'
                 % (path_for(f, slots[p]), COLORS[nm], w))
    for i in range(len(flows)):
        f = flows[i]; x, y = scr(f["du"], f["vo"])
        P.append('<circle cx="%.1f" cy="%.1f" r="4.5" fill="%s" stroke="#ffffff" stroke-width="1.5"/>' % (x, y, COLORS[f["name"]]))
    P.append('</g>')
    return "\n".join(P), cross

p1, c1 = render_panel(order_205, "AVANT — règle #205", 0)
p2, c2 = render_panel(order_fix, "APRÈS — fix #266", PW + 34)

# legend
leg = ['<g transform="translate(40,%d)">' % (PH - 4)]
lx = 0
for nm in ["Vin récolté", "Vin blanc récolté", "Vin pour eau-de-vie", "Lies de vin", "Marc de raisin"]:
    key = "Vin pour eau-de-vie récolté" if nm == "Vin pour eau-de-vie" else nm
    leg.append('<circle cx="%d" cy="0" r="5" fill="%s"/>' % (lx, COLORS[key]))
    leg.append('<text x="%d" y="4" font-size="11.5" fill="currentColor">%s</text>' % (lx+10, SHORT[key]))
    lx += 22 + len(SHORT[key]) * 6.6
leg.append('</g>')

W = 2*PW + 34
svg = '''<svg viewBox="0 0 %d %d" xmlns="http://www.w3.org/2000/svg" font-family="system-ui,Segoe UI,sans-serif">
<rect x="0" y="0" width="100%%" height="100%%" fill="none"/>
%s
%s
<line x1="%d" y1="16" x2="%d" y2="%d" stroke="var(--fg,#888)" stroke-opacity="0.25"/>
%s
</svg>''' % (W, PH + 20, p1, p2, PW+17, PW+17, PH-40, "\n".join(leg))

open("autres_iaa_beforeafter.svg", "w", encoding="utf-8").write(svg)
print("crossings #205 =", c1, "| crossings fix =", c2)
print("written autres_iaa_beforeafter.svg (%d bytes)" % len(svg))
