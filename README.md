# MW HUNYUAN BRIDGE

**From Hunyuan3D to SketchUp. Seamlessly.**  
Developed by **MW Studio**.

MW Hunyuan Bridge is a privacy-first, 100% browser-based Wavefront `.OBJ` to COLLADA 1.4.1 (`.DAE`) converter engineered specifically for Hunyuan3D models and SketchUp Desktop compatibility.

---

## Key Features

- **Original Quality Mode (Enabled by Default)**: Preserves exact vertex positions, polygon faces, normals, and object hierarchy. Never decimates, remeshes, smooths, or simplifies your mesh.
- **100% Local Browser Processing**: All parsing, COLLADA XML generation, and geometry validation run inside a Web Worker in your browser. No files are ever uploaded to a server.
- **COLLADA 1.4.1 Compliance**: Generates validated `.DAE` files with `<asset>` unit/up-axis metadata, `<library_geometries>`, `<library_visual_scenes>`, and `<scene>` instances.
- **Automated Geometry Validation**: Verifies XML well-formedness, vertex counts, bounding boxes, object hierarchy, and face coverage on every conversion.
- **Large File Support**: Streaming 4 MB chunked `Blob` parsing and background Web Worker execution with live progress and cancellation support.
- **Optional Windows SketchUp Helper**: Lightweight Python 3 protocol handler (`mwhunyuan://`) in `helper/` for one-click SketchUp launch, with honest manual import fallback when not installed.

---

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Lucide Icons
- **3D Conversion Engine**: Custom TypeScript OBJ parser, COLLADA 1.4.1 exporter, 3D ear-clipping triangulator, Web Worker
- **Validation & Testing**: Vitest, `fast-xml-parser`
- **Optional Helper**: Python 3 + Windows Registry protocol handler + SketchUp Ruby API

---

## Local Development

```bash
npm install
npm run dev
```

### Run Automated Tests & Typecheck

```bash
npm run typecheck
npm test
npm run build
```

---

## GitHub & Vercel Deployment

1. Push this repository to GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial release of MW Hunyuan Bridge"
   git branch -M main
   git remote add origin https://github.com/<your-org>/mw-hunyuan-bridge.git
   git push -u origin main
   ```
2. Import the repository in [Vercel](https://vercel.com):
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Environment Variables**: None required (zero backend, zero secrets).
3. `vercel.json` is pre-configured for SPA routing.

---

## Known Limitations

1. **`.DAE` vs `.SKP` Export**: Browsers cannot natively write SketchUp's proprietary binary `.skp` format. MW Hunyuan Bridge exports SketchUp-compatible COLLADA `.dae` files, which you import into SketchUp (`File -> Import -> COLLADA (*.dae)`) and save as `.skp`.
2. **External Material/Texture Files (`.mtl` / `.png`)**: Geometry-only conversion preserves `v`, `vt`, `vn`, `f`, `o`, and `g` without corrupting models that reference external `.mtl` files, but external texture images are not embedded into the `.dae` output.
3. **Browser Tab Memory Limits**: Extremely large ASCII OBJ files (hundreds of megabytes) are constrained by the user's browser tab heap limit. Streaming chunked parsing minimizes peak overhead, and warnings are shown when a file approaches tab memory limits.
4. **Desktop SketchUp Launch**: Browsers cannot execute local `.exe` files directly. One-click `OPEN IN SKETCHUP` requires the optional Windows Python 3 helper in `helper/`. Without it, the app downloads the `.dae` and displays manual import steps.

