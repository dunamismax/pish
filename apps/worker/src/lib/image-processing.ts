import { mkdir } from "node:fs/promises";
import { basename, dirname, extname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

export interface ProcessedImagePaths {
	optimizedPath: string;
	thumbnailPath: string;
}

export function resolveJobPhotoPath(input: string): string | null {
	if (input.startsWith("file://")) {
		return fileURLToPath(input);
	}

	if (/^https?:\/\//.test(input)) {
		return null;
	}

	return input;
}

export function getProcessedImagePaths(sourcePath: string): ProcessedImagePaths {
	const sourceDir = dirname(sourcePath);
	const sourceName = basename(sourcePath, extname(sourcePath));
	const outputDir = join(sourceDir, "processed");

	return {
		optimizedPath: join(outputDir, `${sourceName}.webp`),
		thumbnailPath: join(outputDir, `${sourceName}.thumb.webp`),
	};
}

export async function processImageFile(sourcePath: string): Promise<ProcessedImagePaths> {
	const paths = getProcessedImagePaths(sourcePath);
	await mkdir(dirname(paths.optimizedPath), { recursive: true });

	await sharp(sourcePath).rotate().webp({ quality: 82 }).toFile(paths.optimizedPath);
	await sharp(sourcePath)
		.rotate()
		.resize({ width: 300, height: 300, fit: "cover", withoutEnlargement: true })
		.webp({ quality: 78 })
		.toFile(paths.thumbnailPath);

	return paths;
}
