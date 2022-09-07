export type ModuleControllerType = {
  name: string;
  setup: () => Promise<unknown>;
  // eslint-disable-next-line no-unused-vars
  run: (...args: unknown[]) => Promise<void>;
}
