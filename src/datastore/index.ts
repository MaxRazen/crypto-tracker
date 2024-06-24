import { Datastore } from '@google-cloud/datastore';
import { RuntimeConfig } from '../config';

export function makeClient(cfg: RuntimeConfig): Datastore {
    return new Datastore({
        projectId: cfg.gcpProjectId,
        keyFile: cfg.gcpKeyfile,
        namespace: 'crypto-tracker',
    });
}
