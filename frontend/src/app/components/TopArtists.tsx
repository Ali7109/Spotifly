// app/components/TopArtists.tsx
"use client";

export interface Artist {
	id: string;
	name: string;
	images?: { url: string }[];
	followers?: { total: number };
}

interface TopArtistsProps {
	artists: Artist[];
}

export default function TopArtists({ artists }: TopArtistsProps) {
	return (
		<div>
			<h2 className="text-2xl font-bold text-black dark:text-white mb-4">
				Your Top Artists
			</h2>
			<div className="space-y-3">
				{artists.length === 0 ? (
					<p className="text-gray-600 dark:text-gray-400">
						No artists found
					</p>
				) : (
					artists.map((artist, index) => (
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
					))
				)}
			</div>
		</div>
	);
}
