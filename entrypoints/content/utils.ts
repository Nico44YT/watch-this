// Re-export types from central location
export type { RecommendationWithMeta, OEmbedData } from "../../types";

// Re-export from shared library
export {
	extractVideoId,
	fetchVideoMetadata,
	secondsToMmSs,
	mmSsToSeconds,
	extractTimestampFromUrl,
} from "../../lib/youtube";

// Send message to background script
export async function sendMessage(message: any): Promise<any> {
	return browser.runtime.sendMessage(message);
}

// Check if we're on YouTube homepage
export function isYouTubeHomepage(): boolean {
	return (
		window.location.pathname === "/" ||
		window.location.pathname === "/feed/subscriptions"
	);
}

// Check if we're on a YouTube video page
export function isYouTubeVideoPage(): boolean {
	return (
		window.location.pathname === "/watch" &&
		window.location.search.includes("v=")
	);
}
