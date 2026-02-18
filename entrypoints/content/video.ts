import type { User } from "../../types";
import { sendMessage } from "./utils";
import { browser } from "wxt/browser";
import { createStyleElement, getSharedStyles } from "./shared-styles";

// Video page specific styles
const videoPageStyles = `
	#watchthis-button-wrapper {
		display: inline-flex;
		align-items: center;
		margin-left: 8px;
		flex-shrink: 0;
		vertical-align: middle;
	}

	#watchthis-button {
		background: #cc0000 !important;
		color: white !important;
		border-radius: 50px !important;
		padding: 0 16px !important;
		height: 36px !important;
		border: none !important;
		cursor: pointer !important;
		font-family: "Roboto", "Arial", sans-serif !important;
		font-size: 14px !important;
		font-weight: 500 !important;
		transition: background 0.2s ease !important;
	}

	#watchthis-button:hover {
		background: #aa0000 !important;
	}

	#watchthis-button-icon {
		width: 24px;
		height: 24px;
		object-fit: contain;
	}

	#watchthis-modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: rgba(0, 0, 0, 0.6);
		z-index: 9999;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	#watchthis-modal {
		background: var(--yt-spec-base-background, #fff);
		border-radius: 12px;
		padding: 24px;
		min-width: 320px;
		max-width: 400px;
		max-height: 80vh;
		overflow-y: auto;
		box-shadow: 0 4px 32px rgba(0, 0, 0, 0.3);
		font-family: "Roboto", "Arial", sans-serif;
	}

	#watchthis-modal h3 {
		margin: 0 0 16px 0;
		font-size: 18px;
		font-weight: 500;
		color: var(--yt-spec-text-primary, #0f0f0f);
		display: flex;
		align-items: center;
		gap: 8px;
	}

	#watchthis-modal-close {
		position: absolute;
		top: 12px;
		right: 12px;
		background: none;
		border: none;
		font-size: 24px;
		cursor: pointer;
		color: var(--yt-spec-text-secondary, #606060);
	}
`;

// Create styles for the recommend button and modal
function createRecommendButtonStyles(): HTMLStyleElement {
	const combinedStyles = `${videoPageStyles}\n${getSharedStyles()}`;
	return createStyleElement("watchthis-button-styles", combinedStyles);
}

// Create the recommend button element
function createRecommendButton(): HTMLElement {
	const wrapper = document.createElement("yt-button-view-model");
	wrapper.className = "ytd-menu-renderer";
	wrapper.id = "watchthis-button-wrapper";

	wrapper.innerHTML = `
		<button-view-model class="ytSpecButtonViewModelHost style-scope ytd-menu-renderer">
			<button 
				id="watchthis-button"
				class="yt-spec-button-shape-next yt-spec-button-shape-next--tonal yt-spec-button-shape-next--mono yt-spec-button-shape-next--size-m yt-spec-button-shape-next--icon-leading yt-spec-button-shape-next--enable-backdrop-filter-experiment" 
				title="Recommend to friends" 
				aria-label="Recommend this video to friends"
				style="display: inline-flex; align-items: center; gap: 8px;"
			>
				<img id="watchthis-button-icon" src="${browser.runtime.getURL(
					"/icon/white_logo_icon.svg",
				)}" alt="" />
				<div class="yt-spec-button-shape-next__button-text-content">WatchThis!</div>
				<yt-touch-feedback-shape aria-hidden="true" class="yt-spec-touch-feedback-shape yt-spec-touch-feedback-shape--touch-response">
					<div class="yt-spec-touch-feedback-shape__stroke"></div>
					<div class="yt-spec-touch-feedback-shape__fill"></div>
				</yt-touch-feedback-shape>
			</button>
		</button-view-model>
	`;

	return wrapper;
}

// Create and show the recommend modal
async function showRecommendModal() {
	// Remove existing modal if any
	const existingOverlay = document.getElementById("watchthis-modal-overlay");
	if (existingOverlay) existingOverlay.remove();

	// Create overlay
	const overlay = document.createElement("div");
	overlay.id = "watchthis-modal-overlay";

	// Create modal
	const modal = document.createElement("div");
	modal.id = "watchthis-modal";
	modal.innerHTML = `
		<h3>Select your friends</h3>
		<div class="watchthis-loading">Loading friends...</div>
	`;

	overlay.appendChild(modal);
	document.body.appendChild(overlay);

	// Close on overlay click
	overlay.addEventListener("click", (e) => {
		if (e.target === overlay) {
			overlay.remove();
		}
	});

	// Close on Escape key
	const handleEscape = (e: KeyboardEvent) => {
		if (e.key === "Escape") {
			overlay.remove();
			document.removeEventListener("keydown", handleEscape);
		}
	};
	document.addEventListener("keydown", handleEscape);

	// Check auth first
	const authResult = await sendMessage({ type: "checkAuth" });

	if (!authResult.success || !authResult.isAuthenticated) {
		modal.innerHTML = `
			<h3>Select your friends</h3>
			<div class="watchthis-message watchthis-message-info">
				Please log in via the WatchThis extension popup to recommend videos to friends.
			</div>
			<div class="watchthis-modal-actions">
				<button class="watchthis-btn watchthis-btn-secondary" id="watchthis-close-btn">Close</button>
			</div>
		`;
		document
			.getElementById("watchthis-close-btn")
			?.addEventListener("click", () => overlay.remove());
		return;
	}

	// Get friends
	const friendsResult = await sendMessage({ type: "getFriends" });

	if (!friendsResult.success) {
		// Create error message safely
		modal.innerHTML = "";

		const h3 = document.createElement("h3");
		h3.textContent = "Select your friends";

		const errorDiv = document.createElement("div");
		errorDiv.className = "watchthis-message watchthis-message-error";
		errorDiv.textContent = `Failed to load friends: ${friendsResult.error}`; // Safe from XSS

		const actionsDiv = document.createElement("div");
		actionsDiv.className = "watchthis-modal-actions";

		const closeBtn = document.createElement("button");
		closeBtn.className = "watchthis-btn watchthis-btn-secondary";
		closeBtn.id = "watchthis-close-btn";
		closeBtn.textContent = "Close";
		closeBtn.addEventListener("click", () => overlay.remove());

		actionsDiv.appendChild(closeBtn);

		modal.appendChild(h3);
		modal.appendChild(errorDiv);
		modal.appendChild(actionsDiv);
		return;
	}

	const friends: User[] = friendsResult.friends || [];

	if (friends.length === 0) {
		modal.innerHTML = `
			<h3>Select your friends</h3>
			<div class="watchthis-empty">
				You don't have any friends yet.<br>
				Add friends via the extension popup to share videos!
			</div>
			<div class="watchthis-modal-actions">
				<button class="watchthis-btn watchthis-btn-secondary" id="watchthis-close-btn">Close</button>
			</div>
		`;
		document
			.getElementById("watchthis-close-btn")
			?.addEventListener("click", () => overlay.remove());
		return;
	}

	// Show friend list
	const selectedFriends = new Set<string>();

	// Create modal header
	const h3 = document.createElement("h3");
	h3.textContent = "Select your friends";
	modal.innerHTML = ""; // Clear existing content
	modal.appendChild(h3);

	// Create friend list
	const friendList = document.createElement("ul");
	friendList.className = "watchthis-friend-list";

	// Create friend list items safely
	friends.forEach((friend) => {
		const li = document.createElement("li");
		li.className = "watchthis-friend-item";
		li.setAttribute("data-id", friend.id);

		const checkbox = document.createElement("input");
		checkbox.type = "checkbox";
		checkbox.id = `friend-${friend.id}`;

		const label = document.createElement("label");
		label.setAttribute("for", `friend-${friend.id}`);
		label.textContent = `@${friend.username}`; // Safe from XSS

		li.appendChild(checkbox);
		li.appendChild(label);
		friendList.appendChild(li);
	});

	modal.appendChild(friendList);

	// Create message div
	const messageDiv = document.createElement("div");
	messageDiv.id = "watchthis-modal-message";
	modal.appendChild(messageDiv);

	// Create action buttons
	const actionsDiv = document.createElement("div");
	actionsDiv.className = "watchthis-modal-actions";

	const cancelBtn = document.createElement("button");
	cancelBtn.className = "watchthis-btn watchthis-btn-secondary";
	cancelBtn.id = "watchthis-cancel-btn";
	cancelBtn.textContent = "Cancel";

	const sendBtn = document.createElement("button");
	sendBtn.className = "watchthis-btn watchthis-btn-primary";
	sendBtn.id = "watchthis-send-btn";
	sendBtn.textContent = "Send";
	sendBtn.disabled = true;

	actionsDiv.appendChild(cancelBtn);
	actionsDiv.appendChild(sendBtn);
	modal.appendChild(actionsDiv);

	// Handle friend selection
	modal.querySelectorAll(".watchthis-friend-item").forEach((item) => {
		const checkbox = item.querySelector(
			"input[type='checkbox']",
		) as HTMLInputElement;
		const friendId = item.getAttribute("data-id")!;

		// Clicking anywhere on the row toggles the checkbox
		item.addEventListener("click", () => {
			checkbox.checked = !checkbox.checked;
			if (checkbox.checked) {
				selectedFriends.add(friendId);
			} else {
				selectedFriends.delete(friendId);
			}
			sendBtn.disabled = selectedFriends.size === 0;
		});
	});

	// Cancel button
	cancelBtn?.addEventListener("click", () => overlay.remove());

	// Send button
	sendBtn?.addEventListener("click", async () => {
		if (selectedFriends.size === 0) return;

		sendBtn.disabled = true;
		sendBtn.textContent = "Sending...";

		const result = await sendMessage({
			type: "sendRecommendation",
			receiverIds: Array.from(selectedFriends),
			url: window.location.href,
		});

		if (result.success) {
			if (messageDiv) {
				// Create success message safely
				messageDiv.innerHTML = "";
				const successDiv = document.createElement("div");
				successDiv.className = "watchthis-message watchthis-message-success";
				successDiv.textContent = `✓ Sent to ${result.count} friend${result.count > 1 ? "s" : ""}!`;
				messageDiv.appendChild(successDiv);
			}
			setTimeout(() => overlay.remove(), 1500);
		} else {
			if (messageDiv) {
				// Create error message safely
				messageDiv.innerHTML = "";
				const errorDiv = document.createElement("div");
				errorDiv.className = "watchthis-message watchthis-message-error";
				errorDiv.textContent = result.error || "Failed to send recommendation"; // Safe from XSS
				messageDiv.appendChild(errorDiv);
			}
			sendBtn.disabled = false;
			sendBtn.textContent = "Send";
		}
	});
}

// Inject the recommend button into YouTube's actions section (right side)
// Returns true if injection was successful, false otherwise
export function injectRecommendButton(): boolean {
	// Don't inject if already exists
	if (document.getElementById("watchthis-button-wrapper")) {
		return true; // Already exists, consider it a success
	}

	// Find YouTube's actions container
	const actionsContainer = document.querySelector("#actions");
	if (!actionsContainer) {
		return false; // Container not found, retry needed
	}

	// Look for the nested buttons container (where buttons are actually in a row)
	const buttonsContainer = actionsContainer.querySelector(
		"#top-level-buttons-computed",
	);

	if (!buttonsContainer) {
		return false; // Nested container not found yet
	}

	// Add styles if not already added
	if (!document.getElementById("watchthis-button-styles")) {
		document.head.appendChild(createRecommendButtonStyles());
	}

	// Create and inject the button at the end of the buttons row
	const recommendButton = createRecommendButton();
	buttonsContainer.appendChild(recommendButton);

	// Add click handler
	const button = document.getElementById("watchthis-button");
	button?.addEventListener("click", (e) => {
		e.preventDefault();
		e.stopPropagation();
		showRecommendModal();
	});

	return true; // Injection successful
}

// Remove the recommend button
export function removeRecommendButton() {
	const button = document.getElementById("watchthis-button-wrapper");
	if (button) button.remove();
}
