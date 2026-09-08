import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ fetch: vi.fn(), upload: vi.fn(), remove: vi.fn(), update: vi.fn(), insert: vi.fn(), deleteRow: vi.fn(), toast: vi.fn() }));
vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: mocks.toast }) }));
vi.mock('@/lib/gallery', () => ({ fetchGallery: mocks.fetch, uploadPhoto: mocks.upload, deletePhoto: mocks.remove, photoUrl: (p: string) => p, validatePhoto: () => null }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: () => ({ update: (value: unknown) => ({ eq: (field: string, id: string) => mocks.update(value, field, id) }), insert: mocks.insert, delete: () => ({ eq: mocks.deleteRow }) }) } }));
import AdminGallery from './AdminGallery';
const data = { albums: [{ id: 'a', name: 'Rapat' }], photos: [{ id: '1', storage_path: '/1.jpg', caption: 'Awal', album_id: null }] };
beforeEach(() => {
  vi.clearAllMocks(); mocks.fetch.mockResolvedValue(data); mocks.upload.mockResolvedValue(undefined);
  for (const fn of [mocks.update, mocks.insert, mocks.deleteRow]) fn.mockResolvedValue({ error: null });
  URL.createObjectURL = vi.fn(() => 'blob:preview'); URL.revokeObjectURL = vi.fn();
  vi.spyOn(window, 'confirm').mockReturnValue(true);
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });
it('uploads multiple files and retries only failed photos', async () => {
  mocks.upload.mockResolvedValueOnce(undefined).mockRejectedValueOnce(new Error('Offline')).mockResolvedValueOnce(undefined);
  render(<AdminGallery />); await screen.findByAltText('Awal');
  const one = new File(['x'], 'one.jpg', { type: 'image/jpeg' }); const two = new File(['y'], 'two.jpg', { type: 'image/jpeg' });
  fireEvent.change(screen.getByLabelText('Pilih foto'), { target: { files: [one, two] } });
  fireEvent.change(screen.getByLabelText('Keterangan one.jpg'), { target: { value: 'Satu' } });
  fireEvent.click(screen.getByText('Unggah / coba ulang foto gagal'));
  await screen.findByText('Offline'); await waitFor(() => expect(screen.getByText('Unggah / coba ulang foto gagal')).toBeEnabled());
  expect(mocks.upload).toHaveBeenCalledTimes(2);
  fireEvent.click(screen.getByText('Unggah / coba ulang foto gagal'));
  await waitFor(() => expect(screen.getAllByText('Berhasil diunggah')).toHaveLength(2));
  expect(mocks.upload).toHaveBeenCalledTimes(3);
  expect(mocks.upload.mock.calls[2][0]).toBe(two);
  expect(mocks.upload.mock.calls[0][1]).toBe('Satu');
});
it('edits caption and moves a photo to an album', async () => {
  render(<AdminGallery />); await screen.findByAltText('Awal');
  fireEvent.change(screen.getByLabelText('Keterangan foto'), { target: { value: 'Baru' } });
  fireEvent.change(screen.getByLabelText('Album foto'), { target: { value: 'a' } });
  fireEvent.click(screen.getByRole('button', { name: 'Simpan' }));
  await waitFor(() => expect(mocks.update).toHaveBeenCalledWith({ caption: 'Baru', album_id: 'a' }, 'id', '1'));
});
it('creates, renames and deletes albums without deleting photos', async () => {
  render(<AdminGallery />); await screen.findByAltText('Awal');
  fireEvent.change(screen.getByLabelText('Nama album'), { target: { value: 'Baru' } }); fireEvent.click(screen.getByText('Tambah album'));
  await waitFor(() => expect(mocks.insert).toHaveBeenCalledWith({ name: 'Baru' }));
  await waitFor(() => expect(screen.getByText('Ubah nama')).toBeEnabled()); fireEvent.click(screen.getByText('Ubah nama'));
  fireEvent.change(screen.getByLabelText('Nama album'), { target: { value: 'Rapat bulanan' } }); fireEvent.click(screen.getByText('Simpan nama'));
  await waitFor(() => expect(mocks.update).toHaveBeenCalledWith({ name: 'Rapat bulanan' }, 'id', 'a'));
  await waitFor(() => expect(screen.getByText('Hapus album')).toBeEnabled()); fireEvent.click(screen.getByText('Hapus album'));
  await waitFor(() => expect(mocks.deleteRow).toHaveBeenCalledWith('id', 'a')); expect(mocks.remove).not.toHaveBeenCalled();
});
it('retains a photo after a failed deletion so the admin can retry', async () => {
  mocks.remove.mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(undefined);
  render(<AdminGallery />); await screen.findByAltText('Awal'); fireEvent.click(screen.getByText('Hapus foto'));
  await waitFor(() => expect(mocks.toast).toHaveBeenCalledWith(expect.objectContaining({ title: 'Gagal' })));
  expect(screen.getByAltText('Awal')).toBeInTheDocument(); fireEvent.click(screen.getByText('Hapus foto'));
  await waitFor(() => expect(mocks.remove).toHaveBeenCalledTimes(2));
});
