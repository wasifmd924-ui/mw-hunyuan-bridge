import { describe, expect, it } from 'vitest';
import { XMLParser, XMLValidator } from 'fast-xml-parser';
import { exportModelToCollada } from '../src/engine/colladaExporter';
import { parseObjString } from '../src/engine/objParser';
import { DEFAULT_CONVERSION_OPTIONS } from '../src/engine/types';

describe('COLLADA 1.4.1 Exporter', () => {
  it('generates valid COLLADA 1.4.1 XML with correct asset units and up_axis', () => {
    const obj = `
      o HunyuanMesh
      v 0 0 0
      v 1 0 0
      v 0 1 0
      vn 0 0 1
      f 1//1 2//1 3//1
    `;
    const model = parseObjString(obj);
    const exported = exportModelToCollada(model, DEFAULT_CONVERSION_OPTIONS);

    expect(XMLValidator.validate(exported.daeContent)).toBe(true);

    const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' });
    const doc = parser.parse(exported.daeContent);

    expect(doc.COLLADA['@_version']).toBe('1.4.1');
    expect(doc.COLLADA['@_xmlns']).toBe('http://www.collada.org/2005/11/COLLADASchema');
    expect(doc.COLLADA.asset.unit['@_name']).toBe('meter');
    expect(doc.COLLADA.asset.unit['@_meter']).toBe('1');
    expect(doc.COLLADA.asset.up_axis).toBe('Y_UP');
  });

  it('generates valid geometry sources, vertices, triangles, and scene instances', () => {
    const obj = `
      o PartA
      v 0 0 0
      v 1 0 0
      v 0 1 0
      f 1 2 3
      o PartB
      v 2 0 0
      v 3 0 0
      v 2 1 0
      f 4 5 6
    `;
    const model = parseObjString(obj);
    const exported = exportModelToCollada(model, DEFAULT_CONVERSION_OPTIONS);

    expect(XMLValidator.validate(exported.daeContent)).toBe(true);
    expect(exported.exportedObjectCount).toBe(2);
    expect(exported.exportedVertexCount).toBe(6);
    expect(exported.exportedPrimitiveCount).toBe(2);

    const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' });
    const doc = parser.parse(exported.daeContent);

    const geometries = doc.COLLADA.library_geometries.geometry;
    expect(Array.isArray(geometries)).toBe(true);
    expect(geometries).toHaveLength(2);
    expect(geometries[0]['@_name']).toBe('PartA');
    expect(geometries[1]['@_name']).toBe('PartB');

    const nodes = doc.COLLADA.library_visual_scenes.visual_scene.node;
    expect(Array.isArray(nodes)).toBe(true);
    expect(nodes).toHaveLength(2);
    expect(nodes[0].instance_geometry['@_url']).toBe(`#${geometries[0]['@_id']}`);
    expect(nodes[1].instance_geometry['@_url']).toBe(`#${geometries[1]['@_id']}`);
  });

  it('escapes XML special characters in object names', () => {
    const obj = `
      o Mesh <Test> & "Quote"
      v 0 0 0
      v 1 0 0
      v 0 1 0
      f 1 2 3
    `;
    const model = parseObjString(obj);
    const exported = exportModelToCollada(model, DEFAULT_CONVERSION_OPTIONS);
    expect(XMLValidator.validate(exported.daeContent)).toBe(true);
  });
});

