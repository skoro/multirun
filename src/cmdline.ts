import { program } from "commander";
import path from "node:path";
import pkg from "../package.json";

program
  .name(pkg.name)
  .version(pkg.version)
  .description(pkg.description);

program
  .option('-d, --debug', 'output extra debugging messages', false)
  .option('-l, --log <file>', 'log messages to the specified file')
  .option('-c, --config <file>', 'configuration file', path.join(__dirname, 'config.yml'));

program.parse(process.argv);

type Options = {
  debug: boolean,
  config: string,
  log?: string,
}

export const options = program.opts() as Options;
