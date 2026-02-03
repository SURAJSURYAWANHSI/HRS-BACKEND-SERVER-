import React from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { Job } from '../../../types';
import { STAGES, STAGE_LABELS } from '../../../constants';

interface ProductionInsightsProps {
    jobs: Job[];
}

export const ProductionInsights: React.FC<ProductionInsightsProps> = ({ jobs }) => {
    return (
        <div className="mb-12">
            <div className="bg-white/80 dark:bg-[#111827]/80 backdrop-blur-3xl rounded-[2.5rem] p-10 border border-slate-200 dark:border-slate-800/50 shadow-2xl dark:shadow-none">
                <div className="flex justify-between items-center mb-10">
                    <div>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Production Throughput</h3>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2">Active Jobs Across Factory Stages</p>
                    </div>
                </div>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={STAGES.map(stage => ({ name: STAGE_LABELS[stage], count: jobs.filter(j => j.currentStage === stage && !j.isCompleted).length, color: stage === 'DESIGN' ? '#3B82F6' : stage === 'DISPATCH' ? '#10B981' : '#6366F1' }))} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} opacity={0.3} />
                            <XAxis
                                dataKey="name"
                                stroke="#64748b"
                                fontSize={11}
                                fontWeight={800}
                                tickLine={false}
                                axisLine={false}
                                tick={{ fill: '#94A3B8' }}
                                dy={10}
                            />
                            <YAxis
                                stroke="#64748b"
                                fontSize={11}
                                fontWeight={800}
                                tickLine={false}
                                axisLine={false}
                                tick={{ fill: '#94A3B8' }}
                                label={{ value: 'Active Orders', angle: -90, position: 'insideLeft', style: { fill: '#64748b', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.1em' }, dy: 50 }}
                            />
                            <Tooltip
                                cursor={{ fill: 'transparent' }}
                                contentStyle={{ backgroundColor: '#0F172A', border: '1px solid #1E293B', borderRadius: '1rem', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', color: '#fff', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.5)' }}
                                itemStyle={{ color: '#fff' }}
                            />
                            <Bar dataKey="count" radius={[8, 8, 8, 8]} barSize={60}>
                                {
                                    STAGES.map((stage, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={stage === 'DESIGN' ? '#3B82F6' : stage === 'DISPATCH' ? '#10B981' : '#6366F1'}
                                            className="transition-all duration-300 hover:opacity-80"
                                        />
                                    ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};
