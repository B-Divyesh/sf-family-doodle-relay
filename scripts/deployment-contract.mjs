#!/usr/bin/env node

import process from 'node:process';

export function durableDeploymentPatch(image) {
  if (!image) throw new Error('an image is required for the durable deployment patch');
  return {
    properties: {
      configuration: { activeRevisionsMode: 'Single' },
      template: {
        containers: [{
          name: 'app',
          image,
          resources: { cpu: 0.5, memory: '1Gi' },
          env: [{ name: 'PORT', value: '8080' }],
          volumeMounts: [{ volumeName: 'relay-data', mountPath: '/data' }],
        }],
        scale: { minReplicas: 1, maxReplicas: 1 },
        volumes: [{
          name: 'relay-data',
          storageType: 'AzureFile',
          storageName: 'family-doodle-relay-data',
          mountOptions: 'uid=10001,gid=10001,file_mode=0770,dir_mode=0770',
        }],
      },
    },
  };
}

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

export function revisionOwnershipErrors(revisions, expectedRevision) {
  const errors = [];
  const active = revisions.filter(revision => revision?.properties?.active);
  if (active.length !== 1) {
    errors.push(`exactly one revision must be active, found ${active.length}`);
  }
  const owner = active.find(revision => revision.name === expectedRevision);
  if (!owner) {
    errors.push(`ready revision ${expectedRevision} must be the active owner`);
  } else {
    if (owner.properties.replicas !== 1) {
      errors.push('active owner must have exactly one replica');
    }
    if (owner.properties.trafficWeight !== 100) {
      errors.push('active owner must receive 100 percent of traffic');
    }
  }
  return errors;
}

export function assertRevisionOwnership(revisions, expectedRevision) {
  const errors = revisionOwnershipErrors(revisions, expectedRevision);
  if (errors.length) {
    throw new Error(`revision ownership failed: ${errors.join('; ')}`);
  }
  return { revision: expectedRevision, activeRevisions: 1, replicas: 1, trafficWeight: 100 };
}

async function main() {
  if (process.argv.includes('--template')) {
    const imageIndex = process.argv.indexOf('--image');
    const image = imageIndex >= 0 ? process.argv[imageIndex + 1] : '';
    process.stdout.write(`${JSON.stringify(durableDeploymentPatch(image))}\n`);
    return;
  }
  const expectedImageIndex = process.argv.indexOf('--expected-image');
  const expectedImage = expectedImageIndex >= 0 ? process.argv[expectedImageIndex + 1] : '';
  const expectedRevisionIndex = process.argv.indexOf('--expected-revision');
  const expectedRevision = expectedRevisionIndex >= 0 ? process.argv[expectedRevisionIndex + 1] : '';
  let input = '';
  for await (const chunk of process.stdin) input += chunk;
  const parsed = JSON.parse(input);
  const summary = process.argv.includes('--revisions')
    ? assertRevisionOwnership(parsed, expectedRevision)
    : assertDeploymentContract(parsed, expectedImage);
  process.stdout.write(`${JSON.stringify(summary)}\n`);
}

if (process.argv[1] && import.meta.url === new URL(process.argv[1], 'file:').href) {
  main().catch(error => {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  });
}
