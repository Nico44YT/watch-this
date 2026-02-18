import pb from "./pocketbase";
import type { User, FriendRequest } from "../types";

/**
 * Search for a user by their exact username
 * Only returns id and username for privacy
 */
export async function searchUserByUsername(
	username: string,
): Promise<{ success: boolean; user?: User; error?: string }> {
	try {
		const user = await pb
			.collection("users")
			.getFirstListItem<User>(`username = "${username}"`, {
				fields: "id,username", // Only fetch these fields for privacy
			});

		return {
			success: true,
			user,
		};
	} catch (error: any) {
		// PocketBase throws an error if no record is found
		if (error?.status === 404) {
			return {
				success: false,
				error: "User not found",
			};
		}
		return {
			success: false,
			error: error?.message || "Failed to search for user",
		};
	}
}

/**
 * Send a friend request to another user
 */
export async function sendFriendRequest(
	receiverId: string,
): Promise<{ success: boolean; request?: FriendRequest; error?: string }> {
	try {
		const currentUser = pb.authStore.model;
		if (!currentUser) {
			return { success: false, error: "You must be logged in" };
		}

		// Check if trying to add yourself
		if (receiverId === currentUser.id) {
			return {
				success: false,
				error: "You cannot send a friend request to yourself",
			};
		}

		// Check if a request already exists between these users
		const existingRequests = await pb
			.collection("friend_requests")
			.getList<FriendRequest>(1, 1, {
				filter: `(sender = "${currentUser.id}" && receiver = "${receiverId}") || (sender = "${receiverId}" && receiver = "${currentUser.id}")`,
			});

		if (existingRequests.items.length > 0) {
			const existing = existingRequests.items[0];
			if (existing.status === "pending") {
				return { success: false, error: "A friend request already exists" };
			}
			if (existing.status === "accepted") {
				return { success: false, error: "You are already friends" };
			}
		}

		const request = await pb
			.collection("friend_requests")
			.create<FriendRequest>({
				sender: currentUser.id,
				receiver: receiverId,
				status: "pending",
			});

		return {
			success: true,
			request,
		};
	} catch (error: any) {
		return {
			success: false,
			error: error?.message || "Failed to send friend request",
		};
	}
}

/**
 * Get incoming friend requests (requests sent to the current user)
 */
export async function getIncomingRequests(): Promise<{
	success: boolean;
	requests?: FriendRequest[];
	error?: string;
}> {
	try {
		const currentUser = pb.authStore.model;
		if (!currentUser) {
			return { success: false, error: "You must be logged in" };
		}

		const result = await pb
			.collection("friend_requests")
			.getList<FriendRequest>(1, 50, {
				filter: `receiver = "${currentUser.id}" && status = "pending"`,
				expand: "sender",
				sort: "-created",
			});

		return {
			success: true,
			requests: result.items,
		};
	} catch (error: any) {
		return {
			success: false,
			error: error?.message || "Failed to get incoming requests",
		};
	}
}

/**
 * Get outgoing friend requests (requests sent by the current user)
 */
export async function getOutgoingRequests(): Promise<{
	success: boolean;
	requests?: FriendRequest[];
	error?: string;
}> {
	try {
		const currentUser = pb.authStore.model;
		if (!currentUser) {
			return { success: false, error: "You must be logged in" };
		}

		const result = await pb
			.collection("friend_requests")
			.getList<FriendRequest>(1, 50, {
				filter: `sender = "${currentUser.id}" && status = "pending"`,
				expand: "receiver",
				sort: "-created",
			});

		return {
			success: true,
			requests: result.items,
		};
	} catch (error: any) {
		return {
			success: false,
			error: error?.message || "Failed to get outgoing requests",
		};
	}
}

/**
 * Get all accepted friends
 */
export async function getFriends(): Promise<{
	success: boolean;
	friends?: User[];
	friendRequests?: FriendRequest[];
	error?: string;
}> {
	try {
		const currentUser = pb.authStore.model;
		if (!currentUser) {
			return { success: false, error: "You must be logged in" };
		}

		const result = await pb
			.collection("friend_requests")
			.getList<FriendRequest>(1, 100, {
				filter: `(sender = "${currentUser.id}" || receiver = "${currentUser.id}") && status = "accepted"`,
				expand: "sender,receiver",
				sort: "-updated",
			});

		// Extract the friend user from each request (the one who isn't the current user)
		const friends: User[] = [];
		for (const request of result.items) {
			if (request.expand?.sender && request.sender !== currentUser.id) {
				friends.push(request.expand.sender);
			} else if (
				request.expand?.receiver &&
				request.receiver !== currentUser.id
			) {
				friends.push(request.expand.receiver);
			}
		}

		return {
			success: true,
			friends,
			friendRequests: result.items, // Also return requests for unfriend functionality
		};
	} catch (error: any) {
		return {
			success: false,
			error: error?.message || "Failed to get friends",
		};
	}
}

/**
 * Accept a friend request
 */
export async function acceptFriendRequest(
	requestId: string,
): Promise<{ success: boolean; error?: string }> {
	try {
		await pb.collection("friend_requests").update(requestId, {
			status: "accepted",
		});

		return { success: true };
	} catch (error: any) {
		return {
			success: false,
			error: error?.message || "Failed to accept friend request",
		};
	}
}

/**
 * Reject a friend request
 */
export async function rejectFriendRequest(
	requestId: string,
): Promise<{ success: boolean; error?: string }> {
	try {
		await pb.collection("friend_requests").update(requestId, {
			status: "rejected",
		});

		return { success: true };
	} catch (error: any) {
		return {
			success: false,
			error: error?.message || "Failed to reject friend request",
		};
	}
}

/**
 * Cancel a sent friend request
 */
export async function cancelFriendRequest(
	requestId: string,
): Promise<{ success: boolean; error?: string }> {
	try {
		await pb.collection("friend_requests").delete(requestId);

		return { success: true };
	} catch (error: any) {
		return {
			success: false,
			error: error?.message || "Failed to cancel friend request",
		};
	}
}

/**
 * Remove a friend (delete the friend request record)
 */
export async function removeFriend(
	requestId: string,
): Promise<{ success: boolean; error?: string }> {
	try {
		await pb.collection("friend_requests").delete(requestId);

		return { success: true };
	} catch (error: any) {
		return {
			success: false,
			error: error?.message || "Failed to remove friend",
		};
	}
}
