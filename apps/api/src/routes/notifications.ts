import { Elysia, t } from "elysia";
import { sql } from "../lib/db";
import { sessionMiddleware } from "../middleware/auth";

export const notificationRoutes = new Elysia({ prefix: "/api/notifications" })
	.use(sessionMiddleware)

	// ─── Get Notifications ───────────────────────────────────────
	.get(
		"/",
		async ({ query, user, set }) => {
			if (!user) {
				set.status = 401;
				return { ok: false, error: { code: "UNAUTHORIZED", message: "Authentication required" } };
			}

			const page = query.page || 1;
			const limit = query.limit || 20;
			const offset = (page - 1) * limit;

			const countRows = await sql`
				SELECT COUNT(*)::int AS total FROM notifications WHERE user_id = ${user.id}
			`;
			const total = countRows[0].total;

			const rows = await sql`
				SELECT * FROM notifications
				WHERE user_id = ${user.id}
				ORDER BY created_at DESC
				LIMIT ${limit} OFFSET ${offset}
			`;

			const unreadRows = await sql`
				SELECT COUNT(*)::int AS cnt FROM notifications
				WHERE user_id = ${user.id} AND NOT read
			`;

			return {
				ok: true,
				data: rows.map((r) => ({
					id: r.id,
					userId: r.user_id,
					type: r.type,
					title: r.title,
					body: r.body,
					data: r.data ?? {},
					read: r.read,
					createdAt: (r.created_at as Date).toISOString(),
				})),
				meta: {
					page,
					limit,
					total,
					totalPages: Math.ceil(total / limit),
					unreadCount: unreadRows[0].cnt,
				},
			};
		},
		{
			query: t.Object({
				page: t.Optional(t.Numeric({ minimum: 1, default: 1 })),
				limit: t.Optional(t.Numeric({ minimum: 1, maximum: 100, default: 20 })),
			}),
		},
	)

	// ─── Mark Notification as Read ───────────────────────────────
	.patch(
		"/:id/read",
		async ({ params, user, set }) => {
			if (!user) {
				set.status = 401;
				return { ok: false, error: { code: "UNAUTHORIZED", message: "Authentication required" } };
			}

			const rows = await sql`
				UPDATE notifications
				SET read = TRUE
				WHERE id = ${params.id} AND user_id = ${user.id}
				RETURNING id
			`;

			if (rows.length === 0) {
				set.status = 404;
				return { ok: false, error: { code: "NOT_FOUND", message: "Notification not found" } };
			}

			return { ok: true, data: { read: true } };
		},
		{
			params: t.Object({
				id: t.String({ format: "uuid" }),
			}),
		},
	);
