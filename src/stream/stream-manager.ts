import AbrDecisioner from '../abr/abr-decisioner';
import SampleBuffer from '../buffer/sample-buffer';
import AssetResolver from '../manifest/asset-resolver';
import Network from '../network';
import StreamRendition from './stream-rendition';
import {ContentType} from './stream-rendition-metadata';

export interface InitMimeCodecs {
  audioMimeCodec: string;
  videoMimeCodec: string;
}

export interface SampleResponse {
  sample?: SampleBuffer;
  moreSamplesMayBeResolved: boolean;
}

/**
 * Responsible for arranging the stream into a viewable timeline for playback.
 */
export default class StreamManager {
  private availableAudioRenditions: StreamRendition<ContentType.Audio>[] = [];
  private availableVideoRenditions: StreamRendition<ContentType.Video>[] = [];
  private currentAudioRendition?: StreamRendition<ContentType.Audio>;
  private currentVideoRendition?: StreamRendition<ContentType.Video>;

  constructor(
    private network: Network,
    private assetResolver: AssetResolver,
    private abrDecisioner: AbrDecisioner
  ) {}

  /**
   * Resolve the asset and select the starting audio and video rendition.
   */
  public async init(): Promise<InitMimeCodecs> {
    const {audioRenditions, videoRenditions} =
      await this.assetResolver.resolve();
    this.availableAudioRenditions = audioRenditions;
    this.availableVideoRenditions = videoRenditions;
    // TODO - add logic to pick first renditions.
    this.currentAudioRendition = audioRenditions[0];
    this.currentVideoRendition = videoRenditions[0];
    return {
      audioMimeCodec: `audio/mp4; codecs="${this.currentAudioRendition.metadata.codecs}"`,
      videoMimeCodec: `video/mp4; codecs="${this.currentVideoRendition.metadata.codecs}"`,
    };
  }

  /**
   * Get the next available sample.
   *
   * This may be a continuation within the current rendition or may come from a different rendition,
   * for example if there was an ABR switch in between calls to `nextSample`, or if there is no
   * media data left in this rendition and another rendition is able to continue the stream.
   *
   * @param contentType The desired content type of the sample.
   */
  public async nextSample(contentType: ContentType): Promise<SampleResponse> {
    let rendition: StreamRendition<ContentType> | undefined;
    switch (contentType) {
      case ContentType.Audio:
        rendition = this.currentAudioRendition;
        break;
      case ContentType.Video:
        rendition = this.currentVideoRendition;
        break;
    }
    if (!rendition) {
      throw new Error('TODO - error for no rendition selected on nextSample');
    }
    let segmentSequence = await rendition.currentSegmentSequence();
    let segmentReference = segmentSequence.next();
    if (!segmentReference) {
      const nextSegmentSequence = await rendition.nextSegmentSequence();
      if (!nextSegmentSequence) {
        // In this scenario, we could maybe switch rendition, or otherwise give back nothing.
        return {
          sample: undefined,
          moreSamplesMayBeResolved: !segmentSequence.isComplete(),
        };
      }
      segmentSequence = nextSegmentSequence;
      segmentReference = nextSegmentSequence.next();
    }
    if (!segmentReference) {
      // If still no segment reference then we should give up. This whole logic should be extracted
      // to a function to better hide this complexity.
      throw new Error('TODO - need to handle getting no reference');
    }
    const dataTask = this.network.dataTask({
      url: segmentReference.url,
      responseType: 'arraybuffer',
    });
    const mediaData = await dataTask.send();
    return {
      sample: {
        initData: segmentSequence.initializationSegment,
        mediaData,
        codec: rendition.metadata.codecs,
        sequenceIndexId: segmentSequence.sequenceIndexId,
        videoRange: (rendition as StreamRendition<ContentType.Video>).metadata
          .videoRange,
      },
      moreSamplesMayBeResolved: true,
    };
  }

  /**
   * Move the current stream to the desired content time and continue stream sequence from there.
   *
   * This can be done in order to start buffering from a new location, for example, after a seek
   * command.
   *
   * @param time The time in the stream we want to start playing from.
   */
  public moveToTime(time: number): Promise<SampleBuffer | undefined> {
    throw new Error('TODO - not implemented');
  }
}
