import { PostgresJsAdapter } from "@lucia-auth/adapter-postgresql";
import type { AccountStatus, UserRole } from "@pish/contracts";
import { Lucia } from "lucia";
import { sql } from "./db";
import { env } from "./env";

const adapter = new PostgresJsAdapter(sql, {
	user: "users",
	session: "sessions",
});

export const lucia = new Lucia(adapter, {
	sessionCookie: {
		attributes: {
			secure: env.NODE_ENV === "production",
			sameSite: "lax",
		},
	},
	getUserAttributes: (attributes) => {
		return {
			email: attributes.email,
			username: attributes.username,
			displayName: attributes.display_name,
			role: attributes.role,
			accountStatus: attributes.account_status,
			emailVerified: attributes.email_verified,
			avatarUrl: attributes.avatar_url,
		};
	},
});

declare module "lucia" {
	interface Register {
		Lucia: typeof lucia;
		DatabaseUserAttributes: DatabaseUserAttributes;
	}
}

interface DatabaseUserAttributes {
	email: string;
	username: string;
	display_name: string | null;
	role: UserRole;
	account_status: AccountStatus;
	email_verified: boolean;
	avatar_url: string | null;
}
