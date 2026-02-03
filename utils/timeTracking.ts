/**
 * Time tracking utilities for job stage monitoring
 */

/**
 * Format milliseconds to human readable time
 * @param ms - Time in milliseconds
 * @returns Formatted string (e.g., "2h 30m", "45m", "30s")
 */
export const formatTimeElapsed = (ms: number): string => {
    if (!ms || ms < 0) return '0s';

    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
        const remainingHours = hours % 24;
        return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
    }
    if (hours > 0) {
        const remainingMinutes = minutes % 60;
        return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
    }
    if (minutes > 0) {
        const remainingSeconds = seconds % 60;
        return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
    }
    return `${seconds}s`;
};

/**
 * Calculate current stage elapsed time
 * @param startTime - Timestamp when stage started
 * @returns Milliseconds elapsed
 */
export const getCurrentStageElapsed = (startTime?: number): number => {
    if (!startTime) return 0;
    return Date.now() - startTime;
};

/**
 * Get total time spent across all stages
 * @param stageTimes - Object mapping stages to time spent
 * @param currentStageStartTime - Start time of current stage
 * @returns Total milliseconds
 */
export const getTotalTimeSpent = (
    stageTimes?: { [key: string]: number },
    currentStageStartTime?: number
): number => {
    const completedTime = Object.values(stageTimes || {}).reduce((sum, time) => sum + time, 0);
    const currentTime = getCurrentStageElapsed(currentStageStartTime);
    return completedTime + currentTime;
};

/**
 * Format time with color coding based on threshold
 * @param elapsedMs - Elapsed time in milliseconds
 * @param thresholdHours - Warning threshold in hours
 * @returns Object with formatted time and color class
 */
export const getTimeWithStatus = (
    elapsedMs: number,
    thresholdHours: number = 24
): { time: string; colorClass: string; status: 'good' | 'warning' | 'critical' } => {
    const time = formatTimeElapsed(elapsedMs);
    const hours = elapsedMs / (1000 * 60 * 60);

    if (hours < thresholdHours * 0.5) {
        return { time, colorClass: 'text-emerald-600', status: 'good' };
    } else if (hours < thresholdHours) {
        return { time, colorClass: 'text-orange-600', status: 'warning' };
    } else {
        return { time, colorClass: 'text-rose-600', status: 'critical' };
    }
};
