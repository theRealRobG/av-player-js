# av-player-js

The aim of this project is to provide a Media Source Extensions (MSE) player implementation that
makes best efforts to follow the design principles provided by how AVPlayer is used within iOS.

This is an educational exercise to provide better understanding of how playback can be implemented
for MSE environments.

## Background

### Inspiration

I've (@theRealRobG) been a user of `AVFoundation` (and `AVPlayer`) for many years. I've also seen a
fair few media players (including a few different MSE implementations), and of all the player
implementation I've seen, my favorite is AVPlayer. I like the robust nature of it as well as the
flexibility it is still able to provide.

One of the standout design choices is the clear separation of concerns between `AVPlayer`,
`AVPlayerItem`, and `AVAsset`.

### Design Precedent

`AVAsset` is responsible for abstracting asset description information. In particular, it provides
information about where media data is located and extra metadata to help with media selection for
presentation to the user. In the context of ABR streaming this can be seen as the manifest
abstraction (HLS or DASH).

`AVPlayerItem` provides a more dynamic asset description. It uses `AVAsset` to have a sense for
where media content exists, but then seems to provide media download capabilities to the player,
maintains a presentation timeline and an understanding of where the player is buffering from. The
separation of `AVPlayerItem` from `AVPlayer` allows us to reason about separate assets that we may
concatenate together more easily. We have useful functionality come out of this, such as item pre-
loading for better start times, and easy queue player functionality as the concept of what is being
buffered is separated from the player presented timeline already via the designed architecture.

`AVPlayer` is responsible for taking media samples and decoding/presenting them at specified times.
As far as I can tell, it does not know anything about HLS (or any other asset description type),
and instead is fed information by the current `AVPlayerItem`. This separation of concerns helps it
focus on the responsibility of making sure appended media is continuous and synchronized properly
(across video, audio, subtitles, etc.). Based on what we can see from `AVSampleBufferDisplayLayer`
in [WWDC 2014 Session 513](https://developer.apple.com/videos/play/wwdc2014/513/), it looks like
`AVPlayer` may expect to receive MPEG-4 formatted media data. In any case, it seems likely that
`AVPlayer` reads the information being fed to it within the mp4 data itself, and the data from the
manifest is no longer important at this stage (only important for providing selection of media
information, such as rudimentary timing information, expected bitrate, resolution, etc.). I believe
that this makes `AVPlayer` more robust as it is dealing with the source of truth for the media
data. The manifest can easily "lie", but the media data contained within the file container is much
more likely to be accurate. This to me is why `AVPlayer` is able to continue playing even when
feeding it with completely mis-matched content across discontinuity boundaries (e.g. SDR vs HDR),
as I imagine the player is accounting for sanitization of what data it is being fed.

### Benefits

Below are some benefits I see from this API design choice.
* Public separation of responsibilities better enforces separation of concerns between components.
* The different public components allow for highly flexible integrations and interesting
  functionalities. For example:
    * Separated asset loading allows for custom asset formats (e.g. HLS, DASH, etc.).
    * Separated media download pipeline allows for easy pre-fetch functionality, useful for fast
      loading, and also late binding of media content, such as interstitial opportunities.
    * Player being abstracted from player item allows it to be re-used between playbacks for faster
      initialization.
    * Much easier support for queue player functionality which is a very useful feature, for
      functionality such as instant binge (to next episode), smooth pre-roll ad transitions,
      and more.
* Player is more robust as it relies on mp4 information to best prepare the decoder for next media
  sample.

## Design

Main concepts:
* Provide the same separation of concerns into the 3 main components for playback with iOS
  `AVPlayer`.
    * [`manifest`](./src/manifest/) provides the asset description abstraction. Within there I see
      a future for class implementations such as `DashAsset`, `HlsAsset`, `MoqAsset`, etc. I also
      foresee custom `AVAsset` extensions to provide capability for consumer to integrate their own
      media description format.
    * [`stream`](./src/stream/) provides the coordination of a specific media asset timeline, as
      well as functionalities to help with buffering, including the [`abr`](./src/abr/)
      interactions.
    * [`buffer`](./src/buffer/) provides the code needed to feed the various source buffers,
      abstract the media source, and ensure audio/video sync. Another big concept I want to 
      introduce is mp4 parsing at this layer to ensure accuracy of what is being fed to the source
      buffers. This can help with avoiding media gaps, better coordinating continuous playback,
      easier sanitization of data and resetting buffers where necessary, etc. Care will have to be
      taken to not risk compromising performance as a result of extra parsing work.
* Ensure data consistency before appending to the source buffers via reading the mp4 data being
  appended before it is appended.
