export default class EventEmitter<EventMap> {
  constructor(
    protected eventCallbacks: Record<
      keyof EventMap,
      Set<(ev: EventMap[keyof EventMap]) => void>
    >
  ) {}

  public addEventListener(
    type: keyof EventMap,
    listener: (ev: EventMap[keyof EventMap]) => unknown
  ): void {
    this.eventCallbacks[type].add(listener);
  }

  public removeEventListener(
    type: keyof EventMap,
    listener: (ev: EventMap[keyof EventMap]) => unknown
  ): void {
    this.eventCallbacks[type].delete(listener);
  }

  protected notifyEvent(
    type: keyof EventMap,
    event: EventMap[keyof EventMap]
  ): void {
    this.eventCallbacks[type].forEach(cb => cb(event));
  }
}
