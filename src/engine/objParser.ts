import type { BoundingBox, ObjObjectData, ParsedObjModel } from './types';

export class ObjParseError extends Error {
  readonly line?: number;
  constructor(message: string, line?: number) {
    super(line !== undefined ? `Line ${line}: ${message}` : message);
    this.name = 'ObjParseError';
    this.line = line;
  }
}

export class ConversionCancelledError extends Error {
  constructor() {
    super('Conversion was cancelled by the user.');
    this.name = 'ConversionCancelledError';
  }
}

interface ParserState {
  positions: number[];
  texcoords: number[];
  normals: number[];
  objects: ObjObjectData[];
  currentObject: ObjObjectData;
  currentGroupIndex: number;
  currentMaterial: string | null;
  materialLibraries: Set<string>;
  allGroups: Set<string>;
  minX: number;
  minY: number;
  minZ: number;
  maxX: number;
  maxY: number;
  maxZ: number;
  faceCount: number;
  triangleCount: number;
  quadCount: number;
  ngonCount: number;
  lineNumber: number;
  pendingLine: string;
}

function createObjectData(name: string): ObjObjectData {
  return {
    name,
    groups: ['default'],
    materials: [],
    faceVertexCounts: [],
    facePositionIndices: [],
    faceTexcoordIndices: [],
    faceNormalIndices: [],
    faceGroupIndices: [],
  };
}

function createInitialState(): ParserState {
  const defaultObj = createObjectData('Hunyuan3D_Model');
  return {
    positions: [],
    texcoords: [],
    normals: [],
    objects: [defaultObj],
    currentObject: defaultObj,
    currentGroupIndex: 0,
    currentMaterial: null,
    materialLibraries: new Set<string>(),
    allGroups: new Set<string>(),
    minX: Infinity,
    minY: Infinity,
    minZ: Infinity,
    maxX: -Infinity,
    maxY: -Infinity,
    maxZ: -Infinity,
    faceCount: 0,
    triangleCount: 0,
    quadCount: 0,
    ngonCount: 0,
    lineNumber: 0,
    pendingLine: '',
  };
}

/**
 * Resolves a 1-based (positive) or relative (negative) OBJ index to a 0-based index.
 */
function resolveObjIndex(rawToken: string, currentCount: number, kind: string, lineNumber: number): number {
  const parsed = Number.parseInt(rawToken, 10);
  if (!Number.isInteger(parsed) || parsed === 0) {
    throw new ObjParseError(`Invalid ${kind} index "${rawToken}" (OBJ indices are 1-based or negative).`, lineNumber);
  }
  const idx = parsed > 0 ? parsed - 1 : currentCount + parsed;
  if (idx < 0 || idx >= currentCount) {
    throw new ObjParseError(
      `${kind} index ${parsed} is out of bounds (available ${kind} count: ${currentCount}).`,
      lineNumber
    );
  }
  return idx;
}

function parseLine(rawLine: string, state: ParserState): void {
  state.lineNumber += 1;
  const line = rawLine.trim();
  if (line.length === 0 || line.charCodeAt(0) === 35 /* '#' */) {
    return;
  }

  // Split on ASCII whitespace without creating excessive empty strings
  const parts = line.split(/\s+/);
  const keyword = parts[0];

  switch (keyword) {
    case 'v': {
      if (parts.length < 4) {
        throw new ObjParseError(`Vertex declaration requires at least 3 coordinates, got ${parts.length - 1}.`, state.lineNumber);
      }
      const x = Number(parts[1]);
      const y = Number(parts[2]);
      const z = Number(parts[3]);
      if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) {
        throw new ObjParseError(`Non-finite vertex coordinate detected ("${parts[1]} ${parts[2]} ${parts[3]}").`, state.lineNumber);
      }
      state.positions.push(x, y, z);
      if (x < state.minX) state.minX = x;
      if (y < state.minY) state.minY = y;
      if (z < state.minZ) state.minZ = z;
      if (x > state.maxX) state.maxX = x;
      if (y > state.maxY) state.maxY = y;
      if (z > state.maxZ) state.maxZ = z;
      break;
    }

    case 'vt': {
      if (parts.length < 2) {
        throw new ObjParseError('Texture coordinate declaration (vt) is missing values.', state.lineNumber);
      }
      const u = Number(parts[1]);
      const v = parts.length >= 3 ? Number(parts[2]) : 0;
      if (!Number.isFinite(u) || !Number.isFinite(v)) {
        throw new ObjParseError(`Non-finite texture coordinate detected.`, state.lineNumber);
      }
      state.texcoords.push(u, v);
      break;
    }

    case 'vn': {
      if (parts.length < 4) {
        throw new ObjParseError(`Vertex normal declaration requires 3 components, got ${parts.length - 1}.`, state.lineNumber);
      }
      const nx = Number(parts[1]);
      const ny = Number(parts[2]);
      const nz = Number(parts[3]);
      if (!Number.isFinite(nx) || !Number.isFinite(ny) || !Number.isFinite(nz)) {
        throw new ObjParseError(`Non-finite vertex normal detected.`, state.lineNumber);
      }
      state.normals.push(nx, ny, nz);
      break;
    }

    case 'f': {
      const vertexCountInFace = parts.length - 1;
      if (vertexCountInFace < 3) {
        throw new ObjParseError(`Face must have at least 3 vertices, found ${vertexCountInFace}.`, state.lineNumber);
      }

      const vCount = state.positions.length / 3;
      const vtCount = state.texcoords.length / 2;
      const vnCount = state.normals.length / 3;
      const obj = state.currentObject;

      for (let i = 1; i < parts.length; i += 1) {
        const token = parts[i];
        const slash1 = token.indexOf('/');
        if (slash1 === -1) {
          // Format: v
          const vIdx = resolveObjIndex(token, vCount, 'vertex', state.lineNumber);
          obj.facePositionIndices.push(vIdx);
          obj.faceTexcoordIndices.push(-1);
          obj.faceNormalIndices.push(-1);
        } else {
          const vStr = token.slice(0, slash1);
          const vIdx = resolveObjIndex(vStr, vCount, 'vertex', state.lineNumber);
          obj.facePositionIndices.push(vIdx);

          const slash2 = token.indexOf('/', slash1 + 1);
          if (slash2 === -1) {
            // Format: v/vt
            const vtStr = token.slice(slash1 + 1);
            const vtIdx = vtStr.length > 0 ? resolveObjIndex(vtStr, vtCount, 'texcoord', state.lineNumber) : -1;
            obj.faceTexcoordIndices.push(vtIdx);
            obj.faceNormalIndices.push(-1);
          } else {
            // Format: v/vt/vn or v//vn
            const vtStr = token.slice(slash1 + 1, slash2);
            const vnStr = token.slice(slash2 + 1);
            const vtIdx = vtStr.length > 0 ? resolveObjIndex(vtStr, vtCount, 'texcoord', state.lineNumber) : -1;
            const vnIdx = vnStr.length > 0 ? resolveObjIndex(vnStr, vnCount, 'normal', state.lineNumber) : -1;
            obj.faceTexcoordIndices.push(vtIdx);
            obj.faceNormalIndices.push(vnIdx);
          }
        }
      }

      obj.faceVertexCounts.push(vertexCountInFace);
      obj.faceGroupIndices.push(state.currentGroupIndex);

      state.faceCount += 1;
      if (vertexCountInFace === 3) {
        state.triangleCount += 1;
      } else if (vertexCountInFace === 4) {
        state.quadCount += 1;
      } else {
        state.ngonCount += 1;
      }
      break;
    }

    case 'o': {
      const name = parts.slice(1).join(' ').trim() || `Object_${state.objects.length + 1}`;
      // If current object is the initial placeholder and has no faces yet, rename it instead of leaving an empty object
      if (state.objects.length === 1 && state.currentObject.faceVertexCounts.length === 0) {
        state.currentObject.name = name;
      } else {
        const nextObj = createObjectData(name);
        state.objects.push(nextObj);
        state.currentObject = nextObj;
        state.currentGroupIndex = 0;
      }
      break;
    }

    case 'g': {
      const groupName = parts.slice(1).join(' ').trim() || 'default';
      state.allGroups.add(groupName);
      let idx = state.currentObject.groups.indexOf(groupName);
      if (idx === -1) {
        idx = state.currentObject.groups.length;
        state.currentObject.groups.push(groupName);
      }
      state.currentGroupIndex = idx;
      break;
    }

    case 'mtllib': {
      const lib = parts.slice(1).join(' ').trim();
      if (lib) {
        state.materialLibraries.add(lib);
      }
      break;
    }

    case 'usemtl': {
      const mat = parts.slice(1).join(' ').trim();
      if (mat) {
        state.currentMaterial = mat;
        if (!state.currentObject.materials.includes(mat)) {
          state.currentObject.materials.push(mat);
        }
      }
      break;
    }

    default:
      // Ignore smoothing groups (s), comments, or unsupported non-geometry directives without failing
      break;
  }
}

function processChunkText(chunk: string, state: ParserState, isFinalChunk: boolean): void {
  const combined = state.pendingLine.length > 0 ? state.pendingLine + chunk : chunk;
  state.pendingLine = '';

  let start = 0;
  const len = combined.length;
  for (let i = 0; i < len; i += 1) {
    if (combined.charCodeAt(i) === 10 /* '\n' */) {
      let line = combined.slice(start, i);
      if (line.endsWith('\r')) {
        line = line.slice(0, -1);
      }
      if (line.endsWith('\\')) {
        state.pendingLine += line.slice(0, -1) + ' ';
      } else {
        parseLine(state.pendingLine + line, state);
        state.pendingLine = '';
      }
      start = i + 1;
    }
  }

  if (start < len) {
    const remainder = combined.slice(start);
    if (isFinalChunk) {
      parseLine(state.pendingLine + remainder, state);
      state.pendingLine = '';
    } else {
      state.pendingLine += remainder;
    }
  } else if (isFinalChunk && state.pendingLine.length > 0) {
    parseLine(state.pendingLine, state);
    state.pendingLine = '';
  }
}

function finalizeState(state: ParserState): ParsedObjModel {
  const vertexCount = state.positions.length / 3;
  const texcoordCount = state.texcoords.length / 2;
  const normalCount = state.normals.length / 3;

  if (vertexCount === 0) {
    throw new ObjParseError('The OBJ file contains no vertex (v) declarations.');
  }
  if (state.faceCount === 0) {
    throw new ObjParseError('The OBJ file contains no face (f) declarations.');
  }

  // Filter out completely empty objects (e.g. trailing 'o' with no faces), keeping at least one if needed
  const nonEmptyObjects = state.objects.filter((obj) => obj.faceVertexCounts.length > 0);
  if (nonEmptyObjects.length === 0) {
    throw new ObjParseError('No valid polygon faces were found in any object.');
  }

  const boundingBox: BoundingBox = {
    min: [state.minX, state.minY, state.minZ],
    max: [state.maxX, state.maxY, state.maxZ],
  };

  const warnings: string[] = [];
  if (state.materialLibraries.size > 0) {
    warnings.push(
      `Referenced external material library (${Array.from(state.materialLibraries).join(', ')}). Geometry is preserved; external .mtl textures are not embedded in geometry-only DAE export.`
    );
  }

  return {
    positions: state.positions,
    texcoords: state.texcoords,
    normals: state.normals,
    objects: nonEmptyObjects,
    materialLibraries: Array.from(state.materialLibraries),
    stats: {
      vertexCount,
      texcoordCount,
      normalCount,
      faceCount: state.faceCount,
      triangleCount: state.triangleCount,
      quadCount: state.quadCount,
      ngonCount: state.ngonCount,
      objectCount: nonEmptyObjects.length,
      groupCount: Math.max(1, state.allGroups.size),
      hasNormals: normalCount > 0,
      hasTexcoords: texcoordCount > 0,
      boundingBox,
    },
    warnings,
  };
}

/**
 * Parses an OBJ string synchronously (ideal for unit tests and small-to-medium files).
 */
export function parseObjString(
  objText: string,
  onProgress?: (percent: number) => void,
  shouldCancel?: () => boolean
): ParsedObjModel {
  if (!objText || objText.trim().length === 0) {
    throw new ObjParseError('The OBJ file is empty.');
  }

  const state = createInitialState();
  const CHUNK_SIZE = 2 * 1024 * 1024; // 2M chars per slice for progress reporting

  if (objText.length <= CHUNK_SIZE) {
    processChunkText(objText, state, true);
    onProgress?.(100);
  } else {
    for (let offset = 0; offset < objText.length; offset += CHUNK_SIZE) {
      if (shouldCancel?.()) {
        throw new ConversionCancelledError();
      }
      const end = Math.min(offset + CHUNK_SIZE, objText.length);
      const isFinal = end === objText.length;
      processChunkText(objText.slice(offset, end), state, isFinal);
      onProgress?.(Math.round((end / objText.length) * 100));
    }
  }

  return finalizeState(state);
}

/**
 * Parses a browser Blob/File in 4MB streaming chunks to avoid duplicating huge strings in memory.
 */
export async function parseObjBlob(
  file: Blob,
  onProgress?: (percent: number) => void,
  shouldCancel?: () => boolean
): Promise<ParsedObjModel> {
  if (file.size === 0) {
    throw new ObjParseError('The selected OBJ file is empty (0 bytes).');
  }

  const state = createInitialState();
  const CHUNK_BYTES = 4 * 1024 * 1024; // 4 MB chunks
  const decoder = new TextDecoder('utf-8');

  for (let offset = 0; offset < file.size; offset += CHUNK_BYTES) {
    if (shouldCancel?.()) {
      throw new ConversionCancelledError();
    }
    const end = Math.min(offset + CHUNK_BYTES, file.size);
    const buffer = await file.slice(offset, end).arrayBuffer();
    const isFinal = end === file.size;
    const text = decoder.decode(buffer, { stream: !isFinal });
    processChunkText(text, state, isFinal);
    onProgress?.(Math.round((end / file.size) * 100));
  }

  return finalizeState(state);
}

