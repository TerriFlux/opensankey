"""Poll a single GitLab job until terminal. Usage: poll_job.py <job_id>"""
import json
import sys
import time
import urllib.request

TOKEN = open(r"C:\TerriFlux\.local-secrets\gitlab.token").read().strip()
PROJ = "https://gitlab.com/api/v4/projects/su-model%2Fsankeyapplication"
job_id = sys.argv[1]
TERMINAL = {"success", "failed", "canceled", "skipped"}


def get(url):
    req = urllib.request.Request(url, headers={"PRIVATE-TOKEN": TOKEN})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.load(r)


last = None
for _ in range(120):
    try:
        st = get(f"{PROJ}/jobs/{job_id}")["status"]
    except Exception as e:  # noqa
        print("poll error:", e, flush=True)
        time.sleep(20)
        continue
    if st != last:
        print(f"job {job_id}: {st}", flush=True)
        last = st
    if st in TERMINAL:
        print(f"RESULT:{st}", flush=True)
        break
    time.sleep(45)
