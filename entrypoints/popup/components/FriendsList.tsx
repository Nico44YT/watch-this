import React, { useState, useEffect } from "react";
import { validateUsername } from "../../../lib/validation";
import type { User, FriendRequest } from "../../../types";
import {
	searchUserByUsername,
	sendFriendRequest,
	getIncomingRequests,
	getOutgoingRequests,
	getFriends,
	acceptFriendRequest,
	rejectFriendRequest,
	cancelFriendRequest,
	removeFriend,
} from "../../../lib/friends";
import Icon from "./Icon";

type FriendsTab = "friends" | "requests" | "add";

interface FriendsListProps {
	user: User;
}

export default function FriendsList({ user }: FriendsListProps) {
	const [activeTab, setActiveTab] = useState<FriendsTab>("friends");
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string>("");
	const [success, setSuccess] = useState<string>("");

	// Data states
	const [friends, setFriends] = useState<User[]>([]);
	const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
	const [incomingRequests, setIncomingRequests] = useState<FriendRequest[]>([]);
	const [outgoingRequests, setOutgoingRequests] = useState<FriendRequest[]>([]);

	// Add friend form
	const [searchUsername, setSearchUsername] = useState("");
	const [searchLoading, setSearchLoading] = useState(false);

	// Load data on mount
	useEffect(() => {
		loadAllData();
	}, []);

	const loadAllData = async () => {
		setLoading(true);
		setError("");
		try {
			const [friendsResult, incomingResult, outgoingResult] = await Promise.all(
				[getFriends(), getIncomingRequests(), getOutgoingRequests()],
			);

			if (friendsResult.success && friendsResult.friends) {
				setFriends(friendsResult.friends);
				setFriendRequests(friendsResult.friendRequests || []);
			}
			if (incomingResult.success && incomingResult.requests) {
				setIncomingRequests(incomingResult.requests);
			}
			if (outgoingResult.success && outgoingResult.requests) {
				setOutgoingRequests(outgoingResult.requests);
			}
		} catch (err) {
			setError("Failed to load friends data");
		} finally {
			setLoading(false);
		}
	};

	const handleSendRequest = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!searchUsername.trim()) return;

		setSearchLoading(true);
		setError("");
		setSuccess("");

		// Validate username format before hitting the API
		const validation = validateUsername(searchUsername.trim());
		if (!validation.valid) {
			setError(validation.error!);
			setSearchLoading(false);
			return;
		}

		// First, find the user
		const searchResult = await searchUserByUsername(searchUsername.trim());
		if (!searchResult.success || !searchResult.user) {
			setError(searchResult.error || "User not found");
			setSearchLoading(false);
			return;
		}

		// Send the friend request
		const sendResult = await sendFriendRequest(searchResult.user.id);
		if (sendResult.success) {
			setSuccess(`Friend request sent to ${searchUsername}!`);
			setSearchUsername("");
			// Reload outgoing requests
			const outgoingResult = await getOutgoingRequests();
			if (outgoingResult.success && outgoingResult.requests) {
				setOutgoingRequests(outgoingResult.requests);
			}
		} else {
			setError(sendResult.error || "Failed to send friend request");
		}

		setSearchLoading(false);
	};

	const handleAccept = async (requestId: string) => {
		setError("");
		const result = await acceptFriendRequest(requestId);
		if (result.success) {
			await loadAllData();
		} else {
			setError(result.error || "Failed to accept request");
		}
	};

	const handleReject = async (requestId: string) => {
		setError("");
		const result = await rejectFriendRequest(requestId);
		if (result.success) {
			setIncomingRequests((prev) => prev.filter((r) => r.id !== requestId));
		} else {
			setError(result.error || "Failed to reject request");
		}
	};

	const handleCancel = async (requestId: string) => {
		setError("");
		const result = await cancelFriendRequest(requestId);
		if (result.success) {
			setOutgoingRequests((prev) => prev.filter((r) => r.id !== requestId));
		} else {
			setError(result.error || "Failed to cancel request");
		}
	};

	const handleUnfriend = async (friendUserId: string) => {
		setError("");
		// Find the friend request that corresponds to this friendship
		const request = friendRequests.find(
			(r) => r.sender === friendUserId || r.receiver === friendUserId,
		);
		if (!request) {
			setError("Could not find friendship record");
			return;
		}

		const result = await removeFriend(request.id);
		if (result.success) {
			setFriends((prev) => prev.filter((f) => f.id !== friendUserId));
			setFriendRequests((prev) => prev.filter((r) => r.id !== request.id));
		} else {
			setError(result.error || "Failed to remove friend");
		}
	};

	const pendingCount = incomingRequests.length;

	if (loading) {
		return (
			<div className="flex items-center justify-center py-8">
				<div className="text-gray-600">Loading friends...</div>
			</div>
		);
	}

	return (
		<div>
			{/* Sub-tabs */}
			<div className="flex gap-1 mb-4 bg-gray-100 p-1 rounded-lg">
				<button
					onClick={() => setActiveTab("friends")}
					className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
						activeTab === "friends"
							? "bg-white text-gray-800 shadow-sm"
							: "text-gray-600 hover:text-gray-800"
					}`}
				>
					Friends ({friends.length})
				</button>
				<button
					onClick={() => setActiveTab("requests")}
					className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
						activeTab === "requests"
							? "bg-white text-gray-800 shadow-sm"
							: "text-gray-600 hover:text-gray-800"
					}`}
				>
					Requests{" "}
					{pendingCount > 0 && (
						<span className="ml-1 bg-primary-500 text-white text-xs px-1.5 py-0.5 rounded-full">
							{pendingCount}
						</span>
					)}
				</button>
				<button
					onClick={() => setActiveTab("add")}
					className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
						activeTab === "add"
							? "bg-white text-gray-800 shadow-sm"
							: "text-gray-600 hover:text-gray-800"
					}`}
				>
					Add
				</button>
			</div>

			{/* Error Message */}
			{error && (
				<div className="mb-4 p-3 bg-primary-100 border border-primary-400 text-primary-700 rounded-lg text-sm">
					{error}
				</div>
			)}

			{/* Success Message */}
			{success && (
				<div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg text-sm">
					{success}
				</div>
			)}

			{/* Friends Tab */}
			{activeTab === "friends" && (
				<div>
					{friends.length === 0 ? (
						<div className="text-center py-8 text-gray-500">
							<p>No friends yet</p>
							<button
								onClick={() => setActiveTab("add")}
								className="mt-2 text-blue-500 hover:text-blue-600 text-sm"
							>
								Add your first friend
							</button>
						</div>
					) : (
						<div className="space-y-2">
							{friends.map((friend) => (
								<div
									key={friend.id}
									className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
								>
									<span className="font-medium text-gray-800">
										{friend.username}
									</span>
									<button
										onClick={() => handleUnfriend(friend.id)}
										className="text-sm text-primary-500 hover:text-primary-600 hover:bg-primary-50 px-2 py-1 rounded"
									>
										Unfriend
									</button>
								</div>
							))}
						</div>
					)}
				</div>
			)}

			{/* Requests Tab */}
			{activeTab === "requests" && (
				<div className="space-y-4">
					{/* Incoming Requests */}
					<div>
						<h3 className="text-sm font-semibold text-gray-700 mb-2">
							Incoming Requests
						</h3>
						{incomingRequests.length === 0 ? (
							<p className="text-sm text-gray-500 py-2">No pending requests</p>
						) : (
							<div className="space-y-2">
								{incomingRequests.map((request) => (
									<div
										key={request.id}
										className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg"
									>
										<span className="font-medium text-gray-800">
											{request.expand?.sender?.username || "Unknown"}
										</span>
										<div className="flex gap-2">
											<button
												onClick={() => handleAccept(request.id)}
												className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-lg"
												title="Accept"
											>
												<Icon name="check" size={4} />
											</button>
											<button
												onClick={() => handleReject(request.id)}
												className="p-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg"
												title="Reject"
											>
												<Icon name="x" size={4} />
											</button>
										</div>
									</div>
								))}
							</div>
						)}
					</div>

					{/* Outgoing Requests */}
					<div>
						<h3 className="text-sm font-semibold text-gray-700 mb-2">
							Sent Requests
						</h3>
						{outgoingRequests.length === 0 ? (
							<p className="text-sm text-gray-500 py-2">No pending requests</p>
						) : (
							<div className="space-y-2">
								{outgoingRequests.map((request) => (
									<div
										key={request.id}
										className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
									>
										<div>
											<span className="font-medium text-gray-800">
												{request.expand?.receiver?.username || "Unknown"}
											</span>
											<p className="text-xs text-gray-500">Pending</p>
										</div>
										<button
											onClick={() => handleCancel(request.id)}
											className="text-sm text-gray-500 hover:text-primary-600 hover:bg-gray-100 px-2 py-1 rounded"
										>
											Cancel
										</button>
									</div>
								))}
							</div>
						)}
					</div>
				</div>
			)}

			{/* Add Friend Tab */}
			{activeTab === "add" && (
				<div>
					<form onSubmit={handleSendRequest} className="space-y-3">
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">
								Find by username
							</label>
							<div className="flex gap-2">
								<input
									type="text"
									value={searchUsername}
									onChange={(e) => setSearchUsername(e.target.value)}
									placeholder="Enter username"
									className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
								/>
								<button
									type="submit"
									disabled={searchLoading || !searchUsername.trim()}
									className="px-4 py-2 bg-primary-500 hover:bg-primary-600 disabled:bg-primary-300 text-white font-medium rounded-lg transition-colors"
								>
									{searchLoading ? "..." : "Send"}
								</button>
							</div>
						</div>
					</form>

					<div className="mt-6 p-4 bg-gray-50 rounded-lg">
						<p className="text-sm text-gray-600">
							<strong>Tip:</strong> Ask your friends for their exact username to
							add them. Usernames are case-sensitive.
						</p>
					</div>
				</div>
			)}

			{/* Refresh Button */}
			<div className="mt-4 text-center">
				<button
					onClick={loadAllData}
					className="text-sm text-gray-500 hover:text-gray-700"
				>
					↻ Refresh
				</button>
			</div>
		</div>
	);
}
