import { Datastore, Key, Entity } from '@google-cloud/datastore';
import { Rule } from '../types';

const ENTITY_KEY = 'rules';

export async function fetchAllActive(ds: Datastore): Promise<Rule[]> {
    const query = ds.createQuery(ENTITY_KEY);
    const [rules] = await ds.runQuery(query);

    return [];
    // return rules.map((r: Entity): Rule => {
    //     return {

    //     }
    // });
}
