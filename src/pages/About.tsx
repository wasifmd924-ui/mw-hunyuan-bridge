import { Lock, ShieldCheck, Sparkles } from 'lucide-react';

export function About() {
  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-12 sm:px-6 sm:py-16">
      <div className="text-center">
        <p className="text-xs font-semibold tracking-widest text-[#6B9FFF] uppercase">MW Studio</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#F5F7FA] sm:text-4xl">
          About MW Hunyuan Bridge
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm text-[#929BAA] sm:text-base">
          From Hunyuan3D to SketchUp. Seamlessly.
        </p>
      </div>

      <div className="glass-panel space-y-6 rounded-2xl p-6 sm:p-8">
        <div className="flex items-start gap-3.5">
          <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-[#4285FF]" />
          <div>
            <h2 className="text-base font-bold text-[#F5F7FA]">Why We Built It</h2>
            <p className="mt-1.5 text-xs leading-relaxed text-[#929BAA] sm:text-sm">
              Hunyuan3D generates detailed 3D meshes in Wavefront <code className="text-[#F5F7FA]">.obj</code>{' '}
              format, which SketchUp does not import natively without plugins. MW Hunyuan Bridge
              provides a dedicated, geometry-preserving converter that produces clean COLLADA 1.4.1{' '}
              <code className="text-[#F5F7FA]">.dae</code> files ready for SketchUp.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3.5 border-t border-white/8 pt-6">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#20C997]" />
          <div>
            <h2 className="text-base font-bold text-[#F5F7FA]">Original Quality Guarantee</h2>
            <p className="mt-1.5 text-xs leading-relaxed text-[#929BAA] sm:text-sm">
              We never decimate, remesh, smooth, or alter your vertex coordinates. Every conversion
              runs an automated geometry validation pass comparing vertex counts, bounding boxes,
              object hierarchy, and face coverage against your original OBJ.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3.5 border-t border-white/8 pt-6">
          <Lock className="mt-0.5 h-5 w-5 shrink-0 text-[#6B9FFF]" />
          <div>
            <h2 className="text-base font-bold text-[#F5F7FA]">Zero-Upload Privacy Architecture</h2>
            <p className="mt-1.5 text-xs leading-relaxed text-[#929BAA] sm:text-sm">
              There is no backend server, no database, no user account, and no model telemetry.
              All parsing, COLLADA generation, and validation execute inside a local Web Worker in
              your browser.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

