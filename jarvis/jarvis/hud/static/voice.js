// Device voice: record with THIS device's mic (e.g. an iPad), send 16 kHz WAV to the computer
// running Jarvis for local transcription (faster-whisper), then play the reply audio (Kokoro)
// here. If the computer has no Kokoro, the device's own built-in voice reads the reply.
(() => {
  const $ = (id) => document.getElementById(id);
  const V = () => window.VAULT;

  const TARGET_RATE = 16000;
  const END_SILENCE_MS = 900;     // stop after this much quiet once speech started
  const NO_SPEECH_MS = 7000;      // tap-to-talk gives up if you don't say anything
  const MAX_UTTERANCE_MS = 20000;
  const PREROLL_FRAMES = 4;       // keep ~0.3 s before speech so the first syllable isn't clipped

  let ctx = null, stream = null, source = null, proc = null;
  let capturing = false, heard = false, busy = false, handsFree = false;
  let frames = [], preroll = [], startedAt = 0, heardAt = 0, lastVoiceAt = 0;
  let noiseFloor = 0.004;
  let player = null, analyser = null, meterRaf = 0;

  // ── audio plumbing ───────────────────────────────────────────────────
  async function ensureContext() {
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      // iOS only allows speech/audio that a tap started; unlock both now, inside the tap.
      if ("speechSynthesis" in window) speechSynthesis.speak(new SpeechSynthesisUtterance(""));
    }
    if (ctx.state === "suspended") await ctx.resume();
  }

  async function openMic() {
    if (stream) return;
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error(location.protocol === "https:" || location.hostname === "127.0.0.1" || location.hostname === "localhost"
        ? "This browser can't use the microphone."
        : "The microphone needs HTTPS. On the computer, start Jarvis with: python -m jarvis run --ipad");
    }
    stream = await navigator.mediaDevices.getUserMedia({
      audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true },
    });
    source = ctx.createMediaStreamSource(stream);
    proc = ctx.createScriptProcessor(4096, 1, 1);
    proc.onaudioprocess = (e) => onFrame(e.inputBuffer.getChannelData(0));
    source.connect(proc);
    proc.connect(ctx.destination); // Safari only runs the processor when it's connected; it outputs silence
  }

  function closeMic() {
    try { proc?.disconnect(); source?.disconnect(); } catch {}
    stream?.getTracks().forEach((t) => t.stop());
    stream = source = proc = null;
  }

  // ── capture + end-of-speech detection ────────────────────────────────
  function onFrame(data) {
    if (!capturing) return;
    let sum = 0;
    for (let i = 0; i < data.length; i++) sum += data[i] * data[i];
    const rms = Math.sqrt(sum / data.length);
    V().bumpLevel(Math.min(rms * 12, 1));
    const now = performance.now();
    const threshold = Math.max(0.01, noiseFloor * 3);
    if (rms >= threshold) {
      if (!heard) { heard = true; heardAt = now; frames = preroll.slice(); V().setMode("hearing"); }
      lastVoiceAt = now;
    } else if (!heard) {
      noiseFloor = noiseFloor * 0.95 + rms * 0.05; // learn the room's background level
    }
    const copy = new Float32Array(data);
    if (heard) frames.push(copy);
    else { preroll.push(copy); if (preroll.length > PREROLL_FRAMES) preroll.shift(); }

    if (heard && (now - lastVoiceAt > END_SILENCE_MS || now - heardAt > MAX_UTTERANCE_MS)) finish();
    else if (!heard && !handsFree && now - startedAt > NO_SPEECH_MS) { cancel(); V().say("system", "Didn't hear anything — tap and try again."); }
  }

  function arm() {
    frames = []; preroll = []; heard = false;
    startedAt = performance.now();
    capturing = true;
    setButton(true, handsFree ? "Listening…" : "Listening… tap to send");
    V().setMode("listening");
  }

  function cancel() {
    capturing = false;
    setButton(false);
    V().setMode("standby");
    if (!handsFree) closeMic();
  }

  async function finish() {
    capturing = false;
    const recorded = frames; frames = [];
    if (!recorded.length) return handsFree ? arm() : cancel();
    setButton(true, "Thinking…", true);
    V().setMode("thinking");
    try {
      const wav = encodeWav(downsample(concat(recorded), ctx.sampleRate, TARGET_RATE), TARGET_RATE);
      const r = await fetch(`/api/voice?wake=${handsFree ? 1 : 0}&speak=1`, {
        method: "POST", headers: { "Content-Type": "audio/wav" }, body: wav,
      });
      if (r.status === 401) return location.assign("/");
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || r.statusText);
      await handleReply(data);
    } catch (err) {
      V().say("error", err.message || String(err), "", "err");
    }
    if (handsFree) arm(); else { setButton(false); V().setMode("standby"); closeMic(); }
  }

  async function handleReply(data) {
    if (!data.transcript) return;
    if (data.ignored) {
      $("routeLine").textContent = `heard “${data.transcript}” — say “${V().wakeWords[0] || "Jarvis"}” first`;
      return;
    }
    const reply = data.reply || {};
    if (!reply.route) V().say(V().assistant, reply.text, "", "ai"); // replies without a route aren't broadcast
    if (data.audio) await playWav(base64ToBuffer(data.audio));
    else if (reply.text) await speakOnDevice(reply.text);
  }

  // ── playback (orb follows the voice) ─────────────────────────────────
  async function playWav(arrayBuffer) {
    stopPlayback();
    const buf = await ctx.decodeAudioData(arrayBuffer);
    player = ctx.createBufferSource();
    player.buffer = buf;
    analyser = ctx.createAnalyser();
    analyser.fftSize = 512;
    player.connect(analyser);
    analyser.connect(ctx.destination);
    V().setMode("speaking");
    const samples = new Float32Array(analyser.fftSize);
    const meter = () => {
      analyser.getFloatTimeDomainData(samples);
      let s = 0; for (const x of samples) s += x * x;
      V().bumpLevel(Math.min(Math.sqrt(s / samples.length) * 6, 1));
      meterRaf = requestAnimationFrame(meter);
    };
    meter();
    await new Promise((resolve) => { player.onended = resolve; player.start(); });
    cancelAnimationFrame(meterRaf);
    player = null;
    V().setMode("standby");
  }

  function speakOnDevice(text) {
    if (!("speechSynthesis" in window) || !text) return Promise.resolve();
    return new Promise((resolve) => {
      const u = new SpeechSynthesisUtterance(text);
      let done = false;
      const end = () => { if (done) return; done = true; clearInterval(pulse); clearTimeout(guard); V().setMode("standby"); resolve(); };
      u.onend = u.onerror = end;
      // Some devices never fire onend (e.g. no voices installed); don't leave the mic stuck.
      const guard = setTimeout(end, 4000 + text.split(/\s+/).length * 600);
      const pulse = setInterval(() => V().bumpLevel(0.3 + Math.random() * 0.4), 90);
      V().setMode("speaking");
      speechSynthesis.speak(u);
    });
  }

  function stopPlayback() {
    try { player?.stop(); } catch {}
    player = null;
    cancelAnimationFrame(meterRaf);
    if ("speechSynthesis" in window) speechSynthesis.cancel();
  }

  // ── WAV helpers ──────────────────────────────────────────────────────
  function concat(chunks) {
    const out = new Float32Array(chunks.reduce((n, c) => n + c.length, 0));
    let o = 0; for (const c of chunks) { out.set(c, o); o += c.length; }
    return out;
  }

  function downsample(data, from, to) {
    if (from === to) return data;
    const ratio = from / to, out = new Float32Array(Math.floor(data.length / ratio));
    for (let i = 0; i < out.length; i++) { // average each window: cheap anti-aliasing
      const start = Math.floor(i * ratio), end = Math.min(data.length, Math.floor((i + 1) * ratio));
      let s = 0; for (let j = start; j < end; j++) s += data[j];
      out[i] = s / Math.max(1, end - start);
    }
    return out;
  }

  function encodeWav(samples, rate) {
    const buf = new ArrayBuffer(44 + samples.length * 2), v = new DataView(buf);
    const str = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
    str(0, "RIFF"); v.setUint32(4, 36 + samples.length * 2, true); str(8, "WAVE");
    str(12, "fmt "); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
    v.setUint32(24, rate, true); v.setUint32(28, rate * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true);
    str(36, "data"); v.setUint32(40, samples.length * 2, true);
    for (let i = 0; i < samples.length; i++) {
      const x = Math.max(-1, Math.min(1, samples[i]));
      v.setInt16(44 + i * 2, x < 0 ? x * 0x8000 : x * 0x7fff, true);
    }
    return new Blob([buf], { type: "audio/wav" });
  }

  function base64ToBuffer(b64) {
    const bin = atob(b64), bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes.buffer;
  }

  // ── UI ───────────────────────────────────────────────────────────────
  function setButton(on, label, isBusy = false) {
    busy = isBusy;
    $("micBtn").setAttribute("aria-pressed", String(on));
    $("micBtn").classList.toggle("busy", isBusy);
    $("micLabel").textContent = label || (handsFree ? "Start listening" : "Tap to talk");
  }

  $("micBtn").addEventListener("click", async () => {
    if (busy) return;
    try {
      await ensureContext();
      stopPlayback();
      if (capturing) { // second tap: send now (tap mode) or stop listening (hands-free)
        if (handsFree) { handsFree = false; $("handsFree").checked = false; cancel(); }
        else if (heard) finish(); else cancel();
        return;
      }
      await openMic();
      arm();
    } catch (err) {
      setButton(false);
      V().setMode("standby");
      const denied = err && (err.name === "NotAllowedError" || err.name === "SecurityError");
      V().say("error", denied
        ? "Microphone access was blocked. On iPad: Settings → Safari → Microphone → Allow, then reload."
        : err.message || String(err), "", "err");
    }
  });

  $("handsFree").addEventListener("change", (e) => {
    handsFree = e.target.checked;
    if (!capturing) setButton(false);
    else if (!handsFree) cancel();
  });

  // iOS blocks audio that isn't started by a touch. Unlock on the first interaction so replies
  // to typed commands (which arrive after a network wait) can still be spoken.
  const unlock = () => ensureContext().catch(() => {});
  document.addEventListener("pointerdown", unlock, { once: true, capture: true });
  document.addEventListener("keydown", unlock, { once: true, capture: true });

  window.VAULT_VOICE = {
    async speak(text) { // used by the "speak" toggle for typed commands
      try {
        await ensureContext();
        const r = await fetch("/api/tts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text }) });
        if (r.status === 200) await playWav(await r.arrayBuffer());
        else await speakOnDevice(text);
      } catch { await speakOnDevice(text); }
    },
    stop() {
      stopPlayback();
      if (capturing) { handsFree = false; $("handsFree").checked = false; cancel(); }
      closeMic();
    },
  };
})();
