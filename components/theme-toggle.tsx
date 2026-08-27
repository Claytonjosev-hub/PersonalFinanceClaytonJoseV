'use client';

import { useEffect, useState } from 'react';

type ThemeChoice = 'light' | 'dark' | 'system';

function applyTheme(choice: ThemeChoice) {
  const isDark =
    choice === 'dark' ||
    (choice === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.classList.toggle('dark', isDark);
}

export function ThemeToggle() {
  const [choice, setChoice] = useState<ThemeChoice>('system');

  useEffect(() => {
    const stored = (localStorage.getItem('theme') as ThemeChoice | null) ?? 'system';
    setChoice(stored);
  }, []);

  function selectTheme(next: ThemeChoice) {
    setChoice(next);
    localStorage.setItem('theme', next);
    applyTheme(next);
  }

  const options: { value: ThemeChoice; label: string }[] = [
    { value: 'light', label: 'Claro' },
    { value: 'system', label: 'Sistema' },
    { value: 'dark', label: 'Escuro' },
  ];

  return (
    <div className="flex gap-1 rounded-full border border-border bg-surface p-1 text-sm">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => selectTheme(option.value)}
          aria-pressed={choice === option.value}
          className={
            'rounded-full px-3 py-1 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 ' +
            (choice === option.value ? 'bg-accent text-accent-foreground shadow-soft' : 'text-fg/60 hover:bg-muted hover:text-fg')
          }
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
