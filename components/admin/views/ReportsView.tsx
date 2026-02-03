import React, { useState, useMemo } from 'react';
import {
    FileText, Download, Calendar, BarChart2, TrendingUp, Users,
    Clock, CheckCircle2, AlertTriangle, Package
} from 'lucide-react';
import { Job, Worker, JobStage, DashboardMetrics, StageMetrics, WorkerStats } from '../../../types';
import { STAGE_LABELS } from '../../../constants';

interface ReportsViewProps {
    jobs: Job[];
    workers: Worker[];
}

const STAGE_ORDER: JobStage[] = ['DESIGN', 'CUTTING', 'BENDING', 'PUNCHING', 'FABRICATION', 'POWDER_COATING', 'ASSEMBLY', 'DISPATCH'];

export const ReportsView: React.FC<ReportsViewProps> = ({ jobs, workers }) => {
    const [reportType, setReportType] = useState<'daily' | 'weekly' | 'monthly'>('daily');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

    // Calculate date range based on report type
    const dateRange = useMemo(() => {
        const end = new Date(selectedDate);
        const start = new Date(selectedDate);

        switch (reportType) {
            case 'weekly':
                start.setDate(start.getDate() - 7);
                break;
            case 'monthly':
                start.setMonth(start.getMonth() - 1);
                break;
            default:
                start.setHours(0, 0, 0, 0);
        }

        return { start: start.getTime(), end: end.getTime() + 86400000 };
    }, [reportType, selectedDate]);

    // Calculate report metrics
    const metrics = useMemo(() => {
        const { start, end } = dateRange;
        const rangeJobs = jobs.filter(j => j.startTime >= start && j.startTime <= end);
        const completedJobs = jobs.filter(j => j.isCompleted && j.lastUpdated >= start && j.lastUpdated <= end);

        // Stage metrics
        const stageMetrics: StageMetrics[] = STAGE_ORDER.map(stage => {
            const stageJobs = jobs.filter(j => j.currentStage === stage);
            return {
                stage,
                jobCount: stageJobs.length,
                avgTime: 0,
                pendingCount: stageJobs.filter(j => j.qcStatus === 'PENDING').length,
                completedToday: completedJobs.filter(j => j.currentStage === stage).length
            };
        });

        // Worker stats
        const workerStats: WorkerStats[] = workers.filter(w => w.role !== 'ADMIN').map(worker => {
            const workerJobs = completedJobs.filter(j => j.assignedWorkers.includes(worker.name));
            return {
                workerId: worker.id,
                workerName: worker.name,
                jobsCompleted: workerJobs.length,
                jobsCompletedToday: workerJobs.length,
                avgCompletionTime: 0,
                qualityScore: 95,
                isActive: true
            };
        }).sort((a, b) => b.jobsCompleted - a.jobsCompleted);

        return {
            totalJobs: rangeJobs.length,
            completedJobs: completedJobs.length,
            inProgress: rangeJobs.filter(j => !j.isCompleted).length,
            pendingQC: rangeJobs.filter(j => j.qcStatus === 'READY_FOR_QC').length,
            stageMetrics,
            workerStats: workerStats.slice(0, 5)
        };
    }, [jobs, workers, dateRange]);

    // Export to CSV
    const exportToCSV = () => {
        const headers = ['Metric', 'Value'];
        const rows = [
            ['Report Type', reportType.toUpperCase()],
            ['Date Range', `${new Date(dateRange.start).toLocaleDateString()} - ${new Date(dateRange.end).toLocaleDateString()}`],
            ['Total Jobs', metrics.totalJobs.toString()],
            ['Completed Jobs', metrics.completedJobs.toString()],
            ['In Progress', metrics.inProgress.toString()],
            ['Pending QC', metrics.pendingQC.toString()],
            ['', ''],
            ['Stage', 'Job Count'],
            ...metrics.stageMetrics.map(s => [STAGE_LABELS[s.stage], s.jobCount.toString()]),
            ['', ''],
            ['Top Workers', 'Jobs Completed'],
            ...metrics.workerStats.map(w => [w.workerName, w.jobsCompleted.toString()])
        ];

        const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `protrack_report_${reportType}_${selectedDate}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    // Print report
    const printReport = () => {
        window.print();
    };

    return (
        <div className="p-6 space-y-6 bg-slate-900 min-h-full print:bg-white print:text-black">
            {/* Header */}
            <div className="flex items-center justify-between print:hidden">
                <div>
                    <h1 className="text-2xl font-black text-white">Production Reports</h1>
                    <p className="text-sm text-slate-400 mt-1">Generate and export production summaries</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={exportToCSV}
                        className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-bold rounded-xl hover:bg-emerald-500/30 transition-all"
                    >
                        <Download size={16} />
                        Export CSV
                    </button>
                    <button
                        onClick={printReport}
                        className="flex items-center gap-2 px-4 py-2.5 bg-blue-500/20 border border-blue-500/30 text-blue-400 font-bold rounded-xl hover:bg-blue-500/30 transition-all"
                    >
                        <FileText size={16} />
                        Print PDF
                    </button>
                </div>
            </div>

            {/* Report Type Selector */}
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5 print:hidden">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-400">Report Type:</span>
                        <div className="flex gap-2">
                            {(['daily', 'weekly', 'monthly'] as const).map((type) => (
                                <button
                                    key={type}
                                    onClick={() => setReportType(type)}
                                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${reportType === type
                                            ? 'bg-blue-500 text-white'
                                            : 'bg-slate-700/50 text-slate-400 hover:bg-slate-600/50'
                                        }`}
                                >
                                    {type.charAt(0).toUpperCase() + type.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Calendar size={16} className="text-slate-400" />
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="bg-slate-700/50 border border-slate-600/50 rounded-xl px-4 py-2 text-white text-sm outline-none"
                        />
                    </div>
                </div>
            </div>

            {/* Report Header (for printing) */}
            <div className="hidden print:block text-center mb-8">
                <h1 className="text-3xl font-bold">ProTrack Production Report</h1>
                <p className="text-lg mt-2">{reportType.toUpperCase()} Report</p>
                <p className="text-sm text-gray-600">
                    {new Date(dateRange.start).toLocaleDateString()} - {new Date(dateRange.end).toLocaleDateString()}
                </p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 print:grid-cols-4">
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5 print:border print:border-gray-300">
                    <div className="flex items-center gap-3 mb-3">
                        <Package size={20} className="text-blue-400 print:text-blue-600" />
                        <span className="text-sm text-slate-400 print:text-gray-600">Total Jobs</span>
                    </div>
                    <p className="text-3xl font-black text-white print:text-black">{metrics.totalJobs}</p>
                </div>
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5 print:border print:border-gray-300">
                    <div className="flex items-center gap-3 mb-3">
                        <CheckCircle2 size={20} className="text-emerald-400 print:text-emerald-600" />
                        <span className="text-sm text-slate-400 print:text-gray-600">Completed</span>
                    </div>
                    <p className="text-3xl font-black text-emerald-400 print:text-emerald-600">{metrics.completedJobs}</p>
                </div>
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5 print:border print:border-gray-300">
                    <div className="flex items-center gap-3 mb-3">
                        <Clock size={20} className="text-amber-400 print:text-amber-600" />
                        <span className="text-sm text-slate-400 print:text-gray-600">In Progress</span>
                    </div>
                    <p className="text-3xl font-black text-amber-400 print:text-amber-600">{metrics.inProgress}</p>
                </div>
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5 print:border print:border-gray-300">
                    <div className="flex items-center gap-3 mb-3">
                        <AlertTriangle size={20} className="text-rose-400 print:text-rose-600" />
                        <span className="text-sm text-slate-400 print:text-gray-600">Pending QC</span>
                    </div>
                    <p className="text-3xl font-black text-rose-400 print:text-rose-600">{metrics.pendingQC}</p>
                </div>
            </div>

            {/* Stage Distribution */}
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 print:border print:border-gray-300">
                <div className="flex items-center gap-3 mb-6">
                    <BarChart2 size={20} className="text-blue-400 print:text-blue-600" />
                    <h2 className="text-lg font-bold text-white print:text-black">Stage Distribution</h2>
                </div>
                <div className="grid grid-cols-4 gap-4 print:grid-cols-4">
                    {metrics.stageMetrics.map((stage) => (
                        <div key={stage.stage} className="text-center p-4 bg-slate-700/30 rounded-xl print:border print:border-gray-200">
                            <p className="text-2xl font-black text-white print:text-black">{stage.jobCount}</p>
                            <p className="text-xs text-slate-400 print:text-gray-600 mt-1">{STAGE_LABELS[stage.stage]}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Top Performers */}
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 print:border print:border-gray-300">
                <div className="flex items-center gap-3 mb-6">
                    <Users size={20} className="text-purple-400 print:text-purple-600" />
                    <h2 className="text-lg font-bold text-white print:text-black">Top Performers</h2>
                </div>
                <div className="space-y-3">
                    {metrics.workerStats.map((worker, idx) => (
                        <div key={worker.workerId} className="flex items-center gap-4 p-4 bg-slate-700/30 rounded-xl print:border print:border-gray-200">
                            <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${idx === 0 ? 'bg-amber-500/20 text-amber-400' :
                                    idx === 1 ? 'bg-slate-400/20 text-slate-300' :
                                        idx === 2 ? 'bg-orange-500/20 text-orange-400' :
                                            'bg-slate-700/50 text-slate-500'
                                }`}>
                                {idx + 1}
                            </span>
                            <div className="flex-1">
                                <p className="font-bold text-white print:text-black">{worker.workerName}</p>
                            </div>
                            <p className="text-lg font-bold text-blue-400 print:text-blue-600">{worker.jobsCompleted} jobs</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Footer (for printing) */}
            <div className="hidden print:block text-center text-sm text-gray-500 mt-8 pt-4 border-t">
                Generated by ProTrack MES on {new Date().toLocaleString()}
            </div>
        </div>
    );
};
