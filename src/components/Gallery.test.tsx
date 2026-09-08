import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
const mocks = vi.hoisted(() => ({ fetch: vi.fn(), scrollNext: vi.fn(), scrollTo: vi.fn() }));
vi.mock('@/lib/gallery', () => ({ fetchGallery: mocks.fetch, photoUrl: (path: string) => path }));
vi.mock('@/components/ui/carousel', async () => {
  const React = await import('react');
  const api = { scrollNext: mocks.scrollNext, scrollTo: mocks.scrollTo, canScrollNext: () => true };
  return {
    Carousel: ({ children, setApi }: { children: ReactNode; setApi: (api: unknown) => void; }) => { React.useEffect(() => setApi(api), [setApi]); return <div>{children}</div>; },
    CarouselContent: ({ children }: { children: ReactNode; }) => <div>{children}</div>,
    CarouselItem: ({ children }: { children: ReactNode; }) => <div>{children}</div>,
    CarouselPrevious: () => <button>Sebelumnya</button>, CarouselNext: () => <button onClick={mocks.scrollNext}>Berikutnya</button>,
  };
});
import Gallery from './Gallery';
const data = { albums: [{ id: 'a', name: 'Rapat' }], photos: [{ id: '1', storage_path: '/1.jpg', caption: 'Foto rapat', album_id: 'a' }, { id: '2', storage_path: '/2.jpg', caption: 'Foto umum', album_id: null }] };
beforeEach(() => { vi.clearAllMocks(); mocks.fetch.mockResolvedValue(data); });
afterEach(() => { cleanup(); vi.useRealTimers(); });
it('filters albums, resets carousel, and opens the full image', async () => {
  render(<Gallery />); await screen.findByAltText('Foto umum');
  fireEvent.change(screen.getByLabelText('Filter album'), { target: { value: 'a' } });
  expect(screen.queryByAltText('Foto umum')).not.toBeInTheDocument(); expect(mocks.scrollTo).toHaveBeenCalledWith(0, true);
  fireEvent.click(screen.getByRole('button', { name: 'Perbesar foto: Foto rapat' }));
  expect(screen.getByRole('dialog')).toBeInTheDocument();
});
it('shows empty state and retries load errors', async () => {
  mocks.fetch.mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce({ albums: [], photos: [] });
  render(<Gallery />); fireEvent.click(await screen.findByText('Coba lagi'));
  expect(await screen.findByText('Belum ada foto kegiatan.')).toBeInTheDocument();
});
it('advances after five seconds and pauses on hover, focus and explicit pause', async () => {
  vi.useFakeTimers(); render(<Gallery />); await act(async () => { });
  act(() => vi.advanceTimersByTime(5000)); expect(mocks.scrollNext).toHaveBeenCalledTimes(1);
  const control = screen.getByText('Jeda otomatis');
  fireEvent.mouseEnter(control); act(() => vi.advanceTimersByTime(5000)); expect(mocks.scrollNext).toHaveBeenCalledTimes(1);
  fireEvent.mouseLeave(control); fireEvent.focus(control); act(() => vi.advanceTimersByTime(5000)); expect(mocks.scrollNext).toHaveBeenCalledTimes(1);
  fireEvent.blur(control); fireEvent.click(control); act(() => vi.advanceTimersByTime(5000)); expect(mocks.scrollNext).toHaveBeenCalledTimes(1);
});
it('does not autoplay a single photo', async () => {
  mocks.fetch.mockResolvedValue({ ...data, photos: [data.photos[0]] }); vi.useFakeTimers(); render(<Gallery />); await act(async () => { });
  act(() => vi.advanceTimersByTime(10000)); expect(mocks.scrollNext).not.toHaveBeenCalled();
});
