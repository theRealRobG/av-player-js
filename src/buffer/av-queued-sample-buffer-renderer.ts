import EventEmitter from '../event-emitter';

interface EventMap {
  error: Error;
}

export interface SourceBufferFactory {
  addSourceBuffer(type: string): SourceBuffer;
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
    return (
      this.pendingSampleDataForEnqueue.length === 0 &&
      !this.sourceBuffer.updating
    );
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
   * We only append to the `SampleBuffer` while not `updating`. This is so we can better understand
   * our current end of buffered content before appending the next segment, as this can affect
   * whether we need another one, and also what `timestampOffset` we need to set.
   */
  private pendingSampleDataForEnqueue: ArrayBuffer[] = [];

  private onSourceBufferError = () => {
    this.notifyEvent('error', new Error('Error on SourceBuffer'));
  };

  private onSourceBufferUpdateEnd = () => {
    const sampleBuffer = this.pendingSampleDataForEnqueue.shift();
    if (sampleBuffer) {
      this.enqueue(sampleBuffer);
    } else if (this.isReadyForMoreMediaData && this.mediaDataReadyCallback) {
      this.mediaDataReadyCallback();
    }
  };

  constructor(
    mediaTimeBase: MediaTimeBase,
    sourceBufferFactor: SourceBufferFactory
  ) {
    super({
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
    sourceBuffer.mode = 'segments';
    sourceBuffer.addEventListener('error', this.onSourceBufferError);
    sourceBuffer.addEventListener('updateend', this.onSourceBufferUpdateEnd);
    if (this.mediaDataReadyCallback) {
      this.mediaDataReadyCallback();
    }
  }

  /**
   * Sends a sample buffer to the queue for rendering.
   *
   * @param sampleBuffer The sample buffer (mp4 segment) to be enqueued.
   */
  public enqueue(sampleBuffer: ArrayBuffer): void {
    if (!this.sourceBuffer || !this.isReadyForMoreMediaData) {
      this.pendingSampleDataForEnqueue.push(sampleBuffer);
    } else {
      this.sourceBuffer.appendBuffer(sampleBuffer);
    }
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
  }

  /**
   * Discards all pending enqueued sample buffers.
   */
  public flush(): void {
    throw new Error('Method not implemented.');
  }
}
