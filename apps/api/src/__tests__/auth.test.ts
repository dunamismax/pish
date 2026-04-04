import { describe, expect, test } from "bun:test";
import { hashPassword, verifyPassword } from "../lib/password";
import { generateToken, hashToken } from "../lib/tokens";

describe("password hashing", () => {
	test("hashes and verifies a password", async () => {
		const password = "testpassword123";
		const hashed = await hashPassword(password);

		expect(hashed).not.toBe(password);
		expect(hashed.length).toBeGreaterThan(0);

		const valid = await verifyPassword(hashed, password);
		expect(valid).toBe(true);
	});

	test("rejects wrong password", async () => {
		const hashed = await hashPassword("correct-password");
		const valid = await verifyPassword(hashed, "wrong-password");
		expect(valid).toBe(false);
	});

	test("produces different hashes for same password", async () => {
		const password = "testpassword123";
		const hash1 = await hashPassword(password);
		const hash2 = await hashPassword(password);
		expect(hash1).not.toBe(hash2); // argon2 uses random salt
	});
});

describe("token generation", () => {
	test("generates token with raw and hash", async () => {
		const { raw, hash } = await generateToken();

		expect(raw.length).toBeGreaterThan(0);
		expect(hash.length).toBe(64); // SHA-256 hex = 64 chars
		expect(raw).not.toBe(hash);
	});

	test("hashing same raw token produces same hash", async () => {
		const { raw, hash } = await generateToken();
		const rehash = await hashToken(raw);
		expect(rehash).toBe(hash);
	});

	test("different tokens produce different hashes", async () => {
		const token1 = await generateToken();
		const token2 = await generateToken();
		expect(token1.hash).not.toBe(token2.hash);
		expect(token1.raw).not.toBe(token2.raw);
	});
});
