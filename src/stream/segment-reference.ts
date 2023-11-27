import Network from '../network';
import DataTask from '../network/data-task';

export default class SegmentReference {
  public get data(): ArrayBuffer | undefined {
    return this.sampleBuffer;
  }

  private sampleBuffer?: ArrayBuffer;
  private dataTask?: DataTask<'arraybuffer'>;

  constructor(
    public readonly url: string,
    public readonly estimatedStartTime: number,
    public readonly estimatedDuration: number
  ) {}

  public async resolve(network: Network): Promise<ArrayBuffer> {
    this.dataTask = network.dataTask({
      url: this.url,
      responseType: 'arraybuffer',
    });
    return this.dataTask.send();
  }

  public release() {
    this.sampleBuffer = undefined;
  }

  public abortOngoingDownload() {
    this.dataTask?.abort();
    this.dataTask = undefined;
  }
}
