import { reactive } from 'vue'
export function useFormValidation<T extends string>() {
 const errors=reactive({} as Record<T,string>)
 function clear(field?:T){if(field)delete errors[field];else for(const key of Object.keys(errors) as T[])delete errors[key]}
 function set(next:Partial<Record<T,string>>){clear();for(const [key,value] of Object.entries(next) as [T,string|undefined][])if(value)errors[key]=value}
 function fromApi(next:Record<string,string[]>){set(Object.fromEntries(Object.entries(next).map(([key,messages])=>[key,messages[0]])) as Partial<Record<T,string>>)}
 function invalid(field:T){return !!errors[field]}
 return {errors,clear,set,fromApi,invalid}
}
