import { supabase } from '../supabaseClient';
import { Profile, TelemetryLog, PaginatedResponse } from '../types/financeos';

// ==========================================
// CORE FINANCE ENGINE (Decoupled from UI)
// ==========================================

export const CoreEngine = {
  
  /**
   * Fetches a paginated list of the fleet (Agents & Businesses) to prevent memory crashes.
   * @param page The current page number (starts at 0)
   * @param limit How many rows to fetch (default 50)
   */
  async getFleetNetwork(page: number = 0, limit: number = 50): Promise<PaginatedResponse<Profile>> {
    const from = page * limit;
    const to = from + limit - 1;

    try {
      const { data, error, count } = await supabase
        .from('profiles')
        .select('*', { count: 'exact' })
        .in('role', ['AGENT', 'BUSINESS'])
        .range(from, to);

      if (error) throw error;

      return { data: data as Profile[], count: count || 0, error: null };
    } catch (err: any) {
      console.error("Fleet Engine Error:", err.message);
      return { data: [], count: 0, error: err.message };
    }
  },

  /**
   * Fetches high-priority crash reports for the Glitch Radar.
   */
  async getTelemetryLogs(limit: number = 20): Promise<PaginatedResponse<TelemetryLog>> {
    try {
      const { data, error } = await supabase
        .from('system_logs')
        .select('*')
        .eq('resolved', false)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return { data: data as TelemetryLog[], count: data.length, error: null };
    } catch (err: any) {
      return { data: [], count: 0, error: err.message };
    }
  }
};