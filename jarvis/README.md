# Your Own Jarvis — V.A.U.L.T. command center

A voice-driven AI command center you own. It's built around Claude Fable 5, but any Claude model works, and so does Claude Code as the brain.
Speech in and speech out are processed entirely on your machine, and everything is set from one file: fork it, edit `config.toml`, and it's reskinned for a client.

```
 🎙 mic ──► faster-whisper ──► router ──────────────► brain ──────────► Kokoro ──► 🔊
           (local STT)        regex → local LLM → Haiku   │ skill + memory     (local TTS)
                                                          ▼
                                     Obsidian vault  ◄── report.md
                                          ▲
                         HUD (V.A.U.L.T.) ┴ metrics · voice orb · skill buttons · memory graph
```

| Layer | What it is | Where |
|---|---|---|
| 🧠 **Brain** | Work mapped into branches → skills, one folder + `SKILL.md` each | `skills/<branch>/<skill>/SKILL.md` |
| 💾 **Memory** | Obsidian vault of plain markdown, connected with `[[wikilinks]]` (no database) | `vault/` |
| 🎙 **Voice** | `faster-whisper` (ears) + `Kokoro` (mouth), both local | `jarvis/voice/` |
| 🖥 **Face** | The V.A.U.L.T. HUD: metrics, voice visualiser, skill commands, memory graph | `jarvis/hud/` |

## Quick start

```bash
cd jarvis
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt          # brain + HUD (HUD is stdlib-only)
export ANTHROPIC_API_KEY=...             # or `ant auth login`

python -m jarvis run --no-voice --open   # HUD only, type commands
```

Turn on the voice:

```bash
pip install -r requirements-voice.txt    # faster-whisper, kokoro, sounddevice
brew install espeak-ng                   # or: sudo apt install espeak-ng
python -m jarvis run --open              # say: "Jarvis, brief me"
```

Optional offline routing tier: install [Ollama](https://ollama.com) and `ollama pull qwen2.5:3b`.

Other commands:

```bash
python -m jarvis ask "research home battery options"   # one-shot text command
python -m jarvis route "what do we know about Acme"    # see which tier/skill picks it up
python -m jarvis skills                                # list the skill tree
python -m jarvis skills sync                           # link skills into .claude/skills + update vault Skill Map
python -m jarvis new-skill sales/proposal "Draft a proposal from discovery notes"
python -m pytest tests                                 # 21 tests, no network or mic needed
```

## Step 1 — The Brain (skill architecture)

```
skills/
  ops/       daily-brief · system-status
  research/  web-brief · summarize
  clients/   client-report · meeting-notes
  memory/    recall · capture
```

Each skill is a folder with a `SKILL.md`: frontmatter (`name`, `description`, optional `triggers`, `report`, `handler`) plus instructions.

**Lean context:** the router only ever sees the one-line catalog (`id: description`). The full `SKILL.md` body is read **only** for the skill that was picked, so each request carries just the instructions that moment needs.

`python -m jarvis skills sync` symlinks every skill into `.claude/skills/<branch>-<skill>/`. Claude Code then discovers the same skills natively, so running `claude` in this folder gives you the same brain without voice. Set `brain.backend = "claude_code"` to have the voice loop shell out to `claude -p` instead of calling the API directly.

## Step 2 — The Memory (Obsidian vault)

Open `vault/` as an Obsidian vault. On every command:

1. Notes are keyword-ranked (title matches are weighted higher).
2. The graph is walked one hop along `[[wikilinks]]`, so linked context comes along. A project note pulls in its client note, for example.
3. The top `brain.memory_notes` notes are injected as `<memory>`.

Every report the OS generates is written back to `vault/Reports/` as markdown. Each one has frontmatter (`type`, `skill`, `query`, `tags`) and a `Related:` line of wikilinks, so it shows up in Obsidian's graph and serves as memory for later requests. Voice captures ("Jarvis, note that…") go straight to `vault/Inbox/` without a model call.

## Step 3 — The Voice (100% local)

- **Ears:** `sounddevice` mic stream → energy-gated utterance detection → `faster-whisper` (`base.en`, int8 by default).
- **Wake word:** lines must start with a wake word (`"Jarvis, …"`). After a reply, there's an 8-second follow-up window when no wake word is needed.
- **Routing** (cheapest tier that can decide):
  1. **Regex** rules in `config.toml` plus per-skill `triggers:`. Instant and offline. Builtins like time/stop never touch a model.
  2. **Local model** via Ollama with a JSON-schema-constrained answer. Offline and fast.
  3. **Claude Haiku** (`claude-haiku-5-5`) with structured output, only when tiers 1–2 aren't confident.
- **Mouth:** Kokoro (`af_heart` voice) plays locally. The mic is muted while it talks (half-duplex), so it never transcribes itself.

Audio never leaves the machine. Only the transcribed text of a command that needs reasoning goes to Claude.

## Step 4 — The Face (HUD)

`python -m jarvis run` serves the HUD at `http://127.0.0.1:8765`. It has three panels:

- **Brain:** the skill tree. Click a skill to force your next command to it, skipping the router.
- **Voice console:** a reactive orb driven by live mic levels and the TTS loudness envelope, the route trace (`skill via tier · ms`), the conversation feed, and a command bar with a "speak" toggle.
- **Metrics + memory:** command count, average reply latency, routing-tier split, token usage, a vault link graph, and recent reports.

It's stdlib HTTP + Server-Sent Events with vanilla JS: no build step and no framework.

## Reskin for a client

Everything brand-specific is in `config.toml` → `[brand]`: name, acronym expansion, assistant name, how it addresses the user, wake words, accent colours and logo text. Swap the `skills/` tree and seed `vault/` with the client's notes, and you have their Jarvis.

## Models

| Role | Default | Config key |
|---|---|---|
| Brain | `claude-fable-5-1` (adaptive thinking, `effort = "medium"`, structured JSON reply) | `brain.model` |
| Router fallback | `claude-haiku-5-5` (`effort = "low"`) | `router.haiku_model` |
| Local router | `qwen2.5:3b` via Ollama | `router.local_model` |

`brain.refusal_fallback = true` enables the API's server-side fallback, so a request the main model declines is retried on a fallback model. Set it to `false` to turn that off.

## Layout

```
jarvis/
  config.toml            ← reskin + models + routes
  CLAUDE.md              ← instructions when Claude Code is the brain
  skills/                ← Brain (canonical tree)      .claude/skills/ ← synced links
  vault/                 ← Memory (Obsidian)
  jarvis/
    router.py brain.py memory.py skills.py metrics.py events.py cli.py
    voice/  stt.py tts.py loop.py
    hud/    server.py static/{index.html,app.js,style.css}
  tests/
```
