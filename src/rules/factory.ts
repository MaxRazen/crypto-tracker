import { RuleContainer } from './container';
import { RuleDatastore } from './storage';
import { LocalDatastore } from '../datastore-local';

export function containerFactory(activationTimeout: number): RuleContainer {
    const ds: LocalDatastore = new LocalDatastore('.data/rules.json');

    const ruleDatastore: RuleDatastore = new RuleDatastore(ds);
    const ruleContainer: RuleContainer = new RuleContainer(ruleDatastore, activationTimeout);

    return ruleContainer;
}
