/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as ai from "../ai.js";
import type * as analytics from "../analytics.js";
import type * as authHelpers from "../authHelpers.js";
import type * as cards from "../cards.js";
import type * as courses from "../courses.js";
import type * as crons from "../crons.js";
import type * as enrollments from "../enrollments.js";
import type * as fsrs from "../fsrs.js";
import type * as leagues from "../leagues.js";
import type * as migrate from "../migrate.js";
import type * as notifications from "../notifications.js";
import type * as personal from "../personal.js";
import type * as reviews from "../reviews.js";
import type * as sessions from "../sessions.js";
import type * as snapshots from "../snapshots.js";
import type * as subjects from "../subjects.js";
import type * as userCards from "../userCards.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  ai: typeof ai;
  analytics: typeof analytics;
  authHelpers: typeof authHelpers;
  cards: typeof cards;
  courses: typeof courses;
  crons: typeof crons;
  enrollments: typeof enrollments;
  fsrs: typeof fsrs;
  leagues: typeof leagues;
  migrate: typeof migrate;
  notifications: typeof notifications;
  personal: typeof personal;
  reviews: typeof reviews;
  sessions: typeof sessions;
  snapshots: typeof snapshots;
  subjects: typeof subjects;
  userCards: typeof userCards;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
