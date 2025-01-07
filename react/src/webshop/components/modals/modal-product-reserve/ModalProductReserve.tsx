import React, { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import { ModalState } from '../../../../dashboard/modules/modals/context/ModalContext';
import useTranslate from '../../../../dashboard/hooks/useTranslate';
import { useNavigateState } from '../../../modules/state_router/Router';
import { ResponseError } from '../../../../dashboard/props/ApiResponses';
import usePushDanger from '../../../../dashboard/hooks/usePushDanger';
import Product from '../../../props/models/Product';
import Voucher from '../../../../dashboard/props/models/Voucher';
import useFormBuilder from '../../../../dashboard/hooks/useFormBuilder';
import { useProductReservationService } from '../../../services/ProductReservationService';
import useComposeVoucherCardData from '../../../services/helpers/useComposeVoucherCardData';
import { useProductService } from '../../../services/ProductService';
import Fund from '../../../props/models/Fund';
import useAppConfigs from '../../../hooks/useAppConfigs';
import { startOfDay, addDays, getUnixTime, differenceInDays } from 'date-fns';
import useAuthIdentity from '../../../hooks/useAuthIdentity';
import ModalProductReserveProgress from './elements/ModalProductReserveProgress';
import useAssetUrl from '../../../hooks/useAssetUrl';
import BlockVoucherRecords from '../../elements/block-voucher-records/BlockVoucherRecords';
import { currencyFormat, strLimit } from '../../../../dashboard/helpers/string';
import TranslateHtml from '../../../../dashboard/components/elements/translate-html/TranslateHtml';
import FormError from '../../../../dashboard/components/elements/forms/errors/FormError';
import ClickOutside from '../../../../dashboard/components/elements/click-outside/ClickOutside';
import DatePickerControl from '../../../../dashboard/components/elements/forms/controls/DatePickerControl';
import { dateFormat, dateParse } from '../../../../dashboard/helpers/dates';
import Tooltip from '../../elements/tooltip/Tooltip';
import { clickOnKeyEnter } from '../../../../dashboard/helpers/wcag';

type VoucherType = Voucher & {
    amount_extra: number;
};

type Field = {
    fullWidth?: boolean;
    description?: string;
    showInfo?: boolean;
    label?: string;
    placeholder?: string;
    required?: boolean;
    key?: string;
    dusk?: string;
    type?: string;
    custom?: boolean;
};

export default function ModalProductReserve({
    fund,
    modal,
    product,
    vouchers,
}: {
    fund: Fund;
    modal: ModalState;
    product: Product;
    vouchers: Array<Voucher>;
}) {
    const appConfigs = useAppConfigs();
    const authIdentity = useAuthIdentity();

    const assetUrl = useAssetUrl();
    const translate = useTranslate();
    const pushDanger = usePushDanger();
    const navigateState = useNavigateState();

    const productService = useProductService();
    const productReservationService = useProductReservationService();
    const composerVoucherCardData = useComposeVoucherCardData();

    const [STEP_EMAIL_SETUP] = useState(0);
    const [STEP_SELECT_VOUCHER] = useState(1);
    const [STEP_FILL_DATA] = useState(2);
    const [STEP_FILL_ADDRESS] = useState(3);
    const [STEP_FILL_NOTES] = useState(4);
    const [STEP_CONFIRM_DATA] = useState(5);
    const [STEP_EXTRA_PAYMENT] = useState(6);
    const [STEP_RESERVATION_FINISHED] = useState(7);
    const [STEP_ERROR] = useState(8);

    const [submitting, setSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string>();
    const [reservationId, setReservationId] = useState(null);
    const [dateMinLimit] = useState(new Date());

    const provider = useMemo(() => product.organization, [product?.organization]);

    const hasEmail = useMemo(() => {
        return !!authIdentity.email;
    }, [authIdentity?.email]);

    const productMeta = useMemo(() => {
        return productService.checkEligibility(product, vouchers);
    }, [product, productService, vouchers]);

    const fundMeta = useMemo(() => {
        return productMeta.funds?.find((item) => item.id == fund.id)?.meta;
    }, [fund?.id, productMeta?.funds]);

    const extraPaymentAllowed = useMemo(() => {
        return fundMeta?.isReservationExtraPaymentAvailable;
    }, [fundMeta]);

    const vouchersList = useMemo(() => {
        return vouchers
            .map((item) => composerVoucherCardData({ ...item }))
            .map((voucher) => {
                const productPrice = parseFloat(product.price);
                const voucherAmount = parseFloat(voucher.amount);

                return {
                    ...voucher,
                    amount_extra:
                        extraPaymentAllowed && productPrice > voucherAmount ? productPrice - voucherAmount : 0,
                };
            });
    }, [composerVoucherCardData, extraPaymentAllowed, product.price, vouchers]);

    const vouchersNeedExtraPayment = useMemo(() => {
        return vouchersList.filter((item) => item.amount_extra > 0)?.length;
    }, [vouchersList]);

    const [step, setStep] = useState(hasEmail ? STEP_SELECT_VOUCHER : STEP_EMAIL_SETUP);
    const [steps, setSteps] = useState([]);
    const [fields, setFields] = useState<Array<Field>>([]);
    const [emptyText] = useState(translate('modal_product_reserve_notes.confirm_notes.labels.empty'));
    const [voucher, setVoucher] = useState<VoucherType>(null);

    const form = useFormBuilder<{
        first_name?: string;
        last_name?: string;
        postal_code?: string;
        address?: string;
        street?: string;
        house_nr?: string;
        house_nr_addition?: string;
        city?: string;
        user_note?: string;
        custom_fields?: { [key: string]: string };
    }>(
        {
            first_name: '',
            last_name: '',
            postal_code: '',
            address: '',
            street: '',
            house_nr: '',
            house_nr_addition: '',
            city: '',
            custom_fields: {},
        },
        (values) => {
            setSubmitting(true);

            productReservationService
                .reserve({ ...values, voucher_id: voucher.id, product_id: product.id })
                .then((res) => {
                    setSubmitting(false);
                    setReservationId(res.data.id);

                    if (res.data.checkout_url) {
                        return (document.location = res.data.checkout_url);
                    }

                    setStep(STEP_RESERVATION_FINISHED);
                })
                .catch((err: ResponseError) => {
                    pushDanger(err?.data?.message || err?.data?.errors?.product_id?.[0]);
                    form.setErrors(err.data.errors);

                    if (err.status >= 500 || err?.data?.errors?.product_id?.length > 0) {
                        setStep(STEP_ERROR);
                        setErrorMessage(err?.data?.message || err?.data?.errors?.product_id?.[0]);
                    }
                });
        },
    );

    const back = useCallback(() => {
        setStep(steps[steps.indexOf(step) - 1]);
    }, [step, steps]);

    const next = useCallback(() => {
        setStep(steps[steps.indexOf(step) + 1]);
    }, [step, steps]);

    const finish = useCallback(() => {
        modal.close();
        navigateState('reservations');
    }, [modal, navigateState]);

    const onError = useCallback(
        (err: ResponseError, address = false, user_note = false) => {
            const { errors = {}, message } = err.data;

            form.setErrors(errors);
            form.setIsLocked(false);

            if (errors.product_id) {
                errors.product_id?.forEach((error) => pushDanger(error));
                setStep(STEP_ERROR);
                setErrorMessage(err?.data?.errors?.product_id?.[0]);
                return;
            }

            if (!errors.product_id && message) {
                pushDanger(message);
            }

            setStep(address ? STEP_FILL_ADDRESS : user_note ? STEP_FILL_NOTES : STEP_FILL_DATA);
        },
        [STEP_ERROR, STEP_FILL_ADDRESS, STEP_FILL_DATA, STEP_FILL_NOTES, form, pushDanger],
    );

    const validateFields = useCallback(
        (include_note: boolean = true) => {
            productReservationService
                .validateFields({
                    ...form.values,
                    voucher_id: voucher.id,
                    product_id: product.id,
                    user_note: include_note ? form.values.user_note : null,
                })
                .then(() => {
                    form.setErrors({});
                    next();
                })
                .catch((err) =>
                    onError(
                        err,
                        false,
                        include_note && err?.data?.errors?.user_note && Object.values(err?.data?.errors).length == 1,
                    ),
                );
        },
        [form, next, onError, product.id, productReservationService, voucher?.id],
    );

    const validateAddress = useCallback(() => {
        productReservationService
            .validateAddress({
                address: form.values.postal_code ? form.values.address : null,
                street: form.values.street,
                house_nr: form.values.house_nr,
                house_nr_addition: form.values.house_nr_addition,
                city: form.values.city,
                postal_code: form.values.postal_code,
                product_id: product?.id,
            })
            .then(
                () => {
                    form.errors = {};
                    setStep((step) => step + 1);
                },
                (err) => onError(err, true),
            );
    }, [form, onError, product?.id, productReservationService]);

    const confirmSubmit = useCallback(() => {
        form.submit();
    }, [form]);

    const goToReservation = useCallback(() => {
        modal.close();
        navigateState('reservation-show', { id: reservationId });
    }, [modal, navigateState, reservationId]);

    const goToFinishStep = useCallback(() => {
        if (voucher?.amount_extra > 0) {
            setStep(STEP_EXTRA_PAYMENT);
        } else {
            confirmSubmit();
        }
    }, [STEP_EXTRA_PAYMENT, confirmSubmit, voucher?.amount_extra]);

    const makeReservationField = useCallback(
        (key: string, type: string, dusk: string = null) => {
            const required = product.reservation[key] === 'required';

            return {
                label: translate(`modal_product_reserve_notes.fill_notes.labels.${key}${required ? '' : '_optional'}`),
                placeholder: translate(`modal_product_reserve_notes.fill_notes.placeholders.${key}`),
                required,
                key,
                dusk,
                type,
                custom: false,
            };
        },
        [translate, product.reservation],
    );

    const mapFields = useCallback(
        (customFields = []) => {
            setFields((fields) => {
                if (product.reservation.phone !== 'no') {
                    fields.push(makeReservationField('phone', 'text', 'productReserveFormPhone'));
                }

                if (product.reservation.birth_date !== 'no') {
                    fields.push(makeReservationField('birth_date', 'date'));
                }

                const _fields = [...fields, ...customFields];

                if (_fields.length > 0) {
                    _fields[_fields.length - 1].fullWidth = _fields.length % 2 !== 0;
                }

                return [..._fields];
            });
        },
        [makeReservationField, product?.reservation?.birth_date, product?.reservation?.phone],
    );

    const addEmail = useCallback(() => {
        navigateState('identity-emails');
        modal.close();
    }, [modal, navigateState]);

    const selectVoucher = useCallback(
        (voucher: VoucherType) => {
            setVoucher(voucher);

            if (voucher && voucher.amount_extra > 0) {
                setSteps((steps) => [...steps, STEP_EXTRA_PAYMENT]);
            }

            next();
        },
        [STEP_EXTRA_PAYMENT, next, setSteps],
    );

    const updateSteps = useCallback(() => {
        setSteps(
            [
                STEP_EMAIL_SETUP,
                STEP_SELECT_VOUCHER,
                STEP_FILL_DATA,
                product.reservation.address !== 'no' ? STEP_FILL_ADDRESS : null,
                STEP_FILL_NOTES,
                STEP_CONFIRM_DATA,
                voucher && voucher.amount_extra > 0 ? STEP_EXTRA_PAYMENT : null,
            ].filter((step) => step !== null),
        );
    }, [
        STEP_CONFIRM_DATA,
        STEP_EMAIL_SETUP,
        STEP_EXTRA_PAYMENT,
        STEP_FILL_ADDRESS,
        STEP_FILL_DATA,
        STEP_FILL_NOTES,
        STEP_SELECT_VOUCHER,
        product?.reservation?.address,
        voucher,
    ]);

    const transValues = useMemo(() => {
        const reservationExpireDate = getUnixTime(addDays(startOfDay(new Date()), 14));
        const closestDate = Math.min(reservationExpireDate, fundMeta.shownExpireDate.unix);
        const daysToCancel = differenceInDays(closestDate * 1000, startOfDay(new Date()));

        return {
            days_to_cancel: daysToCancel,
            product_name: product.name,
            product_price: product.price,
            provider_name: product.organization.name,
            fund_name: vouchers[0].fund.name,
            fund: vouchers[0].fund.name,
        };
    }, [fundMeta?.shownExpireDate?.unix, product.name, product.organization.name, product.price, vouchers]);

    useEffect(() => {
        updateSteps();
    }, [updateSteps]);

    useEffect(() => {
        mapFields(
            product.reservation.fields?.map((field) => ({
                label: field.label,
                placeholder: field.label,
                description: field.description,
                custom: true,
                required: field.required,
                key: field.id,
                dusk: `customField${field.id}`,
                type: field.type,
            })) || [],
        );
    }, [mapFields, product?.reservation?.fields]);

    return (
        <div
            className={`modal modal-product-reserve modal-animated  ${modal.loading ? '' : 'modal-loaded'}`}
            data-dusk={'modalProductReserve'}
            role="dialog">
            <div className="modal-backdrop" onClick={modal.close} aria-label="Sluiten" role="button" />

            {step == STEP_EMAIL_SETUP && (
                <div className="modal-window">
                    <div
                        className="modal-close mdi mdi-close"
                        tabIndex={0}
                        onKeyDown={clickOnKeyEnter}
                        onClick={modal.close}
                        aria-label="Sluiten"
                        role="button"
                    />
                    <div className="modal-header">
                        <h2 className="modal-header-title">E-mailadres toevoegen</h2>
                    </div>
                    <div className="modal-body">
                        <div className="modal-section">
                            <div className="modal-section-icon modal-section-icon-primary">
                                <div className="mdi mdi-email-outline" />
                            </div>
                            <h2 className="modal-section-title">E-mailadres toevoegen</h2>
                            <div className="modal-section-description">
                                Voeg uw e-mailadres toe om berichten te kunnen ontvangen.
                            </div>
                            <div className="modal-section-space" />
                            <div className="modal-section-space" />
                            <div className="flex flex-grow flex-center">
                                <button className="button button-primary button-sm" onClick={addEmail} role="link">
                                    <em className="mdi mdi-open-in-new icon-start" />
                                    Toevoegen
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="modal-footer flex-gap-lg">
                        <div className="flex flex-grow">
                            <button className="button button-light button-sm" type="button" onClick={modal.close}>
                                Annuleren
                            </button>
                        </div>
                        <div className="flex">
                            <button
                                className="button button-light button-sm"
                                data-dusk="reserveSkipEmailStep"
                                type="button"
                                onClick={() => setStep(STEP_SELECT_VOUCHER)}>
                                Overslaan
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {step == STEP_SELECT_VOUCHER && (
                <div className="modal-window">
                    <div
                        className="modal-close mdi mdi-close"
                        onClick={() => modal.close()}
                        tabIndex={0}
                        onKeyDown={clickOnKeyEnter}
                        aria-label="Sluiten"
                        role="button"
                    />
                    <div className="modal-header">
                        <h2 className="modal-header-title">{translate('modal_product_reserve.header.title')}</h2>
                    </div>
                    <div className="modal-body">
                        <div className="modal-section">
                            <h2 className="modal-section-title">Kies het tegoed om mee te betalen</h2>
                            <TranslateHtml
                                className="modal-section-description"
                                i18n={`modal_product_reserve.description_${appConfigs?.communication_type}`}
                                values={transValues}
                            />

                            {transValues.days_to_cancel > 0 && (
                                <TranslateHtml
                                    className="modal-section-description"
                                    i18n={`modal_product_reserve.description_${appConfigs?.communication_type}_time`}
                                    values={transValues}
                                />
                            )}

                            <ModalProductReserveProgress
                                step={step}
                                steps={steps}
                                finalStep={STEP_RESERVATION_FINISHED}
                            />
                        </div>

                        <div className="modal-section">
                            <div
                                className={`block block-vouchers block-vouchers-padding ${
                                    vouchersList.length === 1 ? 'block-vouchers-compact' : ''
                                }`}>
                                {vouchersList?.map((voucher) => (
                                    <div
                                        key={voucher.id}
                                        className="voucher-item voucher-item-compact voucher-item-static">
                                        <div className="voucher-image">
                                            <img
                                                src={
                                                    voucher?.fund?.logo?.sizes?.thumbnail ||
                                                    voucher?.fund?.organization?.logo?.sizes?.thumbnail ||
                                                    assetUrl('/assets/img/placeholders/fund-thumbnail.png')
                                                }
                                                alt="voucher image"
                                            />
                                        </div>
                                        <div className="voucher-details">
                                            <div className="voucher-base-information">
                                                <div className="voucher-information flex-grow">
                                                    <h3 className="voucher-name">{voucher.fund.name}</h3>
                                                    <div className="voucher-organization">
                                                        {voucher?.records_title && (
                                                            <span>{voucher?.records_title}</span>
                                                        )}
                                                        {voucher?.records_title && <span className="text-separator" />}
                                                        <span>{voucher?.fund?.organization?.name}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {voucher.records?.length > 0 && (
                                                <div className="voucher-records hidden-xs hidden-sm">
                                                    <BlockVoucherRecords
                                                        voucher={voucher}
                                                        compact={true}
                                                        toggle={true}
                                                    />
                                                </div>
                                            )}

                                            <div className="voucher-amounts">
                                                {voucher.fund.type === 'budget' && (
                                                    <div className="voucher-amount">
                                                        <div className="voucher-value">{voucher?.amount_locale}</div>
                                                        <div className="voucher-value-date">
                                                            {voucher?.expire_at_locale}
                                                        </div>
                                                    </div>
                                                )}

                                                {extraPaymentAllowed && voucher.amount_extra > 0 && (
                                                    <div className="voucher-extra-payment">
                                                        <div className="voucher-extra-payment-value">
                                                            {currencyFormat(voucher.amount_extra)}
                                                        </div>
                                                        <div className="voucher-extra-payment-description">
                                                            Bijbetalen
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {vouchersList.length > 1 && (
                                            <div className="voucher-overview">
                                                <button
                                                    className="button button-primary button-sm"
                                                    onClick={() => selectVoucher(voucher)}>
                                                    Kies
                                                </button>
                                            </div>
                                        )}

                                        {voucher.records?.length > 0 && (
                                            <div className="voucher-records hidden-md hidden-lg">
                                                <BlockVoucherRecords voucher={voucher} compact={true} toggle={true} />
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {vouchersNeedExtraPayment > 0 && (
                                <div className="block block-warning">
                                    <div className="block-warning-icon">
                                        <div className="icon">
                                            <em className="mdi mdi-information-outline" />
                                        </div>
                                    </div>

                                    {vouchersNeedExtraPayment > 1 && (
                                        <div className="block-warning-content">
                                            Sommige van uw tegoeden hebben niet voldoende saldo. Door een van deze
                                            vouchers te gebruiken, moet u het ontbrekende bedrag aan het einde van de
                                            reservering bijbetalen.
                                        </div>
                                    )}

                                    {vouchersNeedExtraPayment === 1 && (
                                        <div className="block-warning-content">
                                            Er is onvoldoende saldo op uw tegoed, u moet het ontbrekende bedrag aan het
                                            einde van de reservering bijbetalen via een van de beschikbare
                                            betaalmethoden.
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="modal-footer flex-gap-lg">
                        <div className={`flex flex-grow ${vouchers.length > 1 ? 'flex-center' : ''}`}>
                            <button className="button button-light button-sm" onClick={modal.close}>
                                {translate('modal.buttons.cancel')}
                            </button>
                        </div>

                        {vouchers?.length === 1 && (
                            <div className="flex">
                                <div className="button-group">
                                    {!hasEmail && (
                                        <button className="button button-light button-sm" type="button" onClick={back}>
                                            Terug
                                        </button>
                                    )}
                                    <button
                                        className="button button-primary button-sm"
                                        data-dusk="btnSelectVoucher"
                                        onClick={() => selectVoucher(vouchersList[0])}>
                                        Bevestigen
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {step == STEP_FILL_DATA && (
                <form
                    className="modal-window form form-compact"
                    onSubmit={(e) => {
                        e?.preventDefault();
                        validateFields(false);
                    }}
                    data-dusk="productReserveForm">
                    <div
                        className="modal-close mdi mdi-close"
                        onClick={modal.close}
                        onKeyDown={clickOnKeyEnter}
                        tabIndex={0}
                        id="close"
                        aria-label="Sluiten"
                        role="button"
                    />
                    <div className="modal-header">
                        <h2 className="modal-header-title">{translate('modal_product_reserve.header.title')}</h2>
                    </div>
                    <div className="modal-body">
                        <div className="modal-section">
                            <h2 className="modal-section-title">
                                {translate('modal_product_reserve_notes.fill_notes.header.title')}
                            </h2>
                            <TranslateHtml
                                className="modal-section-description"
                                i18n="modal_product_reserve_notes.fill_notes.header.subtitle"
                                values={{ provider_name: provider.name }}
                            />
                            <ModalProductReserveProgress
                                step={step}
                                steps={steps}
                                finalStep={STEP_RESERVATION_FINISHED}
                            />
                        </div>

                        <div className="modal-section">
                            <div className="row">
                                <div className="col col-lg-6 col-xs-12 form-group form-group-margin">
                                    <label className="form-label" htmlFor="reservation_modal_first_name">
                                        {translate('modal_product_reserve_notes.fill_notes.labels.first_name')}
                                    </label>
                                    <input
                                        className="form-control"
                                        id="reservation_modal_first_name"
                                        type="text"
                                        value={form.values.first_name ?? ''}
                                        onChange={(e) => form.update({ first_name: e.target.value })}
                                        data-dusk="productReserveFormFirstName"
                                    />
                                    <FormError error={form.errors.first_name} />
                                </div>
                                <div className="col col-lg-6 col-xs-12 form-group form-group-margin">
                                    <label className="form-label" htmlFor="reservation_modal_last_name">
                                        {translate('modal_product_reserve_notes.fill_notes.labels.last_name')}
                                    </label>
                                    <input
                                        className="form-control"
                                        id="reservation_modal_last_name"
                                        type="text"
                                        value={form.values.last_name ?? ''}
                                        onChange={(e) => form.update({ last_name: e.target.value })}
                                        data-dusk="productReserveFormLastName"
                                    />
                                    <FormError error={form.errors.last_name} />
                                </div>
                                <FormError error={form.errors.notes} />
                            </div>

                            <div className="row">
                                {fields?.map((field, index) => (
                                    <div
                                        key={index}
                                        className={`col col-xs-12 form-group form-group-margin ${
                                            'col-lg-' + (field.fullWidth ? '12' : '6')
                                        }`}>
                                        <label className="form-label" htmlFor={field.key}>
                                            {field.label}
                                        </label>

                                        {field.custom && (
                                            <div className={`form-group-info ${field.showInfo ? 'active' : ''}`}>
                                                <div
                                                    className={`form-group-info-control ${
                                                        field.description ? 'has-info-btn' : ''
                                                    }`}>
                                                    {field.type === 'text' && (
                                                        <input
                                                            className="form-control"
                                                            type="test"
                                                            value={form.values.custom_fields?.[field.key] ?? ''}
                                                            onChange={(e) => {
                                                                form.values.custom_fields =
                                                                    form.values.custom_fields || {};
                                                                form.values.custom_fields[field.key] = e.target.value;
                                                                form.update({ ...form.values });
                                                            }}
                                                            data-dusk={field.dusk}
                                                        />
                                                    )}
                                                    {field.type === 'number' && (
                                                        <input
                                                            className="form-control"
                                                            type="number"
                                                            pattern="[0-9]+"
                                                            max={999999999999999}
                                                            value={form.values.custom_fields?.[field.key] ?? ''}
                                                            onChange={(e) => {
                                                                form.values.custom_fields =
                                                                    form.values.custom_fields || {};
                                                                form.values.custom_fields[field.key] = e.target.value;
                                                                form.update({ ...form.values });
                                                            }}
                                                            data-dusk={field.dusk}
                                                        />
                                                    )}
                                                </div>

                                                {field.description && (
                                                    <Fragment>
                                                        <div
                                                            className="form-group-info-button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setFields((fields) => {
                                                                    fields[fields.indexOf(field)].showInfo =
                                                                        !field.showInfo;
                                                                    return [...fields];
                                                                });
                                                            }}>
                                                            <em className="mdi mdi-information" />
                                                        </div>
                                                        {field.showInfo && (
                                                            <ClickOutside
                                                                className="block block-info-box block-info-box-primary"
                                                                onClickOutside={(e) => {
                                                                    e?.stopPropagation();
                                                                    setFields((fields) => {
                                                                        fields[fields.indexOf(field)].showInfo = false;
                                                                        return [...fields];
                                                                    });
                                                                }}>
                                                                <div className="info-box-icon mdi mdi-information-outline" />
                                                                <div className="info-box-content">
                                                                    <div className="block block-markdown">
                                                                        <p>{field.description}</p>
                                                                    </div>
                                                                </div>
                                                            </ClickOutside>
                                                        )}
                                                    </Fragment>
                                                )}
                                            </div>
                                        )}

                                        {!field.custom && ['text', 'number'].includes(field.type) && (
                                            <input
                                                className="form-control"
                                                id={field.key}
                                                type={field.type}
                                                value={form.values[field.key] ?? ''}
                                                onChange={(e) => {
                                                    form.update({ [field.key]: e.target.value });
                                                }}
                                                data-dusk={field.dusk}
                                            />
                                        )}

                                        {!field.custom && field.type === 'date' && (
                                            <DatePickerControl
                                                value={dateParse(form.values[field.key])}
                                                dateMax={dateMinLimit}
                                                dateFormat={'dd-MM-yyyy'}
                                                onChange={(date: Date) => {
                                                    form.update({ [field.key]: dateFormat(date) });
                                                }}
                                            />
                                        )}

                                        {field.custom ? (
                                            <FormError error={form.errors[`custom_fields.${field.key}`]} />
                                        ) : (
                                            <FormError error={form.errors[`${field.key}`]} />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="modal-footer">
                        <div className="flex hide-sm">
                            <button className="button button-light button-sm" type="button" onClick={modal.close}>
                                Annuleren
                            </button>
                        </div>

                        <div className="flex flex-grow flex-end">
                            <button className="button button-light button-sm" type="button" onClick={back}>
                                Terug
                            </button>
                            <button className="button button-primary button-sm" type="submit" data-dusk="btnSubmit">
                                {translate('popup_auth.buttons.submit')}
                            </button>
                        </div>
                    </div>
                </form>
            )}

            {step == STEP_FILL_ADDRESS && (
                <form
                    className="modal-window form form-compact"
                    onSubmit={(e) => {
                        e?.preventDefault();
                        validateAddress();
                    }}
                    data-dusk="productReserveAddress">
                    <div
                        className="modal-close mdi mdi-close"
                        tabIndex={0}
                        onClick={modal.close}
                        onKeyDown={clickOnKeyEnter}
                        id="close"
                        aria-label="Sluiten"
                        role="button"
                    />
                    <div className="modal-header">
                        <h2 className="modal-header-title">{translate('modal_product_reserve.header.title')}</h2>
                    </div>
                    <div className="modal-body">
                        <div className="modal-section">
                            <h2 className="modal-section-title">
                                {translate('modal_product_reserve_notes.fill_notes.header.title')}
                            </h2>
                            <TranslateHtml
                                className="modal-section-description"
                                i18n="modal_product_reserve_notes.fill_notes.header.subtitle"
                                values={{ provider_name: provider.name }}
                            />
                            <ModalProductReserveProgress
                                step={step}
                                steps={steps}
                                finalStep={STEP_RESERVATION_FINISHED}
                            />
                        </div>
                        <div className="modal-section">
                            <div className="row">
                                <div className="col col-lg-6 col-xs-12 form-group form-group-margin">
                                    <label className="form-label" htmlFor="reservation_modal_street">
                                        {translate('modal_product_reserve_notes.fill_notes.labels.street')}
                                    </label>
                                    <input
                                        className="form-control"
                                        id="reservation_modal_street"
                                        type="text"
                                        value={form.values.street}
                                        onChange={(e) => form.update({ street: e.target.value })}
                                        data-dusk="productReserveFormStreet"
                                    />
                                    <FormError error={form.errors.street} />
                                </div>
                                <div className="col col-lg-3 col-xs-12 form-group form-group-margin">
                                    <label className="form-label" htmlFor="reservation_modal_house_nr">
                                        {translate('modal_product_reserve_notes.fill_notes.labels.house_nr')}
                                    </label>
                                    <input
                                        className="form-control"
                                        id="reservation_modal_house_nr"
                                        type="text"
                                        value={form.values.house_nr}
                                        onChange={(e) => form.update({ house_nr: e.target.value })}
                                        data-dusk="productReserveFormHouseNumber"
                                    />
                                    <FormError error={form.errors.house_nr} />
                                </div>
                                <div className="col col-lg-3 col-xs-12 form-group form-group-margin">
                                    <label className="form-label" htmlFor="reservation_modal_house_nr_addition">
                                        {translate('modal_product_reserve_notes.fill_notes.labels.house_nr_addition')}
                                    </label>
                                    <input
                                        className="form-control"
                                        id="reservation_modal_house_nr_addition"
                                        type="text"
                                        value={form.values.house_nr_addition}
                                        onChange={(e) => form.update({ house_nr_addition: e.target.value })}
                                        data-dusk="productReserveFormHouseNumberAddition"
                                    />
                                    <FormError error={form.errors.house_nr_addition} />
                                </div>
                            </div>

                            <div className="row">
                                <div className="col col-lg-6 col-xs-12 form-group form-group-margin">
                                    <label className="form-label" htmlFor="reservation_modal_postal_code">
                                        {translate('modal_product_reserve_notes.fill_notes.labels.postal_code')}
                                    </label>
                                    <input
                                        className="form-control"
                                        id="reservation_modal_postal_code"
                                        type="text"
                                        value={form.values.postal_code}
                                        onChange={(e) => form.update({ postal_code: e.target.value })}
                                        data-dusk="productReserveFormPostalCode"
                                    />
                                    <FormError error={form.errors.postal_code} />
                                </div>
                                <div className="col col-lg-6 col-xs-12 form-group form-group-margin">
                                    <label className="form-label" htmlFor="reservation_modal_city">
                                        {translate('modal_product_reserve_notes.fill_notes.labels.city')}
                                    </label>
                                    <input
                                        className="form-control"
                                        id="reservation_modal_city"
                                        type="text"
                                        value={form.values.city}
                                        onChange={(e) => form.update({ city: e.target.value })}
                                        data-dusk="productReserveFormCity"
                                    />
                                    <FormError error={form.errors.city} />
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="modal-footer">
                        <div className="flex hide-sm">
                            <button className="button button-light button-sm" type="button" onClick={modal.close}>
                                Annuleren
                            </button>
                        </div>
                        <div className="flex flex-grow flex-end">
                            <button className="button button-light button-sm" type="button" onClick={back}>
                                Terug
                            </button>
                            <button className="button button-primary button-sm" type="submit" data-dusk="btnSubmit">
                                {translate('popup_auth.buttons.submit')}
                            </button>
                        </div>
                    </div>
                </form>
            )}

            {step == STEP_FILL_NOTES && (
                <form
                    className="modal-window form"
                    onSubmit={(e) => {
                        e?.preventDefault();
                        validateFields();
                    }}
                    data-dusk="productReserveNotes">
                    <div
                        className="modal-close mdi mdi-close"
                        onClick={modal.close}
                        onKeyDown={clickOnKeyEnter}
                        tabIndex={0}
                        id="close"
                        aria-label="Sluiten"
                        role="button"
                    />
                    <div className="modal-header">
                        <h2 className="modal-header-title">{translate('modal_product_reserve.header.title')}</h2>
                    </div>
                    <div className="modal-body">
                        <div className="modal-section">
                            <h2 className="modal-section-title">
                                {translate('modal_product_reserve_notes.fill_notes.header.title')}
                            </h2>
                            <TranslateHtml
                                className="modal-section-description"
                                i18n={'modal_product_reserve_notes.fill_notes.header.subtitle'}
                                values={{ provider_name: provider.name }}
                            />
                            <ModalProductReserveProgress
                                step={step}
                                steps={steps}
                                finalStep={STEP_RESERVATION_FINISHED}
                            />
                        </div>
                        <div className="modal-section">
                            <div className="form-group">
                                <label className="form-label" htmlFor="reservation_modal_user_note">
                                    {translate('modal_product_reserve_notes.fill_notes.labels.notes')}
                                </label>
                                <textarea
                                    className="form-control"
                                    id="reservation_modal_user_note"
                                    value={form.values.user_note ?? ''}
                                    onChange={(e) => form.update({ user_note: e.target.value })}
                                    data-dusk="productReserveFormNote"
                                />
                                <div className="form-hint">Max. 400 tekens</div>
                                <FormError error={form.errors.user_note} />
                            </div>
                        </div>
                    </div>
                    <div className="modal-footer">
                        <div className="flex hide-sm">
                            <button className="button button-light button-sm" type="button" onClick={modal.close}>
                                Annuleren
                            </button>
                        </div>
                        <div className="flex flex-grow flex-end">
                            <button className="button button-light button-sm" type="button" onClick={back}>
                                Terug
                            </button>
                            <button className="button button-primary button-sm" type="submit" data-dusk="btnSubmit">
                                {translate('popup_auth.buttons.submit')}
                            </button>
                        </div>
                    </div>
                </form>
            )}

            {step == STEP_CONFIRM_DATA && (
                <div className="modal-window">
                    <div
                        className="modal-close mdi mdi-close"
                        tabIndex={0}
                        onClick={modal.close}
                        onKeyDown={clickOnKeyEnter}
                        aria-label="Sluiten"
                        role="button"
                    />
                    <div className="modal-header">
                        <h2 className="modal-header-title">{translate('modal_product_reserve.header.title')}</h2>
                    </div>
                    <div className="modal-body" data-dusk="productReserveConfirmDetails">
                        <div className="modal-section">
                            <h2 className="modal-section-title">
                                {translate('modal_product_reserve_notes.confirm_notes.header.title')}
                            </h2>
                            <TranslateHtml
                                className="modal-section-description"
                                i18n="modal_product_reserve_notes.confirm_notes.modal_section.title"
                            />
                            <ModalProductReserveProgress
                                step={step}
                                steps={steps}
                                finalStep={STEP_RESERVATION_FINISHED}
                            />
                        </div>
                        <div className="modal-section reservation-overview">
                            <div className="overview-list">
                                <div className="overview-item">
                                    <div className="overview-item-label">
                                        {translate('modal_product_reserve_notes.confirm_notes.labels.first_name')}
                                    </div>
                                    <div className="overview-item-value">{form.values.first_name || '-'}</div>
                                </div>
                                <div className="overview-item">
                                    <div className="overview-item-label">
                                        {translate('modal_product_reserve_notes.confirm_notes.labels.last_name')}
                                    </div>
                                    <div className="overview-item-value">{form.values.last_name || '-'}</div>
                                </div>

                                {fields?.map((field) => (
                                    <div key={field.key} className="overview-item">
                                        {!field.custom ? (
                                            <Fragment>
                                                <div className="overview-item-label">
                                                    {translate(
                                                        `modal_product_reserve_notes.confirm_notes.labels.${field.key}`,
                                                    )}
                                                </div>
                                                <div
                                                    className={`overview-item-value ${
                                                        !form.values[field.key] ? 'overview-item-value-empty' : ''
                                                    }`}>
                                                    {field.type === 'date'
                                                        ? dateFormat(dateParse(form.values[field.key]), 'dd-MM-yyyy')
                                                        : form.values[field.key] || emptyText}
                                                </div>
                                            </Fragment>
                                        ) : (
                                            <Fragment>
                                                <div className="overview-item-label">{field.label}</div>
                                                <div
                                                    className={`overview-item-value ${
                                                        !form.values.custom_fields[field.key]
                                                            ? 'overview-item-value-empty'
                                                            : ''
                                                    }`}>
                                                    {form.values.custom_fields[field.key] || emptyText}
                                                </div>
                                            </Fragment>
                                        )}
                                    </div>
                                ))}

                                {product?.reservation?.address !== 'no' && (
                                    <div className="overview-item">
                                        <div className="overview-item-label">
                                            {translate('modal_product_reserve_notes.confirm_notes.labels.street')}
                                        </div>
                                        <div
                                            className={`overview-item-value ${
                                                !form.values.street ? 'overview-item-value-empty' : ''
                                            }`}>
                                            {form.values.street || emptyText}
                                        </div>
                                    </div>
                                )}

                                {product.reservation.address !== 'no' && (
                                    <div className="overview-item">
                                        <div className="overview-item-label">
                                            {translate('modal_product_reserve_notes.confirm_notes.labels.house_nr')}
                                        </div>
                                        <div
                                            className={`overview-item-value ${
                                                !form.values.house_nr ? 'overview-item-value-empty' : ''
                                            }`}>
                                            {form.values.house_nr || emptyText}
                                        </div>
                                    </div>
                                )}

                                {product.reservation.address !== 'no' && (
                                    <div className="overview-item">
                                        <div className="overview-item-label">
                                            {translate(
                                                'modal_product_reserve_notes.confirm_notes.labels.house_nr_addition',
                                            )}
                                        </div>
                                        <div
                                            className={`overview-item-value ${
                                                !form.values.house_nr_addition ? 'overview-item-value-empty' : ''
                                            }`}>
                                            {form.values.house_nr_addition || emptyText}
                                        </div>
                                    </div>
                                )}

                                {product.reservation.address !== 'no' && (
                                    <div className="overview-item">
                                        <div className="overview-item-label">
                                            {translate('modal_product_reserve_notes.confirm_notes.labels.postal_code')}
                                        </div>
                                        <div
                                            className={`overview-item-value ${
                                                !form.values.postal_code ? 'overview-item-value-empty' : ''
                                            }`}>
                                            {form.values.postal_code || emptyText}
                                        </div>
                                    </div>
                                )}

                                {product.reservation.address !== 'no' && (
                                    <div className="overview-item">
                                        <div className="overview-item-label">
                                            {translate('modal_product_reserve_notes.confirm_notes.labels.city')}
                                        </div>
                                        <div
                                            className={`overview-item-value ${
                                                !form.values.city ? 'overview-item-value-empty' : ''
                                            }`}>
                                            {translate(form.values.city || emptyText)}
                                        </div>
                                    </div>
                                )}

                                {form.values.user_note && (
                                    <div className="overview-item overview-item-full">
                                        <div className="overview-item-label">
                                            {translate('modal_product_reserve_notes.confirm_notes.labels.notes')}
                                        </div>
                                        <div className="overview-item-value">{form.values.user_note || emptyText}</div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="modal-footer">
                        <div className="flex hide-sm">
                            <button className="button button-light button-sm" type="button" onClick={modal.close}>
                                Annuleren
                            </button>
                        </div>
                        <div className="flex flex-grow flex-end">
                            <button className="button button-light button-sm" type="button" onClick={back}>
                                Terug
                            </button>
                            <button
                                className="button button-primary button-sm"
                                type="button"
                                onClick={goToFinishStep}
                                data-dusk="btnConfirmSubmit">
                                {translate('modal_product_reserve_notes.confirm_notes.buttons.submit')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {step == STEP_RESERVATION_FINISHED && (
                <div className="modal-window" data-dusk="productReserveSuccess">
                    <div
                        className="modal-close mdi mdi-close"
                        tabIndex={0}
                        onClick={modal.close}
                        onKeyDown={clickOnKeyEnter}
                        aria-label="Sluiten"
                        role="button"
                    />
                    <div className="modal-header">
                        <h2 className="modal-header-title">{translate('modal_product_reserve.header.title')}</h2>
                    </div>
                    <div className="modal-body">
                        <div className="modal-section text-center">
                            <div className="modal-section-icon modal-section-icon-success">
                                <div className="mdi mdi-check-circle-outline" />
                            </div>
                            <h2 className="modal-section-title">Het is gelukt!</h2>
                            <div className="modal-section-description">Uw reservering is gemaakt.</div>
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button
                            className="button button-sm button-light"
                            onClick={finish}
                            role="button"
                            data-dusk="btnReservationFinish">
                            Sluiten
                        </button>
                    </div>
                </div>
            )}

            {step == STEP_ERROR && (
                <div className="modal-window" data-dusk="productReserveDanger">
                    <div className="modal-header">
                        <h2 className="modal-header-title">{translate('modal_product_reserve.header.title')}</h2>
                    </div>
                    <div className="modal-body">
                        <div className="modal-section text-center">
                            <div className="modal-section-icon modal-section-icon-danger">
                                <div className="mdi mdi-check-circle-outline" />
                            </div>
                            <h2 className="modal-section-title">Fout!</h2>
                            <div className="modal-section-description">
                                {errorMessage || 'Kon de reservering niet voltooien. Probeer het later opnieuw.'}
                            </div>
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button
                            className="button button-sm button-light"
                            onClick={modal.close}
                            role="button"
                            data-dusk="btnReservationFinish">
                            Sluiten
                        </button>
                    </div>
                </div>
            )}

            {step == STEP_EXTRA_PAYMENT && (
                <div className="modal-window form" data-dusk="productReserveExtraPayment">
                    <div
                        className="modal-close mdi mdi-close"
                        tabIndex={0}
                        onKeyDown={clickOnKeyEnter}
                        onClick={modal.close}
                        id="close"
                        aria-label="Sluiten"
                        role="button"
                    />
                    <div className="modal-header">
                        <h2 className="modal-header-title">
                            {translate('modal_product_reserve_extra_payment.header.title')}
                        </h2>
                    </div>
                    <div className="modal-body">
                        <div className="modal-section">
                            <TranslateHtml
                                className="modal-section-description"
                                i18n="modal_product_reserve_extra_payment.header.subtitle"
                            />
                            <ModalProductReserveProgress
                                step={step}
                                steps={steps}
                                finalStep={STEP_RESERVATION_FINISHED}
                            />
                        </div>
                        <div className="modal-section">
                            <div className="block block-vouchers block-vouchers-sm">
                                <div className="voucher-item voucher-item-compact voucher-item-static">
                                    <div className="voucher-image">
                                        <img
                                            src={
                                                voucher?.fund?.logo?.sizes?.thumbnail ||
                                                voucher?.fund?.organization?.logo?.sizes?.thumbnail ||
                                                assetUrl('/assets/img/placeholders/fund-thumbnail.png')
                                            }
                                            alt="voucher image"
                                        />
                                    </div>
                                    <div className="voucher-details">
                                        <div className="voucher-base-information">
                                            <div className="voucher-information flex-grow">
                                                <h3 className="voucher-name">{voucher.fund.name}</h3>
                                                <div className="voucher-organization">
                                                    {voucher.records_title && (
                                                        <span>{strLimit(voucher.records_title, 50)}</span>
                                                    )}

                                                    {voucher.records_title?.length > 30 && <br className="show-sm" />}
                                                    {voucher.records_title && <span className="text-separator" />}

                                                    <span>{strLimit(voucher.fund.organization.name, 20)}</span>

                                                    {voucher.fund.organization.name.length > 20 && (
                                                        <Tooltip text={voucher.fund.organization.name} />
                                                    )}
                                                </div>
                                            </div>
                                            <div className="voucher-amounts">
                                                <div className="voucher-value">{voucher.amount_locale}</div>
                                                <div className="voucher-value-date">{voucher.expire_at_locale}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="payment-details">
                                <div className="payment-amount">
                                    <div className="payment-key">De kosten voor het aanbod</div>
                                    <div className="payment-value">{product.price_locale}</div>
                                </div>
                                <div className="payment-amount">
                                    <div className="payment-key">Resterend op het tegoed</div>
                                    <div className="payment-value">{voucher.amount_locale}</div>
                                </div>
                                <div className="divider" />
                                <div className="payment-amount">
                                    <div className="payment-key">Zelf bijbetalen</div>
                                    <div className="payment-value bold">{currencyFormat(voucher.amount_extra)}</div>
                                </div>
                            </div>
                            <div className="block block-warning">
                                <div className="block-warning-icon">
                                    <em className="mdi mdi-information-outline" />
                                </div>
                                <div className="block-warning-content">De link leidt naar een externe website.</div>
                            </div>
                        </div>
                    </div>
                    <div className="modal-footer">
                        <div className="flex hide-sm">
                            <button className="button button-light button-sm" type="button" onClick={modal.close}>
                                Annuleren
                            </button>
                        </div>
                        <div className="flex flex-grow flex-end">
                            <button
                                className="button button-light button-sm"
                                type="button"
                                disabled={submitting}
                                onClick={back}>
                                Terug
                            </button>

                            {reservationId ? (
                                <button
                                    className="button button-primary button-sm"
                                    type="button"
                                    disabled={submitting}
                                    onClick={goToReservation}>
                                    {translate('modal_product_reserve_notes.confirm_notes.buttons.go_to_reservation')}
                                </button>
                            ) : (
                                <button
                                    className="button button-primary button-sm"
                                    type="button"
                                    disabled={submitting}
                                    onClick={confirmSubmit}
                                    data-dusk="btnConfirmSubmit">
                                    {submitting && <div className="mdi mdi-loading mdi-spin icon-start" />}
                                    {submitting
                                        ? translate('modal_product_reserve_notes.confirm_notes.buttons.processing')
                                        : translate('modal_product_reserve_notes.confirm_notes.buttons.submit')}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
