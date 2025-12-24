import { getMediaUrl, isImageValue, isVideoValue } from '../utils';

describe('observations utils', () => {
  describe('isImageValue', () => {
    it('should return true for PNG files', () => {
      expect(isImageValue('image.png')).toBe(true);
      expect(isImageValue('photo.PNG')).toBe(true);
    });

    it('should return true for JPG/JPEG files', () => {
      expect(isImageValue('image.jpg')).toBe(true);
      expect(isImageValue('photo.jpeg')).toBe(true);
      expect(isImageValue('picture.JPG')).toBe(true);
      expect(isImageValue('picture.JPEG')).toBe(true);
    });

    it('should return true for GIF files', () => {
      expect(isImageValue('animation.gif')).toBe(true);
      expect(isImageValue('animation.GIF')).toBe(true);
    });

    it('should return true for BMP files', () => {
      expect(isImageValue('image.bmp')).toBe(true);
      expect(isImageValue('image.BMP')).toBe(true);
    });

    it('should return true for WEBP files', () => {
      expect(isImageValue('image.webp')).toBe(true);
      expect(isImageValue('image.WEBP')).toBe(true);
    });

    it('should return false for non-image files', () => {
      expect(isImageValue('document.pdf')).toBe(false);
      expect(isImageValue('video.mp4')).toBe(false);
      expect(isImageValue('text.txt')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(isImageValue('')).toBe(false);
    });

    it('should return false for null/undefined values', () => {
      expect(isImageValue(null as any)).toBe(false);
      expect(isImageValue(undefined as any)).toBe(false);
    });

    it('should handle filenames with paths', () => {
      expect(isImageValue('/path/to/image.png')).toBe(true);
      expect(isImageValue('/path/to/video.mp4')).toBe(false);
    });

    it('should handle filenames with multiple dots', () => {
      expect(isImageValue('my.image.file.jpg')).toBe(true);
      expect(isImageValue('my.video.file.mp4')).toBe(false);
    });

    it('should be case insensitive', () => {
      expect(isImageValue('IMAGE.PnG')).toBe(true);
      expect(isImageValue('photo.JpEg')).toBe(true);
    });
  });

  describe('isVideoValue', () => {
    it('should return true for MP4 files', () => {
      expect(isVideoValue('video.mp4')).toBe(true);
      expect(isVideoValue('video.MP4')).toBe(true);
    });

    it('should return true for WEBM files', () => {
      expect(isVideoValue('video.webm')).toBe(true);
      expect(isVideoValue('video.WEBM')).toBe(true);
    });

    it('should return true for OGG files', () => {
      expect(isVideoValue('video.ogg')).toBe(true);
      expect(isVideoValue('video.OGG')).toBe(true);
    });

    it('should return true for MOV files', () => {
      expect(isVideoValue('video.mov')).toBe(true);
      expect(isVideoValue('video.MOV')).toBe(true);
    });

    it('should return true for AVI files', () => {
      expect(isVideoValue('video.avi')).toBe(true);
      expect(isVideoValue('video.AVI')).toBe(true);
    });

    it('should return true for MKV files', () => {
      expect(isVideoValue('video.mkv')).toBe(true);
      expect(isVideoValue('video.MKV')).toBe(true);
    });

    it('should return false for non-video files', () => {
      expect(isVideoValue('document.pdf')).toBe(false);
      expect(isVideoValue('image.png')).toBe(false);
      expect(isVideoValue('text.txt')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(isVideoValue('')).toBe(false);
    });

    it('should return false for null/undefined values', () => {
      expect(isVideoValue(null as any)).toBe(false);
      expect(isVideoValue(undefined as any)).toBe(false);
    });

    it('should handle filenames with paths', () => {
      expect(isVideoValue('/path/to/video.mp4')).toBe(true);
      expect(isVideoValue('/path/to/image.jpg')).toBe(false);
    });

    it('should handle filenames with multiple dots', () => {
      expect(isVideoValue('my.video.file.mp4')).toBe(true);
      expect(isVideoValue('my.image.file.png')).toBe(false);
    });

    it('should be case insensitive', () => {
      expect(isVideoValue('VIDEO.Mp4')).toBe(true);
      expect(isVideoValue('clip.WeBm')).toBe(true);
    });
  });

  describe('getMediaUrl', () => {
    it('should return correct URL for a given filename', () => {
      const filename = 'image123.png';
      const expectedUrl =
        '/openmrs/auth?requested_document=/document_images/image123.png';

      expect(getMediaUrl(filename)).toBe(expectedUrl);
    });

    it('should handle different file extensions', () => {
      expect(getMediaUrl('photo.jpg')).toBe(
        '/openmrs/auth?requested_document=/document_images/photo.jpg',
      );
      expect(getMediaUrl('video.mp4')).toBe(
        '/openmrs/auth?requested_document=/document_images/video.mp4',
      );
    });

    it('should handle filenames with special characters', () => {
      const filename = 'my file (1).png';
      const expectedUrl =
        '/openmrs/auth?requested_document=/document_images/my file (1).png';

      expect(getMediaUrl(filename)).toBe(expectedUrl);
    });

    it('should handle filenames with spaces', () => {
      const filename = 'my image.png';
      const expectedUrl =
        '/openmrs/auth?requested_document=/document_images/my image.png';

      expect(getMediaUrl(filename)).toBe(expectedUrl);
    });

    it('should handle long filenames', () => {
      const filename = 'very_long_filename_with_many_characters_123456.png';
      const expectedUrl = `/openmrs/auth?requested_document=/document_images/${filename}`;

      expect(getMediaUrl(filename)).toBe(expectedUrl);
    });

    it('should handle empty string', () => {
      const expectedUrl = '/openmrs/auth?requested_document=/document_images/';

      expect(getMediaUrl('')).toBe(expectedUrl);
    });

    it('should construct URL with correct format', () => {
      const result = getMediaUrl('test.png');

      expect(result).toContain('/openmrs/auth');
      expect(result).toContain('requested_document');
      expect(result).toContain('/document_images/');
      expect(result).toContain('test.png');
    });
  });
});
