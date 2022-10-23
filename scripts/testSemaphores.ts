import { Semaphore, sleep } from '../services/util.service';

const semaphoreTests = {
  basicSemaphoreLogic: async () => {
    const sema = new Semaphore(1);
    let x = false;

    await Promise.race([
      (async () => {
        const rel1 = await sema.acquire();
        x = true;
        rel1();
      })(),
      sleep(1000),
    ]);

    return x ? [true] : [false, 'timeout'];
  },

  twoConsumers: async () => {
    const sema = new Semaphore(1);
    let n = 0;
    let timeout = false;

    await Promise.race([
      Promise.all([
        (async () => {
          const rel = await sema.acquire();
          await sleep(500);
          n = 1;
          rel();
        })(),
        (async () => {
          await sleep(250);
          const rel = await sema.acquire();
          n = 2;
          rel();
        })(),
      ]),
      (async () => {
        await sleep(1000);
        timeout = true;
      })(),
    ]);

    if (timeout) {
      return [false, 'timeout'];
    }

    return n === 2 ? [true] : [false, 'incorrect operation order'];
  },

  threeConsumers: async () => {
    const sema = new Semaphore(1);
    let n = 0;
    let timeout = false;

    await Promise.race([
      Promise.all([
        (async () => {
          const rel = await sema.acquire();
          await sleep(1000);
          n = 1;
          rel();
        })(),
        (async () => {
          await sleep(350);
          const rel = await sema.acquire();
          n = 2;
          rel();
        })(),
        (async () => {
          await sleep(650);
          const rel = await sema.acquire();
          n = 3;
          rel();
        })(),
      ]),
      (async () => {
        await sleep(2000);
        timeout = true;
      })(),
    ]);

    if (timeout) {
      return [false, 'timeout'];
    }

    return n === 3 ? [true] : [false, 'incorrect operation order'];
  },

  multiResource: async () => {
    const sema = new Semaphore(2);
    let timeout = false;
    let acquisitionsDone = false;
    let condition = true;

    await Promise.race([
      (async () => {
        await sema.acquire();
        await sema.acquire();
        acquisitionsDone = true;
        await sema.acquire();
        condition = false;
      })(),
      (async () => {
        await sleep(600);
        timeout = true;
      })(),
    ]);

    if (!condition) {
      return [false, 'third access was not blocked'];
    }

    return timeout && !acquisitionsDone ? [false, 'timeout'] : [true];
  },

  doubleReleaseSafety: async () => {
    let condition = false;
    let timeout = false;
    await Promise.race([
      (async () => {
        const sema = new Semaphore(1);
        const rel1 = await sema.acquire();
        sema.acquire();
        sema.acquire().then(() => {
          condition = false;
        });

        condition = true;
        rel1();
        rel1();
      })(),
      (async () => {
        sleep(500);
        timeout = true;
      })(),
    ]);

    if (!condition) {
      return [false, 'double release broke the semaphore'];
    }

    return timeout && !condition ? [false, 'timeout'] : [true];
  },
};

(async () => {
  console.log('----- RUNNING SEMAPHORE TESTS -----\n');
  const testCount = Object.keys(semaphoreTests).length;
  const failedTests = (await Promise.all(Object.entries(semaphoreTests).map(async ([testName, testFunction]) => {
    const [passed, reason] = await testFunction();
    console.log(`[${passed ? 'PASSED' : 'FAILED'}] ${testName} ${reason ?? ''}`);
    return +!passed;
  }))).reduce((sum, cur) => sum + cur);
  console.log('\n----- SEMAPHORE TESTS COMPLETE -----');
  console.log(`PASSED ${testCount - failedTests} / ${testCount}`);
  console.log(`FAILED ${failedTests} / ${testCount}`);
})();
