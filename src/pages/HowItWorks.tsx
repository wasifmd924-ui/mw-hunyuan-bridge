import { CheckCircle2, Info, Layers, Terminal } from 'lucide-react';

const STEPS = [
  {
    step: '01',
    title: 'Generate your model in Hunyuan3D',
    desc: 'Create your 3D asset in Hunyuan3D as usual.',
  },
  {
    step: '02',
    title: 'Export the model as OBJ',
    desc: 'Download or export the Wavefront .obj mesh from Hunyuan3D.',
  },
  {
    step: '03',
    title: 'Upload OBJ to MW Hunyuan Bridge',
    desc: 'Drag and drop the .obj file into the converter workspace. It stays in browser memory.',
  },
  {
    step: '04',
    title: 'Enable Original Quality Mode',
    desc: 'Enabled by default to guarantee zero decimation, zero remeshing, and exact vertex coordinates.',
  },
  {
    step: '05',
    title: 'Convert OBJ into DAE',
    desc: 'Our Web Worker parses the OBJ and generates a validated COLLADA 1.4.1 (.dae) file.',
  },
  {
    step: '06',
    title: 'Download the DAE file',
    desc: 'Save the converted .dae file directly to your computer.',
  },
  {
    step: '07',
    title: 'Open it in SketchUp',
    desc: 'Use Open in SketchUp (with our optional Windows helper) or File → Import… → COLLADA (*.dae).',
  },
  {
    step: '08',
    title: 'Save it as a native SKP project',
    desc: 'Once imported into SketchUp, use File → Save As to save your model as a native .skp file.',
  },
];

const COMPATIBILITY_CHECKLIST = [
  'COLLADA 1.4.1 XML Schema compliance (http://www.collada.org/2005/11/COLLADASchema)',
  'Explicit <unit> metadata (meter, centimeter, millimeter, inch, foot)',
  'Explicit <up_axis> metadata (Y_UP default for Hunyuan3D OBJ without mutating coordinates)',
  'Self-contained <geometry> sources with validated <float_array> and <accessor> strides',
  '3D ear-clipping triangulation of quads and n-gons when enabled for SketchUp reliability',
  'Preserved object hierarchy via <library_visual_scenes> and <instance_geometry> nodes',
];

export function HowItWorks() {
  return (
    <div className="mx-auto max-w-5xl space-y-12 px-4 py-12 sm:px-6 sm:py-16">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-[#F5F7FA] sm:text-4xl">
          How It Works
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm text-[#929BAA] sm:text-base">
          A transparent, serverless workflow from Hunyuan3D OBJ to native SketchUp SKP projects.
        </p>
      </div>

      {/* DAE vs SKP Distinction */}
      <div className="rounded-2xl border border-[#4285FF]/35 bg-[#4285FF]/8 p-6">
        <div className="flex items-start gap-3.5">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-[#6B9FFF]" />
          <div>
            <h2 className="text-sm font-bold tracking-wide text-[#F5F7FA] uppercase">
              Important Distinction: COLLADA (.DAE) vs. SketchUp (.SKP)
            </h2>
            <p className="mt-1.5 text-xs leading-relaxed text-[#929BAA] sm:text-sm">
              MW Hunyuan Bridge exports <strong className="text-[#F5F7FA]">COLLADA (.DAE)</strong>,
              the open 3D interchange format officially supported by SketchUp&apos;s built-in
              importer. It does <em>not</em> write proprietary binary <code className="text-[#F5F7FA]">.skp</code>{' '}
              files directly in the browser. After importing the <code className="text-[#F5F7FA]">.dae</code>{' '}
              file into SketchUp, save it as a native <code className="text-[#F5F7FA]">.skp</code>{' '}
              project.
            </p>
          </div>
        </div>
      </div>

      {/* 8-Step Workflow */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((item) => (
          <div
            key={item.step}
            className="rounded-2xl border border-white/8 bg-[#11151D] p-5 transition-colors hover:border-[#4285FF]/35"
          >
            <span className="font-mono text-xs font-bold text-[#4285FF]">STEP {item.step}</span>
            <h3 className="mt-2 text-sm font-semibold text-[#F5F7FA]">{item.title}</h3>
            <p className="mt-1.5 text-xs leading-relaxed text-[#929BAA]">{item.desc}</p>
          </div>
        ))}
      </div>

      {/* SketchUp Compatibility Checklist */}
      <div className="glass-panel rounded-2xl p-6 sm:p-8">
        <div className="mb-4 flex items-center gap-2.5">
          <Layers className="h-5 w-5 text-[#20C997]" />
          <h2 className="text-lg font-bold text-[#F5F7FA]">SketchUp Compatibility Checklist</h2>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {COMPATIBILITY_CHECKLIST.map((item, idx) => (
            <div key={idx} className="flex items-start gap-2.5 text-xs text-[#929BAA] sm:text-sm">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#20C997]" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Windows Helper Info */}
      <div className="rounded-2xl border border-white/10 bg-[#11151D] p-6 sm:p-8">
        <div className="mb-3 flex items-center gap-2.5">
          <Terminal className="h-5 w-5 text-[#6B9FFF]" />
          <h2 className="text-lg font-bold text-[#F5F7FA]">
            Optional Windows SketchUp Helper
          </h2>
        </div>
        <p className="text-xs leading-relaxed text-[#929BAA] sm:text-sm">
          Normal browsers cannot launch desktop applications directly. If you want one-click{' '}
          <strong className="text-[#F5F7FA]">OPEN IN SKETCHUP</strong> support on Windows, install
          the lightweight Python 3 helper included in the repository&apos;s{' '}
          <code className="font-mono text-[#6B9FFF]">helper/</code> folder. It registers the{' '}
          <code className="font-mono text-[#6B9FFF]">mwhunyuan://</code> protocol, validates local{' '}
          <code className="font-mono text-[#F5F7FA]">.dae</code> paths, and opens SketchUp via its
          Ruby API.
        </p>
      </div>
    </div>
  );
}

