import AbrDecisioner from '../abr/abr-decisioner';
import SampleBuffer from '../buffer/sample-buffer';
import AssetResolver from '../manifest/asset-resolver';
import Network from '../network';
import StreamRendition from './stream-rendition';
import {ContentType} from './stream-rendition-metadata';

/**
 * Responsible for arranging the stream into a viewable timeline for playback.
 */
export default class StreamManager {
  private availableAudioRenditions: StreamRendition<ContentType.Audio>[] = [];
  private availableVideoRenditions: StreamRendition<ContentType.Video>[] = [];
  private currentAudioRendition?: StreamRendition<ContentType.Audio>;
  private currentVideoRendition?: StreamRendition<ContentType.Video>;
  private currentTime = 0;

  constructor(
    private network: Network,
    private assetResolver: AssetResolver,
    private abrDecisioner: AbrDecisioner
  ) {}

  /**
   * Resolve the asset and select the starting audio and video rendition.
   */
  public async init() {
    const {audioRenditions, videoRenditions} =
      await this.assetResolver.resolve();
    this.availableAudioRenditions = audioRenditions;
    this.availableVideoRenditions = videoRenditions;
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
  public nextSample(contentType: ContentType): Promise<SampleBuffer> {
    throw new Error('TODO - not implemented');
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
