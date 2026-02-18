/**
 * Validate a username against PocketBase constraints.
 * Allowed characters: letters, numbers, underscores, hyphens (^[a-zA-Z0-9_-]+$)
 */
export function validateUsername(username: string): {
	valid: boolean;
	error?: string;
} {
	if (!username || username.trim().length === 0) {
		return { valid: false, error: "Username cannot be empty" };
	}
	if (username.length < 3 || username.length > 150) {
		return { valid: false, error: "Username must be 3–150 characters" };
	}
	if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
		return {
			valid: false,
			error: "Username can only contain letters, numbers, _ and -",
		};
	}
	return { valid: true };
}

/**
 * Sanitize a YouTube URL by stripping all query parameters except `v`.
 * Returns null when the URL is not a valid youtube.com URL.
 */
export function sanitizeYouTubeUrl(url: string): string | null {
	try {
		const parsed = new URL(url);
		if (!parsed.hostname.endsWith("youtube.com")) {
			return null;
		}
		// Shorts URLs have no `v` param — keep the path, strip all query params
		if (parsed.pathname.includes("/shorts/")) {
			parsed.search = "";
			return parsed.toString();
		}
		const videoId = parsed.searchParams.get("v");
		if (!videoId) {
			return null;
		}
		parsed.search = `?v=${encodeURIComponent(videoId)}`;
		return parsed.toString();
	} catch {
		return null;
	}
}
