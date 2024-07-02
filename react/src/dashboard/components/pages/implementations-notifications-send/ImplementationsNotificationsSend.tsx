import React, { Fragment, useCallback, useEffect, useState } from 'react';
import useActiveOrganization from '../../../hooks/useActiveOrganization';
import LoadingCard from '../../elements/loading-card/LoadingCard';
import usePushSuccess from '../../../hooks/usePushSuccess';
import usePushDanger from '../../../hooks/usePushDanger';
import StateNavLink from '../../../modules/state_router/StateNavLink';
import useSetProgress from '../../../hooks/useSetProgress';
import { PaginationData, ResponseError, ResponseErrorData } from '../../../props/ApiResponses';
import useImplementationService from '../../../services/ImplementationService';
import { useParams } from 'react-router-dom';
import Implementation from '../../../props/models/Implementation';
import { useNavigateState } from '../../../modules/state_router/Router';
import { hasPermission } from '../../../helpers/utils';
import SelectControlOptions from '../../elements/select-control/templates/SelectControlOptions';
import SelectControl from '../../elements/select-control/SelectControl';
import ThSortable from '../../elements/tables/ThSortable';
import useFilter from '../../../hooks/useFilter';
import usePaginatorService from '../../../modules/paginator/services/usePaginatorService';
import Paginator from '../../../modules/paginator/components/Paginator';
import Identity from '../../../props/models/Sponsor/Identity';
import Fund from '../../../props/models/Fund';
import { useFundService } from '../../../services/FundService';
import useImplementationNotificationService from '../../../services/ImplementationNotificationService';
import ModalDangerZone from '../../modals/ModalDangerZone';
import useOpenModal from '../../../hooks/useOpenModal';
import SystemNotificationTemplateEditor from '../implementations-notifications-edit/elements/SystemNotificationTemplateEditor';
import SystemNotification from '../../../props/models/SystemNotification';
import useFundIdentitiesExportService from '../../../services/exports/useFundIdentitiesExportService';
import useTranslate from '../../../hooks/useTranslate';
import EmptyCard from '../../elements/empty-card/EmptyCard';

export default function ImplementationsNotificationsSend() {
    const { id } = useParams();
    const activeOrganization = useActiveOrganization();

    const openModal = useOpenModal();
    const translate = useTranslate();
    const pushDanger = usePushDanger();
    const pushSuccess = usePushSuccess();
    const setProgress = useSetProgress();
    const navigateState = useNavigateState();

    const paginatorService = usePaginatorService();
    const implementationService = useImplementationService();
    const fundService = useFundService();
    const fundIdentitiesExportService = useFundIdentitiesExportService();
    const implementationNotificationsService = useImplementationNotificationService();

    const [fund, setFund] = useState<Fund>(null);
    const [funds, setFunds] = useState<Array<Fund>>(null);
    const [errors, setErrors] = useState<ResponseErrorData>(null);
    const [editing, setEditing] = useState(false);

    const [identities, setIdentities] =
        useState<PaginationData<Identity, { counts: { active: number; selected: number; without_email: number } }>>(
            null,
        );

    const [submitting, setSubmitting] = useState(false);
    const [perPageKey] = useState('notification_identities');
    const [previewSent, setPreviewSent] = useState(false);
    const [targetGroup, setTargetGroup] = useState('identities');
    const [implementation, setImplementation] = useState<Implementation>(null);
    const [showIdentities, setShowIdentities] = useState(false);
    const [submittingToSelf, setSubmittingToSelf] = useState(false);
    const [lastIdentitiesQuery, setLastIdentitiesQuery] = useState(null);
    const [variableValues, setVariableValues] = useState<{
        fund_name?: string;
        sponsor_name?: string;
    }>(null);

    const [notification] = useState<SystemNotification>(
        implementationNotificationsService.makeCustomNotification(
            'Aanvraag is ontvangen',
            [
                '<h1>:fund_name</h1>',
                '[email_logo]',
                '<br>',
                'Inhoud van de e-mail',
                '<br>',
                'Verander de inhoud van de e-mail',
                '<br>',
                '<br>',
                ':webshop_button',
            ].join('\n'),
        ),
    );

    const [template, setTemplate] = useState(
        notification.templates_default.find((template) => template.type === 'mail'),
    );

    const [identityTargets] = useState([
        { value: 'all', name: 'Alle gebruikers met een actieve voucher' },
        {
            value: 'has_balance',
            name: 'Alle gebruikers die nog budget beschikbaar hebben of een ongebruike reservering en/of aanbiedings voucher',
        },
    ]);

    const [providerTargets] = useState([
        { value: 'providers_approved', name: 'Alleen geaccepteerde aanbieders' },
        { value: 'providers_rejected', name: 'Alle aanbieders niet nog niet geaccepteerd of geweigerd zijn' },
        { value: 'providers_all', name: 'Alle aanbieders' },
    ]);

    const identitiesFilters = useFilter({
        q: '',
        target: identityTargets[0].value,
        with_reservations: 1,
        per_page: paginatorService.getPerPage(perPageKey),
        order_by: 'id',
        order_dir: 'asc',
    });

    const providersFilters = useFilter({
        q: '',
        target: providerTargets[0].value,
        per_page: paginatorService.getPerPage(perPageKey),
        order_by: 'created_at',
        order_dir: 'desc',
    });

    const exportIdentities = useCallback(() => {
        fundIdentitiesExportService.exportData(activeOrganization.id, fund.id, identitiesFilters.activeValues);
    }, [activeOrganization?.id, fund?.id, fundIdentitiesExportService, identitiesFilters.activeValues]);

    const onTemplateUpdated = useCallback(
        (item: SystemNotification) => {
            const templates = item?.templates || notification?.templates_default;
            const templateItem = templates.find((item) => item.type === 'mail');

            setTemplate((template) => ({
                ...template,
                ...templateItem,
            }));
        },
        [notification?.templates_default],
    );

    const askConfirmation = useCallback(
        (target, onConfirm) => {
            const descriptionKey =
                {
                    all: 'description_identities_all',
                    has_balance: 'description_identities_has_balance',
                    providers_all: 'description_providers_all',
                    providers_approved: 'description_providers_approved',
                    providers_rejected: 'description_providers_rejected',
                }[target] || 'description';

            openModal((modal) => (
                <ModalDangerZone
                    modal={modal}
                    title={translate('modals.danger_zone.confirm_custom_sponsor_email_notification.title')}
                    description={translate(
                        `modals.danger_zone.confirm_custom_sponsor_email_notification.${descriptionKey}`,
                        {
                            identity_count: identities.meta.counts.selected,
                        },
                    )}
                    buttonCancel={{
                        text: translate('modals.danger_zone.confirm_custom_sponsor_email_notification.buttons.cancel'),
                        onClick: () => modal.close(),
                    }}
                    buttonSubmit={{
                        text: translate('modals.danger_zone.confirm_custom_sponsor_email_notification.buttons.confirm'),
                        onClick: () => {
                            modal.close();
                            onConfirm();
                        },
                    }}
                />
            ));
        },
        [identities?.meta?.counts?.selected, openModal, translate],
    );

    const askConfirmationToMyself = useCallback(
        (onConfirm) => {
            openModal((modal) => (
                <ModalDangerZone
                    modal={modal}
                    title={translate('modals.danger_zone.confirm_custom_sponsor_email_notification.title_self')}
                    description={translate(
                        'modals.danger_zone.confirm_custom_sponsor_email_notification.description_self',
                    )}
                    buttonCancel={{
                        text: translate('modals.danger_zone.confirm_custom_sponsor_email_notification.buttons.cancel'),
                        onClick: () => modal.close(),
                    }}
                    buttonSubmit={{
                        text: translate('modals.danger_zone.confirm_custom_sponsor_email_notification.buttons.confirm'),
                        onClick: () => {
                            modal.close();
                            onConfirm();
                        },
                    }}
                />
            ));
        },
        [openModal, translate],
    );

    const onError = useCallback(
        (res: ResponseError) => {
            pushDanger('Error!', res.data.message);

            if (res.status === 422) {
                setErrors(res.data.errors);
            }
        },
        [pushDanger],
    );

    const submit = useCallback(() => {
        if (submitting) {
            return false;
        }

        const target =
            targetGroup == 'identities'
                ? identitiesFilters?.activeValues.target
                : providersFilters?.activeValues.target;

        askConfirmation(target, () => {
            setSubmitting(true);
            setProgress(0);

            fundService
                .sendNotification(activeOrganization.id, fund.id, {
                    ...identitiesFilters.activeValues,
                    target: target,
                    subject: implementationNotificationsService.labelsToVars(template.title),
                    content: implementationNotificationsService.labelsToVars(template.content),
                })
                .then(() => {
                    navigateState('implementation-notifications', {
                        organizationId: activeOrganization.id,
                        implementationId: implementation.id,
                    });

                    pushSuccess('Gelukt!', 'De e-mail zal zo spoedig mogelijk verstuurd worden naar alle gebruikers.', {
                        timeout: 8000,
                    });
                })
                .catch((res: ResponseError) => {
                    setSubmitting(false);
                    onError(res);
                })
                .finally(() => setProgress(100));
        });
    }, [
        onError,
        fund?.id,
        navigateState,
        submitting,
        fundService,
        pushSuccess,
        setProgress,
        targetGroup,
        askConfirmation,
        template?.title,
        template?.content,
        implementation?.id,
        activeOrganization.id,
        identitiesFilters?.activeValues,
        implementationNotificationsService,
        providersFilters?.activeValues?.target,
    ]);

    const sendToMyself = useCallback(() => {
        if (submittingToSelf) {
            return;
        }

        askConfirmationToMyself(() => {
            setSubmittingToSelf(true);
            setProgress(0);

            fundService
                .sendNotification(activeOrganization.id, fund.id, {
                    target: 'self',
                    subject: implementationNotificationsService.labelsToVars(template.title),
                    content: implementationNotificationsService.labelsToVars(template.content),
                })
                .then(() => {
                    setPreviewSent(true);
                    pushSuccess('Gelukt!', 'Bekijk de e-mail in je postvak');
                })
                .catch((res: ResponseError) => onError(res))
                .finally(() => {
                    setSubmittingToSelf(false);
                    setProgress(100);
                });
        });
    }, [
        onError,
        fund?.id,
        pushSuccess,
        setProgress,
        fundService,
        template?.title,
        submittingToSelf,
        template?.content,
        activeOrganization.id,
        askConfirmationToMyself,
        implementationNotificationsService,
    ]);

    const updateVariableValues = useCallback(() => {
        if (fund) {
            setVariableValues({
                fund_name: fund.name,
                sponsor_name: fund.organization.name,
            });
        }
    }, [fund]);

    const fetchImplementation = useCallback(() => {
        implementationService
            .read(activeOrganization.id, parseInt(id))
            .then((res) => {
                if (!activeOrganization.allow_custom_fund_notifications) {
                    navigateState('implementation-notifications', {
                        organizationId: activeOrganization.id,
                        implementationId: res.data.data.id,
                    });
                }

                setImplementation(res.data.data);
            })
            .catch((res: ResponseError) => pushDanger('Mislukt!', res.data.message));
    }, [
        id,
        navigateState,
        pushDanger,
        implementationService,
        activeOrganization.id,
        activeOrganization.allow_custom_fund_notifications,
    ]);

    const fetchFunds = useCallback(() => {
        fundService
            .list(activeOrganization.id, { implementation_id: implementation.id, state: 'active' })
            .then((res) => {
                setFunds(res.data.data);
                setFund(res.data.data[0]);
            })
            .catch((res: ResponseError) => pushDanger('Mislukt!', res.data.message));
    }, [fundService, activeOrganization.id, implementation?.id, pushDanger]);

    const fetchFundIdentities = useCallback(() => {
        if (fund) {
            setProgress(0);

            fundService
                .listIdentities(activeOrganization.id, fund.id, identitiesFilters.activeValues)
                .then((res) => setIdentities(res.data))
                .catch((res: ResponseError) => pushDanger('Mislukt!', res.data.message))
                .finally(() => {
                    setLastIdentitiesQuery(identitiesFilters.activeValues.q);
                    setProgress(100);
                });
        }
    }, [fund, setProgress, fundService, activeOrganization.id, identitiesFilters?.activeValues, pushDanger]);

    useEffect(() => {
        if (implementation) {
            fetchFunds();
        }
    }, [fetchFunds, implementation]);

    useEffect(() => {
        fetchImplementation();
    }, [fetchImplementation]);

    useEffect(() => {
        fetchFundIdentities();
    }, [fetchFundIdentities]);

    useEffect(() => {
        updateVariableValues();
    }, [updateVariableValues]);

    if (!implementation || !fund) {
        return <LoadingCard />;
    }

    return (
        <Fragment>
            <div className="form">
                <div className="block block-breadcrumbs">
                    <StateNavLink
                        name={'implementation-notifications'}
                        params={{ organizationId: activeOrganization.id, id: implementation.id }}
                        activeExact={true}
                        className="breadcrumb-item">
                        Systeemberichten
                    </StateNavLink>
                    <div className="breadcrumb-item active">Verstuur een aangepast bericht</div>
                </div>

                <div className="card">
                    <div className="card-header">
                        <div className="flex">
                            <div className="flex flex-grow">
                                <div className="card-title">
                                    <em className="mdi mdi-account-multiple-outline" />
                                    Kies een doelgroep
                                </div>
                            </div>
                            <div className="flex">
                                {targetGroup == 'identities' &&
                                    hasPermission(activeOrganization, 'manage_vouchers') && (
                                        <div
                                            className="button button-primary button-sm"
                                            onClick={() => setShowIdentities(!showIdentities)}>
                                            <em className="mdi mdi-view-list icon-start" />
                                            {showIdentities
                                                ? 'Verberg de lijst met geadresseerden'
                                                : 'Bekijk de lijst met geadresseerden'}
                                        </div>
                                    )}

                                <div className="flex">
                                    <div>
                                        <div className="block block-label-tabs">
                                            <div className="label-tab-set">
                                                <div
                                                    className={`label-tab ${
                                                        targetGroup === 'identities' ? 'active' : ''
                                                    }`}
                                                    onClick={() => setTargetGroup('identities')}>
                                                    <div className="mdi mdi-account-multiple-outline label-tab-icon-start" />
                                                    Aanvragers
                                                </div>
                                                <div
                                                    className={`label-tab ${
                                                        targetGroup === 'providers' ? 'active' : ''
                                                    }`}
                                                    onClick={() => setTargetGroup('providers')}>
                                                    <div className="mdi mdi-store-outline label-tab-icon-start" />
                                                    Aanbieders
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="card-section">
                        <div className="form-group">
                            <label className="form-label">Kies een fonds</label>
                            <div className="form-offset">
                                <SelectControl
                                    className="form-control"
                                    allowSearch={false}
                                    value={fund}
                                    onChange={(value: Fund) => setFund(value)}
                                    options={funds}
                                    optionsComponent={SelectControlOptions}
                                />
                            </div>
                        </div>

                        {targetGroup == 'identities' && (
                            <div className="form-group">
                                <label className="form-label">Verstuur naar</label>
                                <div className="form-offset">
                                    <SelectControl
                                        className="form-control"
                                        propKey={'value'}
                                        allowSearch={false}
                                        value={identitiesFilters.values.target}
                                        onChange={(value: string) => {
                                            identitiesFilters.update({ target: value });
                                        }}
                                        options={identityTargets}
                                        optionsComponent={SelectControlOptions}
                                    />
                                </div>
                            </div>
                        )}

                        {targetGroup == 'providers' && (
                            <div className="form-group">
                                <label className="form-label">Verstuur naar</label>
                                <div className="form-offset">
                                    <SelectControl
                                        className="form-control"
                                        propKey={'value'}
                                        allowSearch={false}
                                        value={providersFilters.values.target}
                                        onChange={(value: string) => {
                                            providersFilters.update({ target: value });
                                        }}
                                        options={providerTargets}
                                        optionsComponent={SelectControlOptions}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {targetGroup == 'identities' && identities && (
                        <div>
                            {showIdentities && (
                                <div className="card-header">
                                    <div className="flex">
                                        <div className="flex flex-grow">
                                            <div className="card-title">
                                                <em className="mdi mdi-view-list" />
                                                Lijst met geadresseerden
                                            </div>
                                        </div>
                                        <div className="flex">
                                            <div className="block block-inline-filters">
                                                <div className="form">
                                                    <div className="form-group">
                                                        <input
                                                            type="text"
                                                            value={identitiesFilters.values.q}
                                                            placeholder="Zoeken"
                                                            className="form-control"
                                                            onChange={(e) =>
                                                                identitiesFilters.update({ q: e.target.value })
                                                            }
                                                        />
                                                    </div>
                                                </div>
                                                <div
                                                    className="button button-primary button-sm"
                                                    onClick={() => exportIdentities()}>
                                                    <em className="mdi mdi-download icon-start" />
                                                    Exporteren
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {showIdentities && identities.meta.total > 0 && (
                                <div className="card-section">
                                    <div className="card-block card-block-table">
                                        <div className="table-wrapper">
                                            <table className="table">
                                                <tbody>
                                                    <tr>
                                                        <ThSortable filter={identitiesFilters} label="ID" value="id" />
                                                        <ThSortable
                                                            filter={identitiesFilters}
                                                            label="E-mail"
                                                            value="email"
                                                        />
                                                        <ThSortable
                                                            filter={identitiesFilters}
                                                            label="Aantal tegoeden"
                                                            value="count_vouchers"
                                                        />
                                                        <ThSortable
                                                            filter={identitiesFilters}
                                                            label="Actieve tegoeden"
                                                            value="count_vouchers_active"
                                                        />
                                                        <ThSortable
                                                            filter={identitiesFilters}
                                                            label="Actieve tegoeden met een restant budget"
                                                            value="count_vouchers_active_with_balance"
                                                        />
                                                    </tr>

                                                    {identities.data.map((identity) => (
                                                        <tr key={identity.id}>
                                                            <td>{identity.id}</td>
                                                            <td>{identity.email}</td>
                                                            <td>{identity.count_vouchers}</td>
                                                            <td>{identity.count_vouchers_active}</td>
                                                            <td>{identity.count_vouchers_active_with_balance}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {showIdentities && identities.meta.total == 0 && (
                                <EmptyCard
                                    type={'card-section'}
                                    title={
                                        lastIdentitiesQuery
                                            ? `Geen gebruikers gevonden voor "${lastIdentitiesQuery}"`
                                            : 'Geen gebruikers gevonden'
                                    }
                                />
                            )}

                            {showIdentities && identities && identities?.meta && (
                                <div className="card-section card-section-narrow">
                                    <Paginator
                                        meta={identities.meta}
                                        filters={identitiesFilters.values}
                                        updateFilters={identitiesFilters.update}
                                        perPageKey={perPageKey}
                                    />
                                </div>
                            )}

                            <div className="card-section card-section-primary">
                                <div className="card-block card-block-keyvalue card-block-keyvalue-horizontal row">
                                    <div className="keyvalue-item col col-lg-3">
                                        <div className="keyvalue-key">Met vouchers</div>
                                        <div className="keyvalue-value">
                                            <span>{identities.meta.counts.active}</span>
                                            <span className="icon mdi mdi-account-multiple-outline" />
                                        </div>
                                    </div>
                                    <div className="keyvalue-item col col-lg-3">
                                        <div className="keyvalue-key">Binnen de doelgroep</div>
                                        <div className="keyvalue-value">
                                            <span>{identities.meta.counts.selected}</span>
                                            <span className="icon mdi mdi-account-multiple-check-outline" />
                                        </div>
                                    </div>
                                    <div className="keyvalue-item col col-lg-3">
                                        <div className="keyvalue-key">Uitgesloten gebruikers</div>
                                        <div className="keyvalue-value">
                                            <span>
                                                {identities.meta.counts.active -
                                                    identities.meta.counts.selected -
                                                    identities.meta.counts.without_email}
                                            </span>
                                            <span className="icon mdi mdi-account-multiple-remove-outline" />
                                        </div>
                                    </div>
                                    <div className="keyvalue-item col col-lg-3">
                                        <div className="keyvalue-key">Zonder e-mailadres</div>
                                        <div className="keyvalue-value">
                                            <span>{identities.meta.counts.without_email}</span>
                                            <span className="icon mdi mdi-email-off-outline" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="block block-system-notification-editor">
                    {template && variableValues && (
                        <SystemNotificationTemplateEditor
                            type="mail"
                            implementation={implementation}
                            organization={activeOrganization}
                            fund={fund}
                            notification={notification}
                            template={template}
                            onEditUpdated={(editing) => setEditing(editing)}
                            onChange={(notification) => onTemplateUpdated(notification)}
                            errors={errors}
                            compose={true}
                            variableValues={variableValues}
                        />
                    )}
                </div>

                {!editing && (
                    <div className="card">
                        <div className="card-section card-section-narrow">
                            <div className="button-group flex-center">
                                <StateNavLink
                                    name={'implementation-notifications'}
                                    params={{ organizationId: activeOrganization.id }}
                                    className="button button-default">
                                    <em className="mdi mdi-close icon-start" />
                                    Annuleren
                                </StateNavLink>

                                <button
                                    className="button button-default"
                                    type="button"
                                    onClick={() => sendToMyself()}
                                    disabled={submittingToSelf || submitting}>
                                    {submittingToSelf ? (
                                        <em className="mdi mdi-loading mdi-spin icon-start" />
                                    ) : (
                                        <em className="mdi mdi-account-arrow-right-outline icon-start" />
                                    )}
                                    Verstuur een test e-mail naar jezelf
                                </button>
                                <button
                                    className="button button-primary"
                                    type="button"
                                    onClick={() => submit()}
                                    disabled={!previewSent || submittingToSelf || submitting}>
                                    {submitting ? (
                                        <em className="mdi mdi-loading mdi-spin icon-start" />
                                    ) : (
                                        <em className="mdi mdi-send-outline icon-start" />
                                    )}
                                    Versturen
                                </button>
                            </div>
                        </div>

                        {!previewSent && (
                            <div className="card-section card-section-narrow card-section card-section-warning text-center">
                                Voordat je de e-mail naar de doelgroep kan versturen dien je eerst e-mail als test naar
                                jezelf te sturen.
                            </div>
                        )}
                    </div>
                )}
            </div>
        </Fragment>
    );
}
