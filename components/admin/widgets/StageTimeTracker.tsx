import React from 'react';
import { Clock, TrendingUp } from 'lucide-react';
import { formatTimeElapsed, getCurrentStageElapsed, getTimeWithStatus } from '../../../utils/timeTracking';

interface StageTimeTrackerProps {
    currentStageStartTime?: number;
    stageName: string;
    estimatedHours?: number;
}

export const StageTimeTracker: React.FC<StageTimeTrackerProps> = ({
    currentStageStartTime,
    stageName,
    estimatedHours = 24
}) => {
    const [elapsed, setElapsed] = React.useState(getCurrentStageElapsed(currentStageStartTime));

    // Update elapsed time every second
    React.useEffect(() => {
        const interval = setInterval(() => {
            setElapsed(getCurrentStageElapsed(currentStageStartTime));
        }, 1000);

        return () => clearInterval(interval);
    }, [currentStageStartTime]);

    const { time, colorClass, status } = getTimeWithStatus(elapsed, estimatedHours);

    return (
        <div className="flex items-center gap-2">
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${status === 'good' ? 'bg-emerald-100 dark:bg-emerald-900/30' :
                    status === 'warning' ? 'bg-orange-100 dark:bg-orange-900/30' :
                        'bg-rose-100 dark:bg-rose-900/30'
                }`}>
                <Clock size={14} className={colorClass} />
                <span className={`text-xs font-black ${colorClass}`}>{time}</span>
            </div>
        </div>
    );
};

interface TotalTimeDisplayProps {
    stageTimes?: { [key: string]: number };
    currentStageStartTime?: number;
}

export const TotalTimeDisplay: React.FC<TotalTimeDisplayProps> = ({
    stageTimes,
    currentStageStartTime
}) => {
    const [currentElapsed, setCurrentElapsed] = React.useState(0);

    React.useEffect(() => {
        const interval = setInterval(() => {
            setCurrentElapsed(getCurrentStageElapsed(currentStageStartTime));
        }, 1000);

        return () => clearInterval(interval);
    }, [currentStageStartTime]);

    const completedTime = Object.values(stageTimes || {}).reduce((sum, time) => sum + time, 0);
    const totalTime = completedTime + currentElapsed;

    return (
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-xl">
            <TrendingUp size={16} className="text-blue-600" />
            <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase">Total Time</p>
                <p className="text-sm font-black text-slate-900 dark:text-white">{formatTimeElapsed(totalTime)}</p>
            </div>
        </div>
    );
};
