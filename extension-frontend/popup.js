const API_BASE = "http://localhost:8080";

// UI Elements
const loading = document.getElementById("loading");
const loggedOut = document.getElementById("logged-out");
const loggedIn = document.getElementById("logged-in");
const loginBtn = document.getElementById("login-btn");
const logoutBtn = document.getElementById("logout-btn");
const userInfo = document.getElementById("user-info");

// Check authentication status on load
async function checkAuthStatus() {
	const tokens = await chrome.storage.local.get([
		"access_token",
		"refresh_token",
		"user",
	]);

	if (tokens.access_token && tokens.user) {
		// Try to fetch profile to verify token is still valid
		try {
			const response = await fetch(`${API_BASE}/spotify/profile`, {
				headers: {
					Authorization: `Bearer ${tokens.access_token}`,
				},
			});

			if (response.ok) {
				const profile = await response.json();
				showLoggedIn(profile);
				return;
			} else if (response.status === 401) {
				// Token expired, try to refresh
				const refreshed = await refreshToken();
				if (refreshed) {
					const newTokens = await chrome.storage.local.get([
						"access_token",
					]);
					const profileResponse = await fetch(
						`${API_BASE}/spotify/profile`,
						{
							headers: {
								Authorization: `Bearer ${newTokens.access_token}`,
							},
						}
					);
					if (profileResponse.ok) {
						const profile = await profileResponse.json();
						showLoggedIn(profile);
						return;
					}
				}
			}
		} catch (error) {
			console.error("Error checking auth status:", error);
		}
	}

	showLoggedOut();
}

// Refresh access token
async function refreshToken() {
	const tokens = await chrome.storage.local.get([
		"access_token",
		"refresh_token",
	]);

	if (!tokens.access_token) {
		return false;
	}

	try {
		const response = await fetch(`${API_BASE}/auth/refresh`, {
			headers: {
				Authorization: `Bearer ${tokens.access_token}`,
			},
		});

		if (response.ok) {
			const data = await response.json();
			await chrome.storage.local.set({ access_token: data.access_token });
			return true;
		}
	} catch (error) {
		console.error("Error refreshing token:", error);
	}

	return false;
}

// Show logged out state
function showLoggedOut() {
	loading.classList.add("hidden");
	loggedOut.classList.remove("hidden");
	loggedIn.classList.add("hidden");
}

// Show logged in state
function showLoggedIn(user) {
	loading.classList.add("hidden");
	loggedOut.classList.add("hidden");
	loggedIn.classList.remove("hidden");

	const displayName = user.display_name || user.id;
	const firstName = displayName.split(" ")[0];
	const email = user.email || "";
	const externalUrl = user.external_urls ? user.external_urls.spotify : "#";

	userInfo.innerHTML = `
        <h2>
        ${firstName}
        <a href="${externalUrl}" target="_blank" id="spotify-external-link">↗</a>
        </h2>
        ${email ? `<p>${email}</p>` : ""}
        <p id="spotify-connected">Connected ✓</p>
        
    `;
}

// Login button handler
loginBtn.addEventListener("click", async () => {
	try {
		const response = await fetch(`${API_BASE}/auth/login`);
		const data = await response.json();

		// Open auth URL in new tab
		const tab = await chrome.tabs.create({ url: data.auth_url });

		// Notify background script
		chrome.runtime.sendMessage({
			action: "authStarted",
			tabId: tab.id,
		});

		// Close popup
		window.close();
	} catch (error) {
		console.error("Error initiating login:", error);
		alert(
			"Failed to connect to Spotify. Make sure the backend is running."
		);
	}
});

// Logout button handler
logoutBtn.addEventListener("click", async () => {
	const tokens = await chrome.storage.local.get(["access_token"]);

	if (tokens.access_token) {
		try {
			await fetch(`${API_BASE}/auth/logout`, {
				headers: {
					Authorization: `Bearer ${tokens.access_token}`,
				},
			});
		} catch (error) {
			console.error("Error logging out:", error);
		}
	}

	// Clear local storage
	await chrome.storage.local.remove([
		"access_token",
		"refresh_token",
		"user",
	]);
	showLoggedOut();
});

// Initialize
checkAuthStatus();
