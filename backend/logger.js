import { LOG_DIR } from "./config.js";
import { createLogger } from "./ezlog.js";

export const logger = createLogger(LOG_DIR, "ezhost");
