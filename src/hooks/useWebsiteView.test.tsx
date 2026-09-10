import { StrictMode } from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import { useWebsiteView } from "./useWebsiteView";
const { rpc } = vi.hoisted(() => ({ rpc: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { rpc } }));
beforeEach(() => { rpc.mockReset().mockResolvedValue({ error: null }); });
it("records once across StrictMode effects and rerenders, but counts a new visit", () => {
  const first = renderHook(useWebsiteView, { wrapper: StrictMode });
  first.rerender();
  expect(rpc).toHaveBeenCalledTimes(1);
  expect(rpc).toHaveBeenCalledWith("record_website_view", { p_event_id: expect.any(String) });
  const firstId = rpc.mock.calls[0][1].p_event_id;
  first.unmount();
  renderHook(useWebsiteView);
  expect(rpc).toHaveBeenCalledTimes(2);
  expect(rpc.mock.calls[1][1].p_event_id).not.toBe(firstId);
});
it("does not interrupt the page on a network failure", async () => {
  rpc.mockRejectedValue(new Error("offline"));
  renderHook(useWebsiteView);
  await waitFor(() => expect(rpc).toHaveBeenCalledTimes(1));
});
