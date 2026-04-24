export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      user_achievements: {
        Row: { id: string; user_id: string; achievement_id: string; earned_at: string }
        Insert: { id?: string; user_id: string; achievement_id: string; earned_at?: string }
        Update: { id?: string; user_id?: string; achievement_id?: string; earned_at?: string }
      }
      document_embeddings: {
        Row: { id: string; user_id: string; document_id: string; chunk_index: number; content: string; embedding: number[] }
        Insert: { id?: string; user_id: string; document_id: string; chunk_index: number; content: string; embedding: number[] }
        Update: { id?: string; user_id?: string; document_id?: string; chunk_index?: number; content?: string; embedding?: number[] }
      }
      user_progress: {
        Row: { id: string; user_id: string; level: number; xp: number; streak: number; last_active_date: string; created_at: string }
        Insert: { id?: string; user_id: string; level?: number; xp?: number; streak?: number; last_active_date?: string; created_at?: string }
        Update: { id?: string; user_id?: string; level?: number; xp?: number; streak?: number; last_active_date?: string; created_at?: string }
      }
      user_stats: {
        Row: { id: string; user_id: string; total_sessions: number; total_questions: number; topics_completed: number; study_time: number; updated_at: string }
        Insert: { id?: string; user_id: string; total_sessions?: number; total_questions?: number; topics_completed?: number; study_time?: number; updated_at?: string }
        Update: { id?: string; user_id?: string; total_sessions?: number; total_questions?: number; topics_completed?: number; study_time?: number; updated_at?: string }
      }
      documents: {
        Row: { id: string; user_id: string; filename: string; file_path: string; file_type: string; file_size: number; title: string | null; subject: string | null; language: string; processed: boolean; created_at: string }
        Insert: { id?: string; user_id: string; filename: string; file_path: string; file_type: string; file_size: number; title?: string | null; subject?: string | null; language?: string; processed?: boolean; created_at?: string }
        Update: { id?: string; user_id?: string; filename?: string; file_path?: string; file_type?: string; file_size?: number; title?: string | null; subject?: string | null; language?: string; processed?: boolean; created_at?: string }
      }
      tutoring_sessions: {
        Row: { id: string; user_id: string; started_at: string; ended_at: string | null; duration: number | null; message_count: number; topic: string | null }
        Insert: { id?: string; user_id: string; started_at?: string; ended_at?: string | null; duration?: number | null; message_count?: number; topic?: string | null }
        Update: { id?: string; user_id?: string; started_at?: string; ended_at?: string | null; duration?: number | null; message_count?: number; topic?: string | null }
      }
      career_profiles: {
        Row: { id: string; user_id: string; full_name: string | null; current_level: string; field_of_study: string | null; institution: string | null; graduation_year: number | null; target_career: string; target_industry: string | null; work_experience: Json[]; skills: string[]; certifications: string[]; career_goals: string | null; location: string; created_at: string; updated_at: string }
        Insert: { id?: string; user_id: string; full_name?: string | null; current_level: string; field_of_study?: string | null; institution?: string | null; graduation_year?: number | null; target_career: string; target_industry?: string | null; work_experience?: Json[]; skills?: string[]; certifications?: string[]; career_goals?: string | null; location?: string; created_at?: string; updated_at?: string }
        Update: { id?: string; user_id?: string; full_name?: string | null; current_level?: string; field_of_study?: string | null; institution?: string | null; graduation_year?: number | null; target_career?: string; target_industry?: string | null; work_experience?: Json[]; skills?: string[]; certifications?: string[]; career_goals?: string | null; location?: string; created_at?: string; updated_at?: string }
      }
      skill_gap_analyses: {
        Row: { id: string; user_id: string; target_career: string; required_skills: Json[]; current_skills: string[]; gap_skills: Json[]; match_score: number; ai_summary: string; created_at: string }
        Insert: { id?: string; user_id: string; target_career: string; required_skills?: Json[]; current_skills?: string[]; gap_skills?: Json[]; match_score?: number; ai_summary?: string; created_at?: string }
        Update: { id?: string; user_id?: string; target_career?: string; required_skills?: Json[]; current_skills?: string[]; gap_skills?: Json[]; match_score?: number; ai_summary?: string; created_at?: string }
      }
      learning_modules: {
        Row: { id: string; user_id: string; gap_analysis_id: string | null; title: string; skill_target: string; description: string | null; difficulty: string; estimated_hours: number; status: string; completion_pct: number; resources: Json[]; certificate_url: string | null; completed_at: string | null; created_at: string }
        Insert: { id?: string; user_id: string; gap_analysis_id?: string | null; title: string; skill_target: string; description?: string | null; difficulty?: string; estimated_hours?: number; status?: string; completion_pct?: number; resources?: Json[]; certificate_url?: string | null; completed_at?: string | null; created_at?: string }
        Update: { id?: string; user_id?: string; gap_analysis_id?: string | null; title?: string; skill_target?: string; description?: string | null; difficulty?: string; estimated_hours?: number; status?: string; completion_pct?: number; resources?: Json[]; certificate_url?: string | null; completed_at?: string | null; created_at?: string }
      }
      resume_versions: {
        Row: { id: string; user_id: string; version_name: string; target_role: string | null; content_json: Json; ai_feedback: string | null; ats_score: number | null; created_at: string; updated_at: string }
        Insert: { id?: string; user_id: string; version_name?: string; target_role?: string | null; content_json: Json; ai_feedback?: string | null; ats_score?: number | null; created_at?: string; updated_at?: string }
        Update: { id?: string; user_id?: string; version_name?: string; target_role?: string | null; content_json?: Json; ai_feedback?: string | null; ats_score?: number | null; created_at?: string; updated_at?: string }
      }
      user_certificates: {
        Row: { id: string; user_id: string; module_id: string | null; cert_name: string; provider: string | null; cert_url: string | null; verified: boolean; earned_at: string }
        Insert: { id?: string; user_id: string; module_id?: string | null; cert_name: string; provider?: string | null; cert_url?: string | null; verified?: boolean; earned_at?: string }
        Update: { id?: string; user_id?: string; module_id?: string | null; cert_name?: string; provider?: string | null; cert_url?: string | null; verified?: boolean; earned_at?: string }
      }
      career_analyses: {
        Row: { id: string; user_id: string; match_score: number; created_at: string }
        Insert: { id?: string; user_id: string; match_score?: number; created_at?: string }
        Update: { id?: string; user_id?: string; match_score?: number; created_at?: string }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      match_documents: {
        Args: { query_embedding: number[]; match_threshold: number; match_count: number; user_id: string }
        Returns: { id: string; content: string; similarity: number }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}