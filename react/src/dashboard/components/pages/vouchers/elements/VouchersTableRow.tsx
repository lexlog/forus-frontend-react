import React, { Fragment } from 'react';
import Voucher from '../../../../props/models/Voucher';
import StateNavLink from '../../../../modules/state_router/StateNavLink';
import Organization from '../../../../props/models/Organization';
import { currencyFormat, strLimit } from '../../../../helpers/string';
import Tooltip from '../../../elements/tooltip/Tooltip';
import VouchersTableRowStatus from './VouchersTableRowStatus';
import useTranslate from '../../../../hooks/useTranslate';

export default function VouchersTableRow({
    voucher,
    columnKeys,
    organization,
}: {
    voucher: Voucher;
    columnKeys: Array<string>;
    organization: Organization;
}) {
    const translate = useTranslate();

    return (
        <StateNavLink
            key={voucher.id}
            customElement={'tr'}
            className="clickable"
            name={'vouchers-show'}
            params={{ id: voucher.id, organizationId: organization.id }}
            dataDusk={`voucherItem${voucher.id}`}>
            {columnKeys.includes('id') && <td>{voucher.id}</td>}
            {columnKeys.includes('assigned_to') && (
                <td>
                    <div>
                        <strong className="text-primary">
                            {strLimit(voucher.identity_email, 32) || voucher.activation_code || 'Niet toegewezen'}
                        </strong>
                    </div>

                    <div className="text-strong text-md text-muted">
                        {(voucher.identity_bsn || voucher.relation_bsn) && (
                            <span>
                                BSN:&nbsp;
                                <span className="text-muted-dark">{voucher.identity_bsn || voucher.relation_bsn}</span>
                                &nbsp;
                            </span>
                        )}

                        {(voucher.client_uid ||
                            (!voucher.identity_email && voucher.activation_code) ||
                            (!voucher.identity_bsn && !voucher.relation_bsn && voucher.physical_card.code)) && (
                            <span>
                                NR:&nbsp;
                                <span className="text-muted-dark">
                                    {voucher.client_uid || voucher.physical_card.code || 'Nee'}
                                </span>
                                &nbsp;
                            </span>
                        )}
                    </div>
                </td>
            )}

            {columnKeys.includes('source') && (
                <td>
                    <div className="text-md text-muted-dark text-medium">{voucher.source_locale}</div>
                </td>
            )}

            {columnKeys.includes('amount') && <td>{currencyFormat(parseFloat(voucher.amount_total))}</td>}

            {columnKeys.includes('note') && (
                <td>
                    {voucher.note ? (
                        <Tooltip type={'primary'} text={strLimit(voucher.note || '-', 128)} />
                    ) : (
                        <div className="text-muted">-</div>
                    )}
                </td>
            )}

            {columnKeys.includes('fund') && (
                <td>
                    <div className="text-primary text-medium">{strLimit(voucher.fund.name, 32)}</div>

                    <div className="text-strong text-md text-muted-dark">
                        {strLimit(voucher.fund.implementation?.name, 32)}
                    </div>
                </td>
            )}

            {columnKeys.includes('created_at') && (
                <td>
                    <div className="text-medium text-primary">{voucher.created_at_locale.split(' - ')[0]}</div>

                    <div className="text-strong text-md text-muted-dark">
                        {voucher.created_at_locale.split(' - ')[1]}
                    </div>
                </td>
            )}

            {columnKeys.includes('expire_at') && (
                <td>
                    <div className="text-medium text-primary">{voucher.expire_at_locale.split(',')[0]}</div>

                    <div className="text-strong text-md text-muted-dark">{voucher.expire_at_locale.split(',')[1]}</div>
                </td>
            )}

            {columnKeys.includes('in_use') && (
                <td>
                    <div className="td-boolean flex-vertical">
                        <div className="text-primary">
                            {voucher.in_use ? (
                                <Fragment>
                                    <em className="mdi mdi-check-circle" />
                                    <div className="text-primary">{voucher.first_use_date_locale.split(',')[0]}</div>
                                    <div className="text-strong text-md text-muted-dark">
                                        {voucher.first_use_date_locale.split(',')[1]}
                                    </div>
                                </Fragment>
                            ) : (
                                <Fragment>
                                    <em className="mdi mdi-close" />
                                    {translate('product_vouchers.labels.no')}
                                </Fragment>
                            )}
                        </div>
                    </div>
                </td>
            )}

            {columnKeys.includes('has_payouts') && (
                <td>
                    <div className="td-boolean flex-vertical">
                        <div className="text-primary">
                            {voucher.has_payouts ? (
                                <Fragment>
                                    <em className="mdi mdi-check-circle" />
                                    <div>{translate('vouchers.labels.yes')}</div>
                                </Fragment>
                            ) : (
                                <Fragment>
                                    <em className="mdi mdi-close" />
                                    <div>{translate('vouchers.labels.no')}</div>
                                </Fragment>
                            )}
                        </div>
                    </div>
                </td>
            )}

            {columnKeys.includes('state') && (
                <td>
                    <VouchersTableRowStatus voucher={voucher} />
                </td>
            )}

            <td />
        </StateNavLink>
    );
}
