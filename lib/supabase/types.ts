export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      badges: {
        Row: {
          badge_type: string;
          created_at: string;
          group_id: string;
          id: string;
          period_end: string;
          period_start: string;
          user_id: string;
        };
        Insert: {
          badge_type: string;
          created_at?: string;
          group_id: string;
          id?: string;
          period_end: string;
          period_start: string;
          user_id: string;
        };
        Update: {
          badge_type?: string;
          created_at?: string;
          group_id?: string;
          id?: string;
          period_end?: string;
          period_start?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "badges_group_id_fkey";
            columns: ["group_id"];
            isOneToOne: false;
            referencedRelation: "gym_groups";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "badges_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      check_ins: {
        Row: {
          checkin_date: string;
          created_at: string;
          group_id: string;
          id: string;
          lat: number | null;
          lng: number | null;
          method: string;
          reject_reason: string | null;
          status: string;
          user_id: string;
        };
        Insert: {
          checkin_date: string;
          created_at?: string;
          group_id: string;
          id?: string;
          lat?: number | null;
          lng?: number | null;
          method: string;
          reject_reason?: string | null;
          status: string;
          user_id: string;
        };
        Update: {
          checkin_date?: string;
          created_at?: string;
          group_id?: string;
          id?: string;
          lat?: number | null;
          lng?: number | null;
          method?: string;
          reject_reason?: string | null;
          status?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "check_ins_group_id_fkey";
            columns: ["group_id"];
            isOneToOne: false;
            referencedRelation: "gym_groups";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "check_ins_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      group_invites: {
        Row: {
          active: boolean;
          created_at: string;
          created_by: string;
          expires_at: string | null;
          group_id: string;
          max_uses: number;
          token: string;
          uses: number;
        };
        Insert: {
          active?: boolean;
          created_at?: string;
          created_by: string;
          expires_at?: string | null;
          group_id: string;
          max_uses?: number;
          token: string;
          uses?: number;
        };
        Update: {
          active?: boolean;
          created_at?: string;
          created_by?: string;
          expires_at?: string | null;
          group_id?: string;
          max_uses?: number;
          token?: string;
          uses?: number;
        };
        Relationships: [
          {
            foreignKeyName: "group_invites_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "group_invites_group_id_fkey";
            columns: ["group_id"];
            isOneToOne: false;
            referencedRelation: "gym_groups";
            referencedColumns: ["id"];
          }
        ];
      };
      group_members: {
        Row: {
          group_id: string;
          joined_at: string;
          role: string;
          user_id: string;
        };
        Insert: {
          group_id: string;
          joined_at?: string;
          role: string;
          user_id: string;
        };
        Update: {
          group_id?: string;
          joined_at?: string;
          role?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey";
            columns: ["group_id"];
            isOneToOne: false;
            referencedRelation: "gym_groups";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "group_members_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      gym_groups: {
        Row: {
          created_at: string;
          created_by: string;
          description: string | null;
          id: string;
          name: string;
          routine_content_type: string | null;
          routine_url: string | null;
          timezone: string;
        };
        Insert: {
          created_at?: string;
          created_by: string;
          description?: string | null;
          id?: string;
          name: string;
          routine_content_type?: string | null;
          routine_url?: string | null;
          timezone?: string;
        };
        Update: {
          created_at?: string;
          created_by?: string;
          description?: string | null;
          id?: string;
          name?: string;
          routine_content_type?: string | null;
          routine_url?: string | null;
          timezone?: string;
        };
        Relationships: [
          {
            foreignKeyName: "gym_groups_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      gym_locations: {
        Row: {
          created_at: string;
          group_id: string;
          id: string;
          lat: number;
          lng: number;
          name: string;
          radius_m: number;
        };
        Insert: {
          created_at?: string;
          group_id: string;
          id?: string;
          lat: number;
          lng: number;
          name: string;
          radius_m?: number;
        };
        Update: {
          created_at?: string;
          group_id?: string;
          id?: string;
          lat?: number;
          lng?: number;
          name?: string;
          radius_m?: number;
        };
        Relationships: [
          {
            foreignKeyName: "gym_locations_group_id_fkey";
            columns: ["group_id"];
            isOneToOne: false;
            referencedRelation: "gym_groups";
            referencedColumns: ["id"];
          }
        ];
      };
      manual_approvals: {
        Row: {
          approver_user_id: string;
          check_in_id: string;
          created_at: string;
          id: string;
        };
        Insert: {
          approver_user_id: string;
          check_in_id: string;
          created_at?: string;
          id?: string;
        };
        Update: {
          approver_user_id?: string;
          check_in_id?: string;
          created_at?: string;
          id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "manual_approvals_approver_user_id_fkey";
            columns: ["approver_user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "manual_approvals_check_in_id_fkey";
            columns: ["check_in_id"];
            isOneToOne: false;
            referencedRelation: "check_ins";
            referencedColumns: ["id"];
          }
        ];
      };
      users: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          id: string;
          name: string;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          id: string;
          name: string;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          id?: string;
          name?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      approve_manual_checkin: {
        Args: {
          p_check_in_id: string;
        };
        Returns: boolean;
      };
      award_month_winner: {
        Args: {
          p_group_id: string;
          p_period_start: string;
        };
        Returns: undefined;
      };
      create_group_invite: {
        Args: {
          p_group_id: string;
          p_expires_in_hours?: number;
          p_max_uses?: number;
        };
        Returns: string;
      };
      create_gym_group: {
        Args: {
          p_name: string;
          p_description: string;
          p_timezone: string;
        };
        Returns: string;
      };
      get_my_groups_with_stats: {
        Args: {
          p_month_start: string;
          p_month_end: string;
        };
        Returns: {
          id: string;
          name: string;
          description: string;
          timezone: string;
          created_at: string;
          role: string;
          my_month_count: number;
        }[];
      };
      is_group_admin: {
        Args: {
          p_group_id: string;
        };
        Returns: boolean;
      };
      is_group_member: {
        Args: {
          p_group_id: string;
        };
        Returns: boolean;
      };
      join_group_with_token: {
        Args: {
          p_token: string;
        };
        Returns: string;
      };
      reject_manual_checkin: {
        Args: {
          p_check_in_id: string;
          p_reason: string;
        };
        Returns: boolean;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

// Helper types
export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type Enums<T extends keyof Database["public"]["Enums"]> =
  Database["public"]["Enums"][T];
export type Functions<T extends keyof Database["public"]["Functions"]> =
  Database["public"]["Functions"][T];

// Convenience aliases
export type User = Tables<"users">;
export type GymGroup = Tables<"gym_groups">;
export type GroupMember = Tables<"group_members">;
export type GymLocation = Tables<"gym_locations">;
export type CheckIn = Tables<"check_ins">;
export type ManualApproval = Tables<"manual_approvals">;
export type Badge = Tables<"badges">;
export type GroupInvite = Tables<"group_invites">;

// Role enum
export type MemberRole = "ADMIN" | "MEMBER";

// Check-in method enum
export type CheckInMethod = "GEO" | "MANUAL";

// Check-in status enum
export type CheckInStatus = "PENDING" | "APPROVED" | "REJECTED";

// Badge type enum
export type BadgeType = "MONTH_WINNER";
