'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Bell, CheckCircle2, XCircle, Info } from 'lucide-react';
import { useNotifications, AppNotification } from '@/hooks/useNotifications';

const iconFor = (n: AppNotification) => {
    if (n.type === 'job_failed') return <XCircle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />;
    if (n.type === 'optimization_complete') return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />;
    return <Info className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />;
};

const timeAgo = (iso: string): string => {
    const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
    if (s < 60) return 'just now';
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    return `${Math.floor(s / 86400)}d ago`;
};

export const NotificationBell: React.FC = () => {
    const { notifications, unreadCount, markAllRead } = useNotifications();
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const onClick = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', onClick);
        return () => document.removeEventListener('mousedown', onClick);
    }, []);

    const toggle = () => {
        const next = !open;
        setOpen(next);
        if (next && unreadCount > 0) markAllRead();
    };

    return (
        <div ref={ref} className="relative">
            <button
                onClick={toggle}
                aria-label={unreadCount > 0 ? `Notifications — ${unreadCount} unread` : 'Notifications'}
                className="relative flex items-center justify-center w-9 h-9 rounded-lg transition-colors cursor-pointer"
                style={{ color: 'var(--fg-secondary)' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--brand-bone-deep)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
                <Bell className="w-4.5 h-4.5" style={{ width: 18, height: 18 }} />
                {unreadCount > 0 && (
                    <span
                        className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full text-[10px] font-bold flex items-center justify-center text-white"
                        style={{ background: '#B91C1C' }}
                    >
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {open && (
                <div
                    className="absolute right-0 top-11 w-80 max-h-96 overflow-y-auto rounded-xl shadow-lg z-50"
                    style={{ background: 'var(--neutral-0)', border: '1px solid var(--brand-bone-deep)' }}
                    role="region"
                    aria-label="Notifications"
                >
                    <div className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wider border-b"
                        style={{ color: 'var(--fg-secondary)', borderColor: 'var(--brand-bone-deep)' }}>
                        Notifications
                    </div>
                    {notifications.length === 0 ? (
                        <div className="px-4 py-8 text-center text-sm text-gray-400">
                            Nothing yet — long-running jobs report here when they finish.
                        </div>
                    ) : (
                        notifications.map(n => (
                            <div key={n.id} className="flex gap-2.5 px-4 py-3 border-b last:border-b-0"
                                style={{ borderColor: 'var(--brand-bone)', background: n.read ? 'transparent' : 'rgba(92,20,39,0.03)' }}>
                                {iconFor(n)}
                                <div className="min-w-0">
                                    <p className="text-[13px] font-semibold leading-snug" style={{ color: 'var(--fg-primary)' }}>{n.title}</p>
                                    {n.body && n.body !== n.title && (
                                        <p className="text-xs mt-0.5 leading-snug" style={{ color: 'var(--fg-secondary)' }}>{n.body}</p>
                                    )}
                                    <p className="text-[10px] mt-1 text-gray-400">{timeAgo(n.created_at)}</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
