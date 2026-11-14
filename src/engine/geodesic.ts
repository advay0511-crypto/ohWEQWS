/**
 * Geodesic and Polygon Utilities for Field Shift
 * Computes spherical geodesic area on WGS84 authalic sphere (Earth radius = 6378137m)
 */

export interface LatLngPoint {
  lat: number;
  lon: number;
}

/**
 * Calculates geodesic area of a polygon in square meters.
 * Coordinates are array of [lat, lon] or LatLngPoint.
 */
export function calculateGeodesicArea(points: (LatLngPoint | [number, number])[]): number {
  if (!points || points.length < 3) return 0;

  const normalized: LatLngPoint[] = points.map((p) => {
    if (Array.isArray(p)) {
      return { lat: p[0], lon: p[1] };
    }
    return p;
  });

  const R = 6378137; // Earth's mean radius in meters
  const numPoints = normalized.length;
  let totalAngle = 0;

  for (let i = 0; i < numPoints; i++) {
    const prev = normalized[(i + numPoints - 1) % numPoints];
    const curr = normalized[i];
    const next = normalized[(i + 1) % numPoints];

    const latRad = (curr.lat * Math.PI) / 180;
    const dLonRad = ((next.lon - prev.lon) * Math.PI) / 180;

    totalAngle += dLonRad * Math.sin(latRad);
  }

  const areaM2 = Math.abs((totalAngle * (R * R)) / 2);
  return Number(areaM2.toFixed(1));
}

export function formatArea(areaM2: number, unit: 'metric' | 'imperial' = 'metric'): {
  value: number;
  formatted: string;
  unitLabel: string;
} {
  if (unit === 'imperial') {
    const acres = areaM2 / 4046.8564224;
    return {
      value: Number(acres.toFixed(2)),
      formatted: `${acres.toFixed(2)} acres`,
      unitLabel: 'acres',
    };
  }
  const hectares = areaM2 / 10000;
  return {
    value: Number(hectares.toFixed(2)),
    formatted: `${hectares.toFixed(2)} ha`,
    unitLabel: 'ha',
  };
}

/**
 * Validates a polygon for self-intersection and minimum points.
 */
export function validatePolygon(points: LatLngPoint[]): {
  valid: boolean;
  error?: string;
} {
  if (points.length < 3) {
    return { valid: false, error: 'A farm boundary requires at least 3 distinct boundary points.' };
  }

  // Check for duplicate adjacent vertices
  for (let i = 0; i < points.length; i++) {
    const p1 = points[i];
    const p2 = points[(i + 1) % points.length];
    if (Math.abs(p1.lat - p2.lat) < 1e-7 && Math.abs(p1.lon - p2.lon) < 1e-7) {
      return { valid: false, error: 'Contains repeated coincident points.' };
    }
  }

  // Check for simple edge self-intersections (line segment intersection test)
  for (let i = 0; i < points.length; i++) {
    const a1 = points[i];
    const a2 = points[(i + 1) % points.length];

    for (let j = i + 2; j < points.length; j++) {
      if ((j + 1) % points.length === i) continue; // Adjacent edge
      const b1 = points[j];
      const b2 = points[(j + 1) % points.length];

      if (segmentsIntersect(a1, a2, b1, b2)) {
        return { valid: false, error: 'Boundary edges intersect each other. Please adjust points so boundary does not cross.' };
      }
    }
  }

  const area = calculateGeodesicArea(points);
  if (area < 100) {
    return { valid: false, error: 'Calculated area is too small (< 100 m²). Please draw the full parcel boundary.' };
  }

  return { valid: true };
}

function segmentsIntersect(p1: LatLngPoint, p2: LatLngPoint, p3: LatLngPoint, p4: LatLngPoint): boolean {
  const ccw = (a: LatLngPoint, b: LatLngPoint, c: LatLngPoint) => {
    return (c.lat - a.lat) * (b.lon - a.lon) > (b.lat - a.lat) * (c.lon - a.lon);
  };
  return ccw(p1, p3, p4) !== ccw(p2, p3, p4) && ccw(p1, p2, p3) !== ccw(p1, p2, p4);
}

/**
 * Calculates geodesic perimeter of a closed polygon in meters using Haversine summation.
 */
export function calculateGeodesicPerimeter(points: (LatLngPoint | [number, number])[]): number {
  if (!points || points.length < 2) return 0;
  const normalized: LatLngPoint[] = points.map((p) => (Array.isArray(p) ? { lat: p[0], lon: p[1] } : p));
  const R = 6378137;
  let totalMeters = 0;
  for (let i = 0; i < normalized.length; i++) {
    const p1 = normalized[i];
    const p2 = normalized[(i + 1) % normalized.length];
    const dLat = ((p2.lat - p1.lat) * Math.PI) / 180;
    const dLon = ((p2.lon - p1.lon) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((p1.lat * Math.PI) / 180) *
        Math.cos((p2.lat * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    totalMeters += R * c;
  }
  return Number(totalMeters.toFixed(1));
}

/**
 * Calculates geographic centroid of polygon coordinates [lat, lon].
 */
export function calculatePolygonCentroid(points: (LatLngPoint | [number, number])[]): [number, number] {
  if (!points || points.length === 0) return [0, 0];
  const normalized: LatLngPoint[] = points.map((p) => (Array.isArray(p) ? { lat: p[0], lon: p[1] } : p));
  let sumLat = 0;
  let sumLon = 0;
  normalized.forEach((p) => {
    sumLat += p.lat;
    sumLon += p.lon;
  });
  return [
    Number((sumLat / normalized.length).toFixed(6)),
    Number((sumLon / normalized.length).toFixed(6)),
  ];
}
