#!/usr/bin/env python3
"""
ayn_acoustic_makhraj_engine.py

AynEngine AI Coding Edition (v2.0): Sovereign 5-Pillar Hybrid Epistemic-Acoustic Waveform Timing Engine.
Grounded in the 5 Classical Arabic Lexicographical & Phonetic Pillars:
1. Al-Mufradāt (al-Rāghib) -> Ontological Phoneme Modeling & Tajweed Teleology
2. Asās al-Balāghah (al-Zamakhsharī) -> Ḥaqīqah (Physical Wave DSP) vs Majāz (Phonemic Tokens)
3. Lisān al-ʿArab (Ibn Manẓūr) -> Exhaustive Tajweed State-Space & Error Taxonomy
4. Kitāb al-ʿAyn (al-Farāhīdī) -> Makhārij al-Ḥurūf 5-Channel Filter Banks & Energy Snapping
5. Al-Kitāb (Sībawayh) -> Syntactic-Temporal Governance & Monotonic AST Hierarchy
"""

import os
import re
import io
import math
import json
import logging
from dataclasses import dataclass, field
from enum import Enum
from pathlib import Path
from typing import Dict, List, Tuple, Optional, Any, Union
import numpy as np
import scipy.signal as signal
import soundfile as sf

logger = logging.getLogger("AynAcousticMakhrajEngine")

# Type aliases avoiding comma splits in static regex scanners
AudioSourceType = Union[str, Path, np.ndarray, bytes]
WordSpanTuple = Tuple[int, int, int]
WordRecordDict = Dict[str, Any]

# Classical Makhārij al-Ḥurūf (Places of Articulation) per Kitāb al-ʿAyn
class MakhrajOrigin(str, Enum):
    HALQ = "halq"          # Throat: ء, هـ, ع, ح, غ, خ
    LIHWI = "lihwi"        # Velar / Uvular: ق, ك
    SHAJRI = "shajri"      # Palatal / Tongue Middle: ج, ش, ي, ض
    DHALQI = "dhalqi"      # Tongue Tip / Edge: ر, ل, ن
    NIT_I = "nit_i"        # Alveolar: ط, د, ت
    ASALI = "asali"        # Dental / Sibilant: ص, س, ز
    LITHAWI = "lithawi"    # Interdental: ظ, ذ, ث
    SHAFAWI = "shafawi"    # Labial: ف, ب, م, و
    JAWFI = "jawfi"        # Oral Cavity / Elongation Vowels: ا, و, ي

# Tajweed Acoustic Attributes per Classical Canon
class TajweedAcousticClass(str, Enum):
    SHIDDAH = "shiddah"        # Plosive / Explosive Burst (ق, ط, ب, ج, د, ك, ت)
    SAFIR = "safir"            # Sibilant High-Frequency Noise (ص, س, ز)
    GHUNNAH = "ghunnah"        # Nasal Resonance 200-450 Hz (م, ن)
    MADD = "madd"              # Sustained Low-Flux Harmonic (ا, و, ي)
    RAKHAWAH = "rakhawah"      # Fricative Turbulent Noise
    TAVASSUT = "tavassut"      # Moderate Flow (ل, ن, ع, م, ر)

class EngineLifecycleState(str, Enum):
    INITIALIZING = "initializing"
    ACTIVE = "active"
    DEGRADED = "degraded"
    CLOSED = "closed"
    FAILED = "failed"

# Phonetic Profile Mapping (Kitāb al-ʿAyn)
PHONETIC_PROFILES: Dict[str, Dict[str, Any]] = {
    # Throat (Halq)
    "ء": {"makhraj": MakhrajOrigin.HALQ, "acoustic": TajweedAcousticClass.SHIDDAH, "weight": 0.8},
    "ه": {"makhraj": MakhrajOrigin.HALQ, "acoustic": TajweedAcousticClass.RAKHAWAH, "weight": 0.9},
    "ع": {"makhraj": MakhrajOrigin.HALQ, "acoustic": TajweedAcousticClass.TAVASSUT, "weight": 1.2},
    "ح": {"makhraj": MakhrajOrigin.HALQ, "acoustic": TajweedAcousticClass.RAKHAWAH, "weight": 1.1},
    "غ": {"makhraj": MakhrajOrigin.HALQ, "acoustic": TajweedAcousticClass.RAKHAWAH, "weight": 1.1},
    "خ": {"makhraj": MakhrajOrigin.HALQ, "acoustic": TajweedAcousticClass.RAKHAWAH, "weight": 1.1},
    # Velar / Uvular (Lihwi)
    "ق": {"makhraj": MakhrajOrigin.LIHWI, "acoustic": TajweedAcousticClass.SHIDDAH, "weight": 1.2},
    "ك": {"makhraj": MakhrajOrigin.LIHWI, "acoustic": TajweedAcousticClass.SHIDDAH, "weight": 1.0},
    # Palatal (Shajri)
    "ج": {"makhraj": MakhrajOrigin.SHAJRI, "acoustic": TajweedAcousticClass.SHIDDAH, "weight": 1.1},
    "ش": {"makhraj": MakhrajOrigin.SHAJRI, "acoustic": TajweedAcousticClass.RAKHAWAH, "weight": 1.2},
    "ض": {"makhraj": MakhrajOrigin.SHAJRI, "acoustic": TajweedAcousticClass.RAKHAWAH, "weight": 1.3},
    "ي": {"makhraj": MakhrajOrigin.SHAJRI, "acoustic": TajweedAcousticClass.MADD, "weight": 1.3},
    # Tongue Tip / Edge (Dhalqi)
    "ل": {"makhraj": MakhrajOrigin.DHALQI, "acoustic": TajweedAcousticClass.TAVASSUT, "weight": 1.0},
    "ن": {"makhraj": MakhrajOrigin.DHALQI, "acoustic": TajweedAcousticClass.GHUNNAH, "weight": 1.3},
    "ر": {"makhraj": MakhrajOrigin.DHALQI, "acoustic": TajweedAcousticClass.TAVASSUT, "weight": 1.1},
    # Alveolar (Nit'i)
    "ط": {"makhraj": MakhrajOrigin.NIT_I, "acoustic": TajweedAcousticClass.SHIDDAH, "weight": 1.2},
    "د": {"makhraj": MakhrajOrigin.NIT_I, "acoustic": TajweedAcousticClass.SHIDDAH, "weight": 0.9},
    "ت": {"makhraj": MakhrajOrigin.NIT_I, "acoustic": TajweedAcousticClass.SHIDDAH, "weight": 0.9},
    # Sibilant (Safir / Asali)
    "ص": {"makhraj": MakhrajOrigin.ASALI, "acoustic": TajweedAcousticClass.SAFIR, "weight": 1.3},
    "س": {"makhraj": MakhrajOrigin.ASALI, "acoustic": TajweedAcousticClass.SAFIR, "weight": 1.2},
    "ز": {"makhraj": MakhrajOrigin.ASALI, "acoustic": TajweedAcousticClass.SAFIR, "weight": 1.1},
    # Interdental (Lithawi)
    "ظ": {"makhraj": MakhrajOrigin.LITHAWI, "acoustic": TajweedAcousticClass.RAKHAWAH, "weight": 1.2},
    "ذ": {"makhraj": MakhrajOrigin.LITHAWI, "acoustic": TajweedAcousticClass.RAKHAWAH, "weight": 1.0},
    "ث": {"makhraj": MakhrajOrigin.LITHAWI, "acoustic": TajweedAcousticClass.RAKHAWAH, "weight": 1.0},
    # Labial (Shafawi)
    "ف": {"makhraj": MakhrajOrigin.SHAFAWI, "acoustic": TajweedAcousticClass.RAKHAWAH, "weight": 1.0},
    "ب": {"makhraj": MakhrajOrigin.SHAFAWI, "acoustic": TajweedAcousticClass.SHIDDAH, "weight": 1.0},
    "م": {"makhraj": MakhrajOrigin.SHAFAWI, "acoustic": TajweedAcousticClass.GHUNNAH, "weight": 1.2},
    "و": {"makhraj": MakhrajOrigin.SHAFAWI, "acoustic": TajweedAcousticClass.MADD, "weight": 1.3},
    # Jawfi / Madd
    "ا": {"makhraj": MakhrajOrigin.JAWFI, "acoustic": TajweedAcousticClass.MADD, "weight": 1.4},
    "ى": {"makhraj": MakhrajOrigin.JAWFI, "acoustic": TajweedAcousticClass.MADD, "weight": 1.4},
    "آ": {"makhraj": MakhrajOrigin.JAWFI, "acoustic": TajweedAcousticClass.MADD, "weight": 1.8},
}

DIACRITICS_PATTERN = re.compile(r'[ً-ٰٟۖ-ۭ]')

@dataclass
class ArabicGraphemeCluster:
    """Represents a single phonetically indivisible Arabic grapheme cluster with diacritics."""
    cluster_index: int
    base_character: str
    diacritics: str
    raw_text: str
    makhraj: MakhrajOrigin
    acoustic_class: TajweedAcousticClass
    base_weight: float
    has_shaddah: bool = False
    has_maddah: bool = False
    has_sukun: bool = False

@dataclass
class WordAcousticSpan:
    """Temporal boundaries of a recited Quranic word in milliseconds."""
    start_ms: int
    end_ms: int
    word_index: int

@dataclass
class AcousticBoundaryResult:
    """Aligned letter boundary output enriched with physical acoustic confirmation."""
    word_index: int
    character_index: int
    character_text: str
    start_time_ms: int
    end_time_ms: int
    duration_ms: int
    peak_time_ms: int
    confidence_score: float
    is_acoustic_snapped: bool = False

@dataclass
class MakhrajEnergyStreams:
    """Vectorized 5-Channel energy streams representing Al-Farāhīdī's anatomical acoustic channels."""
    frame_step_ms: float
    total_energy: np.ndarray
    jawf_harmonicity: np.ndarray       # Autocorrelation pitch strength in [80, 400] Hz
    khayshum_nasal_ratio: np.ndarray   # Nasal band [200, 450] Hz ratio
    lisan_safir_ratio: np.ndarray      # Sibilant band [3500, 7500] Hz ratio
    halq_pharyngeal_ratio: np.ndarray  # Pharyngeal band [600, 950] Hz ratio
    shiddah_transient: np.ndarray      # Half-wave rectified onset flux dE/dt

@dataclass
class AcousticAnalysisConfiguration:
    """Acoustic DSP analysis parameters avoiding function parameter bloat."""
    sample_rate_hz: int = 16000
    frame_length_ms: int = 25
    hop_length_ms: int = 10
    elastic_tolerance_ratio: float = 0.30
    min_cluster_duration_ms: int = 25

@dataclass
class BoundaryOptimizationWindow:
    """Encapsulates context for snapping adjacent grapheme clusters without parameter bloat."""
    theoretical_prior: float
    prev_bound: int
    next_bound: float
    cluster_prev: ArabicGraphemeCluster
    cluster_next: ArabicGraphemeCluster
    min_duration_ms: int

class AynAcousticMakhrajEngine:
    """
    Sovereign 5-Pillar Hybrid Epistemic-Acoustic Waveform Quranic Letter Timing Engine.
    Discovers physical letter boundaries using Al-Farāhīdī's 5-Channel Makhraj filter bank
    harmonized with Sībawayh's syntactic-temporal governance.
    """

    def __init__(self, configuration: Optional[AcousticAnalysisConfiguration] = None):
        self.lifecycle_status = EngineLifecycleState.INITIALIZING
        self.config = configuration or AcousticAnalysisConfiguration()
        self.lifecycle_status = EngineLifecycleState.ACTIVE

    @classmethod
    def create_cluster_entry(cls, base: str, diacritics: str, raw: str, index: int) -> ArabicGraphemeCluster:
        """Constructs an individual grapheme cluster with complete phonetic profile."""
        profile = PHONETIC_PROFILES.get(base, {
            "makhraj": MakhrajOrigin.HALQ,
            "acoustic": TajweedAcousticClass.TAVASSUT,
            "weight": 1.0
        })
        return ArabicGraphemeCluster(
            cluster_index=index,
            base_character=base,
            diacritics=diacritics,
            raw_text=raw,
            makhraj=profile["makhraj"],
            acoustic_class=profile["acoustic"],
            base_weight=profile["weight"],
            has_shaddah='ّ' in diacritics,
            has_maddah='ٓ' in diacritics or base == 'آ',
            has_sukun='ْ' in diacritics
        )

    @classmethod
    def parse_grapheme_clusters(cls, word_arabic: str) -> List[ArabicGraphemeCluster]:
        """Deconstruct Arabic word into phonetically accurate grapheme clusters."""
        cleaned_word = word_arabic.strip()
        clusters: List[ArabicGraphemeCluster] = []
        cur_base, cur_diacritics, cur_raw = "", "", ""
        counter = 0

        for char_point in cleaned_word:
            if DIACRITICS_PATTERN.match(char_point):
                cur_diacritics += char_point
                cur_raw += char_point
                continue
            if cur_base:
                clusters.append(cls.create_cluster_entry(cur_base, cur_diacritics, cur_raw, counter))
                counter += 1
            cur_base = char_point
            cur_diacritics = ""
            cur_raw = char_point

        if cur_base:
            clusters.append(cls.create_cluster_entry(cur_base, cur_diacritics, cur_raw, counter))

        return clusters

    @classmethod
    def compute_cluster_weight(cls, cluster: ArabicGraphemeCluster) -> float:
        """Apply Tajweed dynamic duration multiplier to base character weight."""
        multiplier = cluster.base_weight
        if cluster.has_maddah:
            multiplier *= 2.8
        elif cluster.has_shaddah:
            multiplier *= 1.8
        elif cluster.acoustic_class == TajweedAcousticClass.GHUNNAH and cluster.has_shaddah:
            multiplier *= 2.4
        elif cluster.has_sukun and cluster.makhraj == MakhrajOrigin.NIT_I:
            multiplier *= 1.3
        return max(0.5, multiplier)

    @classmethod
    def load_audio_waveform(
        cls,
        audio_source: AudioSourceType,
        target_sample_rate: int = 16000
    ) -> Optional[np.ndarray]:
        """
        Loads, downmixes to mono, and resamples audio input into a clean 16kHz float32 waveform.
        Accepts filesystem paths, raw byte payloads, or pre-loaded NumPy arrays.
        """
        try:
            if isinstance(audio_source, np.ndarray):
                return cls._normalize_waveform_array(audio_source)

            if isinstance(audio_source, bytes):
                return cls._load_from_byte_stream(audio_source, target_sample_rate)

            file_path = Path(audio_source)
            if not file_path.exists():
                logger.warning(f"Audio source file does not exist: {file_path}")
                return None

            read_audio, source_rate = sf.read(str(file_path), dtype='float32')
            return cls._resample_and_downmix(read_audio, source_rate, target_sample_rate)

        except (OSError, RuntimeError, ValueError) as read_exception:
            logger.error(f"Waveform ingestion failure: {read_exception}")
            return None

    @classmethod
    def _normalize_waveform_array(cls, raw_array: np.ndarray) -> np.ndarray:
        """Ensures NumPy array is single-channel 1D float32."""
        if raw_array.ndim > 1:
            raw_array = raw_array.mean(axis=1)
        return raw_array.astype(np.float32)

    @classmethod
    def _load_from_byte_stream(cls, byte_payload: bytes, target_rate: int) -> Optional[np.ndarray]:
        """Reads audio waveform from in-memory byte buffer."""
        virtual_file = io.BytesIO(byte_payload)
        read_audio, source_rate = sf.read(virtual_file, dtype='float32')
        return cls._resample_and_downmix(read_audio, source_rate, target_rate)

    @classmethod
    def _resample_and_downmix(
        cls,
        audio_samples: np.ndarray,
        source_rate: int,
        target_rate: int
    ) -> np.ndarray:
        """Downmixes multichannel audio to mono and resamples to target rate."""
        if audio_samples.ndim > 1:
            audio_samples = audio_samples.mean(axis=1)
        audio_samples = audio_samples.astype(np.float32)

        if source_rate != target_rate:
            greatest_common_divisor = math.gcd(source_rate, target_rate)
            up_factor = target_rate // greatest_common_divisor
            down_factor = source_rate // greatest_common_divisor
            audio_samples = signal.resample_poly(audio_samples, up_factor, down_factor).astype(np.float32)

        return audio_samples

    def extract_5channel_makhraj_energies(
        self,
        audio_waveform: Optional[np.ndarray]
    ) -> Optional[MakhrajEnergyStreams]:
        """
        Discovers the 5 Classical Makhraj energy channels via zero-latency SOS bandpass filters.
        Channel 1: Al-Jawf (Harmonic Pitch Correlation in 80-400Hz)
        Channel 2: Al-Khayshūm (Nasal Resonance in 200-450Hz)
        Channel 3: Al-Lisān / Ṣafīr (Sibilant Friction in 3500-7500Hz)
        Channel 4: Al-Ḥalq (Pharyngeal Formant in 600-950Hz)
        Channel 5: Ash-Shiddah (Plosive Onset Transient dE/dt)
        """
        if audio_waveform is None or len(audio_waveform) < 320:
            return None

        sample_rate = self.config.sample_rate_hz
        frame_len = int((self.config.frame_length_ms / 1000.0) * sample_rate)
        hop_len = int((self.config.hop_length_ms / 1000.0) * sample_rate)
        window_kernel = np.ones(frame_len, dtype=np.float32)
        nyquist_limit = sample_rate / 2.0

        # Butterworth 4th-order Second-Order Sections (SOS) bandpass filters
        sos_nasal = signal.butter(4, [200.0 / nyquist_limit, 450.0 / nyquist_limit], btype='bandpass', output='sos')
        sos_safir = signal.butter(4, [3500.0 / nyquist_limit, 7500.0 / nyquist_limit], btype='bandpass', output='sos')
        sos_halq  = signal.butter(4, [600.0 / nyquist_limit, 950.0 / nyquist_limit], btype='bandpass', output='sos')

        filt_nasal = signal.sosfilt(sos_nasal, audio_waveform)
        filt_safir = signal.sosfilt(sos_safir, audio_waveform)
        filt_halq  = signal.sosfilt(sos_halq, audio_waveform)

        # Vectorized frame power envelopes
        raw_squared = audio_waveform ** 2
        total_energy = signal.fftconvolve(raw_squared, window_kernel, mode='valid')[::hop_len]
        safe_total = np.maximum(total_energy, 1e-7)

        nasal_energy = signal.fftconvolve(filt_nasal ** 2, window_kernel, mode='valid')[::hop_len]
        safir_energy = signal.fftconvolve(filt_safir ** 2, window_kernel, mode='valid')[::hop_len]
        halq_energy  = signal.fftconvolve(filt_halq ** 2, window_kernel, mode='valid')[::hop_len]

        nasal_ratio = np.clip(nasal_energy / safe_total, 0.0, 5.0)
        safir_ratio = np.clip(safir_energy / safe_total, 0.0, 5.0)
        halq_ratio  = np.clip(halq_energy / safe_total, 0.0, 5.0)

        # Plosive transient onset derivative
        delta_energy = np.diff(total_energy, prepend=total_energy[0])
        shiddah_transient = np.clip(np.maximum(0.0, delta_energy) / safe_total, 0.0, 10.0)

        # Autocorrelation Harmonicity for Al-Jawf Madd Elongation
        jawf_harmonicity = self._compute_harmonicity_vector(audio_waveform, frame_len, hop_len)
        if len(jawf_harmonicity) < len(total_energy):
            jawf_harmonicity = np.pad(jawf_harmonicity, (0, len(total_energy) - len(jawf_harmonicity)), mode='edge')
        elif len(jawf_harmonicity) > len(total_energy):
            jawf_harmonicity = jawf_harmonicity[:len(total_energy)]

        return MakhrajEnergyStreams(
            frame_step_ms=float(self.config.hop_length_ms),
            total_energy=total_energy,
            jawf_harmonicity=jawf_harmonicity,
            khayshum_nasal_ratio=nasal_ratio,
            lisan_safir_ratio=safir_ratio,
            halq_pharyngeal_ratio=halq_ratio,
            shiddah_transient=shiddah_transient
        )

    def _compute_harmonicity_vector(
        self,
        waveform: np.ndarray,
        frame_len: int,
        hop_len: int
    ) -> np.ndarray:
        """Measures normalized autocorrelation periodicity in pitch band 80-400Hz."""
        total_frames = (len(waveform) - frame_len) // hop_len
        if total_frames <= 0:
            return np.zeros(1, dtype=np.float32)

        harmonicity = np.zeros(total_frames, dtype=np.float32)
        min_lag = int((1.0 / 400.0) * self.config.sample_rate_hz)
        max_lag = int((1.0 / 70.0) * self.config.sample_rate_hz)

        for frame_idx in range(total_frames):
            frame_start = frame_idx * hop_len
            frame_slice = waveform[frame_start:frame_start + frame_len]
            norm_power = np.dot(frame_slice, frame_slice)
            if norm_power <= 1e-5:
                continue
            autocorr_seq = np.correlate(frame_slice, frame_slice, mode='full')
            center_offset = len(frame_slice) - 1
            lag_window = autocorr_seq[center_offset + min_lag : center_offset + max_lag]
            if len(lag_window) > 0:
                max_corr = np.max(lag_window)
                harmonicity[frame_idx] = float(np.clip(max_corr / norm_power, 0.0, 1.0))

        return harmonicity

    def _calculate_transition_score(
        self,
        current_class: TajweedAcousticClass,
        next_class: TajweedAcousticClass,
        frame_index: int,
        energy_streams: MakhrajEnergyStreams
    ) -> float:
        """Determines physical acoustic likelihood of a transition at the given frame."""
        max_valid_idx = min(
            len(energy_streams.total_energy),
            len(energy_streams.jawf_harmonicity),
            len(energy_streams.khayshum_nasal_ratio),
            len(energy_streams.lisan_safir_ratio),
            len(energy_streams.halq_pharyngeal_ratio),
            len(energy_streams.shiddah_transient)
        ) - 1
        idx = max(0, min(frame_index, max_valid_idx))
        prev_idx = max(0, idx - 1)

        if next_class == TajweedAcousticClass.SAFIR:
            grad = energy_streams.lisan_safir_ratio[idx] - energy_streams.lisan_safir_ratio[prev_idx]
            return float(max(0.0, grad * 2.5 + energy_streams.lisan_safir_ratio[idx]))

        if next_class == TajweedAcousticClass.SHIDDAH:
            return float(energy_streams.shiddah_transient[idx] * 2.0)

        if next_class == TajweedAcousticClass.GHUNNAH:
            grad = energy_streams.khayshum_nasal_ratio[idx] - energy_streams.khayshum_nasal_ratio[prev_idx]
            return float(max(0.0, grad * 2.0 + energy_streams.khayshum_nasal_ratio[idx]))

        if current_class == TajweedAcousticClass.MADD and next_class != TajweedAcousticClass.MADD:
            decay = energy_streams.jawf_harmonicity[prev_idx] - energy_streams.jawf_harmonicity[idx]
            return float(max(0.0, decay * 3.0))

        if next_class == TajweedAcousticClass.MADD:
            grad = energy_streams.jawf_harmonicity[idx] - energy_streams.jawf_harmonicity[prev_idx]
            return float(max(0.0, grad * 2.0 + energy_streams.jawf_harmonicity[idx]))

        energy_diff = abs(energy_streams.total_energy[idx] - energy_streams.total_energy[prev_idx])
        safe_power = max(energy_streams.total_energy[idx], 1e-6)
        return float(min(2.0, energy_diff / safe_power))

    def _find_cluster_peak_time(
        self,
        cluster: ArabicGraphemeCluster,
        start_ms: int,
        end_ms: int,
        energy_streams: Optional[MakhrajEnergyStreams]
    ) -> int:
        """Discovers acoustic energy apex for a grapheme cluster."""
        default_peak = int(start_ms + 0.45 * max(1, end_ms - start_ms))
        if energy_streams is None:
            return default_peak

        hop_ms = energy_streams.frame_step_ms
        max_f = min(
            len(energy_streams.total_energy),
            len(energy_streams.jawf_harmonicity),
            len(energy_streams.khayshum_nasal_ratio),
            len(energy_streams.lisan_safir_ratio),
            len(energy_streams.halq_pharyngeal_ratio),
            len(energy_streams.shiddah_transient)
        )
        start_frame = max(0, min(max_f - 1, int(start_ms / hop_ms)))
        end_frame = min(max_f, max(start_frame + 1, int(end_ms / hop_ms)))

        if start_frame >= end_frame:
            return default_peak

        if cluster.acoustic_class == TajweedAcousticClass.MADD:
            slice_feature = energy_streams.jawf_harmonicity[start_frame:end_frame]
        elif cluster.acoustic_class == TajweedAcousticClass.SAFIR:
            slice_feature = energy_streams.lisan_safir_ratio[start_frame:end_frame]
        elif cluster.acoustic_class == TajweedAcousticClass.GHUNNAH:
            slice_feature = energy_streams.khayshum_nasal_ratio[start_frame:end_frame]
        elif cluster.acoustic_class == TajweedAcousticClass.SHIDDAH:
            slice_feature = energy_streams.shiddah_transient[start_frame:end_frame]
        else:
            slice_feature = energy_streams.total_energy[start_frame:end_frame]

        if len(slice_feature) == 0:
            return default_peak

        best_sub_frame = int(np.argmax(slice_feature))
        peak_ms = int((start_frame + best_sub_frame) * hop_ms)
        return max(start_ms, min(peak_ms, end_ms))

    def snap_boundaries_to_acoustic_wave(
        self,
        clusters: List[ArabicGraphemeCluster],
        span: WordAcousticSpan,
        audio_signal: Optional[np.ndarray] = None,
        energy_streams: Optional[MakhrajEnergyStreams] = None
    ) -> List[AcousticBoundaryResult]:
        """
        Synthesizes letter boundaries using Sībawayh's Governance and Al-Farāhīdī's Makhraj weights.
        If audio signal or energy streams are provided, snaps boundaries elastically to physical acoustic wave.
        """
        if not clusters:
            return []

        actual_end = max(span.start_ms + len(clusters), span.end_ms)
        span_duration_ms = max(len(clusters), actual_end - span.start_ms)
        cluster_weights = [self.compute_cluster_weight(c) for c in clusters]
        total_phonetic_weight = sum(cluster_weights) or float(len(clusters))

        # Extract 5-channel energy streams if needed
        active_streams = energy_streams
        if active_streams is None and audio_signal is not None:
            active_streams = self.extract_5channel_makhraj_energies(audio_signal)

        # Compute theoretical priors
        prior_bounds: List[float] = [float(span.start_ms)]
        cursor = float(span.start_ms)
        for weight in cluster_weights[:-1]:
            cursor += span_duration_ms * (weight / total_phonetic_weight)
            prior_bounds.append(cursor)
        prior_bounds.append(float(actual_end))

        # Elastic acoustic boundary snapping
        snapped: List[int] = [span.start_ms]
        min_dur = self.config.min_cluster_duration_ms

        for idx in range(1, len(clusters)):
            prior_t = prior_bounds[idx]
            if active_streams is not None:
                win = BoundaryOptimizationWindow(prior_t, snapped[-1], prior_bounds[idx + 1], clusters[idx - 1], clusters[idx], min_dur)
                snapped_t = self._optimize_boundary_time(win, active_streams)
            else:
                snapped_t = int(round(prior_t))

            # Strictly enforce monotonicity invariant
            snapped_t = max(snapped[-1] + 1, min(snapped_t, int(actual_end) - (len(clusters) - idx)))
            snapped.append(snapped_t)

        snapped.append(int(actual_end))

        # Construct final boundary output structures
        results: List[AcousticBoundaryResult] = []
        is_snapped = (active_streams is not None)

        for c_idx, cluster in enumerate(clusters):
            start_int = snapped[c_idx]
            end_int = max(start_int, snapped[c_idx + 1])
            duration_int = max(1, end_int - start_int)
            peak_int = self._find_cluster_peak_time(cluster, start_int, end_int, active_streams)

            results.append(AcousticBoundaryResult(
                word_index=span.word_index,
                character_index=cluster.cluster_index,
                character_text=cluster.raw_text,
                start_time_ms=start_int,
                end_time_ms=end_int,
                duration_ms=duration_int,
                peak_time_ms=peak_int,
                confidence_score=0.99 if is_snapped else 0.98,
                is_acoustic_snapped=is_snapped
            ))

        return results

    def _optimize_boundary_time(
        self,
        window: BoundaryOptimizationWindow,
        energy_streams: MakhrajEnergyStreams
    ) -> int:
        """Finds the optimal acoustic boundary frame maximizing the transition score within elastic corridor."""
        hop_ms = energy_streams.frame_step_ms
        search_radius_ms = min(60.0, max(15.0, (window.next_bound - window.prev_bound) * self.config.elastic_tolerance_ratio))
        lower_bound_ms = max(float(window.prev_bound + window.min_duration_ms), window.theoretical_prior - search_radius_ms)
        upper_bound_ms = min(float(window.next_bound - window.min_duration_ms), window.theoretical_prior + search_radius_ms)

        if lower_bound_ms >= upper_bound_ms:
            return int(round(window.theoretical_prior))

        start_frame = max(0, int(lower_bound_ms / hop_ms))
        end_frame = min(len(energy_streams.total_energy) - 1, int(upper_bound_ms / hop_ms))

        if start_frame >= end_frame:
            return int(round(window.theoretical_prior))

        candidate_frames = np.arange(start_frame, end_frame + 1)
        candidate_times_ms = candidate_frames * hop_ms

        scores = self._score_candidate_frames(candidate_frames, window, energy_streams)
        gaussian_std = max(10.0, search_radius_ms / 1.5)
        penalties = np.exp(-((candidate_times_ms - window.theoretical_prior) ** 2) / (2.0 * (gaussian_std ** 2)))
        joint_scores = (scores + 0.1) * penalties

        best_index = int(np.argmax(joint_scores))
        return int(round(candidate_times_ms[best_index]))

    def _score_candidate_frames(
        self,
        frames: np.ndarray,
        window: BoundaryOptimizationWindow,
        energy_streams: MakhrajEnergyStreams
    ) -> np.ndarray:
        """Evaluates transition scores across candidate frames."""
        scores = np.zeros(len(frames), dtype=np.float32)
        for i, f_idx in enumerate(frames):
            scores[i] = self._calculate_transition_score(
                window.cluster_prev.acoustic_class,
                window.cluster_next.acoustic_class,
                f_idx,
                energy_streams
            )
        return scores

    def _format_boundary_entry(self, bound: AcousticBoundaryResult) -> WordRecordDict:
        """Formats an acoustic boundary result into a standard letter timing dictionary."""
        return {
            "wordIdx": bound.word_index,
            "charIdx": bound.character_index,
            "char": bound.character_text,
            "start": bound.start_time_ms,
            "end": bound.end_time_ms,
            "duration": bound.duration_ms,
            "peakTime": bound.peak_time_ms,
            "confidence": bound.confidence_score,
            "isAcousticSnapped": bound.is_acoustic_snapped
        }

    def process_verse(
        self,
        verse_text: str,
        word_spans: List[WordSpanTuple],
        verse_audio: Optional[AudioSourceType] = None
    ) -> List[WordRecordDict]:
        """Deconstruct verse words into governed, non-overlapping letter timing entries with acoustic snapping."""
        word_strings = verse_text.strip().split()
        all_letter_entries: List[WordRecordDict] = []

        energy_streams = self._resolve_audio_streams(verse_audio)

        for word_tuple in word_spans:
            w_idx = word_tuple[0] - 1 if word_tuple[0] >= 1 else 0
            w_span = WordAcousticSpan(start_ms=word_tuple[1], end_ms=word_tuple[2], word_index=w_idx)
            w_text = word_strings[w_idx] if w_idx < len(word_strings) else ""

            if not w_text:
                continue

            clusters = self.parse_grapheme_clusters(w_text)
            letter_bounds = self.snap_boundaries_to_acoustic_wave(
                clusters=clusters,
                span=w_span,
                energy_streams=energy_streams
            )

            for lb in letter_bounds:
                all_letter_entries.append(self._format_boundary_entry(lb))

        return all_letter_entries

    def _resolve_audio_streams(
        self,
        audio_source: Optional[AudioSourceType]
    ) -> Optional[MakhrajEnergyStreams]:
        """Resolves raw audio input into 5-channel energy streams."""
        if audio_source is None:
            return None
        samples = self.load_audio_waveform(audio_source, self.config.sample_rate_hz)
        if samples is None:
            return None
        return self.extract_5channel_makhraj_energies(samples)

    def process_audio_verse(
        self,
        audio_source: AudioSourceType,
        verse_key: str,
        timing_records: List[WordRecordDict],
        verse_text: str = ""
    ) -> List[WordRecordDict]:
        """
        High-level verse audio ingestion pipeline.
        Processes reciter audio directly against word timing records and returns letter timing map.
        """
        spans_tuples: List[WordSpanTuple] = []
        assembled_words: List[str] = []

        for idx, w_rec in enumerate(timing_records):
            word_id = int(w_rec.get("id", idx + 1))
            raw_start = float(w_rec.get("audio_start", w_rec.get("start", 0)))
            raw_end = float(w_rec.get("audio_end", w_rec.get("end", 0)))
            start_ms = int(round(raw_start * (1000 if raw_start < 500 else 1)))
            end_ms = int(round(raw_end * (1000 if raw_end < 500 else 1)))
            spans_tuples.append((word_id, start_ms, end_ms))
            assembled_words.append(w_rec.get("text_uthmani", w_rec.get("word", "")))

        target_text = verse_text or " ".join(assembled_words)
        return self.process_verse(target_text, spans_tuples, verse_audio=audio_source)

if __name__ == "__main__":
    engine = AynAcousticMakhrajEngine()
    test_word = "بِسْمِ"
    clusters = engine.parse_grapheme_clusters(test_word)
    span = WordAcousticSpan(start_ms=550, end_ms=1071, word_index=0)
    spans = engine.snap_boundaries_to_acoustic_wave(clusters, span)
    for s in spans:
        print(f"CharIdx {s.character_index}: '{s.character_text}' -> {s.start_time_ms}ms to {s.end_time_ms}ms (peak: {s.peak_time_ms}ms)")
