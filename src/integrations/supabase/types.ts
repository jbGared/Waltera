// ============================================================================
// WALTERA - Supabase Database Types
// ============================================================================
// Auto-generated types for type-safe database operations
// Generated from: waltera_migration_schema.sql
// ============================================================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// ============================================================================
// ENUMS
// ============================================================================

export type ServiceType = 'rag_contrats' | 'conventions' | 'analyse_fichiers'

export type ConversationStatus = 'active' | 'archived' | 'deleted'

export type AnalysisReportStatus = 'pending' | 'processing' | 'completed' | 'failed'

// ============================================================================
// DATABASE SCHEMA
// ============================================================================

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string | null
          email: string
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          email: string
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          email?: string
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      conversations: {
        Row: {
          id: string
          user_id: string
          title: string
          session_id: string
          service_type: ServiceType
          status: ConversationStatus
          messages: Message[]
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title?: string
          session_id: string
          service_type?: ServiceType
          status?: ConversationStatus
          messages?: Message[]
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          session_id?: string
          service_type?: ServiceType
          status?: ConversationStatus
          messages?: Message[]
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      analysis_reports: {
        Row: {
          id: string
          user_id: string
          title: string
          report_data: Json
          status: AnalysisReportStatus
          error_message: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title?: string
          report_data: Json
          status?: AnalysisReportStatus
          error_message?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          report_data?: Json
          status?: AnalysisReportStatus
          error_message?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "analysis_reports_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      user_stats: {
        Row: {
          user_id: string | null
          full_name: string | null
          email: string | null
          total_conversations: number | null
          today_conversations: number | null
          rag_conversations: number | null
          conventions_conversations: number | null
          analyse_conversations: number | null
          last_conversation_at: string | null
        }
      }
    }
    Functions: {
      get_user_conversation_count: {
        Args: {
          p_user_id: string
          p_service_type?: ServiceType
        }
        Returns: number
      }
      get_today_conversation_count: {
        Args: {
          p_user_id: string
        }
        Returns: number
      }
      migrate_conversation: {
        Args: {
          p_user_id: string
          p_title: string
          p_session_id: string
          p_service_type: string
          p_messages: Json
          p_status?: string
          p_created_at?: string
        }
        Returns: string
      }
    }
    Enums: {
      service_type: ServiceType
      conversation_status: ConversationStatus
    }
  }
}

// ============================================================================
// MESSAGE TYPES (for JSONB columns)
// ============================================================================

export interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: string
  metadata?: {
    model?: string
    tokens?: number
    [key: string]: any
  }
}

// ============================================================================
// HELPER TYPES
// ============================================================================

// Type for creating a new conversation
export type ConversationInsert = Database['public']['Tables']['conversations']['Insert']

// Type for updating a conversation
export type ConversationUpdate = Database['public']['Tables']['conversations']['Update']

// Type for a conversation row
export type ConversationRow = Database['public']['Tables']['conversations']['Row']

// Type for creating a new profile
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert']

// Type for updating a profile
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update']

// Type for a profile row
export type ProfileRow = Database['public']['Tables']['profiles']['Row']

// Type for creating a new analysis report
export type AnalysisReportInsert = Database['public']['Tables']['analysis_reports']['Insert']

// Type for updating an analysis report
export type AnalysisReportUpdate = Database['public']['Tables']['analysis_reports']['Update']

// Type for a analysis report row
export type AnalysisReportRow = Database['public']['Tables']['analysis_reports']['Row']

// Type for user stats view
export type UserStatsRow = Database['public']['Views']['user_stats']['Row']

// ============================================================================
// UTILITY TYPES FOR FRONTEND
// ============================================================================

// Conversation with populated profile
export interface ConversationWithProfile extends ConversationRow {
  profile: ProfileRow
}

// Message with sender info
export interface MessageWithSender extends Message {
  sender_name?: string
  sender_avatar?: string
}

// Analysis report with user info
export interface AnalysisReportWithUser extends AnalysisReportRow {
  profile: ProfileRow
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

export function isMessage(obj: any): obj is Message {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'role' in obj &&
    'content' in obj &&
    'timestamp' in obj &&
    (obj.role === 'user' || obj.role === 'assistant' || obj.role === 'system')
  )
}

export function isServiceType(value: string): value is ServiceType {
  return ['rag_contrats', 'conventions', 'analyse_fichiers'].includes(value)
}

export function isConversationStatus(value: string): value is ConversationStatus {
  return ['active', 'archived', 'deleted'].includes(value)
}

export function isAnalysisReportStatus(value: string): value is AnalysisReportStatus {
  return ['pending', 'processing', 'completed', 'failed'].includes(value)
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ApiResponse<T> {
  data: T | null
  error: Error | null
}

export interface PaginatedResponse<T> {
  data: T[]
  count: number | null
  page: number
  page_size: number
  total_pages?: number
}

// ============================================================================
// REALTIME TYPES
// ============================================================================

export type RealtimeConversationPayload = {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE'
  new: ConversationRow | null
  old: ConversationRow | null
  table: 'conversations'
}

export type RealtimeMessagePayload = {
  eventType: 'INSERT' | 'UPDATE'
  conversationId: string
  messages: Message[]
}
