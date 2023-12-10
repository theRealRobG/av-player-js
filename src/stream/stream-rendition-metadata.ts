export enum ContentType {
  Audio,
  Video,
}

export interface VideoResolution {
  width: number;
  height: number;
}

export enum VideoRange {
  /**
   * SDR indicates that the video is encoded using one of the following reference opto-electronic
   * transfer characteristic functions specified by the TransferCharacteristics code point: 1, 6,
   * 13, 14, 15.
   */
  SDR,
  /**
   * HLG indicates that the video is encoded using a reference opto-electronic transfer
   * characteristic function specified by the TransferCharacteristics code point 18, or consists of
   * such video mixed with video qualifying as SDR.
   */
  HLG,
  /**
   * PQ indicates that the video is encoded using a reference opto-electronic transfer
   * characteristic function specified by the TransferCharacteristics code point 16, or
   * consists of such video mixed with video qualifying as SDR or HLG.
   */
  PQ,
}

export interface AudioChannelMetadata {
  /**
   * Count of audio channels present in media.
   *
   * Expressed as a decimal-integer, indicating the maximum number of independent, simultaneous
   * audio channels present in any media segment in the rendition. For example, an AC-3 5.1
   * rendition would have a count of 6.
   */
  count: number;
  /**
   * Indicates whether the media contains spatial audio.
   */
  containsSpatialAudio: boolean;
}

export interface RenditionMetadata {
  /**
   * The estimated amount of bandwidth needed to play this rendition.
   *
   * For DASH this will indicate the `Representation@bandwidth` value.
   *
   * For HLS we favor `AVERAGE-BANDWIDTH` when possible and fallback to `BANDWIDTH` otherwise.
   */
  estimatedBandwidth: number;
  /**
   * The full codec string that describes the media sample type of this rendition.
   *
   * For example, for AAC-LC audio, we would expect `mp4a.40.2`.
   */
  codecs: string;
  /**
   * A mime type and codec combination that is useful for initializing a `SourceBuffer`.
   *
   * For example, for AAC-LC audio, we would expect `audio/mp4; codecs="mp4a.40.2"`.
   */
  mimeCodec: string;
  /**
   * Provides a list of roles / characteristics that describe the intention of this media rendition.
   *
   * For DASH this represents the `Role@value` of the `AdaptationSet`.
   *
   * For HLS this represents the `CHARACTERISTICS` of the `EXT-X-MEDIA` tag.
   */
  intendedMediaRoles: string[];
}

export interface AudioRenditionMetadata extends RenditionMetadata {
  /**
   * Identifies the primary language used in the rendition.
   */
  language?: string;
  /**
   * Information about the channel layout of the media.
   */
  channels?: AudioChannelMetadata;
}

export interface VideoRenditionMetadata extends RenditionMetadata {
  /**
   * The resolution of the video data.
   */
  resolution?: VideoResolution;
  /**
   * The maximum frame rate for all the video in the rendition.
   */
  frameRate?: number;
  /**
   * The dynamic range of colors present in the video, as defined by the opto-electronic transfer
   * characteristic function used when encoding the video.
   */
  videoRange?: VideoRange;
}
