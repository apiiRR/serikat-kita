import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ from: vi.fn(), exists: vi.fn(), upload: vi.fn(), remove: vi.fn(), maybeSingle: vi.fn(), insert: vi.fn(), deleteEq: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: mocks.from, storage: { from: () => ({ upload: mocks.upload, exists: mocks.exists, remove: mocks.remove }) } } }));
import { deletePhoto, uploadPhoto, validatePhoto, type GalleryPhoto } from './gallery';
const file = new File(['photo'], 'photo.jpg', { type: 'image/jpeg' });
beforeEach(() => {
  vi.resetAllMocks();
  mocks.from.mockReturnValue({ select: () => ({ eq: () => ({ maybeSingle: mocks.maybeSingle }) }), insert: mocks.insert, delete: () => ({ eq: mocks.deleteEq }) });
  mocks.maybeSingle.mockResolvedValue({ data: null, error: null });
  mocks.exists.mockResolvedValue({ data: false, error: null });
  for (const fn of [mocks.upload, mocks.remove, mocks.insert, mocks.deleteEq]) fn.mockResolvedValue({ error: null });
});
describe('gallery storage lifecycle', () => {
  it('accepts JPEG PNG WebP and rejects unsupported, empty and oversized files', () => {
    for (const type of ['image/jpeg', 'image/png', 'image/webp']) expect(validatePhoto(new File(['x'], 'photo', { type }))).toBeNull();
    expect(validatePhoto(new File(['x'], 'x.svg', { type: 'image/svg+xml' }))).toBeTruthy();
    expect(validatePhoto(new File([], 'empty.jpg', { type: 'image/jpeg' }))).toBeTruthy();
    expect(validatePhoto(new File([new Uint8Array(5242881)], 'big.jpg', { type: 'image/jpeg' }))).toBeTruthy();
  });
  it('saves caption and optional album after upload', async () => {
    await uploadPhoto(file, 'Kegiatan', 'album-1', 'path.jpg');
    expect(mocks.insert).toHaveBeenCalledWith({ storage_path: 'path.jpg', caption: 'Kegiatan', album_id: 'album-1' });
  });
  it('does not duplicate a successful upload when retried', async () => {
    mocks.maybeSingle.mockResolvedValue({ data: { id: 'existing' }, error: null });
    await uploadPhoto(file, '', null, 'same.jpg');
    expect(mocks.upload).not.toHaveBeenCalled(); expect(mocks.insert).not.toHaveBeenCalled();
  });
  it('does not insert metadata on storage failure', async () => {
    mocks.upload.mockResolvedValue({ error: { message: 'network' } });
    await expect(uploadPhoto(file, '', null, 'x.jpg')).rejects.toBeTruthy();
    expect(mocks.insert).not.toHaveBeenCalled();
  });
  it('cleans storage when metadata fails, and retries a leftover file', async () => {
    mocks.insert.mockResolvedValueOnce({ error: { message: 'failed' } });
    await expect(uploadPhoto(file, '', null, 'x.jpg')).rejects.toBeTruthy();
    expect(mocks.remove).toHaveBeenCalledWith(['x.jpg']);
    mocks.upload.mockResolvedValueOnce({ error: { statusCode: '409' } });
    mocks.exists.mockResolvedValueOnce({ data: true, error: null });
    await expect(uploadPhoto(file, '', null, 'x.jpg')).resolves.toBeUndefined();
  });
  it('preserves a committed photo when insert response is uncertain', async () => {
    mocks.insert.mockResolvedValue({ error: { message: 'timeout' } });
    mocks.maybeSingle.mockResolvedValueOnce({ data: null }).mockResolvedValueOnce({ data: { id: 'saved' } });
    await uploadPhoto(file, '', null, 'x.jpg');
    expect(mocks.remove).not.toHaveBeenCalled();
  });
  it('keeps metadata on deletion failure, allowing another attempt', async () => {
    const photo = { id: 'id', storage_path: 'x.jpg' } as GalleryPhoto;
    mocks.remove.mockResolvedValueOnce({ error: { message: 'failed' } });
    await expect(deletePhoto(photo)).rejects.toBeTruthy(); expect(mocks.deleteEq).not.toHaveBeenCalled();
    await deletePhoto(photo); expect(mocks.deleteEq).toHaveBeenCalledWith('id', 'id');
  });
});
