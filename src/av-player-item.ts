import AbrDecisioner from './abr/abr-decisioner';
import AVAsset from './av-asset';
import Network from './network';
import NetworkConfig from './network/config';
import StreamManager from './stream/stream-manager';

export interface AVPlayerItemConfig {
  network: NetworkConfig;
  abr: AbrDecisioner;
}

/**
 * This is very much placeholder status for now.
 *
 * Just including this here to give some indication of how a public API may look like. Plenty more
 * methods have to be filled in.
 *
 * Also need to make the config parameter a better (more friendly) type. It should be optional and
 * so should every property, with sane defaults applied when not provided by consumer.
 */
export default class AVPlayerItem {
  public error?: Error;

  streamManager: StreamManager;

  constructor(asset: AVAsset, config: AVPlayerItemConfig) {
    this.streamManager = new StreamManager(
      new Network(config.network),
      asset,
      config.abr
    );
  }

  seek(toTime: number) {
    throw new Error('TODO: not implemented');
  }

  selectTrack(id: string) {
    throw new Error('TODO: not implemented');
  }

  currentTime(): number {
    throw new Error('TODO: not implemented');
  }

  currentDate(): Date | undefined {
    throw new Error('TODO: not implemented');
  }

  // etc.
}
