import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom/client";
import "./style.css";
import Dashboard from "./components/Dashboard";
import { getAuthState, needsOnboarding } from "../../lib/auth";
import { browserAPI } from "../../lib/browser";
import type { User } from "../../types";

function App() {
	const [user, setUser] = useState<User | null>(null);
	const [loading, setLoading] = useState(true);

	const openAuthPage = () => {
		browserAPI.tabs.create({
			url: browserAPI.runtime.getURL("/auth.html"),
			active: true,
		});
		window.close();
	};

	// Check authentication status on mount
	useEffect(() => {
		checkAuth();
	}, []);

	const checkAuth = async () => {
		setLoading(true);
		try {
			const authState = await getAuthState();
			if (authState.isAuthenticated && authState.user) {
				// If user needs onboarding, redirect to auth page
				if (needsOnboarding(authState.user)) {
					openAuthPage();
					return;
				}
				setUser(authState.user);
			}
		} catch (error) {
			console.error("Auth check failed:", error);
		} finally {
			setLoading(false);
		}
	};

	const handleLogout = () => {
		setUser(null);
	};

	if (loading) {
		return (
			<div className="w-80 p-6 flex items-center justify-center">
				<div className="text-gray-600">Loading...</div>
			</div>
		);
	}

	// Not logged in - show login prompt
	if (!user) {
		return (
			<div className="w-80 p-6">
				<div className="flex items-center gap-2 mb-6">
					<img src="/icon/128.png" alt="WatchThis" className="w-8 h-8" />
					<h1 className="text-2xl font-bold text-gray-800">
						<span className="text-primary-500">Watch</span>This
					</h1>
				</div>

				<p className="text-sm text-gray-600 mb-4">
					Share YouTube videos with your friends and discover new content
					together.
				</p>

				<button
					onClick={openAuthPage}
					className="w-full bg-primary-500 hover:bg-primary-600 text-white font-medium py-3 px-4 rounded-lg transition-colors"
				>
					Login / Sign Up
				</button>
			</div>
		);
	}

	// Logged in
	return <Dashboard user={user} onLogout={handleLogout} />;
}

ReactDOM.createRoot(document.getElementById("root")!).render(
	<React.StrictMode>
		<App />
	</React.StrictMode>,
);
