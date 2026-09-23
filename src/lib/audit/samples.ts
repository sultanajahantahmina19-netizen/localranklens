import type { AuditInput } from "./types";

/**
 * DEMO DATA — not a real business. Used by the public sample report so visitors
 * can see a finished audit before signing up. Clearly labelled as a demo
 * everywhere it is rendered.
 */
export const SAMPLE_AUDIT_INPUT: AuditInput = {
  businessName: "Northgate Dental Practice (demo)",
  primaryCategory: "Dentist",
  city: "Leeds",
  websiteUrl: "https://example.com",
  isVerified: true,
  nameFreeOfKeywordStuffing: true,
  descriptionLength: 310,
  regularHoursSet: true,
  holidayHoursSet: false,
  localPhoneNumber: true,
  websiteLinked: true,
  primaryCategoryMatchesSearchTerm: true,
  secondaryCategoryCount: 1,
  servicesOrProductsListed: 4,
  attributesCompleted: false,
  reviewCount: 34,
  averageRating: 4.3,
  reviewsLast30Days: 2,
  ownerResponseRatePercent: 45,
  reviewsMentioningServices: 6,
  photoCount: 18,
  photosLast30Days: 0,
  logoAndCoverSet: true,
  videoUploaded: false,
  postsLast30Days: 0,
  answeredQuestions: 1,
  messagingEnabled: false,
  napConsistentAcrossDirectories: false,
  locationPageWithMap: true,
  directoryCitationCount: 5,
};

/** A second demo profile used in docs and screenshots. */
export const SAMPLE_AUDIT_INPUT_STRONG: AuditInput = {
  ...SAMPLE_AUDIT_INPUT,
  businessName: "Harbour Row Barbers (demo)",
  primaryCategory: "Barber shop",
  city: "Bristol",
  descriptionLength: 680,
  holidayHoursSet: true,
  secondaryCategoryCount: 3,
  servicesOrProductsListed: 12,
  attributesCompleted: true,
  reviewCount: 214,
  averageRating: 4.8,
  reviewsLast30Days: 9,
  ownerResponseRatePercent: 96,
  reviewsMentioningServices: 41,
  photoCount: 88,
  photosLast30Days: 7,
  videoUploaded: true,
  postsLast30Days: 5,
  answeredQuestions: 6,
  messagingEnabled: true,
  napConsistentAcrossDirectories: true,
  directoryCitationCount: 11,
};
