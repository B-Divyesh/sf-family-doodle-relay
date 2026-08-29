import assert from 'node:assert/strict';
import test from 'node:test';

import {
  assertDeploymentContract,
  assertRevisionOwnership,
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
    { name: 'relay--old', properties: { active: false, replicas: 0, trafficWeight: 0 } },
    { name: 'sf-family-doodle-relay--repair', properties: { active: true, replicas: 1, trafficWeight: 100 } },
  ], 'sf-family-doodle-relay--repair'), {
    revision: 'sf-family-doodle-relay--repair',
    activeRevisions: 1,
    replicas: 1,
    trafficWeight: 100,
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
    { name: 'relay--old', properties: { active: true, replicas: 1, trafficWeight: 0 } },
    { name: 'relay--repair', properties: { active: true, replicas: 1, trafficWeight: 100 } },
  ];
  assert.deepEqual(revisionOwnershipErrors(revisions, 'relay--repair'), [
    'exactly one revision must be active, found 2',
  ]);
});
