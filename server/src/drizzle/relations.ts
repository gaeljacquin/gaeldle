import { relations } from "drizzle-orm/relations";
import { levels, modes, categories, gotd, games, dailyStats, users, unlimitedStats, roles } from "./schema";

export const modesRelations = relations(modes, ({one, many}) => ({
	level: one(levels, {
		fields: [modes.levelId],
		references: [levels.id]
	}),
	category: one(categories, {
		fields: [modes.categoryId],
		references: [categories.id]
	}),
	gotds: many(gotd),
	dailyStats: many(dailyStats),
	unlimitedStats: many(unlimitedStats),
}));

export const levelsRelations = relations(levels, ({many}) => ({
	modes: many(modes),
}));

export const categoriesRelations = relations(categories, ({many}) => ({
	modes: many(modes),
}));

export const gotdRelations = relations(gotd, ({one, many}) => ({
	mode: one(modes, {
		fields: [gotd.modeId],
		references: [modes.id]
	}),
	game: one(games, {
		fields: [gotd.igdbId],
		references: [games.igdbId]
	}),
	dailyStats: many(dailyStats),
}));

export const gamesRelations = relations(games, ({many}) => ({
	gotds: many(gotd),
	unlimitedStats: many(unlimitedStats),
}));

export const dailyStatsRelations = relations(dailyStats, ({one}) => ({
	gotd: one(gotd, {
		fields: [dailyStats.gotdId],
		references: [gotd.id]
	}),
	mode: one(modes, {
		fields: [dailyStats.modeId],
		references: [modes.id]
	}),
	user: one(users, {
		fields: [dailyStats.userId],
		references: [users.id]
	}),
}));

export const usersRelations = relations(users, ({one, many}) => ({
	dailyStats: many(dailyStats),
	unlimitedStats: many(unlimitedStats),
	role: one(roles, {
		fields: [users.roleId],
		references: [roles.id]
	}),
}));

export const unlimitedStatsRelations = relations(unlimitedStats, ({one}) => ({
	game: one(games, {
		fields: [unlimitedStats.igdbId],
		references: [games.igdbId]
	}),
	mode: one(modes, {
		fields: [unlimitedStats.modeId],
		references: [modes.id]
	}),
	user: one(users, {
		fields: [unlimitedStats.userId],
		references: [users.id]
	}),
}));

export const rolesRelations = relations(roles, ({many}) => ({
	users: many(users),
}));