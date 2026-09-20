import React from 'react';
import { HiSun, HiMoon } from 'react-icons/hi2';
import { useTheme } from '../contexts/ThemeContext';

interface ThemeToggleProps {
    className?: string;
    showLabel?: boolean;
    compact?: boolean;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({
    className = '',
    showLabel = false,
    compact = false
}) => {
    const { theme, toggleTheme, isDark } = useTheme();

    return (
        <button
            type="button"
            onClick={toggleTheme}
            aria-label={isDark ? 'Chuyển sang chế độ sáng' : 'Chuyển sang chế độ tối'}
            title={isDark ? 'Chuyển sang Giao diện Sáng (Light Mode)' : 'Chuyển sang Giao diện Tối (Dark Mode)'}
            className={`group relative flex items-center justify-center transition-all duration-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/40 select-none ${
                compact
                    ? 'w-9 h-9 p-1.5'
                    : 'px-3 py-2 gap-2 text-xs font-semibold'
            } ${
                isDark
                    ? 'bg-slate-800/80 hover:bg-slate-750 text-amber-300 border border-slate-700/80 shadow-sm shadow-black/20 hover:border-amber-400/40 hover:text-amber-200'
                    : 'bg-white hover:bg-slate-50 text-indigo-600 border border-slate-200 shadow-sm hover:border-indigo-300 hover:text-indigo-700'
            } ${className}`}
        >
            <div className="relative w-5 h-5 flex items-center justify-center">
                {isDark ? (
                    <HiSun className="w-5 h-5 transition-transform duration-300 group-hover:rotate-45 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]" />
                ) : (
                    <HiMoon className="w-4 h-4 transition-transform duration-300 group-hover:-rotate-12 text-indigo-600 drop-shadow-[0_0_6px_rgba(79,70,229,0.3)]" />
                )}
            </div>

            {showLabel && (
                <span className="font-medium tracking-wide">
                    {isDark ? 'Giao diện Tối' : 'Giao diện Sáng'}
                </span>
            )}
        </button>
    );
};

export default ThemeToggle;
