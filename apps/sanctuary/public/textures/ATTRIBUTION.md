<!--
File: apps/sanctuary/public/textures/ATTRIBUTION.md
Description: Records third-party browser texture provenance.
Purpose: Makes runtime PBR asset licensing traceable.
Notes: Texture maps are assigned only to derivatives with authored compatible UVs.
-->

# Runtime texture attribution

## Wood Floor

- Source: Poly Haven, [Wood Floor](https://polyhaven.com/a/wood_floor)
- License: CC0 1.0 Universal
- Files: `polyhaven/wood_floor/wood_floor_diff_1k.jpg`, `wood_floor_nor_gl_1k.jpg`, and `wood_floor_arm_1k.jpg`
- Use: repeating browser PBR maps only on sanctuary meshes that the derivative audit confirms have authored UVs. These files do not alter the accepted Blender geometry or source materials.
- Downloaded variant: 1K JPG, selected to limit initial runtime texture transfer.

## Fine Grained Wood

- Source: Poly Haven, [Fine Grained Wood](https://polyhaven.com/a/fine_grained_wood)
- License: CC0 1.0 Universal
- Files: `polyhaven/fine_grained_wood/fine_grained_wood_col_2k.jpg`, `fine_grained_wood_nor_gl_2k.jpg`, and `fine_grained_wood_rough_2k.jpg`
- Use: wall, trim, and kneeling-rest wood families, including triplanar projection on derivatives without authored UVs.
- Downloaded variant: 2K JPG.

## Walnut Veneer

- Source: Poly Haven, [Walnut Veneer](https://polyhaven.com/a/walnut_veneer)
- License: CC0 1.0 Universal
- Files: `polyhaven/walnut_veneer/walnut_veneer_diff_2k.jpg`, `walnut_veneer_nor_gl_2k.jpg`, and `walnut_veneer_rough_2k.jpg`
- Use: ceiling, table, and window-joinery wood families, including triplanar projection on derivatives without authored UVs.
- Downloaded variant: 2K JPG.

## Fabric Leather 02

- Source: Poly Haven, [Fabric Leather 02](https://polyhaven.com/a/fabric_leather_02)
- License: CC0 1.0 Universal
- Files: `polyhaven/fabric_leather_02/fabric_leather_02_diff_2k.jpg`, `fabric_leather_02_nor_gl_2k.jpg`, and `fabric_leather_02_rough_2k.jpg`
- Use: the accepted Bible's one exported leather material zone, with projected PBR sampling because that derivative has no authored UVs.
- Downloaded variant: 2K JPG.

## White Plaster 02

- Source: Poly Haven, [White Plaster 02](https://polyhaven.com/a/white_plaster_02)
- License: CC0 1.0 Universal
- Files: `polyhaven/white_plaster_02/white_plaster_02_diff_2k.jpg`, `white_plaster_02_nor_gl_2k.jpg`, and `white_plaster_02_rough_2k.jpg`
- Use: altar plaster and stone semantic zones, with projected PBR sampling where authored UVs are absent.
- Downloaded variant: 2K JPG.
