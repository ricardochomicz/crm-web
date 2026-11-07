import { request, mutate } from '@/lib/http'
import type { TeamCommissionRule } from '@/features/team-commissions/api'
export type Participant = {id: string; role:'PARTNER'|'REFERRER'; person_type:'PF'|'PJ'; name:string; document:string|null; email:string|null; phone:string|null; notes:string|null; is_active:boolean}
export type ParticipantInput = Omit<Participant,'id'>
export type Override = {id:string; operator_id:number; operator?:{id:number;name:string}; order_type:string; percentage:string; starts_on:string; ends_on:string|null; is_active:boolean}
export type OverrideInput = Omit<Override,'id'|'operator'>
export type ParticipantsPage = {data:Participant[];links:{first:string|null;last:string|null;prev:string|null;next:string|null};meta:{can_manage:boolean;current_page:number;last_page:number;total:number;per_page:number;from:number|null;to:number|null}}\nconst base = (tenantId:string) => `/api/v1/tenants/${encodeURIComponent(tenantId)}/commercial-participants`
export const participantsApi = {
 list:(tenantId:string,page=1,search='',role='')=>{const params=new URLSearchParams({page:String(page)});if(search)params.set('search',search);if(role)params.set('role',role);return request<ParticipantsPage>(base(tenantId)+'?'+params)},
 save:(tenantId:string,data:ParticipantInput,id?:string)=>mutate<{data:Participant}>(base(tenantId)+(id?'/'+id:''),data,id?'PATCH':'POST'),
 commissions:(tenantId:string,id:string)=>request<{data:{defaults:TeamCommissionRule[];overrides:Override[]}}>(base(tenantId)+'/'+id+'/commissions'),
 saveOverride:(tenantId:string,id:string,data:OverrideInput,overrideId?:string)=>mutate(base(tenantId)+'/'+id+'/commissions'+(overrideId?'/'+overrideId:''),{...data,percentage:Number(data.percentage.replace(',','.'))},overrideId?'PATCH':'POST'),
 deleteOverride:(tenantId:string,id:string,overrideId:string)=>mutate(base(tenantId)+'/'+id+'/commissions/'+overrideId,{},'DELETE'),
}
