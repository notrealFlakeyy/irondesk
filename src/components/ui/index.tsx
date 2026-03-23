'use client';

import { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

type BadgeVariant = 'green' | 'amber' | 'red' | 'blue' | 'gray' | 'trade';

const badgeStyles: Record<BadgeVariant, string> = {
  green: 'border-[#365f49] bg-[#15231b] text-[#7bc196]',
  amber: 'border-[#7d5817] bg-[#261d10] text-[#efb548]',
  red: 'border-[#6c3030] bg-[#251313] text-[#ef7676]',
  blue: 'border-[#355577] bg-[#131b24] text-[#79a9df]',
  gray: 'border-[var(--border2)] bg-[var(--bg4)] text-[var(--text2)]',
  trade: 'border-[#355577] bg-[#111b27] text-[#9dc2ed]',
};

export function Badge({
  variant = 'gray',
  children,
  className,
}: {
  variant?: BadgeVariant;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-sm border px-2 py-0.5 font-mono-iron text-[10px] uppercase tracking-[0.16em]',
        badgeStyles[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}

type BtnVariant = 'default' | 'primary' | 'danger' | 'success';

const btnStyles: Record<BtnVariant, string> = {
  default:
    'border-[var(--border2)] bg-[var(--bg4)] text-[var(--text2)] hover:border-[var(--text3)] hover:bg-[var(--bg5)] hover:text-[var(--text)]',
  primary:
    'border-[var(--accent)] bg-[var(--accent)] text-[var(--bg)] hover:border-[#f3ad36] hover:bg-[#f3ad36]',
  danger: 'border-[#6c3030] bg-[#251313] text-[#ef7676] hover:border-[#904545] hover:bg-[#321818]',
  success: 'border-[#365f49] bg-[#15231b] text-[#7bc196] hover:border-[#4a7f61] hover:bg-[#1a2b21]',
};

interface BtnProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: BtnVariant;
  size?: 'sm' | 'md';
}

export function Btn({ variant = 'default', size = 'md', className, children, ...props }: BtnProps) {
  return (
    <button
      type={props.type ?? 'button'}
      {...props}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-sm border font-display font-semibold uppercase tracking-[0.12em] transition-colors whitespace-nowrap',
        size === 'sm' ? 'min-h-8 px-3 text-[11px]' : 'min-h-9 px-3.5 text-[13px]',
        props.disabled && 'cursor-not-allowed opacity-50',
        !props.disabled && 'cursor-pointer',
        btnStyles[variant],
        className,
      )}
    >
      {children}
    </button>
  );
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        'h-9 rounded-sm border border-[var(--border2)] bg-[var(--bg3)] px-3 font-mono-iron text-[13px] text-[var(--text)] outline-none transition-colors placeholder:text-[var(--text3)] focus:border-[var(--accent)]',
        className,
      )}
    />
  );
}

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={cn(
        'h-9 rounded-sm border border-[var(--border2)] bg-[var(--bg3)] px-3 font-mono-iron text-[12px] text-[var(--text)] outline-none transition-colors focus:border-[var(--accent)]',
        className,
      )}
    />
  );
}

export function Toggle({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onChange}
      className={cn(
        'relative h-[22px] w-10 rounded-full border transition-colors',
        on ? 'border-[var(--accent)] bg-[var(--accent)]' : 'border-[var(--border2)] bg-[var(--bg4)]',
      )}
    >
      <span
        className={cn(
          'absolute left-[3px] top-[3px] h-4 w-4 rounded-full transition-transform',
          on ? 'translate-x-[18px] bg-[var(--bg)]' : 'translate-x-0 bg-[var(--text2)]',
        )}
      />
    </button>
  );
}

export function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={cn('rounded-sm border bg-[var(--bg2)]', className)}>{children}</section>;
}

export function PanelHeader({
  title,
  children,
  subtitle,
}: {
  title: string;
  children?: ReactNode;
  subtitle?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b px-4 py-3">
      <div>
        <div className="font-display text-[13px] font-semibold uppercase tracking-[0.12em] text-[var(--text)]">
          {title}
        </div>
        {subtitle ? (
          <div className="mt-1 font-mono-iron text-[10px] uppercase tracking-[0.14em] text-[var(--text3)]">
            {subtitle}
          </div>
        ) : null}
      </div>
      {children ? <div className="flex items-center gap-2">{children}</div> : null}
    </div>
  );
}

export function Table({
  headers,
  children,
  className,
}: {
  headers: string[];
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('overflow-x-auto', className)}>
      <table className="w-full border-collapse">
        <thead>
          <tr>
            {headers.map((header) => (
              <th
                key={header}
                className="whitespace-nowrap border-b bg-[var(--bg3)] px-4 py-2 text-left font-mono-iron text-[10px] uppercase tracking-[0.18em] text-[var(--text3)]"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export function TR({
  children,
  onClick,
  selected,
}: {
  children: ReactNode;
  onClick?: () => void;
  selected?: boolean;
}) {
  return (
    <tr
      onClick={onClick}
      className={cn(
        'border-b transition-colors',
        onClick ? 'cursor-pointer' : '',
        selected ? 'bg-[rgba(232,160,32,0.10)]' : 'hover:bg-[var(--bg3)]',
      )}
    >
      {children}
    </tr>
  );
}

export function TD({ children, className }: { children: ReactNode; className?: string }) {
  return <td className={cn('px-4 py-2.5 text-[13px] text-[var(--text2)]', className)}>{children}</td>;
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="px-[18px] py-2 font-mono-iron text-[9px] uppercase tracking-[0.2em] text-[var(--text3)]">
      {children}
    </div>
  );
}

export function Mono({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn('font-mono-iron', className)}>{children}</span>;
}
