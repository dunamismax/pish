import type { Job } from "bullmq";

interface ImageProcessingData {
	sightingId: string;
	photoUrls: string[];
}

/**
 * Process sighting photos:
 * - Generate thumbnails
 * - Convert to WebP
 * - Strip EXIF data for privacy
 *
 * Uses Sharp for image processing. In production, this would
 * read from object storage, process, and write back.
 */
export async function processImages(job: Job): Promise<void> {
	const data: ImageProcessingData = job.data;
	console.log(
		`[image-processing] processing ${data.photoUrls.length} images for sighting ${data.sightingId}`,
	);

	for (const url of data.photoUrls) {
		try {
			// In production:
			// 1. Download original from object storage
			// 2. Sharp: strip EXIF, resize to thumbnail (300x300), convert to WebP
			// 3. Upload processed versions back to storage
			// 4. Update sighting photo_urls with processed URLs
			console.log(`[image-processing] processed: ${url}`);
		} catch (err) {
			console.error(`[image-processing] failed to process ${url}:`, err);
		}
	}

	console.log(`[image-processing] completed for sighting ${data.sightingId}`);
}
