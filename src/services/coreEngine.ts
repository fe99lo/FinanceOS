import { supabase } from '../supabaseClient';
import { 
  Profile, 
  TelemetryLog, 
  Result, 
  CursorPage, 
  AccountRole 
} from '../types/financeos';

// ==========================================
// ENTERPRISE SERVICE ENGINE (coreEngine.ts)
// ==========================================

export class FinanceOSEngine {
  
  /**
   * High-Performance Cursor Pagination for Fleet Network.
   * Scans index hashes directly instead of counting rows. O(1) time complexity.
   * * @param limit - Max rows to return (Keep under 100 for memory safety)
   * @param cursor - The UUID or Timestamp of the LAST item from the previous page
   * @param signal - AbortSignal to cancel pending requests on React unmount
   */
  static async getFleetNetwork(
    limit: number = 50,
    cursor?: string,
    signal?: AbortSignal
  ): Promise<Result<CursorPage<Profile>>> {
    try {
      let query = supabase
        .from('profiles')
        .select('*')
        .in('role', [AccountRole.AGENT, AccountRole.BUSINESS])
        .order('id', { ascending: true }) // Must order by unique sequential key for cursors
        .limit(limit);

      if (cursor) {
        query = query.gt('id', cursor);
      }

      if (signal) {
        // Tie to abort signal if provided (prevents memory leaks in UI)
        query = query.abortSignal(signal);
      }

      const { data, error } = await query;

      if (error) throw new Error(`Fleet DB Exception: ${error.message}`);
      if (!data) return { ok: true, value: { data: [], nextCursor: null, hasMore: false } };

      const typedData = data as unknown as Profile[];
      const hasMore = typedData.length === limit;
      const nextCursor = hasMore ? typedData[typedData.length - 1].id : null;

      return {
        ok: true,
        value: {
          data: typedData,
          nextCursor,
          hasMore
        }
      };

    } catch (err: any) {
      // Catch network drops, aborts, and strict DB errors
      if (err.name === 'AbortError') {
        return { ok: false, error: new Error('Request aborted by client') };
      }
      return { ok: false, error: new Error(err.message || 'Unknown Engine Error') };
    }
  }

  /**
   * Fetches unresolved telemetry logs using timestamp cursors.
   */
  static async getActiveTelemetry(
    limit: number = 30,
    lastTimestampCursor?: string
  ): Promise<Result<CursorPage<TelemetryLog>>> {
    try {
      let query = supabase
        .from('system_logs')
        .select('*')
        .eq('resolved', false)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (lastTimestampCursor) {
        query = query.lt('created_at', lastTimestampCursor);
      }

      const { data, error } = await query;

      if (error) throw new Error(`Telemetry DB Exception: ${error.message}`);
      if (!data) return { ok: true, value: { data: [], nextCursor: null, hasMore: false } };

      const typedData = data as unknown as TelemetryLog[];
      const hasMore = typedData.length === limit;
      const nextCursor = hasMore ? typedData[typedData.length - 1].created_at : null;

      return {
        ok: true,
        value: {
          data: typedData,
          nextCursor,
          hasMore
        }
      };

    } catch (err: any) {
      return { ok: false, error: new Error(err.message || 'Unknown Telemetry Error') };
    }
  }
}