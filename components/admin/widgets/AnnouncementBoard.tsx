import React, { useState } from 'react';
import { Megaphone, Plus, X, AlertTriangle, Pin, Clock, User, Send } from 'lucide-react';
import { Announcement, AnnouncementPriority } from '../../../types';

interface AnnouncementBoardProps {
    announcements: Announcement[];
    onAddAnnouncement: (announcement: Omit<Announcement, 'id' | 'timestamp'>) => void;
    onDeleteAnnouncement: (id: string) => void;
    currentUserName: string;
    currentUserId: string;
    isAdmin: boolean;
}

export const AnnouncementBoard: React.FC<AnnouncementBoardProps> = ({
    announcements,
    onAddAnnouncement,
    onDeleteAnnouncement,
    currentUserName,
    currentUserId,
    isAdmin
}) => {
    const [showForm, setShowForm] = useState(false);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [priority, setPriority] = useState<AnnouncementPriority>('NORMAL');

    const handleSubmit = () => {
        if (!title.trim() || !content.trim()) return;

        onAddAnnouncement({
            title: title.trim(),
            content: content.trim(),
            author: currentUserName,
            authorId: currentUserId,
            priority,
            isActive: true
        });

        setTitle('');
        setContent('');
        setPriority('NORMAL');
        setShowForm(false);
    };

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const activeAnnouncements = announcements.filter(a => a.isActive);

    return (
        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-700/50 bg-gradient-to-r from-amber-500/10 to-orange-500/10">
                <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
                        <Megaphone size={20} className="text-white" />
                    </div>
                    <div>
                        <h2 className="text-base font-bold text-white">Announcements</h2>
                        <p className="text-xs text-slate-400">{activeAnnouncements.length} active announcements</p>
                    </div>
                </div>
                {isAdmin && (
                    <button
                        onClick={() => setShowForm(!showForm)}
                        className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-white text-sm font-bold rounded-xl transition-all hover:scale-105 active:scale-95"
                    >
                        <Plus size={16} />
                        New
                    </button>
                )}
            </div>

            {/* New Announcement Form */}
            {showForm && (
                <div className="p-5 border-b border-slate-700/50 bg-slate-800/30">
                    <div className="space-y-4">
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Announcement title..."
                            className="w-full bg-slate-700/50 border border-slate-600/50 rounded-xl px-4 py-3 text-white text-sm placeholder:text-slate-500 focus:border-amber-500/50 outline-none"
                        />
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="Write your announcement..."
                            rows={3}
                            className="w-full bg-slate-700/50 border border-slate-600/50 rounded-xl px-4 py-3 text-white text-sm placeholder:text-slate-500 focus:border-amber-500/50 outline-none resize-none"
                        />
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-slate-400">Priority:</span>
                                {(['NORMAL', 'IMPORTANT', 'URGENT'] as AnnouncementPriority[]).map((p) => (
                                    <button
                                        key={p}
                                        onClick={() => setPriority(p)}
                                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${priority === p
                                                ? p === 'URGENT' ? 'bg-rose-500 text-white' :
                                                    p === 'IMPORTANT' ? 'bg-amber-500 text-white' :
                                                        'bg-slate-600 text-white'
                                                : 'bg-slate-700/50 text-slate-400 hover:bg-slate-600/50'
                                            }`}
                                    >
                                        {p}
                                    </button>
                                ))}
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setShowForm(false)}
                                    className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={!title.trim() || !content.trim()}
                                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Send size={14} />
                                    Post
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Announcements List */}
            <div className="max-h-96 overflow-y-auto">
                {activeAnnouncements.length === 0 ? (
                    <div className="p-8 text-center">
                        <Megaphone size={40} className="mx-auto text-slate-600 mb-3" />
                        <p className="text-sm text-slate-500">No announcements yet</p>
                    </div>
                ) : (
                    activeAnnouncements.map((announcement) => (
                        <div
                            key={announcement.id}
                            className={`p-5 border-b border-slate-700/30 hover:bg-slate-700/20 transition-colors ${announcement.priority === 'URGENT' ? 'bg-rose-500/5 border-l-4 border-l-rose-500' :
                                    announcement.priority === 'IMPORTANT' ? 'bg-amber-500/5 border-l-4 border-l-amber-500' : ''
                                }`}
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        {announcement.priority !== 'NORMAL' && (
                                            <span className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${announcement.priority === 'URGENT' ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'
                                                }`}>
                                                <AlertTriangle size={10} />
                                                {announcement.priority}
                                            </span>
                                        )}
                                    </div>
                                    <h3 className="text-sm font-bold text-white mb-2">{announcement.title}</h3>
                                    <p className="text-sm text-slate-400 leading-relaxed">{announcement.content}</p>
                                    <div className="flex items-center gap-4 mt-3 text-[10px] text-slate-500">
                                        <span className="flex items-center gap-1">
                                            <User size={10} />
                                            {announcement.author}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Clock size={10} />
                                            {formatDate(announcement.timestamp)}
                                        </span>
                                    </div>
                                </div>
                                {isAdmin && (
                                    <button
                                        onClick={() => onDeleteAnnouncement(announcement.id)}
                                        className="p-2 hover:bg-slate-600 rounded-lg text-slate-500 hover:text-rose-400 transition-colors"
                                    >
                                        <X size={16} />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
