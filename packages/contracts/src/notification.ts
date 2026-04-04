import { z } from "zod";

export const NotificationSchema = z.object({
	id: z.string().uuid(),
	userId: z.string().uuid(),
	type: z.string(),
	title: z.string(),
	body: z.string(),
	data: z.record(z.unknown()),
	read: z.boolean(),
	createdAt: z.string().datetime(),
});

export type Notification = z.infer<typeof NotificationSchema>;
