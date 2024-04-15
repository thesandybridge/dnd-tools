export const MILES_PER_MAP_UNIT = 15.644;

/**
 * @typedef {Object} Coordinates
 * @property {number} lat - Latitude value
 * @property {number} lng - Longitude value
 */

/**
 * Convert map units to total distance in miles
 *
 * @param {number} mapUnits - Map units
 * @returns {number} Map units converted to miles
 */
function calculateDistanceInMiles(mapUnits) {
    return mapUnits * MILES_PER_MAP_UNIT;
}

/**
 * Calculates the distance between two points on the map
 *
 * @param {Coordinates} pointA
 * @param {Coordinates} pointB
 * @returns {number} The distance between pointA and pointB in miles
 */
export function calculateDistance(pointA, pointB) {
    const dx = pointB.lng - pointA.lng; // difference in longitude units
    const dy = pointB.lat - pointA.lat; // difference in latitude units
    const distanceInMapUnits = Math.sqrt(dx * dx + dy * dy); // Euclidean distance in map units
    return calculateDistanceInMiles(distanceInMapUnits).toFixed(2); // Convert to miles and format
}
