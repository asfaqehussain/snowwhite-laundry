'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import {
    collection, query, where, orderBy, getDocs,
    updateDoc, doc, writeBatch, onSnapshot, limit
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/auth-context';
import { AppNotification, NotificationType } from '@/lib/types';
import { format, formatDistanceToNow } from 'date-fns';
import { Bell, CheckCheck, X, Package, Truck, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

// ─── Icon & colour mapping per notification type ───────────────────────────
const typeConfig: Record<NotificationType, { icon: any; bg: string; iconColor: string; toastIcon: string }> = {
    load_collected: { icon: Truck, bg: 'bg-amber-50', iconColor: 'text-amber-500', toastIcon: '🚚' },
    load_dropped: { icon: Package, bg: 'bg-blue-50', iconColor: 'text-blue-500', toastIcon: '📦' },
    load_approved: { icon: CheckCircle2, bg: 'bg-emerald-50', iconColor: 'text-emerald-500', toastIcon: '✅' },
    load_partial: { icon: AlertTriangle, bg: 'bg-red-50', iconColor: 'text-red-500', toastIcon: '⚠️' },
    load_delayed: { icon: Clock, bg: 'bg-purple-50', iconColor: 'text-purple-500', toastIcon: '🕐' },
};

export default function NotificationBell() {
    const { user, profile } = useAuth();
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [open, setOpen] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);
    const prevCountRef = useRef(0);

    // Close on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // Real-time listener for this user's notifications
    useEffect(() => {
        const uid = user?.uid || profile?.uid;
        if (!uid) return;

        // We fetch without orderBy to avoid composite index requirement, sort client-side
        const q = query(
            collection(db, 'notifications'),
            where('targetUid', '==', uid),
            limit(50)
        );

        const unsubscribe = onSnapshot(q, snap => {
            const all = snap.docs
                .map(d => ({ id: d.id, ...d.data() } as AppNotification))
                .sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0));

            setNotifications(all);

            // Show in-app toast for brand-new unread notifications
            const unread = all.filter(n => !n.read);
            if (unread.length > prevCountRef.current && prevCountRef.current > 0) {
                const newest = unread[0];
                const cfg = typeConfig[newest.type] ?? typeConfig.load_collected;
                toast(newest.title + '\n' + newest.body, {
                    icon: cfg.toastIcon,
                    duration: 5000,
                    style: { maxWidth: 340, fontSize: 13 },
                });
            }
            prevCountRef.current = unread.length;
        }, err => {
            console.error('Notification listener error:', err);
        });

        return () => unsubscribe();
    }, [user, profile]);

    const unreadCount = notifications.filter(n => !n.read).length;

    const markAsRead = async (notif: AppNotification) => {
        if (notif.read) return;
        try {
            await updateDoc(doc(db, 'notifications', notif.id), { read: true });
        } catch (err) {
            console.error('markAsRead error:', err);
        }
    };

    const markAllRead = async () => {
        const unread = notifications.filter(n => !n.read);
        if (unread.length === 0) return;
        try {
            const batch = writeBatch(db);
            unread.forEach(n => batch.update(doc(db, 'notifications', n.id), { read: true }));
            await batch.commit();
        } catch (err) {
            console.error('markAllRead error:', err);
        }
    };

    const deleteNotification = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await updateDoc(doc(db, 'notifications', id), { read: true }); // soft-delete as read
            setNotifications(prev => prev.filter(n => n.id !== id));
        } catch (err) {
            console.error('delete error:', err);
        }
    };

    return (
        <div className="relative" ref={panelRef}>
            {/* Bell Button */}
            <button
                onClick={() => {
                    setOpen(prev => !prev);
                    if (!open && unreadCount > 0) {
                        // Mark all as read when opening
                        setTimeout(markAllRead, 1500);
                    }
                }}
                className="relative p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all duration-200"
                aria-label="Notifications"
            >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 h-[18px] min-w-[18px] rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center px-0.5 ring-2 ring-white animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Notification Panel */}
            {open && (
                <div className="absolute right-0 top-11 z-50 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-fade-in-up">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-100 bg-white sticky top-0 z-10">
                        <div className="flex items-center gap-2">
                            <Bell className="h-4 w-4 text-slate-600" />
                            <h3 className="text-sm font-bold text-slate-900">Notifications</h3>
                            {unreadCount > 0 && (
                                <span className="bg-brand-100 text-brand-700 text-xs font-bold px-2 py-0.5 rounded-full">
                                    {unreadCount} new
                                </span>
                            )}
                        </div>
                        {notifications.some(n => !n.read) && (
                            <button
                                onClick={markAllRead}
                                className="text-xs text-brand-600 hover:text-brand-700 font-semibold flex items-center gap-1 hover:bg-brand-50 px-2 py-1 rounded-lg transition-colors"
                            >
                                <CheckCheck className="h-3.5 w-3.5" />
                                Mark all read
                            </button>
                        )}
                    </div>

                    {/* List */}
                    <div className="max-h-[420px] overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="py-12 flex flex-col items-center text-center px-6">
                                <div className="h-12 w-12 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                                    <Bell className="h-6 w-6 text-slate-300" />
                                </div>
                                <p className="text-sm font-medium text-slate-700">All caught up!</p>
                                <p className="text-xs text-slate-400 mt-1">Your notifications will appear here.</p>
                            </div>
                        ) : (
                            notifications.map(notif => {
                                const cfg = typeConfig[notif.type] ?? typeConfig.load_collected;
                                const Icon = cfg.icon;
                                return (
                                    <div
                                        key={notif.id}
                                        onClick={() => markAsRead(notif)}
                                        className={`group flex items-start gap-3 px-4 py-3.5 border-b border-slate-50 last:border-0 cursor-pointer transition-colors ${!notif.read ? 'bg-brand-50/40 hover:bg-brand-50' : 'hover:bg-slate-50'
                                            }`}
                                    >
                                        <div className={`h-9 w-9 rounded-xl ${cfg.bg} ${cfg.iconColor} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                                            <Icon className="h-4.5 w-4.5" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <p className={`text-sm leading-snug ${!notif.read ? 'font-semibold text-slate-900' : 'font-medium text-slate-700'}`}>
                                                    {notif.title}
                                                </p>
                                                <button
                                                    onClick={e => deleteNotification(notif.id, e)}
                                                    className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-slate-300 hover:text-slate-500 transition-all flex-shrink-0"
                                                >
                                                    <X className="h-3.5 w-3.5" />
                                                </button>
                                            </div>
                                            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{notif.body}</p>
                                            <p className="text-[10px] text-slate-400 mt-1.5">
                                                {notif.createdAt
                                                    ? formatDistanceToNow(notif.createdAt.toDate(), { addSuffix: true })
                                                    : 'Just now'}
                                            </p>
                                        </div>
                                        {!notif.read && (
                                            <div className="h-2 w-2 rounded-full bg-brand-500 flex-shrink-0 mt-2" />
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Footer */}
                    {notifications.length > 0 && (
                        <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/50 text-center">
                            <p className="text-xs text-slate-400">{notifications.length} notification{notifications.length !== 1 ? 's' : ''} total</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
