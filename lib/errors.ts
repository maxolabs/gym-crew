/**
 * Maps Supabase/PostgreSQL error codes and messages to user-friendly messages.
 */
export function humanizeError(error: unknown): string {
  if (!error) return "An unknown error occurred.";

  const message = (error as { message?: string })?.message ?? String(error);
  const code = (error as { code?: string })?.code;

  // RLS policy violations
  if (message.includes("row-level security") || code === "42501") {
    if (message.includes("check_ins")) {
      return "You don't have permission for this check-in action.";
    }
    if (message.includes("gym_groups")) {
      return "You don't have permission to modify this group.";
    }
    if (message.includes("group_members")) {
      return "You don't have permission to manage group membership.";
    }
    if (message.includes("gym_locations")) {
      return "You don't have permission to manage locations.";
    }
    if (message.includes("group_invites")) {
      return "You don't have permission to manage invites.";
    }
    return "You don't have permission to perform this action.";
  }

  // Duplicate key violations
  if (message.includes("duplicate key") || code === "23505") {
    if (message.includes("check_ins")) {
      return "You've already checked in today.";
    }
    if (message.includes("group_members")) {
      return "Already a member of this group.";
    }
    return "This entry already exists.";
  }

  // Foreign key violations
  if (message.includes("foreign key") || code === "23503") {
    return "The referenced item no longer exists.";
  }

  // Custom RPC errors
  if (message.includes("not_authenticated")) {
    return "Please sign in to continue.";
  }
  if (message.includes("not_authorized")) {
    return "You don't have permission to perform this action.";
  }
  if (message.includes("invalid_or_expired_token")) {
    return "This invite link is invalid or has expired.";
  }
  if (message.includes("invite_max_uses_reached")) {
    return "This invite link has reached its maximum uses.";
  }
  if (message.includes("cannot_self_approve")) {
    return "You cannot approve your own check-in.";
  }
  if (message.includes("checkin_not_found")) {
    return "Check-in not found.";
  }
  if (message.includes("not_pending_manual")) {
    return "This check-in is not pending manual approval.";
  }

  // Network errors
  if (message.includes("Failed to fetch") || message.includes("NetworkError")) {
    return "Network error. Please check your connection and try again.";
  }

  // Auth errors
  if (message.includes("Invalid login credentials")) {
    return "Invalid email or password.";
  }
  if (message.includes("Email not confirmed")) {
    return "Please verify your email address.";
  }
  if (message.includes("User already registered")) {
    return "An account with this email already exists.";
  }

  // Return original message if no mapping found
  return message;
}
