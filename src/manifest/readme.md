# Asset Resolution

The main idea of this component of the codebase is that it will be responsible for resolving the
asset description information. This includes position information as well as metadata useful for
asset selection, such as bandwidth information, resolution, content protection levels, etc.

Different manifest formats will involve different implementations of `AssetResolver`. For example,
I foresee resolvers such as `HlsAsset`, `DashAsset`, etc.

Most of the required components here are interfaces which allow for particularities in
implementation details. In particular, `Asset` is a container for `StreamRendition` instances,
which is also an interface which is responsible for providing resolutions for segment sequences. In
DASH the implementation may keep an array of `Period` elements that can be accessed via the
`nextSegmentSequence` and `moveToTime` methods. In HLS the implementation may be a holder for media
playlist abstractions where the `nextSegmentSequence` or `moveToTime` can resolve a remote media
playlist if necessary first, and then find the desired discontinuity sequence to create the segment
sequence from.

I believe that this design should provide enough flexibility to abstract many asset description
formats.

# TODO

Lots, but in particular:
* Actually implement at least HLS asset resolution.
* Some metadata may be difficult to fit into this model (needs some extra consideration), such as:
    * Manifest level event information (e.g. `EventStream` / `EXT-X-DATERANGE`).
    * Date/time mappings (e.g. `EXT-X-PROGRAM-DATE-TIME`).
* Minor nit-pick, but `StreamRendition` should probably belong within this directory, as it would
  be nice if `manifest` had no outward imports (at least onto `stream`).
