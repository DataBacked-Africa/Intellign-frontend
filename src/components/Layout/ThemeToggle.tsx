'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';

/** Sun/moon toggle. Initial value comes from the no-FOUC script in layout.tsx
 *  (localStorage → prefers-color-scheme); useTheme keeps every instance in sync. */
export const ThemeToggle: React.FC = () => {
    const { isDark, toggle } = useTheme();

    return (
        <button
            onClick={toggle}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            title={isDark ? 'Light mode' : 'Dark mode'}
            className="flex items-center justify-center w-9 h-9 rounded-lg transition-colors cursor-pointer"
            style={{ color: 'var(--fg-secondary)' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--brand-bone-deep)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
            {isDark
                ? <Sun style={{ width: 18, height: 18 }} />
                : <Moon style={{ width: 18, height: 18 }} />}
        </button>
    );
};

export default ThemeToggle;
