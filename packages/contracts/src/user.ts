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
	displayName: z.string().min(1).max(100).optional(),
	email: z.string().email(),
	role: UserRoleSchema,
	accountStatus: AccountStatusSchema,
	avatarUrl: z.string().url().optional(),
	bio: z.string().max(500).optional(),
	location: z.string().max(100).optional(),
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

export type UserRole = z.infer<typeof UserRoleSchema>;
export type AccountStatus = z.infer<typeof AccountStatusSchema>;
export type UserProfile = z.infer<typeof UserProfileSchema>;
export type PublicUser = z.infer<typeof PublicUserSchema>;
