# ABC Music — src/index.js, src/world.js, web/panels.js

[中文](README_zh.md)

<img src="assets/icon.png" alt="ABC Music" width="128" height="128">

Let Coo compose music with ABC notation.

## Install

For a source checkout, run `npm ci`, then install the directory from Coopanion Settings → Extensions → Install local extension. Restart Coopanion and enable ABC Music. Release packages include the browser bundle.

No SoundFont samples are included. In Instruments, select **Get GeneralUser GS** or import a local SF2 / SF3 file. The download uses a pinned upstream version, verifies its size and SHA-256, and saves its original license. It runs only when requested and can be retried after failure. Once installed, rendering works offline.

## Panels and storage

- **Scores:** edit the always-open ABC score above the sheet music. Score selection, title, instrument, new, save, validate, listen and render controls are in the editor. Title edits synchronize with the first `T:` header. Sheet music updates after 500 ms without input. Unsaved drafts are retained in the current browser. With no saved scores or draft, the editor starts with rests. Validation and saving work without a SoundFont.
- **Works:** play recordings, download WAV / MIDI / ABC, copy the audio path, or open the output folder. Expand a work to view its original ABC snapshot. Editing or deleting the source score does not change the snapshot or recording. Yellow highlighting follows playback, seeks and pauses in both score views.
- **Instruments:** one collapsible group per SoundFont file, initially closed. Select the file heading to expand or collapse it; the current browser remembers expanded groups. Expanded groups show all their presets, bank variants and drum kits. Search opens matching groups; clearing it restores the previous state. Audition a single C note and set the default instrument. Import copies a file into the data directory and preserves the original. Files with different contents and the same filename must be renamed before import. Alternatively, place files in the directory and select Refresh.

SoundFonts live directly in `<World dataDir>/music-abc/`, corresponding to `Coopanion/data/home/companion/data/music-abc/`. Scores are indexed in `index.json`; recordings and their MIDI / ABC files live in `works/`. Preset IDs include the filename and MIDI patch; renaming a SoundFont requires selecting the preset again. Removing a SoundFont does not prevent playback of existing WAV recordings.

Legacy custom `soundfont` paths are copied into this directory at startup. The original eight instrument IDs resolve to the corresponding GM preset in that custom file or GeneralUser-GS.sf2. Users of the previously bundled GeneralUser GS must obtain it once in Instruments. Existing scores, revisions and works remain intact. This World is independent of `cortico-world-music`; old scores from that World are not imported.

## Tools and configuration

| Tool | Operations |
|---|---|
| `abc_music_score` | `check`, `save`, `get`, `list` |
| `abc_music_play` | Render a saved `score` ID or complete `abc`; retain WAV, MIDI and an ABC snapshot |
| `abc_music_control` | `status`; `instruments` lists installed files and presets; `set` changes `instrument`, `delivery`, `eventDelivery` |

Before editing a saved score, read it with `get` and pass its `revision` as `expectedRevision` when saving. Conflicting updates fail. Direct ABC passed to the play tool is saved after rendering succeeds. Panel previews do not save works or emit events; panel rendering saves the current score and creates a work.

Use an instrument ID returned by `instruments` to select its SoundFont, bank MSB/LSB, program and drum flag. Explicit ABC `%%MIDI program` directives select zero-based GM programs for individual voices within the selected file. Each work uses one SoundFont.

Enable `worlds.music-abc.enabled`. `instrument` defaults to an empty string, which selects the first available preset; choose a default in Instruments. `delivery=return` attaches WAV to the tool receipt; `delivery=event` emits `music-abc.played`. `eventDelivery=archive` archives the event; `model` delivers it to the conversation. Configuration changes apply immediately. Audio playback or sending uses other tools. Event failure retains the work and reports its file path.

Each score must contain X/M/L/K headers; T/Q are recommended. Use `V:` for independent voices and `[CEG]` for chords. Rests, ties, slurs, dotted rhythms, tuplets, repeats and dynamics are supported. Quoted chord names are labels and do not generate accompaniment. Guitar-specific slides, hammer-ons, pull-offs and strumming models are not implemented. Scores are edited as ABC; MIDI / MusicXML import and graphical note editing are not provided.

Limits: one tune per score, 48000 characters, 12000 expanded notes, six minutes. abcjs parse warnings require correction; this does not provide a full music-theory or bar-duration validator. One audio job runs at a time with a 120-second timeout. Storage limits are 100 scores and 200 works. WAV is 44.1 kHz, 16-bit stereo with a three-second release tail; fixed gain preserves dynamics and is reduced to prevent clipping.

## Development

Run `npm ci`, `npm run selfcheck`, and `npm run preview`. The preview at `http://127.0.0.1:18796` uses the real World and renderer with isolated `.preview-data/`; its shell simulates the panel host. Set `CORTICO_SOURCE_ROOT` to Cortico's `src` directory and run `npm run drymount` for extension-contract validation. `npm run build` regenerates the self-description and browser bundle from `src/` and `web/`.

## Licenses

The extension code is MIT. Dependencies and optional SoundFonts retain their own licenses; see [THIRD_PARTY.md](THIRD_PARTY.md). GeneralUser GS 2.0.3 is by S. Christian Collins. Its license permits private and commercial music creation and use in software projects. Its author cannot fully establish every sample's original provenance. This extension preserves that qualification and has not independently verified every sample's ownership and authorization. The download entry displays this disclosure. The complete original license is retained in [assets/GeneralUser-GS-LICENSE.txt](assets/GeneralUser-GS-LICENSE.txt). User-imported SoundFonts remain subject to their own licenses.
