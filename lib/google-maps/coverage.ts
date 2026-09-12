/** QBL Riyadh service envelope; coordinates outside it require operational review. */
export function isWithinRiyadh(latitude: number, longitude: number): boolean {
  return (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= 24.2 &&
    latitude <= 25.2 &&
    longitude >= 46.2 &&
    longitude <= 47.2
  );
}
