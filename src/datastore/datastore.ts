import { Datastore } from '@google-cloud/datastore';

export function datastoreFactory(projectId: string, keyFile: string, namespace: string): Datastore {
    return new Datastore({
        projectId,
        keyFile,
        namespace,
    });
}
