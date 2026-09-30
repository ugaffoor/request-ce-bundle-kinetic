/**
 * Photos and GIFs attached to a message, prepared and uploaded the way the
 * BJJ Members app does it, so an attachment sent from the portal is
 * indistinguishable on a member's phone from one a member sent.
 *
 * Mirrors the app's src/media/pickMedia.ts and src/firebase/storageMedia.ts:
 * same kinds, same size cap, same downscaling, same Storage path. The cap
 * and the allowed types are also enforced by storage.rules, so the limits
 * here are for a clear message up front rather than the only line of
 * defence.
 */
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getFirebaseApp } from './firebase';

// storage.rules refuses anything larger.
export const MAX_MEDIA_BYTES = 2 * 1024 * 1024;

// What the app's picker asks for: still images fitted inside 1600 x 1600 and
// re-encoded at 70% quality, which brings a typical phone photo well under
// the cap.
const MAX_SIDE = 1600;
const QUALITY = 0.7;

/**
 * The attachment kind the app understands, or null when the file is not one
 * we send. Photos and GIFs only -- the rules refuse video, and voice notes
 * are recorded in the app rather than picked from a file.
 */
export const classifyMedia = mime => {
  if (mime === 'image/gif') {
    return 'gif';
  }
  if (typeof mime === 'string' && mime.indexOf('image/') === 0) {
    return 'image';
  }
  return null;
};

const loadImage = url =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('That image could not be read.'));
    image.src = url;
  });

const toBlob = (canvas, mime, quality) =>
  new Promise((resolve, reject) =>
    canvas.toBlob(
      blob =>
        blob
          ? resolve(blob)
          : reject(new Error('That image could not be read.')),
      mime,
      quality,
    ),
  );

/**
 * Checks a picked file and gets it ready to send: its kind, its size once
 * shrunk, and its dimensions, which the app uses to size the bubble before
 * the image has loaded.
 *
 * A still image larger than 1600px, or over the cap, is redrawn smaller as
 * a JPEG -- onto white, since JPEG has no transparency and a PNG's clear
 * areas would otherwise come out black. One already small enough is sent
 * untouched. A GIF is never redrawn: that would keep only its first frame,
 * so an oversize GIF is refused instead, as the app does.
 *
 * Throws an Error whose message is written for the person who picked the
 * file.
 */
export const prepareChatMedia = async file => {
  const kind = classifyMedia(file && file.type);
  if (!kind) {
    throw new Error('Only photos and GIFs can be attached.');
  }
  if (kind === 'gif' && file.size > MAX_MEDIA_BYTES) {
    throw new Error('That GIF is over 2 MB. Choose a smaller one.');
  }

  const previewUrl = URL.createObjectURL(file);
  try {
    const image = await loadImage(previewUrl);
    const width = image.naturalWidth;
    const height = image.naturalHeight;

    const fits =
      width <= MAX_SIDE && height <= MAX_SIDE && file.size <= MAX_MEDIA_BYTES;
    if (kind === 'gif' || fits) {
      return { blob: file, mime: file.type, kind, width, height, previewUrl };
    }

    const scale = Math.min(1, MAX_SIDE / Math.max(width, height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    const context = canvas.getContext('2d');
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    const blob = await toBlob(canvas, 'image/jpeg', QUALITY);
    if (blob.size > MAX_MEDIA_BYTES) {
      throw new Error('That photo is still over 2 MB after shrinking it.');
    }

    return {
      blob,
      mime: 'image/jpeg',
      kind,
      width: canvas.width,
      height: canvas.height,
      previewUrl,
    };
  } catch (e) {
    URL.revokeObjectURL(previewUrl);
    throw e;
  }
};

/**
 * Uploads a prepared attachment and returns the `media` field for the
 * message: the same shape (ChatMedia) and the same Storage path the app
 * writes, chatMedia/{threadId}/{time}_{sender}.{ext}, so storage.rules and
 * the app's own player treat it exactly like one of theirs.
 */
export const uploadChatMedia = async (threadId, senderId, attachment) => {
  const ext = (attachment.mime.split('/')[1] || 'bin').split(';')[0];
  const path = `chatMedia/${threadId}/${Date.now()}_${senderId}.${ext}`;
  const storageRef = ref(getStorage(getFirebaseApp()), path);

  await uploadBytes(storageRef, attachment.blob, {
    contentType: attachment.mime,
  });
  const url = await getDownloadURL(storageRef);

  // Firestore refuses undefined values, so the optional sizes are only
  // written when known.
  return {
    kind: attachment.kind,
    url,
    mime: attachment.mime,
    ...(attachment.width ? { width: attachment.width } : {}),
    ...(attachment.height ? { height: attachment.height } : {}),
  };
};
