import { Platform } from 'react-native';

/**
 * Injects Quranic web fonts (@font-face) into DOM head for web/canvas environments.
 * Graceful no-op on native Android / iOS.
 */
export function injectQuranicFonts(): void {
  if (Platform.OS === 'web' && typeof document !== 'undefined') {
    const fontId = 'quranic-fonts-definition';
    if (!document.getElementById(fontId)) {
      const style = document.createElement('style');
      style.id = fontId;
      style.textContent = `
        @font-face {
          font-family: 'Amiri Quran';
          src: local('Amiri Quran'), url('/assets/fonts/AmiriQuran.ttf') format('truetype');
          font-weight: normal;
          font-style: normal;
        }
        @font-face {
          font-family: 'me_quran';
          src: local('me_quran'), url('/assets/fonts/me_quran.ttf') format('truetype');
          font-weight: normal;
          font-style: normal;
        }
        @font-face {
          font-family: 'hafs';
          src: local('hafs'), url('/assets/fonts/hafs.otf') format('opentype');
          font-weight: normal;
          font-style: normal;
        }
      `;
      document.head.appendChild(style);
    }
  }
}
