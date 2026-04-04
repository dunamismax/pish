import { expect, test } from "@playwright/test";

test("landing page loads", async ({ page }) => {
	await page.goto("/");
	await expect(page).toHaveTitle(/Pish/);
	await expect(page.getByText("everything birding")).toBeVisible();
});

test("sign in page loads", async ({ page }) => {
	await page.goto("/signin");
	await expect(page.getByText("Sign in to Pish")).toBeVisible();
});

test("sign up page loads", async ({ page }) => {
	await page.goto("/signup");
	await expect(page.getByText("Create your Pish account")).toBeVisible();
});

test("API health check returns ok", async ({ request }) => {
	const response = await request.get("/api/health");
	expect(response.ok()).toBeTruthy();
	const body = await response.json();
	expect(body.ok).toBe(true);
	expect(body.service).toBe("pish-api");
});
