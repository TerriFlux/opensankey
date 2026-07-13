"""Poll the dev_opensankey job until it is playable ('manual') or blocked.
Usage: poll_deploy.py <job_id> <pipeline_id>
"""
import json
import sys
import time
import urllib.request

TOKEN = open(r"C:\TerriFlux\.local-secrets\gitlab.token").read().strip()
PROJ = "https://gitlab.com/api/v4/projects/su-model%2Fsankeyapplication"
job_id, pipe = sys.argv[1], sys.argv[2]


def get(url):
    req = urllib.request.Request(url, headers={"PRIVATE-TOKEN": TOKEN})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.load(r)


last = None
for _ in range(140):  # ~2.3h max
    try:
        st = get(f"{PROJ}/jobs/{job_id}")["status"]
    except Exception as e:  # noqa
        print("poll error:", e, flush=True)
        time.sleep(30)
        continue
    if st != last:
        print(f"dev_opensankey: {st}", flush=True)
        last = st
    if st == "manual":
        print("RESULT:PLAYABLE", flush=True)
        break
    if st == "success":
        print("RESULT:ALREADY_RAN", flush=True)
        break
    if st in ("skipped", "failed", "canceled"):
        p = get(f"{PROJ}/pipelines/{pipe}")
        jobs = get(f"{PROJ}/pipelines/{pipe}/jobs?per_page=100")
        bad = [f"{j['stage']}/{j['name']}={j['status']}" for j in jobs
               if j["status"] in ("failed", "canceled")]
        print(f"RESULT:BLOCKED pipeline={p['status']} bad={bad}", flush=True)
        break
    time.sleep(60)
