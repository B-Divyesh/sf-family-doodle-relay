#!/usr/bin/env node

import process from 'node:process';

export function deploymentContractErrors(app, expectedImage = '') {
  const errors = [];
  const properties = app?.properties ?? {};
  const configuration = properties.configuration ?? {};
  const template = properties.template ?? {};
  const containers = template.containers ?? [];
  const container = containers.find(item => item.name === 'app');
  const volumes = template.volumes ?? [];
  const volume = volumes.find(item => item.name === 'relay-data');
  const mount = container?.volumeMounts?.find(item => item.volumeName === 'relay-data');

  if (configuration.activeRevisionsMode !== 'Single') {
    errors.push('active revisions mode must be Single');
  }
  if (template.scale?.minReplicas !== 1) {
    errors.push('minimum replicas must be 1');
  }
  if (template.scale?.maxReplicas !== 1) {
    errors.push('maximum replicas must be 1');
  }
  if (!container) {
    errors.push('app container is missing');
  } else {
    if (expectedImage && container.image !== expectedImage) {
      errors.push(`app image must be ${expectedImage}`);
    }
    if (mount?.mountPath !== '/data') {
      errors.push('relay-data must be mounted at /data');
    }
  }
  if (volume?.storageType !== 'AzureFile' || volume?.storageName !== 'family-doodle-relay-data') {
    errors.push('relay-data must use the family-doodle-relay-data Azure Files storage');
  }
  const mountOptions = new Set((volume?.mountOptions ?? '').split(','));
  for (const option of ['uid=10001', 'gid=10001', 'file_mode=0770', 'dir_mode=0770']) {
    if (!mountOptions.has(option)) {
      errors.push(`relay-data mount options must include ${option}`);
    }
  }
  if (properties.latestRevisionName !== properties.latestReadyRevisionName) {
    errors.push('latest revision is not ready');
  }
  return errors;
}

export function assertDeploymentContract(app, expectedImage = '') {
  const errors = deploymentContractErrors(app, expectedImage);
  if (errors.length) {
    throw new Error(`deployment contract failed: ${errors.join('; ')}`);
  }
  return {
    revision: app.properties.latestReadyRevisionName,
    image: app.properties.template.containers.find(item => item.name === 'app').image,
    replicas: 1,
    dataMount: '/data',
  };
}

async function main() {
  const expectedImageIndex = process.argv.indexOf('--expected-image');
  const expectedImage = expectedImageIndex >= 0 ? process.argv[expectedImageIndex + 1] : '';
  let input = '';
  for await (const chunk of process.stdin) input += chunk;
  const summary = assertDeploymentContract(JSON.parse(input), expectedImage);
  process.stdout.write(`${JSON.stringify(summary)}\n`);
}

if (process.argv[1] && import.meta.url === new URL(process.argv[1], 'file:').href) {
  main().catch(error => {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  });
}
