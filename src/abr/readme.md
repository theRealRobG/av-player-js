# ABR

This component will be responsible for taking metrics of segment downloads, along with current
buffer information, and spitting out what it believes the best bitrate is to use. This will then be
used by the `StreamManager` to determine whether it needs to switch to a new rendition.

Importantly, the ABR manager will not make the switch itself, and only advise the `StreamManager`
of what the best bitrate is. The `StreamManager` will need to ensure that it doesn't make a poor
change (e.g. HDR to SDR) that could cause transition / stability problems.

Currently there is only an interface defined here, and a bad one at that, since it doesn't include
provisions for informing the ABR about the current buffer health (need to figure that out). But in
the future, I see some sort of ABR manager, and a few different `AbrDecisioner` implementations for
the various ABR algorithms we choose to support, as well as flexibility of providing the consumer
the ability to define their own implementation.

# TODO

Pretty much everything, but in particular:
* Figure out how we surface buffer ahead information to this component.
* Flesh out the breakout of ABR management from different ABR algorithm implementations.
