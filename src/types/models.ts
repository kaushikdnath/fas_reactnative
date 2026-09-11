export type Batch = { id:number; name:string; academicYear:string; active:number; createdAt:string };
export type Student = { id:number; code:string; name:string; photoUri?:string|null; address?:string|null; studentMobile?:string|null; guardianName:string; guardianRelationship?:string|null; guardianMobile?:string|null; batchId:number; active:number; createdAt:string };
export type Fingerprint = { id:number; studentId:number; fingerName:string; deviceSlot:number; template:string; createdAt:string };
export type Attendance = { id:number; studentId:number; attendanceDate:string; inTime?:string|null; outTime?:string|null; status:string; confidence?:number|null; createdAt:string; studentName?:string; batchName?:string };
