import AVPlayerItem from './av-player-item';
import MediaSourceBufferController from './buffer/media-source-buffer-controller';

export enum AVPlayerStatus {
  Unknown,
  ReadyToPlay,
  Failed,
}

export enum AVPlayerTimeControlStatus {
  Paused,
  WaitingToPlayAtSpecifiedRate,
  Playing,
}

/**
 * This is very much placeholder status for now.
 *
 * Just including this here to give some indication of how a public API may look like. Plenty more
 * methods have to be filled in.
 */
export default class AVPlayer {
  // TODO - add some event emitter code to expose changes to these properties.
  public currentItem?: AVPlayerItem;
  public status = AVPlayerStatus.Unknown;
  public error?: Error;
  public timeControlStatus = AVPlayerTimeControlStatus.Paused;

  private mediaSourceBufferController: MediaSourceBufferController;

  constructor(video: HTMLMediaElement) {
    this.mediaSourceBufferController = new MediaSourceBufferController(video);
  }

  replaceCurrentItem(playerItem?: AVPlayerItem) {
    this.currentItem = playerItem;
    if (playerItem) {
      this.mediaSourceBufferController.setStreamManager(
        playerItem.streamManager
      );
    } else {
      this.mediaSourceBufferController.unsetStreamManager();
    }
  }
}
