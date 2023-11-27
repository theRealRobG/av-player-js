import SegmentReference from './segment-reference';

/**
 * An object that provides a means for accessing segment references of a given segment sequence.
 *
 * The references should known when creating this template object, such that it does not require
 * additional network activity to obtain the URLs of the segments. The exception to this is the
 * live edge of a live asset which may need to be refreshed to obtain further segment references.
 */
export default interface SegmentTemplate {
  /**
   * The estimated start time of the template.
   *
   * This is only estimated as the true time will be derived more accurately from the first mp4
   * segment available in the template. In DASH or HLS this estimated time will be the time obtained
   * from the manifest.
   */
  estimatedStartTime: number;
  /**
   * The estimated end time of the template.
   *
   * This is only estimated as the true time will be derived more accurately from the last mp4
   * segment available in the template. In DASH or HLS this estimated time will be the time obtained
   * from the manifest.
   */
  estimatedEndTime: number;
  /**
   * The number of segment references known within this template.
   */
  length: number;
  /**
   * Indication of whether all references are known or if more references may be added later.
   *
   * In the context of DASH, this would be `true` for a `Period` that has completed (e.g. one in an
   * `MPD@type="static"` manifest or one where another `Period` exists afterwards) and `false` for
   * an incomplete `Period` (e.g. on the live edge of a dynamic manifest).
   *
   * In the context of HLS, this would be `true` for a discontinuity sequence that has closed (e.g.
   * any discontinuity sequence within a media playlist with an `EXT-X-ENDLIST` tag, or one within
   * a live playlist that has an `EXT-X-DISCONTINUITY` tag before the live edge of the playlist) and
   * `false` for a discontinuity sequence that has not been closed within a live playlist (e.g. the
   * sequence after the last `EXT-X-DISCONTINITY` in a live playlist).
   */
  isComplete: boolean;
  /**
   * Obtain a segment reference for a given time.
   *
   * If no reference exists for the desired time within this template then the response will be
   * `undefined`.
   *
   * @param time The desired time that the segment reference being searched for will cover.
   */
  getSegmentByTime(time: number): SegmentReference | undefined;
  /**
   * Obtain a segment reference by index within the template.
   *
   * If no reference exists for the desired index within this template then the response will be
   * `undefined`.
   *
   * @param index The index of the desired segment reference.
   */
  getSegmentByIndex(index: number): SegmentReference | undefined;
}
