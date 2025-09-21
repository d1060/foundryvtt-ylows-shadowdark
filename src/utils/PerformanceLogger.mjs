export default class PerformanceLogger {
    static PERFORMANCE_ENABLED = null;
	static SYSTEM_ID = "shadowdark";
	static SYSTEM_NAME = "shadowdark";
    static base = Date.now();

    static resetTimestamp() {
		if (PerformanceLogger.PERFORMANCE_ENABLED === null) {
			PerformanceLogger.PERFORMANCE_ENABLED = game.settings.get(PerformanceLogger.SYSTEM_ID, "performanceLogger");
		}
        if (!PerformanceLogger.PERFORMANCE_ENABLED) return;

        PerformanceLogger.base = Date.now();
    }

    static logTimestamp(...args) {
		if (PerformanceLogger.PERFORMANCE_ENABLED === null) {
			PerformanceLogger.PERFORMANCE_ENABLED = game.settings.get(PerformanceLogger.SYSTEM_ID, "performanceLogger");
		}
        if (!PerformanceLogger.PERFORMANCE_ENABLED) return;

        let current = Date.now();
		let elapsed = current - PerformanceLogger.base;
		PerformanceLogger.base = current;
		console.log(`${PerformanceLogger.SYSTEM_NAME} | ${elapsed} ms | `, ...args);
	}
}