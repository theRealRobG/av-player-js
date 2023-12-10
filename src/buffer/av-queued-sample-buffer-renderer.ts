import AsyncOperationQueue, {
  AsyncOperation,
} from '../utils/async-operation-queue';
import EventEmitter from '../utils/event-emitter';
import SampleBuffer from './sample-buffer';

interface EventMap {
  sourceBufferInitialized: SourceBuffer;
  sourceBufferDidUpdate: void;
  mediaDataReadyCallbackSet: () => void;
  mediaDataReadyCallbackUnset: void;
  error: Error;
}

enum OperationType {
  AppendSample,
  WaitForUpdateEnd,
  WaitForSourceBufferInit,
}

export interface SourceBufferFactory {
  addSourceBuffer(type: string): SourceBuffer;
  removeSourceBuffer(sourceBuffer: SourceBuffer): void;
}

export interface MediaTimeBase {
  currentTime: number;
  playbackRate: number;
}

/**
 * Responsible for enqueuing sample buffers (mp4 segments) for presentation.
 *
 * The `AVQueuedSampleBufferRenderer` is used to enqueue sample data to internal `SourceBuffer`
 * objects. It tries to simplify some of the state handling of `SourceBuffer` and provide better
 * insight into buffer status before appending.
 */
export default class AVQueuedSampleBufferRenderer extends EventEmitter<EventMap> {
  /**
   * A Boolean value that indicates whether the receiver is able to accept more sample buffers.
   */
  public get isReadyForMoreMediaData(): boolean {
    if (!this.sourceBuffer) {
      return false;
    }
    return !this.isAppendingSampleData && !this.sourceBuffer.updating;
  }

  /**
   * Likely to be the `HTMLMediaElement`. Used to provide timing information to know if more buffer
   * is required.
   */
  private mediaTimeBase: MediaTimeBase;
  /**
   * Likely to be the `MediaSource`. Used to allow the `AVQueuedSampeBufferRenderer` to create its
   * own `SourceBuffer` and start appending samples to the buffer.
   */
  private sourceBufferFactory: SourceBufferFactory;
  /**
   * This is created in `init` which is likely to be called by the parent when the `MediaSource` has
   * become open.
   */
  private sourceBuffer: SourceBuffer | undefined;
  /**
   * A callback that is set by the parent to know when the renderer is ready for more data.
   */
  private mediaDataReadyCallback: (() => void) | undefined;
  /**
   * A queue for helping ensure ordering of operations. For example, we only append to the
   * `SampleBuffer` while not `updating`.
   */
  private operationQueue = new AsyncOperationQueue<OperationType>();
  /**
   * A convenience getter to indicate whether the queue is currently appending sample data or not.
   */
  private get isAppendingSampleData(): boolean {
    return this.operationQueue.hasOperationType(OperationType.AppendSample);
  }
  /**
   * The init data that has last been added to the `SourceBuffer`. If new media samples need to be
   * enqueued that require a different init segment then this needs to be updated. This should be
   * stored here by reference without manipulation, so hopefully JavaScript isn't doing any
   * unnecessary data copies.
   */
  private currentInitData?: ArrayBuffer;

  private onSourceBufferError = () => {
    this.notifyEvent('error', new Error('Error on SourceBuffer'));
  };

  private onSourceBufferUpdateEnd = () => {
    this.notifyEvent('sourceBufferDidUpdate');
    if (this.isAppendingSampleData) {
      // Wait until the current operation queue finishes before asking for more data.
      return;
    }
    if (this.isReadyForMoreMediaData && this.mediaDataReadyCallback) {
      this.mediaDataReadyCallback();
    }
  };

  constructor(
    mediaTimeBase: MediaTimeBase,
    sourceBufferFactor: SourceBufferFactory
  ) {
    super({
      sourceBufferInitialized: new Set(),
      sourceBufferDidUpdate: new Set(),
      mediaDataReadyCallbackSet: new Set(),
      mediaDataReadyCallbackUnset: new Set(),
      error: new Set(),
    });
    this.mediaTimeBase = mediaTimeBase;
    this.sourceBufferFactory = sourceBufferFactor;
  }

  /**
   * Initializes the buffer renderer.
   *
   * This creates the SourceBuffer and instructs the renderer to start asking for data.
   *
   * @param mimeCodec The mime type of the source buffer to add.
   */
  public init(mimeCodec: string) {
    const sourceBuffer = this.sourceBufferFactory.addSourceBuffer(mimeCodec);
    this.sourceBuffer = sourceBuffer;
    sourceBuffer.mode = 'segments';
    sourceBuffer.addEventListener('error', this.onSourceBufferError);
    sourceBuffer.addEventListener('updateend', this.onSourceBufferUpdateEnd);
    this.notifyEvent('sourceBufferInitialized', sourceBuffer);
    if (this.mediaDataReadyCallback) {
      this.mediaDataReadyCallback();
    }
  }

  public destroy() {
    if (this.sourceBuffer) {
      this.sourceBuffer.removeEventListener('error', this.onSourceBufferError);
      this.sourceBuffer.removeEventListener(
        'updateend',
        this.onSourceBufferUpdateEnd
      );
      this.mediaDataReadyCallback = undefined;
      this.sourceBufferFactory.removeSourceBuffer(this.sourceBuffer);
    }
  }

  /**
   * Sends a sample buffer to the queue for rendering.
   *
   * @param sampleBuffer The sample buffer (mp4 segment) to be enqueued.
   */
  public enqueue(sampleBuffer: SampleBuffer): void {
    // Wait for source buffer to be set
    this.operationQueue.addOperation(
      new AsyncOperation<OperationType>(
        OperationType.WaitForSourceBufferInit,
        async op => {
          if (op.isCancelled || this.sourceBuffer) {
            // If cancelled or source buffer already set then we can exit early
            return;
          } else {
            // Otherwise wait for the source buffer to be initialized
            await this.waitForEvent('sourceBufferInitialized');
          }
        }
      )
    );
    // Wait for any existing updates to end
    this.operationQueue.addOperation(
      new AsyncOperation<OperationType>(
        OperationType.WaitForUpdateEnd,
        async op => {
          if (op.isCancelled) {
            // If cancelled then we can exit early
            return;
          } else if (this.sourceBuffer?.updating) {
            // If updating then wait for update end event
            await this.waitForEvent('sourceBufferDidUpdate');
          }
        }
      )
    );
    // Append sample data to source buffer
    this.operationQueue.addOperation(
      new AsyncOperation<OperationType>(
        OperationType.AppendSample,
        async op => {
          if (op.isCancelled) {
            return;
          }
          if (this.currentInitData !== sampleBuffer.initData) {
            this.currentInitData = sampleBuffer.initData;
            // Creating the updateend promise earlier than appending, just in case apppend results
            // in an immediate updateend and we lose the event before waiting for it (it sounds
            // unlikely but after enough years of async programming I am paranoid of stuff like
            // that).
            const waitForUpdateEnd = this.waitForEvent('sourceBufferDidUpdate');
            this.sourceBuffer?.appendBuffer(sampleBuffer.initData);
            await waitForUpdateEnd;
          }
          this.sourceBuffer?.appendBuffer(sampleBuffer.mediaData);
        }
      )
    );
  }

  /**
   * Tells the target to invoke a client-supplied block in order to gather sample buffers for
   * playback.
   *
   * When this method is called multiple times, only the last call is implemented. Pair each call to
   * `requestMediaDataWhenReady` with a corresponding call to `stopRequestingMediaData`.
   *
   * @param using A block that enqueues sample buffers until the receiver is no longer ready or
   * there is no more data to supply.
   */
  public requestMediaDataWhenReady(using: () => void): void {
    this.mediaDataReadyCallback = using;
    this.notifyEvent('mediaDataReadyCallbackSet', using);
    if (this.isReadyForMoreMediaData) {
      using();
    }
  }

  /**
   * Cancels any current `requestMediaDataWhenReady` call.
   *
   * Always pair a call to `requestMediaDataWhenReady` with this method. You can call this method
   * from inside or outside of the requesting method’s block parameter.
   */
  public stopRequestingMediaData(): void {
    this.mediaDataReadyCallback = undefined;
    this.notifyEvent('mediaDataReadyCallbackUnset');
  }

  /**
   * Discards all pending enqueued sample buffers.
   */
  public flush(): void {
    throw new Error('Method not implemented.');
  }
}
