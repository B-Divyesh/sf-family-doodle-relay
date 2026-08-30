import assert from 'node:assert/strict';
import test from 'node:test';

import {
  assertDeploymentContract,
  assertRevisionOwnership,
  durableDeploymentPatch,
  deploymentContractErrors,
  revisionOwnershipErrors,
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

test('@claim:deployment-topology accepts only one ready app instance using the durable relay volume and current image', () => {
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
  const patch = durableDeploymentPatch(image);
  const deployment = appWith(patch.properties.template);
  deployment.properties.configuration = patch.properties.configuration;

  assert.deepEqual(assertDeploymentContract(deployment, image), {
    revision: 'sf-family-doodle-relay--repair',
    image,
    replicas: 1,
    dataMount: '/data',
  });
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
