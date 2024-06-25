import { RuleContainer } from './container';
import { RuleDatastore } from './storage';
import { EventBus } from '../eventbus';
import { LocalDatastore } from '../datastore-local';

export function containerFactory(eventBus: EventBus, activationTimeout: number): RuleContainer {
    const ds: LocalDatastore = new LocalDatastore('.data/rules.json');

    const ruleDatastore: RuleDatastore = new RuleDatastore(ds);
    const ruleContainer: RuleContainer = new RuleContainer(ruleDatastore, activationTimeout);

    eventBus.on('ruleContainer:markAsCompleted', ruleContainer.markAsCompleted);

    return ruleContainer;
}
