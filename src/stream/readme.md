# Stream Coordination

This is probably the most central component to the player implementation. It is responsible for
handling the media timeline and what is buffered when.

One of the core tenants here is the stream model abstraction. We break up the stream information
into continuous sequences of segments. This is a natural break up of the media data as media
streaming is usually a feed of mp4 files that have been segmented from a continuous source feed
(whether it is a static asset or a live feed). When the source changes (e.g. for a spliced in
advert) then this is a new sequence of segments. With this abstraction, we can more easily tell the
source buffer handling code when it needs to be careful about appending new data (e.g. keeping
things in sync, resetting codec information, etc.), as well as more easily handle late-binding
content, such as in a queue player context, or for something like DASH XLink or HLS Interstitials.

The stream mananger will then be responsible for organizing each of these segment sequences into a
coherent timeline for when the main player asks for the next sample (or seeks to a new location).

The stream manager is also responsible for interacting with the ABR manager and reacting to
instructions to feed from different renditions based on ABR decisions. Since it knows the
sequencing of the timeline, it is also best placed to know where to resume buffering from after an
ABR switch.

# TODO

Lots, but in particular:
* Some concept of time will be needed here to know where we are for ABR switch purposes. As things
  stand I've put in a `currentTime` property, but on reflection, I don't think this makes sense. I
  think more sensible would be a `lastProvidedSampleTimeRange` for both audio and video that
  provides a range indicated the estimated start and end of the last segment provided via the
  `nextSample` and `moveToTime` methods.
* Some resiliency around race conditions and cancelling active requests where necessary.
* Integrate to the ABR decisioner.
* Figure out the initialization flow.
* Figure out the flow to resolving new samples (currently `SegmentReference` makes own request for
  data, but this is wrong, and should be made at `StreamManager` level as well as hook into
  performance metrics events for download to pass to ABR manager).
