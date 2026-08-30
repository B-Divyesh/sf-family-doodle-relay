import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import {
  assertDeploymentContract,
  assertPromotionReady,
  assertReadyRevision,
  assertRevisionOwnership,
  assertSourceIdentity,
  assertTrafficSwitched,
  durableDeploymentPatch,
  deploymentContractErrors,
  deploymentTemplateErrors,
  promotionReadinessErrors,
  readyRevisionErrors,
  revisionOwnershipErrors,
  sourceIdentityErrors,
  trafficSwitchErrors,
} from '../scripts/deployment-contract.mjs';

const image = 'sociobotregistry.azurecr.io/sf-family-doodle-relay:repairsha123';

function appWith(template, revision = 'sf-family-doodle-relay--repair') {
  return {
    properties: {
      configuration: { activeRevisionsMode: 'Single' },
      latestRevisionName: revision,
      latestReadyRevisionName: revision,
      template,
    },
  };
}

function durableTemplate(templateImage = image) {
  return {
    containers: [{
      name: 'app',
      image: templateImage,
      volumeMounts: [{ volumeName: 'relay-data', mountPath: '/data' }],
    }],
    scale: { minReplicas: 1, maxReplicas: 1 },
    volumes: [{
      name: 'relay-data',
      storageType: 'AzureFile',
      storageName: 'family-doodle-relay-data',
      mountOptions: 'uid=10001,gid=10001,file_mode=0770,dir_mode=0770',
    }],
  };
}

function revision(name, {
  active = true,
  healthState = 'Healthy',
  runningState = 'RunningAtMaxScale',
  replicas = 1,
  trafficWeight = 0,
  template = durableTemplate(),
} = {}) {
  return {
    name,
    properties: { active, healthState, runningState, replicas, trafficWeight, template },
  };
}

test('rejects the verifier topology with three owners and no durable room store', () => {
  const genericFactoryDeployment = appWith({
    containers: [{ name: 'app', image }],
    scale: { minReplicas: 1, maxReplicas: 3 },
    volumes: null,
  });

  assert.deepEqual(deploymentContractErrors(genericFactoryDeployment, image), [
    'maximum replicas must be 1',
    'relay-data must be mounted at /data',
    'relay-data must use the family-doodle-relay-data Azure Files storage',
    'relay-data mount options must include uid=10001',
    'relay-data mount options must include gid=10001',
    'relay-data mount options must include file_mode=0770',
    'relay-data mount options must include dir_mode=0770',
  ]);
  assert.throws(
    () => assertDeploymentContract(genericFactoryDeployment, image),
    /maximum replicas must be 1/,
  );
});

test('regression: rejects V8-01 candidate revision before it can crash without relay storage', () => {
  // This is the precise shape returned by Azure for candidate b2242b83 after
  // the generic deployer replaced the durable template.  The image was right,
  // but the revision was unready because the runtime guard correctly rejected
  // the absent /data Azure Files mount.
  const verifierV8Candidate = appWith({
    containers: [{
      name: 'app',
      image: 'sociobotregistry.azurecr.io/sf-family-doodle-relay:b2242b83c022',
      env: [{ name: 'PORT', value: '8080' }],
    }],
    scale: { minReplicas: 1, maxReplicas: 3 },
    volumes: null,
  }, 'sf-family-doodle-relay--0000031');
  verifierV8Candidate.properties.latestReadyRevisionName = 'sf-family-doodle-relay--0000030';

  assert.deepEqual(
    deploymentContractErrors(
      verifierV8Candidate,
      'sociobotregistry.azurecr.io/sf-family-doodle-relay:b2242b83c022',
    ),
    [
      'maximum replicas must be 1',
      'relay-data must be mounted at /data',
      'relay-data must use the family-doodle-relay-data Azure Files storage',
      'relay-data mount options must include uid=10001',
      'relay-data mount options must include gid=10001',
      'relay-data mount options must include file_mode=0770',
      'relay-data mount options must include dir_mode=0770',
      'latest revision is not ready',
    ],
  );
});

test('regression V9-01: rejects candidate 4fdc1926 before an unmounted three-replica revision can take traffic', () => {
  const verifierV9Candidate = appWith({
    containers: [{
      name: 'app',
      image: 'sociobotregistry.azurecr.io/sf-family-doodle-relay:4fdc1926db1f',
      env: [{ name: 'PORT', value: '8080' }],
    }],
    scale: { minReplicas: 1, maxReplicas: 3 },
    volumes: null,
  }, 'sf-family-doodle-relay--0000033');
  verifierV9Candidate.properties.latestReadyRevisionName = 'sf-family-doodle-relay--0000032';

  assert.deepEqual(
    deploymentContractErrors(
      verifierV9Candidate,
      'sociobotregistry.azurecr.io/sf-family-doodle-relay:4fdc1926db1f',
    ),
    [
      'maximum replicas must be 1',
      'relay-data must be mounted at /data',
      'relay-data must use the family-doodle-relay-data Azure Files storage',
      'relay-data mount options must include uid=10001',
      'relay-data mount options must include gid=10001',
      'relay-data mount options must include file_mode=0770',
      'relay-data mount options must include dir_mode=0770',
      'latest revision is not ready',
    ],
  );
  assert.deepEqual(revisionOwnershipErrors([
    { name: 'sf-family-doodle-relay--0000032', properties: { active: true, replicas: 1, trafficWeight: 0 } },
    { name: 'sf-family-doodle-relay--0000033', properties: { active: true, replicas: 1, trafficWeight: 100 } },
  ], 'sf-family-doodle-relay--0000033'), [
    'exactly one revision must be active, found 2',
    'active owner must be healthy',
    'active owner must be running',
  ]);
});

test('regression V10-01: rejects the exact activation-failed revision that owned live traffic', () => {
  // Independent verification 10 observed this live topology for candidate
  // 8ab15b78893f: its generic deployment emitted revision 0000036 without
  // the durable template, while mounted revision 0000035 still served as the
  // only ready fallback. Keep this exact shape here so neither validator can
  // accidentally accept the split owner state again.
  const verifierV10App = appWith({
    containers: [{
      name: 'app',
      image: 'sociobotregistry.azurecr.io/sf-family-doodle-relay:8ab15b78893f',
      env: [{ name: 'PORT', value: '8080' }],
    }],
    scale: { minReplicas: 1, maxReplicas: 3 },
    volumes: null,
  }, 'sf-family-doodle-relay--0000036');
  verifierV10App.properties.latestReadyRevisionName = 'sf-family-doodle-relay--0000035';

  assert.deepEqual(
    deploymentContractErrors(
      verifierV10App,
      'sociobotregistry.azurecr.io/sf-family-doodle-relay:8ab15b78893f',
    ),
    [
      'maximum replicas must be 1',
      'relay-data must be mounted at /data',
      'relay-data must use the family-doodle-relay-data Azure Files storage',
      'relay-data mount options must include uid=10001',
      'relay-data mount options must include gid=10001',
      'relay-data mount options must include file_mode=0770',
      'relay-data mount options must include dir_mode=0770',
      'latest revision is not ready',
    ],
  );
  assert.deepEqual(revisionOwnershipErrors([
    {
      name: 'sf-family-doodle-relay--0000035',
      properties: {
        active: true,
        healthState: 'Healthy',
        runningState: 'RunningAtMaxScale',
        replicas: 1,
        trafficWeight: 0,
      },
    },
    {
      name: 'sf-family-doodle-relay--0000036',
      properties: {
        active: true,
        healthState: 'Unhealthy',
        runningState: 'ActivationFailed',
        replicas: 1,
        trafficWeight: 100,
      },
    },
  ], 'sf-family-doodle-relay--0000035'), [
    'exactly one revision must be active, found 2',
    'active owner must receive 100 percent of traffic',
  ]);
  assert.deepEqual(revisionOwnershipErrors([
    {
      name: 'sf-family-doodle-relay--0000036',
      properties: {
        active: true,
        healthState: 'Unhealthy',
        runningState: 'ActivationFailed',
        replicas: 1,
        trafficWeight: 100,
      },
    },
  ], 'sf-family-doodle-relay--0000036'), [
    'active owner must be healthy',
    'active owner must be running',
  ]);
});

test('regression V11-01: rejects candidate f2333f8 falling back to the old mounted build', () => {
  // Independent verification 11 observed the candidate image in revision
  // 0000038 with the generic three-replica template and no /data mount. Azure
  // assigned it all configured traffic even though activation failed, while
  // healthy revision 0000037 continued answering /health with the old build.
  const verifierV11App = appWith({
    containers: [{
      name: 'app',
      image: 'sociobotregistry.azurecr.io/sf-family-doodle-relay:f2333f8187d8',
      env: [{ name: 'PORT', value: '8080' }],
      volumeMounts: null,
    }],
    scale: {
      cooldownPeriod: 300,
      minReplicas: 1,
      maxReplicas: 3,
      pollingInterval: 30,
      rules: null,
    },
    volumes: null,
  }, 'sf-family-doodle-relay--0000038');
  verifierV11App.properties.latestReadyRevisionName = 'sf-family-doodle-relay--0000037';

  assert.deepEqual(
    deploymentContractErrors(
      verifierV11App,
      'sociobotregistry.azurecr.io/sf-family-doodle-relay:f2333f8187d8',
    ),
    [
      'maximum replicas must be 1',
      'relay-data must be mounted at /data',
      'relay-data must use the family-doodle-relay-data Azure Files storage',
      'relay-data mount options must include uid=10001',
      'relay-data mount options must include gid=10001',
      'relay-data mount options must include file_mode=0770',
      'relay-data mount options must include dir_mode=0770',
      'latest revision is not ready',
    ],
  );
  assert.deepEqual(revisionOwnershipErrors([
    {
      name: 'sf-family-doodle-relay--0000037',
      properties: {
        active: true,
        healthState: 'Healthy',
        runningState: 'RunningAtMaxScale',
        replicas: 1,
        trafficWeight: 0,
      },
    },
    {
      name: 'sf-family-doodle-relay--0000038',
      properties: {
        active: true,
        healthState: 'Unhealthy',
        runningState: 'ActivationFailed',
        replicas: 1,
        trafficWeight: 100,
      },
    },
  ], 'sf-family-doodle-relay--0000038'), [
    'exactly one revision must be active, found 2',
    'active owner must be healthy',
    'active owner must be running',
  ]);
});

test('regression V12-01: rejects activation-failed revision 0000041 and its hidden mounted owner', () => {
  const verifierV12App = appWith({
    containers: [{
      name: 'app',
      image: 'sociobotregistry.azurecr.io/sf-family-doodle-relay:8de1fb937699',
      env: [{ name: 'PORT', value: '8080' }],
      volumeMounts: null,
    }],
    scale: {
      cooldownPeriod: 300,
      minReplicas: 1,
      maxReplicas: 3,
      pollingInterval: 30,
      rules: null,
    },
    volumes: null,
  }, 'sf-family-doodle-relay--0000041');
  verifierV12App.properties.latestReadyRevisionName = 'sf-family-doodle-relay--0000040';

  assert.deepEqual(
    deploymentContractErrors(
      verifierV12App,
      'sociobotregistry.azurecr.io/sf-family-doodle-relay:8de1fb937699',
    ),
    [
      'maximum replicas must be 1',
      'relay-data must be mounted at /data',
      'relay-data must use the family-doodle-relay-data Azure Files storage',
      'relay-data mount options must include uid=10001',
      'relay-data mount options must include gid=10001',
      'relay-data mount options must include file_mode=0770',
      'relay-data mount options must include dir_mode=0770',
      'latest revision is not ready',
    ],
  );
  assert.deepEqual(revisionOwnershipErrors([
    {
      name: 'sf-family-doodle-relay--0000040',
      properties: {
        active: true,
        healthState: 'Healthy',
        runningState: 'RunningAtMaxScale',
        replicas: 1,
        trafficWeight: 0,
      },
    },
    {
      name: 'sf-family-doodle-relay--0000041',
      properties: {
        active: true,
        healthState: 'Unhealthy',
        runningState: 'ActivationFailed',
        replicas: 1,
        trafficWeight: 100,
      },
    },
  ], 'sf-family-doodle-relay--0000041'), [
    'exactly one revision must be active, found 2',
    'active owner must be healthy',
    'active owner must be running',
  ]);
});

test('regression V12-02: rejects the unavailable requested SHA before a release starts', () => {
  const requestedSha = '8de1fb7dcf1930585f27967ac544462a987f81de';
  const availableSha = '8de1fb9376990e5e204cc32c0d6c1c016ab06b40';
  const identity = {
    requestedSha,
    checkoutSha: availableSha,
    remoteSha: availableSha,
  };

  assert.deepEqual(sourceIdentityErrors(identity), [
    `checkout must match requested source ${requestedSha}`,
    `origin/main must advertise requested source ${requestedSha}`,
  ]);
  assert.throws(
    () => assertSourceIdentity(identity),
    /source identity failed: checkout must match requested source/,
  );
});

test('regression V13-01: rejects exact activation-failed 0000045 and prevents its premature traffic ownership', () => {
  const fullImage = 'sociobotregistry.azurecr.io/sf-family-doodle-relay:34039ec343f72069dacbf97a16f50384ac77920e';
  const shortImage = 'sociobotregistry.azurecr.io/sf-family-doodle-relay:34039ec343f7';
  const verifierV13App = appWith({
    containers: [{
      name: 'app',
      image: shortImage,
      env: [{ name: 'PORT', value: '8080' }],
      volumeMounts: null,
    }],
    scale: {
      cooldownPeriod: 300,
      minReplicas: 1,
      maxReplicas: 3,
      pollingInterval: 30,
      rules: null,
    },
    volumes: null,
  }, 'sf-family-doodle-relay--0000045');
  verifierV13App.properties.latestReadyRevisionName = 'sf-family-doodle-relay--0000044';

  assert.deepEqual(deploymentContractErrors(verifierV13App, fullImage), [
    'maximum replicas must be 1',
    `app image must be ${fullImage}`,
    'relay-data must be mounted at /data',
    'relay-data must use the family-doodle-relay-data Azure Files storage',
    'relay-data mount options must include uid=10001',
    'relay-data mount options must include gid=10001',
    'relay-data mount options must include file_mode=0770',
    'relay-data mount options must include dir_mode=0770',
    'latest revision is not ready',
  ]);

  const stable = revision('sf-family-doodle-relay--0000044', {
    trafficWeight: 0,
    template: durableTemplate(fullImage),
  });
  const failedCandidate = revision('sf-family-doodle-relay--0000045', {
    healthState: 'Unhealthy',
    runningState: 'ActivationFailed',
    trafficWeight: 100,
    template: verifierV13App.properties.template,
  });

  assert.deepEqual(
    promotionReadinessErrors(
      [stable, failedCandidate],
      failedCandidate.name,
      stable.name,
      fullImage,
    ),
    [
      'candidate maximum replicas must be 1',
      `candidate app image must be ${fullImage}`,
      'candidate relay-data must be mounted at /data',
      'candidate relay-data must use the family-doodle-relay-data Azure Files storage',
      'candidate relay-data mount options must include uid=10001',
      'candidate relay-data mount options must include gid=10001',
      'candidate relay-data mount options must include file_mode=0770',
      'candidate relay-data mount options must include dir_mode=0770',
      'candidate revision must be healthy',
      'candidate revision must be running',
      'candidate must remain at zero traffic until health succeeds',
      'stable revision must retain 100 percent of traffic before promotion',
    ],
  );
  assert.throws(
    () => assertTrafficSwitched([stable, failedCandidate], failedCandidate.name, fullImage),
    /candidate revision must be healthy/,
  );
});

test('deployment contract rejects either replica bound outside exactly one', () => {
  const tooFew = revision('relay--min-zero', {
    template: { ...durableTemplate(), scale: { minReplicas: 0, maxReplicas: 1 } },
  });
  const tooMany = revision('relay--max-two', {
    template: { ...durableTemplate(), scale: { minReplicas: 1, maxReplicas: 2 } },
  });

  assert.deepEqual(readyRevisionErrors(tooFew, image), ['minimum replicas must be 1']);
  assert.deepEqual(readyRevisionErrors(tooMany, image), ['maximum replicas must be 1']);
});

test('promotion requires healthy zero-traffic candidate, then verifies the complete traffic switch', () => {
  const stable = revision('relay--stable', { trafficWeight: 100 });
  const candidate = revision('relay--candidate', { trafficWeight: 0 });

  assert.deepEqual(assertReadyRevision(candidate, image), {
    revision: 'relay--candidate',
    replicas: 1,
    dataMount: '/data',
  });
  assert.deepEqual(assertPromotionReady(
    [stable, candidate],
    candidate.name,
    stable.name,
    image,
  ), {
    candidate: 'relay--candidate',
    stable: 'relay--stable',
    candidateTraffic: 0,
    stableTraffic: 100,
  });
  assert.deepEqual(trafficSwitchErrors([stable, candidate], candidate.name, image), [
    'healthy candidate must receive 100 percent of traffic',
    'no other revision may receive traffic after promotion',
  ]);

  stable.properties.trafficWeight = 0;
  candidate.properties.trafficWeight = 100;
  assert.deepEqual(assertTrafficSwitched([stable, candidate], candidate.name, image), {
    revision: 'relay--candidate',
    replicas: 1,
    trafficWeight: 100,
  });
});

test('promotion refuses an unhealthy revision even when its durable template is correct', () => {
  const stable = revision('relay--stable', { trafficWeight: 100 });
  const candidate = revision('relay--candidate', {
    healthState: 'Unhealthy',
    runningState: 'ActivationFailed',
    trafficWeight: 0,
  });

  assert.deepEqual(promotionReadinessErrors(
    [stable, candidate],
    candidate.name,
    stable.name,
    image,
  ), [
    'candidate revision must be healthy',
    'candidate revision must be running',
  ]);
});

test('deploy script validates candidate health before assigning candidate traffic', () => {
  const script = readFileSync(new URL('../scripts/deploy-container.sh', import.meta.url), 'utf8');
  const readinessGate = script.indexOf('--promotion-ready');
  const candidateSwitch = script.indexOf('--revision-weight "${candidate_revision}=100"');
  const switchedGate = script.indexOf('--traffic-switched');
  const retirement = script.indexOf('echo "== deactivate superseded app revisions"');

  assert.ok(readinessGate >= 0, 'promotion readiness gate must be invoked');
  assert.ok(candidateSwitch > readinessGate, 'traffic switch must follow candidate health validation');
  assert.ok(switchedGate > candidateSwitch, 'traffic switch must be verified');
  assert.ok(retirement > switchedGate, 'the stable owner must remain until switched traffic is verified');
});

test('@claim:deployment-topology accepts only a pushed exact build with one ready durable app instance', () => {
  const source = '0123456789abcdef0123456789abcdef01234567';
  assert.deepEqual(assertSourceIdentity({
    requestedSha: source,
    checkoutSha: source,
    remoteSha: source,
    image: `sociobotregistry.azurecr.io/sf-family-doodle-relay:${source}`,
    liveSha: source,
  }), {
    source,
    remote: source,
    image: `sociobotregistry.azurecr.io/sf-family-doodle-relay:${source}`,
    live: source,
  });
  assert.throws(() => assertSourceIdentity({
    requestedSha: source,
    checkoutSha: source,
    remoteSha: '76543210fedcba9876543210fedcba9876543210',
  }), /origin\/main must advertise requested source/);

  const configuredDeployment = appWith({
    containers: [{
      name: 'app',
      image,
      volumeMounts: [{ volumeName: 'relay-data', mountPath: '/data' }],
    }],
    scale: { minReplicas: 1, maxReplicas: 1 },
    volumes: [{
      name: 'relay-data',
      storageType: 'AzureFile',
      storageName: 'family-doodle-relay-data',
      mountOptions: 'uid=10001,gid=10001,file_mode=0770,dir_mode=0770',
    }],
  });

  assert.deepEqual(assertDeploymentContract(configuredDeployment, image), {
    revision: 'sf-family-doodle-relay--repair',
    image,
    replicas: 1,
    dataMount: '/data',
  });
  assert.deepEqual(assertRevisionOwnership([
    {
      name: 'relay--old',
      properties: {
        active: false,
        healthState: 'Healthy',
        runningState: 'Running',
        replicas: 0,
        trafficWeight: 0,
      },
    },
    {
      name: 'sf-family-doodle-relay--repair',
      properties: {
        active: true,
        healthState: 'Healthy',
        runningState: 'RunningAtMaxScale',
        replicas: 1,
        trafficWeight: 100,
      },
    },
  ], 'sf-family-doodle-relay--repair'), {
    revision: 'sf-family-doodle-relay--repair',
    activeRevisions: 1,
    replicas: 1,
    trafficWeight: 100,
  });
});

test('deployment patch starts a new image with durable single-owner storage already attached', () => {
  const patch = durableDeploymentPatch(image, 'sf-family-doodle-relay--stable');

  assert.deepEqual(patch.properties.configuration, {
    activeRevisionsMode: 'Multiple',
    ingress: {
      traffic: [{ revisionName: 'sf-family-doodle-relay--stable', weight: 100 }],
    },
  });
  assert.deepEqual(deploymentTemplateErrors(patch.properties.template, image), []);
  assert.throws(() => durableDeploymentPatch(image), /stable revision is required/);
});

test('rejects an unready revision or a stale image', () => {
  const deployment = appWith({
    containers: [{
      name: 'app',
      image,
      volumeMounts: [{ volumeName: 'relay-data', mountPath: '/data' }],
    }],
    scale: { minReplicas: 1, maxReplicas: 1 },
    volumes: [{
      name: 'relay-data',
      storageType: 'AzureFile',
      storageName: 'family-doodle-relay-data',
      mountOptions: 'uid=10001,gid=10001,file_mode=0770,dir_mode=0770',
    }],
  }, 'sf-family-doodle-relay--not-ready');
  deployment.properties.latestReadyRevisionName = 'sf-family-doodle-relay--old';

  assert.deepEqual(deploymentContractErrors(deployment, 'registry.invalid/new:image'), [
    'app image must be registry.invalid/new:image',
    'latest revision is not ready',
  ]);
});

test('rejects an old active owner even when it has zero traffic', () => {
  const revisions = [
    {
      name: 'relay--old',
      properties: {
        active: true,
        healthState: 'Healthy',
        runningState: 'Running',
        replicas: 1,
        trafficWeight: 0,
      },
    },
    {
      name: 'relay--repair',
      properties: {
        active: true,
        healthState: 'Healthy',
        runningState: 'RunningAtMaxScale',
        replicas: 1,
        trafficWeight: 100,
      },
    },
  ];
  assert.deepEqual(revisionOwnershipErrors(revisions, 'relay--repair'), [
    'exactly one revision must be active, found 2',
  ]);
});

test('source identity accepts one full SHA across checkout, remote, image, and live health', () => {
  const source = '0123456789abcdef0123456789abcdef01234567';
  const identity = {
    requestedSha: source,
    checkoutSha: source,
    remoteSha: source,
    image: `sociobotregistry.azurecr.io/sf-family-doodle-relay:${source}`,
    liveSha: source,
  };

  assert.deepEqual(assertSourceIdentity(identity), {
    source,
    remote: source,
    image: identity.image,
    live: source,
  });
});

test('source identity rejects abbreviated image tags and stale live health', () => {
  const source = '0123456789abcdef0123456789abcdef01234567';
  assert.deepEqual(sourceIdentityErrors({
    requestedSha: source,
    checkoutSha: source,
    remoteSha: source,
    image: 'sociobotregistry.azurecr.io/sf-family-doodle-relay:0123456789ab',
    liveSha: '76543210fedcba9876543210fedcba9876543210',
  }), [
    `image tag must be the full requested source ${source}`,
    `live health must report requested source ${source}`,
  ]);
});
