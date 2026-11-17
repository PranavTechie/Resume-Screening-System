import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

const key = (userId: string) => `rss_blind_screening:${userId}`;

/**
 * Blind screening toggle, remembered per user: localStorage for instant load,
 * user_preferences.preferences_json.blindScreening so it follows the user across devices.
 */
export function useBlindScreening(): [boolean, (v: boolean) => void] {
  const { user } = useAuth();
  const userId = user?.id || '';
  const [blind, setBlind] = useState<boolean>(() => (userId ? localStorage.getItem(key(userId)) === '1' : false));

  useEffect(() => {
    if (!userId) return;
    setBlind(localStorage.getItem(key(userId)) === '1');
    let cancelled = false;
    supabase
      .from('user_preferences')
      .select('preferences_json')
      .eq('user_id', userId)
      .maybeSingle()
      .then(({ data }) => {
        const v = (data?.preferences_json as any)?.blindScreening;
        if (!cancelled && typeof v === 'boolean') {
          setBlind(v);
          localStorage.setItem(key(userId), v ? '1' : '0');
        }
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const update = useCallback(
    (v: boolean) => {
      setBlind(v);
      if (!userId) return;
      localStorage.setItem(key(userId), v ? '1' : '0');
      void (async () => {
        const { data } = await supabase.from('user_preferences').select('preferences_json').eq('user_id', userId).maybeSingle();
        const merged = { ...((data?.preferences_json as Record<string, unknown>) || {}), blindScreening: v };
        await supabase.from('user_preferences').update({ preferences_json: merged, updated_at: new Date().toISOString() }).eq('user_id', userId);
      })();
    },
    [userId]
  );

  return [blind, update];
}
