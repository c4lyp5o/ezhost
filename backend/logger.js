import path from "node:path";
import deadslog from "deadslog";

// Single logger for the whole server: colored console + rotating file.
export const logger = deadslog({
	consoleOutput: {
		enabled: true,
		coloredCoding: true,
	},
	fileOutput: {
		enabled: true,
		logFilePath: path.join(import.meta.dir, "../logs/general.log"),
	},
});
