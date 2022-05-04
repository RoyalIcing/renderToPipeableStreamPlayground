import { Future, FutureEnableLogging } from "./future.mjs";

export class Resource extends Future {
    constructor() {
        super();
        this[FutureEnableLogging] = true;
    }
}

export function useResource(resource) {
  if (resource.value !== undefined) {
    if (resource.value instanceof Error) {
      throw resource.value;
    } else {
      return resource.value;
    }
  }
  throw resource.promise;
}
