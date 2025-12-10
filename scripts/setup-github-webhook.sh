#!/bin/bash
# scripts/setup-github-webhook.sh

# Configuration
REPO_OWNER="your-username"
REPO_NAME="your-repo"
WEBHOOK_URL="http://localhost:8080/api/v1/executions/webhook/temporal-archaeologist/continuous-excavation"
WEBHOOK_SECRET="019bc72d8cbc9ce50dde240da3e633289185ba275a41e1faa51231b0a5074dd9"
GITHUB_TOKEN="YOUR_GITHUB_TOKEN_HERE"

# Create webhook
curl -X POST \
  -H "Authorization: token $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/repos/$REPO_OWNER/$REPO_NAME/hooks \
  -d '{
    "name": "web",
    "active": true,
    "events": ["push", "pull_request"],
    "config": {
      "url": "'"$WEBHOOK_URL"'",
      "content_type": "json",
      "secret": "'"$WEBHOOK_SECRET"'",
      "insecure_ssl": "0"
    }
  }'

echo "Webhook created successfully!"
