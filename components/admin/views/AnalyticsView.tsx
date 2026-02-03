import React, { useMemo } from 'react';
import {
    BarChart3, TrendingUp, Clock, Users, AlertTriangle, CheckCircle2,
    ArrowUp, ArrowDown, Activity, Zap, Target, Award, Package
} from 'lucide-react';
import { Job, Worker, JobStage, DashboardMetrics, StageMetrics, WorkerStats } from '../../../types';
import { STAGE_LABELS } from '../../../constants';

interface AnalyticsViewProps {
    jobs: Job[];
    workers: Worker[];
}

const STAGE_ORDER: JobStage[] = ['DESIGN', 'CUTTING', 'BENDING', 'PUNCHING', 'FABRICATION', 'POWDER_COATING', 'ASSEMBLY', 'DISPATCH'];

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ jobs, workers }) => {
    // Calculate dashboard metrics
    const metrics: DashboardMetrics = useMemo(() => {
        const now = Date.now();
        const today = new Date().setHours(0, 0, 0, 0);

        const completedToday = jobs.filter(j => j.isCompleted && j.lastUpdated >= today).length;
        const inProgress = jobs.filter(j => !j.isCompleted).length;
        const pendingQC = jobs.filter(j => j.qcStatus === 'READY_FOR_QC').length;

        // Calculate average cycle time (from start to completion)
        const completedJobs = jobs.filter(j => j.isCompleted && j.startTime);
        const avgCycleTime = completedJobs.length > 0
            ? completedJobs.reduce((acc, j) => acc + (j.lastUpdated - j.startTime), 0) / completedJobs.length / (1000 * 60 * 60)
            : 0;

        // Find bottleneck stage
        const stageCounts = STAGE_ORDER.reduce((acc, stage) => {
            acc[stage] = jobs.filter(j => j.currentStage === stage && !j.isCompleted).length;
            return acc;
        }, {} as Record<JobStage, number>);
        const bottleneck = Object.entries(stageCounts).sort((a, b) => b[1] - a[1])[0];

        // Calculate throughput (jobs completed per day over last 7 days)
        const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
        const recentCompleted = jobs.filter(j => j.isCompleted && j.lastUpdated >= sevenDaysAgo).length;
        const throughputRate = recentCompleted / 7;

        // Efficiency (completed vs total active)
        const efficiency = jobs.length > 0 ? (jobs.filter(j => j.isCompleted).length / jobs.length) * 100 : 0;

        return {
            totalJobs: jobs.length,
            completedToday,
            inProgress,
            pendingQC,
            avgCycleTime: Math.round(avgCycleTime * 10) / 10,
            throughputRate: Math.round(throughputRate * 10) / 10,
            stageBottleneck: bottleneck ? bottleneck[0] as JobStage : undefined,
            efficiency: Math.round(efficiency)
        };
    }, [jobs]);

    // Calculate stage metrics
    const stageMetrics: StageMetrics[] = useMemo(() => {
        const today = new Date().setHours(0, 0, 0, 0);

        return STAGE_ORDER.map(stage => {
            const stageJobs = jobs.filter(j => j.currentStage === stage);
            const completedInStage = jobs.filter(j => {
                const stageStatus = j.stageStatus?.[stage];
                return stageStatus?.status === 'COMPLETED';
            });

            // Average time in stage
            const avgTime = completedInStage.length > 0
                ? completedInStage.reduce((acc, j) => {
                    const time = j.stageTimes?.[stage] || 0;
                    return acc + time;
                }, 0) / completedInStage.length / (1000 * 60 * 60)
                : 0;

            return {
                stage,
                jobCount: stageJobs.length,
                avgTime: Math.round(avgTime * 10) / 10,
                pendingCount: stageJobs.filter(j => j.qcStatus === 'PENDING').length,
                completedToday: jobs.filter(j => {
                    const stageStatus = j.stageStatus?.[stage];
                    return stageStatus?.endTime && stageStatus.endTime >= today;
                }).length
            };
        });
    }, [jobs]);

    // Calculate worker stats
    const workerStats: WorkerStats[] = useMemo(() => {
        const today = new Date().setHours(0, 0, 0, 0);

        return workers.filter(w => w.role !== 'ADMIN').map(worker => {
            const workerJobs = jobs.filter(j => j.assignedWorkers.includes(worker.name));
            const completed = workerJobs.filter(j => j.isCompleted);
            const completedToday = completed.filter(j => j.lastUpdated >= today);

            // Quality score based on rejection rate
            const rejectedJobs = workerJobs.filter(j => j.qcStatus === 'REJECTED');
            const qualityScore = workerJobs.length > 0
                ? Math.round((1 - rejectedJobs.length / workerJobs.length) * 100)
                : 100;

            // Average completion time
            const avgTime = completed.length > 0
                ? completed.reduce((acc, j) => acc + (j.lastUpdated - j.startTime), 0) / completed.length / (1000 * 60 * 60)
                : 0;

            // Find current stage (most recent active job)
            const activeJob = workerJobs.find(j => !j.isCompleted);

            return {
                workerId: worker.id,
                workerName: worker.name,
                jobsCompleted: completed.length,
                jobsCompletedToday: completedToday.length,
                avgCompletionTime: Math.round(avgTime * 10) / 10,
                qualityScore,
                currentStage: activeJob?.currentStage,
                isActive: activeJob !== undefined,
                lastActivity: workerJobs.length > 0
                    ? Math.max(...workerJobs.map(j => j.lastUpdated))
                    : undefined
            };
        }).sort((a, b) => b.jobsCompleted - a.jobsCompleted);
    }, [jobs, workers]);

    const StatCard = ({
        title, value, subtitle, icon: Icon, trend, color
    }: {
        title: string;
        value: string | number;
        subtitle?: string;
        icon: React.ElementType;
        trend?: { value: number; isUp: boolean };
        color: string;
    }) => (
        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-5 hover:border-slate-600/50 transition-all">
            <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow-lg`}>
                    <Icon size={22} className="text-white" />
                </div>
                {trend && (
                    <div className={`flex items-center gap-1 text-xs font-bold ${trend.isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {trend.isUp ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                        {trend.value}%
                    </div>
                )}
            </div>
            <p className="text-2xl font-black text-white mb-1">{value}</p>
            <p className="text-xs text-slate-400 font-medium">{title}</p>
            {subtitle && <p className="text-[10px] text-slate-500 mt-1">{subtitle}</p>}
        </div>
    );

    const getStageBarWidth = (count: number) => {
        const max = Math.max(...stageMetrics.map(s => s.jobCount), 1);
        return `${(count / max) * 100}%`;
    };

    return (
        <div className="p-6 space-y-6 bg-slate-900 min-h-full">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-white">Analytics Dashboard</h1>
                    <p className="text-sm text-slate-400 mt-1">Production metrics and insights</p>
                </div>
                <div className="flex items-center gap-2 bg-slate-800/50 px-4 py-2 rounded-xl border border-slate-700/50">
                    <Activity size={16} className="text-emerald-400 animate-pulse" />
                    <span className="text-xs font-bold text-slate-300">Live Data</span>
                </div>
            </div>

            {/* Main Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard
                    title="Total Jobs"
                    value={metrics.totalJobs}
                    icon={Package}
                    color="from-blue-500 to-blue-600"
                />
                <StatCard
                    title="Completed Today"
                    value={metrics.completedToday}
                    icon={CheckCircle2}
                    color="from-emerald-500 to-emerald-600"
                    trend={{ value: 12, isUp: true }}
                />
                <StatCard
                    title="In Progress"
                    value={metrics.inProgress}
                    icon={Activity}
                    color="from-amber-500 to-orange-600"
                />
                <StatCard
                    title="Pending QC"
                    value={metrics.pendingQC}
                    icon={AlertTriangle}
                    color="from-rose-500 to-rose-600"
                />
            </div>

            {/* Secondary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard
                    title="Avg Cycle Time"
                    value={`${metrics.avgCycleTime}h`}
                    subtitle="Start to completion"
                    icon={Clock}
                    color="from-purple-500 to-purple-600"
                />
                <StatCard
                    title="Throughput"
                    value={`${metrics.throughputRate}/day`}
                    subtitle="Jobs completed daily"
                    icon={TrendingUp}
                    color="from-cyan-500 to-cyan-600"
                />
                <StatCard
                    title="Efficiency"
                    value={`${metrics.efficiency}%`}
                    subtitle="Completion rate"
                    icon={Target}
                    color="from-indigo-500 to-indigo-600"
                />
                <StatCard
                    title="Bottleneck"
                    value={metrics.stageBottleneck ? STAGE_LABELS[metrics.stageBottleneck] : 'None'}
                    subtitle="Highest queue"
                    icon={Zap}
                    color="from-red-500 to-red-600"
                />
            </div>

            {/* Stage Distribution */}
            <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-6">
                    <BarChart3 size={20} className="text-blue-400" />
                    <h2 className="text-lg font-bold text-white">Stage Distribution</h2>
                </div>
                <div className="space-y-4">
                    {stageMetrics.map((stage) => (
                        <div key={stage.stage} className="flex items-center gap-4">
                            <div className="w-32 text-xs font-medium text-slate-400 truncate">
                                {STAGE_LABELS[stage.stage]}
                            </div>
                            <div className="flex-1 h-8 bg-slate-700/50 rounded-lg overflow-hidden relative">
                                <div
                                    className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-lg transition-all duration-500"
                                    style={{ width: getStageBarWidth(stage.jobCount) }}
                                />
                                <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
                                    {stage.jobCount} jobs
                                </span>
                            </div>
                            <div className="w-20 text-right">
                                <span className="text-xs text-slate-400">{stage.avgTime}h avg</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Worker Leaderboard */}
            <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-6">
                    <Award size={20} className="text-amber-400" />
                    <h2 className="text-lg font-bold text-white">Worker Performance</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="text-left text-xs text-slate-500 border-b border-slate-700/50">
                                <th className="pb-3 font-medium">Rank</th>
                                <th className="pb-3 font-medium">Worker</th>
                                <th className="pb-3 font-medium text-center">Jobs Done</th>
                                <th className="pb-3 font-medium text-center">Today</th>
                                <th className="pb-3 font-medium text-center">Avg Time</th>
                                <th className="pb-3 font-medium text-center">Quality</th>
                                <th className="pb-3 font-medium text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            {workerStats.slice(0, 10).map((worker, idx) => (
                                <tr key={worker.workerId} className="border-b border-slate-700/30 hover:bg-slate-700/20 transition-colors">
                                    <td className="py-4">
                                        <span className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${idx === 0 ? 'bg-amber-500/20 text-amber-400' :
                                                idx === 1 ? 'bg-slate-400/20 text-slate-300' :
                                                    idx === 2 ? 'bg-orange-500/20 text-orange-400' :
                                                        'bg-slate-700/50 text-slate-500'
                                            }`}>
                                            {idx + 1}
                                        </span>
                                    </td>
                                    <td className="py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                                                {worker.workerName.charAt(0)}
                                            </div>
                                            <span className="font-medium text-white">{worker.workerName}</span>
                                        </div>
                                    </td>
                                    <td className="py-4 text-center font-bold text-white">{worker.jobsCompleted}</td>
                                    <td className="py-4 text-center font-medium text-emerald-400">{worker.jobsCompletedToday}</td>
                                    <td className="py-4 text-center text-slate-400">{worker.avgCompletionTime}h</td>
                                    <td className="py-4 text-center">
                                        <span className={`px-2 py-1 rounded-lg text-xs font-bold ${worker.qualityScore >= 90 ? 'bg-emerald-500/20 text-emerald-400' :
                                                worker.qualityScore >= 70 ? 'bg-amber-500/20 text-amber-400' :
                                                    'bg-rose-500/20 text-rose-400'
                                            }`}>
                                            {worker.qualityScore}%
                                        </span>
                                    </td>
                                    <td className="py-4 text-center">
                                        <span className={`flex items-center justify-center gap-1.5 text-xs font-medium ${worker.isActive ? 'text-emerald-400' : 'text-slate-500'
                                            }`}>
                                            <span className={`w-2 h-2 rounded-full ${worker.isActive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`}></span>
                                            {worker.isActive ? 'Active' : 'Idle'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
