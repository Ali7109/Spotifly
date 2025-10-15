// Background service worker to handle OAuth and YouTube title injection

let authTabId = null;

// Handle messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
	if (message.action === "authStarted") {
		authTabId = message.tabId;
	} else if (message.action === "getTokens") {
		chrome.storage.local.get(
			["access_token", "refresh_token", "user"],
			(result) => {
				sendResponse(result);
			}
		);
		return true; // Keep message channel open for async response
	} else if (message.action === "injectScript") {
		chrome.tabs.query(
			{ active: true, currentWindow: true },
			async ([tab]) => {
				console.log("Injecting script into tab:", tab);
				if (tab?.id && tab.url.includes("youtube.com/watch")) {
					try {
						const [{ result }] =
							await chrome.scripting.executeScript({
								target: { tabId: tab.id },
								func: () => {
									return new Promise((resolve) => {
										const maxWait = 5000; // max 5 seconds
										const interval = 200;
										let waited = 0;

										const checkTitle = () => {
											let title =
												document.querySelector(
													'meta[name="title"]'
												)?.content ||
												document
													.querySelector(
														"h1.ytd-watch-metadata yt-formatted-string"
													)
													?.textContent?.trim() ||
												document
													.querySelector(
														"ytd-watch-metadata yt-formatted-string[title]"
													)
													?.textContent?.trim() ||
												document
													.querySelector(
														"#container h1.title"
													)
													?.textContent?.trim() ||
												document.title
													.replace(" - YouTube", "")
													.trim();

											if (title && title.length > 0) {
												resolve(title);
											} else if (waited >= maxWait) {
												resolve(null);
											} else {
												waited += interval;
												setTimeout(
													checkTitle,
													interval
												);
											}
										};

										checkTitle();
									});
								},
							});

						console.log("Extracted YouTube title:", result);

						chrome.runtime.sendMessage({
							action: "youtubeTitle",
							title: result,
						});
					} catch (err) {
						console.error("Script injection failed:", err);
						chrome.runtime.sendMessage({
							action: "youtubeTitle",
							title: null,
						});
					}
				}
			}
		);
	}
});

// Monitor tab updates for OAuth callback
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
	if (changeInfo.url) checkAndHandleCallback(changeInfo.url, tabId);
});

chrome.tabs.onCreated.addListener((tab) => {
	if (tab.url) checkAndHandleCallback(tab.url, tab.id);
	if (tab.pendingUrl) checkAndHandleCallback(tab.pendingUrl, tab.id);
});

function checkAndHandleCallback(url, tabId) {
	if (url.includes("localhost:3000/callback")) {
		console.log("Detected callback URL:", url);
		handleCallback(url, tabId);
	}
}

async function handleCallback(url, tabId) {
	try {
		const urlObj = new URL(url);
		const params = urlObj.searchParams;

		const accessToken = params.get("access_token");
		const refreshToken = params.get("refresh_token");
		const userJson = params.get("user");

		if (accessToken && refreshToken && userJson) {
			const user = JSON.parse(decodeURIComponent(userJson));

			await chrome.storage.local.set({
				access_token: accessToken,
				refresh_token: refreshToken,
				user: user,
			});

			console.log("Tokens stored successfully");

			try {
				await chrome.tabs.remove(tabId);
			} catch (e) {
				console.warn("Could not close tab:", e);
			}

			chrome.notifications.create({
				type: "basic",
				iconUrl: "icons/icon48.png",
				title: "Spotify Connected",
				message: `Successfully connected as ${
					user.display_name || user.id
				}`,
				priority: 2,
			});
		} else if (params.get("error")) {
			console.error("Authentication error:", params.get("error"));

			try {
				await chrome.tabs.remove(tabId);
			} catch (e) {
				console.warn("Could not close tab:", e);
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
