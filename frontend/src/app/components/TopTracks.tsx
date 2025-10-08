// app/components/TopTracks.tsx
"use client";

export interface Track {
	id: string;
	name: string;
	artists: { name: string }[];
	album?: {
		images?: { url: string }[];
	};
}

interface TopTracksProps {
	tracks: Track[];
}

export default function TopTracks({ tracks }: TopTracksProps) {
	return (
		<div>
			<h2 className="text-2xl font-bold text-black dark:text-white mb-4">
				Your Top Tracks
			</h2>
			<div className="space-y-3">
				{tracks.length === 0 ? (
					<p className="text-gray-600 dark:text-gray-400">
						No tracks found
					</p>
				) : (
					tracks.map((track, index) => (
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
										?.map((a) => a.name)
										.join(", ")}
								</p>
							</div>
						</div>
					))
				)}
			</div>
		</div>
	);
}
