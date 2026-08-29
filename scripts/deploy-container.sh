#!/usr/bin/env bash
# Deploy the relay with its durable, single-owner room store. The standard
# factory builder remains responsible for the image, hostname, and certificate.
set -euo pipefail

repo_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source_sha="$(git -C "$repo_dir" rev-parse HEAD)"
subscription="${AZURE_SUBSCRIPTION_ID:-283af945-693b-4a6e-b952-df928d0a18a9}"
resource_group="sociobot"
environment="factory-env"
app_name="sf-family-doodle-relay"
storage_account="sociobotblob"
share_name="sf-family-doodle-relay-data"
storage_name="family-doodle-relay-data"
app_url="https://management.azure.com/subscriptions/${subscription}/resourceGroups/${resource_group}/providers/Microsoft.App/containerApps/${app_name}?api-version=2024-03-01"

if ! az storage share-rm show --resource-group "$resource_group" --storage-account "$storage_account" --name "$share_name" --only-show-errors -o none; then
  az storage share-rm create --resource-group "$resource_group" --storage-account "$storage_account" --name "$share_name" --quota 1 --only-show-errors -o none
fi

storage_key="$(az storage account keys list --resource-group "$resource_group" --account-name "$storage_account" --query '[0].value' -o tsv)"
az containerapp env storage set --resource-group "$resource_group" --name "$environment" --storage-name "$storage_name" --access-mode ReadWrite --azure-file-account-name "$storage_account" --azure-file-share-name "$share_name" --azure-file-account-key "$storage_key" --only-show-errors -o none

/opt/fleet/lib/deploy-container.sh family-doodle-relay "$repo_dir"

image="$(az containerapp show --resource-group "$resource_group" --name "$app_name" --query 'properties.template.containers[0].image' -o tsv)"
deployment_patch="$(printf '%s' "{\"properties\":{\"configuration\":{\"activeRevisionsMode\":\"Single\"},\"template\":{\"containers\":[{\"name\":\"app\",\"image\":\"${image}\",\"resources\":{\"cpu\":0.5,\"memory\":\"1Gi\"},\"env\":[{\"name\":\"PORT\",\"value\":\"8080\"}],\"volumeMounts\":[{\"volumeName\":\"relay-data\",\"mountPath\":\"/data\"}]}],\"scale\":{\"minReplicas\":1,\"maxReplicas\":1},\"volumes\":[{\"name\":\"relay-data\",\"storageType\":\"AzureFile\",\"storageName\":\"${storage_name}\",\"mountOptions\":\"uid=10001,gid=10001,file_mode=0770,dir_mode=0770\"}]}}}")"
az rest --method patch --url "$app_url" --body "$deployment_patch" --only-show-errors -o none

echo "== wait for the durable single-owner revision"
deployment_ready=false
for _ in $(seq 1 40); do
  app_json="$(az containerapp show --resource-group "$resource_group" --name "$app_name" -o json)"
  if summary="$(printf '%s' "$app_json" | node "$repo_dir/scripts/deployment-contract.mjs" --expected-image "$image" 2>/dev/null)"; then
    latest_revision="$(printf '%s' "$app_json" | node -e "let input='';process.stdin.on('data',chunk=>input+=chunk);process.stdin.on('end',()=>process.stdout.write(JSON.parse(input).properties.latestReadyRevisionName))")"
    replica_count="$(az containerapp replica list --resource-group "$resource_group" --name "$app_name" --revision "$latest_revision" --query 'length(@)' -o tsv)"
    if [ "$replica_count" = "1" ]; then
      deployment_ready=true
      echo "$summary"
      break
    fi
  fi
  sleep 10
done
[ "$deployment_ready" = true ] || { echo "The durable single-owner deployment did not become ready." >&2; exit 1; }

echo "== deactivate superseded room owners"
while IFS= read -r old_revision; do
  [ -z "$old_revision" ] && continue
  az containerapp revision deactivate --resource-group "$resource_group" --name "$app_name" --revision "$old_revision" --only-show-errors -o none
done < <(az containerapp revision list --resource-group "$resource_group" --name "$app_name" --query "[?properties.active && name!='${latest_revision}'].name" -o tsv)

ownership_ready=false
for _ in $(seq 1 30); do
  revisions_json="$(az containerapp revision list --resource-group "$resource_group" --name "$app_name" -o json)"
  if ownership="$(printf '%s' "$revisions_json" | node "$repo_dir/scripts/deployment-contract.mjs" --revisions --expected-revision "$latest_revision" 2>/dev/null)"; then
    ownership_ready=true
    echo "$ownership"
    break
  fi
  sleep 5
done
[ "$ownership_ready" = true ] || { echo "Production did not converge to one active room owner." >&2; exit 1; }

echo "== verify live build identity"
identity_ready=false
for _ in $(seq 1 30); do
  live_sha="$(curl --fail --silent --show-error --max-time 15 "https://family-doodle-relay.sociobot.in/health" | node -e "let input='';process.stdin.on('data',chunk=>input+=chunk);process.stdin.on('end',()=>process.stdout.write(JSON.parse(input).build_sha||''))" 2>/dev/null || true)"
  if [ "$live_sha" = "$source_sha" ]; then
    identity_ready=true
    echo "health build_sha=$live_sha"
    break
  fi
  sleep 10
done
[ "$identity_ready" = true ] || { echo "Live health did not report $source_sha." >&2; exit 1; }

az containerapp show --resource-group "$resource_group" --name "$app_name" --query '{revision:properties.latestReadyRevisionName,image:properties.template.containers[0].image,scale:properties.template.scale,volumes:properties.template.volumes,mounts:properties.template.containers[0].volumeMounts}' -o json
