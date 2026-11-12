import { XMLValidator } from 'fast-xml-parser';
import type { ColladaExportOutput } from './colladaExporter';
import type { GeometryValidationReport, ParsedObjModel } from './types';

const FLOAT_TOLERANCE = 1e-6;

export function validateColladaExport(
  model: ParsedObjModel,
  exported: ColladaExportOutput
): GeometryValidationReport {
  const errors: string[] = [];
  const notes: string[] = [...exported.notes];

  const dae = exported.daeContent;

  // 1. XML well-formedness check
  const xmlCheck = XMLValidator.validate(dae);
  const xmlWellFormed = xmlCheck === true;
  if (!xmlWellFormed) {
    errors.push(
      `XML validation failed: ${typeof xmlCheck === 'object' && xmlCheck.err ? xmlCheck.err.msg : 'Malformed XML'}`
    );
  }

  // 2. COLLADA 1.4.1 required structure checks
  const hasColladaRoot =
    dae.includes('xmlns="http://www.collada.org/2005/11/COLLADASchema"') &&
    dae.includes('version="1.4.1"');
  const hasRequiredSections =
    dae.includes('<asset>') &&
    dae.includes('<library_geometries>') &&
    dae.includes('<library_visual_scenes>') &&
    dae.includes('<scene>') &&
    dae.includes('<instance_visual_scene');

  const colladaVersionValid = hasColladaRoot && hasRequiredSections;
  if (!colladaVersionValid) {
    errors.push('Exported DAE is missing required COLLADA 1.4.1 schema or scene elements.');
  }

  // 3. Verify exported geometry arrays and bounding box against original OBJ
  let parsedVertexCount = 0;
  let minX = Infinity;
  let minY = Infinity;
  let minZ = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let maxZ = -Infinity;

  const posArrayRegex = /<float_array id="[^"]*-positions-array" count="(\d+)">([^<]*)<\/float_array>/g;
  let match: RegExpExecArray | null;
  while ((match = posArrayRegex.exec(dae)) !== null) {
    const declaredCount = Number.parseInt(match[1], 10);
    const rawNumbers = match[2].trim();
    if (!rawNumbers) {
      errors.push('Found empty positions float_array in exported DAE.');
      continue;
    }
    const tokens = rawNumbers.split(/\s+/);
    if (tokens.length !== declaredCount) {
      errors.push(
        `Position float_array count mismatch: declared ${declaredCount}, actual ${tokens.length}.`
      );
    }
    parsedVertexCount += tokens.length / 3;

    for (let i = 0; i < tokens.length; i += 3) {
      const x = Number(tokens[i]);
      const y = Number(tokens[i + 1]);
      const z = Number(tokens[i + 2]);
      if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) {
        errors.push('Non-finite coordinate detected in exported COLLADA float_array.');
        break;
      }
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (z < minZ) minZ = z;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
      if (z > maxZ) maxZ = z;
    }
  }

  // Note: If multiple objects in OBJ shared vertices, COLLADA duplicates those vertices per <geometry>
  const vertexCountMatch =
    model.objects.length === 1
      ? parsedVertexCount === model.stats.vertexCount
      : parsedVertexCount >= model.stats.vertexCount && parsedVertexCount === exported.exportedVertexCount;

  if (!vertexCountMatch) {
    errors.push(
      `Vertex count mismatch: original OBJ has ${model.stats.vertexCount}, exported DAE has ${parsedVertexCount}.`
    );
  } else if (model.objects.length > 1 && parsedVertexCount > model.stats.vertexCount) {
    notes.push(
      `Multi-object OBJ shared ${parsedVertexCount - model.stats.vertexCount} vertex reference(s) across objects; each COLLADA <geometry> stores its own self-contained vertex array.`
    );
  }

  const origBB = model.stats.boundingBox;
  const deltas = [
    Math.abs(minX - origBB.min[0]),
    Math.abs(minY - origBB.min[1]),
    Math.abs(minZ - origBB.min[2]),
    Math.abs(maxX - origBB.max[0]),
    Math.abs(maxY - origBB.max[1]),
    Math.abs(maxZ - origBB.max[2]),
  ];
  const maxCoordinateDelta = Math.max(...deltas);
  const boundingBoxMatch = Number.isFinite(maxCoordinateDelta) && maxCoordinateDelta <= FLOAT_TOLERANCE;

  if (!boundingBoxMatch) {
    errors.push(
      `Bounding box mismatch (max delta: ${maxCoordinateDelta}). Exported geometry does not match original bounds.`
    );
  }

  // 4. Object count & scene instance references
  const geomCount = (dae.match(/<geometry id="/g) || []).length;
  const instanceGeomCount = (dae.match(/<instance_geometry url="#/g) || []).length;
  const objectCountMatch =
    geomCount === model.stats.objectCount && instanceGeomCount === model.stats.objectCount;

  if (!objectCountMatch) {
    errors.push(
      `Object hierarchy mismatch: OBJ has ${model.stats.objectCount} object(s), DAE has ${geomCount} geometry(ies) and ${instanceGeomCount} scene instance(s).`
    );
  }

  // 5. Face coverage check
  const faceCoverageMatch = exported.exportedPrimitiveCount >= model.stats.faceCount;
  if (!faceCoverageMatch) {
    errors.push(
      `Face coverage mismatch: original OBJ has ${model.stats.faceCount} face(s), exported DAE has ${exported.exportedPrimitiveCount} primitive(s).`
    );
  }

  const status =
    errors.length > 0 ? 'FAILED' : notes.length > 0 || model.warnings.length > 0 ? 'PASSED_WITH_NOTES' : 'PASSED';

  return {
    status,
    xmlWellFormed,
    colladaVersionValid,
    vertexCountMatch,
    boundingBoxMatch,
    objectCountMatch,
    faceCoverageMatch,
    originalVertexCount: model.stats.vertexCount,
    exportedVertexCount: parsedVertexCount,
    originalFaceCount: model.stats.faceCount,
    exportedPolygonOrTriangleCount: exported.exportedPrimitiveCount,
    triangulatedFaceCount: exported.triangulatedFaceCount,
    originalObjectCount: model.stats.objectCount,
    exportedObjectCount: geomCount,
    maxCoordinateDelta: Number.isFinite(maxCoordinateDelta) ? maxCoordinateDelta : Infinity,
    notes,
    errors,
  };
}

