import { z } from "zod";

/** Standard API success envelope */
export const ApiSuccessSchema = <T extends z.ZodTypeAny>(data: T) =>
	z.object({
		ok: z.literal(true),
		data,
	});

/** Standard API error envelope */
export const ApiErrorSchema = z.object({
	ok: z.literal(false),
	error: z.object({
		code: z.string(),
		message: z.string(),
		details: z.record(z.unknown()).optional(),
	}),
});

/** Pagination query params */
export const PaginationSchema = z.object({
	page: z.coerce.number().int().min(1).default(1),
	limit: z.coerce.number().int().min(1).max(100).default(20),
});

/** Standard paginated response metadata */
export const PaginatedMetaSchema = z.object({
	page: z.number(),
	limit: z.number(),
	total: z.number(),
	totalPages: z.number(),
});

/** UUID param */
export const UuidParamSchema = z.object({
	id: z.string().uuid(),
});

export type Pagination = z.infer<typeof PaginationSchema>;
export type PaginatedMeta = z.infer<typeof PaginatedMetaSchema>;
