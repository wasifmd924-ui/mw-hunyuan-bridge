import { describe, expect, it } from 'vitest';
import { XMLParser } from 'fast-xml-parser';
import { convertObjStringToDae } from '../src/engine/convertObjToDae';
import { parseObjString } from '../src/engine/objParser';
import { DEFAULT_CONVERSION_OPTIONS } from '../src/engine/types';

describe('Geometry Preservation Verification', () => {
  it('preserves exact vertex positions, bounding box, and face coverage for a Hunyuan3D-style mesh', () => {
    const obj = `
      # Hunyuan3D generated mesh
      o Hunyuan_Sculpture
      v -1.234567 0.000123 4.567891
      v 2.345678 -0.987654 1.111111
      v 0.500000 3.141592 -2.718281
      v -0.250000 -1.500000 0.000000
      vn 0.0 0.0 1.0
      vn 0.0 1.0 0.0
      vt 0.0 0.0
      vt 1.0 0.0
      vt 0.5 1.0
      f 1/1/1 2/2/1 3/3/1
      f 1/1/2 3/3/2 4/2/2
      f 2/2/1 4/2/1 3/3/1
      f 1/1/1 4/2/1 2/2/1
    `;
    const orig = parseObjString(obj);
    const result = convertObjStringToDae(obj, 'sculpture.obj', DEFAULT_CONVERSION_OPTIONS);

    expect(result.validation.status).toBe('PASSED');
    expect(result.validation.vertexCountMatch).toBe(true);
    expect(result.validation.boundingBoxMatch).toBe(true);
    expect(result.validation.objectCountMatch).toBe(true);
    expect(result.validation.faceCoverageMatch).toBe(true);
    expect(result.validation.maxCoordinateDelta).toBe(0);

    // Re-parse DAE and compare every single vertex coordinate
    const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' });
    const doc = parser.parse(result.daeContent);
    const posArrayText: string = doc.COLLADA.library_geometries.geometry.mesh.source[0].float_array['#text'];
    const exportedCoords = posArrayText.trim().split(/\s+/).map(Number);

    expect(exportedCoords.length).toBe(orig.positions.length);
    for (let i = 0; i < orig.positions.length; i += 1) {
      expect(Math.abs(exportedCoords[i] - orig.positions[i])).toBeLessThanOrEqual(1e-7);
    }
  });

  it('triangulates concave n-gon faces without altering vertex positions or adding vertices', () => {
    // L-shaped concave hexagon in XY plane
    const obj = `
      o Concave_Plate
      v 0 0 0
      v 2 0 0
      v 2 1 0
      v 1 1 0
      v 1 2 0
      v 0 2 0
      f 1 2 3 4 5 6
    `;
    const result = convertObjStringToDae(obj, 'plate.obj', DEFAULT_CONVERSION_OPTIONS);

    expect(result.validation.status).toBe('PASSED_WITH_NOTES');
    expect(result.vertexCount).toBe(6);
    expect(result.validation.exportedVertexCount).toBe(6);
    // A 6-vertex simple polygon triangulates into exactly 6 - 2 = 4 triangles
    expect(result.exportedTriangleCount).toBe(4);
    expect(result.validation.triangulatedFaceCount).toBe(1);
    expect(result.validation.maxCoordinateDelta).toBe(0);
  });
});

