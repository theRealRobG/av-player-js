import React from 'react';
import './App.css';

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
}

export default App;
