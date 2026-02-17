import Link from 'next/link';
import { ShieldExclamationIcon } from '@heroicons/react/24/outline';

export default function UnauthorizedPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 text-center">
                <div>
                    <ShieldExclamationIcon className="mx-auto h-16 w-16 text-red-500" />
                    <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                        Access Denied
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        You do not have permission to view this page.
                    </p>
                </div>
                <div className="mt-5">
                    <Link
                        href="/login"
                        className="font-medium text-brand-600 hover:text-brand-500"
                    >
                        Return to Login
                    </Link>
                </div>
            </div>
        </div>
    );
}
