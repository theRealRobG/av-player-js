export default class SegmentReference {
  public get data(): ArrayBuffer | undefined {
    return this.sampleBuffer;
  }

  private sampleBuffer: ArrayBuffer | undefined;

  constructor(
    public readonly url: string,
    public readonly estimatedStartTime: number,
    public readonly estimatedDuration: number
  ) {}

  public async resolve(): Promise<ArrayBuffer> {
    throw new Error('Method not implemented.');
  }

  public async release() {
    this.sampleBuffer = undefined;
  }
}
