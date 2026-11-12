import { describe, expect, it } from 'vitest';
import { ObjParseError, parseObjString } from '../src/engine/objParser';

describe('OBJ Parser', () => {
  it('parses a simple triangle', () => {
    const obj = `
      v 0 0 0
      v 1 0 0
      v 0 1 0
      f 1 2 3
    `;
    const model = parseObjString(obj);
    expect(model.stats.vertexCount).toBe(3);
    expect(model.stats.faceCount).toBe(1);
    expect(model.stats.triangleCount).toBe(1);
    expect(model.positions).toEqual([0, 0, 0, 1, 0, 0, 0, 1, 0]);
    expect(model.objects[0].facePositionIndices).toEqual([0, 1, 2]);
  });

  it('parses quads and n-gons', () => {
    const obj = `
      v 0 0 0
      v 1 0 0
      v 1 1 0
      v 0 1 0
      v 0.5 1.5 0
      f 1 2 3 4
      f 1 2 3 5 4
    `;
    const model = parseObjString(obj);
    expect(model.stats.faceCount).toBe(2);
    expect(model.stats.quadCount).toBe(1);
    expect(model.stats.ngonCount).toBe(1);
    expect(model.objects[0].faceVertexCounts).toEqual([4, 5]);
  });

  it('resolves negative relative indices accurately', () => {
    const obj = `
      v 0 0 0
      v 2 0 0
      v 2 2 0
      vn 0 0 1
      vt 0 0
      vt 1 0
      vt 1 1
      f -3/-3/-1 -2/-2/-1 -1/-1/-1
    `;
    const model = parseObjString(obj);
    expect(model.objects[0].facePositionIndices).toEqual([0, 1, 2]);
    expect(model.objects[0].faceTexcoordIndices).toEqual([0, 1, 2]);
    expect(model.objects[0].faceNormalIndices).toEqual([0, 0, 0]);
  });

  it('preserves multiple objects and groups', () => {
    const obj = `
      o Body
      g Torso
      v 0 0 0
      v 1 0 0
      v 0 1 0
      f 1 2 3
      o Head
      g Cranium
      v 0 2 0
      v 1 2 0
      v 0 3 0
      f 4 5 6
    `;
    const model = parseObjString(obj);
    expect(model.stats.objectCount).toBe(2);
    expect(model.objects[0].name).toBe('Body');
    expect(model.objects[0].groups).toContain('Torso');
    expect(model.objects[1].name).toBe('Head');
    expect(model.objects[1].groups).toContain('Cranium');
  });

  it('handles normals, texcoords, and v//vn format without corrupting geometry', () => {
    const obj = `
      mtllib hunyuan_mat.mtl
      usemtl material_0
      v 1.25 -2.5 3.75
      v 4.0 0.0 -1.0
      v 0.0 5.0 2.0
      vt 0.1 0.9
      vt 0.5 0.5
      vt 0.9 0.1
      vn 0 1 0
      f 1//1 2//1 3//1
    `;
    const model = parseObjString(obj);
    expect(model.stats.hasNormals).toBe(true);
    expect(model.stats.hasTexcoords).toBe(true);
    expect(model.materialLibraries).toEqual(['hunyuan_mat.mtl']);
    expect(model.warnings.length).toBeGreaterThan(0);
    expect(model.objects[0].faceNormalIndices).toEqual([0, 0, 0]);
    expect(model.objects[0].faceTexcoordIndices).toEqual([-1, -1, -1]);
  });

  it('throws descriptive errors on empty files, missing vertices, and invalid indices', () => {
    expect(() => parseObjString('')).toThrow(ObjParseError);
    expect(() => parseObjString('# comment only\n')).toThrow(ObjParseError);
    expect(() => parseObjString('v 0 0 0\nv 1 0 0\n')).toThrow(/no face/i);
    expect(() => parseObjString('v 0 0 0\nv 1 0 0\nv 0 1 0\nf 1 2 99\n')).toThrow(/out of bounds/i);
    expect(() => parseObjString('v 0 NaN 0\nf 1 2 3\n')).toThrow(/Non-finite/i);
  });

  it('parses large OBJ files efficiently (60,000 vertices, 20,000 faces)', () => {
    const lines: string[] = [];
    for (let i = 0; i < 60000; i += 1) {
      lines.push(`v ${(i * 0.01).toFixed(4)} ${Math.sin(i).toFixed(4)} ${Math.cos(i).toFixed(4)}`);
    }
    for (let i = 1; i <= 59998; i += 3) {
      lines.push(`f ${i} ${i + 1} ${i + 2}`);
    }
    const largeObj = lines.join('\n');
    const model = parseObjString(largeObj);
    expect(model.stats.vertexCount).toBe(60000);
    expect(model.stats.faceCount).toBe(20000);
  });
});

