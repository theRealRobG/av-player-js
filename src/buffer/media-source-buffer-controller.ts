import EventEmitter from '../utils/event-emitter';
import StreamManager from '../stream/stream-manager';
import AVQueuedSampleBufferRenderer from './av-queued-sample-buffer-renderer';
import {ContentType} from '../stream/stream-rendition-metadata';

/**
 * The status of an `AVQueuedSampleBufferRenderer` within the `MediaSourceBufferController`.
 *
 * This status provides information to the controller useful for coordinating what action to take
 * when new sample data becomes available.
 */
enum AvBufferStatus {
  /** The buffer is in a normal status waiting for samples to be appended. */
  Default,
  /** The buffer had the end segment last appended and so we are waiting to end the stream. */
  WaitingAfterEndSegment,
  /**
   * A disconitinuity is the next sample to be appended so we are waiting to sync the buffers before
   * doing so.
   */
  WaitingBeforeDiscontinuitySegment,
}

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
  private videoElement: HTMLVideoElement;
  private mediaSource: MediaSource;

  /**
   * This is set to `true` once we have set the initial mime types / codecs for the source buffers.
   */
  private hasInitialized = false;
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
  /**
   * Status of the audio buffer.
   *
   * Used to coordinate appending samples around sync points such as discontinuities and end of
   * stream.
   */
  private audioBufferStatus = AvBufferStatus.Default;
  /**
   * Status of the video buffer.
   *
   * Used to coordinate appending samples around sync points such as discontinuities and end of
   * stream.
   */
  private videoBufferStatus = AvBufferStatus.Default;

  private onVideoBufferReadyForData = async () => {
    this.handleAvBufferReadyForData(ContentType.Video);
  };

  private onAudioBufferReadyForData = async () => {
    this.handleAvBufferReadyForData(ContentType.Audio);
  };

  private onVideoBufferError = (error: Error) => {
    console.error(error);
    throw new Error('TODO: not implemented');
  };

  private onAudioBufferError = (error: Error) => {
    console.error(error);
    throw new Error('TODO: not implemented');
  };

  private onMediaSourceOpen = async () => {
    if (!this.currentStreamManager) {
      return;
    }
    try {
      const initMimeCodecs = await this.currentStreamManager.init();
      this.videoBuffer.init(initMimeCodecs.videoMimeCodec);
      this.audioBuffer.init(initMimeCodecs.audioMimeCodec);
    } catch (error) {
      // TODO - sort out errors
      console.error(error);
    }
  };

  constructor(videoElement: HTMLVideoElement) {
    super({});
    this.videoElement = videoElement;
    this.mediaSource = new MediaSource();
    this.videoBuffer = new AVQueuedSampleBufferRenderer(
      this.videoElement,
      this.mediaSource
    );
    this.audioBuffer = new AVQueuedSampleBufferRenderer(
      this.videoElement,
      this.mediaSource
    );

    this.videoBuffer.requestMediaDataWhenReady(this.onVideoBufferReadyForData);
    this.videoBuffer.addEventListener('error', this.onVideoBufferError);
    this.audioBuffer.requestMediaDataWhenReady(this.onAudioBufferReadyForData);
    this.audioBuffer.addEventListener('error', this.onAudioBufferError);
    this.mediaSource.addEventListener('sourceopen', this.onMediaSourceOpen);
    // eslint-disable-next-line node/no-unsupported-features/node-builtins
    this.videoElement.src = URL.createObjectURL(this.mediaSource);
  }

  public setStreamManager(streamManager: StreamManager) {
    // Missing from this method is a clean up of the video/audio buffers and ensuring that new media
    // is being buffered from synchronized sources.
    this.unsetStreamManager();
    this.currentStreamManager = streamManager;
    if (this.mediaSource.readyState === 'open') {
      this.onMediaSourceOpen();
    }
    // if (this.audioBuffer.isReadyForMoreMediaData) {
    //   this.onAudioBufferReadyForData();
    // }
    // if (this.videoBuffer.isReadyForMoreMediaData) {
    //   this.onVideoBufferReadyForData();
    // }
  }

  public unsetStreamManager() {
    this.videoBuffer.destroy();
    this.audioBuffer.destroy();
    this.currentSequenceIndexId = undefined;
    this.currentStreamManager = undefined;
  }

  private async handleAvBufferReadyForData(type: ContentType) {
    if (!this.currentStreamManager) {
      return;
    }
    // This logic will need to be cleaned up a lot; however, it will form the basis of how we sync
    // appends between audio and video.
    //
    // I can imagine having an operation queue to handle asking for more sample data and then
    // waiting afterwards when we are across sync points (such as end of stream or discontinuity),
    // such that we can set stuff like `timestampOffset` on SourceBuffer, or call `endOfStream()` on
    // `MediaSource` appropriately. This could also be useful for ensuring that audio and video
    // buffers don't run away from each other (no point in filling up one buffer to max while we
    // can't play due to not having enough buffer in the other content type).
    switch (type) {
      case ContentType.Audio:
        this.audioBufferStatus = AvBufferStatus.Default;
        break;
      case ContentType.Video:
        this.videoBufferStatus = AvBufferStatus.Default;
        break;
    }

    const {sample, moreSamplesMayBeResolved} =
      await this.currentStreamManager.nextSample(type);

    let setThisBufferStatus: (status: AvBufferStatus) => void;
    let otherBufferStatus: () => AvBufferStatus;
    let setOtherBufferStatus: (status: AvBufferStatus) => void;
    let thisBuffer: AVQueuedSampleBufferRenderer;
    switch (type) {
      case ContentType.Audio:
        setThisBufferStatus = s => (this.audioBufferStatus = s);
        otherBufferStatus = () => this.videoBufferStatus;
        setOtherBufferStatus = s => (this.videoBufferStatus = s);
        thisBuffer = this.audioBuffer;
        break;
      case ContentType.Video:
        setThisBufferStatus = s => (this.videoBufferStatus = s);
        otherBufferStatus = () => this.audioBufferStatus;
        setOtherBufferStatus = s => (this.audioBufferStatus = s);
        thisBuffer = this.videoBuffer;
        break;
    }
    if (!sample) {
      if (!moreSamplesMayBeResolved) {
        setThisBufferStatus(AvBufferStatus.WaitingAfterEndSegment);
      }
      if (otherBufferStatus() === AvBufferStatus.WaitingAfterEndSegment) {
        setThisBufferStatus(AvBufferStatus.Default);
        setOtherBufferStatus(AvBufferStatus.Default);
        this.mediaSource.endOfStream();
      }
    } else {
      thisBuffer.enqueue(sample);
    }
  }
}
