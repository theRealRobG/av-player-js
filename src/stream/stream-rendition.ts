import SegmentSequence from './segment-sequence';
import {
  ContentType,
  AudioRenditionMetadata,
  VideoRenditionMetadata,
} from './stream-rendition-metadata';

interface ContentToRenditionTypeMap {
  [ContentType.Audio]: AudioRenditionMetadata;
  [ContentType.Video]: VideoRenditionMetadata;
}

export default interface StreamRendition<T extends ContentType> {
  /**
   * An identifier for the rendition.
   */
  identifier: string;
  /**
   * The content type of this rendition.
   */
  contentType: T;
  /**
   * Associated meatadata of the rendition to help with selection.
   */
  metadata: ContentToRenditionTypeMap[T];
  /**
   * Get the current sequence of segments that are associated with this rendition.
   *
   * For DASH this will be the `Representation` in the current `Period` that matches the details of
   * this `StreamRendition`.
   *
   * For HLS this will be the current discontinuity sequence within the current media playlist.
   *
   * If this is the first request then it can be expected that this triggers some network activity
   * to provide more information about the segment references.
   */
  currentSegmentSequence(): Promise<SegmentSequence>;
  /**
   * Get the next sequence of segments that are associated with this rendition.
   *
   * For DASH this will be the `Representation` in the next `Period` (if it exists) that matches the
   * details of this `StreamRendition`.
   *
   * For HLS this will be the next `EXT-X-DISCONTINUITY-SEQUENCE` within the same media playlist.
   *
   * This should kick off a download of a playlist if live and no next segment sequence exists. It
   * should also kick off a download of an init segment to be used with the segment sequence.
   */
  nextSegmentSequence(): Promise<SegmentSequence | undefined>;
  /**
   * Move the current segment sequence index to one that contains the desired time to start playing
   * from.
   *
   * This can be done in order to start buffering from a new location, for example, after a seek
   * command.
   *
   * @param time The time in the rendition we want to start playing from.
   */
  moveToTime(time: number): Promise<SegmentSequence | undefined>;
}
