export class Semaphore {
  // eslint-disable-next-line no-unused-vars
  #waitingResolvers: ((_: unknown) => void)[] = [];
  #p = 0;

  constructor(p: number) {
    if (p < 1) {
      throw new Error('a semaphore requires a p value > 0');
    }
    this.#p = p;
  }

  acquire(): Promise<() => void> {
    if (this.#p === 0) {
      return new Promise((resolve) => {
        this.#waitingResolvers.push(resolve as () => void);
      });
    }
    this.#p--;
    const resolvingFunction = () => {
      const waitingResolver = this.#waitingResolvers.shift();
      if (waitingResolver) {
        waitingResolver(resolvingFunction);
      } else {
        this.#p++;
      }
    };
    return Promise.resolve(resolvingFunction);
  }
}

export const sleep = (ms: number) => new Promise((_resolve) => {
  const resolve = _resolve as () => void;
  setTimeout(() => resolve(), ms);
});