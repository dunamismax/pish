import { z } from "zod";

export const UserRoleSchema = z.enum([
	"god",
	"admin",
	"regional_mod",
	"trusted",
	"user",
	"new_user",
	"banned",
]);

export const AccountStatusSchema = z.enum(["active", "banned", "new_user"]);

export const UserProfileSchema = z.object({
	id: z.string().uuid(),
	username: z.string().min(3).max(30),
	displayName: z.string().min(1).max(100).nullable().optional(),
	email: z.string().email(),
	role: UserRoleSchema,
	accountStatus: AccountStatusSchema,
	emailVerified: z.boolean(),
	avatarUrl: z.string().url().nullable().optional(),
	bio: z.string().max(500).nullable().optional(),
	location: z.string().max(100).nullable().optional(),
	createdAt: z.string().datetime(),
});

export const PublicUserSchema = UserProfileSchema.pick({
	id: true,
	username: true,
	displayName: true,
	avatarUrl: true,
	bio: true,
	location: true,
	createdAt: true,
});

export const UpdateProfileSchema = z.object({
	displayName: z.string().min(1).max(100).optional(),
	bio: z.string().max(500).optional(),
	location: z.string().max(100).optional(),
});

export const UsernameRulesSchema = z
	.string()
	.min(3, "Username must be at least 3 characters")
	.max(30, "Username must be at most 30 characters")
	.regex(/^[a-zA-Z0-9_-]+$/, "Username may only contain letters, numbers, hyphens, and underscores")
	.refine((val) => !/^[-_]/.test(val), "Username must start with a letter or number")
	.refine((val) => !/[-_]$/.test(val), "Username must end with a letter or number");

export type UserRole = z.infer<typeof UserRoleSchema>;
export type AccountStatus = z.infer<typeof AccountStatusSchema>;
export type UserProfile = z.infer<typeof UserProfileSchema>;
export type PublicUser = z.infer<typeof PublicUserSchema>;
export type UpdateProfile = z.infer<typeof UpdateProfileSchema>;
