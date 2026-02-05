import React, { useState, useMemo } from 'react';
import { Search, Mail, Calendar, RefreshCw, Trash2, MailOpen, AlertCircle } from 'lucide-react';
import { Email } from '../../../types';

interface EmailInboxProps {
    emails: Email[];
    onRefresh: () => void;
}

export const EmailInbox: React.FC<EmailInboxProps> = ({ emails, onRefresh }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);

    const filteredEmails = useMemo(() => {
        return emails.filter(email =>
            email.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
            email.from.toLowerCase().includes(searchTerm.toLowerCase()) ||
            email.body.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [emails, searchTerm]);

    const formatDate = (dateString: string) => {
        try {
            return new Date(dateString).toLocaleString();
        } catch (e) {
            return dateString;
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-80px)] overflow-hidden bg-slate-50 dark:bg-[#0B1121]">
            <div className="p-6 pb-0">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Email Inbox</h1>
                        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mt-1">
                            Incoming Customer Inquiries
                        </p>
                    </div>
                </div>

                <div className="flex gap-4 mb-6">
                    <div className="flex-1 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center px-4 py-3">
                        <Search className="text-slate-400 mr-3" size={20} />
                        <input
                            type="text"
                            placeholder="Search emails..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="flex-1 bg-transparent outline-none text-slate-900 dark:text-white placeholder:text-slate-400"
                        />
                    </div>
                    <button
                        onClick={onRefresh}
                        className="p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-500/30 transition-all active:scale-95"
                        title="Refresh Emails"
                    >
                        <RefreshCw size={24} />
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-hidden px-6 pb-6 flex gap-6">
                {/* Email List */}
                <div className={`flex-1 flex flex-col bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden ${selectedEmail ? 'hidden lg:flex lg:w-1/3 lg:flex-none' : 'w-full'}`}>
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2">
                        {filteredEmails.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-slate-400 p-8 text-center">
                                <Mail size={48} className="mb-4 opacity-20" />
                                <p className="font-bold">No emails found</p>
                            </div>
                        ) : (
                            filteredEmails.map(email => (
                                <div
                                    key={email.id}
                                    onClick={() => setSelectedEmail(email)}
                                    className={`p-4 rounded-xl cursor-pointer border transition-all ${selectedEmail?.id === email.id
                                        ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 ring-1 ring-blue-500/20'
                                        : 'bg-transparent hover:bg-slate-50 dark:hover:bg-slate-700/50 border-transparent hover:border-slate-200 dark:hover:border-slate-700'
                                        }`}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <h3 className={`font-bold text-sm line-clamp-1 ${selectedEmail?.id === email.id ? 'text-blue-700 dark:text-blue-400' : 'text-slate-900 dark:text-white'}`}>
                                            {email.from}
                                        </h3>
                                        <span className="text-[10px] font-medium text-slate-400 whitespace-nowrap ml-2">
                                            {formatDate(email.date).split(',')[0]}
                                        </span>
                                    </div>
                                    <h4 className="font-semibold text-xs text-slate-600 dark:text-slate-300 mb-1 line-clamp-1">
                                        {email.subject}
                                    </h4>
                                    <p className="text-xs text-slate-400 line-clamp-2">
                                        {email.body.replace(/\n/g, ' ')}
                                    </p>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Email Detail View */}
                {selectedEmail ? (
                    <div className="flex-[2] flex flex-col bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden animate-in fade-in slide-in-from-right-4">
                        {/* Header */}
                        <div className="p-6 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
                            <div className="flex justify-between items-start mb-4">
                                <h2 className="text-xl font-black text-slate-900 dark:text-white leading-tight">
                                    {selectedEmail.subject}
                                </h2>
                                <button
                                    onClick={() => setSelectedEmail(null)}
                                    className="lg:hidden p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                >
                                    Back
                                </button>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold">
                                    {selectedEmail.from.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1">
                                    <p className="font-bold text-sm text-slate-900 dark:text-white">{selectedEmail.from}</p>
                                    <p className="text-xs text-slate-500">{formatDate(selectedEmail.date)}</p>
                                </div>
                            </div>
                        </div>

                        {/* Body */}
                        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                            {selectedEmail.body}
                        </div>
                    </div>
                ) : (
                    <div className="hidden lg:flex flex-[2] bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 items-center justify-center flex-col text-slate-400">
                        <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                            <MailOpen size={32} />
                        </div>
                        <p className="font-bold">Select an email to view details</p>
                    </div>
                )}
            </div>
        </div>
    );
};
