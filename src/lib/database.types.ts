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
      profiles: {
        Row: {
          id: string
          full_name: string | null
          role: 'client' | 'coach' | 'admin'
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          role?: 'client' | 'coach' | 'admin'
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          role?: 'client' | 'coach' | 'admin'
          status?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      coach_client_assignments: {
        Row: {
          id: string
          coach_id: string
          client_id: string
          status: string
          assigned_at: string
        }
        Insert: {
          id?: string
          coach_id: string
          client_id: string
          status?: string
          assigned_at?: string
        }
        Update: {
          id?: string
          coach_id?: string
          client_id?: string
          status?: string
          assigned_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'coach_client_assignments_coach_id_fkey'
            columns: ['coach_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'coach_client_assignments_client_id_fkey'
            columns: ['client_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      check_ins: {
        Row: {
          id: string
          client_id: string
          week_key: string
          submitted_at: string
          weight: number
          energy: number
          sleep: number
          mood: number
          stress: number
          training: number
          nutrition: number
          digestion: string
          wins: string
          struggles: string
          questions: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          client_id: string
          week_key: string
          submitted_at?: string
          weight: number
          energy: number
          sleep: number
          mood: number
          stress: number
          training: number
          nutrition: number
          digestion: string
          wins: string
          struggles: string
          questions: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          week_key?: string
          submitted_at?: string
          weight?: number
          energy?: number
          sleep?: number
          mood?: number
          stress?: number
          training?: number
          nutrition?: number
          digestion?: string
          wins?: string
          struggles?: string
          questions?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'check_ins_client_id_fkey'
            columns: ['client_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      check_in_reviews: {
        Row: {
          id: string
          check_in_id: string
          coach_id: string
          feedback: string
          reviewed_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          check_in_id: string
          coach_id: string
          feedback: string
          reviewed_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          check_in_id?: string
          coach_id?: string
          feedback?: string
          reviewed_at?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'check_in_reviews_check_in_id_fkey'
            columns: ['check_in_id']
            isOneToOne: true
            referencedRelation: 'check_ins'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'check_in_reviews_coach_id_fkey'
            columns: ['coach_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
