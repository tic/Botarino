export type Sound = {
  filename?: string;
  permissions?: {
    whitelist?: {
      user?: string[];
      server?: string[];
    };
    blacklist?: {
      user?: string[];
      server?: string[];
    };
  };
};
