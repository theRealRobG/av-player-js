import React from 'react';
import './App.css';
import Player from './Player';

type Props = {};
type State = {};

class App extends React.Component<Props, State> {
  private playerRef = React.createRef<Player>();

  render(): React.ReactNode {
    return (
      <>
        <div className="player-container">
          <Player ref={this.playerRef} />
        </div>
        <button onClick={() => this.playerRef.current?.play()}>
          Play
        </button>
        <button onClick={() => this.playerRef.current?.pause()}>
          Pause
        </button>
      </>
    );
  }
}

export default App;
