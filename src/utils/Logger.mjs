export default class Logger {
	static DEBUG_ENABLED = null;

	static SYSTEM_ID = "shadowdark";

	static SYSTEM_NAME = "shadowdark";

	static debug(...args) {
		if (Logger.DEBUG_ENABLED === null) {
			Logger.DEBUG_ENABLED = game.settings.get(Logger.SYSTEM_ID, "debugEnabled");
		}

		if (Logger.DEBUG_ENABLED) console.debug(`${Logger.SYSTEM_NAME} |`, ...args);
	}

	static error(...args) {
		console.error(`${Logger.SYSTEM_NAME} |`, ...args);
	}

	static log(...args) {
		console.log(`${Logger.SYSTEM_NAME} |`, ...args);
	}

	static warn(...args) {
		console.warn(`${Logger.SYSTEM_NAME} |`, ...args);
	}

	static debugObject(obj, indent = '    ', recursiveLevel = 0) {
		if (recursiveLevel > 5)
			return;

		if (Logger.DEBUG_ENABLED === null) {
			Logger.DEBUG_ENABLED = game.settings.get(Logger.SYSTEM_ID, "debugEnabled");
		}

		if (!Logger.DEBUG_ENABLED)
		{
			console.log(`${Logger.SYSTEM_NAME} | Debug Mode is not enabled.`);
			return;
		}

		if (recursiveLevel == 0)
			console.debug(`${Logger.SYSTEM_NAME} Object Debug Start:`);
		
		if (obj === null || obj === undefined) {
			console.log(indent + String(obj));
			return;
		}

		if (typeof obj !== 'object') {
			console.log(indent + obj);
			return;
		}

		if (Array.isArray(obj)) {
			obj.forEach((item, index) => {
				console.log(`${indent}[${index}]:`);
				this.debugObject(item, indent + '    ', recursiveLevel + 1);
			});
		} else if (obj instanceof Map) {
			obj.forEach((value, key) => {
				console.log(`${indent}Map Key: ${key}`);
				this.debugObject(value, indent + '    ', recursiveLevel + 1);
			});
		} else if (obj instanceof Set) {
			let index = 0;
			obj.forEach((value) => {
				console.log(`${indent}Set[${index}]:`);
				this.debugObject(value, indent + '    ', recursiveLevel + 1);
				index++;
			});
		} else {
			for (const key in obj) {
				if (Object.hasOwn(obj, key)) {
					if (typeof obj[key] === 'string') {
						console.log(`${indent}${key}: "${obj[key]}"`);
					}
					else if (typeof obj[key] === 'number') {
						console.log(`${indent}${key}: ${obj[key]}`);
					}
					else {
						console.log(`${indent}${key}:`);
						this.debugObject(obj[key], indent + '    ', recursiveLevel + 1);
					}
				}
			}
		}
		if (recursiveLevel == 0)
			console.debug(`${Logger.SYSTEM_NAME} Object Debug End.`);
	}
}
