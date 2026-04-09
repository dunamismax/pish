import { Apple, Google } from "arctic";
import { env } from "./env";

export const google = new Google(
	env.GOOGLE_CLIENT_ID,
	env.GOOGLE_CLIENT_SECRET,
	`${env.BASE_URL}/api/auth/callback/google`,
);

/**
 * Apple OAuth requires more configuration (team ID, key ID, private key).
 * Only initialize if all required values are present.
 */
function createAppleProvider(): Apple | null {
	if (!env.APPLE_CLIENT_ID || !env.APPLE_TEAM_ID || !env.APPLE_KEY_ID || !env.APPLE_PRIVATE_KEY) {
		return null;
	}

	const privateKeyBytes = new TextEncoder().encode(env.APPLE_PRIVATE_KEY);
	return new Apple(
		env.APPLE_CLIENT_ID,
		env.APPLE_TEAM_ID,
		env.APPLE_KEY_ID,
		privateKeyBytes,
		`${env.BASE_URL}/api/auth/callback/apple`,
	);
}

export const apple = createAppleProvider();
