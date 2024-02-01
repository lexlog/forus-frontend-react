import React, { useCallback, useEffect, useMemo, useState } from 'react';
import useActiveOrganization from '../../../hooks/useActiveOrganization';
import { useTranslation } from 'react-i18next';
import LoadingCard from '../../elements/loading-card/LoadingCard';
import useSetProgress from '../../../hooks/useSetProgress';
import useProductService from '../../../services/ProductService';
import Product from '../../../props/models/Product';
import { PaginationData } from '../../../props/ApiResponses';
import useFilter from '../../../hooks/useFilter';
import ThSortable from '../../elements/tables/ThSortable';
import useOpenModal from '../../../hooks/useOpenModal';
import StateNavLink from '../../../modules/state_router/StateNavLink';
import Paginator from '../../../modules/paginator/components/Paginator';
import useProductReservationService from '../../../services/ProductReservationService';
import Reservation from '../../../props/models/Reservation';
import usePushSuccess from '../../../hooks/usePushSuccess';
import usePushDanger from '../../../hooks/usePushDanger';
import { useOrganizationService } from '../../../services/OrganizationService';
import ModalDangerZone from '../../modals/ModalDangerZone';
import useProductReservationsExportService from '../../../services/exports/useProductReservationsExportService';
import useProviderFundService from '../../../services/ProviderFundService';
import Fund from '../../../props/models/Fund';
import { hasPermission } from '../../../helpers/utils';
import FilterItemToggle from '../../elements/tables/elements/FilterItemToggle';
import SelectControl from '../../elements/select-control/SelectControl';
import SelectControlOptions from '../../elements/select-control/templates/SelectControlOptions';
import DatePickerControl from '../../elements/forms/controls/DatePickerControl';
import CardHeaderFilter from '../../elements/tables/elements/CardHeaderFilter';
import useAuthIdentity from '../../../hooks/useAuthIdentity';
import { strLimit } from '../../../helpers/string';
import { dateFormat, dateParse } from '../../../helpers/dates';
import useUpdateActiveOrganization from '../../../hooks/useUpdateActiveOrganization';
import ModalReservationCreate from '../../modals/ModalReservationCreate';
import ModalReservationUpload from '../../modals/ModalReservationUpload';
import useConfirmReservationApproval from '../../../services/helpers/reservations/useConfirmReservationApproval';
import useConfirmReservationRejection from '../../../services/helpers/reservations/useConfirmReservationRejection';
import useShowReservationRejectInfoExtraPaid from '../../../services/helpers/reservations/useShowRejectInfoExtraPaid';
import useConfirmReservationArchive from '../../../services/helpers/reservations/useConfirmReservationArchive';
import useConfirmReservationUnarchive from '../../../services/helpers/reservations/useConfirmReservationUnarchive';

type ReservationLocal = Partial<Reservation> & {
    allowAcceptReservation: boolean;
    allowRejectReservation: boolean;
};

export default function Reservations() {
    const { t } = useTranslation();
    const activeOrganization = useActiveOrganization();
    const updateActiveOrganization = useUpdateActiveOrganization();
    const identity = useAuthIdentity();

    const openModal = useOpenModal();
    const pushDanger = usePushDanger();
    const pushSuccess = usePushSuccess();
    const setProgress = useSetProgress();

    const productService = useProductService();
    const providerFundService = useProviderFundService();
    const organizationService = useOrganizationService();
    const productReservationService = useProductReservationService();
    const productReservationsExportService = useProductReservationsExportService();

    const [funds, setFunds] = useState<Array<Partial<Fund>>>(null);
    const [products, setProducts] = useState<Array<Partial<Product>>>(null);

    const confirmReservationArchive = useConfirmReservationArchive();
    const confirmReservationApproval = useConfirmReservationApproval();
    const confirmReservationRejection = useConfirmReservationRejection();
    const confirmReservationUnarchive = useConfirmReservationUnarchive();
    const showReservationRejectInfoExtraPaid = useShowReservationRejectInfoExtraPaid();

    const [reservations, setReservations] = useState<PaginationData<ReservationLocal>>(null);

    const [activeReservations, setActiveReservations] = useState<PaginationData<Reservation>>(null);
    const [archivedReservations, setArchivedReservations] = useState<PaginationData<Reservation>>(null);

    const [shownReservationsType, setShownReservationType] = useState('active');
    const [acceptedByDefault, setAcceptByDefault] = useState(activeOrganization.reservations_auto_accept);

    const reservationEnabled = useMemo(() => {
        return activeOrganization.reservations_budget_enabled || activeOrganization.reservations_subsidy_enabled;
    }, [activeOrganization]);

    const [states] = useState([
        { key: null, name: 'Alle' }, // All
        { key: 'waiting', name: 'Wachtend op bijbetaling' }, // Waiting
        { key: 'pending', name: 'In afwachting' }, // Pending
        { key: 'accepted', name: 'Geaccepteerd' }, // Accepted
        { key: 'rejected', name: 'Geweigerd' }, // Rejected
        { key: 'canceled', name: 'Geannuleerd door aanbieder' }, // Canceled by provider
        { key: 'canceled_by_client', name: 'Geannuleerd door aanvrager' }, // Canceled by client
        { key: 'canceled_payment_expired', name: 'Geannuleerd door verlopen bijbetaling' }, // Canceled payment expired
        { key: 'canceled_payment_canceled', name: 'Geannuleerd door ingetrokken bijbetaling' }, // Canceled payment canceled
        { key: 'canceled_payment_failed', name: 'Geannuleerd door mislukte bijbetaling' }, // Canceled payment failed
    ]);

    const filter = useFilter({
        q: '',
        state: states[0].key,
        from: null,
        to: null,
        fund_id: null,
        product_id: null,
    });

    const mapReservations = useCallback(
        (reservations: PaginationData<Reservation>) => {
            return {
                ...reservations,
                data: reservations.data.map((reservation) => ({
                    ...reservation,
                    allowAcceptReservation: productReservationService.acceptAllowed(reservation),
                    allowRejectReservation: productReservationService.rejectAllowed(reservation),
                })),
            };
        },
        [productReservationService],
    );

    const fetchReservations = useCallback(
        (query, archived = false) => {
            return productReservationService.list(activeOrganization.id, {
                ...query,
                archived: archived ? 1 : 0,
            });
        },
        [activeOrganization.id, productReservationService],
    );

    const fetchAllReservations = useCallback(() => {
        setProgress(0);

        Promise.all([
            fetchReservations(filter.activeValues).then((res) => setActiveReservations(res.data)),
            fetchReservations(filter.activeValues, true).then((res) => setArchivedReservations(res.data)),
        ]).finally(() => {
            setProgress(100);
        });
    }, [fetchReservations, filter.activeValues, setProgress]);

    const acceptReservation = useCallback(
        (reservation: ReservationLocal) => {
            confirmReservationApproval(reservation as Reservation, () => {
                productReservationService.accept(activeOrganization.id, reservation.id).then(
                    () => {
                        pushSuccess('Opgeslagen!');
                        fetchAllReservations();
                    },
                    (res) => pushDanger(res.data.message),
                );
            });
        },
        [
            activeOrganization.id,
            confirmReservationApproval,
            fetchAllReservations,
            productReservationService,
            pushDanger,
            pushSuccess,
        ],
    );

    const rejectReservation = useCallback(
        (reservation: ReservationLocal) => {
            if (reservation.extra_payment?.is_paid && !reservation.extra_payment?.is_fully_refunded) {
                return showReservationRejectInfoExtraPaid();
            }

            confirmReservationRejection(reservation as Reservation, () => {
                productReservationService.reject(activeOrganization.id, reservation.id).then(
                    () => {
                        pushSuccess('Opgeslagen!');
                        fetchAllReservations();
                    },
                    (res) => pushDanger(res.data.message),
                );
            });
        },
        [
            pushDanger,
            pushSuccess,
            activeOrganization.id,
            fetchAllReservations,
            showReservationRejectInfoExtraPaid,
            confirmReservationRejection,
            productReservationService,
        ],
    );

    const toggleAcceptByDefault = useCallback(
        async (value: boolean) => {
            setAcceptByDefault(value);

            const onEnable = () => {
                organizationService
                    .updateAcceptReservations(activeOrganization.id, value)
                    .then((res) => {
                        updateActiveOrganization(res.data.data);
                        setAcceptByDefault(res.data.data.reservations_auto_accept);
                        pushSuccess('Opgeslagen!');
                    })
                    .catch(() => pushDanger('Er is iets misgegaan!'));
            };

            const onDisable = () => {
                organizationService
                    .updateAcceptReservations(activeOrganization.id, value)
                    .then((res) => {
                        updateActiveOrganization(res.data.data);
                        setAcceptByDefault(res.data.data.reservations_auto_accept);
                        pushSuccess('Opgeslagen!');
                    })
                    .catch(() => pushDanger('Er is iets misgegaan!'));
            };

            const onCancel = () => {
                organizationService.read(activeOrganization.id, value).then((res) => {
                    updateActiveOrganization(res.data.data);
                    setAcceptByDefault(res.data.data.reservations_auto_accept);
                });
            };

            if (!value) {
                return onDisable();
            }

            openModal((modal) => (
                <ModalDangerZone
                    modal={modal}
                    title="Let op! Met deze instelling worden alle reserveringen direct geaccepteerd."
                    description_text={[
                        'Wilt u reserveringen automatisch accepteren? Ga dan akkoord met onderstaande voorwaarden:',
                        '',
                        '- Het product of de dienst kan worden geleverd.',
                        '- De transactie wordt na veertien dagen verwerkt.',
                        '- De transactie kan op verzoek van de klant binnen veertien dagen worden geannuleerd.',
                    ]}
                    confirmation="Ik ga akkoord met de voorwaarden."
                    buttonSubmit={{
                        text: 'Bevestigen',
                        onClick: () => {
                            onEnable();
                            modal.close();
                        },
                    }}
                    buttonCancel={{
                        text: 'Annuleren',
                        onClick: () => {
                            onCancel();
                            modal.close();
                        },
                    }}
                />
            ));
        },
        [activeOrganization, updateActiveOrganization, openModal, organizationService, pushDanger, pushSuccess],
    );

    const makeReservation = useCallback(() => {
        openModal((modal) => (
            <ModalReservationCreate
                modal={modal}
                organization={activeOrganization}
                onCreated={() => fetchAllReservations()}
            />
        ));
    }, [activeOrganization, fetchAllReservations, openModal]);

    const uploadReservations = useCallback(() => {
        openModal((modal) => (
            <ModalReservationUpload
                modal={modal}
                organization={activeOrganization}
                onCreated={() => fetchAllReservations()}
            />
        ));
    }, [activeOrganization, fetchAllReservations, openModal]);

    const exportReservations = useCallback(() => {
        productReservationsExportService.exportData(activeOrganization.id, filter.values);
    }, [activeOrganization.id, filter.values, productReservationsExportService]);

    const archiveReservation = useCallback(
        (reservation: ReservationLocal) => {
            confirmReservationArchive(reservation as Reservation, () => {
                productReservationService.archive(activeOrganization.id, reservation.id).then(
                    () => {
                        pushSuccess('Opgeslagen!');
                        fetchAllReservations();
                    },
                    (res) => pushDanger(res.data.message),
                );
            });
        },
        [
            activeOrganization.id,
            confirmReservationArchive,
            fetchAllReservations,
            productReservationService,
            pushDanger,
            pushSuccess,
        ],
    );

    const unarchiveReservation = useCallback(
        (reservation: ReservationLocal) => {
            confirmReservationUnarchive(reservation as Reservation, () => {
                productReservationService.unarchive(activeOrganization.id, reservation.id).then(
                    () => {
                        pushSuccess('Opgeslagen!');
                        fetchAllReservations();
                    },
                    (res) => pushDanger(res.data.message),
                );
            });
        },
        [
            activeOrganization.id,
            confirmReservationUnarchive,
            fetchAllReservations,
            productReservationService,
            pushDanger,
            pushSuccess,
        ],
    );

    // Fetch active and archived reservations
    useEffect(() => {
        fetchAllReservations();
    }, [fetchAllReservations]);

    // Update reservations when active or archived reservations change
    useEffect(() => {
        if (!activeReservations || !archivedReservations) {
            return;
        }

        setReservations(mapReservations(shownReservationsType == 'active' ? activeReservations : archivedReservations));
    }, [activeReservations, archivedReservations, mapReservations, shownReservationsType]);

    // Fetch filter models
    useEffect(() => {
        providerFundService.listFunds(activeOrganization.id, { per_page: 100 }).then((res) => {
            setFunds([{ id: null, name: 'Alle tegoeden' }, ...res.data.data.map((item) => item.fund)]);
        });

        productService.list(activeOrganization.id, { per_page: 100 }).then((res) => {
            setProducts([{ id: null, name: 'Alle aanbod' }, ...res.data.data]);
        });
    }, [activeOrganization, productService, providerFundService]);

    if (!reservations) {
        return <LoadingCard />;
    }

    return (
        <div className="card">
            <div className="card-header">
                <div className="flex">
                    <div className="flex flex-grow card-title" data-dusk="reservationsTitle">
                        {t('reservations.header.title', reservations.meta)}
                    </div>
                    <div className="flex block block-inline-filters">
                        {reservationEnabled && (
                            <div onClick={makeReservation} className="button button-primary button-sm">
                                <em className="mdi mdi-plus-circle icon-start" />
                                Aanmaken
                            </div>
                        )}
                        {reservationEnabled && hasPermission(activeOrganization, 'manage_organization') && (
                            <StateNavLink
                                name="reservations-settings"
                                params={{ organizationId: activeOrganization.id }}
                                className="button button-primary button-sm">
                                <em className="mdi mdi-cog icon-start" />
                                Instellingen
                            </StateNavLink>
                        )}
                        {activeOrganization.allow_batch_reservations && reservationEnabled && (
                            <div className="button button-primary button-sm" onClick={uploadReservations}>
                                <em className="mdi mdi-upload icon-start" />
                                Upload bulkbestand
                            </div>
                        )}
                        <div className="flex-col">
                            <div className="block block-label-tabs nowrap pull-right">
                                <div className="label-tab-set">
                                    <div
                                        className={`label-tab label-tab-sm ${
                                            shownReservationsType == 'active' ? 'active' : ''
                                        }`}
                                        onClick={() => setShownReservationType('active')}>
                                        Lopend ({activeReservations.meta.total})
                                    </div>
                                    <div
                                        className={`label-tab label-tab-sm ${
                                            shownReservationsType == 'archived' ? 'active' : ''
                                        }`}
                                        onClick={() => setShownReservationType('archived')}>
                                        Archief ({archivedReservations.meta.total})
                                    </div>
                                </div>
                            </div>
                        </div>

                        {filter.show ? (
                            <div className="button button-text" onClick={filter.resetFilters}>
                                <em className="mdi mdi-close icon-start" />
                                Wis filters
                            </div>
                        ) : (
                            <div className="form">
                                <div className="form-group">
                                    <input
                                        className="form-control"
                                        value={filter.values.q}
                                        placeholder={t('reservations.filters.search')}
                                        onChange={(e) => filter.update({ q: e.target.value })}
                                    />
                                </div>
                            </div>
                        )}

                        <CardHeaderFilter filter={filter}>
                            <FilterItemToggle label={t('reservations.filters.search')} show={true}>
                                <input
                                    className="form-control"
                                    value={filter.values.q}
                                    onChange={(e) => filter.update({ q: e.target.value })}
                                    placeholder={t('reservations.filters.search')}
                                />
                            </FilterItemToggle>

                            <FilterItemToggle label={t('reservations.filters.fund')}>
                                {funds && (
                                    <SelectControl
                                        className="form-control"
                                        propKey={'id'}
                                        allowSearch={false}
                                        options={funds}
                                        optionsComponent={SelectControlOptions}
                                        onChange={(fund_id: number) => filter.update({ fund_id })}
                                    />
                                )}
                            </FilterItemToggle>

                            <FilterItemToggle label={t('reservations.filters.product')}>
                                {products && (
                                    <SelectControl
                                        className="form-control"
                                        propKey={'id'}
                                        allowSearch={true}
                                        options={products}
                                        optionsComponent={SelectControlOptions}
                                        onChange={(product_id: number) => filter.update({ product_id })}
                                    />
                                )}
                            </FilterItemToggle>

                            <FilterItemToggle label={t('reservations.filters.from')}>
                                <DatePickerControl
                                    value={dateParse(filter.values.from)}
                                    placeholder={t('jjjj-MM-dd')}
                                    onChange={(from: Date) => {
                                        filter.update({ from: dateFormat(from) });
                                    }}
                                />
                            </FilterItemToggle>

                            <FilterItemToggle label={t('reservations.filters.to')}>
                                <DatePickerControl
                                    value={dateParse(filter.values.to)}
                                    placeholder={t('jjjj-MM-dd')}
                                    onChange={(to: Date) => {
                                        filter.update({ to: dateFormat(to) });
                                    }}
                                />
                            </FilterItemToggle>

                            <FilterItemToggle label={t('reservations.filters.state')}>
                                <SelectControl
                                    className="form-control"
                                    propKey={'key'}
                                    allowSearch={false}
                                    value={filter.values.state}
                                    options={states}
                                    optionsComponent={SelectControlOptions}
                                    onChange={(state: string) => filter.update({ state })}
                                />
                            </FilterItemToggle>

                            <div className="form-actions">
                                <button
                                    className="button button-primary button-wide"
                                    onClick={() => exportReservations()}
                                    disabled={reservations.meta.total == 0}>
                                    <em className="mdi mdi-download icon-start"> </em>
                                    {t('components.dropdown.export', {
                                        total: reservations.meta.total,
                                    })}
                                </button>
                            </div>
                        </CardHeaderFilter>
                    </div>
                </div>
            </div>
            {reservations.meta.total > 0 && (
                <div className="card-section card-section-padless">
                    <div className="table-wrapper">
                        <table className="table">
                            <tbody>
                                <tr>
                                    <ThSortable label={t('reservations.labels.number')} />
                                    <ThSortable label={t('reservations.labels.product')} />
                                    <ThSortable label={t('reservations.labels.price')} />
                                    <ThSortable label={t('reservations.labels.amount_extra')} />
                                    <ThSortable label={t('reservations.labels.customer')} />
                                    <ThSortable label={t('reservations.labels.reserved_at')} />
                                    <ThSortable label={t('reservations.labels.status')} />
                                    <ThSortable className={'text-right'} label={t('reservations.labels.actions')} />
                                </tr>
                                {reservations.data?.map((reservation) => (
                                    <tr data-dusk={`reservationRow${reservation.id}`} key={reservation.id}>
                                        <td>
                                            <StateNavLink
                                                name={'reservations-show'}
                                                params={{
                                                    organizationId: activeOrganization.id,
                                                    id: reservation.id,
                                                }}
                                                className="text-strong">{`#${reservation.code}`}</StateNavLink>
                                        </td>
                                        <td>
                                            <StateNavLink
                                                name={'products-show'}
                                                disabled={!hasPermission(activeOrganization, 'manage_products')}
                                                params={{
                                                    organizationId: reservation.product.organization_id,
                                                    id: reservation.product.id,
                                                }}>
                                                <div
                                                    className={`text-strong text-primary ${
                                                        reservation.product?.deleted ? 'text-strike' : ''
                                                    }}`}
                                                    title={reservation.product.name}>
                                                    {strLimit(reservation.product.name, 45)}
                                                </div>
                                                <div className="text-strong text-small text-muted-dark">
                                                    {reservation.price_locale}
                                                </div>
                                            </StateNavLink>
                                        </td>
                                        <td>{reservation.amount_locale}</td>
                                        <td>{reservation.amount_extra ? reservation.amount_extra_locale : '-'}</td>
                                        <td>
                                            {(reservation.first_name || reservation.last_name) && (
                                                <strong>{reservation.first_name + ' ' + reservation.last_name}</strong>
                                            )}
                                            {reservation.identity_physical_card ? (
                                                <div>
                                                    <div className="text-strong text-primary">
                                                        {reservation.identity_physical_card}
                                                    </div>
                                                    <div className="text-strong text-small text-muted-dark">
                                                        {reservation.identity_email}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div>
                                                    <div className="text-strong text-primary">
                                                        {reservation.identity_email}
                                                    </div>
                                                </div>
                                            )}
                                        </td>
                                        <td>
                                            <strong className="text-primary">{reservation.created_at_locale}</strong>
                                        </td>
                                        <td data-dusk="reservationState">
                                            <strong>
                                                {!reservation.expired ? reservation.state_locale : 'Verlopen'}
                                            </strong>
                                        </td>
                                        <td>
                                            <div className="flex-group flex flex-end">
                                                {reservation.allowAcceptReservation && (
                                                    <button
                                                        className="button button-sm button-primary-light button-icon"
                                                        onClick={() => acceptReservation(reservation)}>
                                                        <em className="mdi mdi-check" />
                                                    </button>
                                                )}

                                                {reservation.allowRejectReservation && (
                                                    <button
                                                        className="button button-sm button-danger button-icon"
                                                        onClick={() => rejectReservation(reservation)}>
                                                        <em className="mdi mdi-close" />
                                                    </button>
                                                )}

                                                {reservation.archivable && (
                                                    <button
                                                        className="button button-sm button-primary button-icon"
                                                        onClick={() => archiveReservation(reservation)}>
                                                        <em className="mdi mdi-archive-outline" />
                                                    </button>
                                                )}

                                                {reservation.archived && (
                                                    <button
                                                        className="button button-sm button-primary button-icon"
                                                        onClick={() => unarchiveReservation(reservation)}>
                                                        <em className="mdi mdi-archive-arrow-up-outline" />
                                                    </button>
                                                )}

                                                <StateNavLink
                                                    name="reservations-show"
                                                    params={{
                                                        organizationId: activeOrganization.id,
                                                        id: reservation.id,
                                                    }}
                                                    className="button button-sm button-default button-icon">
                                                    <em className="mdi mdi-eye" />
                                                </StateNavLink>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {reservations.meta.total == 0 && (
                <div className="card-section">
                    <div className="card-subtitle text-center">Geen reserveringen.</div>
                </div>
            )}

            {activeOrganization.identity_address == identity.address && (
                <div className="card-section form">
                    <div className="flex flex flex-end">
                        <label>
                            <div className="form-toggle flex">
                                <input
                                    type="checkbox"
                                    id="accepted_by_default"
                                    checked={acceptedByDefault}
                                    onChange={(e) => toggleAcceptByDefault(e.target.checked)}
                                />
                                <div className="form-toggle-inner">
                                    <em className="mdi mdi-information-outline flex" />
                                    &nbsp;Reserveringen automatisch accepteren &nbsp;
                                    <div className="toggle-input">
                                        <div className="toggle-input-dot" role="button" />
                                    </div>
                                </div>
                            </div>
                        </label>
                    </div>
                </div>
            )}
            {reservations?.meta?.last_page > 1 && (
                <div className="card-section">
                    <Paginator meta={reservations.meta} filters={filter.values} updateFilters={filter.update} />
                </div>
            )}
        </div>
    );
}
