PROM_POD=prometheus-prometheus-kube-prometheus-prometheus-0
START=1774308600  # 2026-03-24 08:30:00 KST
END=1774308840    # 2026-03-24 08:34:00 KST

for item in \
  'desired|kube_horizontalpodautoscaler_status_desired_replicas{namespace="deep-quest",horizontalpodautoscaler="ai-server-keda-hpa"}' \
  'current|kube_horizontalpodautoscaler_status_current_replicas{namespace="deep-quest",horizontalpodautoscaler="ai-server-keda-hpa"}' \
  'available|kube_deployment_status_replicas_available{namespace="deep-quest",deployment="ai-server"}' \
  'pending|ai_job_queue_pending' \
  'busy|ai_worker_busy'
do
  name="${item%%|*}"
  query="${item#*|}"
  echo "=== $name ==="
  kubectl exec -n monitoring "$PROM_POD" -c prometheus -- \
    wget -qO- "http://localhost:9090/api/v1/query_range?query=${query}&start=${START}&end=${END}&step=30" \
    | python3 -c 'import sys,json,datetime; d=json.load(sys.stdin); r=d["data"]["result"]; 
if not r: print("no-data"); raise SystemExit(0)
[print(datetime.datetime.utcfromtimestamp(int(t)).strftime("%H:%M:%S UTC"), v) for t,v in r[0]["values"]]'
  echo
done

