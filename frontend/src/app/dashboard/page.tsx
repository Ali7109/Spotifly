"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";

export default function Dashboard() {
	const { user, accessToken, logout, isLoading } = useAuth();
	const [profile, setProfile] = useState<any>(null);
	const [topTracks, setTopTracks] = useState<any[]>([]);
	const [topArtists, setTopArtists] = useState<any[]>([]);
	const [timeRange, setTimeRange] = useState("short_term");
	const [loading, setLoading] = useState(true);
	const router = useRouter();

	useEffect(() => {
		if (!isLoading && !accessToken) {
			router.push("/");
			return;
		}

		const fetchData = async () => {
			if (!accessToken) return;

			try {
				const profileRes = await fetch(
					"http://localhost:8080/spotify/profile",
					{
						headers: { Authorization: `Bearer ${accessToken}` },
					}
				);
				if (profileRes.ok) setProfile(await profileRes.json());

				const tracksRes = await fetch(
					`http://localhost:8080/spotify/top-tracks?time_range=${timeRange}&limit=10`,
					{
						headers: { Authorization: `Bearer ${accessToken}` },
					}
				);
				if (tracksRes.ok)
					setTopTracks((await tracksRes.json()).items || []);

				const artistsRes = await fetch(
					`http://localhost:8080/spotify/top-artists?time_range=${timeRange}&limit=10`,
					{
						headers: { Authorization: `Bearer ${accessToken}` },
					}
				);
				if (artistsRes.ok)
					setTopArtists((await artistsRes.json()).items || []);

				setLoading(false);
			} catch (error) {
				console.error("Error fetching data:", error);
				setLoading(false);
			}
		};

		fetchData();
	}, [accessToken, isLoading, router, timeRange]);

	if (isLoading || loading) {
		return (
			<div className="min-h-screen bg-white dark:bg-black flex items-center justify-center">
				<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-400"></div>
			</div>
		);
	}

	return (
		<main className="min-h-screen bg-white dark:bg-black p-8">
			<div className="max-w-6xl mx-auto">
				{/* Header */}
				<div className="flex justify-between items-center mb-8">
					<h1 className="text-4xl font-bold text-black dark:text-red-400">
						SPOTI
						<span className="text-gray-600 dark:text-white">
							FLY
						</span>
					</h1>
					<button
						onClick={logout}
						className="bg-red-400 text-white px-6 py-2 rounded-full hover:bg-red-500 transition-all"
					>
						Logout
					</button>
				</div>

				{/* Profile Card */}
				{profile && (
					<div className="bg-gray-100 dark:bg-gray-900 rounded-lg p-6 mb-8">
						<div className="flex items-center space-x-4">
							{profile.images?.[0] ? (
								<img
									src={profile.images[0].url}
									alt={profile.display_name}
									className="w-24 h-24 rounded-full"
								/>
							) : (
								<div className="w-24 h-24 rounded-full bg-red-400 flex items-center justify-center text-white text-3xl font-bold">
									{profile.display_name?.[0] || "?"}
								</div>
							)}
							<div>
								<h2 className="text-2xl font-bold text-black dark:text-white">
									{profile.display_name}
								</h2>
								<p className="text-gray-600 dark:text-gray-400">
									{profile.email}
								</p>
								<p className="text-gray-600 dark:text-gray-400">
									Followers: {profile.followers?.total || 0}
								</p>
							</div>
						</div>
					</div>
				)}

				{/* Time Range Selector */}
				<div className="flex gap-2 mb-6">
					{["short_term", "medium_term", "long_term"].map((range) => (
						<button
							key={range}
							onClick={() => setTimeRange(range)}
							className={`px-4 py-2 rounded-full transition-all ${
								timeRange === range
									? "bg-red-400 text-white"
									: "bg-gray-200 dark:bg-gray-800 text-black dark:text-white"
							}`}
						>
							{range === "short_term"
								? "Last 4 Weeks"
								: range === "medium_term"
								? "Last 6 Months"
								: "All Time"}
						</button>
					))}
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
					{/* Top Tracks */}
					<div>
						<h2 className="text-2xl font-bold text-black dark:text-white mb-4">
							Your Top Tracks
						</h2>
						<div className="space-y-3">
							{topTracks.map((track, index) => (
								<div
									key={track.id}
									className="bg-gray-100 dark:bg-gray-900 rounded-lg p-4 flex items-center space-x-4 hover:bg-gray-200 dark:hover:bg-gray-800 transition-all"
								>
									<span className="text-2xl font-bold text-gray-400 w-8">
										{index + 1}
									</span>
									{track.album?.images?.[2] && (
										<img
											src={track.album.images[2].url}
											alt={track.name}
											className="w-12 h-12 rounded"
										/>
									)}
									<div className="flex-1 min-w-0">
										<p className="font-semibold text-black dark:text-white truncate">
											{track.name}
										</p>
										<p className="text-sm text-gray-600 dark:text-gray-400 truncate">
											{track.artists
												?.map((a: any) => a.name)
												.join(", ")}
										</p>
									</div>
								</div>
							))}
						</div>
					</div>

					{/* Top Artists */}
					<div>
						<h2 className="text-2xl font-bold text-black dark:text-white mb-4">
							Your Top Artists
						</h2>
						<div className="space-y-3">
							{topArtists.map((artist, index) => (
								<div
									key={artist.id}
									className="bg-gray-100 dark:bg-gray-900 rounded-lg p-4 flex items-center space-x-4 hover:bg-gray-200 dark:hover:bg-gray-800 transition-all"
								>
									<span className="text-2xl font-bold text-gray-400 w-8">
										{index + 1}
									</span>
									{artist.images?.[2] ? (
										<img
											src={artist.images[2].url}
											alt={artist.name}
											className="w-12 h-12 rounded-full"
										/>
									) : (
										<div className="w-12 h-12 rounded-full bg-red-400 flex items-center justify-center text-white font-bold">
											{artist.name?.[0]}
										</div>
									)}
									<div className="flex-1 min-w-0">
										<p className="font-semibold text-black dark:text-white truncate">
											{artist.name}
										</p>
										<p className="text-sm text-gray-600 dark:text-gray-400">
											{artist.followers?.total.toLocaleString()}{" "}
											followers
										</p>
									</div>
								</div>
							))}
						</div>
					</div>
				</div>
			</div>
		</main>
	);
}
