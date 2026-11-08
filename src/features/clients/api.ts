import { request, mutate } from '@/lib/http'
export type Seller = {id:string;name:string}
export type Classification = {id:number;operator_id:number;tenant_id:string|null;code:string;name:string;description:string|null;is_active:boolean;sort_order:number;operator?:{id:number;name:string};rules:RenewalRule[]}
export type RenewalRule = {id:string;classification_id:number;tenant_id:string|null;minimum_months:number;valid_from:string;valid_until:string|null;is_active:boolean;notes:string|null}
export type Contact = {id:string;name:string;position:string|null;phone:string|null;email:string|null;is_primary:boolean;is_active:boolean;notes:string|null}
export type PortfolioContract = {order_id:string;order_code:string|null;client_id:string|null;client_name:string;operator_id:number;operator_name:string|null;classification_id:number|null;classification_name:string|null;line_count:number;monthly_revenue:string|null;average_activation_date:string|null;renewal_months:number|null;renewal_date:string|null;days_until_renewal:number|null;status:'classification_required'|'rule_required'|'activation_data_required'|'overdue'|'upcoming'|'waiting'}
export type PortfolioResponse = {data:PortfolioContract[];meta:{current_page:number;last_page:number;per_page:number;total:number}}
export type ContractRenewal = {order_id:string;order_code:string|null;operator_id:number|null;operator_name:string|null;classification_id:number|null;renewal_months:number|null;average_activation_date:string|null;renewal_date:string|null;line_count:number;days_until_renewal?:number;status:'classification_required'|'rule_required'|'activation_data_required'|'overdue'|'upcoming'|'waiting'}
export type Client = {contract_renewals?:ContractRenewal[];id:string;tenant_id:string;person_type:'PF'|'PJ';document:string;company_name:string;phone:string|null;email:string|null;zip_code:string|null;address:string|null;address_number:string|null;address_complement:string|null;neighborhood:string|null;city:string|null;state:string|null;operator_id:number|null;classification_id:number|null;contract_started_on:string|null;contract_ends_on:string|null;is_active:boolean;operator?:{id:number;name:string};classification?:Classification;sellers?:{id:string;tenant_user_id:string;started_at:string;ended_at:string|null;reason:string|null;membership?:{user?:{name:string}}}[];contacts?:Contact[];operator_history?:unknown[]}
export type ClientInput = Pick<Client,'person_type'|'document'|'company_name'|'phone'|'email'|'zip_code'|'address'|'address_number'|'address_complement'|'neighborhood'|'city'|'state'|'operator_id'|'classification_id'|'contract_started_on'|'contract_ends_on'|'is_active'> & {seller_membership_id:string|null;seller_reason:string|null}
export type ContactInput = Omit<Contact,'id'>
export type ClassificationInput = Pick<Classification,'operator_id'|'code'|'name'|'description'|'is_active'|'sort_order'>
export type RuleInput = Pick<RenewalRule,'minimum_months'|'valid_from'|'valid_until'|'is_active'|'notes'>
const base=(id:string)=>'/api/v1/tenants/'+encodeURIComponent(id)
export const clientsApi={
 portfolio:(id:string,params:{search?:string;operator_id?:number;page?:number;per_page?:number})=>request<PortfolioResponse>(base(id)+'/client-portfolio?'+new URLSearchParams(Object.entries(params).filter(([,value])=>value!==undefined&&value!=='').map(([key,value])=>[key,String(value)])).toString()),
 list:(id:string)=>request<{data:Client[];meta:{can_manage:boolean;can_create:boolean;can_delete:boolean}}>(base(id)+'/clients'),
 remove:(id:string,client:string)=>mutate(base(id)+'/clients/'+client,{},'DELETE'),
 show:(id:string,client:string)=>request<{data:Client}>(base(id)+'/clients/'+client),
 options:(id:string)=>request<{data:{sellers:Seller[];current_seller_id:string|null;can_assign_seller:boolean}}>(base(id)+'/clients/options'),
 save:(id:string,data:ClientInput,client?:string)=>mutate<{data:Client}>(base(id)+'/clients'+(client?'/'+client:''),data,client?'PATCH':'POST'),
 contact:(id:string,client:string,data:ContactInput,contact?:string)=>mutate(base(id)+'/clients/'+client+'/contacts'+(contact?'/'+contact:''),data,contact?'PATCH':'POST'),
 classifications:(id:string)=>request<{data:Classification[];meta:{can_manage:boolean}}>(base(id)+'/operator-classifications'),
 saveClassification:(id:string,data:ClassificationInput,classification?:number)=>mutate(base(id)+'/operator-classifications'+(classification?'/'+classification:''),data,classification?'PATCH':'POST'),
 addRule:(id:string,classification:number,data:RuleInput,ruleId?:string)=>mutate(base(id)+'/operator-classifications/'+classification+'/renewal-rules'+(ruleId?'/'+ruleId:''),data,ruleId?'PATCH':'POST'),
 globalClassifications:()=>request<{data:Classification[]}>('/api/v1/admin/operator-classifications'),
 saveGlobalClassification:(data:ClassificationInput,classification?:number)=>mutate('/api/v1/admin/operator-classifications'+(classification?'/'+classification:''),data,classification?'PATCH':'POST'),
 addGlobalRule:(classification:number,data:RuleInput,ruleId?:string)=>mutate('/api/v1/admin/operator-classifications/'+classification+'/renewal-rules'+(ruleId?'/'+ruleId:''),data,ruleId?'PATCH':'POST'),
}
