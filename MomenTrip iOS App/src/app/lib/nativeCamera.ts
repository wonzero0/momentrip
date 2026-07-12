import { Capacitor } from '@capacitor/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

export function isNativeApp() {
  return Capacitor.isNativePlatform();
}

export async function pickNativePhotoBlob() {
  const photo = await Camera.getPhoto({
    quality: 82,
    allowEditing: false,
    resultType: CameraResultType.Uri,
    source: CameraSource.Prompt,
  });

  if (!photo.webPath) {
    throw new Error('사진 경로를 가져오지 못했습니다.');
  }

  const response = await fetch(photo.webPath);
  const blob = await response.blob();
  const extension = photo.format || 'jpg';

  return {
    blob,
    filename: `momentrip-${Date.now()}.${extension}`,
  };
}
