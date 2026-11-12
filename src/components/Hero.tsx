import { ArrowRight, Box, Cpu, FileCode2, Lock } from 'lucide-react';

interface HeroProps {
  onStartConverting: () => void;
  onHowItWorks: () => void;
}

export function Hero({ onStartConverting, onHowItWorks }: HeroProps) {
  return (
    <section className="hero-glow relative overflow-hidden border-b border-white/8 py-16 sm:py-24">
      <div className="mx-auto max-w-5xl px-4 text-center sm:px-6">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#4285FF]/30 bg-[#4285FF]/10 px-4 py-1.5 text-xs font-semibold tracking-wide text-[#6B9FFF]">
          <span>From Hunyuan3D to SketchUp. Seamlessly.</span>
        </div>

        <h1 className="mx-auto max-w-3xl text-3xl font-bold tracking-tight text-[#F5F7FA] sm:text-5xl sm:leading-[1.12]">
          Turn Hunyuan3D Models Into SketchUp-Ready Files.
        </h1>

        <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-[#929BAA] sm:text-lg">
          Convert your Hunyuan3D OBJ models into SketchUp-compatible COLLADA files while
          preserving original geometry.
        </p>

        <div className="mt-9 flex flex-col items-center justify-center gap-3.5 sm:flex-row">
          <button
            type="button"
            onClick={onStartConverting}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#4285FF] px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#4285FF]/25 transition-all hover:bg-[#5391FF] active:scale-[0.99] sm:w-auto"
          >
            <span>Start Converting</span>
            <ArrowRight className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={onHowItWorks}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/12 bg-[#171D28] px-7 py-3.5 text-sm font-semibold text-[#F5F7FA] transition-colors hover:border-[#6B9FFF]/40 hover:bg-[#1D2432] sm:w-auto"
          >
            <span>How It Works</span>
          </button>
        </div>

        {/* Simple Conversion Pipeline Illustration (No 3D preview) */}
        <div className="glass-panel mx-auto mt-14 max-w-3xl rounded-2xl p-6 sm:p-8">
          <p className="mb-5 text-xs font-semibold tracking-widest text-[#929BAA] uppercase">
            Lossless Geometry Conversion Pipeline
          </p>
          <div className="grid grid-cols-1 items-center gap-4 sm:grid-cols-[1fr_auto_1fr_auto_1fr]">
            <div className="rounded-xl border border-white/8 bg-[#11151D] p-4">
              <div className="mx-auto mb-2.5 flex h-10 w-10 items-center justify-center rounded-lg bg-[#4285FF]/15 text-[#6B9FFF]">
                <Box className="h-5 w-5" />
              </div>
              <div className="font-mono text-xs font-semibold text-[#F5F7FA]">HUNYUAN3D OBJ</div>
              <div className="mt-1 text-xs text-[#929BAA]">Original vertices &amp; faces</div>
            </div>

            <div className="flex justify-center text-[#4285FF]">
              <ArrowRight className="h-5 w-5 rotate-90 sm:rotate-0" />
            </div>

            <div className="rounded-xl border border-[#4285FF]/35 bg-[#4285FF]/10 p-4">
              <div className="mx-auto mb-2.5 flex h-10 w-10 items-center justify-center rounded-lg bg-[#4285FF] text-white">
                <Cpu className="h-5 w-5" />
              </div>
              <div className="font-mono text-xs font-semibold text-[#F5F7FA]">MW HUNYUAN BRIDGE</div>
              <div className="mt-1 text-xs text-[#6B9FFF]">Original Quality Engine</div>
            </div>

            <div className="flex justify-center text-[#4285FF]">
              <ArrowRight className="h-5 w-5 rotate-90 sm:rotate-0" />
            </div>

            <div className="rounded-xl border border-[#20C997]/30 bg-[#11151D] p-4">
              <div className="mx-auto mb-2.5 flex h-10 w-10 items-center justify-center rounded-lg bg-[#20C997]/15 text-[#20C997]">
                <FileCode2 className="h-5 w-5" />
              </div>
              <div className="font-mono text-xs font-semibold text-[#F5F7FA]">SKETCHUP DAE</div>
              <div className="mt-1 text-xs text-[#929BAA]">COLLADA 1.4.1 Ready</div>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-center gap-2 border-t border-white/8 pt-4 text-xs text-[#929BAA]">
            <Lock className="h-3.5 w-3.5 text-[#20C997]" />
            <span>
              Your 3D files are processed locally in your browser. MW Hunyuan Bridge does not
              upload your model to a conversion server.
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

