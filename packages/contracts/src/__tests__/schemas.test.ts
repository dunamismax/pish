import { describe, expect, test } from "bun:test";
import {
	AccountStatusSchema,
	CurrentUserSchema,
	ForgotPasswordSchema,
	OAuthProviderSchema,
	PaginationSchema,
	ResetPasswordSchema,
	SignInSchema,
	SignUpSchema,
	SpeciesFrequencySchema,
	SpeciesSchema,
	SpeciesSearchQuerySchema,
	UpdateProfileSchema,
	UsernameRulesSchema,
	UserRoleSchema,
	VerifyEmailSchema,
} from "../index";

describe("SignUpSchema", () => {
	test("accepts valid input", () => {
		const result = SignUpSchema.safeParse({
			email: "birder@example.com",
			username: "birder42",
			password: "securepass123",
		});
		expect(result.success).toBe(true);
	});

	test("rejects short username", () => {
		const result = SignUpSchema.safeParse({
			email: "birder@example.com",
			username: "ab",
			password: "securepass123",
		});
		expect(result.success).toBe(false);
	});

	test("rejects invalid username characters", () => {
		const result = SignUpSchema.safeParse({
			email: "birder@example.com",
			username: "birder with spaces",
			password: "securepass123",
		});
		expect(result.success).toBe(false);
	});

	test("rejects short password", () => {
		const result = SignUpSchema.safeParse({
			email: "birder@example.com",
			username: "birder42",
			password: "short",
		});
		expect(result.success).toBe(false);
	});
});

describe("SignInSchema", () => {
	test("accepts valid input", () => {
		const result = SignInSchema.safeParse({
			email: "birder@example.com",
			password: "securepass123",
		});
		expect(result.success).toBe(true);
	});

	test("rejects invalid email", () => {
		const result = SignInSchema.safeParse({
			email: "not-an-email",
			password: "securepass123",
		});
		expect(result.success).toBe(false);
	});
});

describe("ForgotPasswordSchema", () => {
	test("accepts valid email", () => {
		const result = ForgotPasswordSchema.safeParse({ email: "birder@example.com" });
		expect(result.success).toBe(true);
	});

	test("rejects invalid email", () => {
		const result = ForgotPasswordSchema.safeParse({ email: "invalid" });
		expect(result.success).toBe(false);
	});
});

describe("ResetPasswordSchema", () => {
	test("accepts valid input", () => {
		const result = ResetPasswordSchema.safeParse({
			token: "valid-token",
			password: "newsecurepass",
		});
		expect(result.success).toBe(true);
	});

	test("rejects short password", () => {
		const result = ResetPasswordSchema.safeParse({
			token: "valid-token",
			password: "short",
		});
		expect(result.success).toBe(false);
	});
});

describe("VerifyEmailSchema", () => {
	test("accepts valid token", () => {
		expect(VerifyEmailSchema.safeParse({ token: "abc123" }).success).toBe(true);
	});

	test("rejects empty token", () => {
		expect(VerifyEmailSchema.safeParse({ token: "" }).success).toBe(false);
	});
});

describe("OAuthProviderSchema", () => {
	test("accepts google and apple", () => {
		expect(OAuthProviderSchema.safeParse("google").success).toBe(true);
		expect(OAuthProviderSchema.safeParse("apple").success).toBe(true);
	});

	test("rejects unknown provider", () => {
		expect(OAuthProviderSchema.safeParse("facebook").success).toBe(false);
	});
});

describe("PaginationSchema", () => {
	test("uses defaults", () => {
		const result = PaginationSchema.parse({});
		expect(result.page).toBe(1);
		expect(result.limit).toBe(20);
	});

	test("coerces string values", () => {
		const result = PaginationSchema.parse({ page: "3", limit: "50" });
		expect(result.page).toBe(3);
		expect(result.limit).toBe(50);
	});
});

describe("UserRoleSchema", () => {
	test("accepts valid roles", () => {
		for (const role of ["god", "admin", "regional_mod", "trusted", "user", "new_user", "banned"]) {
			expect(UserRoleSchema.safeParse(role).success).toBe(true);
		}
	});

	test("rejects invalid role", () => {
		expect(UserRoleSchema.safeParse("superadmin").success).toBe(false);
	});
});

describe("AccountStatusSchema", () => {
	test("accepts valid statuses", () => {
		expect(AccountStatusSchema.safeParse("active").success).toBe(true);
		expect(AccountStatusSchema.safeParse("banned").success).toBe(true);
		expect(AccountStatusSchema.safeParse("new_user").success).toBe(true);
	});

	test("rejects invalid status", () => {
		expect(AccountStatusSchema.safeParse("suspended").success).toBe(false);
	});
});

describe("CurrentUserSchema", () => {
	test("accepts valid user", () => {
		const result = CurrentUserSchema.safeParse({
			id: "550e8400-e29b-41d4-a716-446655440000",
			email: "birder@example.com",
			username: "birder42",
			displayName: "Birder Bob",
			role: "user",
			accountStatus: "active",
			emailVerified: true,
			avatarUrl: null,
		});
		expect(result.success).toBe(true);
	});

	test("accepts null displayName", () => {
		const result = CurrentUserSchema.safeParse({
			id: "550e8400-e29b-41d4-a716-446655440000",
			email: "birder@example.com",
			username: "birder42",
			displayName: null,
			role: "new_user",
			accountStatus: "new_user",
			emailVerified: false,
			avatarUrl: null,
		});
		expect(result.success).toBe(true);
	});
});

describe("SpeciesSchema", () => {
	test("accepts valid species", () => {
		const result = SpeciesSchema.safeParse({
			id: "550e8400-e29b-41d4-a716-446655440000",
			speciesCode: "baleag",
			commonName: "Bald Eagle",
			scientificName: "Haliaeetus leucocephalus",
			familyCommonName: "Hawks, Eagles, and Kites",
			familyScientificName: "Accipitridae",
			order: "Accipitriformes",
			category: "species",
			taxonOrder: 3672,
		});
		expect(result.success).toBe(true);
	});

	test("allows nullable optional fields", () => {
		const result = SpeciesSchema.safeParse({
			id: "550e8400-e29b-41d4-a716-446655440000",
			speciesCode: "baleag",
			commonName: "Bald Eagle",
			scientificName: "Haliaeetus leucocephalus",
		});
		expect(result.success).toBe(true);
	});
});

describe("SpeciesSearchQuerySchema", () => {
	test("accepts valid query", () => {
		const result = SpeciesSearchQuerySchema.safeParse({ q: "eagle", limit: "5" });
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.limit).toBe(5);
		}
	});

	test("uses default limit", () => {
		const result = SpeciesSearchQuerySchema.safeParse({ q: "eagle" });
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.limit).toBe(10);
		}
	});

	test("rejects empty query", () => {
		const result = SpeciesSearchQuerySchema.safeParse({ q: "" });
		expect(result.success).toBe(false);
	});
});

describe("SpeciesFrequencySchema", () => {
	test("accepts valid frequency", () => {
		const result = SpeciesFrequencySchema.safeParse({
			month: 3,
			frequency: 0.45,
			sampleSize: 120,
		});
		expect(result.success).toBe(true);
	});

	test("rejects invalid month", () => {
		expect(
			SpeciesFrequencySchema.safeParse({ month: 0, frequency: 0.5, sampleSize: null }).success,
		).toBe(false);
		expect(
			SpeciesFrequencySchema.safeParse({ month: 13, frequency: 0.5, sampleSize: null }).success,
		).toBe(false);
	});

	test("rejects frequency out of range", () => {
		expect(
			SpeciesFrequencySchema.safeParse({ month: 1, frequency: -0.1, sampleSize: null }).success,
		).toBe(false);
		expect(
			SpeciesFrequencySchema.safeParse({ month: 1, frequency: 1.1, sampleSize: null }).success,
		).toBe(false);
	});
});

describe("UsernameRulesSchema", () => {
	test("accepts valid usernames", () => {
		expect(UsernameRulesSchema.safeParse("birder42").success).toBe(true);
		expect(UsernameRulesSchema.safeParse("sw-florida-birder").success).toBe(true);
		expect(UsernameRulesSchema.safeParse("Bob_the_Birder").success).toBe(true);
	});

	test("rejects username starting with special char", () => {
		expect(UsernameRulesSchema.safeParse("-birder").success).toBe(false);
		expect(UsernameRulesSchema.safeParse("_birder").success).toBe(false);
	});

	test("rejects username ending with special char", () => {
		expect(UsernameRulesSchema.safeParse("birder-").success).toBe(false);
		expect(UsernameRulesSchema.safeParse("birder_").success).toBe(false);
	});
});

describe("UpdateProfileSchema", () => {
	test("accepts partial update", () => {
		const result = UpdateProfileSchema.safeParse({ displayName: "Bob" });
		expect(result.success).toBe(true);
	});

	test("accepts empty object", () => {
		const result = UpdateProfileSchema.safeParse({});
		expect(result.success).toBe(true);
	});

	test("rejects too long bio", () => {
		const result = UpdateProfileSchema.safeParse({ bio: "x".repeat(501) });
		expect(result.success).toBe(false);
	});
});
