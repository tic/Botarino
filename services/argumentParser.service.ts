import { config } from '../config';
import { ArgumentDescription, Arguments, SyntaxDescription } from '../types/serviceArgumentParserTypes';

export const parseSyntaxDescriptionFromHelpString = (commandName: string, helpString: string) : SyntaxDescription => {
  const callSyntax = `${config.discord.prefix}${commandName}`;
  const argumentDescriptions = Array.from(helpString.matchAll(/<([^<>]+)>/g)).map((matches) => {
    const arg = matches[1];
    const [, typeAndDefault, description] = arg.match(/([^[\]]+)\[([^[\]]*)\]/) || [null, '', ''];
    const [, optionalFlag, datatypes, defaultValue] = typeAndDefault
      ?.match(/(\?)?([^:]+)(.*)/) || [null, '', '', undefined];
    return {
      required: !optionalFlag,
      description: description || '',
      defaultValue: defaultValue ? defaultValue.substring(1) : undefined,
      datatypes: datatypes?.split('|') || [],
    } as ArgumentDescription;
  });
  return {
    callSyntax,
    arguments: argumentDescriptions,
  };
};

export const parseArguments = (message: string) : Arguments => {
  const withoutPrefix = message.substring(1);
  const basicParse = withoutPrefix.split(' ');
  const args = {
    raw: withoutPrefix,
    rawWithoutCommand: withoutPrefix.substring(withoutPrefix.indexOf(' ')),
    basicParse,
    basicParseWithoutCommand: basicParse.slice(1),
  };
  return args;
};
