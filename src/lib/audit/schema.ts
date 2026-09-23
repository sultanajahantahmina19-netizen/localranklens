import { z } from "zod";

import type { AuditInput } from "./types";

const count = (max: number) => z.coerce.number().int().min(0).max(max);

/**
 * Single source of truth for audit input validation. Used by the form on the
 * client and re-run on the server before anything is written to the database.
 */
export const auditInputSchema = z.object({
  businessName: z.string().trim().min(2, "Business name is required").max(120),
  primaryCategory: z.string().trim().min(2, "Primary category is required").max(120),
  city: z.string().trim().min(2, "City is required").max(120),
  websiteUrl: z
    .string()
    .trim()
    .max(300)
    .url("Enter a full URL including https://")
    .optional()
    .or(z.literal("")),

  isVerified: z.boolean(),
  nameFreeOfKeywordStuffing: z.boolean(),
  descriptionLength: count(750),
  regularHoursSet: z.boolean(),
  holidayHoursSet: z.boolean(),
  localPhoneNumber: z.boolean(),
  websiteLinked: z.boolean(),

  primaryCategoryMatchesSearchTerm: z.boolean(),
  secondaryCategoryCount: count(9),
  servicesOrProductsListed: count(200),
  attributesCompleted: z.boolean(),

  reviewCount: count(100000),
  averageRating: z.coerce.number().min(0).max(5),
  reviewsLast30Days: count(2000),
  ownerResponseRatePercent: count(100),
  reviewsMentioningServices: count(100000),

  photoCount: count(10000),
  photosLast30Days: count(1000),
  logoAndCoverSet: z.boolean(),
  videoUploaded: z.boolean(),

  postsLast30Days: count(200),
  answeredQuestions: count(500),
  messagingEnabled: z.boolean(),

  napConsistentAcrossDirectories: z.boolean(),
  locationPageWithMap: z.boolean(),
  directoryCitationCount: count(200),
});

export type AuditInputPayload = z.infer<typeof auditInputSchema>;

export const auditInputDefaults: AuditInput = {
  businessName: "",
  primaryCategory: "",
  city: "",
  websiteUrl: "",
  isVerified: true,
  nameFreeOfKeywordStuffing: true,
  descriptionLength: 0,
  regularHoursSet: true,
  holidayHoursSet: false,
  localPhoneNumber: true,
  websiteLinked: true,
  primaryCategoryMatchesSearchTerm: true,
  secondaryCategoryCount: 0,
  servicesOrProductsListed: 0,
  attributesCompleted: false,
  reviewCount: 0,
  averageRating: 4.5,
  reviewsLast30Days: 0,
  ownerResponseRatePercent: 0,
  reviewsMentioningServices: 0,
  photoCount: 0,
  photosLast30Days: 0,
  logoAndCoverSet: false,
  videoUploaded: false,
  postsLast30Days: 0,
  answeredQuestions: 0,
  messagingEnabled: false,
  napConsistentAcrossDirectories: false,
  locationPageWithMap: false,
  directoryCitationCount: 0,
};
