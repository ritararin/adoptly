import { createClient } from '@supabase/supabase-js'
import { auth } from './firebase' // Import your existing Firebase auth

const supabaseUrl = 'https://leezdjdmnggkewntltfy.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxlZXpkamRtbmdna2V3bnRsdGZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI0MTUzOTgsImV4cCI6MjEwNzk5MTM5OH0.O17LuA29_dzOLKeYIes3zmVs4pcr6wAuZFS-9B1c-m4'

const supabaseServiceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxlZXpkamRtbmdna2V3bnRsdGZ5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MjQxNTM5OCwiZXhwIjoyMTA3OTkxMzk4fQ.yeaIamupjNOCNpr1zNFvWwlgJRcRLwBzi5rXlfN-2_I'

export const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)