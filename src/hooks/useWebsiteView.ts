import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

/** One event per homepage mount; rerenders and StrictMode effects do not add views. */
export function useWebsiteView() {
  const recorded = useRef(false);
  useEffect(() => {
    if (recorded.current) return;
    recorded.current = true;
    const record = async () => {
      try {
        await supabase.rpc("record_website_view", { p_event_id: crypto.randomUUID() });
      } catch {
        // Analytics must never interrupt the public website.
      }
    };
    void record();
  }, []);
}
