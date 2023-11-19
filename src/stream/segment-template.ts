import SegmentReference from './segment-reference';

export default interface SegmentTemplate {
  estimatedStartTime: number;
  estimatedEndTime: number;
  length: number;
  getSegmentByTime(time: number): SegmentReference | undefined;
  getSegmentByIndex(index: number): SegmentReference | undefined;
}
