import clsx from 'clsx';

interface CardProps {
    children: React.ReactNode;
    className?: string;
    noPadding?: boolean;
}

export function Card({ children, className, noPadding = false }: CardProps) {
    return (
        <div className={clsx(
            "bg-white rounded-2xl border border-gray-100 card-shadow transition-shadow duration-300 hover:card-shadow-hover overflow-hidden",
            !noPadding && "p-6",
            className
        )}>
            {children}
        </div>
    );
}
