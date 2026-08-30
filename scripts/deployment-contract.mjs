#!/usr/bin/env node

import process from 'node:process';

const FULL_GIT_SHA = /^[0-9a-f]{40}$/;

export function durableDeploymentPatch(image, stableRevision = '') {
  if (!image) throw new Error('an image is required for the durable deployment patch');
  if (!stableRevision) throw new Error('a stable revision is required for a zero-traffic deployment');
  return {
    properties: {
      configuration: {
        activeRevisionsMode: 'Multiple',
        ingress: {
          traffic: [{ revisionName: stableRevision, weight: 100 }],
        },
      },
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

export function deploymentTemplateErrors(template, expectedImage = '') {
  const errors = [];
  const containers = template?.containers ?? [];
  const container = containers.find(item => item.name === 'app');
  const volumes = template?.volumes ?? [];
  const volume = volumes.find(item => item.name === 'relay-data');
  const mount = container?.volumeMounts?.find(item => item.volumeName === 'relay-data');

  if (template?.scale?.minReplicas !== 1) {
    errors.push('minimum replicas must be 1');
  }
  if (template?.scale?.maxReplicas !== 1) {
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
  return errors;
}

export function deploymentContractErrors(app, expectedImage = '') {
  const errors = [];
  const properties = app?.properties ?? {};
  const configuration = properties.configuration ?? {};
  const template = properties.template ?? {};

  if (configuration.activeRevisionsMode !== 'Single') {
    errors.push('active revisions mode must be Single');
  }
  errors.push(...deploymentTemplateErrors(template, expectedImage));
  if (properties.latestRevisionName !== properties.latestReadyRevisionName) {
    errors.push('latest revision is not ready');
  }
  return errors;
}

export function readyRevisionErrors(revision, expectedImage = '') {
  if (!revision) return ['revision is missing'];
  const errors = deploymentTemplateErrors(revision.properties?.template ?? {}, expectedImage);
  if (revision.properties?.healthState !== 'Healthy') {
    errors.push('revision must be healthy');
  }
  if (!['Running', 'RunningAtMaxScale'].includes(revision.properties?.runningState)) {
    errors.push('revision must be running');
  }
  if (revision.properties?.replicas !== 1) {
    errors.push('revision must have exactly one replica');
  }
  return errors;
}

export function assertReadyRevision(revision, expectedImage = '') {
  const errors = readyRevisionErrors(revision, expectedImage);
  if (errors.length) {
    throw new Error(`ready revision failed: ${errors.join('; ')}`);
  }
  return { revision: revision.name, replicas: 1, dataMount: '/data' };
}

function revisionNamed(revisions, name) {
  return revisions.find(revision => revision?.name === name);
}

export function promotionReadinessErrors(revisions, candidateRevision, stableRevision, expectedImage = '') {
  const errors = [];
  const candidate = revisionNamed(revisions, candidateRevision);
  const stable = revisionNamed(revisions, stableRevision);

  for (const error of readyRevisionErrors(candidate, expectedImage)) {
    errors.push(`candidate ${error}`);
  }
  if (candidate?.properties?.trafficWeight !== 0) {
    errors.push('candidate must remain at zero traffic until health succeeds');
  }
  for (const error of readyRevisionErrors(stable)) {
    errors.push(`stable ${error}`);
  }
  if (stable?.properties?.trafficWeight !== 100) {
    errors.push('stable revision must retain 100 percent of traffic before promotion');
  }
  return errors;
}

export function assertPromotionReady(revisions, candidateRevision, stableRevision, expectedImage = '') {
  const errors = promotionReadinessErrors(revisions, candidateRevision, stableRevision, expectedImage);
  if (errors.length) {
    throw new Error(`promotion readiness failed: ${errors.join('; ')}`);
  }
  return { candidate: candidateRevision, stable: stableRevision, candidateTraffic: 0, stableTraffic: 100 };
}

export function trafficSwitchErrors(revisions, candidateRevision, expectedImage = '') {
  const errors = [];
  const candidate = revisionNamed(revisions, candidateRevision);
  for (const error of readyRevisionErrors(candidate, expectedImage)) {
    errors.push(`candidate ${error}`);
  }
  if (candidate?.properties?.trafficWeight !== 100) {
    errors.push('healthy candidate must receive 100 percent of traffic');
  }
  const otherTraffic = revisions.filter(revision => (
    revision?.name !== candidateRevision && (revision?.properties?.trafficWeight ?? 0) !== 0
  ));
  if (otherTraffic.length) {
    errors.push('no other revision may receive traffic after promotion');
  }
  return errors;
}

export function assertTrafficSwitched(revisions, candidateRevision, expectedImage = '') {
  const errors = trafficSwitchErrors(revisions, candidateRevision, expectedImage);
  if (errors.length) {
    throw new Error(`traffic switch failed: ${errors.join('; ')}`);
  }
  return { revision: candidateRevision, replicas: 1, trafficWeight: 100 };
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
    if (owner.properties.healthState !== 'Healthy') {
      errors.push('active owner must be healthy');
    }
    if (!['Running', 'RunningAtMaxScale'].includes(owner.properties.runningState)) {
      errors.push('active owner must be running');
    }
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

export function sourceIdentityErrors({ requestedSha = '', checkoutSha = '', remoteSha = '', image = '', liveSha = '' }) {
  const errors = [];
  if (!FULL_GIT_SHA.test(requestedSha)) {
    errors.push('requested source must be a full lowercase Git commit SHA');
  }
  if (checkoutSha !== requestedSha) {
    errors.push(`checkout must match requested source ${requestedSha}`);
  }
  if (remoteSha !== requestedSha) {
    errors.push(`origin/main must advertise requested source ${requestedSha}`);
  }
  if (image && image.split(':').pop() !== requestedSha) {
    errors.push(`image tag must be the full requested source ${requestedSha}`);
  }
  if (liveSha && liveSha !== requestedSha) {
    errors.push(`live health must report requested source ${requestedSha}`);
  }
  return errors;
}

export function assertSourceIdentity(identity) {
  const errors = sourceIdentityErrors(identity);
  if (errors.length) {
    throw new Error(`source identity failed: ${errors.join('; ')}`);
  }
  return {
    source: identity.requestedSha,
    remote: identity.remoteSha,
    ...(identity.image ? { image: identity.image } : {}),
    ...(identity.liveSha ? { live: identity.liveSha } : {}),
  };
}

function argument(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] ?? '' : '';
}

async function main() {
  if (process.argv.includes('--template')) {
    const imageIndex = process.argv.indexOf('--image');
    const image = imageIndex >= 0 ? process.argv[imageIndex + 1] : '';
    process.stdout.write(`${JSON.stringify(durableDeploymentPatch(image, argument('--stable-revision')))}\n`);
    return;
  }
  if (process.argv.includes('--source-identity')) {
    const summary = assertSourceIdentity({
      requestedSha: argument('--requested-sha'),
      checkoutSha: argument('--checkout-sha'),
      remoteSha: argument('--remote-sha'),
      image: argument('--image'),
      liveSha: argument('--live-sha'),
    });
    process.stdout.write(`${JSON.stringify(summary)}\n`);
    return;
  }
  const expectedImageIndex = process.argv.indexOf('--expected-image');
  const expectedImage = expectedImageIndex >= 0 ? process.argv[expectedImageIndex + 1] : '';
  const expectedRevisionIndex = process.argv.indexOf('--expected-revision');
  const expectedRevision = expectedRevisionIndex >= 0 ? process.argv[expectedRevisionIndex + 1] : '';
  let input = '';
  for await (const chunk of process.stdin) input += chunk;
  const parsed = JSON.parse(input);
  let summary;
  if (process.argv.includes('--ready-revision')) {
    summary = assertReadyRevision(parsed, expectedImage);
  } else if (process.argv.includes('--promotion-ready')) {
    summary = assertPromotionReady(parsed, expectedRevision, argument('--stable-revision'), expectedImage);
  } else if (process.argv.includes('--traffic-switched')) {
    summary = assertTrafficSwitched(parsed, expectedRevision, expectedImage);
  } else if (process.argv.includes('--revisions')) {
    summary = assertRevisionOwnership(parsed, expectedRevision);
  } else {
    summary = assertDeploymentContract(parsed, expectedImage);
  }
  process.stdout.write(`${JSON.stringify(summary)}\n`);
}

if (process.argv[1] && import.meta.url === new URL(process.argv[1], 'file:').href) {
  main().catch(error => {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  });
}
