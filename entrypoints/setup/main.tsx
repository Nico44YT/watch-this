import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom/client";
import "../popup/style.css";
import { getAuthState, needsOnboarding } from "../../lib/auth";
import { browserAPI } from "../../lib/browser";

function SetupPage() {
	const [loading, setLoading] = useState(true);
	const [success, setSuccess] = useState(false);

	useEffect(() => {
		checkAuth();
	}, []);

	const checkAuth = async () => {
		try {
			const authState = await getAuthState();
			if (authState.isAuthenticated && authState.user) {
				// If user needs onboarding, redirect to auth page
				if (needsOnboarding(authState.user)) {
					browserAPI.tabs.create({
						url: browserAPI.runtime.getURL("/auth.html"),
						active: true,
					});
					window.close();
					return;
				}
				// User is fully set up, show success and close
				setSuccess(true);
				setTimeout(() => window.close(), 2000);
			} else {
				// Not authenticated, redirect to auth page
				browserAPI.tabs.create({
					url: browserAPI.runtime.getURL("/auth.html"),
					active: true,
				});
				window.close();
			}
		} catch (error) {
			console.error("Auth check failed:", error);
		} finally {
			setLoading(false);
		}
	};

	if (loading) {
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center">
				<div className="text-gray-600">Loading...</div>
			</div>
		);
	}

	if (success) {
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center">
				<div className="bg-white p-8 rounded-2xl shadow-lg text-center max-w-md">
					<div className="text-5xl mb-4">🎉</div>
					<h1 className="text-2xl font-bold text-gray-800 mb-2">
						You're all set!
					</h1>
					<p className="text-gray-600">
						This tab will close automatically. You can now use WatchThis! from
						the extension icon.
					</p>
				</div>
			</div>
		);
	}

	// Fallback - redirect to auth
	return (
		<div className="min-h-screen bg-gray-50 flex items-center justify-center">
			<div className="text-gray-600">Redirecting...</div>
		</div>
	);
}

ReactDOM.createRoot(document.getElementById("root")!).render(
	<React.StrictMode>
		<SetupPage />
	</React.StrictMode>,
);
