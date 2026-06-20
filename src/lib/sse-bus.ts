import { EventEmitter } from "events";

const bus = new EventEmitter();
bus.setMaxListeners(0);

export const publish = (userId: string) => bus.emit(`u:${userId}`);

export const subscribe = (userId: string, fn: () => void): (() => void) => {
  bus.on(`u:${userId}`, fn);
  return () => bus.off(`u:${userId}`, fn);
};
