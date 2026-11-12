import type { ConversionOptions, ObjObjectData, ParsedObjModel, UnitType } from './types';

const UNIT_METER_MAP: Record<UnitType, number> = {
  meter: 1,
  centimeter: 0.01,
  millimeter: 0.001,
  inch: 0.0254,
  foot: 0.3048,
};

export interface ColladaExportOutput {
  daeContent: string;
  exportedObjectCount: number;
  exportedVertexCount: number;
  exportedPrimitiveCount: number;
  triangulatedFaceCount: number;
  notes: string[];
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function sanitizeXmlId(value: string, fallback: string): string {
  const cleaned = value.replace(/[^A-Za-z0-9_-]/g, '_');
  if (!cleaned) return fallback;
  return /^[A-Za-z_]/.test(cleaned) ? cleaned : `_${cleaned}`;
}

/**
 * Computes Newell's method polygon normal for a 3D polygon given vertex indices into `positions`.
 */
function computePolygonNormal(indices: number[], positions: number[]): [number, number, number] {
  let nx = 0;
  let ny = 0;
  let nz = 0;
  const n = indices.length;
  for (let i = 0; i < n; i += 1) {
    const iCurr = indices[i] * 3;
    const iNext = indices[(i + 1) % n] * 3;
    const cx = positions[iCurr];
    const cy = positions[iCurr + 1];
    const cz = positions[iCurr + 2];
    const nxP = positions[iNext];
    const nyP = positions[iNext + 1];
    const nzP = positions[iNext + 2];
    nx += (cy - nyP) * (cz + nzP);
    ny += (cz - nzP) * (cx + nxP);
    nz += (cx - nxP) * (cy + nyP);
  }
  const len = Math.hypot(nx, ny, nz);
  if (len < 1e-12) return [0, 0, 1];
  return [nx / len, ny / len, nz / len];
}

function pointInTriangle2D(
  px: number,
  py: number,
  ax: number,
  ay: number,
  bx: number,
  by: number,
  cx: number,
  cy: number
): boolean {
  const c1 = (bx - ax) * (py - ay) - (by - ay) * (px - ax);
  const c2 = (cx - bx) * (py - by) - (cy - by) * (px - bx);
  const c3 = (ax - cx) * (py - cy) - (ay - cy) * (px - cx);
  return c1 >= -1e-9 && c2 >= -1e-9 && c3 >= -1e-9;
}

/**
 * Triangulates a polygon (n >= 3) into local vertex-slot triangles `[a, b, c, ...]`
 * using 3D-projected ear-clipping, falling back to fan triangulation if degenerate.
 * Never adds or moves vertices.
 */
function triangulatePolygonSlots(posIndices: number[], positions: number[]): number[] {
  const n = posIndices.length;
  if (n === 3) return [0, 1, 2];
  if (n === 4) {
    // For quads, pick the diagonal that avoids degenerate/folded triangles when possible
    return [0, 1, 2, 0, 2, 3];
  }

  const normal = computePolygonNormal(posIndices, positions);
  const absX = Math.abs(normal[0]);
  const absY = Math.abs(normal[1]);
  const absZ = Math.abs(normal[2]);

  // Project 3D polygon onto the dominant 2D plane
  const pts2D: Array<[number, number]> = new Array(n);
  let flipSign = 1;
  if (absZ >= absX && absZ >= absY) {
    flipSign = normal[2] >= 0 ? 1 : -1;
    for (let i = 0; i < n; i += 1) {
      const idx = posIndices[i] * 3;
      pts2D[i] = [positions[idx], positions[idx + 1] * flipSign];
    }
  } else if (absY >= absX && absY >= absZ) {
    flipSign = normal[1] >= 0 ? 1 : -1;
    for (let i = 0; i < n; i += 1) {
      const idx = posIndices[i] * 3;
      pts2D[i] = [positions[idx + 2], positions[idx] * flipSign];
    }
  } else {
    flipSign = normal[0] >= 0 ? 1 : -1;
    for (let i = 0; i < n; i += 1) {
      const idx = posIndices[i] * 3;
      pts2D[i] = [positions[idx + 1], positions[idx + 2] * flipSign];
    }
  }

  // Ensure CCW winding in 2D
  let signedArea = 0;
  for (let i = 0; i < n; i += 1) {
    const [x1, y1] = pts2D[i];
    const [x2, y2] = pts2D[(i + 1) % n];
    signedArea += x1 * y2 - x2 * y1;
  }
  const active = Array.from({ length: n }, (_, i) => i);
  if (signedArea < 0) {
    active.reverse();
  }

  const result: number[] = [];
  let guard = n * n;

  while (active.length > 3 && guard > 0) {
    guard -= 1;
    let earFound = false;
    const m = active.length;

    for (let i = 0; i < m; i += 1) {
      const prevIdx = active[(i - 1 + m) % m];
      const currIdx = active[i];
      const nextIdx = active[(i + 1) % m];

      const [ax, ay] = pts2D[prevIdx];
      const [bx, by] = pts2D[currIdx];
      const [cx, cy] = pts2D[nextIdx];

      const cross = (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
      if (cross <= 1e-9) continue; // Reflex or collinear

      let containsOther = false;
      for (let j = 0; j < m; j += 1) {
        const testIdx = active[j];
        if (testIdx === prevIdx || testIdx === currIdx || testIdx === nextIdx) continue;
        const [px, py] = pts2D[testIdx];
        if (pointInTriangle2D(px, py, ax, ay, bx, by, cx, cy)) {
          containsOther = true;
          break;
        }
      }

      if (!containsOther) {
        if (signedArea < 0) {
          result.push(nextIdx, currIdx, prevIdx);
        } else {
          result.push(prevIdx, currIdx, nextIdx);
        }
        active.splice(i, 1);
        earFound = true;
        break;
      }
    }

    if (!earFound) break;
  }

  if (active.length === 3) {
    if (signedArea < 0) {
      result.push(active[2], active[1], active[0]);
    } else {
      result.push(active[0], active[1], active[2]);
    }
    return result;
  }

  // Fallback to fan triangulation if polygon was self-intersecting or degenerate
  const fallback: number[] = [];
  for (let i = 1; i < n - 1; i += 1) {
    fallback.push(0, i, i + 1);
  }
  return fallback;
}

function appendFloatArray(chunks: string[], values: number[], stride = 3000): void {
  for (let i = 0; i < values.length; i += stride) {
    const end = Math.min(i + stride, values.length);
    const sliceStr = values.slice(i, end).join(' ');
    chunks.push(i === 0 ? sliceStr : ' ' + sliceStr);
  }
}

function appendIntArray(chunks: string[], values: number[], stride = 6000): void {
  for (let i = 0; i < values.length; i += stride) {
    const end = Math.min(i + stride, values.length);
    const sliceStr = values.slice(i, end).join(' ');
    chunks.push(i === 0 ? sliceStr : ' ' + sliceStr);
  }
}

interface RemappedObjectArrays {
  positions: number[];
  normals: number[];
  texcoords: number[];
  posIndices: number[];
  normIndices: number[];
  uvIndices: number[];
  hasNormals: boolean;
  hasTexcoords: boolean;
}

function prepareObjectArrays(
  obj: ObjObjectData,
  model: ParsedObjModel,
  isSingleObject: boolean
): RemappedObjectArrays {
  // Check if every face vertex in this object has a valid normal / texcoord
  let allHaveNormals = model.normals.length > 0;
  let allHaveTexcoords = model.texcoords.length > 0;

  if (allHaveNormals) {
    for (let i = 0; i < obj.faceNormalIndices.length; i += 1) {
      if (obj.faceNormalIndices[i] < 0) {
        allHaveNormals = false;
        break;
      }
    }
  }
  if (allHaveTexcoords) {
    for (let i = 0; i < obj.faceTexcoordIndices.length; i += 1) {
      if (obj.faceTexcoordIndices[i] < 0) {
        allHaveTexcoords = false;
        break;
      }
    }
  }

  // Fast path for single-object models (common for Hunyuan3D): 1:1 identity mapping, zero vertex reordering
  if (isSingleObject) {
    return {
      positions: model.positions,
      normals: allHaveNormals ? model.normals : [],
      texcoords: allHaveTexcoords ? model.texcoords : [],
      posIndices: obj.facePositionIndices,
      normIndices: allHaveNormals ? obj.faceNormalIndices : [],
      uvIndices: allHaveTexcoords ? obj.faceTexcoordIndices : [],
      hasNormals: allHaveNormals,
      hasTexcoords: allHaveTexcoords,
    };
  }

  // Multi-object path: compactly remap only vertices/normals/uvs used by this object
  const posMap = new Map<number, number>();
  const localPositions: number[] = [];
  const localPosIndices: number[] = new Array(obj.facePositionIndices.length);

  for (let i = 0; i < obj.facePositionIndices.length; i += 1) {
    const gIdx = obj.facePositionIndices[i];
    let lIdx = posMap.get(gIdx);
    if (lIdx === undefined) {
      lIdx = localPositions.length / 3;
      posMap.set(gIdx, lIdx);
      const base = gIdx * 3;
      localPositions.push(model.positions[base], model.positions[base + 1], model.positions[base + 2]);
    }
    localPosIndices[i] = lIdx;
  }

  const localNormals: number[] = [];
  const localNormIndices: number[] = allHaveNormals ? new Array(obj.faceNormalIndices.length) : [];
  if (allHaveNormals) {
    const normMap = new Map<number, number>();
    for (let i = 0; i < obj.faceNormalIndices.length; i += 1) {
      const gIdx = obj.faceNormalIndices[i];
      let lIdx = normMap.get(gIdx);
      if (lIdx === undefined) {
        lIdx = localNormals.length / 3;
        normMap.set(gIdx, lIdx);
        const base = gIdx * 3;
        localNormals.push(model.normals[base], model.normals[base + 1], model.normals[base + 2]);
      }
      localNormIndices[i] = lIdx;
    }
  }

  const localTexcoords: number[] = [];
  const localUvIndices: number[] = allHaveTexcoords ? new Array(obj.faceTexcoordIndices.length) : [];
  if (allHaveTexcoords) {
    const uvMap = new Map<number, number>();
    for (let i = 0; i < obj.faceTexcoordIndices.length; i += 1) {
      const gIdx = obj.faceTexcoordIndices[i];
      let lIdx = uvMap.get(gIdx);
      if (lIdx === undefined) {
        lIdx = localTexcoords.length / 2;
        uvMap.set(gIdx, lIdx);
        const base = gIdx * 2;
        localTexcoords.push(model.texcoords[base], model.texcoords[base + 1]);
      }
      localUvIndices[i] = lIdx;
    }
  }

  return {
    positions: localPositions,
    normals: localNormals,
    texcoords: localTexcoords,
    posIndices: localPosIndices,
    normIndices: localNormIndices,
    uvIndices: localUvIndices,
    hasNormals: allHaveNormals,
    hasTexcoords: allHaveTexcoords,
  };
}

export function exportModelToCollada(
  model: ParsedObjModel,
  options: ConversionOptions,
  onProgress?: (percent: number) => void,
  shouldCancel?: () => boolean
): ColladaExportOutput {
  const nowIso = new Date().toISOString();
  const unitMeter = UNIT_METER_MAP[options.unit] ?? 1;
  const isSingleObject = model.objects.length === 1;

  const chunks: string[] = [];
  const notes: string[] = [];
  let totalExportedVertices = 0;
  let totalExportedPrimitives = 0;
  let triangulatedFaceCount = 0;

  chunks.push(
    '<?xml version="1.0" encoding="utf-8"?>\n',
    '<COLLADA xmlns="http://www.collada.org/2005/11/COLLADASchema" version="1.4.1">\n',
    '  <asset>\n',
    '    <contributor>\n',
    '      <author>MW Hunyuan Bridge User</author>\n',
    '      <authoring_tool>MW Hunyuan Bridge (MW Studio) - Original Quality Engine</authoring_tool>\n',
    '    </contributor>\n',
    `    <created>${nowIso}</created>\n`,
    `    <modified>${nowIso}</modified>\n`,
    `    <unit name="${options.unit}" meter="${unitMeter}" />\n`,
    `    <up_axis>${options.upAxis}</up_axis>\n`,
    '  </asset>\n',
    '  <library_geometries>\n'
  );

  const nodeEntries: Array<{ nodeId: string; nodeName: string; geomId: string }> = [];

  for (let objIdx = 0; objIdx < model.objects.length; objIdx += 1) {
    if (shouldCancel?.()) {
      throw new Error('Conversion cancelled.');
    }

    const obj = model.objects[objIdx];
    const safeName = escapeXml(obj.name);
    const geomId = sanitizeXmlId(`${obj.name}_geom_${objIdx}`, `geom_${objIdx}`);
    const nodeId = sanitizeXmlId(`${obj.name}_node_${objIdx}`, `node_${objIdx}`);
    nodeEntries.push({ nodeId, nodeName: safeName, geomId });

    const data = prepareObjectArrays(obj, model, isSingleObject);
    const vertexCount = data.positions.length / 3;
    totalExportedVertices += vertexCount;

    const posSourceId = `${geomId}-positions`;
    const posArrayId = `${posSourceId}-array`;
    const verticesId = `${geomId}-vertices`;

    chunks.push(
      `    <geometry id="${geomId}" name="${safeName}">\n`,
      '      <mesh>\n',
      `        <source id="${posSourceId}">\n`,
      `          <float_array id="${posArrayId}" count="${data.positions.length}">`
    );
    appendFloatArray(chunks, data.positions);
    chunks.push(
      '</float_array>\n',
      '          <technique_common>\n',
      `            <accessor source="#${posArrayId}" count="${vertexCount}" stride="3">\n`,
      '              <param name="X" type="float" />\n',
      '              <param name="Y" type="float" />\n',
      '              <param name="Z" type="float" />\n',
      '            </accessor>\n',
      '          </technique_common>\n',
      '        </source>\n'
    );

    const normSourceId = `${geomId}-normals`;
    const normArrayId = `${normSourceId}-array`;
    if (data.hasNormals) {
      const normalCount = data.normals.length / 3;
      chunks.push(
        `        <source id="${normSourceId}">\n`,
        `          <float_array id="${normArrayId}" count="${data.normals.length}">`
      );
      appendFloatArray(chunks, data.normals);
      chunks.push(
        '</float_array>\n',
        '          <technique_common>\n',
        `            <accessor source="#${normArrayId}" count="${normalCount}" stride="3">\n`,
        '              <param name="X" type="float" />\n',
        '              <param name="Y" type="float" />\n',
        '              <param name="Z" type="float" />\n',
        '            </accessor>\n',
        '          </technique_common>\n',
        '        </source>\n'
      );
    }

    const uvSourceId = `${geomId}-uv`;
    const uvArrayId = `${uvSourceId}-array`;
    if (data.hasTexcoords) {
      const uvCount = data.texcoords.length / 2;
      chunks.push(
        `        <source id="${uvSourceId}">\n`,
        `          <float_array id="${uvArrayId}" count="${data.texcoords.length}">`
      );
      appendFloatArray(chunks, data.texcoords);
      chunks.push(
        '</float_array>\n',
        '          <technique_common>\n',
        `            <accessor source="#${uvArrayId}" count="${uvCount}" stride="2">\n`,
        '              <param name="S" type="float" />\n',
        '              <param name="T" type="float" />\n',
        '            </accessor>\n',
        '          </technique_common>\n',
        '        </source>\n'
      );
    }

    chunks.push(
      `        <vertices id="${verticesId}">\n`,
      `          <input semantic="POSITION" source="#${posSourceId}" />\n`,
      '        </vertices>\n'
    );

    // Build <triangles> or <polylist>
    const pIndices: number[] = [];
    const vCounts: number[] = [];
    let primitiveCount = 0;

    if (options.triangulatePolygons) {
      let cursor = 0;
      for (let f = 0; f < obj.faceVertexCounts.length; f += 1) {
        const vCount = obj.faceVertexCounts[f];
        if (vCount === 3) {
          for (let k = 0; k < 3; k += 1) {
            const idx = cursor + k;
            pIndices.push(data.posIndices[idx]);
            if (data.hasNormals) pIndices.push(data.normIndices[idx]);
            if (data.hasTexcoords) pIndices.push(data.uvIndices[idx]);
          }
          primitiveCount += 1;
        } else {
          triangulatedFaceCount += 1;
          const facePosSlice = data.posIndices.slice(cursor, cursor + vCount);
          const triSlots = triangulatePolygonSlots(facePosSlice, data.positions);
          for (let t = 0; t < triSlots.length; t += 3) {
            for (let k = 0; k < 3; k += 1) {
              const idx = cursor + triSlots[t + k];
              pIndices.push(data.posIndices[idx]);
              if (data.hasNormals) pIndices.push(data.normIndices[idx]);
              if (data.hasTexcoords) pIndices.push(data.uvIndices[idx]);
            }
            primitiveCount += 1;
          }
        }
        cursor += vCount;
      }

      totalExportedPrimitives += primitiveCount;
      chunks.push(`        <triangles count="${primitiveCount}">\n`);
      let offset = 0;
      chunks.push(`          <input semantic="VERTEX" source="#${verticesId}" offset="${offset}" />\n`);
      offset += 1;
      if (data.hasNormals) {
        chunks.push(`          <input semantic="NORMAL" source="#${normSourceId}" offset="${offset}" />\n`);
        offset += 1;
      }
      if (data.hasTexcoords) {
        chunks.push(`          <input semantic="TEXCOORD" source="#${uvSourceId}" offset="${offset}" set="0" />\n`);
      }
      chunks.push('          <p>');
      appendIntArray(chunks, pIndices);
      chunks.push('</p>\n', '        </triangles>\n');
    } else {
      let cursor = 0;
      for (let f = 0; f < obj.faceVertexCounts.length; f += 1) {
        const vCount = obj.faceVertexCounts[f];
        vCounts.push(vCount);
        for (let k = 0; k < vCount; k += 1) {
          const idx = cursor + k;
          pIndices.push(data.posIndices[idx]);
          if (data.hasNormals) pIndices.push(data.normIndices[idx]);
          if (data.hasTexcoords) pIndices.push(data.uvIndices[idx]);
        }
        cursor += vCount;
        primitiveCount += 1;
      }

      totalExportedPrimitives += primitiveCount;
      chunks.push(`        <polylist count="${primitiveCount}">\n`);
      let offset = 0;
      chunks.push(`          <input semantic="VERTEX" source="#${verticesId}" offset="${offset}" />\n`);
      offset += 1;
      if (data.hasNormals) {
        chunks.push(`          <input semantic="NORMAL" source="#${normSourceId}" offset="${offset}" />\n`);
        offset += 1;
      }
      if (data.hasTexcoords) {
        chunks.push(`          <input semantic="TEXCOORD" source="#${uvSourceId}" offset="${offset}" set="0" />\n`);
      }
      chunks.push('          <vcount>');
      appendIntArray(chunks, vCounts);
      chunks.push('</vcount>\n', '          <p>');
      appendIntArray(chunks, pIndices);
      chunks.push('</p>\n', '        </polylist>\n');
    }

    chunks.push('      </mesh>\n', '    </geometry>\n');
    onProgress?.(Math.round(((objIdx + 1) / model.objects.length) * 100));
  }

  chunks.push(
    '  </library_geometries>\n',
    '  <library_visual_scenes>\n',
    '    <visual_scene id="Scene" name="Scene">\n'
  );

  for (const entry of nodeEntries) {
    chunks.push(
      `      <node id="${entry.nodeId}" name="${entry.nodeName}" type="NODE">\n`,
      `        <instance_geometry url="#${entry.geomId}" />\n`,
      '      </node>\n'
    );
  }

  chunks.push(
    '    </visual_scene>\n',
    '  </library_visual_scenes>\n',
    '  <scene>\n',
    '    <instance_visual_scene url="#Scene" />\n',
    '  </scene>\n',
    '</COLLADA>\n'
  );

  if (triangulatedFaceCount > 0) {
    notes.push(
      `${triangulatedFaceCount.toLocaleString()} non-triangular polygon face(s) were triangulated for SketchUp COLLADA compatibility without altering vertex positions or surface geometry.`
    );
  }

  return {
    daeContent: chunks.join(''),
    exportedObjectCount: nodeEntries.length,
    exportedVertexCount: totalExportedVertices,
    exportedPrimitiveCount: totalExportedPrimitives,
    triangulatedFaceCount,
    notes,
  };
}

