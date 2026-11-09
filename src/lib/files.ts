import { File } from 'expo-file-system';

// Reads a local file (photo or video picked on the phone) as bytes for
// upload. Don't use fetch(uri) for this: on Android it can return an error
// text instead of the file, which then gets uploaded as if it were the image.
export async function readLocalFile(uri: string): Promise<ArrayBuffer> {
  const buffer = await new File(uri).arrayBuffer();
  if (buffer.byteLength === 0) throw new Error('empty_file');
  return buffer;
}
