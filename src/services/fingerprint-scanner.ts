import { as608 } from '@/services/as608';
import type { DeviceInfo, FingerprintMatch } from '@/types/models';

/**
 * Typed facade over the raw `as608` native bridge (`services/as608.ts`,
 * backed by the CH340/AS608 Kotlin module in `native/android/`). This
 * file adds TypeScript types and event-name constants for the UI layer;
 * it does not change any native call or event contract.
 */
export const AS608_EVENTS = {
  status: 'AS608_STATUS',
  enroll: 'AS608_ENROLL',
} as const;

export const FingerprintScanner = {
  get available(): boolean {
    return as608.available;
  },
  listDevices: (): Promise<DeviceInfo[]> => as608.listDevices(),
  connect: (deviceId: number): Promise<void> => as608.connect(deviceId),
  disconnect: (): Promise<void> => as608.disconnect(),
  isConnected: (): Promise<boolean> => as608.isConnected(),
  initialize: (): Promise<void> => as608.initialize(),
  getTemplateCount: (): Promise<number> => as608.getTemplateCount(),
  getOccupiedSlots: (): Promise<number[]> => as608.getOccupiedSlots(),
  getFreeSlots: (): Promise<number[]> => as608.getFreeSlots(),
  enroll: (slot: number): Promise<void> => as608.enroll(slot),
  identify: (fast = true): Promise<FingerprintMatch | null> => as608.identify(fast),
  uploadTemplate: (slot: number): Promise<{ base64: string }> => as608.uploadTemplate(slot),
  downloadTemplate: (base64: string, slot: number): Promise<void> => as608.downloadTemplate(base64, slot),
  loadModel: (location: number, slot: number): Promise<void> => as608.loadModel(location, slot),
  deleteModel: (location: number): Promise<void> => as608.deleteModel(location),
  clearDatabase: (): Promise<void> => as608.clearDatabase(),
  events: as608.events,
};
