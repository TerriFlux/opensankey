"""Poll a GitLab pipeline until it reaches a terminal state, then exit.
Usage: poll_pipeline.py <pipeline_id>
"""
import json
import sys
import time
import urllib.request

TOKEN = open(r"C:\TerriFlux\.local-secrets\gitlab.token").read().strip()
PROJ = "https://gitlab.com/api/v4/projects/su-model%2Fsankeyapplication"
pipe = sys.argv[1]
TERMINAL = {"success", "failed", "canceled", "skipped", "manual"}


def get(url):
    req = urllib.request.Request(url, headers={"PRIVATE-TOKEN": TOKEN})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.load(r)


last = None
for _ in range(120):  # ~2h max
    try:
        p = get(f"{PROJ}/pipelines/{pipe}")
        st = p["status"]
    except Exception as e:  # noqa
        print("poll error:", e, flush=True)
        time.sleep(30)
        continue
    if st != last:
        print(f"pipeline {pipe}: {st}", flush=True)
        last = st
    if st in TERMINAL:
        # summarize failed jobs if any
        if st != "success":
            try:
                jobs = get(f"{PROJ}/pipelines/{pipe}/jobs?per_page=100")
                bad = [f"{j['stage']}/{j['name']}={j['status']}" for j in jobs
                       if j["status"] in ("failed", "canceled")]
                print("non-passing jobs:", bad, flush=True)
            except Exception:
                pass
        print(f"TERMINAL:{st}", flush=True)
        break
    time.sleep(60)
