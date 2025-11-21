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
      sections: {
        Row: {
          id: string
          name: string
          section_code: string
          category: string
          current_image_url: string | null
          row_info: string | null
          price: number
          deal_badge: string | null
          value_badge: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          section_code: string
          category: string
          current_image_url?: string | null
          row_info?: string | null
          price: number
          deal_badge?: string | null
          value_badge?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          section_code?: string
          category?: string
          current_image_url?: string | null
          row_info?: string | null
          price?: number
          deal_badge?: string | null
          value_badge?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      prompts: {
        Row: {
          id: string
          section_id: string | null
          prompt_text: string
          negative_prompt: string | null
          version: number
          is_active: boolean
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          section_id?: string | null
          prompt_text: string
          negative_prompt?: string | null
          version?: number
          is_active?: boolean
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          section_id?: string | null
          prompt_text?: string
          negative_prompt?: string | null
          version?: number
          is_active?: boolean
          notes?: string | null
          created_at?: string
        }
      }
      generated_images: {
        Row: {
          id: string
          section_id: string | null
          prompt_id: string | null
          image_url: string
          model_name: string
          model_provider: string
          status: string
          generation_settings: Json | null
          comparison_notes: string | null
          approved_at: string | null
          rejected_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          section_id?: string | null
          prompt_id?: string | null
          image_url: string
          model_name: string
          model_provider: string
          status?: string
          generation_settings?: Json | null
          comparison_notes?: string | null
          approved_at?: string | null
          rejected_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          section_id?: string | null
          prompt_id?: string | null
          image_url?: string
          model_name?: string
          model_provider?: string
          status?: string
          generation_settings?: Json | null
          comparison_notes?: string | null
          approved_at?: string | null
          rejected_at?: string | null
          created_at?: string
        }
      }
      photo_backlog: {
        Row: {
          id: string
          image_url: string
          thumbnail_url: string | null
          original_filename: string | null
          file_size: number | null
          width: number | null
          height: number | null
          notes: string | null
          tags: string[] | null
          uploaded_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          image_url: string
          thumbnail_url?: string | null
          original_filename?: string | null
          file_size?: number | null
          width?: number | null
          height?: number | null
          notes?: string | null
          tags?: string[] | null
          uploaded_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          image_url?: string
          thumbnail_url?: string | null
          original_filename?: string | null
          file_size?: number | null
          width?: number | null
          height?: number | null
          notes?: string | null
          tags?: string[] | null
          uploaded_at?: string
          updated_at?: string
        }
      }
    }
  }
}
