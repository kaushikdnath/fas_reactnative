import AsyncStorage from '@react-native-async-storage/async-storage';
export async function getSmsConfig(){return {baseUrl:await AsyncStorage.getItem('sms.baseUrl')||'http://127.0.0.1:8080',token:await AsyncStorage.getItem('sms.token')||''};}
export async function saveSmsConfig(baseUrl:string,token:string){await AsyncStorage.multiSet([['sms.baseUrl',baseUrl],['sms.token',token]]);}
