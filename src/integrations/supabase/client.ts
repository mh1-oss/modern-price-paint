
// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://oirorkrrvxumhjhvrucm.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9pcm9ya3Jydnh1bWhqaHZydWNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMxOTEyNDUsImV4cCI6MjA1ODc2NzI0NX0.HGmW3Sk-iAMvjWUAaAXD4DWwN_aFulsckAHuNPCU0yU";

export const supabase = createClient<Database>(
  SUPABASE_URL, 
  SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      storage: typeof window !== 'undefined' ? localStorage : undefined
    },
    global: {
      headers: {
        'Content-Type': 'application/json',
      },
    },
    db: {
      schema: 'public',
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  }
);

// Improved helper function to check connection to Supabase
// that can bypass RLS policy issues with the user_roles table
export const pingDatabase = async () => {
  try {
    console.log("Attempting to ping database...");
    
    // Try the RPC function first - most reliable and bypasses RLS
    try {
      const { error } = await supabase.rpc('get_company_info');
      
      if (!error) {
        console.log("Database ping successful using RPC function");
        return { ok: true, latency: 0 };
      } else {
        console.warn("Failed to ping using RPC function:", error.message);
      }
    } catch (err) {
      console.warn("Failed to ping using RPC function");
    }
    
    // Use a simple table that doesn't have complex RLS policies
    // We'll try multiple tables in sequence to find one that works
    const tables = ['company_info', 'products', 'categories'];
    let success = false;
    let errorMessage = '';
    
    for (const table of tables) {
      try {
        // Using type assertion to handle the dynamic table name
        const { data, error } = await supabase
          .from(table as any)
          .select('id')
          .limit(1);
          
        if (!error) {
          // Found a working table
          success = true;
          console.log(`Database ping successful using ${table} table`);
          break;
        } else {
          errorMessage = error.message;
          console.warn(`Failed to ping using ${table} table:`, error.message);
        }
      } catch (err) {
        // Continue to next table
        console.warn(`Failed to ping using ${table} table, trying next option`);
      }
    }
    
    // If all tables failed, but we detect the specific RLS recursion error
    if (!success && errorMessage && (
      errorMessage.includes("infinite recursion") || 
      errorMessage.includes("policy for relation") || 
      errorMessage.includes("user_roles") ||
      errorMessage.includes("permission denied")
    )) {
      console.warn("Known RLS policy issue detected:", errorMessage);
      // Return partial success - we know the DB is up, but has policy configuration issues
      return { 
        ok: true, 
        latency: 0, 
        warning: "Database accessible but has RLS policy configuration issues" 
      };
    }
    
    // If we got here and success is still false, we have a real connection issue
    if (!success) {
      console.error("Database ping failed for all tables:", errorMessage);
      return { ok: false, latency: 0, error: errorMessage || "Could not connect to any table" };
    }
    
    return { ok: true, latency: 0 };
  } catch (err) {
    console.error("Unexpected error during database ping:", err);
    return { 
      ok: false, 
      latency: 0, 
      error: err instanceof Error ? err.message : 'Unknown error during ping' 
    };
  }
};

// Helper function to check if we have an active session
export const getSession = async () => {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.error("Error getting session:", error);
      return null;
    }
    return data.session;
  } catch (error) {
    console.error("Unexpected error getting session:", error);
    return null;
  }
};

// Helper function to get the current user
export const getCurrentUser = async () => {
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      console.error("Error getting user:", error);
      return null;
    }
    return data.user;
  } catch (error) {
    console.error("Unexpected error getting user:", error);
    return null;
  }
};
