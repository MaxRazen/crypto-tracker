import { EventEmitter } from 'node:events';

const SHUTDOWN_EVENT = 'shutdown';

type Listener = () => void;

export class EventBus extends EventEmitter {
    public onShutdown(listener: Listener) {
        this.addListener(SHUTDOWN_EVENT, listener);
    }

    public shutdown(): void {
        this.emit(SHUTDOWN_EVENT);
    }
}
