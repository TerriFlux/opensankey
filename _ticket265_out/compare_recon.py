"""Compare two reconciled xlsx (before/after #265 fix): prove reconciled VALUES
are unchanged and the 35 offenders flipped libre->determined.
Usage: compare_recon.py <before.xlsx> <after.xlsx>
"""
import sys
import openpyxl


def load(path):
    wb = openpyxl.load_workbook(path, data_only=True, read_only=True)
    ws = wb["Analyses des résultats"]
    rows = list(ws.iter_rows(values_only=True))
    hdr = [str(c) if c is not None else "" for c in rows[0]]
    idx = {h: i for i, h in enumerate(hdr)}
    out = {}
    for r in rows[1:]:
        key = (r[idx["Origine"]], r[idx["Destination"]], r[idx["Année"]])

        def num(name):
            try:
                return float(r[idx[name]])
            except (TypeError, ValueError):
                return None
        out[key] = {
            "type": str(r[idx["Type de variable"]]) if r[idx["Type de variable"]] is not None else "",
            "val": num("Valeur reconciliée"),
            "inf": num("Borne inférieure"),
            "sup": num("Borne supérieure"),
        }
    return out


before, after = load(sys.argv[1]), load(sys.argv[2])
kb, ka = set(before), set(after)
common = kb & ka
print(f"rows: before={len(before)} after={len(after)} common={len(common)}")
print(f"only in before: {len(kb - ka)}   only in after: {len(ka - kb)}")

# 1) Value preservation over common flux
max_abs, max_rel, n_val_mismatch, worst = 0.0, 0.0, 0, None
for k in common:
    vb, va = before[k]["val"], after[k]["val"]
    if vb is None or va is None:
        continue
    d = abs(vb - va)
    rel = d / max(abs(vb), abs(va), 1e-12)
    if d > max_abs:
        max_abs, worst = d, k
    max_rel = max(max_rel, rel)
    if rel > 1e-9 and d > 1e-6:
        n_val_mismatch += 1
print(f"\n[VALUES] max |Δ| = {max_abs:.3e} kt  (worst flux: {worst})")
print(f"[VALUES] max relative Δ = {max_rel:.3e}")
print(f"[VALUES] flux with value mismatch (>1e-9 rel & >1e-6 abs): {n_val_mismatch}")


def offender(d):
    if "libre" not in d["type"] or d["inf"] is None or d["sup"] is None:
        return None
    if d["sup"] < d["inf"]:
        return "inverted"
    scale = max(abs(d["inf"]), abs(d["sup"]), 1e-12)
    if 0 <= (d["sup"] - d["inf"]) <= 1e-3 * scale:
        return "collapsed"
    return None


# 2) Transition of the before-offenders
off_before = {k: offender(before[k]) for k in before if offender(before[k])}
print(f"\n[TRANSITION] offenders in BEFORE: {len(off_before)}")
now_determined = now_libre = missing = 0
max_off_val_diff = 0.0
for k in off_before:
    if k not in after:
        missing += 1
        continue
    if "libre" in after[k]["type"]:
        now_libre += 1
    else:
        now_determined += 1
    if before[k]["val"] is not None and after[k]["val"] is not None:
        max_off_val_diff = max(max_off_val_diff, abs(before[k]["val"] - after[k]["val"]))
print(f"[TRANSITION]  -> now 'déterminé' (or non-libre): {now_determined}")
print(f"[TRANSITION]  -> still 'libre': {now_libre}")
print(f"[TRANSITION]  -> missing in after: {missing}")
print(f"[TRANSITION]  max |Δ value| among those 35 offenders: {max_off_val_diff:.3e} kt")

# 3) Offenders remaining in AFTER (should be 0)
off_after = {k: offender(after[k]) for k in after if offender(after[k])}
print(f"\n[AFTER] remaining offenders: {len(off_after)}")
