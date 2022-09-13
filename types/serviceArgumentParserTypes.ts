export type Arguments = {
  raw: string;
  rawWithoutCommand: string;
  basicParse: string[];
  basicParseWithoutCommand: string[];
}

export type ArgumentDescription = {
  required: boolean;
  defaultValue?: string;
  description: string;
  datatypes: string[];
}

export type SyntaxDescription = {
  callSyntax: string;
  arguments: ArgumentDescription[];
}
