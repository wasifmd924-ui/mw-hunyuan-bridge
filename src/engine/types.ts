export type UnitType = 'meter' | 'centimeter' | 'millimeter' | 'inch' | 'foot';

export type UpAxisType = 'Y_UP' | 'Z_UP';

export interface ConversionOptions {
  /**
   * Original Quality Mode (default: true).
   * Preserves exact vertex positions, topology, normals, and object hierarchy.
   * Never decimates, remeshes, smooths, or simplifies.
   */
  originalQualityMode: boolean;
  /** COLLADA unit metadata (default: 'meter') */
  unit: UnitType;
  /** COLLADA up_axis metadata (default: 'Y_UP' to preserve Hunyuan3D OBJ coordinates without mutation) */
  upAxis: UpAxisType;
  /**
   * Triangulate polygons with >3 vertices for maximum SketchUp compatibility.
   * Preserves exact surface and vertex positions without adding or moving vertices.
   */
  triangulatePolygons: boolean;
}

export const DEFAULT_CONVERSION_OPTIONS: ConversionOptions = {
  originalQualityMode: true,
  unit: 'meter',
  upAxis: 'Y_UP',
  triangulatePolygons: true,
};

export interface BoundingBox {
  min: [number, number, number];
  max: [number, number, number];
}

export interface ObjObjectData {
  name: string;
  groups: string[];
  materials: string[];
  /** Number of vertices in each face, in order */
  faceVertexCounts: number[];
  /** Flat 0-based vertex position indices (length = sum(faceVertexCounts)) */
  facePositionIndices: number[];
  /** Flat 0-based texcoord indices (-1 if absent) */
  faceTexcoordIndices: number[];
  /** Flat 0-based normal indices (-1 if absent) */
  faceNormalIndices: number[];
  /** Group index per face */
  faceGroupIndices: number[];
}

export interface ParsedObjModel {
  /** Flat [x, y, z, ...] array of original vertex positions */
  positions: number[];
  /** Flat [u, v, ...] array of texture coordinates */
  texcoords: number[];
  /** Flat [nx, ny, nz, ...] array of vertex normals */
  normals: number[];
  /** Objects in declaration order */
  objects: ObjObjectData[];
  /** External .mtl libraries referenced via mtllib */
  materialLibraries: string[];
  /** Summary statistics */
  stats: {
    vertexCount: number;
    texcoordCount: number;
    normalCount: number;
    faceCount: number;
    triangleCount: number;
    quadCount: number;
    ngonCount: number;
    objectCount: number;
    groupCount: number;
    hasNormals: boolean;
    hasTexcoords: boolean;
    boundingBox: BoundingBox;
  };
  /** Non-fatal parser notes (e.g. external .mtl references) */
  warnings: string[];
}

export type ValidationStatus = 'PASSED' | 'PASSED_WITH_NOTES' | 'FAILED';

export interface GeometryValidationReport {
  status: ValidationStatus;
  xmlWellFormed: boolean;
  colladaVersionValid: boolean;
  vertexCountMatch: boolean;
  boundingBoxMatch: boolean;
  objectCountMatch: boolean;
  faceCoverageMatch: boolean;
  originalVertexCount: number;
  exportedVertexCount: number;
  originalFaceCount: number;
  exportedPolygonOrTriangleCount: number;
  triangulatedFaceCount: number;
  originalObjectCount: number;
  exportedObjectCount: number;
  maxCoordinateDelta: number;
  notes: string[];
  errors: string[];
}

export interface ConversionResult {
  daeContent: string;
  originalFilename: string;
  originalFileSize: number;
  convertedFilename: string;
  convertedFileSize: number;
  vertexCount: number;
  faceCount: number;
  exportedTriangleCount: number;
  objectCount: number;
  durationMs: number;
  validation: GeometryValidationReport;
  warnings: string[];
}

export type ConversionStage =
  | 'reading'
  | 'parsing'
  | 'exporting'
  | 'validating'
  | 'complete'
  | 'cancelled'
  | 'error';

export interface ConversionProgress {
  stage: ConversionStage;
  percent: number;
  message: string;
}

