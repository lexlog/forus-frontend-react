import React, { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFundService } from '../../../services/FundService';
import useSetProgress from '../../../hooks/useSetProgress';
import Fund from '../../../props/models/Fund';
import useActiveOrganization from '../../../hooks/useActiveOrganization';
import { useParams } from 'react-router-dom';
import StateNavLink from '../../../modules/state_router/StateNavLink';
import useFormBuilder from '../../../hooks/useFormBuilder';
import { PaginationData, ResponseError, ResponseErrorData } from '../../../props/ApiResponses';
import usePushSuccess from '../../../hooks/usePushSuccess';
import PhotoSelector from '../../elements/photo-selector/PhotoSelector';
import { useMediaService } from '../../../services/MediaService';
import FormError from '../../elements/forms/errors/FormError';
import CheckboxControl from '../../elements/forms/controls/CheckboxControl';
import Tooltip from '../../elements/tooltip/Tooltip';
import SelectControl from '../../elements/select-control/SelectControl';
import { hasPermission } from '../../../helpers/utils';
import useAssetUrl from '../../../hooks/useAssetUrl';
import { useTagService } from '../../../services/TagService';
import Tag from '../../../props/models/Tag';
import MarkdownEditor from '../../elements/forms/markdown-editor/MarkdownEditor';
import Faq from '../../../props/models/Faq';
import DatePickerControl from '../../elements/forms/controls/DatePickerControl';
import { addDays, addYears } from 'date-fns';
import { dateFormat, dateParse } from '../../../helpers/dates';
import useAppConfigs from '../../../hooks/useAppConfigs';
import FundFormulaProduct from '../../../props/models/FundFormulaProduct';
import Product from '../../../props/models/Product';
import useProductService from '../../../services/ProductService';
import { parseInt, sortBy, uniqueId } from 'lodash';
import { useRecordTypeService } from '../../../services/RecordTypeService';
import { useEmployeeService } from '../../../services/EmployeeService';
import FundCriterion from '../../../props/models/FundCriterion';
import FundCriteriaEditor from '../../elements/fund-criteria-editor/FundCriteriaEditor';
import Organization from '../../../props/models/Organization';
import { useOrganizationService } from '../../../services/OrganizationService';
import FundConfigContactInfoEditor from './elements/FundConfigContactInfoEditor';
import { useNavigateState } from '../../../modules/state_router/Router';
import MultiSelectControl from '../../elements/forms/controls/MultiSelectControl';
import LoadingCard from '../../elements/loading-card/LoadingCard';
import usePushDanger from '../../../hooks/usePushDanger';
import useTranslate from '../../../hooks/useTranslate';
import Employee from '../../../props/models/Employee';
import Media from '../../../props/models/Media';
import RecordType from '../../../props/models/RecordType';
import FaqEditor from '../../elements/faq-editor-funds/FaqEditor';

export default function OrganizationsFundsEdit() {
    const { fundId } = useParams();
    const activeOrganization = useActiveOrganization();

    const assetUrl = useAssetUrl();
    const translate = useTranslate();
    const pushDanger = usePushDanger();
    const setProgress = useSetProgress();
    const pushSuccess = usePushSuccess();
    const navigateState = useNavigateState();
    const appConfigs = useAppConfigs();

    const tagService = useTagService();
    const fundService = useFundService();
    const mediaService = useMediaService();
    const productService = useProductService();
    const employeeService = useEmployeeService();
    const recordTypeService = useRecordTypeService();
    const organizationService = useOrganizationService();

    const [faq, setFaq] = useState<Array<Faq & { uid: string }>>([]);
    const [fund, setFund] = useState<Fund>(null);
    const [tags, setTags] = useState<Array<Tag>>(null);
    const [fundPhoto, setFundPhoto] = useState(null);
    const [validatorEmployees, setValidatorEmployees] = useState<Array<Employee>>(null);

    const [showInfoBlock, setShowInfoBlock] = useState<boolean>(false);
    const [recordTypes, setRecordTypes] = useState<Array<RecordType>>(null);
    const [products, setProducts] = useState<Array<Partial<Product>>>(null);
    const [validatorOrganizations, setValidatorOrganizations] = useState<PaginationData<Organization>>(null);
    const [fundStates] = useState(fundService.getStates());
    const faqEditorBlock = useRef<() => Promise<boolean>>();
    const criteriaBlockRef = useRef<() => Promise<Array<FundCriterion> | null>>();

    const [fundTypes] = useState([
        { value: 'budget', name: 'Waardebon' },
        { value: 'subsidies', name: 'Kortingspas' },
        { value: 'external', name: 'Informatief (met doorlink)' },
    ]);

    const [externalFundPageTypes] = useState([
        { value: false, name: 'Interne pagina' },
        { value: true, name: 'Externe pagina' },
    ]);

    const [descriptionPositions] = useState([
        { value: 'replace', name: 'Standaard content overschrijven' },
        { value: 'before', name: 'Voor de standaard content tonen' },
        { value: 'after', name: 'Na de standaard content tonen' },
    ]);

    const [applicationMethods] = useState([
        {
            key: 'application_form',
            name: 'Aanvraagformulier',
            default_button_text: 'Aanvragen',
            configs: { allow_fund_requests: 1, allow_prevalidations: 0, allow_direct_requests: 1 },
        },
        {
            key: 'activation_codes',
            name: 'Activatiecodes',
            default_button_text: 'Activeren',
            configs: { allow_fund_requests: 0, allow_prevalidations: 1, allow_direct_requests: 1 },
        },
        {
            key: 'all',
            name: 'Aanvraagformulier en activatiecodes',
            default_button_text: 'Aanvragen',
            configs: { allow_fund_requests: 1, allow_prevalidations: 1, allow_direct_requests: 1 },
        },
        {
            key: 'none',
            name: 'Geen aanvraagformulier en activatiecodes',
            default_button_text: 'Aanvragen',
            configs: { allow_fund_requests: 0, allow_prevalidations: 0, allow_direct_requests: 0 },
        },
    ]);

    const applicationMethodsByKey = useMemo(() => {
        return applicationMethods.reduce((list, item) => ({ ...list, [item.key]: item }), {});
    }, [applicationMethods]);

    const validators = useMemo<Array<{ id?: number; email: string }>>(() => {
        return [
            { id: null, email: 'Geen' },
            ...(validatorEmployees?.map((employee) => ({ id: employee.id, email: employee.email })) || []),
        ];
    }, [validatorEmployees]);

    const recordTypesMultiplier = useMemo(() => {
        return [
            { key: null, name: 'Wijs 1 tegoed' },
            ...(recordTypes || []).map((type) => ({ ...type, name: `Vermenigvuldig met: ${type.name}` })),
        ];
    }, [recordTypes]);

    const storeMedia = useCallback(
        async (mediaFile): Promise<Media> => {
            return await mediaService
                .store('fund_logo', mediaFile)
                .then((res) => res.data?.data)
                .catch((err: ResponseError) => {
                    pushDanger('Mislukt!', err.data?.message || 'Onbekende foutmelding!');
                    return null;
                });
        },
        [mediaService, pushDanger],
    );

    const form = useFormBuilder<{
        name?: string;
        state?: string;
        description_short?: string;
        external_page?: boolean;
        hide_meta?: boolean;
        media_uid?: string;
        type?: string;
        fund_type?: string;
        external_page_url?: string;
        request_btn_text?: string;
        application_method?: string;
        external_link_text?: string;
        external_link_url?: string;
        description_html?: string;
        description?: string;
        faq_title?: string;
        description_position?: string;
        start_date?: string;
        end_date?: string;
        formula_products: Array<FundFormulaProduct>;
        product_id?: number;
        default_validator_employee_id?: number;
        auto_requests_validation?: boolean;
        criteria?: Array<Partial<FundCriterion>>;
        notification_amount?: number;
        tag_ids?: Array<number>;
        email_required?: boolean;
        contact_info_enabled?: boolean;
        contact_info_required?: boolean;
        contact_info_message_custom?: boolean;
        contact_info_message_text?: string;
    }>(
        {
            description_position: descriptionPositions[0]?.value,
            type: 'budget',
            start_date: dateFormat(addDays(new Date(), 6)),
            end_date: dateFormat(addYears(new Date(), 1)),
            formula_products: [] as Array<FundFormulaProduct>,
            criteria: [],
            default_validator_employee_id: null,
            application_method: 'application_form',
            request_btn_text: applicationMethodsByKey['application_form']?.default_button_text,
            state: fundStates[0].value,

            // contact information
            email_required: true,
            contact_info_enabled: true,
            contact_info_required: true,
            contact_info_message_custom: false,
            contact_info_message_text: '',
        },
        async (values) => {
            const data = JSON.parse(JSON.stringify(values));

            data.start_date = dateFormat(new Date(data.start_date), 'yyyy-MM-dd');
            data.end_date = dateFormat(new Date(data.end_date), 'yyyy-MM-dd');

            const resolveErrors = (res: ResponseError) => {
                form.setIsLocked(false);
                form.setErrors(res.data.errors);
            };

            if (appConfigs.organizations.funds.criteria && !form.values.external_page) {
                try {
                    const criteria = await criteriaBlockRef.current();

                    if (criteria != null) {
                        data.criteria = criteria.map((item: FundCriterion) => ({
                            ...item,
                            validators:
                                item.external_validators?.map((validator) => validator.organization_validator_id) || [],
                        }));
                    } else {
                        return form.setIsLocked(false);
                    }
                } catch (e) {
                    return form.setIsLocked(false);
                }
            }

            try {
                await faqEditorBlock.current();
            } catch (e) {
                pushDanger('Error!', typeof e == 'string' ? e : e.message || '');
                return form.setIsLocked(false);
            }

            const formValues = {
                ...data,
                faq: faq,
                media_uid: (fundPhoto ? await storeMedia(fundPhoto) : null)?.uid,
                ...(applicationMethodsByKey[values.application_method]?.configs || {}),
            };

            if (fundId) {
                return fundService
                    .update(activeOrganization.id, parseInt(fundId), formValues)
                    .then(() => {
                        navigateState('funds-show', { organizationId: activeOrganization.id, fundId: fundId });
                        pushSuccess('Gelukt!', 'Het fonds is aangepast!');
                    })
                    .catch((res: ResponseError) => resolveErrors(res))
                    .finally(() => form.setIsLocked(false));
            } else {
                return fundService
                    .store(activeOrganization.id, formValues)
                    .then(() => {
                        navigateState('organization-funds', { organizationId: activeOrganization.id });
                        pushSuccess('Gelukt!', 'Het fonds is aangemaakt!');
                    })
                    .catch((res: ResponseError) => resolveErrors(res))
                    .finally(() => form.setIsLocked(false));
            }
        },
    );

    const { update: updateForm } = form;

    const hasFundFormula = useMemo(() => {
        return (
            appConfigs?.organizations?.funds?.formula_products &&
            hasPermission(activeOrganization, 'manage_funds') &&
            !form.values.external_page
        );
    }, [activeOrganization, appConfigs.organizations.funds.formula_products, form.values.external_page]);

    const productOptions = useMemo(() => {
        if (!form.values.formula_products || !Array.isArray(products)) {
            return [];
        }

        const productsUsed = form.values.formula_products.map((item: FundFormulaProduct) => item.product_id);
        const productsAvailable = products.filter((product) => !productsUsed.includes(product.id));

        return form.values.formula_products.map((item: FundFormulaProduct) => {
            const product = products.find((product) => product.id == item?.product_id);

            return sortBy(
                [...productsAvailable, product].filter((item) => item),
                (product: Product) => product.name,
            );
        }, []);
    }, [form.values.formula_products, products]);

    const fetchFund = useCallback(
        (fund_id: number) => {
            setProgress(0);

            fundService
                .read(activeOrganization.id, fund_id)
                .then((res) => setFund(res.data.data))
                .finally(() => setProgress(100));
        },
        [activeOrganization.id, fundService, setProgress],
    );

    const onMethodChange = useCallback(
        (value: string, prevValue: string) => {
            const method = applicationMethodsByKey[value];
            const preMethod = applicationMethodsByKey[prevValue];

            if (preMethod?.default_button_text == form.values.request_btn_text) {
                form.update({ request_btn_text: method?.default_button_text });
            }
        },
        [applicationMethodsByKey, form],
    );

    const fetchValidatorEmployees = useCallback(() => {
        setProgress(0);

        employeeService
            .list(activeOrganization.id, { role: 'validation' })
            .then((res) => setValidatorEmployees(res.data.data))
            .finally(() => setProgress(100));
    }, [activeOrganization.id, employeeService, setProgress]);

    const fetchValidatorOrganizations = useCallback(() => {
        setProgress(0);

        organizationService
            .readListValidators(activeOrganization.id, { per_page: 100 })
            .then((res) => setValidatorOrganizations(res.data))
            .finally(() => setProgress(100));
    }, [activeOrganization.id, organizationService, setProgress]);

    const fetchProducts = useCallback(() => {
        setProgress(0);

        productService
            .listAll({ per_page: 1000, simplified: 1, unlimited_stock: 1 })
            .then((res) => {
                setProducts(
                    res.data.data.map((product) => ({
                        id: product.id,
                        price: product.price,
                        name: `${product.name} - €${product.price} (${product.organization.name})`,
                    })),
                );
            })
            .finally(() => setProgress(100));
    }, [productService, setProgress]);

    const fetchRecordTypes = useCallback(() => {
        setProgress(0);

        recordTypeService
            .list({ criteria: 1, organization_id: activeOrganization.id })
            .then((res) => setRecordTypes(res.data))
            .finally(() => setProgress(100));
    }, [activeOrganization.id, recordTypeService, setProgress]);

    const fetchTags = useCallback(() => {
        setProgress(0);

        tagService
            .list({ scope: 'webshop', per_page: 1000 })
            .then((res) => setTags(res.data.data))
            .finally(() => setProgress(100));
    }, [setProgress, tagService]);

    const updateFormFormulaProduct = useCallback(
        (formula_id, field_name, field_value) => {
            const formulaProducts = form.values.formula_products;
            formulaProducts[formula_id] = {
                ...formulaProducts[formula_id],
                [field_name]: field_value,
            };
            form.update({
                formula_products: formulaProducts,
            });
        },
        [form],
    );

    const addProduct = useCallback(() => {
        form.update({
            formula_products: [...form.values.formula_products, { product_id: null, record_type_key_multiplier: null }],
        });
    }, [form]);

    const getApplicationMethodKey = useCallback(() => {
        if (fund?.allow_fund_requests) {
            return fund.allow_prevalidations ? 'all' : 'application_form';
        }

        return fund?.allow_prevalidations ? 'activation_codes' : 'none';
    }, [fund?.allow_fund_requests, fund?.allow_prevalidations]);

    useEffect(() => {
        fundId && fetchTags();
    }, [fetchTags, fundId]);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    useEffect(() => {
        fetchRecordTypes();
    }, [fetchRecordTypes]);

    useEffect(() => {
        fetchValidatorEmployees();
    }, [fetchValidatorEmployees]);

    useEffect(() => {
        fetchValidatorOrganizations();
    }, [fetchValidatorOrganizations]);

    useEffect(() => {
        if (fundId) {
            fetchFund(parseInt(fundId));
        }
    }, [fetchFund, fundId]);

    useEffect(() => {
        if (fund) {
            delete fund.organization;
            updateForm({
                ...fund,
                tag_ids: Array.isArray(fund.tags) ? fund.tags.map((tag) => tag.id) : [],
                application_method: getApplicationMethodKey(),
            });
            setFaq(fund?.faq?.map((item) => ({ ...item, uid: uniqueId() })) || []);
        }
    }, [updateForm, fund, getApplicationMethodKey]);

    if (!recordTypes || (fundId && !fund)) {
        return <LoadingCard />;
    }

    return (
        <Fragment>
            <div className="block block-breadcrumbs">
                <StateNavLink
                    name={'organization-funds'}
                    params={{ organizationId: activeOrganization.id }}
                    activeExact={true}
                    className="breadcrumb-item">
                    Fondsen
                </StateNavLink>

                <div className="breadcrumb-item active">
                    {fundId ? fund?.name : translate('funds_edit.header.title_add')}
                </div>
            </div>

            <form className="card form" onSubmit={form.submit}>
                <div className="card-header">
                    {!fund ? (
                        <div className="card-title">{translate('funds_edit.header.title_add')}</div>
                    ) : (
                        <div className="card-title">{translate('funds_edit.header.title_edit')}</div>
                    )}
                </div>

                <div className="card-section card-section-primary">
                    <div className="form-group form-group-inline">
                        <label className="form-label hidden-md">&nbsp;</label>
                        <div className="form-offset">
                            <PhotoSelector
                                type={'fund_logo'}
                                thumbnail={fund?.logo?.sizes?.thumbnail}
                                selectPhoto={setFundPhoto}
                            />
                        </div>
                    </div>
                </div>

                <div className="card-section card-section-primary">
                    <div className="row">
                        <div className="col col-lg-9 col-xs-12">
                            <div className="form-group form-group-inline">
                                <label className="form-label form-label-required">
                                    {translate('funds_edit.labels.name')}
                                </label>
                                <input
                                    className="form-control"
                                    value={form.values.name || ''}
                                    type="text"
                                    placeholder="Naam"
                                    onChange={(e) => {
                                        form.update({ name: e.target.value });
                                    }}
                                />
                                <FormError error={form.errors?.name} />
                            </div>

                            <div className="form-group form-group-inline">
                                <label className="form-label">{translate('funds_edit.labels.description_short')}</label>
                                <div className="form-offset">
                                    <textarea
                                        className="form-control r-n"
                                        maxLength={500}
                                        placeholder="Omschrijving"
                                        value={form.values.description_short || ''}
                                        onChange={(e) => {
                                            form.update({ description_short: e.target.value });
                                        }}
                                    />
                                    <div className="form-hint">Max. 500 tekens</div>
                                    <FormError error={form.errors?.description_short}></FormError>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {!form.values.external_page && (
                    <div className="card-section card-section-primary">
                        <div className="row">
                            <div className="col col-lg-9 col-xs-12">
                                <div className="form-group form-group-inline tooltipped">
                                    <label className="form-label">Verberg details</label>
                                    <CheckboxControl
                                        id={'hide_meta'}
                                        checked={!!form.values.hide_meta}
                                        onChange={(e) => form.update({ hide_meta: e.target.checked })}
                                        title={'Verberg de detail informatie van het fonds op de webshop'}
                                    />
                                    <Tooltip
                                        text={
                                            'De datails die verborgen worden, zijn: Uitgifte door, tegoed per persoon, startdatum en einddatum van het fonds'
                                        }
                                    />
                                    <FormError error={form.errors?.hide_meta} />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="card-section card-section-primary">
                    <div className="row">
                        <div className="col col-lg-9 col-xs-12">
                            <div className="form-group form-group-inline">
                                <label className="form-label form-label-required">Soort fonds</label>
                                <div className="form-offset">
                                    {!fund && (
                                        <SelectControl
                                            propKey={'value'}
                                            allowSearch={false}
                                            value={form.values.type}
                                            options={fundTypes}
                                            disabled={!hasPermission(activeOrganization, 'manage_funds')}
                                            onChange={(type: string) => form.update({ type })}
                                        />
                                    )}
                                    <FormError error={form.errors?.type} />
                                </div>

                                {fund && (
                                    <div className="form-offset">
                                        <div className="block block-fund_types">
                                            {form.values.type == 'budget' && (
                                                <div className="fund_type-item fund_type-item-read">
                                                    <div className="fund_type-item-inner">
                                                        <div className="fund_type-media">
                                                            <img
                                                                className="fund_type-media-img"
                                                                src={assetUrl(
                                                                    '/assets/img/fund-types/icon-fund-actions-read.svg',
                                                                )}
                                                                alt={''}
                                                            />
                                                        </div>
                                                        <div className="fund_type-name">Financieel budget</div>
                                                        <div className="fund_type-check">
                                                            <div className="mdi mdi-check" />
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {form.values.type == 'subsidies' && (
                                                <div className="fund_type-item fund_type-item-read">
                                                    <div className="fund_type-item-inner">
                                                        <div className="fund_type-media">
                                                            <img
                                                                className="fund_type-media-img"
                                                                src={assetUrl(
                                                                    '/assets/img/fund-types/icon-fund-budget-read.svg',
                                                                )}
                                                                alt={''}
                                                            />
                                                        </div>
                                                        <div className="fund_type-name">Acties</div>
                                                        <div className="fund_type-check">
                                                            <div className="mdi mdi-check" />
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {form.values.type == 'external' && (
                                                <div className="fund_type-item fund_type-item-read">
                                                    <div className="fund_type-item-inner">
                                                        <div className="fund_type-media">
                                                            <img
                                                                className="fund_type-media-img"
                                                                src={assetUrl(
                                                                    '/assets/img/fund-types/icon-fund-external-read.svg',
                                                                )}
                                                                alt={''}
                                                            />
                                                        </div>

                                                        <div className="fund_type-name">Informatief (met doorlink)</div>

                                                        <div className="fund_type-check">
                                                            <div className="mdi mdi-check" />
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {form.values.type == 'external' && (
                    <div className="card-section card-section-primary">
                        <div className="row">
                            <div className="col col-lg-9 col-xs-12">
                                <div className="form-group form-group-inline">
                                    <label className="form-label">Pagina type</label>
                                    <div className="form-offset">
                                        <div className="form-group-info">
                                            <div className="form-group-info-control">
                                                <SelectControl
                                                    propKey={'value'}
                                                    allowSearch={false}
                                                    value={form.values.external_page}
                                                    options={externalFundPageTypes}
                                                    onChange={(external_page: boolean) => {
                                                        form.update({ external_page });
                                                    }}
                                                />
                                            </div>
                                            <div className="form-group-info-button">
                                                <div
                                                    className={`button button-default button-icon pull-left ${
                                                        showInfoBlock ? 'active' : ''
                                                    }`}
                                                    onClick={() => setShowInfoBlock(!showInfoBlock)}>
                                                    <em className="mdi mdi-information" />
                                                </div>
                                            </div>
                                        </div>

                                        {showInfoBlock && (
                                            <div className="block block-info-box block-info-box-primary">
                                                <div className="info-box-icon mdi mdi-information" />
                                                <div className="info-box-content">
                                                    <div className="block block-markdown">
                                                        <h4>Kies de juiste instelling</h4>
                                                        <p>
                                                            Een interne pagina leidt de gebruiker eerst door naar een
                                                            pagina binnen de webshop. Een externe pagina leidt de
                                                            gebruiker na het klikken direct door naar de URL die is
                                                            ingevuld.
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        <FormError error={form.errors?.external_page} />
                                    </div>
                                </div>

                                {form.values.external_page && (
                                    <div className="form-group form-group-inline">
                                        <label className="form-label form-label-required">Externe url</label>
                                        <input
                                            className="form-control"
                                            placeholder="https://gemeente+1.nl/aanmelden"
                                            value={form.values.external_page_url || ''}
                                            onChange={(e) => {
                                                form.update({ external_page_url: e.target.value });
                                            }}
                                        />
                                        <FormError error={form.errors?.external_page_url} />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {tags?.length > 0 && (
                    <div className="card-section card-section-primary">
                        <div className="row">
                            <div className="col col-lg-9 col-xs-12">
                                <div className="form-group form-group-inline">
                                    <MultiSelectControl
                                        label="Categorieën"
                                        options={tags}
                                        value={form.values?.tag_ids}
                                        onChange={(tag_ids) => form.update({ tag_ids })}
                                    />
                                    <FormError error={form.errors?.tag} />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {form.values.type != 'external' && (
                    <div className="card-section card-section-primary">
                        <div className="row">
                            <div className="col col-lg-9 col-xs-12">
                                <div className="form-group form-group-inline">
                                    <div className="form-label form-label-required">
                                        {translate('funds_edit.labels.application_method')}
                                    </div>
                                    <div className="form-offset">
                                        <SelectControl
                                            propKey={'key'}
                                            allowSearch={false}
                                            value={form.values.application_method}
                                            options={applicationMethods}
                                            disabled={
                                                (fund && fund.state != 'waiting') ||
                                                !hasPermission(activeOrganization, 'manage_funds')
                                            }
                                            onChange={(application_method: string) => {
                                                form.update({ application_method });
                                                onMethodChange(application_method, form.values.application_method);
                                            }}
                                        />
                                    </div>
                                </div>

                                {form.values.application_method != 'none' && (
                                    <div className="form-group form-group-inline">
                                        <label className="form-label form-label-required">
                                            {translate('funds_edit.labels.request_btn_text')}
                                        </label>
                                        <input
                                            className="form-control"
                                            type="text"
                                            value={form.values.request_btn_text}
                                            placeholder="Aanvragen"
                                            onChange={(e) => {
                                                form.update({ request_btn_text: e.target.value });
                                            }}
                                        />
                                        <FormError error={form.errors?.request_btn_text} />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {!form.values.external_page && (
                    <div className="card-section card-section-primary">
                        <div className="row">
                            <div className="col col-lg-9 col-xs-12">
                                <div className="form-group form-group-inline">
                                    <label className="form-label">
                                        {translate('funds_edit.labels.external_link_text')}
                                    </label>
                                    <input
                                        className="form-control"
                                        placeholder="Aanvragen"
                                        value={form.values.external_link_text || ''}
                                        onChange={(e) => {
                                            form.update({ external_link_text: e.target.value });
                                        }}
                                    />
                                    <FormError error={form.errors?.external_link_text} />
                                </div>

                                <div className="form-group form-group-inline">
                                    <label className="form-label">
                                        {translate('funds_edit.labels.external_link_url')}
                                    </label>
                                    <div className="form-offset">
                                        <input
                                            className="form-control"
                                            placeholder="https://gemeente+1.nl/aanmelden"
                                            value={form.values.external_link_url || ''}
                                            onChange={(e) => {
                                                form.update({ external_link_url: e.target.value });
                                            }}
                                        />
                                    </div>
                                    <FormError error={form.errors?.external_link_url} />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {!form.values.external_page && (
                    <div className="card-section card-section-primary">
                        <div className="row">
                            <div className="col col-lg-9 col-xs-12">
                                <div className="form-group form-group-inline">
                                    <label className="form-label">{translate('funds_edit.labels.description')}</label>
                                    <div className="form-offset">
                                        <MarkdownEditor
                                            value={form.values?.description_html || ''}
                                            onChange={(description) => form.update({ description })}
                                            extendedOptions={true}
                                            placeholder={translate('organization_edit.labels.description')}
                                        />
                                    </div>
                                    <FormError error={form.errors?.description} />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {!form.values.external_page && (
                    <div className="card-section card-section-primary">
                        <div className="form-group form-group-inline">
                            <label className="form-label">Titel van blok</label>
                            <input
                                className="form-control"
                                placeholder="Veel gestelde vragen"
                                value={form.values.faq_title || ''}
                                onChange={(e) => {
                                    form.update({ faq_title: e.target.value });
                                }}
                            />
                            <FormError error={form.errors?.faq_title} />
                        </div>

                        <div className="form-group form-group-inline">
                            <label className="form-label">Veel gestelde vragen</label>
                            <div className="form-offset">
                                <FaqEditor
                                    faq={faq}
                                    organization={activeOrganization}
                                    setFaq={setFaq}
                                    errors={form?.errors}
                                    setErrors={(errors: ResponseErrorData) => form.setErrors(errors)}
                                    createFaqRef={faqEditorBlock}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {!form.values.external_page && (
                    <div className="card-section card-section-primary">
                        <div className="row">
                            <div className="col col-lg-9 col-lg-12">
                                <div className="form-group form-group-inline">
                                    <label className="form-label form-label-required">
                                        {translate('funds_edit.labels.description_position')}
                                    </label>
                                    <div className="form-offset">
                                        <SelectControl
                                            propKey={'value'}
                                            allowSearch={false}
                                            value={form.values.description_position}
                                            options={descriptionPositions}
                                            onChange={(description_position: string) => {
                                                form.update({ description_position });
                                            }}
                                        />
                                        <FormError error={form.errors?.description_position} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="card-section card-section-primary">
                    <div className="row">
                        <div className="col col-lg-9 col-lg-12">
                            <div className="form-group form-group-inline">
                                <label className="form-label form-label-required">
                                    {translate('funds_edit.labels.start')}
                                </label>
                                <DatePickerControl
                                    value={dateParse(form.values.start_date)}
                                    dateFormat="dd-MM-yyyy"
                                    placeholder={translate('dd-MM-yyyy')}
                                    disabled={
                                        form.values.state != 'waiting' ||
                                        !hasPermission(activeOrganization, 'manage_funds')
                                    }
                                    onChange={(start_date: Date) => {
                                        form.update({ start_date: dateFormat(start_date) });
                                    }}
                                />
                                <FormError error={form.errors?.start_date} />
                            </div>

                            <div className="form-group form-group-inline">
                                <label className="form-label form-label-required">
                                    {translate('funds_edit.labels.end')}
                                </label>
                                <DatePickerControl
                                    value={dateParse(form.values.end_date)}
                                    dateFormat="dd-MM-yyyy"
                                    maxYear={new Date().getFullYear() + 10}
                                    placeholder={translate('dd-MM-yyyy')}
                                    disabled={
                                        form.values.state != 'waiting' ||
                                        !hasPermission(activeOrganization, 'manage_funds')
                                    }
                                    onChange={(end_date: Date) => {
                                        form.update({ end_date: dateFormat(end_date) });
                                    }}
                                />
                                <FormError error={form.errors?.end_date} />
                            </div>
                        </div>
                    </div>
                </div>

                {hasFundFormula && (
                    <div className="card-section card-section-primary">
                        {(form.values.formula_products as FundFormulaProduct[]).map((formulaProduct, index) => (
                            <div className="form-group form-group-inline" key={index}>
                                <div className="form-label">
                                    {index == 0 ? translate('funds_edit.labels.products') : ''}
                                </div>

                                <div className="form-offset">
                                    <div className="flex-row">
                                        <div className="flex-col flex-grow">
                                            <div className="flex-row flex-grow">
                                                <div className="flex-col flex-col-4">
                                                    <SelectControl
                                                        propKey={'id'}
                                                        value={formulaProduct.product_id}
                                                        placeholder="Selecteer aanbieding..."
                                                        options={productOptions?.[index] || []}
                                                        disabled={!hasPermission(activeOrganization, 'manage_funds')}
                                                        onChange={(product_id: number) => {
                                                            updateFormFormulaProduct(index, 'product_id', product_id);
                                                        }}
                                                    />
                                                    <FormError
                                                        error={form.errors?.[`formula_products.${index}.product_id`]}
                                                    />
                                                </div>
                                                <div className="flex-col flex-col-2">
                                                    <SelectControl
                                                        propKey={'key'}
                                                        value={formulaProduct.record_type_key_multiplier}
                                                        placeholder="Selecteer aanbieding..."
                                                        options={recordTypesMultiplier}
                                                        disabled={!hasPermission(activeOrganization, 'manage_funds')}
                                                        onChange={(record_type_key_multiplier: string) => {
                                                            updateFormFormulaProduct(
                                                                index,
                                                                'record_type_key_multiplier',
                                                                record_type_key_multiplier,
                                                            );
                                                        }}
                                                    />
                                                    <FormError
                                                        error={
                                                            form.errors?.[
                                                                `formula_products.${index}.record_type_key_multiplier`
                                                            ]
                                                        }
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex-col">
                                            <div
                                                className="button button-primary button-icon"
                                                onClick={() => {
                                                    form.values.formula_products.splice(index, 1);
                                                    updateForm({ formula_products: form.values.formula_products });
                                                }}>
                                                <em className="mdi mdi-close" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}

                        <div className="form-group form-group-inline">
                            <label className="form-label">
                                {!form.values.formula_products.length ? translate('funds_edit.labels.products') : ''}
                            </label>
                            <div className="button button-primary" onClick={() => addProduct()}>
                                <em className="mdi mdi-plus-circle icon-start" />
                                Aanbieding toevoegen
                            </div>
                        </div>
                    </div>
                )}

                {!form.values.external_page && (
                    <div className="card-section card-section-primary">
                        <div className="row">
                            <div className="form-group form-group-inline col col-lg-9 col-md-12">
                                <label className="form-label">Standaard validator</label>
                                <div className="form-offset">
                                    <SelectControl
                                        propKey={'id'}
                                        propValue={'email'}
                                        allowSearch={false}
                                        value={form.values.default_validator_employee_id}
                                        options={validators}
                                        disabled={!hasPermission(activeOrganization, 'manage_funds')}
                                        onChange={(default_validator_employee_id: number) => {
                                            form.update({ default_validator_employee_id });
                                        }}
                                    />
                                </div>
                                <FormError error={form.errors?.default_validator_employee_id} />
                            </div>

                            {form.values.default_validator_employee_id && (
                                <div className="form-group form-group-inline col col-lg-9 col-md-12">
                                    <label className="form-label">Aanmeldingen</label>
                                    <CheckboxControl
                                        title={'Automatisch goedkeuren wanneer er een BSN-nummer vast staat.'}
                                        disabled={!hasPermission(activeOrganization, 'manage_funds')}
                                        checked={form.values.auto_requests_validation}
                                        onChange={(e) => {
                                            form.update({ auto_requests_validation: e.target.checked });
                                        }}
                                    />
                                    <FormError error={form.errors?.auto_requests_validation} />
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {appConfigs.organizations.funds.criteria && !form.values.external_page && (
                    <Fragment>
                        {(form.values.criteria.length > 0 || hasPermission(activeOrganization, 'manage_funds')) && (
                            <div className="card-section card-section-primary">
                                <div className="form-group form-group-inline">
                                    <div className="form-label">Criteria</div>
                                    <div className="form-offset">
                                        <FundCriteriaEditor
                                            fund={fund}
                                            organization={activeOrganization}
                                            criteria={form.values.criteria}
                                            isEditable={!fundId || fund.criteria_editable}
                                            setCriteria={(criteria) => form.update({ criteria })}
                                            recordTypes={recordTypes}
                                            validatorOrganizations={validatorOrganizations?.data}
                                            saveCriteriaRef={criteriaBlockRef}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </Fragment>
                )}

                {!form.values.external_page && (
                    <div className="card-section card-section-primary">
                        <div className="row">
                            <div className="col col-lg-9 col-lg-12">
                                <div className="form-group form-group-inline">
                                    <div className="form-label">Instellingen aanvraagformulier</div>
                                    <div className="form-offset">
                                        <FundConfigContactInfoEditor
                                            value={form.values}
                                            onChange={form.update}
                                            disabled={!hasPermission(activeOrganization, 'manage_funds')}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {!form.values.external_page && (
                    <div className="card-section card-section-primary">
                        <div className="row">
                            <div className="col col-lg-9 col-lg-12">
                                <div className="form-group form-group-inline">
                                    <div className="form-label">
                                        {translate('funds_edit.labels.notification_amount')}
                                    </div>
                                    <input
                                        className="form-control"
                                        type="number"
                                        value={form.values.notification_amount || ''}
                                        onChange={(e) => {
                                            form.update({ notification_amount: e.target.value });
                                        }}
                                        disabled={!hasPermission(activeOrganization, 'manage_funds')}
                                        placeholder={translate('funds_edit.labels.notification_amount')}
                                    />
                                    <FormError error={form.errors?.notification_amount} />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="card-section card-section-primary">
                    <div className="text-center">
                        <StateNavLink
                            name={'organization-funds'}
                            params={{ organizationId: activeOrganization.id }}
                            className="button button-default"
                            id="cancel">
                            {translate('funds_edit.buttons.cancel')}
                        </StateNavLink>
                        <button type="submit" className="button button-primary">
                            {translate('funds_edit.buttons.confirm')}
                        </button>
                    </div>
                </div>
            </form>
        </Fragment>
    );
}
