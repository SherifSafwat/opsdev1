bash#!/bin/bash

API_URL="https://api.taskmanager.com"
WEBHOOK_URL="${SLACK_WEBHOOK_URL}"

# Function to send alert
send_alert() {
    local message="$1"
    local color="$2"
    
    curl -X POST -H 'Content-type: application/json' \
        --data "{\"attachments\":[{\"color\":\"$color\",\"text\":\"$message\"}]}" \
        "$WEBHOOK_URL"
}

# Health check
response=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/health")

if [ "$response" != "200" ]; then
    send_alert "🚨 API Health Check Failed! Status: $response" "danger"
    exit 1
else
    echo "✅ Health check passed"
fi

# Performance check
response_time=$(curl -s -o /dev/null -w "%{time_total}" "$API_URL/health")
threshold=2.0

if (( $(echo "$response_time > $threshold" | bc -l) )); then
    send_alert "⚠️ API Response Time High: ${response_time}s (threshold: ${threshold}s)" "warning"
fi

echo "Response time: ${response_time}s"
scripts/rollback.sh
bash#!/bin/bash

NAMESPACE="production"
APP_NAME="task-api"

echo "🔄 Starting rollback process..."

# Get current active deployment
CURRENT_ACTIVE=$(kubectl get deployment -l "app=$APP_NAME,active=true" -n $NAMESPACE -o jsonpath='{.items[0].metadata.labels.version}')
echo "Current active deployment: $CURRENT_ACTIVE"

# Determine rollback target
if [ "$CURRENT_ACTIVE" = "blue" ]; then
    ROLLBACK_TARGET="green"
else
    ROLLBACK_TARGET="blue"
fi

echo "Rolling back to: $ROLLBACK_TARGET"

# Scale up rollback target
kubectl scale deployment $APP_NAME-$ROLLBACK_TARGET --replicas=3 -n $NAMESPACE

# Wait for rollback deployment to be ready
kubectl wait --for=condition=available deployment/$APP_NAME-$ROLLBACK_TARGET -n $NAMESPACE --timeout=300s

# Switch traffic
kubectl patch service $APP_NAME -n $NAMESPACE -p '{"spec":{"selector":{"version":"'$ROLLBACK_TARGET'"}}}'

# Update labels
kubectl label deployment $APP_NAME-$ROLLBACK_TARGET active=true -n $NAMESPACE --overwrite
kubectl label deployment $APP_NAME-$CURRENT_ACTIVE active=false -n $NAMESPACE --overwrite

# Scale down old deployment
kubectl scale deployment $APP_NAME-$CURRENT_ACTIVE --replicas=0 -n $NAMESPACE

echo "✅ Rollback completed successfully!"

# Send notification
curl -X POST -H 'Content-type: application/json' \
    --data '{"text":"🔄 Production rollback completed: '$CURRENT_ACTIVE' → '$ROLLBACK_TARGET'"}' \
    "$SLACK_WEBHOOK_URL"
