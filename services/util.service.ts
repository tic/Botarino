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

    const getResolvingFunction = (): {
      (): void;
      resolved: boolean;
    } => {
      const resolvingFunction = Object.assign(
        () => {
          if (resolvingFunction.resolved) {
            return;
          }

          resolvingFunction.resolved = true;
          const waitingResolver = this.#waitingResolvers.shift();
          if (waitingResolver) {
            waitingResolver(getResolvingFunction());
          } else {
            this.#p++;
          }
        },
        { resolved: false },
      );

      return resolvingFunction;
    };

    this.#p--;
    return Promise.resolve(getResolvingFunction());
  }
}

export const sleep = (ms: number) => new Promise((_resolve) => {
  const resolve = _resolve as () => void;
  setTimeout(() => resolve(), ms);
});

// eslint-disable-next-line no-unused-vars
export const selectRandomElement: (<T>(_: Array<T>) => T) = (arr) => arr[Math.floor(Math.random() * arr.length)];
