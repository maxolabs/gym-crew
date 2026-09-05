import i18n from "@/lib/i18n";

/**
 * Maps Supabase/PostgreSQL error codes and messages to user-friendly,
 * translated messages using the current i18n language.
 */
export function humanizeError(error: unknown): string {
  if (!error) return i18n.t("errors:unknown");

  const message = (error as { message?: string })?.message ?? String(error);
  const code = (error as { code?: string })?.code;

  // RLS policy violations
  if (message.includes("row-level security") || code === "42501") {
    if (message.includes("check_ins")) return i18n.t("errors:rlsCheckIns");
    if (message.includes("gym_groups")) return i18n.t("errors:rlsGroups");
    if (message.includes("group_members")) return i18n.t("errors:rlsMembers");
    if (message.includes("gym_locations")) return i18n.t("errors:rlsLocations");
    if (message.includes("group_invites")) return i18n.t("errors:rlsInvites");
    return i18n.t("errors:rlsGeneric");
  }

  // Duplicate key violations
  if (message.includes("duplicate key") || code === "23505") {
    if (message.includes("check_ins")) return i18n.t("errors:dupCheckIn");
    if (message.includes("group_members")) return i18n.t("errors:dupMember");
    return i18n.t("errors:dupGeneric");
  }

  // Foreign key violations
  if (message.includes("foreign key") || code === "23503") {
    return i18n.t("errors:fkViolation");
  }

  // Custom RPC errors
  if (message.includes("not_authenticated")) return i18n.t("errors:notAuthenticated");
  if (message.includes("not_authorized")) return i18n.t("errors:notAuthorized");
  if (message.includes("invalid_or_expired_token")) return i18n.t("errors:invalidToken");
  if (message.includes("invite_max_uses_reached")) return i18n.t("errors:maxUsesReached");
  if (message.includes("cannot_self_approve")) return i18n.t("errors:cannotSelfApprove");
  if (message.includes("checkin_not_found")) return i18n.t("errors:checkInNotFound");
  if (message.includes("not_pending_manual")) return i18n.t("errors:notPendingManual");
  if (message.includes("only_trainers_can_create_groups")) return i18n.t("errors:onlyTrainers");

  // Network errors
  if (message.includes("Failed to fetch") || message.includes("NetworkError")) {
    return i18n.t("errors:networkError");
  }

  // Auth errors
  if (message.includes("Invalid login credentials")) return i18n.t("errors:invalidCredentials");
  if (message.includes("Email not confirmed")) return i18n.t("errors:emailNotConfirmed");
  if (message.includes("User already registered")) return i18n.t("errors:userExists");

  // Return original message if no mapping found
  return message;
}
