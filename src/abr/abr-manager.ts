import {CompletedDataTaskMetrics} from '../network/xhr-data-task';
import AbrDecisioner from './abr-decisioner';

/**
 * The `AbrManager` handles interactions with the configured ABR algorithm.
 *
 * For now, this `AbrManager` just proxies the configured `AbrDecisioner` implementation that is
 * passed in the constructor; however, in the future this can allow for functionality such as late
 * setting of the ABR algorithm based on playback type (or other factors), and separating out
 * decisioning for the best starting bitrate.
 */
export default class AbrManager implements AbrDecisioner {
  constructor(private abr: AbrDecisioner) {}

  getBestBitrate(availableBitrates: number[]): number {
    return this.abr.getBestBitrate(availableBitrates);
  }

  setNewSegmentDownloadMetrics(
    downloadMetrics: CompletedDataTaskMetrics
  ): void {
    this.abr.setNewSegmentDownloadMetrics(downloadMetrics);
  }
}
