import StreamRendition from '../stream/stream-rendition';
import {ContentType} from '../stream/stream-rendition-metadata';

export default interface Asset {
  audioRenditions: StreamRendition<ContentType.Audio>[];
  videoRenditions: StreamRendition<ContentType.Video>[];
}
