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
