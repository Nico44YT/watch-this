import React, { useState } from "react";
import { updateUsername } from "../../../lib/auth";
import { validateUsername } from "../../../lib/validation";
import type { User } from "../../../types";

interface UsernameSetupProps {
	user: User;
	onComplete: (updatedUser: User) => void;
}

export default function UsernameSetup({
	user,
	onComplete,
}: UsernameSetupProps) {
	const [username, setUsername] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setError("");

		// Validate username before sending to backend
		const validation = validateUsername(username);
		if (!validation.valid) {
			setError(validation.error!);
			setLoading(false);
			return;
		}

		const result = await updateUsername(username);

		if (result.success && result.user) {
			onComplete(result.user);
		} else {
			setError(result.error || "Failed to set username");
		}

		setLoading(false);
	};

	return (
		<div className="w-96 p-6 rounded-2xl">
			<div className="flex items-center gap-2 mb-6">
				<img src="/icon/128.png" alt="WatchThis" className="w-8 h-8" />
				<h1 className="text-2xl font-bold text-gray-800">
					<span className="text-primary-500">Watch</span>This
				</h1>
			</div>

			<div className="mb-6">
				<h2 className="text-lg font-semibold text-gray-800 mb-2">
					Welcome! 👋
				</h2>
				<p className="text-sm text-gray-600">
					Choose a username for your account. This is how your friends will find
					you.
				</p>
			</div>

			{error && (
				<div className="mb-4 p-3 bg-primary-100 border border-primary-400 text-primary-700 rounded-lg text-sm">
					{error}
				</div>
			)}

			<form onSubmit={handleSubmit} className="space-y-4">
				<div>
					<label className="block text-sm font-medium text-gray-700 mb-1">
						Username
					</label>
					<input
						type="text"
						value={username}
						onChange={(e) => setUsername(e.target.value.toLowerCase())}
						required
						minLength={3}
						maxLength={50}
						pattern="[a-zA-Z0-9_]+"
						className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
						placeholder="Choose a username"
						autoFocus
					/>
					<p className="mt-1 text-xs text-gray-500">
						3-50 characters, letters, numbers, and underscores only
					</p>
				</div>

				<button
					type="submit"
					disabled={loading || username.length < 3}
					className="w-full bg-primary-500 hover:bg-primary-600 disabled:bg-primary-300 text-white font-medium py-2 px-4 rounded-lg transition-colors"
				>
					{loading ? "Saving..." : "Continue"}
				</button>
			</form>
		</div>
	);
}
