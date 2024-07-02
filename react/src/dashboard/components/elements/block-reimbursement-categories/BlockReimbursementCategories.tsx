import React, { useCallback, useEffect, useState } from 'react';
import { PaginationData } from '../../../props/ApiResponses';
import ReimbursementCategory from '../../../props/models/ReimbursementCategory';
import Paginator from '../../../modules/paginator/components/Paginator';
import useFilter from '../../../hooks/useFilter';
import usePaginatorService from '../../../modules/paginator/services/usePaginatorService';
import useOpenModal from '../../../hooks/useOpenModal';
import useActiveOrganization from '../../../hooks/useActiveOrganization';
import { useReimbursementCategoryService } from '../../../services/ReimbursementCategoryService';
import usePushSuccess from '../../../hooks/usePushSuccess';
import ModalReimbursementCategoryEdit from '../../modals/ModalReimbursementCategoryEdit';
import useConfirmReimbursementCategoryDelete from './hooks/useConfirmReimbursementCategoryDelete';
import useSetProgress from '../../../hooks/useSetProgress';
import useTranslate from '../../../hooks/useTranslate';
import LoadingCard from '../loading-card/LoadingCard';
import LoaderTableCard from '../loader-table-card/LoaderTableCard';
import usePushApiError from '../../../hooks/usePushApiError';

export default function BlockReimbursementCategories({
    compact = false,
    createCategoryRef = null,
}: {
    compact?: boolean;
    createCategoryRef?: React.MutableRefObject<() => Promise<boolean>>;
}) {
    const activeOrganization = useActiveOrganization();

    const openModal = useOpenModal();
    const translate = useTranslate();
    const pushSuccess = usePushSuccess();
    const pushApiError = usePushApiError();
    const setProgress = useSetProgress();

    const paginatorService = usePaginatorService();
    const reimbursementCategoryService = useReimbursementCategoryService();

    const confirmReimbursementCategoryDelete = useConfirmReimbursementCategoryDelete();

    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState<PaginationData<ReimbursementCategory>>(null);
    const [paginatorKey] = useState('reimbursement_categories');

    const filter = useFilter({
        q: '',
        per_page: paginatorService.getPerPage(paginatorKey),
    });

    const fetchReimbursementCategories = useCallback(() => {
        setLoading(true);
        setProgress(0);

        reimbursementCategoryService
            .list(activeOrganization.id, filter.activeValues)
            .then((res) => setCategories(res.data))
            .catch(pushApiError)
            .finally(() => {
                setLoading(false);
                setProgress(100);
            });
    }, [setProgress, activeOrganization.id, filter.activeValues, pushApiError, reimbursementCategoryService]);

    const editReimbursementCategory = useCallback(
        async (category: ReimbursementCategory = null): Promise<boolean> => {
            return new Promise((resolve) => {
                openModal((modal) => (
                    <ModalReimbursementCategoryEdit
                        modal={modal}
                        category={category}
                        onSubmit={() => {
                            fetchReimbursementCategories();
                            resolve(false);
                        }}
                        onCancel={() => resolve(false)}
                    />
                ));
            });
        },
        [fetchReimbursementCategories, openModal],
    );

    const deleteReimbursementCategory = useCallback(
        (reimbursementCategory: ReimbursementCategory) => {
            confirmReimbursementCategoryDelete().then((confirmed) => {
                if (!confirmed) {
                    return;
                }

                reimbursementCategoryService
                    .destroy(activeOrganization.id, reimbursementCategory.id)
                    .then(() => {
                        fetchReimbursementCategories();
                        pushSuccess('Opgeslagen!');
                    })
                    .catch(pushApiError);
            });
        },
        [
            confirmReimbursementCategoryDelete,
            reimbursementCategoryService,
            fetchReimbursementCategories,
            activeOrganization.id,
            pushApiError,
            pushSuccess,
        ],
    );

    useEffect(() => {
        fetchReimbursementCategories();
    }, [fetchReimbursementCategories]);

    useEffect(() => {
        if (createCategoryRef) {
            createCategoryRef.current = editReimbursementCategory;
        }
    }, [editReimbursementCategory, createCategoryRef]);

    if (!categories) {
        return <LoadingCard />;
    }

    return (
        <div className="card card-last">
            {!compact && (
                <div className="card-header">
                    <div className="flex">
                        <div className="flex flex-grow">
                            <div className="card-title">
                                {categories?.meta
                                    ? `Declaratie categorieën (${categories?.meta.total})`
                                    : `Declaratie categorieën`}
                            </div>
                        </div>

                        <div className="flex">
                            <div className="block block-inline-filters">
                                <a
                                    className="button button-primary button-sm"
                                    id="add_reimbursement_category"
                                    onClick={() => editReimbursementCategory()}>
                                    <em className="mdi mdi-plus-circle icon-start" />
                                    {translate('Toevoegen')}
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <LoaderTableCard
                loading={loading}
                empty={categories?.data.length === 0}
                emptyTitle={'Er zijn momenteel geen declaratie categorieën.'}>
                <div className="card-section card-section-primary">
                    <div className="card-block card-block-table">
                        <div className="table-wrapper">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Categorie naam</th>
                                        <th>Organisatie</th>
                                        <th>Totaal gebruikt</th>
                                        <th className="th-narrow text-right">Opties</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {categories?.data.map((reimbursementCategory) => (
                                        <tr key={reimbursementCategory.id}>
                                            <td>{reimbursementCategory.name}</td>
                                            <td>{reimbursementCategory.organization.name}</td>
                                            <td>{reimbursementCategory.reimbursements_count}</td>
                                            <td className="td-narrow text-right">
                                                <div className="flex">
                                                    <a
                                                        className="button button-sm button-default"
                                                        onClick={() =>
                                                            editReimbursementCategory(reimbursementCategory)
                                                        }>
                                                        <em className="mdi mdi-pen icon-start" />
                                                        {translate('Bewerken')}
                                                    </a>
                                                    <button
                                                        className="button button-danger button-icon"
                                                        onClick={() =>
                                                            deleteReimbursementCategory(reimbursementCategory)
                                                        }
                                                        disabled={reimbursementCategory.reimbursements_count > 0}>
                                                        <em className="icon-start mdi mdi-delete" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {categories?.meta.total > 0 && (
                    <div className={`card-section ${compact ? 'card-section-narrow' : ''}`}>
                        <div className="table-pagination">
                            <Paginator
                                meta={categories.meta}
                                filters={filter.values}
                                updateFilters={filter.update}
                                perPageKey={paginatorKey}
                            />
                        </div>
                    </div>
                )}
            </LoaderTableCard>
        </div>
    );
}
