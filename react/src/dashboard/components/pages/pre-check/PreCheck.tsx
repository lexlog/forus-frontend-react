import React, { Fragment, useCallback, useEffect, useState } from 'react';
import useFormBuilder from '../../../hooks/useFormBuilder';
import LoadingCard from '../../elements/loading-card/LoadingCard';
import Implementation from '../../../props/models/Implementation';
import SelectControl from '../../elements/select-control/SelectControl';
import SelectControlOptions from '../../elements/select-control/templates/SelectControlOptions';
import Media from '../../../props/models/Media';
import FormError from '../../elements/forms/errors/FormError';
import Fund from '../../../props/models/Fund';
import { PaginationData, ResponseError } from '../../../props/ApiResponses';
import PreCheck from '../../../props/models/PreCheck';
import PreCheckStepEditor from './elements/PreCheckStepEditor';
import EmptyCard from '../../elements/empty-card/EmptyCard';
import { getStateRouteUrl, useNavigateState } from '../../../modules/state_router/Router';
import useActiveOrganization from '../../../hooks/useActiveOrganization';
import PhotoSelector from '../../elements/photo-selector/PhotoSelector';
import useImplementationService from '../../../services/ImplementationService';
import { useFundService } from '../../../services/FundService';
import usePreCheckService from '../../../services/PreCheckService';
import { useMediaService } from '../../../services/MediaService';
import usePushDanger from '../../../hooks/usePushDanger';
import usePushSuccess from '../../../hooks/usePushSuccess';
import PreCheckRecord from '../../../props/models/PreCheckRecord';
import { uniqueId } from 'lodash';
import useSetProgress from '../../../hooks/useSetProgress';
import useTranslate from '../../../hooks/useTranslate';
import useAssetUrl from '../../../hooks/useAssetUrl';
import StateNavLink from '../../../modules/state_router/StateNavLink';

export default function PreCheck() {
    const activeOrganization = useActiveOrganization();

    const assetUrl = useAssetUrl();
    const translate = useTranslate();
    const pushDanger = usePushDanger();
    const pushSuccess = usePushSuccess();
    const setProgress = useSetProgress();
    const navigateState = useNavigateState();

    const fundService = useFundService();
    const mediaService = useMediaService();
    const preCheckService = usePreCheckService();
    const implementationService = useImplementationService();

    const [mediaFile, setMediaFile] = useState<Blob>(null);
    const [deleteMedia, setDeleteMedia] = useState<boolean>(false);
    const [thumbnailMedia, setThumbnailMedia] = useState<Media>(null);
    const [funds, setFunds] = useState<PaginationData<Fund>>(null);
    const [preChecks, setPreChecks] = useState<Array<PreCheck>>(null);
    const [implementation, setImplementation] = useState<Implementation>(null);
    const [implementations, setImplementations] = useState<Array<Implementation>>(null);

    const [bannerStates] = useState([
        { value: 'draft', name: 'Nee' },
        { value: 'public', name: 'Ja' },
    ]);

    const [enableOptions] = useState([
        { key: false, name: `Uitgeschakeld` },
        { key: true, name: `Actief` },
    ]);

    const preCheckForm = useFormBuilder(
        {
            implementation_id: null,
            pre_check_enabled: false,
            pre_check_title: '',
            pre_check_description: '',
        },
        (values) => {
            preCheckService
                .sync(activeOrganization.id, implementation.id, {
                    ...values,
                    pre_checks: preChecks,
                })
                .then((res) => {
                    preCheckForm.setErrors(null);
                    pushSuccess('Opgeslagen!');

                    setPreChecks((preChecks) => {
                        const data = transformPreChecks(res.data.data);

                        preChecks.forEach((preCheck, index) => {
                            data[index] ? (data[index].uid = preCheck.uid) : null;
                        });

                        return data;
                    });

                    implementationService
                        .read(activeOrganization.id, implementation.id)
                        .then((res) => setImplementation(res.data.data));
                })
                .catch((err: ResponseError) => {
                    preCheckForm.setErrors(err.data.errors);
                    pushDanger(err.data?.message || 'Onbekende foutmelding!');
                })
                .finally(() => preCheckForm.setIsLocked(false));
        },
    );

    const bannerForm = useFormBuilder(
        {
            pre_check_banner_state: bannerStates[0].value,
            pre_check_banner_label: '',
            pre_check_banner_title: '',
            pre_check_banner_description: '',
        },
        async (values) => {
            const media = await storeMedia(mediaFile);

            implementationService
                .updatePreCheckBanner(activeOrganization.id, implementation.id, {
                    ...values,
                    ...(media ? { pre_check_media_uid: media.uid } : {}),
                })
                .then(() => {
                    bannerForm.setErrors(null);
                    pushSuccess('Opgeslagen!');
                })
                .catch((err: ResponseError) => {
                    bannerForm.setErrors(err.data.errors);
                    pushDanger(err.data?.message || 'Onbekende foutmelding!');
                })
                .finally(() => bannerForm.setIsLocked(false));
        },
    );

    const { update: updatePreCheckForm, reset: resetPreCheckForm } = preCheckForm;
    const { update: updateBannerForm, reset: resetBannerForm } = bannerForm;

    const selectPhoto = useCallback((file: Blob) => {
        setMediaFile(file);
        setDeleteMedia(false);
    }, []);

    const storeMedia = useCallback(
        async (mediaFile): Promise<Media> => {
            if (deleteMedia) {
                await mediaService.delete(implementation.pre_check_banner.uid);
            }

            if (mediaFile) {
                return await mediaService
                    .store('pre_check_banner', mediaFile)
                    .then((res) => res.data?.data)
                    .catch((err: ResponseError) => {
                        pushDanger('Mislukt!', err.data?.message || 'Onbekende foutmelding!');
                        return null;
                    });
            }

            return null;
        },
        [deleteMedia, implementation?.pre_check_banner?.uid, mediaService, pushDanger],
    );

    const transformPreCheckRecordTypes = useCallback((recordTypes) => {
        return recordTypes.map((recordType: PreCheckRecord) => ({
            ...recordType,
            record_settings: recordType.funds.map((fund) => {
                return (
                    recordType.record_settings.find((setting) => setting.fund_id == fund.id) || {
                        implementation_name: fund.implementation?.name,
                        implementation_url_webshop: fund.implementation.url_webshop,
                        fund_id: fund.id,
                        fund_name: fund.name,
                        fund_logo: fund.logo,
                        description: '',
                        impact_level: 100,
                        is_knock_out: false,
                    }
                );
            }),
        }));
    }, []);

    const transformPreChecks = useCallback(
        (preChecks: Array<PreCheck>) => {
            return preChecks.map((preCheck: PreCheck) => ({
                ...preCheck,
                uid: uniqueId(),
                record_types: transformPreCheckRecordTypes(preCheck.record_types),
            }));
        },
        [transformPreCheckRecordTypes],
    );

    const fetchPreChecks = useCallback(
        async (implementation_id: number) => {
            setProgress(0);

            return preCheckService
                .list(activeOrganization.id, implementation_id)
                .then((res) => transformPreChecks(res.data.data))
                .finally(() => setProgress(100));
        },
        [activeOrganization.id, setProgress, preCheckService, transformPreChecks],
    );

    const fetchImplementations = useCallback(() => {
        implementationService
            .list(activeOrganization.id, { per_page: 100 })
            .then((res) => {
                setImplementations(res.data.data);
                setImplementation(res.data.data[0]);
            })
            .finally(() => setProgress(100));
    }, [activeOrganization, implementationService, setProgress]);

    const fetchFunds = useCallback(() => {
        setProgress(0);

        fundService
            .list(activeOrganization.id, { per_page: 100, configured: 1 })
            .then((res) => setFunds(res.data))
            .finally(() => setProgress(100));
    }, [activeOrganization.id, fundService, setProgress]);

    useEffect(() => {
        fetchImplementations();
    }, [fetchImplementations]);

    useEffect(() => {
        fetchFunds();
    }, [fetchFunds]);

    useEffect(() => {
        setMediaFile(null);
        setThumbnailMedia(implementation?.pre_check_banner);

        if (implementation) {
            updateBannerForm({
                pre_check_banner_state: implementation.pre_check_banner_state,
                pre_check_banner_label: implementation.pre_check_banner_label,
                pre_check_banner_title: implementation.pre_check_banner_title,
                pre_check_banner_description: implementation.pre_check_banner_description,
            });

            updatePreCheckForm({
                implementation_id: implementation.id,
                pre_check_enabled: implementation.pre_check_enabled,
                pre_check_title: implementation.pre_check_title,
                pre_check_description: implementation.pre_check_description,
            });
        } else {
            resetBannerForm();
            resetPreCheckForm();
        }
    }, [implementation, resetBannerForm, resetPreCheckForm, updateBannerForm, updatePreCheckForm]);

    useEffect(() => {
        if (activeOrganization?.allow_pre_checks && implementation?.organization_id == activeOrganization?.id) {
            fetchPreChecks(implementation?.id).then((preChecks) => setPreChecks(preChecks));
        } else {
            setPreChecks(null);
        }
    }, [activeOrganization, fetchPreChecks, implementation?.id, implementation?.organization_id]);

    useEffect(() => {
        if (!activeOrganization?.allow_pre_checks) {
            navigateState('organizations');
        }
    }, [activeOrganization?.allow_pre_checks, navigateState]);

    if (!implementations || !funds) {
        return <LoadingCard />;
    }

    return (
        <Fragment>
            {!implementation && (
                <EmptyCard
                    title={"You don't have any implementations"}
                    description={
                        'In order to user prechecks you need to have at least one implementation and at least one fund.'
                    }
                />
            )}

            {implementation && (
                <div className="card">
                    <form className="form" onSubmit={preCheckForm.submit}>
                        <div className="card-header flex-row">
                            <div className="card-title">{translate('funds_pre_check.header.title')}</div>

                            <div className="flex flex-grow flex-end">
                                {implementation.pre_check_enabled && (
                                    <a
                                        className="button button-text button-sm"
                                        href={implementation.pre_check_url}
                                        target="_blank"
                                        rel="noreferrer">
                                        Bekijk pagina
                                        <em className="mdi mdi-open-in-new icon-end" />
                                    </a>
                                )}

                                <button className="button button-primary button-sm" type="submit">
                                    {translate('funds_edit.buttons.confirm')}
                                </button>
                            </div>
                        </div>

                        <div className="card-section card-section-primary">
                            <div className="row">
                                <div className="col col-lg-12 col-xs-12">
                                    {implementations.length > 1 && (
                                        <div className="form-group">
                                            <label className="form-label">
                                                {translate('funds_pre_check.labels.implementation')}
                                            </label>
                                            <SelectControl
                                                className="form-control"
                                                allowSearch={false}
                                                options={implementations}
                                                value={implementation}
                                                onChange={(implementation: Implementation) => {
                                                    setImplementation(implementation);
                                                }}
                                                optionsComponent={SelectControlOptions}
                                            />
                                            <FormError error={preCheckForm.errors?.implementation_id} />
                                        </div>
                                    )}

                                    <div className="form-group">
                                        <label className="form-label">
                                            {translate('funds_pre_check.labels.status')}
                                        </label>
                                        <SelectControl
                                            className="form-control"
                                            propKey={'key'}
                                            allowSearch={false}
                                            options={enableOptions}
                                            value={preCheckForm.values.pre_check_enabled}
                                            onChange={(pre_check_enabled: boolean) => {
                                                preCheckForm.update({ pre_check_enabled });
                                            }}
                                            optionsComponent={SelectControlOptions}
                                        />
                                        <FormError error={preCheckForm.errors?.pre_check_enabled} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="card-section card-section-primary">
                            <div className="row">
                                <div className="col col-lg-12 col-xs-12">
                                    <div className="card-heading">
                                        {translate('funds_pre_check.labels.description_title')}
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label form-label-required">
                                            {translate('funds_pre_check.labels.title')}
                                        </label>
                                        <input
                                            className="form-control r-n"
                                            placeholder={translate('funds_pre_check.labels.title')}
                                            value={preCheckForm.values.pre_check_title || ''}
                                            onChange={(e) => {
                                                preCheckForm.update({ pre_check_title: e?.target.value });
                                            }}
                                        />
                                        <FormError error={preCheckForm.errors?.pre_check_title} />
                                        <div className="form-hint">Max. 50 tekens</div>
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">
                                            {translate('funds_pre_check.labels.description')}
                                        </label>
                                        <textarea
                                            className="form-control r-n"
                                            value={preCheckForm.values.pre_check_description || ''}
                                            onChange={(e) => {
                                                preCheckForm.update({ pre_check_description: e.target.value });
                                            }}
                                            placeholder="Voeg omschrijving toe"
                                        />
                                        <FormError error={preCheckForm.errors?.pre_check_description} />
                                        <div className="form-hint">Max. 1000 tekens</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {funds.meta.total > 0 && preChecks && (
                            <div className="card-section card-section-primary">
                                <div className="row">
                                    <div className="col col-lg-12 col-xs-12">
                                        <div className="card-heading">Stappen ({preChecks?.length || 0})</div>

                                        <PreCheckStepEditor
                                            preChecks={preChecks}
                                            setPreChecks={setPreChecks}
                                            errors={preCheckForm.errors}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="card-section card-section-primary">
                            <div className="row">
                                <div className="col col-lg-12 col-xs-12">
                                    {funds.meta.total == 0 && (
                                        <EmptyCard
                                            title={'Geen fondsen gevonden'}
                                            imageIcon={assetUrl('/assets/img/no-funds-icon.svg')}
                                            description={[
                                                'Op dit moment lijkt u geen actieve fondsen te hebben.',
                                                'Voordat u verder gaat, moet u eerst een fonds aanmaken.',
                                            ].join(' ')}
                                            button={{
                                                text: 'Ga naar de fondsenpagina',
                                                type: 'primary',
                                                icon: 'plus',
                                                to: getStateRouteUrl('funds-create', {
                                                    organizationId: activeOrganization.id,
                                                }),
                                            }}
                                        />
                                    )}

                                    <div className="block block-info-box block-info-box-default block-info-box-dashed">
                                        <div className="info-box-icon mdi mdi-information flex-center flex-vertical" />
                                        <div className="info-box-content">
                                            <div className="block block-markdown">
                                                <p>
                                                    U heeft de mogelijkheid om extra stappen toe te voegen die zichtbaar
                                                    zullen zijn in de Pre-Check voor de aanvrager.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="card-section">
                            <div className="text-right">
                                <button className="button button-default" type="button" id="cancel">
                                    {translate('funds_edit.buttons.cancel')}
                                </button>

                                <button className="button button-primary" type="submit">
                                    {translate('funds_edit.buttons.confirm')}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            )}

            {implementation && (
                <div className="card">
                    <form className="form" onSubmit={bannerForm.submit}>
                        <div className="card-header">
                            <div className="card-title">Homepagina banner</div>
                        </div>

                        <div className="card-section card-section-primary">
                            <div className="form-group">
                                <div className="form-offset">
                                    <PhotoSelector
                                        type={'pre_check_banner'}
                                        thumbnail={thumbnailMedia?.sizes.thumbnail}
                                        selectPhoto={selectPhoto}
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <div className="form-label">Actieve banner</div>
                                <div className="form-offset">
                                    <SelectControl
                                        className={'form-control'}
                                        propKey={'value'}
                                        allowSearch={false}
                                        options={bannerStates}
                                        optionsComponent={SelectControlOptions}
                                        value={bannerForm.values.pre_check_banner_state}
                                        onChange={(pre_check_banner_state: string) => {
                                            bannerForm.update({ pre_check_banner_state });
                                        }}
                                    />
                                    <FormError error={bannerForm.errors?.pre_check_banner_state} />
                                </div>
                            </div>

                            <div className="form-group">
                                <div className="form-label form-label-required">
                                    {translate('funds_pre_check.labels.title')}
                                </div>
                                <div className="form-offset">
                                    <input
                                        className={'form-control r-n'}
                                        placeholder={translate('funds_pre_check.labels.title')}
                                        value={bannerForm.values.pre_check_banner_title || ''}
                                        onChange={(e) => {
                                            bannerForm.update({ pre_check_banner_title: e.target.value });
                                        }}
                                    />
                                    <FormError error={bannerForm.errors?.pre_check_banner_title} />
                                </div>
                            </div>

                            <div className="form-group">
                                <div className="form-label form-label-required">
                                    {translate('funds_pre_check.labels.description')}
                                </div>
                                <div className="form-offset">
                                    <textarea
                                        className={'form-control r-n'}
                                        placeholder={translate('funds_pre_check.labels.description')}
                                        value={bannerForm.values.pre_check_banner_description || ''}
                                        onChange={(e) => {
                                            bannerForm.update({ pre_check_banner_description: e.target.value });
                                        }}
                                    />
                                    <FormError error={bannerForm.errors?.pre_check_banner_description} />
                                </div>
                            </div>

                            <div className="form-group">
                                <div className="form-label">{translate('funds_pre_check.labels.label')}</div>
                                <div className="form-offset">
                                    <input
                                        className={'form-control r-n'}
                                        placeholder={translate('funds_pre_check.labels.label')}
                                        value={bannerForm.values.pre_check_banner_label || ''}
                                        onChange={(e) => {
                                            bannerForm.update({ pre_check_banner_label: e.target.value });
                                        }}
                                    />
                                    <FormError error={bannerForm.errors?.pre_check_banner_label} />
                                </div>
                            </div>

                            <div className="block block-info-box block-info-box-default block-info-box-dashed">
                                <div className="info-box-icon mdi mdi-information flex-center flex-vertical text-primary-light" />
                                <div className="info-box-content">
                                    <div className="block block-markdown">
                                        <p>
                                            U heeft de mogelijkheid om een banner toe te voegen en aan te passen die op
                                            de startpagina van de webshop wordt weergegeven.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="card-section">
                            <div className="text-right">
                                <StateNavLink id="cancel" name={'organizations'} className={'button button-default'}>
                                    {translate('funds_edit.buttons.cancel')}
                                </StateNavLink>

                                <button className="button button-primary" type="submit">
                                    {translate('funds_edit.buttons.confirm')}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            )}
        </Fragment>
    );
}
