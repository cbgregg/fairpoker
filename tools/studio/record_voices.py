#!/usr/bin/env python3
"""
FairPoker Studio voices
=======================
Records every dealer and player line with Azure AI Speech neural voices (the same
voices Microsoft Edge reads aloud with), with real emotional styles where the voice
supports them: angry, sad, excited, shouting, whispering, cheerful, friendly, unfriendly.

You need:
  * Python 3.8+
  * A free Azure Speech resource (F0 tier: 500,000 characters a month; this uses about 150,000)
  * pip install azure-cognitiveservices-speech

Run (from the folder that holds this script and manifest.json):
  python record_voices.py --key YOUR_SPEECH_KEY --region YOUR_REGION

It writes ./voices/ (index.json plus about 240 small MP3 files, roughly 45 MB in total).
Zip that folder and send it back; it gets published next to the game.

Safe to stop and re-run: finished chunks are skipped.
"""
import argparse, json, os, sys, time, urllib.request
from xml.sax.saxutils import escape

try:
    import azure.cognitiveservices.speech as speechsdk
except ImportError:
    sys.exit("Missing the Azure Speech SDK. Run:  pip install azure-cognitiveservices-speech")

# ---- who sounds like whom (first voice found in your region wins) ---------------------------
VOICES = {
    'D':      (['en-US-GuyNeural'],                              {'pitch': -6, 'rate': -4}),   # the dealer
    'Hank':   (['en-US-ChristopherNeural', 'en-US-DavisNeural'], {'pitch': -4}),
    'Mack':   (['en-US-EricNeural', 'en-US-TonyNeural'],         {}),
    'Rocco':  (['en-US-RogerNeural', 'en-US-JasonNeural'],       {'pitch': -8, 'rate': -5}),
    'Silas':  (['en-US-DavisNeural'],                            {}),
    'Cyrus':  (['en-US-TonyNeural'],                             {}),
    'Wyatt':  (['en-US-JasonNeural'],                            {}),
    'Eli':    (['en-US-AndrewNeural', 'en-US-GuyNeural'],        {'pitch': 6, 'rate': 5}),
    'Jeb':    (['en-US-BrianNeural', 'en-US-DavisNeural'],       {'pitch': -10, 'rate': -7}),
}
# emotion -> (Azure style, style degree, fallback prosody when the voice has no such style)
EMO = {
    'neutral':    (None,          1.0, {}),
    'calm':       (None,          1.0, {'rate': -4}),
    'friendly':   ('friendly',    1.0, {'pitch': 3}),
    'cocky':      ('cheerful',    0.8, {'rate': -6, 'pitch': 4}),
    'excited':    ('excited',     1.3, {'rate': 12, 'pitch': 12}),
    'shout':      ('shouting',    1.2, {'rate': 10, 'pitch': 15, 'volume': 20}),
    'angry':      ('angry',       1.3, {'rate': 8, 'pitch': -8}),
    'sad':        ('sad',         1.3, {'rate': -12, 'pitch': -10}),
    'unfriendly': ('unfriendly',  1.2, {'pitch': -6}),
    'whisper':    ('whispering',  1.0, {'rate': -8, 'volume': -30}),
}
CHUNK = 24           # lines per MP3 file
GAP_MS = 350         # silence between lines inside a file
FORMAT = speechsdk.SpeechSynthesisOutputFormat.Audio16Khz32KBitRateMonoMp3


def voice_list(key, region):
    req = urllib.request.Request(f"https://{region}.tts.speech.microsoft.com/cognitiveservices/voices/list",
                                 headers={'Ocp-Apim-Subscription-Key': key})
    with urllib.request.urlopen(req, timeout=30) as r:
        return {v['ShortName']: set(v.get('StyleList') or []) for v in json.load(r)}


def pct(n):
    return f"{'+' if n >= 0 else ''}{n}%"


def line_ssml(text, emo, styles, base):
    style, degree, fallback = EMO.get(emo, EMO['neutral'])
    pros = dict(base)
    use_style = style if style in styles else None
    if not use_style:
        for k, v in fallback.items():
            pros[k] = pros.get(k, 0) + v
    attrs = ' '.join(f'{k}="{pct(v)}"' for k, v in pros.items() if v)
    inner = f'<prosody {attrs}>{escape(text)}</prosody>' if attrs else escape(text)
    if use_style:
        inner = f'<mstts:express-as style="{use_style}" styledegree="{degree}">{inner}</mstts:express-as>'
    return inner


def synth_chunk(synth, voice, items, styles, base, tries=6):
    body = ''.join(f'<bookmark mark="{i}"/>{line_ssml(t, e, styles, base)}<break time="{GAP_MS}ms"/>'
                   for i, (t, e) in enumerate(items))
    ssml = ('<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" '
            'xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="en-US">'
            f'<voice name="{voice}">{body}</voice></speak>')
    for attempt in range(tries):
        marks = {}
        handler = lambda evt: marks.__setitem__(int(evt.text), evt.audio_offset / 10000.0)
        synth.bookmark_reached.connect(handler)
        res = synth.speak_ssml_async(ssml).get()
        synth.bookmark_reached.disconnect_all()
        if res.reason == speechsdk.ResultReason.SynthesizingAudioCompleted and len(marks) == len(items):
            total = res.audio_duration.total_seconds() * 1000.0
            clips = []
            for i in range(len(items)):
                start = max(0.0, marks[i] - 30)
                end = (marks[i + 1] if i + 1 < len(items) else total) - GAP_MS + 70
                clips.append([round(start), round(max(120, end - start))])
            return res.audio_data, clips
        why = res.cancellation_details.error_details if res.reason == speechsdk.ResultReason.Canceled else 'missing bookmarks'
        wait = 15 * (attempt + 1)
        print(f"   retry {attempt + 1} in {wait}s ({why})")
        time.sleep(wait)
    sys.exit("Azure kept refusing this chunk. Check your key, region and quota, then run again; finished work is kept.")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--key', required=True, help='Azure Speech resource key')
    ap.add_argument('--region', required=True, help='Azure region of that resource, e.g. westus2')
    ap.add_argument('--manifest', default='manifest.json')
    ap.add_argument('--out', default='voices')
    ap.add_argument('--pause', type=float, default=3.2, help='seconds between requests (free tier allows 20 a minute)')
    ap.add_argument('--only', default='', help='comma list of speakers to record, e.g. D,Hattie (for a quick test)')
    a = ap.parse_args()

    man = json.load(open(a.manifest, encoding='utf-8'))
    os.makedirs(a.out, exist_ok=True)
    have = voice_list(a.key, a.region)
    cfg = speechsdk.SpeechConfig(subscription=a.key, region=a.region)
    cfg.set_speech_synthesis_output_format(FORMAT)
    synth = speechsdk.SpeechSynthesizer(speech_config=cfg, audio_config=None)

    prog_path = os.path.join(a.out, 'progress.json')
    prog = json.load(open(prog_path)) if os.path.exists(prog_path) else {}
    only = set(filter(None, a.only.split(',')))
    index = {'version': 1, 'voices': {}, 'casts': man['casts']}
    total_chars = sum(len(t) for w in man['voices'].values() for t in w['clips'])
    print(f"{sum(len(w['clips']) for w in man['voices'].values())} lines, {total_chars:,} characters in all")

    for who, spec in man['voices'].items():
        if only and who not in only:
            continue
        names, base = VOICES[who]
        voice = next((n for n in names if n in have), None)
        if not voice:
            sys.exit(f"None of {names} exist in region {a.region}. Pick another region or edit VOICES.")
        styles = have[voice]
        items = list(spec['clips'].items())
        chunks = [items[i:i + CHUNK] for i in range(0, len(items), CHUNK)]
        print(f"{who}: {voice} ({', '.join(sorted(styles)) or 'no styles'}) - {len(items)} lines in {len(chunks)} files")
        entry = {'chunks': [], 'clips': {}, 'templates': spec['templates']}
        for ci, chunk in enumerate(chunks):
            fname = f"{who}_{ci:03d}.mp3"
            key = f"{who}/{ci}"
            if key in prog and os.path.exists(os.path.join(a.out, fname)):
                clips = prog[key]
            else:
                audio, clips = synth_chunk(synth, voice, chunk, styles, base)
                with open(os.path.join(a.out, fname), 'wb') as f:
                    f.write(audio)
                prog[key] = clips
                json.dump(prog, open(prog_path, 'w'))
                print(f"   {fname}  ({len(audio) // 1024} KB)")
                time.sleep(a.pause)
            entry['chunks'].append(fname)
            for (text, _), (start, dur) in zip(chunk, clips):
                entry['clips'][text] = [ci, start, dur]
        index['voices'][who] = entry

    with open(os.path.join(a.out, 'index.json'), 'w', encoding='utf-8') as f:
        json.dump(index, f, separators=(',', ':'))
    print(f"\nDone. Zip the '{a.out}' folder and send it back.")


if __name__ == '__main__':
    main()
