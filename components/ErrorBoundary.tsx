
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { LogOut } from 'lucide-react';

interface Props {
    children?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="h-screen w-screen bg-[#0B1121] flex items-center justify-center p-8 overflow-auto">
                    <div className="bg-[#1E293B] p-8 rounded-3xl border border-rose-900/50 shadow-2xl max-w-4xl w-full">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="p-3 bg-rose-500/10 rounded-xl text-rose-500">
                                <LogOut size={24} />
                            </div>
                            <div>
                                <h1 className="text-2xl font-black text-rose-500 uppercase tracking-tight">System Error</h1>
                                <p className="text-sm font-bold text-slate-500">Application crashed unexpectedly</p>
                            </div>
                        </div>
                        <div className="bg-[#0F172A] p-6 rounded-2xl border border-slate-800 font-mono text-xs overflow-auto max-h-[60vh]">
                            <p className="text-rose-400 font-black mb-4 uppercase">Error Details:</p>
                            <pre className="text-slate-300 whitespace-pre-wrap break-all">{this.state.error?.toString()}</pre>
                            <p className="text-slate-500 mt-4 opacity-50">{this.state.error?.stack}</p>
                        </div>
                        <button onClick={() => window.location.reload()} className="mt-6 px-6 py-3 bg-white text-slate-900 font-black uppercase rounded-xl hover:bg-slate-200 transition-colors">
                            Reload System
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
