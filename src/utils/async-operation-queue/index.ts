import EventEmitter from '../event-emitter';

interface AsyncOperationEventMap {
  completed: void;
}

export class AsyncOperation<
  T extends string | number,
> extends EventEmitter<AsyncOperationEventMap> {
  public isCancelled = false;

  constructor(
    public type: T,
    private action: (op: AsyncOperation<T>) => Promise<void>
  ) {
    super({completed: new Set()});
  }

  public run() {
    this.action(this).finally(() => this.notifyEvent('completed'));
  }
}

export default class AsyncOperationQueue<T extends string | number> {
  private operationQueue: AsyncOperation<T>[] = [];

  private onOperationCompleted = () => {
    // Remove completed operation
    const completedOperation = this.operationQueue.shift();
    completedOperation?.removeEventListener(
      'completed',
      this.onOperationCompleted
    );
    // Start next operation if it exists
    if (this.operationQueue.length > 0) {
      this.startOperation(this.operationQueue[0]);
    }
  };

  public isEmpty(): boolean {
    return this.operationQueue.length === 0;
  }

  public hasOperationType(type: T): boolean {
    for (let i = 0; i < this.operationQueue.length; i++) {
      if (this.operationQueue[i].type === type) {
        return true;
      }
    }
    return false;
  }

  public addOperation(operation: AsyncOperation<T>) {
    this.operationQueue.push(operation);
    if (this.operationQueue.length === 1) {
      this.startOperation(operation);
    }
  }

  public removeOperationAtIndex(index: number) {
    const operation = this.operationQueue[index];
    if (operation) {
      operation.isCancelled = true;
    }
    if (index === 0) {
      this.onOperationCompleted();
    } else {
      this.operationQueue.splice(index, 1);
    }
  }

  public removeOperation(operation: AsyncOperation<T>) {
    const index = this.operationQueue.findIndex(op => op === operation);
    if (index !== -1) {
      this.removeOperationAtIndex(index);
    }
  }

  private startOperation(operation: AsyncOperation<T>) {
    operation.addEventListener('completed', this.onOperationCompleted);
    operation.run();
  }
}
