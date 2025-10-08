// app/dashboard/page.tsx - REFACTORED
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import Header from "../components/Header";
import ProfileCard, { Profile } from "../components/ProfileCard";
import TimeRangeSelector from "../components/TimeRangeSelector";
import TopTracks, { Track } from "../components/TopTracks";
import TopArtists, { Artist } from "../components/TopArtists";
import LoadingSpinner from "../components/LoadingSpinner";

export default function Dashboard() {
	const { accessToken, logout, isLoading } = useAuth();
	const [profile, setProfile] = useState<Profile | null>(null);
	const [topTracks, setTopTracks] = useState<Track[]>([]);
	const [topArtists, setTopArtists] = useState<Artist[]>([]);
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
				// Fetch profile
				const profileRes = await fetch(
					"http://localhost:8080/spotify/profile",
					{
						headers: { Authorization: `Bearer ${accessToken}` },
					}
				);
				if (profileRes.ok) {
					setProfile(await profileRes.json());
				}

				// Fetch top tracks
				const tracksRes = await fetch(
					`http://localhost:8080/spotify/top-tracks?time_range=${timeRange}&limit=10`,
					{ headers: { Authorization: `Bearer ${accessToken}` } }
				);
				if (tracksRes.ok) {
					const data = await tracksRes.json();
					setTopTracks(data.items || []);
				}

				// Fetch top artists
				const artistsRes = await fetch(
					`http://localhost:8080/spotify/top-artists?time_range=${timeRange}&limit=10`,
					{ headers: { Authorization: `Bearer ${accessToken}` } }
				);
				if (artistsRes.ok) {
					const data = await artistsRes.json();
					setTopArtists(data.items || []);
				}

				setLoading(false);
			} catch (error) {
				console.error("Error fetching data:", error);
				setLoading(false);
			}
		};

		fetchData();
	}, [accessToken, isLoading, router, timeRange]);

	if (isLoading || loading) {
		return <LoadingSpinner />;
	}

	return (
		<main className="min-h-screen bg-white dark:bg-black p-8">
			<div className="max-w-6xl mx-auto">
				<Header onLogout={logout} />

				{profile && <ProfileCard profile={profile} />}

				<TimeRangeSelector
					timeRange={timeRange}
					onTimeRangeChange={setTimeRange}
				/>

				<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
					<TopTracks tracks={topTracks} />
					<TopArtists artists={topArtists} />
				</div>
			</div>
		</main>
	);
}
