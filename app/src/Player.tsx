import React from 'react';
import {AVPlayer, AVPlayerItem, AVAsset, RequestInterface} from 'av-player';
import DemoAssetResolver from './demo-manifest/demo-asset-resolver';
import DemoAbrDecisioner from './demo-abr/demo-abr-decisioner';

type Props = {};
type State = {};

export default class Player extends React.Component<Props, State> {
  private videoRef = React.createRef<HTMLVideoElement>();
  private player?: AVPlayer;
  private playerItem?: AVPlayerItem;

  play() {
    this.videoRef.current?.play();
  }

  pause() {
    this.videoRef.current?.pause();
  }

  componentDidMount(): void {
    const video = this.videoRef.current;
    if (!video) {
      return;
    }
    this.player = this.makePlayer(video);
    this.playerItem = this.makePlayerItem();
    this.player.replaceCurrentItem(this.playerItem);
  }

  componentWillUnmount(): void {
    this.player?.replaceCurrentItem(undefined);
    this.player = undefined;
    this.playerItem = undefined;
  }

  render(): React.ReactNode {
    return <video className="av-player-layer" ref={this.videoRef} />;
  }

  private makePlayer(video: HTMLVideoElement): AVPlayer {
    return new AVPlayer(video);
  }

  private makePlayerItem(): AVPlayerItem {
    const assetResolver = new DemoAssetResolver();
    const asset = new AVAsset(assetResolver);
    return new AVPlayerItem(
      asset,
      {
        network: {
          preferredRequestInterface: RequestInterface.XMLHttpRequest
        },
        abr: new DemoAbrDecisioner(),
      }
    );
  }
}
