#!/usr/bin/env bash
# Deploy the relay with its durable, single-owner room store. The standard
# factory builder remains responsible for the image, hostname, and certificate.
set -euo pipefail

repo_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
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
deployment_patch="$(printf '%s' "{\"properties\":{\"template\":{\"containers\":[{\"name\":\"app\",\"image\":\"${image}\",\"resources\":{\"cpu\":0.5,\"memory\":\"1Gi\"},\"env\":[{\"name\":\"PORT\",\"value\":\"8080\"}],\"volumeMounts\":[{\"volumeName\":\"relay-data\",\"mountPath\":\"/data\"}]}],\"scale\":{\"minReplicas\":1,\"maxReplicas\":1},\"volumes\":[{\"name\":\"relay-data\",\"storageType\":\"AzureFile\",\"storageName\":\"${storage_name}\"}]}}}")"
az rest --method patch --url "$app_url" --body "$deployment_patch" --only-show-errors -o none

az containerapp show --resource-group "$resource_group" --name "$app_name" --query '{revision:properties.latestRevisionName,scale:properties.template.scale,volumes:properties.template.volumes,mounts:properties.template.containers[0].volumeMounts}' -o json
