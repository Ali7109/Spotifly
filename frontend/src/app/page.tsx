"use client";

import { useAuth } from "./context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
	const { login, user, isLoading } = useAuth();
	const router = useRouter();

	useEffect(() => {
		if (!isLoading && user) router.push("/dashboard");
	}, [user, isLoading, router]);

	if (isLoading) {
		return <div className="min-h-screen bg-white dark:bg-black"></div>;
	}

	return (
		<main className="min-h-screen bg-white dark:bg-black transition-colors duration-300">
			<div className="flex flex-col items-center justify-center h-screen w-full bg-red-400 dark:bg-black dark:text-red-400 transition-all duration-300">
				<h1 className="text-8xl font-bold text-black dark:text-red-400">
					SPOTI<span className="text-white dark:text-white">FLY</span>
				</h1>
				<h3 className="text-2xl font-bold text-black dark:text-red-400">
					your yearly wrap now available daily...
				</h3>
				<button
					onClick={login}
					className="mt-4 bg-black text-white px-4 py-2 rounded-full cursor-pointer hover:bg-white hover:text-black dark:bg-red-400 dark:text-black dark:hover:bg-black dark:hover:text-red-400 transition-all duration-300"
				>
					Get started
				</button>
			</div>
		</main>
	);
}
