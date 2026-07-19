import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { validateUserOwnership } from "./authHelpers";

const LEAGUES = ["Bronze", "Silver", "Gold", "Platinum", "Diamond"];

// ─── Get Leaderboard Standing for User's Current League ──────────────────────
export const getLeagueLeaderboard = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    await validateUserOwnership(ctx, args.userId);

    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    const userLeague = user.league ?? "Bronze";

    // Query all users in this league tier
    const rawUsers = await ctx.db
      .query("users")
      .withIndex("by_league_xp", (q) => q.eq("league", userLeague))
      .collect();

    // Fallback: if we just migrated, some users might have league undefined.
    // Query users with undefined league if userLeague is "Bronze".
    let leagueUsers = rawUsers;
    if (userLeague === "Bronze") {
      const undefinedLeagueUsers = await ctx.db
        .query("users")
        .collect();
      
      const filtered = undefinedLeagueUsers.filter(
        (u) => u.league === undefined || u.league === "Bronze"
      );
      
      // De-duplicate
      const ids = new Set(leagueUsers.map(u => u._id.toString()));
      filtered.forEach(u => {
        if (!ids.has(u._id.toString())) {
          leagueUsers.push(u);
        }
      });
    }

    // Sort by weeklyXp desc
    leagueUsers.sort((a, b) => (b.weeklyXp ?? 0) - (a.weeklyXp ?? 0));

    // Return mapped standings
    return leagueUsers.map((u, index) => ({
      _id: u._id,
      displayName: u.displayName,
      weeklyXp: u.weeklyXp ?? 0,
      streak: u.streak,
      rank: index + 1,
      isCurrentUser: u._id === args.userId,
      league: u.league ?? "Bronze",
    }));
  },
});

// ─── Process Weekly League Reset (Cron Triggered) ────────────────────────────
// Promotes top 20% (or min 3) of users to next tier, relegates bottom 20% (min 1) if above Bronze, resets weeklyXp.
export const processWeeklyLeagues = mutation({
  args: {},
  handler: async (ctx) => {
    const allUsers = await ctx.db.query("users").collect();

    // Group users by league
    const groups: Record<string, typeof allUsers> = {
      Bronze: [],
      Silver: [],
      Gold: [],
      Platinum: [],
      Diamond: [],
    };

    allUsers.forEach((u) => {
      const l = u.league ?? "Bronze";
      if (groups[l]) {
        groups[l].push(u);
      } else {
        groups["Bronze"].push(u); // Default fallback
      }
    });

    const now = Date.now();

    for (let i = 0; i < LEAGUES.length; i++) {
      const leagueName = LEAGUES[i];
      const members = groups[leagueName];
      if (members.length === 0) continue;

      // Sort members by weeklyXp desc
      members.sort((a, b) => (b.weeklyXp ?? 0) - (a.weeklyXp ?? 0));

      const total = members.length;
      
      // Determine cutoff indices
      // Top 20% get promoted (max Gold, Platinum, Diamond)
      const promoteCount = Math.max(1, Math.ceil(total * 0.25));
      // Bottom 20% get relegated (if above Bronze)
      const relegateCount = Math.max(1, Math.ceil(total * 0.2));

      for (let index = 0; index < total; index++) {
        const u = members[index];
        let nextLeague = leagueName;

        if (index < promoteCount && i < LEAGUES.length - 1) {
          // Promote
          nextLeague = LEAGUES[i + 1];
        } else if (index >= total - relegateCount && i > 0) {
          // Relegate
          nextLeague = LEAGUES[i - 1];
        }

        // Reset weeklyXp to 0, save new league
        await ctx.db.patch(u._id, {
          league: nextLeague,
          weeklyXp: 0,
        });
      }
    }
  },
});
