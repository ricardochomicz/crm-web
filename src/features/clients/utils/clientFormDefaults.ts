import type { ClientInput, ContactInput } from '../api'

/** Always returns a fresh object so form state cannot leak between dialogs. */
export function blankClient(): ClientInput {
  return {
    person_type: 'PJ',
    document: '',
    company_name: '',
    phone: null,
    email: null,
    zip_code: null,
    address: null,
    address_number: null,
    address_complement: null,
    neighborhood: null,
    city: null,
    state: null,
    operator_id: null,
    classification_id: null,
    contract_started_on: null,
    contract_ends_on: null,
    is_active: true,
    seller_membership_id: null,
    seller_reason: null,
  }
}

export function blankContact(): ContactInput {
  return {
    name: '',
    cpf: null,
    birth_date: null,
    position: null,
    phone: null,
    email: null,
    is_primary: false,
    is_active: true,
    portal_access_enabled: false,
    notes: null,
  }
}
