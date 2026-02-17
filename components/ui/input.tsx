import { InputHTMLAttributes, forwardRef } from 'react';
import clsx from 'clsx';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ className, label, error, ...props }, ref) => {
        return (
            <div className="w-full">
                {label && (
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">
                        {label}
                    </label>
                )}
                <div className="relative">
                    <input
                        ref={ref}
                        className={clsx(
                            "block w-full rounded-xl border-gray-200 bg-gray-50/50 text-gray-900 focus:bg-white transition-all duration-200",
                            "focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 sm:text-sm px-4 py-3",
                            error ? "border-red-300 focus:border-red-500 focus:ring-red-200" : "border-gray-200",
                            className
                        )}
                        {...props}
                    />
                </div>
                {error && <p className="mt-1.5 text-xs text-red-600 font-medium ml-1">{error}</p>}
            </div>
        );
    }
);
Input.displayName = 'Input';
