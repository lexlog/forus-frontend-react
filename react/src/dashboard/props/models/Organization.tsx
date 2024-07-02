import Media from './Media';
import Tag from './Tag';
import BusinessType from './BusinessType';
import ReservationField from './ReservationField';
import Office from './Office';
import Employee from './Employee';

export interface SponsorProviderOrganization extends Organization {
    funds: Array<{
        id: number;
        name: string;
        organization_id: number;
        fund_provider_id: number;
        fund_provider_state: string;
        fund_provider_state_locale: string;
    }>;
    products_count: number;
    last_activity_locale: string;
    offices: Array<Office>;
    employees: Array<Employee>;
}

export interface OrganizationValidator extends Organization {
    id: number;
    organization_id: number;
    validator_organization_id: number;
}

export default interface Organization {
    id: number;
    identity_address: string;
    name: string;
    kvk: string;
    business_type_id: number;
    email_public: boolean;
    phone_public: boolean;
    website_public: boolean;
    description?: string;
    description_html?: string;
    reservation_phone: 'required' | 'optional' | 'no';
    reservation_address: 'required' | 'optional' | 'no';
    reservation_birth_date: 'required' | 'optional' | 'no';
    reservation_allow_extra_payments: boolean;
    reservation_fields: Array<ReservationField>;
    email?: string;
    phone?: string;
    website?: string;
    iban?: string;
    btw?: string;
    bi_connection_auth_type: 'header' | 'disabled' | 'parameter';
    bi_connection_token: string;
    bi_connection_url: string;
    has_bank_connection: boolean;
    manage_provider_products: boolean;
    backoffice_available: boolean;
    reservations_auto_accept: boolean;
    allow_custom_fund_notifications: boolean;
    validator_auto_accept_funds: boolean;
    reservations_budget_enabled: boolean;
    reservations_subsidy_enabled: boolean;
    is_sponsor: boolean;
    is_provider: boolean;
    is_validator: boolean;
    bsn_enabled: boolean;
    allow_batch_reservations: boolean;
    allow_budget_fund_limits: boolean;
    allow_manual_bulk_processing: boolean;
    allow_fund_request_record_edit: boolean;
    allow_bi_connection: boolean;
    auth_2fa_policy: 'optional' | 'required' | 'restrict_features';
    auth_2fa_remember_ip?: boolean;
    allow_pre_checks?: boolean;
    allow_2fa_restrictions?: boolean;
    allow_reservation_custom_fields: boolean;
    auth_2fa_funds_policy: 'optional' | 'required' | 'restrict_features';
    auth_2fa_funds_remember_ip: boolean;
    auth_2fa_funds_restrict_emails: boolean;
    auth_2fa_funds_restrict_auth_sessions: boolean;
    auth_2fa_funds_restrict_reimbursements: boolean;
    auth_2fa_restrict_bi_connections: boolean;
    tags: Array<Tag>;
    logo?: Media;
    business_type: BusinessType;
    permissions?: Array<string>;
    offices_count: number;
    offices: Array<Office>;
    can_view_provider_extra_payments?: boolean;
    allow_extra_payments_by_sponsor?: boolean;
    allow_provider_extra_payments?: boolean;
    can_receive_extra_payments?: boolean;
    contacts?: Array<{
        id?: number;
        type?: 'email';
        key?: string;
        value?: string;
        organization_id?: number;
    }>;
    bank_statement_details?: {
        bank_transaction_id?: boolean;
        bank_transaction_date?: boolean;
        bank_transaction_time?: boolean;
        bank_reservation_number?: boolean;
        bank_branch_number?: boolean;
        bank_branch_id?: boolean;
        bank_branch_name?: boolean;
        bank_fund_name?: boolean;
        bank_note?: boolean;
    };
}
