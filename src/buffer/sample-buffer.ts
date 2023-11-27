import {VideoRange} from '../stream/stream-rendition-metadata';

export default interface SampleBuffer {
  initData: ArrayBuffer;
  mediaData: ArrayBuffer;
  codec: string;
  sequenceIndexId: string;
  videoRange?: VideoRange;
}
