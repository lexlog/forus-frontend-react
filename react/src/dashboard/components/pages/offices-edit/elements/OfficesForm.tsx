import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import PhotoSelector from '../../../elements/photo-selector/PhotoSelector';
import useFormBuilder from '../../../../hooks/useFormBuilder';
import FormError from '../../../elements/forms/errors/FormError';
import { NavLink } from 'react-router-dom';
import { getStateRouteUrl, useNavigateState } from '../../../../modules/state_router/Router';
import { useMediaService } from '../../../../services/MediaService';
import LoadingCard from '../../../elements/loading-card/LoadingCard';
import usePushDanger from '../../../../hooks/usePushDanger';
import usePushSuccess from '../../../../hooks/usePushSuccess';
import useSetProgress from '../../../../hooks/useSetProgress';
import ScheduleControl from './ScheduleControl';
import useOfficeService from '../../../../services/OfficeService';
import Office from '../../../../props/models/Office';
import Organization from '../../../../props/models/Organization';
import OfficeSchedule from '../../../../props/models/OfficeSchedule';
import { ResponseError } from '../../../../props/ApiResponses';

export default function OfficesForm({ organization, id }: { organization: Organization; id?: number }) {
    const { t } = useTranslation();

    const pushDanger = usePushDanger();
    const pushSuccess = usePushSuccess();
    const setProgress = useSetProgress();
    const navigateState = useNavigateState();

    const mediaService = useMediaService();
    const officeService = useOfficeService();

    const [office, setOffice] = useState<Office>(null);
    const [mediaFile, setMediaFile] = useState<Blob>(null);

    const fetchOffice = useCallback(
        (id) => {
            setProgress(0);

            officeService
                .read(organization.id, id)
                .then((res) => setOffice(res.data.data))
                .finally(() => setProgress(100));
        },
        [officeService, organization, setProgress],
    );

    const uploadMedia = useCallback(() => {
        return new Promise((resolve, reject) => {
            if (!mediaFile) {
                return resolve(office?.photo?.uid);
            }

            setProgress(0);

            return mediaService
                .store('office_photo', mediaFile)
                .then((res) => {
                    setMediaFile(null);
                    resolve(res.data.data.uid);
                }, reject)
                .finally(() => setProgress(100));
        });
    }, [mediaFile, mediaService, setProgress, office]);

    const form = useFormBuilder<{
        address?: string;
        phone?: string;
        schedule?: Array<OfficeSchedule>;
    }>(null, (values) => {
        uploadMedia().then((media_uid: string) => {
            setProgress(0);

            const promise = office
                ? officeService.update(office.organization_id, office.id, { ...values, media_uid })
                : officeService.store(organization.id, { ...values, media_uid });

            promise
                .then(
                    () => {
                        navigateState('offices', { organizationId: organization.id });
                        pushSuccess('Gelukt!');
                    },
                    (err: ResponseError) => {
                        form.setIsLocked(false);
                        form.setErrors(err.data.errors);
                        pushDanger('Mislukt!', err.data.message);
                    },
                )
                .finally(() => setProgress(100));
        });
    });

    const { update: updateForm } = form;

    const onScheduleChange = useCallback(
        (schedule) => {
            updateForm({ schedule: schedule });
        },
        [updateForm],
    );

    useEffect(() => {
        if (office) {
            updateForm({ ...officeService.apiResourceToForm(office) });
        }
    }, [updateForm, office, officeService]);

    useEffect(() => {
        if (id) {
            fetchOffice(id);
        }
    }, [id, fetchOffice]);

    if (!organization || (id && !office)) {
        return <LoadingCard />;
    }

    return (
        <form className="card form" onSubmit={form.submit}>
            <div className="card-header">
                <div className="card-title">
                    {t(id ? 'offices_edit.header.title_edit' : 'offices_edit.header.title_add')}
                </div>
            </div>

            <div className="card-section card-section-primary">
                <div className="row">
                    <div className="col col-xs-12 col-md-9">
                        <div className="form-group form-group-inline">
                            <label className="form-label">&nbsp;</label>
                            <div className="form-offset">
                                <PhotoSelector
                                    type="office_photo"
                                    thumbnail={office?.photo?.sizes?.thumbnail}
                                    selectPhoto={(file) => setMediaFile(file)}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="card-section card-section-primary">
                <div className="row">
                    <div className="col col-xs-12 col-md-9">
                        <div className="form-group form-group-inline">
                            <label className="form-label form-label-required">{t('offices_edit.labels.address')}</label>
                            <input
                                type="text"
                                className="form-control"
                                placeholder={t('offices_edit.labels.address')}
                                value={form.values?.address || ''}
                                onChange={(e) => form.update({ address: e.target.value })}
                            />
                            <FormError error={form.errors?.address} />
                        </div>

                        <div className="form-group form-group-inline">
                            <label className="form-label">{t('offices_edit.labels.phone')}</label>
                            <input
                                type="text"
                                className="form-control"
                                placeholder={t('offices_edit.labels.phone')}
                                value={form.values?.phone || ''}
                                onChange={(e) => form.update({ phone: e.target.value })}
                            />
                            <FormError error={form.errors?.address} />
                        </div>
                    </div>
                </div>
            </div>
            <div className="card-section card-section-primary">
                <div className="row">
                    <div className="col col-xs-12 col-md-12">
                        <div className="form-group form-group-inline">
                            <label className="form-label">&nbsp;</label>
                            <div className="form-offset">
                                {(form.values || !id) && (
                                    <ScheduleControl
                                        schedule={form.values?.schedule || []}
                                        onChange={onScheduleChange}
                                        errors={form.errors}
                                    />
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="card-section card-section-primary">
                <div className="text-center">
                    <NavLink
                        id="cancel"
                        to={getStateRouteUrl('offices', { organizationId: organization.id })}
                        type="button"
                        className="button button-default">
                        {t('offices_edit.buttons.cancel')}
                    </NavLink>

                    <button type="submit" className="button button-primary">
                        {t('offices_edit.buttons.confirm')}
                    </button>
                </div>
            </div>
        </form>
    );
}
