import React from 'react';
import {AVPlayer, AVPlayerItem, AVAsset, RequestInterface} from 'av-player';
import './App.css';
import DemoAssetResolver from './demo-manifest/demo-asset-resolver';
import DemoAbrDecisioner from './demo-abr/demo-abr-decisioner';

type Props = {};
type State = {};

class App extends React.Component<Props, State> {
  private playerContainerRef = React.createRef<HTMLDivElement>();

  render(): React.ReactNode {
    return (
      <div className="player-container" ref={this.playerContainerRef}>
        <p>Hello there!</p>
      </div>
    );
  }

  private makePlayer(video: HTMLMediaElement): AVPlayer {
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

export default App;
