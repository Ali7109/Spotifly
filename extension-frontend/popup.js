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

	if (!tokens.access_token) return false;

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

	let displayName = user.display_name || user.id;
	if (!displayName) {
		const email = user.email || "";
		displayName = email.includes("@") ? email.split("@")[0] : "User";
	} else {
		displayName = displayName.trim().split(" ")[0];
	}
	const externalUrl = user.external_urls?.spotify || "#";

	userInfo.innerHTML = `
        <h2>
            ${displayName}
            <a href="${externalUrl}" target="_blank" id="spotify-external-link">↗</a>
        </h2>
        <p id="spotify-connected">Connected ✓</p>
    `;

	// Ask background script to inject YouTube title reader
	setTimeout(() => {
		chrome.runtime.sendMessage({ action: "injectScript" });
	}, 100);
}

// Receive YouTube title from background
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
	if (message.action === "youtubeTitle") {
		// Take the title and make a request to Spotify API to search and return results
		const appContent = document.querySelector(".app-content");

		const title = message.title;
		if (!title) {
			appContent.innerHTML = "<p>No title found on this page.</p>";
			return;
		}

		appContent.innerHTML = `<p>Searching Spotify for "<strong>${title}</strong>"...</p>`;

		// Call backend to search Spotify
		/**\
		 * Sample python backend for playlist add
		 * @app.post("/spotify/playlists/add-track")
				async def add_track_to_playlist(
				playlist_name: str,
				track_uri: str,
				user_id: str = Depends(get_current_user),
		 */
		fetch(
			`${API_BASE}/spotify/search?query=${encodeURIComponent(
				title
			)}&limit=3`
		)
			.then((response) => response.json())
			.then((data) => {
				console.log("Spotify search results:", data);
				// Handle the search results
				if (data.tracks && data.tracks.items.length > 0) {
					// Loop and make ul list of results
					appContent.innerHTML = ""; // Clear previous content

					data.tracks.items.forEach((track) => {
						const trackContainer = document.createElement("div");
						trackContainer.className = "song_button";

						// Create title link
						const titleLink = document.createElement("a");
						titleLink.className = "song_title";
						titleLink.href = track.external_urls.spotify;
						titleLink.target = "_blank";
						titleLink.textContent = `${track.name} - ${track.artists
							.map((artist) => artist.name)
							.join(", ")}`;

						// Create image
						const image = document.createElement("img");
						image.className = "song_image";
						image.src = track.album.images?.[0]?.url || "";
						image.alt = `${track.name} cover`;
						image.width = 64;
						image.height = 64;

						// Create button with URI data
						const addButton = document.createElement("button");
						addButton.className = "add_to_playlist";
						addButton.textContent = "➕ Add to Playlist";
						addButton.setAttribute("data-uri", track.uri);

						// Optional: Add click handler
						addButton.addEventListener("click", () => {
							const uri = addButton.getAttribute("data-uri");
							console.log("Add to playlist:", uri);
							// Call your backend or Spotify API here
						});

						// Assemble
						trackContainer.appendChild(image);
						trackContainer.appendChild(titleLink);
						trackContainer.appendChild(addButton);

						appContent.appendChild(trackContainer);
					});
				} else {
					appContent.innerHTML = `<p>No results found for "${title}".</p>`;
				}
			})
			.catch((error) => {
				console.error("Error searching Spotify:", error);
				appContent.innerHTML = `<p>Error searching Spotify. Please try again.</p>`;
			});
	}
});

// Login button handler
loginBtn.addEventListener("click", async () => {
	try {
		const response = await fetch(`${API_BASE}/auth/login`);
		const data = await response.json();

		const tab = await chrome.tabs.create({ url: data.auth_url });

		chrome.runtime.sendMessage({
			action: "authStarted",
			tabId: tab.id,
		});

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

	await chrome.storage.local.remove([
		"access_token",
		"refresh_token",
		"user",
	]);
	showLoggedOut();
});

// Initialize
(async function init() {
	await checkAuthStatus();
})();
