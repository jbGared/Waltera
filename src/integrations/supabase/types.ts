export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      analyses_reseau: {
        Row: {
          completed_at: string | null
          created_at: string | null
          credits_deducted: number
          credits_remaining: number | null
          error_message: string | null
          export_url: string | null
          gamma_url: string | null
          generation_id: string
          id: string
          metadata: Json | null
          request_data: Json | null
          response_data: Json | null
          status: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          credits_deducted?: number
          credits_remaining?: number | null
          error_message?: string | null
          export_url?: string | null
          gamma_url?: string | null
          generation_id: string
          id?: string
          metadata?: Json | null
          request_data?: Json | null
          response_data?: Json | null
          status: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          credits_deducted?: number
          credits_remaining?: number | null
          error_message?: string | null
          export_url?: string | null
          gamma_url?: string | null
          generation_id?: string
          id?: string
          metadata?: Json | null
          request_data?: Json | null
          response_data?: Json | null
          status?: string
        }
        Relationships: []
      }
      analysis_reports: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          report_data: Json
          score: number | null
          status: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          report_data: Json
          score?: number | null
          status?: string | null
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          report_data?: Json
          score?: number | null
          status?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ccn: {
        Row: {
          content: string | null
          created_at: string | null
          embedding: string | null
          id: number
          metadata: Json | null
          updated_at: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          embedding?: string | null
          id?: number
          metadata?: Json | null
          updated_at?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          embedding?: string | null
          id?: number
          metadata?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ccn_business_terms: {
        Row: {
          active: boolean | null
          category: string
          created_at: string | null
          id: number
          term: string
        }
        Insert: {
          active?: boolean | null
          category?: string
          created_at?: string | null
          id?: number
          term: string
        }
        Update: {
          active?: boolean | null
          category?: string
          created_at?: string | null
          id?: number
          term?: string
        }
        Relationships: []
      }
      ccn_catalogue: {
        Row: {
          active: boolean | null
          brochure_numero: string | null
          chunks_count: number | null
          date_maj: string | null
          id: number
          idcc: string
          is_imported: boolean | null
          is_protected: boolean | null
          kali_cont_id: string | null
          label: string
          last_import_at: string | null
          protection_reason: string | null
          source: string | null
        }
        Insert: {
          active?: boolean | null
          brochure_numero?: string | null
          chunks_count?: number | null
          date_maj?: string | null
          id?: number
          idcc: string
          is_imported?: boolean | null
          is_protected?: boolean | null
          kali_cont_id?: string | null
          label: string
          last_import_at?: string | null
          protection_reason?: string | null
          source?: string | null
        }
        Update: {
          active?: boolean | null
          brochure_numero?: string | null
          chunks_count?: number | null
          date_maj?: string | null
          id?: number
          idcc?: string
          is_imported?: boolean | null
          is_protected?: boolean | null
          kali_cont_id?: string | null
          label?: string
          last_import_at?: string | null
          protection_reason?: string | null
          source?: string | null
        }
        Relationships: []
      }
      ccn_compliance_alerts: {
        Row: {
          category: string | null
          ccn_chunk_ids: number[] | null
          ccn_label: string | null
          ccn_requirement: string | null
          client_id: string | null
          client_name: string
          contract_chunk_ids: number[] | null
          contract_clause: string | null
          created_at: string | null
          description: string
          id: string
          idcc: string
          import_log_id: string | null
          metadata: Json | null
          recommended_action: string | null
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          status: string
          title: string
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          ccn_chunk_ids?: number[] | null
          ccn_label?: string | null
          ccn_requirement?: string | null
          client_id?: string | null
          client_name: string
          contract_chunk_ids?: number[] | null
          contract_clause?: string | null
          created_at?: string | null
          description: string
          id?: string
          idcc: string
          import_log_id?: string | null
          metadata?: Json | null
          recommended_action?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          status?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          ccn_chunk_ids?: number[] | null
          ccn_label?: string | null
          ccn_requirement?: string | null
          client_id?: string | null
          client_name?: string
          contract_chunk_ids?: number[] | null
          contract_clause?: string | null
          created_at?: string | null
          description?: string
          id?: string
          idcc?: string
          import_log_id?: string | null
          metadata?: Json | null
          recommended_action?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          status?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ccn_compliance_alerts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ccn_compliance_alerts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "v_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ccn_compliance_alerts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "v_clients_pending"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ccn_compliance_alerts_import_log_id_fkey"
            columns: ["import_log_id"]
            isOneToOne: false
            referencedRelation: "ccn_import_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      ccn_import_logs: {
        Row: {
          chunks_created: number | null
          completed_at: string | null
          created_at: string | null
          details: Json | null
          documents_found: number | null
          documents_imported: number | null
          error_message: string | null
          errors_count: number | null
          id: string
          sop_alerts_count: number | null
          started_at: string | null
          status: string | null
          total_ccn_processed: number | null
          trigger_type: string | null
        }
        Insert: {
          chunks_created?: number | null
          completed_at?: string | null
          created_at?: string | null
          details?: Json | null
          documents_found?: number | null
          documents_imported?: number | null
          error_message?: string | null
          errors_count?: number | null
          id?: string
          sop_alerts_count?: number | null
          started_at?: string | null
          status?: string | null
          total_ccn_processed?: number | null
          trigger_type?: string | null
        }
        Update: {
          chunks_created?: number | null
          completed_at?: string | null
          created_at?: string | null
          details?: Json | null
          documents_found?: number | null
          documents_imported?: number | null
          error_message?: string | null
          errors_count?: number | null
          id?: string
          sop_alerts_count?: number | null
          started_at?: string | null
          status?: string | null
          total_ccn_processed?: number | null
          trigger_type?: string | null
        }
        Relationships: []
      }
      ccn_notifications: {
        Row: {
          change_kali_id: string | null
          created_at: string | null
          detected_terms: string[] | null
          id: string
          idcc: string
          impact_analysis: Json | null
          impacted_clients: string[] | null
          metadata: Json | null
          notification_type: string
          sent_at: string | null
          status: string | null
          summary: string | null
          title: string
        }
        Insert: {
          change_kali_id?: string | null
          created_at?: string | null
          detected_terms?: string[] | null
          id?: string
          idcc: string
          impact_analysis?: Json | null
          impacted_clients?: string[] | null
          metadata?: Json | null
          notification_type: string
          sent_at?: string | null
          status?: string | null
          summary?: string | null
          title: string
        }
        Update: {
          change_kali_id?: string | null
          created_at?: string | null
          detected_terms?: string[] | null
          id?: string
          idcc?: string
          impact_analysis?: Json | null
          impacted_clients?: string[] | null
          metadata?: Json | null
          notification_type?: string
          sent_at?: string | null
          status?: string | null
          summary?: string | null
          title?: string
        }
        Relationships: []
      }
      ccn_schedule_config: {
        Row: {
          cron_expression: string | null
          day_of_week: number
          frequency: string
          hour: number
          id: string
          is_active: boolean
          minute: number
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          cron_expression?: string | null
          day_of_week?: number
          frequency?: string
          hour?: number
          id?: string
          is_active?: boolean
          minute?: number
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          cron_expression?: string | null
          day_of_week?: number
          frequency?: string
          hour?: number
          id?: string
          is_active?: boolean
          minute?: number
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      ccn_sync_log: {
        Row: {
          created_at: string | null
          error_details: Json | null
          files_added: number | null
          files_failed: number | null
          files_processed: number | null
          files_updated: number | null
          id: number
          idcc: string
          status: string | null
          sync_end: string | null
          sync_start: string | null
          sync_type: string
        }
        Insert: {
          created_at?: string | null
          error_details?: Json | null
          files_added?: number | null
          files_failed?: number | null
          files_processed?: number | null
          files_updated?: number | null
          id?: number
          idcc: string
          status?: string | null
          sync_end?: string | null
          sync_start?: string | null
          sync_type: string
        }
        Update: {
          created_at?: string | null
          error_details?: Json | null
          files_added?: number | null
          files_failed?: number | null
          files_processed?: number | null
          files_updated?: number | null
          id?: number
          idcc?: string
          status?: string | null
          sync_end?: string | null
          sync_start?: string | null
          sync_type?: string
        }
        Relationships: []
      }
      chat_memory: {
        Row: {
          created_at: string | null
          id: number
          message: Json
          session_id: string
        }
        Insert: {
          created_at?: string | null
          id?: number
          message: Json
          session_id: string
        }
        Update: {
          created_at?: string | null
          id?: number
          message?: Json
          session_id?: string
        }
        Relationships: []
      }
      clients: {
        Row: {
          code: string | null
          created_at: string | null
          external_key: string | null
          id: string
          idcc: string[] | null
          name: string
          nas_folder_id: string | null
          nas_folder_path: string | null
          notes: string | null
          pending: boolean | null
          siren: string | null
          siret: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          code?: string | null
          created_at?: string | null
          external_key?: string | null
          id?: string
          idcc?: string[] | null
          name: string
          nas_folder_id?: string | null
          nas_folder_path?: string | null
          notes?: string | null
          pending?: boolean | null
          siren?: string | null
          siret?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          code?: string | null
          created_at?: string | null
          external_key?: string | null
          id?: string
          idcc?: string[] | null
          name?: string
          nas_folder_id?: string | null
          nas_folder_path?: string | null
          notes?: string | null
          pending?: boolean | null
          siren?: string | null
          siret?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          last_message_at: string | null
          message_count: number | null
          messages: Json
          metadata: Json | null
          service_type: Database["public"]["Enums"]["service_type"]
          session_id: string
          status: Database["public"]["Enums"]["conversation_status"]
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_message_at?: string | null
          message_count?: number | null
          messages?: Json
          metadata?: Json | null
          service_type?: Database["public"]["Enums"]["service_type"]
          session_id: string
          status?: Database["public"]["Enums"]["conversation_status"]
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_message_at?: string | null
          message_count?: number | null
          messages?: Json
          metadata?: Json | null
          service_type?: Database["public"]["Enums"]["service_type"]
          session_id?: string
          status?: Database["public"]["Enums"]["conversation_status"]
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      document_metadata: {
        Row: {
          category: string | null
          ccn_idcc: string[] | null
          ccn_text_type: string | null
          checksum: string | null
          client_id: string | null
          client_name: string | null
          created_at: string | null
          date_publication: string | null
          document_type: string | null
          effective_date: string | null
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          idcc: string | null
          is_contract: boolean | null
          kali_id: string | null
          last_modified: string | null
          mime_type: string | null
          mtime: string | null
          processing_status: string | null
          size_bytes: number | null
          source_system: string | null
          source_type: string | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          ccn_idcc?: string[] | null
          ccn_text_type?: string | null
          checksum?: string | null
          client_id?: string | null
          client_name?: string | null
          created_at?: string | null
          date_publication?: string | null
          document_type?: string | null
          effective_date?: string | null
          file_name: string
          file_path: string
          file_size?: number | null
          id: string
          idcc?: string | null
          is_contract?: boolean | null
          kali_id?: string | null
          last_modified?: string | null
          mime_type?: string | null
          mtime?: string | null
          processing_status?: string | null
          size_bytes?: number | null
          source_system?: string | null
          source_type?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          ccn_idcc?: string[] | null
          ccn_text_type?: string | null
          checksum?: string | null
          client_id?: string | null
          client_name?: string | null
          created_at?: string | null
          date_publication?: string | null
          document_type?: string | null
          effective_date?: string | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          idcc?: string | null
          is_contract?: boolean | null
          kali_id?: string | null
          last_modified?: string | null
          mime_type?: string | null
          mtime?: string | null
          processing_status?: string | null
          size_bytes?: number | null
          source_system?: string | null
          source_type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_metadata_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_metadata_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "v_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_metadata_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "v_clients_pending"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_metadata_idcc_fkey"
            columns: ["idcc"]
            isOneToOne: false
            referencedRelation: "idcc_ref"
            referencedColumns: ["idcc"]
          },
        ]
      }
      document_rows: {
        Row: {
          client_code: string | null
          created_at: string | null
          dataset_id: string | null
          file_name: string | null
          file_path: string | null
          id: number
          row_data: Json | null
          row_index: number | null
          sheet_name: string | null
        }
        Insert: {
          client_code?: string | null
          created_at?: string | null
          dataset_id?: string | null
          file_name?: string | null
          file_path?: string | null
          id?: number
          row_data?: Json | null
          row_index?: number | null
          sheet_name?: string | null
        }
        Update: {
          client_code?: string | null
          created_at?: string | null
          dataset_id?: string | null
          file_name?: string | null
          file_path?: string | null
          id?: number
          row_data?: Json | null
          row_index?: number | null
          sheet_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_rows_dataset_id_fkey"
            columns: ["dataset_id"]
            isOneToOne: false
            referencedRelation: "document_metadata"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          content: string
          created_at: string | null
          embedding: string | null
          id: number
          is_deleted: boolean
          metadata: Json
          updated_at: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          embedding?: string | null
          id?: number
          is_deleted?: boolean
          metadata: Json
          updated_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          embedding?: string | null
          id?: number
          is_deleted?: boolean
          metadata?: Json
          updated_at?: string | null
        }
        Relationships: []
      }
      idcc_ref: {
        Row: {
          active: boolean | null
          created_at: string | null
          idcc: string
          kalicont_id: string | null
          label: string
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          idcc: string
          kalicont_id?: string | null
          label: string
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          idcc?: string
          kalicont_id?: string | null
          label?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          metadata: Json | null
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          metadata?: Json | null
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      n8n_chat_histories: {
        Row: {
          content: string | null
          created_at: string | null
          id: number
          session_id: string
          type: string
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          id?: number
          session_id: string
          type: string
        }
        Update: {
          content?: string | null
          created_at?: string | null
          id?: number
          session_id?: string
          type?: string
        }
        Relationships: []
      }
      nas_files: {
        Row: {
          client_code: string | null
          created_at: string | null
          file_ext: string | null
          file_mtime: number | null
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          processed_at: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          client_code?: string | null
          created_at?: string | null
          file_ext?: string | null
          file_mtime?: number | null
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          processed_at?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          client_code?: string | null
          created_at?: string | null
          file_ext?: string | null
          file_mtime?: number | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          processed_at?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      nas_inventory: {
        Row: {
          category: string | null
          checksum: string | null
          client_name: string | null
          document_type: string | null
          ext: string | null
          file_id: string
          file_path: string
          first_seen_at: string
          is_deleted: boolean
          last_seen_at: string
          last_seen_run_id: string | null
          mtime: string | null
          name: string
          size: number | null
        }
        Insert: {
          category?: string | null
          checksum?: string | null
          client_name?: string | null
          document_type?: string | null
          ext?: string | null
          file_id: string
          file_path: string
          first_seen_at?: string
          is_deleted?: boolean
          last_seen_at?: string
          last_seen_run_id?: string | null
          mtime?: string | null
          name: string
          size?: number | null
        }
        Update: {
          category?: string | null
          checksum?: string | null
          client_name?: string | null
          document_type?: string | null
          ext?: string | null
          file_id?: string
          file_path?: string
          first_seen_at?: string
          is_deleted?: boolean
          last_seen_at?: string
          last_seen_run_id?: string | null
          mtime?: string | null
          name?: string
          size?: number | null
        }
        Relationships: []
      }
      nas_sync_jobs: {
        Row: {
          completed_at: string | null
          created_at: string
          deleted_files: number
          errors: Json | null
          id: string
          modified_files: number
          new_files: number
          processed_files: number
          skipped_files: number | null
          started_at: string
          status: string
          total_files: number
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          deleted_files?: number
          errors?: Json | null
          id?: string
          modified_files?: number
          new_files?: number
          processed_files?: number
          skipped_files?: number | null
          started_at?: string
          status?: string
          total_files?: number
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          deleted_files?: number
          errors?: Json | null
          id?: string
          modified_files?: number
          new_files?: number
          processed_files?: number
          skipped_files?: number | null
          started_at?: string
          status?: string
          total_files?: number
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          message: string | null
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message?: string | null
          read?: boolean
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string | null
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      otp_codes: {
        Row: {
          code: string
          created_at: string | null
          expires_at: string
          id: string
          used: boolean | null
          user_id: string
        }
        Insert: {
          code: string
          created_at?: string | null
          expires_at: string
          id?: string
          used?: boolean | null
          user_id: string
        }
        Update: {
          code?: string
          created_at?: string | null
          expires_at?: string
          id?: string
          used?: boolean | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          city: string | null
          created_at: string | null
          email: string
          first_name: string | null
          id: string
          is_admin: boolean | null
          last_name: string | null
          phone: string | null
          postal_code: string | null
          receive_ccn_alerts: boolean | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          city?: string | null
          created_at?: string | null
          email: string
          first_name?: string | null
          id: string
          is_admin?: boolean | null
          last_name?: string | null
          phone?: string | null
          postal_code?: string | null
          receive_ccn_alerts?: boolean | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          city?: string | null
          created_at?: string | null
          email?: string
          first_name?: string | null
          id?: string
          is_admin?: boolean | null
          last_name?: string | null
          phone?: string | null
          postal_code?: string | null
          receive_ccn_alerts?: boolean | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
        }
        Relationships: []
      }
      sop_keywords: {
        Row: {
          category: string | null
          created_at: string | null
          created_by: string | null
          id: string
          is_active: boolean | null
          keyword: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          keyword: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          keyword?: string
        }
        Relationships: []
      }
      sync_log: {
        Row: {
          error_details: Json | null
          files_added: number | null
          files_failed: number | null
          files_processed: number | null
          files_updated: number | null
          id: number
          status: string | null
          sync_end: string | null
          sync_start: string | null
        }
        Insert: {
          error_details?: Json | null
          files_added?: number | null
          files_failed?: number | null
          files_processed?: number | null
          files_updated?: number | null
          id?: number
          status?: string | null
          sync_end?: string | null
          sync_start?: string | null
        }
        Update: {
          error_details?: Json | null
          files_added?: number | null
          files_failed?: number | null
          files_processed?: number | null
          files_updated?: number | null
          id?: number
          status?: string | null
          sync_end?: string | null
          sync_start?: string | null
        }
        Relationships: []
      }
      tarifs_sante: {
        Row: {
          age: string
          created_at: string | null
          gamme: string
          id: number
          option1: number | null
          option2: number | null
          option3: number | null
          option4: number | null
          option5: number | null
          option6: number | null
          produit: string
          qualite: string
          renfort_hospi: number | null
          surco_option3: number | null
          surco_option4: number | null
          surco_option5: number | null
          surco_option6: number | null
          zone: string
        }
        Insert: {
          age: string
          created_at?: string | null
          gamme: string
          id?: number
          option1?: number | null
          option2?: number | null
          option3?: number | null
          option4?: number | null
          option5?: number | null
          option6?: number | null
          produit: string
          qualite: string
          renfort_hospi?: number | null
          surco_option3?: number | null
          surco_option4?: number | null
          surco_option5?: number | null
          surco_option6?: number | null
          zone: string
        }
        Update: {
          age?: string
          created_at?: string | null
          gamme?: string
          id?: number
          option1?: number | null
          option2?: number | null
          option3?: number | null
          option4?: number | null
          option5?: number | null
          option6?: number | null
          produit?: string
          qualite?: string
          renfort_hospi?: number | null
          surco_option3?: number | null
          surco_option4?: number | null
          surco_option5?: number | null
          surco_option6?: number | null
          zone?: string
        }
        Relationships: []
      }
      user_sessions: {
        Row: {
          created_at: string | null
          device_name: string | null
          id: string
          ip_address: string
          is_trusted: boolean | null
          last_otp_at: string | null
          updated_at: string | null
          user_id: string
          webauthn_credential_id: string | null
          webauthn_public_key: string | null
        }
        Insert: {
          created_at?: string | null
          device_name?: string | null
          id?: string
          ip_address: string
          is_trusted?: boolean | null
          last_otp_at?: string | null
          updated_at?: string | null
          user_id: string
          webauthn_credential_id?: string | null
          webauthn_public_key?: string | null
        }
        Update: {
          created_at?: string | null
          device_name?: string | null
          id?: string
          ip_address?: string
          is_trusted?: boolean | null
          last_otp_at?: string | null
          updated_at?: string | null
          user_id?: string
          webauthn_credential_id?: string | null
          webauthn_public_key?: string | null
        }
        Relationships: []
      }
      zones_sante: {
        Row: {
          code_zone: string
          departement: string
          id: number
          type_zone: string
        }
        Insert: {
          code_zone: string
          departement: string
          id?: number
          type_zone: string
        }
        Update: {
          code_zone?: string
          departement?: string
          id?: number
          type_zone?: string
        }
        Relationships: []
      }
    }
    Views: {
      ccn_catalogue_with_stats: {
        Row: {
          active: boolean | null
          actual_chunks_count: number | null
          brochure_numero: string | null
          chunks_count: number | null
          date_maj: string | null
          id: number | null
          idcc: string | null
          idcc_ref_label: string | null
          is_active_in_ref: boolean | null
          is_imported: boolean | null
          kali_cont_id: string | null
          label: string | null
          last_import_at: string | null
          source: string | null
        }
        Relationships: []
      }
      ccn_changes: {
        Row: {
          date_event: string | null
          details: Json | null
          event: string | null
          id: number | null
          idcc: string | null
          kali_id: string | null
        }
        Insert: {
          date_event?: string | null
          details?: Json | null
          event?: string | null
          id?: number | null
          idcc?: string | null
          kali_id?: string | null
        }
        Update: {
          date_event?: string | null
          details?: Json | null
          event?: string | null
          id?: number | null
          idcc?: string | null
          kali_id?: string | null
        }
        Relationships: []
      }
      ccn_state: {
        Row: {
          idcc: string | null
          last_bocc_seen: string | null
          last_checked: string | null
        }
        Insert: {
          idcc?: string | null
          last_bocc_seen?: string | null
          last_checked?: string | null
        }
        Update: {
          idcc?: string | null
          last_bocc_seen?: string | null
          last_checked?: string | null
        }
        Relationships: []
      }
      ccn_watchlist: {
        Row: {
          created_at: string | null
          idcc: string | null
          label: string | null
        }
        Insert: {
          created_at?: string | null
          idcc?: string | null
          label?: string | null
        }
        Update: {
          created_at?: string | null
          idcc?: string | null
          label?: string | null
        }
        Relationships: []
      }
      v_clients: {
        Row: {
          id: string | null
          idcc: string[] | null
          idcc_display: string | null
          name: string | null
          nas_folder_id: string | null
          nas_folder_path: string | null
          nb_idcc: number | null
          notes: string | null
          pending: boolean | null
          siren: string | null
          siret: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string | null
          idcc?: string[] | null
          idcc_display?: never
          name?: string | null
          nas_folder_id?: string | null
          nas_folder_path?: string | null
          nb_idcc?: never
          notes?: string | null
          pending?: boolean | null
          siren?: string | null
          siret?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string | null
          idcc?: string[] | null
          idcc_display?: never
          name?: string | null
          nas_folder_id?: string | null
          nas_folder_path?: string | null
          nb_idcc?: never
          notes?: string | null
          pending?: boolean | null
          siren?: string | null
          siret?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      v_clients_pending: {
        Row: {
          created_at: string | null
          id: string | null
          name: string | null
          nas_folder_id: string | null
          nas_folder_path: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string | null
          name?: string | null
          nas_folder_id?: string | null
          nas_folder_path?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string | null
          name?: string | null
          nas_folder_id?: string | null
          nas_folder_path?: string | null
        }
        Relationships: []
      }
      v_documents_chunks: {
        Row: {
          categorie: string | null
          client: string | null
          created_at: string | null
          extrait: string | null
          id: number | null
          nom_document: string | null
          type_document: string | null
        }
        Insert: {
          categorie?: never
          client?: never
          created_at?: string | null
          extrait?: never
          id?: number | null
          nom_document?: never
          type_document?: never
        }
        Update: {
          categorie?: never
          client?: never
          created_at?: string | null
          extrait?: never
          id?: number | null
          nom_document?: never
          type_document?: never
        }
        Relationships: []
      }
    }
    Functions: {
      analyze_contracts_for_sop: {
        Args: { p_client_name: string; p_sop_terms: string[] }
        Returns: {
          content_preview: string
          created_at: string
          document_id: number
          document_title: string
          matched_terms: string[]
        }[]
      }
      check_ccn_in_use: {
        Args: { p_idcc: string }
        Returns: {
          client_count: number
          client_names: string[]
          is_in_use: boolean
        }[]
      }
      cleanup_expired_otp: { Args: never; Returns: undefined }
      cleanup_stuck_imports: {
        Args: never
        Returns: {
          cleaned_id: string
          log_started_at: string
          minutes_running: number
        }[]
      }
      create_import_log: { Args: { p_trigger_type?: string }; Returns: string }
      create_pending_client: {
        Args: {
          p_nas_folder_id: string
          p_nas_folder_path: string
          p_suggested_name: string
        }
        Returns: string
      }
      detect_business_terms: {
        Args: { text_content: string }
        Returns: string[]
      }
      extract_client_code: { Args: { folder_path: string }; Returns: string }
      find_client_by_nas_id: {
        Args: { p_nas_folder_id: string }
        Returns: {
          id: string
          idcc: string[]
          name: string
          nas_folder_path: string
        }[]
      }
      find_client_for_folder: {
        Args: { p_folder_name: string; p_nas_folder_id: string }
        Returns: {
          id: string
          idcc: string[]
          match_type: string
          name: string
        }[]
      }
      generate_external_key: { Args: { client_name: string }; Returns: string }
      get_all_kali_ids: { Args: never; Returns: string[] }
      get_ccn_document_counts: {
        Args: never
        Returns: {
          chunk_count: number
          document_count: number
          idcc: string
        }[]
      }
      get_client_by_code: {
        Args: { client_code: string }
        Returns: {
          code: string
          id: string
          idcc: string[]
          name: string
          nas_folder_path: string
          pending: boolean
        }[]
      }
      get_client_mapping: {
        Args: { p_folder_name: string }
        Returns: {
          client_id: string
          client_name: string
          idcc: string[]
          status: string
        }[]
      }
      get_clients_by_idcc: { Args: { target_idcc: string }; Returns: string[] }
      get_clients_list: {
        Args: never
        Returns: {
          client_code: string
          client_name: string
          nb_documents: number
        }[]
      }
      get_distinct_kali_ids: {
        Args: never
        Returns: {
          kali_id: string
        }[]
      }
      get_existing_kali_ids: { Args: { kali_ids: string[] }; Returns: string[] }
      get_pending_notifications: {
        Args: { limit_count?: number }
        Returns: {
          client_ids: string[]
          client_names: string[]
          created_at: string
          detected_terms: string[]
          id: string
          idcc: string
          notification_type: string
          summary: string
          title: string
        }[]
      }
      get_sop_impact_summary: {
        Args: { p_idcc: string; p_sop_terms: string[] }
        Returns: {
          client_id: string
          client_name: string
          impacted_contracts: number
          matched_terms: string[]
          total_contracts: number
        }[]
      }
      get_today_conversation_count: {
        Args: { p_user_id: string }
        Returns: number
      }
      get_user_conversation_count: {
        Args: {
          p_service_type?: Database["public"]["Enums"]["service_type"]
          p_user_id: string
        }
        Returns: number
      }
      insert_document_with_metadata: {
        Args: {
          p_category: string
          p_client_name: string
          p_document_type: string
          p_file_id: string
          p_file_name: string
          p_file_path: string
          p_file_size: number
        }
        Returns: undefined
      }
      match_all_documents: {
        Args: {
          filter_source?: string
          match_count?: number
          query_embedding: string
        }
        Returns: {
          content: string
          id: number
          metadata: Json
          similarity: number
          source: string
        }[]
      }
      match_ccn: {
        Args: {
          filter?: Json
          match_count?: number
          query_embedding: string
          similarity_threshold?: number
        }
        Returns: {
          content: string
          id: number
          metadata: Json
          similarity: number
        }[]
      }
      match_ccn_filtered: {
        Args: {
          filter_idcc?: string
          match_count?: number
          query_embedding: string
        }
        Returns: {
          content: string
          id: number
          metadata: Json
          similarity: number
        }[]
      }
      match_ccn_smart: {
        Args: {
          match_count?: number
          query_embedding: string
          query_text: string
        }
        Returns: {
          content: string
          id: number
          metadata: Json
          similarity: number
        }[]
      }
      match_documents: {
        Args: {
          filter?: Json
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          content: string
          id: number
          metadata: Json
          similarity: number
        }[]
      }
      match_documents_by_client: {
        Args: {
          client_filter: string
          match_count: number
          query_embedding: string
        }
        Returns: {
          content: string
          id: number
          metadata: Json
          similarity: number
        }[]
      }
      match_documents_filtered: {
        Args: {
          filter_client?: string
          match_count?: number
          query_embedding: string
        }
        Returns: {
          content: string
          id: number
          metadata: Json
          similarity: number
        }[]
      }
      migrate_conversation: {
        Args: {
          p_created_at?: string
          p_messages: Json
          p_service_type: string
          p_session_id: string
          p_status?: string
          p_title: string
          p_user_id: string
        }
        Returns: string
      }
      process_ccn_change: {
        Args: {
          p_content: string
          p_event_type: string
          p_idcc: string
          p_kali_id: string
          p_metadata?: Json
          p_title: string
        }
        Returns: string
      }
      resolve_client_from_path: {
        Args: { file_path: string }
        Returns: {
          client_code: string
          client_id: string
          client_name: string
          matched: boolean
        }[]
      }
      search_ccn_by_name: {
        Args: {
          match_count?: number
          query_embedding: string
          search_query: string
        }
        Returns: {
          content: string
          id: number
          metadata: Json
          similarity: number
        }[]
      }
      search_client: {
        Args: { search_term: string }
        Returns: {
          client_code: string
          client_id: string
          client_name: string
          match_score: number
        }[]
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      sync_ccn_catalogue_counts: { Args: never; Returns: Json }
      update_import_log: {
        Args: {
          p_chunks_created: number
          p_details: Json
          p_docs_found: number
          p_docs_imported: number
          p_error_message?: string
          p_errors: number
          p_log_id: string
          p_sop_alerts: number
          p_status: string
          p_total_ccn: number
        }
        Returns: undefined
      }
      validate_client: {
        Args: { p_client_id: string; p_idcc: string[]; p_name: string }
        Returns: undefined
      }
    }
    Enums: {
      conversation_status: "active" | "archived" | "deleted"
      service_type: "rag_contrats" | "conventions" | "analyse_fichiers"
      user_role: "user" | "admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      conversation_status: ["active", "archived", "deleted"],
      service_type: ["rag_contrats", "conventions", "analyse_fichiers"],
      user_role: ["user", "admin"],
    },
  },
} as const

// Custom type aliases for convenience
export type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"]
export type ConversationRow = Database["public"]["Tables"]["conversations"]["Row"]
export type ServiceType = Database["public"]["Enums"]["service_type"]
