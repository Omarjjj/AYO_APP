"""
AYO Wake Word Listener
Streams mic audio through Vosk STT, detects "ayo" (with fuzzy matching),
and sends a trigger to the Electron app via WebSocket.

Supports:
  - Listing audio devices (via --list-devices flag)
  - Selecting a specific mic device (via --device <index> or WebSocket command)
  - Mic test mode (via WebSocket "start-mic-test" / "stop-mic-test" commands)
"""

import asyncio
import json
import queue
import sys
import signal
import re
import base64
import socket
import subprocess
import sounddevice as sd
from vosk import Model, KaldiRecognizer
import websockets

SAMPLE_RATE = 16000
BLOCK_SIZE = 4000  # ~250ms chunks
WS_HOST = "127.0.0.1"
WS_PORT = 8765


def free_port(port: int):
    """On Windows, find and kill any process holding this port."""
    if sys.platform != "win32":
        return
    try:
        result = subprocess.run(
            ["netstat", "-ano"],
            capture_output=True, text=True, timeout=5,
        )
        for line in result.stdout.splitlines():
            if f":{port}" in line and "LISTENING" in line:
                parts = line.strip().split()
                pid = parts[-1]
                if pid.isdigit() and int(pid) != 0:
                    print(f"[ayo] Killing old process on port {port} (PID {pid})")
                    subprocess.run(["taskkill", "/F", "/PID", pid],
                                   capture_output=True, timeout=5)
    except Exception as e:
        print(f"[ayo] Warning: could not free port {port}: {e}")

audio_queue: queue.Queue = queue.Queue()
running = True
current_device_index: int | None = None
mic_test_active = False
mic_test_queue: queue.Queue = queue.Queue()

AYO_PATTERNS = [
    r'\bayo\b',
    r'\ba\s*yo\b',
    r'\bhey\s*yo\b',
    r'\bay\s*o\b',
    r'\bayoo+\b',
    r'\biyo\b',
    r'\beyo\b',
]

AYO_REGEX = re.compile('|'.join(AYO_PATTERNS), re.IGNORECASE)

COOLDOWN_SECONDS = 2.0


def get_audio_devices():
    """Return a list of input and output audio devices."""
    devices = sd.query_devices()
    result = {"input": [], "output": []}

    for i, dev in enumerate(devices):
        entry = {
            "index": i,
            "name": dev["name"],
            "sampleRate": dev["default_samplerate"],
        }
        if dev["max_input_channels"] > 0:
            entry["channels"] = dev["max_input_channels"]
            entry["isDefault"] = (i == sd.default.device[0])
            result["input"].append(entry)
        if dev["max_output_channels"] > 0:
            out_entry = {
                "index": i,
                "name": dev["name"],
                "channels": dev["max_output_channels"],
                "sampleRate": dev["default_samplerate"],
                "isDefault": (i == sd.default.device[1]),
            }
            result["output"].append(out_entry)

    return result


def audio_callback(indata, frames, time_info, status):
    """Called by sounddevice for each audio block."""
    if status:
        print(f"[audio] {status}", file=sys.stderr)
    raw = bytes(indata)
    audio_queue.put(raw)
    if mic_test_active:
        mic_test_queue.put(raw)


def check_for_ayo(text: str) -> bool:
    return bool(AYO_REGEX.search(text))


async def listen_and_detect(model_path: str, device_index: int | None = None):
    global running, current_device_index, mic_test_active

    current_device_index = device_index

    print(f"[ayo] Loading Vosk model from: {model_path}")
    model = Model(model_path)
    recognizer = KaldiRecognizer(model, SAMPLE_RATE)
    recognizer.SetWords(True)

    connected_clients: set = set()
    last_trigger_time = 0.0
    stream = None

    def create_stream(dev_idx: int | None = None):
        kwargs = {
            "samplerate": SAMPLE_RATE,
            "blocksize": BLOCK_SIZE,
            "dtype": "int16",
            "channels": 1,
            "callback": audio_callback,
        }
        if dev_idx is not None:
            kwargs["device"] = dev_idx
        return sd.RawInputStream(**kwargs)

    async def broadcast(msg: dict):
        if connected_clients:
            payload = json.dumps(msg)
            await asyncio.gather(
                *[client.send(payload) for client in connected_clients],
                return_exceptions=True,
            )

    async def send_to(websocket, msg: dict):
        try:
            await websocket.send(json.dumps(msg))
        except Exception:
            pass

    async def ws_handler(websocket):
        nonlocal stream
        connected_clients.add(websocket)
        print(f"[ws] Electron connected ({len(connected_clients)} clients)")
        try:
            async for message in websocket:
                data = json.loads(message)
                cmd = data.get("command")

                if cmd == "stop":
                    print("[ayo] Stop command received")
                    stop()

                elif cmd == "ping":
                    await send_to(websocket, {"type": "pong"})

                elif cmd == "list-devices":
                    devices = get_audio_devices()
                    await send_to(websocket, {
                        "type": "audio-devices",
                        "devices": devices,
                        "currentDevice": current_device_index,
                    })

                elif cmd == "set-device":
                    new_idx = data.get("deviceIndex")
                    print(f"[ayo] Switching mic to device index: {new_idx}")
                    current_device_index = new_idx

                    if stream:
                        stream.stop()
                        stream.close()
                    while not audio_queue.empty():
                        audio_queue.get_nowait()
                    recognizer.Reset()

                    stream = create_stream(current_device_index)
                    stream.start()
                    await send_to(websocket, {
                        "type": "device-changed",
                        "deviceIndex": current_device_index,
                        "success": True,
                    })

                elif cmd == "start-mic-test":
                    global mic_test_active
                    mic_test_active = True
                    while not mic_test_queue.empty():
                        mic_test_queue.get_nowait()
                    await send_to(websocket, {"type": "mic-test-started"})

                elif cmd == "stop-mic-test":
                    mic_test_active = False
                    while not mic_test_queue.empty():
                        mic_test_queue.get_nowait()
                    await send_to(websocket, {"type": "mic-test-stopped"})

        except websockets.exceptions.ConnectionClosed:
            pass
        finally:
            connected_clients.discard(websocket)
            print(f"[ws] Client disconnected ({len(connected_clients)} clients)")

    free_port(WS_PORT)
    await asyncio.sleep(0.5)

    server = await websockets.serve(ws_handler, WS_HOST, WS_PORT)
    print(f"[ws] WebSocket server listening on ws://{WS_HOST}:{WS_PORT}")

    stream = create_stream(current_device_index)
    dev_name = "default" if current_device_index is None else f"device {current_device_index}"
    print(f"[ayo] Starting mic capture on {dev_name}... say 'AYO' to trigger!")
    stream.start()

    await broadcast({"type": "status", "status": "listening"})

    try:
        while running:
            # Send mic test audio chunks to connected clients
            if mic_test_active:
                try:
                    while not mic_test_queue.empty():
                        chunk = mic_test_queue.get_nowait()
                        encoded = base64.b64encode(chunk).decode("ascii")
                        await broadcast({
                            "type": "mic-test-audio",
                            "audio": encoded,
                            "sampleRate": SAMPLE_RATE,
                        })
                except queue.Empty:
                    pass

            try:
                data = audio_queue.get(timeout=0.1)
            except queue.Empty:
                await asyncio.sleep(0.05)
                continue

            if recognizer.AcceptWaveform(data):
                result = json.loads(recognizer.Result())
                text = result.get("text", "")
                if text:
                    print(f"[stt] Final: {text}")
                    now = asyncio.get_event_loop().time()
                    if check_for_ayo(text) and (now - last_trigger_time) > COOLDOWN_SECONDS:
                        last_trigger_time = now
                        print("[ayo] >>> AYO DETECTED! <<<")
                        await broadcast({
                            "type": "wake-word-detected",
                            "transcript": text,
                        })
            else:
                partial = json.loads(recognizer.PartialResult())
                partial_text = partial.get("partial", "")
                if partial_text:
                    now = asyncio.get_event_loop().time()
                    if check_for_ayo(partial_text) and (now - last_trigger_time) > COOLDOWN_SECONDS:
                        last_trigger_time = now
                        print(f"[ayo] >>> AYO DETECTED (partial)! <<< '{partial_text}'")
                        await broadcast({
                            "type": "wake-word-detected",
                            "transcript": partial_text,
                        })
                        recognizer.Reset()

            await asyncio.sleep(0)

    except KeyboardInterrupt:
        pass
    finally:
        print("[ayo] Shutting down...")
        mic_test_active = False
        if stream:
            stream.stop()
            stream.close()
        await broadcast({"type": "status", "status": "stopped"})
        server.close()
        await server.wait_closed()


def stop():
    global running
    running = False


def handle_signal(sig, frame):
    stop()


if __name__ == "__main__":
    signal.signal(signal.SIGINT, handle_signal)
    signal.signal(signal.SIGTERM, handle_signal)

    if "--list-devices" in sys.argv:
        devices = get_audio_devices()
        print(json.dumps(devices, indent=2))
        sys.exit(0)

    model_path = "model"
    device_index = None

    args = sys.argv[1:]
    i = 0
    while i < len(args):
        if args[i] == "--device" and i + 1 < len(args):
            device_index = int(args[i + 1])
            i += 2
        elif not args[i].startswith("--"):
            model_path = args[i]
            i += 1
        else:
            i += 1

    print("=" * 50)
    print("  AYO Wake Word Listener")
    print("  Using Vosk STT + WebSocket")
    print(f"  Model: {model_path}")
    print(f"  Device: {'default' if device_index is None else device_index}")
    print(f"  WebSocket: ws://{WS_HOST}:{WS_PORT}")
    print("=" * 50)

    asyncio.run(listen_and_detect(model_path, device_index))
