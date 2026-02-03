import React from 'react';
import {
    Box, Clock, Activity, AlertTriangle, RotateCcw, Truck, XCircle
} from 'lucide-react';
import { StatCard } from './StatCard';
import { Job } from '../../../types';

interface StatsOverviewProps {
    jobs: Job[];
    activeStatFilter: string | null;
    setActiveStatFilter: (filter: string | null) => void;
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({ jobs, activeStatFilter, setActiveStatFilter }) => {
    const totalJobs = jobs.length;
    const pendingJobs = jobs.filter(j => !j.isCompleted).length;

    const handleFilterClick = (f: string) => {
        setActiveStatFilter(f === activeStatFilter ? null : f);
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
            <StatCard icon={<Box />} label="Total Jobs" value={totalJobs} filterKey="TOTAL" iconBg="bg-slate-100 dark:bg-slate-800/50" iconColor="text-slate-600 dark:text-white" activeStatFilter={activeStatFilter} onClick={handleFilterClick} />
            <StatCard icon={<Clock />} label="Pending" value={pendingJobs} filterKey="PENDING" iconBg="bg-blue-50 dark:bg-blue-600/10" iconColor="text-blue-600 dark:text-blue-500" activeStatFilter={activeStatFilter} onClick={handleFilterClick} />
            <StatCard icon={<Activity />} label="In Prod." value={jobs.filter(j => !j.isCompleted && j.currentStage !== 'DESIGN' && j.currentStage !== 'DISPATCH').length} filterKey="IN_PROD" iconBg="bg-indigo-50 dark:bg-indigo-600/10" iconColor="text-indigo-600 dark:text-indigo-400" activeStatFilter={activeStatFilter} onClick={handleFilterClick} />
            <StatCard icon={<AlertTriangle />} label="Rejected" value={jobs.filter(j => j.qcStatus === 'REJECTED').length} filterKey="QUALITY_REJ" iconBg="bg-rose-50 dark:bg-rose-600/10" iconColor="text-rose-600 dark:text-rose-500" activeStatFilter={activeStatFilter} onClick={handleFilterClick} />
            <StatCard icon={<RotateCcw />} label="Delayed" value={jobs.filter(j => !j.isCompleted && (Date.now() - j.startTime) > (j.maxCompletionTime * 24 * 60 * 60 * 1000)).length} filterKey="DELAYED" iconBg="bg-orange-50 dark:bg-orange-600/10" iconColor="text-orange-600 dark:text-orange-500" activeStatFilter={activeStatFilter} onClick={handleFilterClick} />
            <StatCard icon={<Truck />} label="Today's Disp." value={jobs.filter(j => j.isCompleted && new Date(j.lastUpdated).toDateString() === new Date().toDateString()).length} filterKey="TODAY_DISP" iconBg="bg-emerald-50 dark:bg-emerald-600/10" iconColor="text-emerald-600 dark:text-emerald-500" activeStatFilter={activeStatFilter} onClick={handleFilterClick} />
        </div>
    );
};
