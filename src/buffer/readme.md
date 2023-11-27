# Media Buffering

This component will be responsible for managing A/V sync of buffers. This involves making sure that
data being appended to both audio and video source buffers (and eventually text) are being sourced
from the same segment sequence indexes (otherwise internal timestamps have no relation to each
other).

The `MediaSourceBufferController` will pull data from the current `StreamManager` and in the future
we could support queues of `StreamManager` instances to support queued playback. With this in mind,
the component is also responsible for ensuring a continuous timeline with the source buffers /
media source object, even when appending from completely unrelated assets, in order to do best to
maintain a seamless playback experience.

The `AVQueuedSampleBufferRenderer` *(first class added to the codebase so named closest to
`AVFoundation` counterpart)* has the extra responsibility that it should be reading mp4 data before
appending to source buffers and sanitizing for continuity and ensuring source buffer is ready to
accept the media data. This is a good location to provide any patches necessary to the mp4 data (it
is known that some devices require specific formats of mp4 data that may not be guaranteed from
many media servers, and so the client can take actions to "hot-fix" to something that works, for
example "faking" encrypted segments to workaround some devices that don't support moving to
encrypted content when starting with unencrypted content).

# TODO

Lots, but in particular:
* A/V sync logic around ensuring appending to buffers from same segment sequence index.
* Handle setting of `StreamManager`.
* Introduce efficient mp4 parser and utilize it for data sanitization before appending to buffers.
