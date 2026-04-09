import type { Job } from "bullmq";
import { processImageFile, resolveJobPhotoPath } from "../lib/image-processing";

interface ImageProcessingData {
	sightingId: string;
	photoUrls: string[];
}

/**
 * Process sighting photos:
 * - Generate thumbnails
 * - Convert to WebP
 * - Strip EXIF data for privacy
 */
export async function processImages(job: Job): Promise<void> {
	const data: ImageProcessingData = job.data;
	console.log(
		`[image-processing] processing ${data.photoUrls.length} images for sighting ${data.sightingId}`,
	);

	for (const url of data.photoUrls) {
		const photoPath = resolveJobPhotoPath(url);
		if (!photoPath) {
			console.warn(`[image-processing] skipping non-local image source: ${url}`);
			continue;
		}

		try {
			const result = await processImageFile(photoPath);
			console.log(
				`[image-processing] processed: ${url} -> ${result.optimizedPath}, ${result.thumbnailPath}`,
			);
		} catch (err) {
			console.error(`[image-processing] failed to process ${url}:`, err);
		}
	}

	console.log(`[image-processing] completed for sighting ${data.sightingId}`);
}
