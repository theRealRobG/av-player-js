import EventEmitter from '../utils/event-emitter';
import StreamManager from '../stream/stream-manager';
import AVQueuedSampleBufferRenderer from './av-queued-sample-buffer-renderer';

/**
 * Controls buffering for the `MediaSource` object.
 *
 * The `MediaSourceBufferController` is responsible for managing buffering across the various buffer
 * types (e.g. video, audio), as well as sanitizing access to the `MediaSource` object. It must
 * ensure that the buffer types are being fed from synchronized sources of data (i.e. from segment
 * sequences belonging to the same `sequenceIndexId`).
 */
export default class MediaSourceBufferController extends EventEmitter<{}> {
  private videoBuffer: AVQueuedSampleBufferRenderer;
  private audioBuffer: AVQueuedSampleBufferRenderer;
  private mediaElement: HTMLMediaElement;
  private mediaSource: MediaSource;

  /**
   * The stream manager is used to get data to feed into the buffer. This can be set after the
   * player has been created, or the user can re-use the same media source to start playing new
   * content, which is why this property is optional and late-set. In the future we can more easily
   * support a queue player approach by managing an array of stream managers.
   */
  private currentStreamManager?: StreamManager;
  /**
   * The sequence index is necessary to ensure that we are feeding audio and video buffers with data
   * that is consistent with each other. If we feed the buffers with data from different sequence
   * indexes then we will lose audio/video sync and likely present garbage in the player. Therefore,
   * before appending to any of the buffers, we need to ensure we are matching in our expectation of
   * current sequence index ID. If not, then we must take action to update the buffer state to match
   * our expectations.
   */
  private currentSequenceIndexId?: string;

  private onVideoBufferReadyForData = () => {
    throw new Error('TODO: not implemented');
  };

  private onVideoBufferError = (error: Error) => {
    console.error(error);
    throw new Error('TODO: not implemented');
  };

  private onAudioBufferReadyForData = () => {
    throw new Error('TODO: not implemented');
  };

  private onAudioBufferError = (error: Error) => {
    console.error(error);
    throw new Error('TODO: not implemented');
  };

  private onMediaSourceOpen = () => {
    throw new Error('TODO: not implemented');
  };

  constructor(mediaElement: HTMLMediaElement) {
    super({});
    this.mediaElement = mediaElement;
    this.mediaSource = new MediaSource();
    this.videoBuffer = new AVQueuedSampleBufferRenderer(
      this.mediaElement,
      this.mediaSource
    );
    this.audioBuffer = new AVQueuedSampleBufferRenderer(
      this.mediaElement,
      this.mediaSource
    );

    this.videoBuffer.requestMediaDataWhenReady(this.onVideoBufferReadyForData);
    this.videoBuffer.addEventListener('error', this.onVideoBufferError);
    this.audioBuffer.requestMediaDataWhenReady(this.onAudioBufferReadyForData);
    this.audioBuffer.addEventListener('error', this.onAudioBufferError);
    this.mediaSource.addEventListener('sourceopen', this.onMediaSourceOpen);
    // eslint-disable-next-line node/no-unsupported-features/node-builtins
    this.mediaElement.src = URL.createObjectURL(this.mediaSource);
  }

  public setStreamManager(streamManager: StreamManager) {
    // Missing from this method is a clean up of the video/audio buffers and ensuring that new media
    // is being buffered from synchronized sources.
    this.currentSequenceIndexId = undefined;
    this.currentStreamManager = streamManager;
    if (this.audioBuffer.isReadyForMoreMediaData) {
      this.onAudioBufferReadyForData();
    }
    if (this.videoBuffer.isReadyForMoreMediaData) {
      this.onVideoBufferReadyForData();
    }
  }
}
