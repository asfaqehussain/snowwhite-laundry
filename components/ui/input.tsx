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
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        {label}
                    </label>
                )}
                <div className="relative rounded-md shadow-sm">
                    <input
                        ref={ref}
                        className={clsx(
                            "block w-full rounded-md border-gray-300 focus:border-brand-500 focus:ring-brand-500 sm:text-sm px-3 py-2 border",
                            error && "border-red-300 text-red-900 placeholder-red-300",
                            !error && "border-gray-300",
                            className
                        )}
                        {...props}
                    />
                </div>
                {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
            </div>
        );
    }
);
Input.displayName = 'Input';
