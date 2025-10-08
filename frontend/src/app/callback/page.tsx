"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function CallbackPage() {
	const router = useRouter();
	const searchParams = useSearchParams();

	useEffect(() => {
		const handleCallback = () => {
			const accessToken = searchParams.get("access_token");
			const refreshToken = searchParams.get("refresh_token");
			const userStr = searchParams.get("user");
			const error = searchParams.get("error");

			if (error) {
				console.error("Authentication error:", error);
				router.push("/");
				return;
			}

			if (!accessToken || !refreshToken || !userStr) {
				console.error("Missing authentication data");
				router.push("/");
				return;
			}

			try {
				const user = JSON.parse(decodeURIComponent(userStr));

				localStorage.setItem("spotify_access_token", accessToken);
				localStorage.setItem("spotify_refresh_token", refreshToken);
				localStorage.setItem("spotify_user", JSON.stringify(user));

				router.push("/dashboard");
			} catch (error) {
				console.error("Error parsing user data:", error);
				router.push("/");
			}
		};

		handleCallback();
	}, [searchParams, router]);

	return (
		<div className="min-h-screen bg-white dark:bg-black flex items-center justify-center">
			<div className="text-center">
				<h1 className="text-4xl font-bold text-black dark:text-red-400 mb-4">
					Logging you in...
				</h1>
				<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-400 mx-auto"></div>
			</div>
		</div>
	);
}
