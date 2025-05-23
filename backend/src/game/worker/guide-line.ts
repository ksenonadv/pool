import { Body, Vector, Query } from "matter-js";

export function raycast(bodies: Array<Body>, start: Vector, dir: Vector, dist: number) {

  let ray = dir;

  for (let i = 0; i < dist; i++) {
    ray = Vector.mult(dir, i);
    ray = Vector.add(start, ray);

    const body = Query.point(bodies, ray)[0];

    // We have a hit.
    if (body) {

      // Compute normal at hit point
      let normal: Vector | undefined;

      if (body.circleRadius) {
        normal = Vector.normalise(Vector.sub(
          ray,
          body.position
        ));
      }
      else if (body.vertices && body.vertices.length >= 2) {
        // For walls (polygons), find closest edge
        let minDist = Infinity;
        let closestNormal: Vector | undefined;
        for (let j = 0; j < body.vertices.length; j++) {
          const v1 = body.vertices[j];
          const v2 = body.vertices[(j + 1) % body.vertices.length];
          // Project ray onto edge
          const edge = Vector.sub(v2, v1);
          const toRay = Vector.sub(ray, v1);
          const edgeLen = Vector.magnitude(edge);
          const proj = Vector.dot(toRay, Vector.normalise(edge));
          if (proj >= 0 && proj <= edgeLen) {
            // Closest point on edge
            const closest = Vector.add(v1, Vector.mult(Vector.normalise(edge), proj));
            const dist = Vector.magnitude(Vector.sub(ray, closest));
            if (dist < minDist) {
              minDist = dist;
              // Edge normal (perpendicular, outward)
              const edgeNormal = Vector.normalise({ x: -(v2.y - v1.y), y: v2.x - v1.x });
              closestNormal = edgeNormal;
            }
          }
        }
        if (closestNormal) normal = closestNormal;
      }

      return {
        point: ray,
        body,
        normal
      };
    }
  }
}