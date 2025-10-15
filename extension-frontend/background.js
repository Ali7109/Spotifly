// Background service worker to handle OAuth callback

// Keep track of auth tabs
let authTabId = null;

// Listen for when auth process starts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
	if (request.action === "authStarted") {
		authTabId = request.tabId;
	} else if (request.action === "getTokens") {
		chrome.storage.local.get(
			["access_token", "refresh_token", "user"],
			(result) => {
				sendResponse(result);
			}
		);
		return true;
	}
});

// Intercept ALL tab updates - check every URL change
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
	if (changeInfo.url) {
		checkAndHandleCallback(changeInfo.url, tabId);
	}
});

// Also check when tabs are created
chrome.tabs.onCreated.addListener((tab) => {
	if (tab.url) {
		checkAndHandleCallback(tab.url, tab.id);
	}
	if (tab.pendingUrl) {
		checkAndHandleCallback(tab.pendingUrl, tab.id);
	}
});

// Check if URL is a callback URL
function checkAndHandleCallback(url, tabId) {
	if (url && url.includes("localhost:3000/callback")) {
		console.log("Detected callback URL:", url);
		handleCallback(url, tabId);
	}
}

// Parse callback URL and store tokens
async function handleCallback(url, tabId) {
	try {
		const urlObj = new URL(url);
		const params = urlObj.searchParams;

		const accessToken = params.get("access_token");
		const refreshToken = params.get("refresh_token");
		const userJson = params.get("user");

		console.log(
			"Processing callback - has tokens:",
			!!accessToken,
			!!refreshToken
		);

		if (accessToken && refreshToken && userJson) {
			const user = JSON.parse(decodeURIComponent(userJson));

			// Store tokens and user info
			await chrome.storage.local.set({
				access_token: accessToken,
				refresh_token: refreshToken,
				user: user,
			});

			console.log("Tokens stored successfully");

			// Close the callback tab immediately
			try {
				await chrome.tabs.remove(tabId);
			} catch (e) {
				console.log("Could not close tab:", e);
			}

			// Show success notification
			chrome.notifications.create({
				type: "basic",
				iconUrl: "icons/icon48.png",
				title: "Spotify Connected",
				message: `Successfully connected as ${
					user.display_name || user.id
				}`,
				priority: 2,
			});

			console.log("Spotify authentication successful");
		} else if (params.get("error")) {
			console.error("Authentication error:", params.get("error"));
			try {
				await chrome.tabs.remove(tabId);
			} catch (e) {
				console.log("Could not close tab:", e);
			}

			chrome.notifications.create({
				type: "basic",
				iconUrl: "icons/icon48.png",
				title: "Connection Failed",
				message: "Failed to connect to Spotify. Please try again.",
				priority: 2,
			});
		}
	} catch (error) {
		console.error("Error handling callback:", error);
	}
}
