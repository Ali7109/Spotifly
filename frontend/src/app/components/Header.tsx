// app/components/Header.tsx
"use client";

interface HeaderProps {
	onLogout: () => void;
}

export default function Header({ onLogout }: HeaderProps) {
	return (
		<div className="flex justify-between items-center mb-8">
			<h1 className="text-4xl font-bold text-black dark:text-red-400">
				SPOTI<span className="text-gray-600 dark:text-white">FLY</span>
			</h1>
			<button
				onClick={onLogout}
				className="bg-red-400 text-white px-6 py-2 rounded-full hover:bg-red-500 transition-all"
			>
				Logout
			</button>
		</div>
	);
}
