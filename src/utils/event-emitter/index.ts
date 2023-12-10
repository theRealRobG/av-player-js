/**
 * Provides a base class to make event emitting more consistent between components.
 *
 * A class that intends to emit events that another component should listen to should extend this
 * class and provide an interface that maps event names to their expected payloads.
 *
 * This class should be extended rather than constructed directly.
 */
export default class EventEmitter<EventMap> {
  /**
   * Set the initial map of event names against sets of callbacks (should all be empty sets
   * initially).
   *
   * @param eventCallbacks An initial dictionary of event names against sets of callback functions.
   * The initial callbacks should all just be empty sets (`new Set()`).
   */
  constructor(
    protected eventCallbacks: {
      [T in keyof EventMap]: Set<(event: EventMap[T]) => void>;
    }
  ) {}

  /**
   * Add a listener for a given event type.
   *
   * @param type The event name to add a listener for.
   * @param listener A callback to handle when the event is fired.
   */
  public addEventListener<T extends keyof EventMap>(
    type: T,
    listener: (ev: EventMap[T]) => unknown
  ): void {
    this.eventCallbacks[type].add(listener);
  }

  /**
   * Remove a listener for a given event type.
   *
   * @param type The event name to remove the listener from.
   * @param listener The listener to remove.
   */
  public removeEventListener<T extends keyof EventMap>(
    type: T,
    listener: (ev: EventMap[T]) => unknown
  ): void {
    this.eventCallbacks[type].delete(listener);
  }

  public waitForEvent<T extends keyof EventMap>(type: T): Promise<EventMap[T]> {
    return new Promise(resolve => {
      const callback = (event: EventMap[T]) => {
        this.removeEventListener(type, callback);
        resolve(event);
      };
      this.addEventListener(type, callback);
    });
  }

  /**
   * Notify all listeners of the provided event type.
   *
   * @param type The event name to notify callbacks for.
   * @param event The payload of the notification.
   */
  protected notifyEvent(
    type: keyof EventMap,
    event: EventMap[keyof EventMap]
  ): void {
    this.eventCallbacks[type].forEach(cb => cb(event));
  }
}
