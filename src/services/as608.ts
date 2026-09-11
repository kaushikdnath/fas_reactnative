import { NativeEventEmitter, NativeModules, Platform } from 'react-native';
const Native = NativeModules.AS608;
export const as608 = {
    available: Platform.OS === 'android' && !!Native,
    listDevices: () => Native.listDevices(), 
    connect: (id: number) => Native.connect(id, { baudRate: 57600, dataBits: 8, stopBits: 1, parity: 0 }), 
    disconnect: () => Native.disconnect(), 
    isConnected: () => Native.isConnected(), 
    initialize: () => Native.initialize(), 
    getTemplateCount: () => Native.getTemplateCount(), 
    getOccupiedSlots: () => Native.getOccupiedSlots(), 
    getFreeSlots: () => Native.getFreeSlots(), 
    enroll: (slot: number) => Native.enroll(slot), 
    identify: (fast = true) => Native.identify(fast, null), 
    uploadTemplate: (slot: number) => Native.uploadTemplate(slot), 
    downloadTemplate: (base64: string, slot: number) => Native.downloadTemplate(base64, slot), 
    loadModel: (location: number, slot: number) => Native.loadModel(location, slot), 
    deleteModel: (location: number) => Native.deleteModel(location), 
    clearDatabase: () => Native.clearDatabase(),
    events: Native ? new NativeEventEmitter(Native) : null,
};
