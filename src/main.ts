import { options as cmdOptions} from "./cmdline";
import { loadConfig, hasSpawnConfig } from "./config";
import { spawnProcesses } from "./processes";
import { createLogger, errorlog } from "./logger";

async function main(): Promise<void> {
  const logger = createLogger(cmdOptions.debug, cmdOptions.log);
  logger.debug(`read config ${cmdOptions.config}`);

  try {
    const config = await loadConfig(cmdOptions.config);

    if (! hasSpawnConfig(config)) {
      throw new Error(`No services found in config file ${cmdOptions.config}`);
    }

    spawnProcesses(config.spawn!, logger);

    logger.info('exit');
  } catch (err) {
    if (err instanceof Error) {
      errorlog.error(err.message);
    }
    process.exit(1);
  }
}

main();
