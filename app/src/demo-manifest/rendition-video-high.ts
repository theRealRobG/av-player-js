// import Network from '../../network';
// import {RequestInterface} from '../../network/config';
// import SegmentReference from '../../stream/segment-reference';
// import SegmentSequence from '../../stream/segment-sequence';
// import SegmentTemplate from '../../stream/segment-template';
// import StreamRendition from '../../stream/stream-rendition';
// import {ContentType, VideoRange} from '../../stream/stream-rendition-metadata';
import {
  Network,
  RequestInterface,
  SegmentReference,
  SegmentSequence,
  SegmentTemplate,
  StreamRendition,
  ContentType,
  VideoRange,
} from 'av-player';

class VideoHighSegmentTemplate implements SegmentTemplate {
  estimatedStartTime: number;
  estimatedEndTime: number;
  length: number;
  isComplete: boolean;

  private references = [
    new SegmentReference(
      'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel-multi-lang.ism/hls/tears-of-steel-multi-lang-video_eng=2200000-1.m4s',
      0,
      4
    ),
    new SegmentReference(
      'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel-multi-lang.ism/hls/tears-of-steel-multi-lang-video_eng=2200000-2.m4s',
      4,
      4
    ),
    new SegmentReference(
      'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel-multi-lang.ism/hls/tears-of-steel-multi-lang-video_eng=2200000-3.m4s',
      8,
      4
    ),
    new SegmentReference(
      'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel-multi-lang.ism/hls/tears-of-steel-multi-lang-video_eng=2200000-4.m4s',
      12,
      4
    ),
    new SegmentReference(
      'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel-multi-lang.ism/hls/tears-of-steel-multi-lang-video_eng=2200000-5.m4s',
      16,
      4
    ),
    new SegmentReference(
      'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel-multi-lang.ism/hls/tears-of-steel-multi-lang-video_eng=2200000-6.m4s',
      20,
      4
    ),
    new SegmentReference(
      'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel-multi-lang.ism/hls/tears-of-steel-multi-lang-video_eng=2200000-7.m4s',
      24,
      4
    ),
    new SegmentReference(
      'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel-multi-lang.ism/hls/tears-of-steel-multi-lang-video_eng=2200000-8.m4s',
      28,
      4
    ),
    new SegmentReference(
      'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel-multi-lang.ism/hls/tears-of-steel-multi-lang-video_eng=2200000-9.m4s',
      32,
      4
    ),
    new SegmentReference(
      'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel-multi-lang.ism/hls/tears-of-steel-multi-lang-video_eng=2200000-10.m4s',
      36,
      4
    ),
  ];

  constructor() {
    this.estimatedStartTime = this.references[0].estimatedStartTime;
    const lastRef = this.references[this.references.length - 1];
    this.estimatedEndTime =
      lastRef.estimatedStartTime + lastRef.estimatedDuration;
    this.length = this.references.length;
    this.isComplete = true;
  }

  getSegmentByTime(time: number): SegmentReference | undefined {
    for (let i = 0; i < this.references.length; i++) {
      if (
        this.references[i].estimatedStartTime +
          this.references[i].estimatedDuration >
        time
      ) {
        return this.references[i];
      }
    }
  }

  getSegmentByIndex(index: number): SegmentReference | undefined {
    return this.references[index];
  }
}

export default class VideoHighRendition
  implements StreamRendition<ContentType.Video>
{
  identifier =
    'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel-multi-lang.ism/tears-of-steel-multi-lang-video_eng=2200000.m3u8';
  contentType: ContentType.Video = ContentType.Video;
  metadata = {
    estimatedBandwidth: 2400000,
    codecs: 'avc1.640028',
    intendedMediaRoles: [],
    resolution: {
      width: 1680,
      height: 750,
    },
    frameRate: 24,
    videoRange: VideoRange.SDR,
  };

  private network = new Network({
    preferredRequestInterface: RequestInterface.XMLHttpRequest,
  });
  private resolvedSegmentSequence?: SegmentSequence;
  
  async currentSegmentSequence(): Promise<SegmentSequence> {
    if (this.resolvedSegmentSequence) {
      return Promise.resolve(this.resolvedSegmentSequence);
    }
    const initRequest = this.network.dataTask({
      url: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel-multi-lang.ism/hls/tears-of-steel-multi-lang-video_eng=2200000.m4s',
      responseType: 'arraybuffer',
    });
    const initData = await initRequest.send();
    const segmentSequence = new SegmentSequence(
      '0',
      initData,
      new VideoHighSegmentTemplate(),
      0
    );
    this.resolvedSegmentSequence = segmentSequence;
    return segmentSequence;
  }

  async nextSegmentSequence(): Promise<SegmentSequence | undefined> {
    return Promise.resolve(undefined);
  }

  async moveToTime(time: number): Promise<SegmentSequence | undefined> {
    const segmentSequence = await this.currentSegmentSequence();
    if (!segmentSequence) {
      return;
    }
    if (segmentSequence.moveToTime(time)) {
      return segmentSequence;
    }
  }
}
