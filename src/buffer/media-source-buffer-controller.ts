import EventEmitter from '../event-emitter';
import AVQueuedSampleBufferRenderer from './av-queued-sample-buffer-renderer';

/**
 * Controls buffering for the `MediaSource` object.
 *
 * The `MediaSourceBufferController` is responsible for managing buffering across the various buffer
 * types (e.g. video, audio), as well as sanitizing access to the `MediaSource` object.
 */
export default class MediaSourceBufferController extends EventEmitter<{}> {
  private videoBuffer: AVQueuedSampleBufferRenderer;
  private audioBuffer: AVQueuedSampleBufferRenderer;
  private mediaElement: HTMLMediaElement;
  private mediaSource: MediaSource;

  private onVideoBufferReadyForData = () => {
    // todo
  };

  private onVideoBufferError = (error: Error) => {
    console.error(error);
  };

  private onAudioBufferReadyForData = () => {
    // todo
  };

  private onAudioBufferError = (error: Error) => {
    console.error(error);
  };

  private onMediaSourceOpen = () => {
    // todo
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
}
