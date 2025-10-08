// app/components/TimeRangeSelector.tsx
"use client";

interface TimeRangeSelectorProps {
	timeRange: string;
	onTimeRangeChange: (range: string) => void;
}

export default function TimeRangeSelector({
	timeRange,
	onTimeRangeChange,
}: TimeRangeSelectorProps) {
	const ranges = [
		{ value: "short_term", label: "Last 4 Weeks" },
		{ value: "medium_term", label: "Last 6 Months" },
		{ value: "long_term", label: "All Time" },
	];

	return (
		<div className="flex gap-2 mb-6">
			{ranges.map((range) => (
				<button
					key={range.value}
					onClick={() => onTimeRangeChange(range.value)}
					className={`px-4 py-2 rounded-full transition-all ${
						timeRange === range.value
							? "bg-red-400 text-white"
							: "bg-gray-200 dark:bg-gray-800 text-black dark:text-white hover:bg-gray-300 dark:hover:bg-gray-700"
					}`}
				>
					{range.label}
				</button>
			))}
		</div>
	);
}
