import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom/client";
import "../popup/style.css";
import {
	getAuthState,
	login,
	register,
	requestPasswordReset,
	resendVerificationEmail,
	loginWithGoogleInTab,
	confirmGoogleRegistration,
	needsOnboarding,
	completeOnboarding,
} from "../../lib/auth";
import { openInNewTab } from "../../lib/browser";
import type { User } from "../../types";

type AuthStep =
	| "initial" // Start: Google Button + Email input
	| "email-login" // Email exists: Enter password
	| "email-register" // Email doesn't exist: Create password + checkboxes
	| "onboarding" // Accept terms + set username (combined)
	| "forgot-password" // Password reset
	| "verify-email" // Email verification sent
	| "success"; // All done

// Subscribe to newsletter
const subscribeToNewsletter = async (email: string): Promise<void> => {
	try {
		await fetch("https://n8n.movingmillennial.de/webhook/newsletter", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ email }),
		});
	} catch (error) {
		console.error("Failed to subscribe to newsletter:", error);
	}
};

// Google Icon SVG component
const GoogleIcon = () => (
	<svg className="w-5 h-5" viewBox="0 0 24 24">
		<path
			fill="#4285F4"
			d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
		/>
		<path
			fill="#34A853"
			d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
		/>
		<path
			fill="#FBBC05"
			d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
		/>
		<path
			fill="#EA4335"
			d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
		/>
	</svg>
);

function AuthPage() {
	const [step, setStep] = useState<AuthStep>("initial");
	const [loading, setLoading] = useState(true);
	const [actionLoading, setActionLoading] = useState(false);
	const [error, setError] = useState<string>("");
	const [success, setSuccess] = useState<string>("");
	const [showResendVerification, setShowResendVerification] = useState(false);

	// Form fields
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [passwordConfirm, setPasswordConfirm] = useState("");
	const [username, setUsername] = useState("");
	const [acceptTerms, setAcceptTerms] = useState(false);
	const [acceptNewsletter, setAcceptNewsletter] = useState(false);

	// User data
	const [user, setUser] = useState<User | null>(null);

	// Pending Google registration (user created but terms not yet accepted)
	const [pendingGoogleUser, setPendingGoogleUser] = useState<User | null>(null);
	const [pendingGoogleToken, setPendingGoogleToken] = useState<string | null>(
		null,
	);

	// Check if already authenticated on mount
	useEffect(() => {
		checkAuth();
	}, []);

	const checkAuth = async () => {
		try {
			const authState = await getAuthState();
			if (authState.isAuthenticated && authState.user) {
				setUser(authState.user);
				// Check if onboarding is needed (terms + username)
				if (needsOnboarding(authState.user)) {
					setStep("onboarding");
				} else {
					setStep("success");
					setTimeout(() => window.close(), 2000);
				}
			}
		} catch (error) {
			console.error("Auth check failed:", error);
		} finally {
			setLoading(false);
		}
	};

	const resetForm = () => {
		setEmail("");
		setPassword("");
		setPasswordConfirm("");
		setUsername("");
		setAcceptTerms(false);
		setAcceptNewsletter(false);
		setError("");
		setSuccess("");
		setShowResendVerification(false);
	};

	const goToInitial = () => {
		resetForm();
		setStep("initial");
	};

	// ============ INITIAL STEP HANDLERS ============

	const handleGoogleClick = async () => {
		setActionLoading(true);
		setError("");

		try {
			const result = await loginWithGoogleInTab();

			if (!result.success) {
				setError(result.error || "Google login failed");
				setActionLoading(false);
				return;
			}

			if (result.isNewUser && result.user && result.pendingToken) {
				// New user - save pending state and show onboarding screen
				setPendingGoogleUser(result.user);
				setPendingGoogleToken(result.pendingToken);
				setStep("onboarding");
				setActionLoading(false);
				return;
			}

			if (result.user) {
				setUser(result.user);
				// Check if onboarding is needed
				if (needsOnboarding(result.user)) {
					setStep("onboarding");
				} else {
					setStep("success");
					setTimeout(() => window.close(), 2000);
				}
			}
		} catch (error: any) {
			setError(error?.message || "Google login failed");
		}

		setActionLoading(false);
	};

	const handleEmailContinue = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");
		// Always show login first - user can switch to register if needed
		setStep("email-login");
	};

	// ============ EMAIL LOGIN HANDLERS ============

	const handleEmailLogin = async (e: React.FormEvent) => {
		e.preventDefault();
		setActionLoading(true);
		setError("");
		setShowResendVerification(false);

		const result = await login(email, password);

		if (result.success && result.user) {
			setUser(result.user);
			// Check if onboarding is needed
			if (needsOnboarding(result.user)) {
				setStep("onboarding");
			} else {
				setStep("success");
				setTimeout(() => window.close(), 2000);
			}
		} else {
			setError(result.error || "Login failed");
			if (result.needsVerification) {
				setShowResendVerification(true);
			}
		}

		setActionLoading(false);
	};

	const handleResendVerification = async () => {
		setActionLoading(true);
		setError("");
		setSuccess("");

		const result = await resendVerificationEmail(email);

		if (result.success) {
			setSuccess("Verification email sent! Please check your inbox.");
			setShowResendVerification(false);
		} else {
			setError(result.error || "Failed to send verification email");
		}

		setActionLoading(false);
	};

	// ============ EMAIL REGISTRATION HANDLERS ============

	const handleEmailRegister = async (e: React.FormEvent) => {
		e.preventDefault();
		setActionLoading(true);
		setError("");
		setSuccess("");

		if (password !== passwordConfirm) {
			setError("Passwords do not match");
			setActionLoading(false);
			return;
		}

		if (!acceptTerms) {
			setError("You must accept the Terms of Service and Privacy Policy");
			setActionLoading(false);
			return;
		}

		// Generate a temporary username - user will set it up later
		const tempUsername = `user_${Math.random().toString(36).substring(2, 8)}`;

		const result = await register(
			email,
			tempUsername,
			password,
			passwordConfirm,
		);

		if (result.success) {
			// Subscribe to newsletter if user opted in
			if (acceptNewsletter) {
				await subscribeToNewsletter(email);
			}
			setStep("verify-email");
		} else {
			setError(result.error || "Registration failed");
		}

		setActionLoading(false);
	};

	// ============ FORGOT PASSWORD HANDLERS ============

	const handleForgotPassword = async (e: React.FormEvent) => {
		e.preventDefault();
		setActionLoading(true);
		setError("");
		setSuccess("");

		const result = await requestPasswordReset(email);

		if (result.success) {
			setSuccess(
				"If an account with this email exists, a password reset email has been sent! Please check your inbox and the spam folder.",
			);
			setTimeout(() => {
				resetForm();
				setStep("initial");
			}, 3000);
		} else {
			setError(result.error || "Failed to send reset email");
		}

		setActionLoading(false);
	};

	// ============ RENDER ============

	if (loading) {
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center">
				<div className="text-gray-600">Loading...</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
			<div className="bg-white w-full max-w-md p-8 rounded-2xl shadow-lg">
				{/* Header */}
				<div className="flex items-center justify-center gap-2 mb-6">
					<img src="/icon/128.png" alt="WatchThis" className="w-10 h-10" />
					<h1 className="text-3xl font-bold text-gray-800">
						<span className="text-primary-500">Watch</span>This
					</h1>
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

				{/* Resend Verification Button */}
				{showResendVerification && (
					<button
						type="button"
						onClick={handleResendVerification}
						disabled={actionLoading}
						className="w-full mb-4 bg-yellow-500 hover:bg-yellow-600 disabled:bg-yellow-300 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm"
					>
						{actionLoading ? "Sending..." : "Resend Verification Email"}
					</button>
				)}

				{/* ============ INITIAL STEP ============ */}
				{step === "initial" && (
					<div className="space-y-4">
						{/* Google Button */}
						<button
							type="button"
							onClick={handleGoogleClick}
							disabled={actionLoading}
							className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 hover:bg-gray-50 disabled:bg-gray-100 text-gray-700 font-medium py-3 px-4 rounded-lg transition-colors"
						>
							<GoogleIcon />
							{actionLoading ? "Please wait..." : "Continue with Google"}
						</button>

						{/* Divider */}
						<div className="relative my-4">
							<div className="absolute inset-0 flex items-center">
								<div className="w-full border-t border-gray-300"></div>
							</div>
							<div className="relative flex justify-center text-sm">
								<span className="px-2 bg-white text-gray-500">or</span>
							</div>
						</div>

						{/* Email Input */}
						<form onSubmit={handleEmailContinue} className="space-y-4">
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">
									Continue with your Email Address
								</label>
								<input
									type="email"
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									required
									className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
									placeholder="your@email.com"
								/>
							</div>

							<button
								type="submit"
								disabled={actionLoading || !email}
								className="w-full bg-primary-500 hover:bg-primary-600 disabled:bg-primary-300 text-white font-medium py-2 px-4 rounded-lg transition-colors"
							>
								Continue
							</button>
						</form>
					</div>
				)}

				{/* ============ EMAIL LOGIN STEP ============ */}
				{step === "email-login" && (
					<div className="space-y-4">
						<p className="text-sm text-gray-600 text-center">
							Hello there! Please enter your password for{" "}
							<strong>{email}</strong>
						</p>

						<form onSubmit={handleEmailLogin} className="space-y-4">
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">
									Password
								</label>
								<input
									type="password"
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									required
									className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
									placeholder="Enter your password"
									autoFocus
								/>
								<button
									type="button"
									onClick={() => setStep("forgot-password")}
									className="mt-1 text-xs font-light italic ml-1 text-primary-500 hover:cursor-pointer hover:text-primary-600"
								>
									Forgot password?
								</button>
							</div>

							<button
								type="submit"
								disabled={actionLoading}
								className="w-full bg-primary-500 hover:bg-primary-600 disabled:bg-primary-300 text-white font-medium py-2 px-4 rounded-lg transition-colors"
							>
								{actionLoading ? "Logging in..." : "Login"}
							</button>
						</form>

						{/* Register link */}
						<div className="text-center text-sm">
							<span className="text-gray-600">Don't have an account? </span>
							<button
								type="button"
								onClick={() => {
									setError("");
									setStep("email-register");
								}}
								className="text-primary-500 font-medium hover:underline"
							>
								Sign up
							</button>
						</div>

						<button
							type="button"
							onClick={goToInitial}
							className="w-full text-sm text-gray-500 hover:text-gray-700 text-center"
						>
							← Back
						</button>
					</div>
				)}

				{/* ============ EMAIL REGISTER STEP ============ */}
				{step === "email-register" && (
					<div className="space-y-4">
						<p className="text-sm text-gray-600 text-center">
							Create your account for <strong>{email}</strong>
						</p>

						<form onSubmit={handleEmailRegister} className="space-y-4">
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">
									Password
								</label>
								<input
									type="password"
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									required
									minLength={8}
									className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
									placeholder="Min. 8 characters"
									autoFocus
								/>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">
									Confirm Password
								</label>
								<input
									type="password"
									value={passwordConfirm}
									onChange={(e) => setPasswordConfirm(e.target.value)}
									required
									minLength={8}
									className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
									placeholder="Confirm your password"
								/>
							</div>

							{/* Terms Checkbox */}
							<div className="flex items-start gap-2">
								<input
									type="checkbox"
									id="accept-terms"
									checked={acceptTerms}
									onChange={(e) => setAcceptTerms(e.target.checked)}
									className="mt-1 w-4 h-4 text-primary-500 border-gray-300 rounded focus:ring-2 focus:ring-primary-500"
								/>
								<label htmlFor="accept-terms" className="text-sm text-gray-700">
									I have read and agree to the{" "}
									<a
										href="https://watch-this.app/datenschutz/"
										className="text-primary-500 hover:text-primary-600 underline"
										onClick={(e) => {
											e.preventDefault();
											openInNewTab("https://watch-this.app/datenschutz/");
										}}
									>
										Privacy Policy
									</a>
								</label>
							</div>

							{/* Newsletter Checkbox */}
							<div className="flex items-start gap-2">
								<input
									type="checkbox"
									id="accept-newsletter"
									checked={acceptNewsletter}
									onChange={(e) => setAcceptNewsletter(e.target.checked)}
									className="mt-1 w-4 h-4 text-primary-500 border-gray-300 rounded focus:ring-2 focus:ring-primary-500"
								/>
								<label
									htmlFor="accept-newsletter"
									className="text-sm text-gray-700"
								>
									Subscribe to my newsletter (optional)
								</label>
							</div>

							<button
								type="submit"
								disabled={actionLoading || !acceptTerms}
								className="w-full bg-primary-500 hover:bg-primary-600 disabled:bg-primary-300 text-white font-medium py-2 px-4 rounded-lg transition-colors"
							>
								{actionLoading ? "Creating account..." : "Create Account"}
							</button>
						</form>

						{/* Login link */}
						<div className="text-center text-sm">
							<span className="text-gray-600">Already have an account? </span>
							<button
								type="button"
								onClick={() => {
									setError("");
									setStep("email-login");
								}}
								className="text-primary-500 font-medium hover:underline"
							>
								Login
							</button>
						</div>

						<button
							type="button"
							onClick={goToInitial}
							className="w-full text-sm text-gray-500 hover:text-gray-700 text-center"
						>
							← Back
						</button>
					</div>
				)}

				{/* ============ ONBOARDING STEP ============ */}
				{step === "onboarding" && (
					<div className="space-y-4">
						<div className="text-center">
							<div className="text-4xl mb-2">👋</div>
							<h2 className="text-xl font-semibold text-gray-800">
								Welcome to WatchThis!
							</h2>
							<p className="text-sm text-gray-600 mt-2">
								Set up your account to get started.
							</p>
						</div>

						{/* Username Input */}
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">
								Choose a Username
							</label>
							<input
								type="text"
								value={username}
								onChange={(e) => setUsername(e.target.value)}
								minLength={3}
								pattern="^[a-zA-Z0-9_]+$"
								className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
								placeholder="Your username"
								autoFocus
							/>
							<p className="text-xs text-gray-500 mt-1">
								Only letters, numbers, and underscores. Min. 3 characters.
							</p>
						</div>

						{/* Terms Checkbox */}
						<div className="flex items-start gap-2">
							<input
								type="checkbox"
								id="onboarding-accept-terms"
								checked={acceptTerms}
								onChange={(e) => setAcceptTerms(e.target.checked)}
								className="mt-1 w-4 h-4 text-primary-500 border-gray-300 rounded focus:ring-2 focus:ring-primary-500"
							/>
							<label
								htmlFor="onboarding-accept-terms"
								className="text-sm text-gray-700"
							>
								I have read and agree to the{" "}
								<a
									href="https://watch-this.app/datenschutz/"
									className="text-primary-500 hover:text-primary-600 underline"
									onClick={(e) => {
										e.preventDefault();
										openInNewTab("https://watch-this.app/datenschutz/");
									}}
								>
									Privacy Policy
								</a>
							</label>
						</div>

						{/* Newsletter Checkbox */}
						<div className="flex items-start gap-2">
							<input
								type="checkbox"
								id="onboarding-newsletter"
								checked={acceptNewsletter}
								onChange={(e) => setAcceptNewsletter(e.target.checked)}
								className="mt-1 w-4 h-4 text-primary-500 border-gray-300 rounded focus:ring-2 focus:ring-primary-500"
							/>
							<label
								htmlFor="onboarding-newsletter"
								className="text-sm text-gray-700"
							>
								Subscribe to my newsletter (optional)
							</label>
						</div>

						<button
							type="button"
							onClick={async () => {
								// Validation
								if (username.length < 3) {
									setError("Username must be at least 3 characters");
									return;
								}
								if (!/^[a-zA-Z0-9_]+$/.test(username)) {
									setError(
										"Username can only contain letters, numbers, and underscores",
									);
									return;
								}
								if (!acceptTerms) {
									setError("You must accept the Privacy Policy to continue");
									return;
								}

								setActionLoading(true);
								setError("");

								// If this is a new Google user, confirm registration first
								if (pendingGoogleUser && pendingGoogleToken) {
									const confirmResult = await confirmGoogleRegistration(
										pendingGoogleToken,
										pendingGoogleUser,
									);

									if (!confirmResult.success) {
										setError(confirmResult.error || "Failed to create account");
										setActionLoading(false);
										return;
									}

									// Clear pending state
									setPendingGoogleUser(null);
									setPendingGoogleToken(null);
								}

								// Complete onboarding (terms + username)
								const result = await completeOnboarding(username);

								if (result.success && result.user) {
									setUser(result.user);

									// Subscribe to newsletter if user opted in
									if (acceptNewsletter && result.user.email) {
										await subscribeToNewsletter(result.user.email);
									}

									setStep("success");
									setTimeout(() => window.close(), 2000);
								} else {
									setError(result.error || "Failed to complete setup");
								}

								setActionLoading(false);
							}}
							disabled={actionLoading || username.length < 3 || !acceptTerms}
							className="w-full bg-primary-500 hover:bg-primary-600 disabled:bg-primary-300 text-white font-medium py-3 px-4 rounded-lg transition-colors"
						>
							{actionLoading ? "Please wait..." : "Get Started"}
						</button>

						{pendingGoogleUser && (
							<button
								type="button"
								onClick={goToInitial}
								className="w-full text-sm text-gray-500 hover:text-gray-700 text-center"
							>
								← Back
							</button>
						)}
					</div>
				)}

				{/* ============ VERIFY EMAIL STEP ============ */}
				{step === "verify-email" && (
					<div className="space-y-4 text-center">
						<h2 className="text-xl font-semibold text-gray-800">
							Check your inbox!
						</h2>
						<p className="text-sm text-gray-600">
							We've sent a verification email to <strong>{email}</strong>.
							<br></br>
							Please click the link in the email to activate your account.
						</p>
						<p className="text-sm text-gray-500 italic">
							Don't forget to check your spam folder!
						</p>

						<button
							type="button"
							onClick={() => setStep("email-login")}
							className="w-full mt-4 bg-primary-500 hover:bg-primary-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
						>
							Back to Login
						</button>
					</div>
				)}

				{/* ============ SUCCESS STEP ============ */}
				{step === "success" && (
					<div className="space-y-4 text-center">
						<div className="text-5xl mb-4">🎉</div>
						<h2 className="text-xl font-semibold text-gray-800">
							You're all set!
						</h2>
						<p className="text-sm text-gray-600">
							This tab will close automatically. You can now use WatchThis from
							the extension icon.
						</p>
					</div>
				)}

				{/* ============ FORGOT PASSWORD STEP ============ */}
				{step === "forgot-password" && (
					<div className="space-y-4">
						<p className="text-sm text-gray-600 text-center">
							Enter your email address and we'll send you a link to reset your
							password.
						</p>

						<form onSubmit={handleForgotPassword} className="space-y-4">
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">
									Email
								</label>
								<input
									type="email"
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									required
									className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
									placeholder="your@email.com"
								/>
							</div>

							<button
								type="submit"
								disabled={actionLoading}
								className="w-full bg-primary-500 hover:bg-primary-600 disabled:bg-primary-300 text-white font-medium py-2 px-4 rounded-lg transition-colors"
							>
								{actionLoading ? "Sending..." : "Send Reset Link"}
							</button>
						</form>

						<button
							type="button"
							onClick={() => setStep("email-login")}
							className="w-full text-sm text-gray-500 hover:text-gray-700 text-center"
						>
							← Back to login
						</button>
					</div>
				)}
			</div>
		</div>
	);
}

ReactDOM.createRoot(document.getElementById("root")!).render(
	<React.StrictMode>
		<AuthPage />
	</React.StrictMode>,
);
