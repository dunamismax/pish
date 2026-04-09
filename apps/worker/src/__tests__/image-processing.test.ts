import { afterEach, describe, expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import sharp from "sharp";
import {
	getProcessedImagePaths,
	processImageFile,
	resolveJobPhotoPath,
} from "../lib/image-processing";

const tempDirs: string[] = [];

afterEach(async () => {
	while (tempDirs.length > 0) {
		const dir = tempDirs.pop();
		if (dir) {
			await rm(dir, { recursive: true, force: true });
		}
	}
});

describe("image processing", () => {
	test("resolves file urls and skips remote urls", () => {
		expect(resolveJobPhotoPath("file:///tmp/bird.jpg")).toBe("/tmp/bird.jpg");
		expect(resolveJobPhotoPath("https://example.com/bird.jpg")).toBeNull();
		expect(resolveJobPhotoPath("/tmp/bird.jpg")).toBe("/tmp/bird.jpg");
	});

	test("derives processed output paths next to the source image", () => {
		const paths = getProcessedImagePaths("/tmp/sightings/roseate-spoonbill.heic");
		expect(paths.optimizedPath).toBe("/tmp/sightings/processed/roseate-spoonbill.webp");
		expect(paths.thumbnailPath).toBe("/tmp/sightings/processed/roseate-spoonbill.thumb.webp");
	});

	test("creates optimized and thumbnail webp variants", async () => {
		const dir = await mkdtemp(join(tmpdir(), "pish-image-test-"));
		tempDirs.push(dir);

		const sourcePath = join(dir, "bird.png");
		await sharp({
			create: {
				width: 800,
				height: 600,
				channels: 3,
				background: { r: 32, g: 64, b: 96 },
			},
		})
			.png()
			.toFile(sourcePath);

		const result = await processImageFile(sourcePath);
		const optimized = await sharp(result.optimizedPath).metadata();
		const thumbnail = await sharp(result.thumbnailPath).metadata();

		expect(optimized.format).toBe("webp");
		expect(thumbnail.format).toBe("webp");
		expect((thumbnail.width ?? 0) <= 300).toBe(true);
		expect((thumbnail.height ?? 0) <= 300).toBe(true);
	});
});
