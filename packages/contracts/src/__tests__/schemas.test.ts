import { describe, expect, test } from "bun:test";
import { PaginationSchema, SignInSchema, SignUpSchema, UserRoleSchema } from "../index";

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
