import { request, mutate } from '@/lib/http'
import type { TeamCommissionRule } from '@/features/team-commissions/api'
export type Participant = {id: string; role:'PARTNER'|'REFERRER'; person_type:'PF'|'PJ'; name:string; document:string|null; email:string|null; phone:string|null; notes:string|null; is_active:boolean}
export type ParticipantInput = Omit<Participant,'id'>
export type Override = {id:string; operator_id:number; operator?:{id:number;name:string}; order_type:string; percentage:string; starts_on:string; ends_on:string|null; is_active:boolean}
export type OverrideInput = Omit<Override,'id'|'operator'>
const base = (tenantId:string) => `/api/v1/tenants/${encodeURIComponent(tenantId)}/commercial-participants`
export const participantsApi = {
 list:(tenantId:string)=>request<{data:Participant[];meta:{can_manage:boolean}}>(base(tenantId)),
 save:(tenantId:string,data:ParticipantInput,id?:string)=>mutate<{data:Participant}>(base(tenantId)+(id?'/'+id:''),data,id?'PATCH':'POST'),
 commissions:(tenantId:string,id:string)=>request<{data:{defaults:TeamCommissionRule[];overrides:Override[]}}>(base(tenantId)+'/'+id+'/commissions'),
 saveOverride:(tenantId:string,id:string,data:OverrideInput,overrideId?:string)=>mutate(base(tenantId)+'/'+id+'/commissions'+(overrideId?'/'+overrideId:''),{...data,percentage:Number(data.percentage.replace(',','.'))},overrideId?'PATCH':'POST'),
 deleteOverride:(tenantId:string,id:string,overrideId:string)=>mutate(base(tenantId)+'/'+id+'/commissions/'+overrideId,{},'DELETE'),
}
