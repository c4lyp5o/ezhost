import path from "node:path";
import deadslog from "deadslog";
import { LOG_DIR } from "./config.js";

// Single logger for the whole server: colored console + rotating file.
export const logger = deadslog({
	consoleOutput: {
		enabled: true,
		coloredCoding: true,
	},
	fileOutput: {
		enabled: true,
		logFilePath: path.join(LOG_DIR, "general.log"),
	},
});
