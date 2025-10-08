// app/components/ProfileCard.tsx
"use client";

export interface Profile {
	display_name: string;
	email: string;
	images?: { url: string }[];
	followers?: { total: number };
}

interface ProfileCardProps {
	profile: Profile;
}

export default function ProfileCard({ profile }: ProfileCardProps) {
	return (
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
	);
}
