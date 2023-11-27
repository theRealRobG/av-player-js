import {CompletedDataTaskMetrics} from '../network/xhr-data-task';

export default interface AbrDecisioner {
  getBestBitrate(availableBitrates: number[]): number;
  setNewSegmentDownloadMetrics(downloadMetrics: CompletedDataTaskMetrics): void;
}
