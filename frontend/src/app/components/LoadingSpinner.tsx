// app/components/LoadingSpinner.tsx
"use client";

export default function LoadingSpinner() {
	return (
		<div className="min-h-screen bg-white dark:bg-black flex items-center justify-center">
			<div className="text-center">
				<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-400 mx-auto"></div>
				<p className="mt-4 text-gray-600 dark:text-gray-400">
					Loading your music...
				</p>
			</div>
		</div>
	);
}
