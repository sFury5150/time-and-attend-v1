/**
 * WiFi Geofencing Utility
 * Provides optional BSSID (WiFi network) verification layer
 * Combines GPS geofencing with WiFi network detection for more accurate location validation
 */

export interface WiFiNetwork {
  ssid: string; // Network name
  bssid: string; // MAC address (00:11:22:33:44:55 format)
  signalStrength: number; // RSSI value (usually -30 to -90)
  frequency: number; // 2.4GHz or 5GHz
}

export interface BSSIDGeofenceZone {
  zoneId: string;
  expectedBSSIDs: string[]; // Expected WiFi networks at this location
  strictMode: boolean; // Require WiFi match for validation
  allowOffNetwork: boolean; // Allow clock-in if GPS is correct but WiFi not found
}

/**
 * Get available WiFi networks from device
 * Uses the WiFi Information API when available (Android/iOS)
 * Note: Privacy restrictions apply on most platforms
 */
export async function scanWiFiNetworks(): Promise<WiFiNetwork[]> {
  // This would require platform-specific permissions
  // For now, return empty - can be implemented with native plugins
  
  try {
    // Check if Geolocation API can provide WiFi info (limited support)
    if ('geolocation' in navigator) {
      // Some browsers provide WiFi BSSID in geolocation accuracy
      // This is browser-dependent and may not work
      return [];
    }
  } catch (error) {
    console.log('WiFi scanning not available:', error);
  }

  return [];
}

/**
 * Hash a BSSID for storage (don't store actual MAC addresses if possible)
 * @param bssid - WiFi MAC address
 * @returns SHA-256 hash of BSSID
 */
export async function hashBSSID(bssid: string): Promise<string> {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(bssid.toUpperCase());
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
  } catch (error) {
    console.error('Error hashing BSSID:', error);
    // Fallback: simple hash
    return btoa(bssid).substring(0, 16);
  }
}

/**
 * Verify if current WiFi network matches expected BSSIDs for a geofence zone
 * @param currentNetwork - Current WiFi network (or null if not connected)
 * @param expectedBSSIDs - Array of expected BSSIDs for the zone
 * @param strictMode - If true, must match one of the expected BSSIDs
 * @returns Verification result
 */
export async function verifyWiFiBSSID(
  currentNetwork: WiFiNetwork | null,
  expectedBSSIDs: string[],
  strictMode: boolean = false
): Promise<{
  matches: boolean;
  confidence: 'high' | 'medium' | 'low' | 'unknown';
  message: string;
  networkName?: string;
}> {
  // If not connected to WiFi
  if (!currentNetwork) {
    return {
      matches: !strictMode,
      confidence: strictMode ? 'low' : 'unknown',
      message: strictMode
        ? 'Strict WiFi verification required but not connected to WiFi'
        : 'Not connected to WiFi, using GPS only',
    };
  }

  // Check if current BSSID matches any expected BSSIDs
  const bssidMatch = expectedBSSIDs.some(
    expected => expected.toUpperCase() === currentNetwork.bssid.toUpperCase()
  );

  // Check if SSID matches (additional verification)
  const ssidMatch = currentNetwork.ssid && expectedBSSIDs.some(
    expected => expected.toLowerCase().includes(currentNetwork.ssid.toLowerCase())
  );

  if (bssidMatch) {
    return {
      matches: true,
      confidence: 'high',
      message: `WiFi verified: ${currentNetwork.ssid}`,
      networkName: currentNetwork.ssid,
    };
  }

  if (ssidMatch) {
    return {
      matches: strictMode ? false : true,
      confidence: 'medium',
      message: `SSID matches but BSSID differs: ${currentNetwork.ssid}`,
      networkName: currentNetwork.ssid,
    };
  }

  return {
    matches: false,
    confidence: 'low',
    message: `WiFi mismatch: connected to ${currentNetwork.ssid}, expected different network`,
    networkName: currentNetwork.ssid,
  };
}

/**
 * Store BSSID for a geofence location (admin only)
 * This would be called when setting up a new geofence location
 * @param locationId - Location UUID
 * @param bssid - WiFi BSSID to store
 * @returns Stored BSSID info
 */
export async function storeBSSIDForLocation(
  locationId: string,
  bssid: string
): Promise<{
  locationId: string;
  bssidHash: string;
  bssidPlain: string; // For display only
  timestamp: Date;
}> {
  const hashedBSSID = await hashBSSID(bssid);
  
  return {
    locationId,
    bssidHash: hashedBSSID,
    bssidPlain: bssid,
    timestamp: new Date(),
  };
}

/**
 * Validate WiFi connection quality for geofence
 * Signal strength and frequency affect reliability
 * @param network - WiFi network
 * @returns Quality assessment
 */
export function assessWiFiQuality(network: WiFiNetwork): {
  quality: 'excellent' | 'good' | 'fair' | 'poor';
  reliabilityScore: number; // 0-100
  message: string;
} {
  // RSSI values: -30 to -50 excellent, -50 to -70 good, -70 to -80 fair, below -80 poor
  const rssi = network.signalStrength;
  let quality: 'excellent' | 'good' | 'fair' | 'poor';
  let reliabilityScore = 0;

  if (rssi >= -50) {
    quality = 'excellent';
    reliabilityScore = 95;
  } else if (rssi >= -70) {
    quality = 'good';
    reliabilityScore = 80;
  } else if (rssi >= -80) {
    quality = 'fair';
    reliabilityScore = 60;
  } else {
    quality = 'poor';
    reliabilityScore = 30;
  }

  // 5GHz is more reliable than 2.4GHz
  if (network.frequency === 5000) {
    reliabilityScore = Math.min(100, reliabilityScore + 5);
  }

  return {
    quality,
    reliabilityScore,
    message: `WiFi quality: ${quality} (RSSI: ${rssi}dBm)`,
  };
}

/**
 * Check if multiple WiFi networks are present (multi-BSSID setup)
 * Some locations use multiple access points with same SSID
 * @param networks - Array of WiFi networks
 * @param ssid - Network name to check
 * @returns Networks matching the SSID
 */
export function findMultiBSSIDNetworks(
  networks: WiFiNetwork[],
  ssid: string
): WiFiNetwork[] {
  return networks.filter(n => n.ssid.toLowerCase() === ssid.toLowerCase());
}

/**
 * Simulate WiFi network for testing
 * @returns Test WiFi network
 */
export function getTestWiFiNetwork(): WiFiNetwork {
  return {
    ssid: 'SecurityGuard-Office',
    bssid: 'AA:BB:CC:DD:EE:FF',
    signalStrength: -45, // Good signal
    frequency: 5000, // 5GHz
  };
}

/**
 * Validate BSSID format (MAC address format)
 * @param bssid - String to validate
 * @returns True if valid MAC address format
 */
export function isValidBSSIDFormat(bssid: string): boolean {
  const macRegex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
  return macRegex.test(bssid);
}

export default {
  scanWiFiNetworks,
  hashBSSID,
  verifyWiFiBSSID,
  storeBSSIDForLocation,
  assessWiFiQuality,
  findMultiBSSIDNetworks,
  getTestWiFiNetwork,
  isValidBSSIDFormat,
};
