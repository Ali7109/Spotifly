"use client";

import {
	createContext,
	useContext,
	useState,
	useEffect,
	ReactNode,
} from "react";

interface User {
	id: string;
	display_name: string;
	email: string;
	images?: { url: string }[];
}

interface AuthContextType {
	accessToken: string | null;
	user: User | null;
	login: () => void;
	logout: () => void;
	isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
	const [accessToken, setAccessToken] = useState<string | null>(null);
	const [user, setUser] = useState<User | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const token = localStorage.getItem("spotify_access_token");
		const storedUser = localStorage.getItem("spotify_user");

		if (token && storedUser) {
			setAccessToken(token);
			setUser(JSON.parse(storedUser));
		}
		setIsLoading(false);
	}, []);

	const login = async () => {
		try {
			const response = await fetch("http://localhost:8080/auth/login");
			const data = await response.json();
			window.location.href = data.auth_url;
		} catch (error) {
			console.error("Login error:", error);
		}
	};

	const logout = async () => {
		// Call backend logout with authorization header
		if (accessToken) {
			try {
				await fetch("http://localhost:8080/auth/logout", {
					method: "GET",
					headers: {
						Authorization: `Bearer ${accessToken}`,
					},
				});
			} catch (error) {
				console.error("Backend logout error:", error);
			}
		}

		// Clear local state
		setAccessToken(null);
		setUser(null);
		localStorage.removeItem("spotify_access_token");
		localStorage.removeItem("spotify_refresh_token");
		localStorage.removeItem("spotify_user");

		// Optional: Redirect to Spotify logout to clear their session
		// Uncomment the next 3 lines for complete logout from Spotify
		// window.location.href = `https://accounts.spotify.com/logout?continue=${encodeURIComponent(
		// 	window.location.origin
		// )}`;
	};

	return (
		<AuthContext.Provider
			value={{ accessToken, user, login, logout, isLoading }}
		>
			{children}
		</AuthContext.Provider>
	);
}

export function useAuth() {
	const context = useContext(AuthContext);
	if (context === undefined) {
		throw new Error("useAuth must be used within an AuthProvider");
	}
	return context;
}
