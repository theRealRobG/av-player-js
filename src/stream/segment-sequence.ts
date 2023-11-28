import SegmentReference from './segment-reference';
import SegmentTemplate from './segment-template';

/**
 * Provides a continuous sequence of segments that can be concatenated to a buffer without
 * re-configuring the timeline.
 *
 * In DASH this may represent a representation from a single Period of content. In HLS this would
 * represent a set of segments within a single discontinuity sequence (between two
 * `EXT-X-DISCONTINUITY` markers).
 *
 * The main idea is that we expect to receive a stream of a/v data. The a/v data is segmented into
 * mp4 files but they are continuous. Sometimes we may switch to a different stream of a/v, for
 * example, due to an advert. At which point, this is a new sequence, and to maintain continuity of
 * playback, we will need to reason about this change and update the timestamps of where they are
 * inserted into the buffer. With MSE this is achieved via setting `timestampOffset` on the
 * `SourceBuffer` before appending.
 */
export default class SegmentSequence {
  public get estimatedStartTime(): number {
    return this.segmentTemplate.estimatedStartTime;
  }

  public get estimatedEndTime(): number {
    return this.segmentTemplate.estimatedEndTime;
  }

  public get isEnded(): boolean {
    return this.currentIndex >= this.segmentTemplate.length;
  }

  /**
   * Provides a continuous sequence of segments that can be concatenated to a buffer without
   * re-configuring the timeline.
   *
   * In DASH this may represent a representation from a single Period of content. In HLS this would
   * represent a set of segments within a single discontinuity sequence (between two
   * `EXT-X-DISCONTINUITY` markers).
   *
   * @param sequenceIndexId The identifier for what sequence index within the stream this segment
   * sequence represents. Two `SegmentSequence` instances with the same `sequenceIndexId` provide
   * segment references that belong on the same continuous timeline.
   * @param mimeCodec The MIME type (codec information) for the sequence.
   * @param initializationSegment The map segment that contains the parameter sets necessary for all
   * of the segment references contained in the sequence.
   * @param segmentTemplate The local segment references.
   * @param currentIndex The initial index of the sequence (defaults to 0).
   */
  constructor(
    public readonly sequenceIndexId: string,
    public readonly mimeCodec: string,
    public readonly initializationSegment: ArrayBuffer,
    private segmentTemplate: SegmentTemplate,
    private currentIndex = 0
  ) {}

  /**
   * Get the next segment reference and move the current index in the sequence up by one.
   *
   * @returns The next available reference in the sequence.
   */
  public next(): SegmentReference | undefined {
    if (this.isEnded) {
      return;
    }
    const segment = this.segmentTemplate.getSegmentByIndex(this.currentIndex);
    this.currentIndex++;
    return segment;
  }

  /**
   * Resets the sequence index to 0.
   */
  public reset() {
    this.currentIndex = 0;
  }

  /**
   * Move the `SegmentSequence` next reference to the desired time.
   *
   * This can be done in order to start buffering from a new location, for example, after a seek
   * command.
   *
   * @param time Desired time to move the sequence to for the `next` reference.
   * @returns Whether or not the sequence was moved successfully. `false` indicates that the desired
   * time was out of range of the `SegmentSequence`.
   */
  public moveToTime(time: number): boolean {
    // If the time is outside of the estimated range then early return unsuccessful.
    if (time < this.estimatedStartTime || time > this.estimatedEndTime) {
      return false;
    }
    // We will attempt to move from the current index. To do so we need to get where we are
    // currently.
    const currentReference = this.segmentTemplate.getSegmentByIndex(
      this.currentIndex
    );
    // If we're already outside of range then just start from 0.
    if (!currentReference) {
      return this.moveToTimeCountingUpFrom(time, 0);
    }
    // If we're already at the desired time then we can finish successfully without moving.
    const currentStart = currentReference.estimatedStartTime;
    const currentEnd = currentStart + currentReference.estimatedDuration;
    if (currentStart <= time && time < currentEnd) {
      return true;
    }
    // From here decide if we need to count up or down to find the desired time.
    if (currentStart < time) {
      return this.moveToTimeCountingUpFrom(time, this.currentIndex);
    } else {
      return this.moveToTimeCountingDownFrom(time, this.currentIndex);
    }
  }

  /**
   * Move up from current index until reference has end time greater than the desired time.
   *
   * Note that the assumption is that checks have been made beforehand that the starting index has
   * estimated end time earlier than the desired time. If the starting index has estimated end time
   * greater than the desired `time` already then this will return immediately as successful which
   * may be inaccurate.
   *
   * @param time Desired time to move the sequence to for the `next` reference.
   * @param startingIndex The index to start counting up from.
   * @returns Whether or not the sequence was moved successfully. `false` indicates that the desired
   * time was out of range of the `SegmentSequence`.
   */
  private moveToTimeCountingUpFrom(
    time: number,
    startingIndex: number
  ): boolean {
    for (let i = startingIndex; i < this.segmentTemplate.length; i++) {
      const ref = this.segmentTemplate.getSegmentByIndex(i);
      if (!ref) {
        // This is completely unexpected. I would even consider throwing error here. This means that
        // within the `SegmentTemplate` there is an "empty index", meaning, between 0 and its length
        // there is an index that does not have a reference. In reality, this won't happen, and so
        // this check should just be to satisfy the type system.
        return false;
      }
      const endTime = ref.estimatedStartTime + ref.estimatedDuration;
      if (time < endTime) {
        this.currentIndex = i;
        return true;
      }
    }
    return false;
  }

  /**
   * Move down from current index until reference has start time lower than the desired time.
   *
   * Note that the assumption is that checks have been made beforehand that the starting index has
   * estimated start time later than the desired time. If the starting index has estimated start
   * time lower than the desired `time` already then this will return immediately as successful
   * which may be inaccurate.
   *
   * @param time Desired time to move the sequence to for the `next` reference.
   * @param startingIndex The index to start counting down from.
   * @returns Whether or not the sequence was moved successfully. `false` indicates that the desired
   * time was out of range of the `SegmentSequence`.
   */
  private moveToTimeCountingDownFrom(
    time: number,
    startingIndex: number
  ): boolean {
    for (let i = startingIndex; i >= 0; i--) {
      const ref = this.segmentTemplate.getSegmentByIndex(i);
      if (!ref) {
        // This is completely unexpected. I would even consider throwing error here. This means that
        // within the `SegmentTemplate` there is an "empty index", meaning, between 0 and its length
        // there is an index that does not have a reference. In reality, this won't happen, and so
        // this check should just be to satisfy the type system.
        return false;
      }
      if (ref.estimatedStartTime <= time) {
        this.currentIndex = i;
        return true;
      }
    }
    return false;
  }
}
