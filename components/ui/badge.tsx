import clsx from 'clsx';

interface BadgeProps {
    children: React.ReactNode;
    variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
    className?: string;
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
    const variants = {
        default: "bg-gray-100 text-gray-700",
        success: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20",
        warning: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20",
        error: "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-600/10",
        info: "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-700/10"
    };

    return (
        <span className={clsx(
            "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
            variants[variant],
            className
        )}>
            {children}
        </span>
    );
}
