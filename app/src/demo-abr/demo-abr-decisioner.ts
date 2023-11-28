import {AbrDecisioner, CompletedDataTaskMetrics} from 'av-player';

/**
 * This `AbrDecisioner` is for demo purposes only.
 *
 * This `AbrDecisioner` always selects the highest available bitrate. Right now I don't want to
 * concentrate on implementing ABR. My thinking is that this will be relatively easy to just copy
 * and paste from somewhere else to get going with, and it won't really have an impact on the
 * architecture of the project. On the other hand, proving out the ideas within the `buffer`
 * component can be tricky, and I'm not as sure that it will all work as nicely (especially the
 * ideas around relying heavily on mp4 parsing). Therefore I want to put more focus there for now.
 */
export default class DemoAbrDecisioner implements AbrDecisioner {
  getBestBitrate(availableBitrates: number[]): number {
    return (
      availableBitrates.sort((a, b) => a - b)[availableBitrates.length - 1] ?? 0
    );
  }

  setNewSegmentDownloadMetrics(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    downloadMetrics: CompletedDataTaskMetrics
  ): void {
    // no-op
  }
}
