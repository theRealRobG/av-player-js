import {
  Network,
  RequestInterface,
  SegmentReference,
  SegmentSequence,
  SegmentTemplate,
  StreamRendition,
  ContentType
} from 'av-player';

class EnglishAudioSegmentTemplate implements SegmentTemplate {
  estimatedStartTime: number;
  estimatedEndTime: number;
  length: number;
  isComplete: boolean;

  private references = [
    new SegmentReference(
      'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel-multi-lang.ism/hls/tears-of-steel-multi-lang-audio_eng=64008-1.m4s',
      0,
      3.968
    ),
    new SegmentReference(
      'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel-multi-lang.ism/hls/tears-of-steel-multi-lang-audio_eng=64008-2.m4s',
      3.968,
      3.9893
    ),
    new SegmentReference(
      'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel-multi-lang.ism/hls/tears-of-steel-multi-lang-audio_eng=64008-3.m4s',
      7.9573,
      4.0106
    ),
    new SegmentReference(
      'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel-multi-lang.ism/hls/tears-of-steel-multi-lang-audio_eng=64008-4.m4s',
      11.9679,
      3.9893
    ),
    new SegmentReference(
      'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel-multi-lang.ism/hls/tears-of-steel-multi-lang-audio_eng=64008-5.m4s',
      15.9572,
      4.0106
    ),
    new SegmentReference(
      'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel-multi-lang.ism/hls/tears-of-steel-multi-lang-audio_eng=64008-6.m4s',
      19.9678,
      3.9893
    ),
    new SegmentReference(
      'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel-multi-lang.ism/hls/tears-of-steel-multi-lang-audio_eng=64008-7.m4s',
      23.9571,
      4.0106
    ),
    new SegmentReference(
      'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel-multi-lang.ism/hls/tears-of-steel-multi-lang-audio_eng=64008-8.m4s',
      27.9677,
      3.9893
    ),
    new SegmentReference(
      'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel-multi-lang.ism/hls/tears-of-steel-multi-lang-audio_eng=64008-9.m4s',
      31.957,
      4.0106
    ),
    new SegmentReference(
      'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel-multi-lang.ism/hls/tears-of-steel-multi-lang-audio_eng=64008-10.m4s',
      35.967600000000004,
      3.9893
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

export default class EnglishAudioRendition
  implements StreamRendition<ContentType.Audio>
{
  identifier = 'audio-aacl-64.English';
  contentType: ContentType.Audio = ContentType.Audio;
  metadata = {
    // In HLS not sure how we will get bandwidth for audio... Maybe not needed if we only make ABR
    // decisions on video?
    estimatedBandwidth: 0,
    // Will require splitting out audio and video codecs using knowledge of what is what codec type.
    codecs: 'mp4a.40.2',
    mimeCodec: 'audio/mp4; codecs="mp4a.40.2"',
    intendedMediaRoles: [],
    language: 'en',
    channels: {
      count: 2,
      containsSpatialAudio: false,
    },
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
      url: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel-multi-lang.ism/hls/tears-of-steel-multi-lang-audio_eng=64008.m4s',
      responseType: 'arraybuffer',
    });
    const initData = await initRequest.send();
    const segmentSequence = new SegmentSequence(
      '0',
      initData,
      new EnglishAudioSegmentTemplate(),
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
