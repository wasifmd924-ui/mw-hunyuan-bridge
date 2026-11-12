import { CheckCircle2, FileCode2, FileText } from 'lucide-react';

export function SupportedFormats() {
  return (
    <div className="mx-auto max-w-5xl space-y-10 px-4 py-12 sm:px-6 sm:py-16">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-[#F5F7FA] sm:text-4xl">
          Supported Formats
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm text-[#929BAA] sm:text-base">
          Built specifically for Hunyuan3D Wavefront OBJ exports and SketchUp COLLADA 1.4.1 imports.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-[#11151D] p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#4285FF]/15 text-[#6B9FFF]">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#F5F7FA]">Input: Wavefront OBJ (.obj)</h2>
              <p className="text-xs text-[#929BAA]">Hunyuan3D &amp; standard 3D mesh exports</p>
            </div>
          </div>

          <ul className="space-y-2.5 text-xs text-[#929BAA] sm:text-sm">
            {[
              'Vertex positions (v x y z)',
              'Vertex normals (vn nx ny nz)',
              'Texture coordinates (vt u v)',
              'Triangles, quads, and arbitrary n-gon faces (f)',
              'All face index forms: v, v/vt, v//vn, v/vt/vn',
              'Negative relative OBJ indices',
              'Object (o) and Group (g) declarations',
              'Graceful handling of mtllib / usemtl references',
            ].map((item, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#4285FF]" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#11151D] p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#20C997]/15 text-[#20C997]">
              <FileCode2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#F5F7FA]">Output: COLLADA 1.4.1 (.dae)</h2>
              <p className="text-xs text-[#929BAA]">SketchUp Desktop compatible XML</p>
            </div>
          </div>

          <ul className="space-y-2.5 text-xs text-[#929BAA] sm:text-sm">
            {[
              'Strict COLLADA 1.4.1 schema & XML validation',
              'Unmodified original vertex coordinates',
              'Preserved normals & UV coordinates when complete',
              'Scene hierarchy (<visual_scene> & <node>)',
              'Configurable unit & up-axis metadata',
              'Automated bounding-box & vertex-count verification',
            ].map((item, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#20C997]" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

