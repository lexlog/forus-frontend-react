import React, { FormEvent, Fragment, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import PhotoSelector from '../../../elements/photo-selector/PhotoSelector';
import useFormBuilder from '../../../../hooks/useFormBuilder';
import FormError from '../../../elements/forms/errors/FormError';
import { useNavigateState } from '../../../../modules/state_router/Router';
import { useMediaService } from '../../../../services/MediaService';
import LoadingCard from '../../../elements/loading-card/LoadingCard';
import usePushDanger from '../../../../hooks/usePushDanger';
import usePushSuccess from '../../../../hooks/usePushSuccess';
import useSetProgress from '../../../../hooks/useSetProgress';
import Organization from '../../../../props/models/Organization';
import StateNavLink from '../../../../modules/state_router/StateNavLink';
import MarkdownEditor from '../../../elements/forms/markdown-editor/MarkdownEditor';
import Tooltip from '../../../elements/tooltip/Tooltip';
import Product from '../../../../props/models/Product';
import useProductService from '../../../../services/ProductService';
import DatePickerControl from '../../../elements/forms/controls/DatePickerControl';
import SelectControl from '../../../elements/select-control/SelectControl';
import SelectControlOptions from '../../../elements/select-control/templates/SelectControlOptions';
import ProductCategoriesControl from './ProductCategoriesControl';
import FundProvider from '../../../../props/models/FundProvider';
import { useFundService } from '../../../../services/FundService';
import useOpenModal from '../../../../hooks/useOpenModal';
import ModalNotification from '../../../modals/ModalNotification';
import useAppConfigs from '../../../../hooks/useAppConfigs';
import { useOrganizationService } from '../../../../services/OrganizationService';
import { ApiResponseSingle, ResponseError } from '../../../../props/ApiResponses';
import CheckboxControl from '../../../elements/forms/controls/CheckboxControl';
import { dateFormat, dateParse } from '../../../../helpers/dates';

export default function ProductsForm({
    organization,
    fund_provider,
    source_id,
    id,
}: {
    organization: Organization;
    fund_provider?: FundProvider;
    source_id?: number;
    id?: number;
}) {
    const { t } = useTranslation();

    const pushDanger = usePushDanger();
    const pushSuccess = usePushSuccess();
    const setProgress = useSetProgress();

    const [alreadyConfirmed, setAlreadyConfirmed] = useState<boolean>(false);
    const [mediaFile, setMediaFile] = useState<Blob>(null);

    const mediaService = useMediaService();
    const fundService = useFundService();
    const productService = useProductService();
    const organizationService = useOrganizationService();

    const navigateState = useNavigateState();
    const openModal = useOpenModal();
    const appConfigs = useAppConfigs();

    const [reservationPolicies] = useState<
        Array<{
            value: 'global' | 'accept' | 'review';
            label: string;
        }>
    >([
        // Use global settings
        { value: 'global', label: 'Gebruik standaard instelling' },
        // Auto accept
        { value: 'accept', label: 'Automatisch accepteren' },
        // Review all reservations
        { value: 'review', label: 'Handmatig controleren' },
    ]);

    const [reservationFieldOptions] = useState<
        Array<{
            value: 'global' | 'no' | 'optional' | 'required';
            label: string;
        }>
    >([
        { value: 'global', label: 'Gebruik standaard instelling' },
        { value: 'no', label: 'Nee' },
        { value: 'optional', label: 'Optioneel' },
        { value: 'required', label: 'Verplicht' },
    ]);

    const [extraPaymentsOptions] = useState<
        Array<{
            value: 'global' | 'no' | 'yes';
            label: string;
        }>
    >([
        { value: 'global', label: 'Gebruik standaard instelling' },
        { value: 'no', label: 'Nee' },
        { value: 'yes', label: 'Ja' },
    ]);

    const [priceTypes] = useState<
        Array<{
            value: 'regular' | 'discount_fixed' | 'discount_percentage' | 'free';
            label: string;
        }>
    >([
        { value: 'regular', label: 'Normaal' },
        { value: 'discount_fixed', label: 'Korting €' },
        { value: 'discount_percentage', label: 'Korting %' },
        { value: 'free', label: 'Gratis' },
    ]);

    const [showInfoBlockStock, setShowInfoBlockStock] = useState<boolean>(false);
    const [showInfoBlockStockReservationPolicy, setShowInfoBlockStockReservationPolicy] = useState<boolean>(false);

    const [isEditable, setIsEditable] = useState<boolean>(true);
    const [allowsReservations, setAllowsReservations] = useState<boolean>(true);
    const [nonExpiring, setNonExpiring] = useState<boolean>(false);
    const [mediaErrors] = useState<string[]>(null);
    const [product, setProduct] = useState<Product>(null);
    const [sourceProduct, setSourceProduct] = useState<Product>(null);
    const [products, setProducts] = useState<Product[]>(null);

    const goToFundProvider = useCallback(
        (provider: FundProvider) => {
            navigateState('fund-provider', {
                organizationId: provider.fund.organization_id,
                fund_id: provider.fund_id,
                fund_provider_id: provider.id,
            });
        },
        [navigateState],
    );

    const uploadMedia = useCallback(() => {
        const syncPresets = ['thumbnail', 'small'];

        return new Promise((resolve, reject) => {
            if (mediaFile) {
                setProgress(0);

                return mediaService
                    .store('product_photo', mediaFile, syncPresets)
                    .then((res) => resolve(res.data.data.uid))
                    .catch((err) => reject(err.data.errors.file))
                    .finally(() => setProgress(100));
            }

            if (!product && sourceProduct?.photo?.uid) {
                setProgress(0);

                return mediaService
                    .clone(sourceProduct.photo?.uid, syncPresets)
                    .then((res) => resolve(res.data.data.uid))
                    .catch((err) => reject(err.data.errors.file))
                    .finally(() => setProgress(100));
            }

            return resolve(null);
        });
    }, [mediaFile, product, sourceProduct?.photo?.uid, setProgress, mediaService]);

    const fetchProduct = useCallback(
        (id) => {
            setProgress(0);

            productService
                .read(organization.id, id)
                .then((res) => setProduct(res.data.data))
                .finally(() => setProgress(100));
        },
        [productService, organization, setProgress],
    );

    const fetchSourceProduct = useCallback(
        (id) => {
            setProgress(0);

            fundService
                .getProviderProduct(organization.id, fund_provider.fund_id, fund_provider.id, id)
                .then((res) => setSourceProduct(res.data.data))
                .finally(() => setProgress(100));
        },
        [fundService, organization, setProgress, fund_provider],
    );

    const fetchProducts = useCallback(() => {
        setProgress(0);

        productService
            .list(organization.id)
            .then((res) => setProducts(res.data.data))
            .finally(() => setProgress(100));
    }, [productService, organization, setProgress]);

    const form = useFormBuilder<{
        name?: string;
        price?: number;
        price_type: 'regular' | 'discount_fixed' | 'discount_percentage' | 'free';
        price_discount?: number;
        expire_at?: string;
        sold_amount?: number;
        stock_amount?: number;
        total_amount?: number;
        unlimited_stock?: boolean;
        description?: string;
        description_html?: string;
        alternative_text?: string;
        reservation_enabled?: boolean;
        product_category_id?: number;
        reservation_phone: 'global' | 'no' | 'optional' | 'required';
        reservation_address: 'global' | 'no' | 'optional' | 'required';
        reservation_birth_date: 'global' | 'no' | 'optional' | 'required';
        reservation_extra_payments: 'global' | 'no' | 'yes';
        reservation_policy?: 'global' | 'accept' | 'review';
    }>(null, (values) => {
        if (product && !product.unlimited_stock && form.values.stock_amount < 0) {
            form.setIsLocked(false);

            return form.setErrors({
                stock_amount: ['Nog te koop moet minimaal 0 zijn.'],
            });
        }

        uploadMedia().then((media_uid: string) => {
            setProgress(0);
            let promise: Promise<ApiResponseSingle<Product>>;
            const valueData = { ...values, media_uid };

            if (nonExpiring) {
                valueData.expire_at = null;
            }

            if (values.price_type !== 'regular') {
                delete valueData.price;
            }

            if (values.price_type === 'regular' || values.price_type === 'free') {
                delete valueData.price_discount;
            }

            if (values.unlimited_stock) {
                delete valueData.total_amount;
            }

            if (product) {
                const updateValues = { ...valueData, total_amount: values.sold_amount + values.stock_amount };

                if (!fund_provider) {
                    promise = productService.update(organization.id, product.id, updateValues);
                } else {
                    promise = organizationService.sponsorProductUpdate(
                        organization.id,
                        fund_provider.organization_id,
                        product.id,
                        updateValues,
                    );
                }
            } else {
                if (!fund_provider) {
                    promise = productService.store(organization.id, valueData);
                } else {
                    promise = organizationService.sponsorStoreProduct(
                        organization.id,
                        fund_provider.organization_id,
                        valueData,
                    );
                }
            }

            promise
                .then((res: ApiResponseSingle<Product>) => {
                    pushSuccess('Gelukt!');

                    if (!fund_provider) {
                        return navigateState('products', { organizationId: organization.id });
                    }

                    if (fund_provider.fund.type === 'subsidies') {
                        navigateState(product ? 'fund-provider-product' : 'fund-provider-product-subsidy-edit', {
                            organization_id: fund_provider.fund.organization_id,
                            fund_id: fund_provider.fund_id,
                            fund_provider_id: fund_provider.id,
                            product_id: res.data.data.id,
                        });
                    } else {
                        goToFundProvider(fund_provider);
                    }
                })
                .catch((err: ResponseError) => {
                    form.setIsLocked(false);
                    form.setErrors(err.data.errors);
                    pushDanger('Mislukt!', err.data.message);
                })
                .finally(() => setProgress(100));
        });
    });

    const { update: updateForm } = form;

    const priceWillChange = useCallback(
        (product?: Product): boolean => {
            if (!product) {
                return false;
            }

            if (product.price_type !== form.values.price_type) {
                return true;
            }

            if (form.values.price_type === 'regular' && parseFloat(product.price) !== form.values.price) {
                return true;
            }

            if (
                ['discount_fixed', 'discount_percentage'].includes(form.values.price_type) &&
                parseFloat(product.price_discount) !== form.values.price_discount
            ) {
                return true;
            }

            return true;
        },
        [form?.values],
    );

    const hasSubsidyFunds = useCallback((product: Product) => {
        return product && (product.sponsor_organization_id || product.funds.find((fund) => fund.type === 'subsidies'));
    }, []);

    const confirmPriceChange = useCallback(async (): Promise<boolean> => {
        if (alreadyConfirmed) {
            return true;
        }

        return new Promise((resolve) => {
            openModal((modal) => (
                <ModalNotification
                    modal={modal}
                    icon={'product-create'}
                    title={t('product_edit.confirm_price_change.title')}
                    description={t('product_edit.confirm_price_change.description')}
                    buttonSubmit={{
                        onClick: () => {
                            setAlreadyConfirmed(true);
                            resolve(true);
                        },
                    }}
                    buttonCancel={{ onClick: () => resolve(false) }}
                />
            ));
        });
    }, [alreadyConfirmed, openModal, t]);

    const saveProduct = useCallback(
        (e: FormEvent<HTMLFormElement>) => {
            if (!priceWillChange(product) || !hasSubsidyFunds(product)) {
                return form.submit(e);
            }

            confirmPriceChange().then((confirmed) => {
                if (confirmed) {
                    form.submit(e);
                }
            });
        },
        [confirmPriceChange, form, hasSubsidyFunds, priceWillChange, product],
    );

    const cancel = useCallback(() => {
        if (fund_provider) {
            goToFundProvider(fund_provider);
        } else {
            navigateState('products', { organizationId: organization.id });
        }
    }, [fund_provider, goToFundProvider, navigateState, organization?.id]);

    useEffect(() => {
        const { reservations_budget_enabled, reservations_subsidy_enabled } = organization;

        setNonExpiring(!product || !product?.expire_at);
        setAllowsReservations(reservations_budget_enabled || reservations_subsidy_enabled);
        setIsEditable(
            !product || !product.sponsor_organization_id || product.sponsor_organization_id === organization.id,
        );

        const maxProductCount = appConfigs.products_hard_limit;

        if (maxProductCount && !product && products && products.length >= maxProductCount) {
            openModal((modal) => {
                return (
                    <ModalNotification
                        icon={'product-error'}
                        modal={modal}
                        title={t('product_edit.errors.already_added')}
                        buttonCancel={{
                            onClick: () => navigateState('products', { organizationId: organization.id }),
                        }}
                    />
                );
            });
        }
    }, [organization, appConfigs, product, products, openModal, t, navigateState]);

    useEffect(() => {
        if (id) {
            fetchProduct(id);
        }

        if (source_id) {
            fetchSourceProduct(id);
        }
    }, [id, source_id, fetchProduct, fetchSourceProduct]);

    useEffect(() => {
        if (id && !source_id && product) {
            fetchProducts();
        }
    }, [fetchProducts, id, source_id, product]);

    useEffect(() => {
        if ((id && !product) || (source_id && !sourceProduct)) {
            return;
        }

        const model = sourceProduct || product;

        updateForm(
            model
                ? productService.apiResourceToForm(sourceProduct || product)
                : {
                      name: '',
                      price: undefined,
                      price_discount: undefined,
                      price_type: 'regular',
                      expire_at: undefined,
                      sold_amount: '',
                      stock_amount: '',
                      total_amount: '',
                      unlimited_stock: false,
                      description: '',
                      description_html: '',
                      alternative_text: '',
                      reservation_enabled: false,
                      product_category_id: null,
                      reservation_phone: 'global',
                      reservation_address: 'global',
                      reservation_birth_date: 'global',
                      reservation_extra_payments: organization.allow_extra_payments_by_sponsor ? 'global' : null,
                      reservation_policy: 'global',
                  },
        );
    }, [product, sourceProduct, updateForm, productService, id, source_id, organization]);

    if (!organization || (id && !product) || (source_id && !sourceProduct) || !form.values) {
        return <LoadingCard />;
    }

    return (
        <Fragment>
            <div className="block block-breadcrumbs">
                <StateNavLink
                    name={'products'}
                    params={{ organizationId: organization.id }}
                    className="breadcrumb-item">
                    Aanbod
                </StateNavLink>
                <div className="breadcrumb-item active">
                    {t(id ? 'product_edit.header.title_edit' : 'product_edit.header.title_add')}
                </div>
            </div>

            <form className="card form" onSubmit={saveProduct}>
                <div className="card-header">
                    <div className="card-title">
                        {t(id ? 'product_edit.header.title_edit' : 'product_edit.header.title_add')}
                    </div>
                </div>

                <div className="card-section card-section-primary">
                    <div className="row">
                        <div className="col col-xs-11 col-lg-9 col-xs-12">
                            <div className="form-group form-group-inline">
                                <label className="form-label">&nbsp;</label>
                                <div className="form-offset">
                                    <PhotoSelector
                                        type="office_photo"
                                        disabled={!isEditable}
                                        thumbnail={product?.photo?.sizes?.thumbnail}
                                        selectPhoto={(file) => setMediaFile(file)}
                                    />
                                    <FormError error={mediaErrors} />
                                </div>
                            </div>
                            <div className="form-group form-group-inline" />
                            <div className="form-group form-group-inline">
                                <label className="form-label">{t('product_edit.labels.alternative_text')}</label>
                                <input
                                    className="form-control"
                                    disabled={!isEditable}
                                    onChange={(e) => form.update({ alternative_text: e.target.value })}
                                    value={form.values.alternative_text || ''}
                                    type="text"
                                    placeholder={t('product_edit.labels.alternative_text_placeholder')}
                                />
                                <FormError error={form.errors.alternative_text} />
                            </div>
                        </div>
                    </div>
                </div>
                <div className="card-section card-section-primary">
                    <div className="row">
                        <div className="col col-xs-11 col-lg-9">
                            <div className="form-group form-group-inline">
                                <label className="form-label form-label-required">
                                    {t('product_edit.labels.name')}
                                </label>
                                <input
                                    type="text"
                                    disabled={!isEditable}
                                    className="form-control"
                                    placeholder={'Naam'}
                                    value={form.values.name || ''}
                                    onChange={(e) => form.update({ name: e.target.value })}
                                />
                                <FormError error={form.errors?.name} />
                            </div>

                            <div className="form-group form-group-inline tooltipped">
                                <label className="form-label form-label-required">
                                    {t('product_edit.labels.description')}
                                </label>
                                <div className="form-offset">
                                    <MarkdownEditor
                                        value={form.values.description_html || ''}
                                        disabled={!isEditable}
                                        onChange={(description) => form.update({ description })}
                                        placeholder={t('product_edit.labels.description')}
                                    />
                                    <Tooltip
                                        text={
                                            'Bijvoorbeeld: aantal lessen, abonnementsvorm, omschrijving cursus, einddatum activiteit, voorwaarden, bijzonderheden, etc.'
                                        }
                                    />
                                    <FormError error={form.errors?.description} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="card-section card-section-primary">
                    <div className="row">
                        <div className="col col-xs-11 col-lg-9">
                            <div className="form-group form-group-inline tooltipped">
                                <label className="form-label">Aanbod type</label>
                                <div className="form-offset">
                                    <div className="block block-label-tabs">
                                        <div className="label-tab-set">
                                            {priceTypes?.map((priceType) => (
                                                <div
                                                    key={priceType.value}
                                                    className={`label-tab label-tab-sm 
                                                    ${form.values.price_type === priceType.value ? 'active' : ''} 
                                                    ${!isEditable ? 'disabled' : ''}`}
                                                    onClick={() => form.update({ price_type: priceType.value })}>
                                                    {priceType.label}
                                                </div>
                                            ))}
                                        </div>
                                        <Tooltip text={t('product_edit.tooltips.product_type')?.split('\n')} />
                                    </div>
                                </div>
                            </div>

                            {form.values.price_type === 'regular' && (
                                <div className="form-group form-group-inline">
                                    <label className="form-label form-label-required">Bedrag</label>
                                    <div className="form-offset">
                                        <input
                                            className="form-control"
                                            disabled={!isEditable}
                                            value={form.values.price || ''}
                                            onChange={(e) => {
                                                form.update({
                                                    price: e.target.value ? parseFloat(e.target.value) : '',
                                                });
                                            }}
                                            type="number"
                                            placeholder="Bedrag in euro's"
                                            step="0.01"
                                        />
                                        <FormError error={form.errors.price} />
                                    </div>
                                </div>
                            )}

                            {form.values.price_type === 'discount_percentage' && (
                                <div className="form-group form-group-inline">
                                    <label className="form-label">Kortingspercentage</label>
                                    <div className="form-offset">
                                        <input
                                            className="form-control"
                                            disabled={!isEditable}
                                            value={form.values.price_discount || ''}
                                            onChange={(e) => {
                                                form.update({
                                                    price_discount: e.target.value ? parseFloat(e.target.value) : '',
                                                });
                                            }}
                                            type="number"
                                            placeholder="20%"
                                            step="0.01"
                                            max={100}
                                        />
                                        <FormError error={form.errors.price_discount} />
                                    </div>
                                </div>
                            )}

                            {form.values.price_type === 'discount_fixed' && (
                                <div className="form-group form-group-inline">
                                    <label className="form-label">Korting</label>
                                    <div className="form-offset">
                                        <input
                                            className="form-control"
                                            disabled={!isEditable}
                                            value={form.values.price_discount}
                                            onChange={(e) => {
                                                form.update({
                                                    price_discount: e.target.value ? parseFloat(e.target.value) : '',
                                                });
                                            }}
                                            type="number"
                                            placeholder="€ 20"
                                            step="0.01"
                                        />
                                        <FormError error={form.errors.price_discount} />
                                    </div>
                                </div>
                            )}

                            {product && (
                                <div className="form-group form-group-inline">
                                    <label className="form-label">{t('product_edit.labels.sold')}</label>
                                    <input
                                        className="form-control"
                                        disabled={true}
                                        value={form.values.sold_amount}
                                        onChange={(e) =>
                                            form.update({
                                                sold_amount: e.target.value ? parseFloat(e.target.value) : '',
                                            })
                                        }
                                        type="number"
                                        placeholder="Verkocht"
                                    />
                                    <FormError error={form.errors.sold_amount} />
                                </div>
                            )}

                            <div className="form-group form-group-inline tooltipped">
                                <label className="form-label form-label-required">
                                    {t('product_edit.labels.total')}
                                </label>
                                {product && product.unlimited_stock && (
                                    <div className="form-offset">
                                        <div className="form-value text-muted">
                                            {t('product_edit.labels.stock_unlimited')}
                                        </div>
                                    </div>
                                )}

                                {(!product || (product && !product.unlimited_stock)) && (
                                    <div className="form-offset">
                                        <div className="row">
                                            {!form.values.unlimited_stock ? (
                                                <div className="col col-lg-7">
                                                    <input
                                                        className="form-control"
                                                        disabled={
                                                            !isEditable || !!product || form.values.unlimited_stock
                                                        }
                                                        value={form.values.total_amount}
                                                        onChange={(e) => {
                                                            form.update({
                                                                total_amount: e.target.value
                                                                    ? parseFloat(e.target.value)
                                                                    : '',
                                                            });
                                                        }}
                                                        type="number"
                                                        placeholder="Aantal in voorraad"
                                                    />
                                                </div>
                                            ) : (
                                                <div className="col col-lg-7">
                                                    <input
                                                        className="form-control"
                                                        value={t('product_edit.labels.stock_unlimited')}
                                                        disabled={true}
                                                    />
                                                </div>
                                            )}

                                            <div className="col col-lg-5">
                                                <CheckboxControl
                                                    disabled={!isEditable || (product && !product.unlimited_stock)}
                                                    id="unlimited_stock"
                                                    title={t('product_edit.labels.stock_unlimited')}
                                                    checked={form.values.unlimited_stock}
                                                    onChange={(e) => {
                                                        form.update({ unlimited_stock: e.target.checked });
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <FormError error={form.errors.total_amount} />
                            </div>

                            {product && !product.unlimited_stock && (
                                <div className="form-group form-group-inline tooltipped">
                                    <label className="form-label">{t('product_edit.labels.stock_amount')}</label>
                                    <div className="form-offset">
                                        <div className="form-group-info">
                                            <div className="form-group-info-control">
                                                <input
                                                    className="form-control"
                                                    value={form.values.stock_amount}
                                                    onChange={(e) =>
                                                        form.update({
                                                            stock_amount: e.target.value
                                                                ? parseFloat(e.target.value)
                                                                : '',
                                                        })
                                                    }
                                                    type="number"
                                                    placeholder="Stock"
                                                    disabled={!isEditable}
                                                />
                                            </div>
                                            <div className="form-group-info-button">
                                                <div
                                                    className={`button button-default button-icon pull-left ${
                                                        showInfoBlockStock ? 'active' : ''
                                                    }`}
                                                    onClick={() => setShowInfoBlockStock(!showInfoBlockStock)}>
                                                    <em className="mdi mdi-information" />
                                                </div>
                                            </div>
                                        </div>
                                        {showInfoBlockStock && (
                                            <div className="block block-info-box block-info-box-primary">
                                                <div className="info-box-icon mdi mdi-information" />
                                                <div className="info-box-content">
                                                    <div className="block block-markdown">
                                                        {t('tooltip.product.limit')}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        <FormError error={form.errors.stock_amount} />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="card-section card-section-primary">
                    <div className="row">
                        <div className="col col-xs-11 col-lg-9">
                            <div className="form-group form-group-inline tooltipped">
                                <label className="form-label">{t('product_edit.labels.expire')}</label>
                                <div className="form-offset">
                                    <div className="row">
                                        <div className="col col-lg-7">
                                            {nonExpiring ? (
                                                <input
                                                    className="form-control"
                                                    defaultValue={t('product_edit.labels.unlimited')}
                                                    disabled={true}
                                                />
                                            ) : (
                                                <DatePickerControl
                                                    disabled={!isEditable}
                                                    dateFormat={'dd-MM-yyyy'}
                                                    value={dateParse(form.values.expire_at)}
                                                    onChange={(date) => form.update({ expire_at: dateFormat(date) })}
                                                    placeholder="dd-MM-jjjj"
                                                />
                                            )}
                                        </div>
                                        <div className="col col-lg-5">
                                            <CheckboxControl
                                                disabled={!isEditable}
                                                id="non_expiring"
                                                title={t('product_edit.labels.unlimited')}
                                                checked={nonExpiring}
                                                onChange={() => setNonExpiring(!nonExpiring)}
                                            />
                                        </div>
                                        <Tooltip
                                            text={
                                                'De uiterlijke datum tot waneer uw aanbieding loopt. Aanbieding wordt na deze datum verwijderd uit de webshop en kan niet meer worden opgehaald.'
                                            }
                                        />
                                    </div>
                                </div>
                                <FormError error={form.errors.expire_at} />
                            </div>
                        </div>
                    </div>
                </div>

                {allowsReservations && (
                    <div className="card-section card-section-primary">
                        <div className="row">
                            <div className="col col-xs-11 col-lg-9">
                                <div className="form-group form-group-inline tooltipped">
                                    <label className="form-label">Reserveringen</label>
                                    <div className="form-offset">
                                        <CheckboxControl
                                            disabled={!isEditable}
                                            id="reservation_enabled"
                                            title="De klant mag het aanbod reserveren"
                                            checked={form.values.reservation_enabled}
                                            onChange={(e) => form.update({ reservation_enabled: e.target.checked })}
                                        />
                                        <FormError error={form.errors.reservation_enabled} />
                                    </div>
                                    <Tooltip
                                        text={
                                            'Deze instelling zorgt ervoor dat de klant het aanbod via de webshop kan reseveren.'
                                        }
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="row">
                            {form.values.reservation_enabled && (
                                <div className="col col-xs-11 col-lg-9">
                                    <div className="form-group form-group-inline tooltipped">
                                        <label className="form-label" htmlFor="reservation_policy">
                                            Reserveringen accepteren
                                        </label>
                                        <div className="form-offset">
                                            <div className="form-group-info">
                                                <div className="form-group-info-control">
                                                    <SelectControl
                                                        className="form-control"
                                                        propValue={'label'}
                                                        propKey={'value'}
                                                        allowSearch={false}
                                                        value={form.values.reservation_policy}
                                                        onChange={(
                                                            reservation_policy: 'global' | 'accept' | 'review',
                                                        ) => {
                                                            form.update({ reservation_policy });
                                                        }}
                                                        options={reservationPolicies}
                                                        optionsComponent={SelectControlOptions}
                                                    />
                                                </div>
                                                <div className="form-group-info-button">
                                                    <div
                                                        className={`button button-default button-icon pull-left ${
                                                            showInfoBlockStockReservationPolicy ? 'active' : ''
                                                        }`}
                                                        onClick={() => {
                                                            setShowInfoBlockStockReservationPolicy(
                                                                !showInfoBlockStockReservationPolicy,
                                                            );
                                                        }}>
                                                        <em className="mdi mdi-information" />
                                                    </div>
                                                </div>
                                            </div>
                                            {showInfoBlockStockReservationPolicy && (
                                                <div className="block block-info-box block-info-box-primary">
                                                    <div className="info-box-icon mdi mdi-information" />
                                                    <div className="info-box-content">
                                                        <div className="block block-markdown">
                                                            Standaard instelling kunt u bij uw reserveringen aanpassen.
                                                            Geef hier optioneel aan of u de reservering handmatig of
                                                            automatisch wilt accepteren.
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                            <FormError error={form.errors.reservation_policy} />
                                        </div>
                                    </div>
                                    <div className="form-group form-group-inline">
                                        <label className="form-label" htmlFor="reservation_phone">
                                            Telefoonnummer klant
                                        </label>
                                        <SelectControl
                                            className="form-control"
                                            propKey={'value'}
                                            propValue={'label'}
                                            value={form.values.reservation_phone}
                                            onChange={(
                                                reservation_phone: 'global' | 'no' | 'optional' | 'required',
                                            ) => {
                                                form.update({ reservation_phone });
                                            }}
                                            options={reservationFieldOptions}
                                            optionsComponent={SelectControlOptions}
                                        />
                                        <FormError error={form.errors.reservation_phone} />
                                    </div>
                                    <div className="form-group form-group-inline">
                                        <label className="form-label" htmlFor="reservation_address">
                                            Adres klant
                                        </label>

                                        <SelectControl
                                            className="form-control"
                                            propKey={'value'}
                                            propValue={'label'}
                                            value={form.values.reservation_address}
                                            onChange={(
                                                reservation_address: 'global' | 'no' | 'optional' | 'required',
                                            ) => {
                                                form.update({ reservation_address });
                                            }}
                                            options={reservationFieldOptions}
                                            optionsComponent={SelectControlOptions}
                                        />
                                        <FormError error={form.errors.reservation_address} />
                                    </div>
                                    <div className="form-group form-group-inline">
                                        <label className="form-label" htmlFor="reservation_birth_date">
                                            Geboortedatum klant
                                        </label>

                                        <SelectControl
                                            className="form-control"
                                            propKey={'value'}
                                            propValue={'label'}
                                            value={form.values.reservation_birth_date}
                                            onChange={(
                                                reservation_birth_date: 'global' | 'no' | 'optional' | 'required',
                                            ) => {
                                                form.update({ reservation_birth_date });
                                            }}
                                            options={reservationFieldOptions}
                                            optionsComponent={SelectControlOptions}
                                        />
                                        <FormError error={form.errors.reservation_birth_date} />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {organization.allow_extra_payments_by_sponsor && (
                    <div className="card-section card-section-primary">
                        <div className="row">
                            <div className="col-lg-9">
                                <div className="form-group form-group-inline">
                                    <label className="form-label" htmlFor="reservation_extra_payments">
                                        {t('product_edit.labels.extra_payments')}
                                    </label>

                                    <pre>{JSON.stringify(form.values, null, '    ')}</pre>

                                    <SelectControl
                                        className="form-control"
                                        propKey={'value'}
                                        propValue={'label'}
                                        disabled={!isEditable}
                                        value={form.values.reservation_extra_payments}
                                        onChange={(reservation_extra_payments: 'global' | 'no' | 'yes') => {
                                            form.update({ reservation_extra_payments });
                                        }}
                                        options={extraPaymentsOptions}
                                        optionsComponent={SelectControlOptions}
                                    />
                                    <FormError error={form.errors.reservation_extra_payments} />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="card-section card-section-primary">
                    <div className="row">
                        <ProductCategoriesControl
                            disabled={!isEditable}
                            value={form.values.product_category_id}
                            onChange={(product_category_id) => form.update({ product_category_id })}
                            errors={form.errors.product_category_id}
                        />
                    </div>
                </div>

                <div className="card-section card-section-primary">
                    <div className="text-center">
                        <button
                            className="button button-default"
                            type="button"
                            onClick={() => cancel()}
                            id="cancel_create_product">
                            {t('product_edit.buttons.cancel')}
                        </button>

                        {isEditable && (
                            <button type="submit" className="button button-primary">
                                {t('product_edit.buttons.confirm')}
                            </button>
                        )}
                    </div>
                </div>
            </form>
        </Fragment>
    );
}
