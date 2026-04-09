#!/usr/bin/env python3
"""
Reads OpenSankey+ trial analytics from the file-based counters under ./cache.

Usage:
    python scripts/trial_stats.py            # summary
    python scripts/trial_stats.py --by-day   # one row per day
    python scripts/trial_stats.py --raw      # dump events as JSONL

The counters are written by /api/trial/started and /api/trial/converted in server/views.py.
No PII is recorded — only an anonymous UUID generated client-side.
"""

import argparse
import json
import os
import sys
from collections import defaultdict
from datetime import datetime, timezone

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
COUNTER_FILE = os.path.join(ROOT, "cache", "trial_counter.txt")
EVENTS_FILE = os.path.join(ROOT, "cache", "trial_events.jsonl")


def read_counter() -> int:
    try:
        with open(COUNTER_FILE, "r", encoding="utf-8") as f:
            return int(f.read().strip() or "0")
    except (FileNotFoundError, ValueError):
        return 0


def iter_events():
    if not os.path.exists(EVENTS_FILE):
        return
    with open(EVENTS_FILE, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                yield json.loads(line)
            except json.JSONDecodeError:
                continue


def summary() -> None:
    starts = set()
    converts = set()
    starts_total = 0
    converts_total = 0
    first_ts = None
    last_ts = None
    for ev in iter_events():
        kind = ev.get("event")
        uuid = ev.get("uuid", "")
        ts = ev.get("ts")
        if isinstance(ts, (int, float)):
            if first_ts is None or ts < first_ts:
                first_ts = ts
            if last_ts is None or ts > last_ts:
                last_ts = ts
        if kind == "started":
            starts_total += 1
            if uuid:
                starts.add(uuid)
        elif kind == "converted":
            converts_total += 1
            if uuid:
                converts.add(uuid)

    counter = read_counter()
    converted_from_trial = len(starts & converts)
    rate = (converted_from_trial / len(starts) * 100) if starts else 0.0

    def fmt(ts):
        if ts is None:
            return "-"
        return datetime.fromtimestamp(ts / 1000, tz=timezone.utc).strftime("%Y-%m-%d %H:%M UTC")

    print("OpenSankey+ trial — summary")
    print("=" * 40)
    print(f"Counter file value      : {counter}")
    print(f"Total 'started' events  : {starts_total}")
    print(f"Unique trial UUIDs      : {len(starts)}")
    print(f"Total 'converted' events: {converts_total}")
    print(f"Unique converted UUIDs  : {len(converts)}")
    print(f"Trial → paid conversion : {converted_from_trial} ({rate:.1f}%)")
    print(f"First event             : {fmt(first_ts)}")
    print(f"Last event              : {fmt(last_ts)}")


def by_day() -> None:
    buckets = defaultdict(lambda: {"started": 0, "converted": 0})
    for ev in iter_events():
        ts = ev.get("ts")
        kind = ev.get("event")
        if not isinstance(ts, (int, float)) or kind not in ("started", "converted"):
            continue
        day = datetime.fromtimestamp(ts / 1000, tz=timezone.utc).strftime("%Y-%m-%d")
        buckets[day][kind] += 1
    print(f"{'date':<12} {'started':>8} {'converted':>10}")
    for day in sorted(buckets):
        b = buckets[day]
        print(f"{day:<12} {b['started']:>8} {b['converted']:>10}")


def raw() -> None:
    for ev in iter_events():
        print(json.dumps(ev, ensure_ascii=False))


def main() -> int:
    parser = argparse.ArgumentParser(description="OpenSankey+ trial analytics reader")
    parser.add_argument("--by-day", action="store_true", help="Group events by UTC day")
    parser.add_argument("--raw", action="store_true", help="Dump every event as JSONL")
    args = parser.parse_args()

    if args.raw:
        raw()
    elif args.by_day:
        by_day()
    else:
        summary()
    return 0


if __name__ == "__main__":
    sys.exit(main())
