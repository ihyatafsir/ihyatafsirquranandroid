import React, { useMemo } from "react";
import { Platform } from "react-native";
import { injectQuranicFonts } from "../utils/fontLoader";
injectQuranicFonts();

interface LetterTimingEntry {
  wordIdx?: number;
  charIdx?: number;
  char: string;
  start: number;
  end: number;
  duration?: number;
}

interface FluidMushafCanvasProps {
  verses: { surah: number; ayah: number; text: string; words?: any[] }[];
  letterTimingMap: { [key: string]: LetterTimingEntry[] } | { [key: number]: LetterTimingEntry[] };
  currentVerseKey: string | null;
  currentTimeMs: number;
  isPlaying: boolean;
  surahNumber?: number;
  reciter?: string;
  onSeekAyah?: (ayah: number) => void;
  onWordClick?: (surah: number, ayah: number, wordIdx: number, wordText: string, start?: number, end?: number) => void;
}

function toArabicNumerals(num: number): string {
  const digits = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
  return num.toString().split("").map(d => digits[parseInt(d, 10)] || d).join("");
}

export const FluidMushafCanvas: React.FC<FluidMushafCanvasProps> = ({
  verses,
  currentVerseKey,
  currentTimeMs,
  isPlaying,
  surahNumber = 1,
  onSeekAyah,
  onWordClick,
}) => {
  if (Platform.OS !== "web") {
    return null;
  }

  const currentAyahNum = currentVerseKey ? parseInt(currentVerseKey.split(":")[1], 10) : 0;

  return (
    <div
      style={{
        width: "100%",
        maxWidth: "800px",
        margin: "0 auto",
        padding: "16px 20px 100px 20px",
        direction: "rtl",
        textAlign: "justify",
        textAlignLast: "center",
        fontFamily: "'Amiri Quran', 'Amiri', 'Noto Naskh Arabic', serif",
        fontSize: "25px",
        lineHeight: "2.6",
        color: "#cbd5e1",
        backgroundColor: "#030712",
        userSelect: "none",
        WebkitUserSelect: "none",
      }}
    >
      {verses.map((v) => {
        const aNum = v.ayah;
        const isActiveAyah = currentAyahNum === aNum && isPlaying;
        const words = v.words && v.words.length > 0 ? v.words : (v.text || "").trim().split(/\s+/).map((w: any) => ({ arabic: typeof w === "string" ? w : (w.arabic || "") }));

        return (
          <span
            key={aNum}
            id={`ayah-${aNum}`}
            onClick={() => onSeekAyah && onSeekAyah(aNum)}
            style={{
              display: "inline",
              borderRadius: "8px",
              backgroundColor: isActiveAyah ? "rgba(251, 191, 36, 0.08)" : "transparent",
              transition: "background 0.3s ease",
              cursor: "pointer",
            }}
          >
            {words.map((w: any, wIdx: number) => {
              const text = typeof w === "string" ? w : (w.arabic || "");
              return (
                <span
                  key={wIdx}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onWordClick) {
                      onWordClick(surahNumber, aNum, wIdx, text);
                    } else if (onSeekAyah) {
                      onSeekAyah(aNum);
                    }
                  }}
                  style={{
                    display: "inline-block",
                    padding: "0 3px",
                    margin: "0 1px",
                    borderRadius: "6px",
                    cursor: "pointer",
                    transition: "color 0.15s ease, background 0.15s ease",
                  }}
                >
                  {text}
                </span>
              );
            })}
            <span
              style={{
                display: "inline-block",
                color: "#fbbf24",
                fontSize: "23px",
                margin: "0 5px",
                cursor: "pointer",
                textShadow: "0 0 8px rgba(251, 191, 36, 0.5)",
                verticalAlign: "middle",
              }}
            >
              {" "}۝{toArabicNumerals(aNum)}{" "}
            </span>
          </span>
        );
      })}
    </div>
  );
};

export default FluidMushafCanvas;
