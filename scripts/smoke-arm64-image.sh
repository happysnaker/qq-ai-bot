#!/usr/bin/env bash
set -euo pipefail

IMAGE="${IMAGE:-ghcr.io/happysnaker/qq-ai-bot:v0.1.6}"
CONTAINER_NAME="${CONTAINER_NAME:-qq-ai-bot-arm64-smoke}"
PORT="${PORT:-18082}"
PLATFORM="${PLATFORM:-linux/arm64}"
OUT_DIR="${OUT_DIR:-./run-logs/arm64-smoke}"

mkdir -p "$OUT_DIR"

cleanup() {
  docker rm -f "$CONTAINER_NAME" >/dev/null 2>&1 || true
}
trap cleanup EXIT

cleanup

echo "[smoke] image=$IMAGE platform=$PLATFORM port=$PORT"
echo "[smoke] pulling image"
docker pull --platform "$PLATFORM" "$IMAGE"

echo "[smoke] starting container"
docker run --platform "$PLATFORM" --name "$CONTAINER_NAME" -d \
  -p "$PORT:8080" \
  -e BOT_HOST=0.0.0.0 \
  -e BOT_PORT=8080 \
  -e DATA_DIR=/app/data \
  -e SESSION_STORE=file \
  -e SESSION_TTL_MINUTES=120 \
  -e ONEBOT_MODE=reverse \
  -e ONEBOT_ACCESS_TOKEN=smoke-token \
  -e ONEBOT_REVERSE_WS_HOST=0.0.0.0 \
  -e ONEBOT_REVERSE_WS_PORT=16700 \
  -e ONEBOT_REVERSE_WS_PATH=/onebot/v11/ws \
  -e ACP_AGENT_COMMAND=node \
  -e 'ACP_AGENT_ARGS_JSON=["dist/examples/mock-acp-agent.js"]' \
  -e ACP_AGENT_WORKDIR=/app \
  "$IMAGE" >/dev/null

READYZ="$OUT_DIR/readyz.json"
STATUS="$OUT_DIR/status.json"
METRICS="$OUT_DIR/metrics.txt"
INSPECT="$OUT_DIR/inspect.txt"
LOGS="$OUT_DIR/container.log"

for _ in $(seq 1 30); do
  if curl -fsS "http://127.0.0.1:$PORT/readyz" -o "$READYZ"; then
    break
  fi
  sleep 1
done

curl -fsS "http://127.0.0.1:$PORT/status" -o "$STATUS"
curl -fsS "http://127.0.0.1:$PORT/metrics" -o "$METRICS"
docker inspect --format 'image={{.Config.Image}} os={{.Os}} arch={{.Architecture}} status={{.State.Status}}' "$CONTAINER_NAME" > "$INSPECT"
docker logs "$CONTAINER_NAME" > "$LOGS" 2>&1 || true

echo "[smoke] inspect: $(cat "$INSPECT")"
echo "[smoke] readyz: $READYZ"
echo "[smoke] status: $STATUS"
echo "[smoke] metrics: $METRICS"
echo "[smoke] logs: $LOGS"
echo "[smoke] PASS"
