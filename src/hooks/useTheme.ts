'use client';

import { useState, useEffect, useCallback } from 'react';

export type Theme = 'light' | 'dark';

const THEME_EVENT = 'intellign:themechange';

/** Set the theme on <html> with a brief global transition so surfaces
 *  cross-fade instead of snapping. */
const applyTheme = (t: Theme) => {
    const root = document.documentElement;
    root.classList.add('theme-switching');
    root.dataset.theme = t;
    window.setTimeout(() => root.classList.remove('theme-switching'), 350);
};

/**
 * Single source of truth for the colour theme.
 *
 * Resolution order (initial value comes from the no-FOUC script in layout.tsx):
 *   1. Explicit user choice (localStorage 'theme') — set via setTheme/toggle.
 *   2. OS preference (prefers-color-scheme), followed live until the user
 *      makes an explicit choice.
 *
 * All hook instances stay in sync within a tab (custom event) and across
 * tabs (storage event).
 */
export function useTheme() {
    const [theme, setThemeState] = useState<Theme>('light');

    useEffect(() => {
        setThemeState((document.documentElement.dataset.theme as Theme) || 'light');

        // Follow OS preference while the user hasn't chosen explicitly.
        const mq = window.matchMedia('(prefers-color-scheme: dark)');
        const onSystem = (e: MediaQueryListEvent) => {
            try { if (localStorage.getItem('theme')) return; } catch { /* private mode */ }
            const next: Theme = e.matches ? 'dark' : 'light';
            applyTheme(next);
            window.dispatchEvent(new CustomEvent(THEME_EVENT, { detail: next }));
        };
        mq.addEventListener('change', onSystem);

        // Same-tab sync between hook instances.
        const onLocal = (e: Event) => setThemeState((e as CustomEvent<Theme>).detail);
        window.addEventListener(THEME_EVENT, onLocal);

        // Cross-tab sync.
        const onStorage = (e: StorageEvent) => {
            if (e.key !== 'theme' || (e.newValue !== 'light' && e.newValue !== 'dark')) return;
            applyTheme(e.newValue as Theme);
            setThemeState(e.newValue as Theme);
        };
        window.addEventListener('storage', onStorage);

        return () => {
            mq.removeEventListener('change', onSystem);
            window.removeEventListener(THEME_EVENT, onLocal);
            window.removeEventListener('storage', onStorage);
        };
    }, []);

    const setTheme = useCallback((t: Theme) => {
        try { localStorage.setItem('theme', t); } catch { /* private mode */ }
        applyTheme(t);
        setThemeState(t);
        window.dispatchEvent(new CustomEvent(THEME_EVENT, { detail: t }));
    }, []);

    const toggle = useCallback(
        () => setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'),
        [setTheme],
    );

    return { theme, isDark: theme === 'dark', setTheme, toggle };
}
