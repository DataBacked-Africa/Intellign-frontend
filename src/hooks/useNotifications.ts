'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import axiosInstance from '@/lib/axiosConfig';
import { showToast } from '@/components/ui/CustomToast';

export interface AppNotification {
    id: string;
    type: string;          // optimization_complete | job_failed | system_alert | ...
    title: string;
    body: string;
    data?: { session_id?: string; kind?: string; level?: string } | null;
    read: boolean;
    created_at: string;
}

const POLL_MS = 30_000;

/**
 * Polls /api/v1/me/notifications. When a NEW unread notification arrives while
 * the tab is hidden, flashes the document title and shows a toast once the user
 * returns — long generation/optimization runs finish visibly even in absence.
 */
export const useNotifications = () => {
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const knownIdsRef = useRef<Set<string>>(new Set());
    const pendingToastRef = useRef<AppNotification[]>([]);
    const titleFlashRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const baseTitleRef = useRef<string>('');

    const stopTitleFlash = useCallback(() => {
        if (titleFlashRef.current) {
            clearInterval(titleFlashRef.current);
            titleFlashRef.current = null;
            if (baseTitleRef.current) document.title = baseTitleRef.current;
        }
    }, []);

    const startTitleFlash = useCallback((label: string) => {
        if (titleFlashRef.current || typeof document === 'undefined') return;
        baseTitleRef.current = document.title;
        let on = false;
        titleFlashRef.current = setInterval(() => {
            on = !on;
            document.title = on ? label : baseTitleRef.current;
        }, 1200);
    }, []);

    const load = useCallback(async (announceNew: boolean) => {
        try {
            const res = await axiosInstance.get('/api/v1/me/notifications', {
                params: { page: 1, per_page: 20 },
            });
            const items: AppNotification[] = res.data?.notifications ?? [];
            setNotifications(items);
            setUnreadCount(res.data?.unread_count ?? 0);

            const fresh = items.filter(n => !n.read && !knownIdsRef.current.has(n.id));
            items.forEach(n => knownIdsRef.current.add(n.id));

            if (announceNew && fresh.length > 0) {
                if (typeof document !== 'undefined' && document.hidden) {
                    // User is away — flash the title, queue toasts for their return.
                    pendingToastRef.current.push(...fresh);
                    const failed = fresh.some(n => n.type === 'job_failed');
                    startTitleFlash(failed ? '✗ Job failed — Intellign' : '✓ Ready — Intellign');
                } else {
                    fresh.forEach(n => {
                        if (n.type === 'job_failed') showToast.error(n.title, n.body);
                        else showToast.success(n.title, n.body);
                    });
                }
            }
        } catch { /* unauthenticated or transient — silent */ }
    }, [startTitleFlash]);

    // Poll + replay queued toasts when the user returns to the tab.
    useEffect(() => {
        load(false); // initial: populate without announcing history
        const timer = setInterval(() => load(true), POLL_MS);

        const onVisible = () => {
            if (!document.hidden) {
                stopTitleFlash();
                const queued = pendingToastRef.current.splice(0);
                queued.forEach(n => {
                    if (n.type === 'job_failed') showToast.error(n.title, n.body);
                    else showToast.success(n.title, n.body);
                });
            }
        };
        document.addEventListener('visibilitychange', onVisible);
        return () => {
            clearInterval(timer);
            document.removeEventListener('visibilitychange', onVisible);
            stopTitleFlash();
        };
    }, [load, stopTitleFlash]);

    const markAllRead = useCallback(async () => {
        setUnreadCount(0);
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        try { await axiosInstance.post('/api/v1/me/notifications/read-all'); } catch { /* optimistic */ }
    }, []);

    return { notifications, unreadCount, markAllRead, refresh: () => load(true) };
};
