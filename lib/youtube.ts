import type { OEmbedData } from "../types";

// Re-export for convenience
export type { OEmbedData };

// Extract video ID from YouTube URL
export function extractVideoId(url: string): string | null {
	// Handle watch?v= format
	const watchMatch = url.match(/[?&]v=([a-zA-Z0-9_-]+)/);
	if (watchMatch) return watchMatch[1];

	// Handle shorts/ format
	const shortsMatch = url.match(/\/shorts\/([a-zA-Z0-9_-]+)/);
	if (shortsMatch) return shortsMatch[1];

	return null;
}

// Get high-quality thumbnail URL from video ID
export function getThumbnailUrl(videoId: string): string {
	// mqdefault is 320x180, good balance of quality and size
	return `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`;
}

// Convert total seconds to mm:ss display string (e.g. 203 → "3:23")
export function secondsToMmSs(totalSeconds: number): string {
	const m = Math.floor(totalSeconds / 60);
	const s = totalSeconds % 60;
	return `${m}:${s.toString().padStart(2, "0")}`;
}

// Parse a mm:ss string back to total seconds. Returns null if the format is invalid.
export function mmSsToSeconds(mmss: string): number | null {
	const parts = mmss.split(":");
	if (parts.length !== 2) return null;
	const m = parseInt(parts[0], 10);
	const s = parseInt(parts[1], 10);
	if (isNaN(m) || isNaN(s) || m < 0 || s < 0 || s >= 60) return null;
	return m * 60 + s;
}

// Extract the `t` timestamp parameter (in seconds) from a YouTube URL.
// Returns null if no timestamp is present or the value cannot be parsed.
export function extractTimestampFromUrl(url: string): number | null {
	try {
		const parsed = new URL(url);
		const raw = parsed.searchParams.get("t");
		if (!raw) return null;
		// YouTube accepts both plain numbers and numbers with an "s" suffix
		const seconds = parseInt(raw.replace(/s$/i, ""), 10);
		if (isNaN(seconds) || seconds <= 0) return null;
		return seconds;
	} catch {
		return null;
	}
}

// Fetch video metadata from YouTube oEmbed API
export async function fetchVideoMetadata(
	url: string,
): Promise<OEmbedData | null> {
	try {
		const response = await fetch(
			`https://www.youtube.com/oembed?url=${encodeURIComponent(
				url,
			)}&format=json`,
		);
		if (!response.ok) return null;
		return await response.json();
	} catch (error) {
		return null;
	}
}
