import Fund from './Fund';
import Media from './Media';
import Product from './Product';
import Transaction from './Transaction';
import Office from './Office';
import Reservation from './Reservation';
import PhysicalCard from './PhysicalCard';

export default interface Voucher {
    id: number;
    number?: string;
    address?: string;
    fund_id: number;
    expired?: boolean;
    fund: Fund;
    type?: 'regular' | 'product';
    state?: string;
    state_locale?: string;
    timestamp?: number;
    transactions: Array<Transaction>;
    product_vouchers?: Array<Voucher>;
    records?: Array<{
        voucher_id: number;
        value_locale: string;
        record_type_key: string;
        record_type_name: string;
    }>;
    product: Product;
    product_reservation: Reservation;
    offices?: Array<Office>;
    query_product?: {
        reservable?: boolean;
        reservable_count?: number;
        reservable_enabled?: boolean;
        reservable_expire_at?: string;
        reservable_expire_at_locale?: string;
    };
    allowed_organizations: Array<{
        id: number;
        name: string;
        logo: Media;
    }>;
    identity_email?: string;
    activation_code?: string;
    identity_bsn?: string;
    relation_bsn?: string;
    client_uid?: string;
    physical_card?: PhysicalCard;
    source_locale?: string;
    amount?: string;
    amount_locale?: string;
    amount_total?: string;
    amount_total_locale?: string;
    amount_top_up?: string;
    amount_top_up_locale?: string;
    amount_available?: string;
    amount_available_locale?: string;
    amount_spent?: string;
    amount_spent_locale?: string;
    note?: string;
    expire_at_locale?: string;
    in_use?: boolean;
    first_use_date_locale?: string;
    has_payouts?: boolean;
    is_granted?: boolean;
    is_external: boolean;
    limit_multiplier?: number;
    identity_address?: string;
    history: Array<{
        id: number;
        event: string;
        event_locale: string;
        created_at: string;
        created_at_locale: string;
    }>;
    deactivated?: boolean;
    used: boolean;
    last_transaction_at?: string;
    last_transaction_at_locale?: string;
    records_title?: string;
    returnable?: boolean;
    last_active_day_locale?: string;
    created_at?: string;
    created_at_locale?: string;
    expire_at?: string;
}
