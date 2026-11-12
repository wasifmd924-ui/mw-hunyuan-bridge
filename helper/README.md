# MW Hunyuan Bridge — Windows SketchUp Integration Helper

Because web browsers cannot directly execute local desktop applications or access arbitrary local file paths, **MW Hunyuan Bridge** provides an optional, open-source Python 3 helper for Windows.

## What It Does
1. Detects installed SketchUp versions (`C:\Program Files\SketchUp\SketchUp *\SketchUp.exe`).
2. Registers the `mwhunyuan://` custom URL protocol for your Windows user account (`HKCU\Software\Classes\mwhunyuan`).
3. Strictly validates that any requested file is a local, existing `.dae` file (rejecting remote URLs, UNC paths, and unsafe characters).
4. Launches SketchUp with a temporary Ruby API import script (`-RubyStartup`) to import the `.dae` file directly.
5. Optionally runs a localhost-only status endpoint (`http://127.0.0.1:48921/health`) so the website can verify helper availability.

## Installation (Windows)
1. Ensure **Python 3** is installed.
2. Double-click `install_helper.bat` (or run `powershell -ExecutionPolicy Bypass -File register_protocol.ps1`).
3. (Optional) Start the status server for live browser detection:
   ```bash
   python mwhunyuan_helper.py --serve
   ```

## Security Guarantees
- Never runs shell commands (`shell=False`).
- Never accepts arbitrary command arguments from the browser.
- Rejects `http://`, `https://`, `file://`, and `\\network` paths.
- Only accepts local `.dae` files that exist on disk.

