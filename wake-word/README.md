# AYO Wake Word Setup

## Prerequisites

- **Python 3.10+** installed and on your PATH
- **A microphone** connected to your PC

## Step 1: Download the Vosk Model

1. Go to: https://alphacephei.com/vosk/models
2. Download **`vosk-model-small-en-us-0.15`** (~40 MB, fast, good for keywords)
   - Direct link: https://alphacephei.com/vosk/models/vosk-model-small-en-us-0.15.zip
3. Extract the zip
4. Rename the extracted folder to just **`model`**
5. Place it inside this `wake-word/` directory

Your folder should look like:

```
wake-word/
├── ayo_listener.py
├── requirements.txt
├── README.md
└── model/
    ├── am/
    ├── conf/
    ├── graph/
    ├── ivector/
    └── ... (other model files)
```

## Step 2: Install Python Dependencies

Open a terminal in this `wake-word/` folder and run:

```bash
pip install -r requirements.txt
```

## Step 3: Test it standalone (optional)

You can test the wake word listener on its own before running it with Electron:

```bash
python ayo_listener.py model
```

- It will start listening on your mic.
- Say "AYO" and you should see `>>> AYO DETECTED! <<<` in the terminal.
- It also starts a WebSocket server on `ws://127.0.0.1:8765` that the Electron app connects to.
- Press Ctrl+C to stop.

## Step 4: Run with Electron

When you run the Electron app (`npm run electron:dev`), it automatically:

1. Spawns `python ayo_listener.py model` as a child process
2. Connects to it via WebSocket on port 8765
3. Shows "AYO detected!" in the UI when you say "AYO"

Make sure the Vosk model folder (`wake-word/model/`) exists before starting the app.

## Troubleshooting

**"No module named vosk"**
→ Run `pip install -r requirements.txt` again.

**"Model not found" or similar**
→ Make sure the `model/` folder is directly inside `wake-word/` and contains the Vosk files (am/, conf/, graph/, etc.).

**"No default input device"**
→ Make sure a microphone is connected and set as the default recording device in Windows Sound Settings.

**Wake word not detecting "AYO"**
→ Speak clearly and a bit louder than normal.
→ The script uses fuzzy matching: "ayo", "a yo", "hey yo", "ay o" etc. all work.
→ Check the terminal output for `[stt] Final: ...` to see what Vosk is hearing.
