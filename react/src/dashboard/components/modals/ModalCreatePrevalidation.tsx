import React, { Fragment, useCallback, useMemo, useState } from 'react';
import { ModalState } from '../../modules/modals/context/ModalContext';
import Prevalidation from '../../props/models/Prevalidation';
import RecordType from '../../props/models/RecordType';
import useFormBuilder from '../../hooks/useFormBuilder';
import { usePrevalidationService } from '../../services/PrevalidationService';
import Fund from '../../props/models/Fund';
import DatePickerControl from '../elements/forms/controls/DatePickerControl';
import SelectControl from '../elements/select-control/SelectControl';
import SelectControlOptions from '../elements/select-control/templates/SelectControlOptions';
import FormError from '../elements/forms/errors/FormError';
import PrevalidationRecord from '../../props/models/PrevalidationRecord';
import { ResponseError } from '../../props/ApiResponses';
import { dateFormat, dateParse } from '../../helpers/dates';
import useSetProgress from '../../hooks/useSetProgress';
import usePushDanger from '../../hooks/usePushDanger';
import TableEmptyValue from '../elements/table-empty-value/TableEmptyValue';

export default function ModalCreatePrevalidation({
    fund,
    modal,
    className,
    recordTypes,
    onCreated,
}: {
    fund: Fund;
    modal: ModalState;
    className?: string;
    recordTypes: Array<RecordType>;
    onCreated: () => void;
}) {
    const pushDanger = usePushDanger();
    const setProgress = useSetProgress();
    const prevalidationService = usePrevalidationService();

    const [showNewRecord, setShowNewRecord] = useState<boolean>(false);
    const [prevalidation, setPrevalidation] = useState<Prevalidation>(null);
    const [verificationRequested, setVerificationRequested] = useState<boolean>(false);
    const [prevalidationPrimaryKey, setPrevalidationPrimaryKey] = useState<PrevalidationRecord>(null);

    const [eligibleKey] = useState(fund.csv_required_keys.find((key) => key.endsWith('_eligible')));

    const [eligibleKeyValue] = useState(
        fund.criteria.find((item) => item.record_type.key == eligibleKey && item.operator == '=')?.value,
    );

    const recordTypesByKey = useMemo(() => {
        return recordTypes
            .filter((type) => type.key != 'primary_email')
            .reduce((obj, type) => ({ ...obj, [type.key]: type }), {});
    }, [recordTypes]);

    const [prevalidationRecords, setPrevalidationRecords] = useState(
        [...fund.csv_required_keys].filter((key) => key !== eligibleKey),
    );

    const recordTypesAvailable = useMemo(() => {
        return recordTypes
            .filter((type) => {
                return type.criteria && type.key != 'primary_email' && !prevalidationRecords?.includes(type?.key);
            })
            .filter((record) => record.key !== eligibleKey);
    }, [eligibleKey, prevalidationRecords, recordTypes]);

    const criteriaRuleByKey = useMemo(() => {
        const criteriaRuleByKey = {};

        fund.criteria.forEach((criteria) => {
            const operatorLocale = {
                '<': 'minder dan',
                '<=': 'minder dan of gelijk aan',
                '>': 'meer dan',
                '>=': 'meer dan of gelijk aan',
                '=': 'is',
                '*': 'elke',
            }[criteria.operator];

            criteriaRuleByKey[criteria.record_type.key] = `${operatorLocale} ${criteria.value}`;
        });

        return criteriaRuleByKey;
    }, [fund.criteria]);

    const form = useFormBuilder(
        fund.criteria.reduce(
            (values, criteria) => ({
                ...values,
                ...(criteria.operator == '=' ? { [criteria.record_type.key]: criteria.value } : {}),
            }),
            {},
        ),
        (values) => {
            setProgress(0);

            const dateValues = {};

            for (const valueKey in values) {
                if (recordTypesByKey[valueKey]?.type == 'date') {
                    dateValues[valueKey] = dateFormat(dateParse(values[valueKey]), 'dd-MM-yyyy');
                }
            }

            prevalidationService
                .submit(
                    {
                        ...values,
                        ...dateValues,
                        ...(eligibleKey && eligibleKeyValue ? { [eligibleKey]: eligibleKeyValue } : {}),
                    },
                    fund.id,
                )
                .then((res) => {
                    onCreated?.();
                    setPrevalidation(res.data.data);
                    setVerificationRequested(false);
                    setPrevalidationPrimaryKey(
                        res.data.data.records?.find((record) => record.key == fund.csv_primary_key),
                    );
                })
                .catch((err: ResponseError) => {
                    form.setErrors(err.data.errors);
                    form.setIsLocked(false);
                    pushDanger('Mislukt!', err.data.message);
                    setVerificationRequested(false);
                })
                .finally(() => setProgress(100));
        },
    );

    const formNewRecord = useFormBuilder(
        { record_type_key: recordTypesAvailable.length ? recordTypesAvailable[0].key : null },
        (values) => {
            setPrevalidationRecords([...prevalidationRecords, values.record_type_key]);
            setShowNewRecord(false);
            formNewRecord.reset();
            formNewRecord.setIsLocked(false);
        },
    );

    const removeExtraRecord = useCallback(
        (recordKey) => {
            if (prevalidationRecords?.includes(recordKey)) {
                prevalidationRecords.splice(prevalidationRecords.indexOf(recordKey), 1);
                delete form.values[recordKey];
            }
        },
        [form.values, prevalidationRecords],
    );

    return (
        <div className={`modal modal-md modal-animated ${modal.loading ? 'modal-loading' : ''} ${className}`}>
            <div className="modal-backdrop" onClick={modal.close} />

            <form
                className="modal-window"
                onSubmit={(e) => {
                    e.preventDefault();
                    verificationRequested ? form.submit() : setVerificationRequested(true);
                }}>
                <a className="mdi mdi-close modal-close" onClick={modal.close} role="button" />

                <div className="modal-header">
                    {verificationRequested ? 'Gegevens controleren' : 'Activatiecode aanmaken'}
                </div>

                <div className="modal-body">
                    {verificationRequested && !prevalidation && (
                        <div className="modal-section">
                            <div className="modal-text text-center">
                                Controleer of u de juiste gegevens hebt ingevuld voordat u deze bevestigd.
                            </div>

                            <div className="row">
                                <div className="col col-lg-8 col-lg-offset-2">
                                    <div className="block block-compact-datalist">
                                        {prevalidationRecords?.map((fundRecord, index) => (
                                            <div className="datalist-row" key={index}>
                                                <strong className="datalist-key">
                                                    {recordTypesByKey && recordTypesByKey[fundRecord] && (
                                                        <span>{recordTypesByKey[fundRecord]?.name}</span>
                                                    )}
                                                </strong>
                                                <div className="datalist-value text-primary text-right">
                                                    {form.values[fundRecord] ? (
                                                        form.values[fundRecord]
                                                    ) : (
                                                        <TableEmptyValue />
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {!prevalidation && !verificationRequested && (
                        <div className="modal-section form">
                            <div className="row">
                                <div className="col col-lg-8 col-lg-offset-2 col-lg-12">
                                    {prevalidationRecords?.map((fundRecord, index) => (
                                        <div className={'form-group'} key={index}>
                                            <label className="form-label" key={index}>
                                                {recordTypesByKey && recordTypesByKey[fundRecord] && (
                                                    <span>{recordTypesByKey[fundRecord]?.name}</span>
                                                )}

                                                {criteriaRuleByKey[fundRecord] && (
                                                    <span className="text-muted-dark">
                                                        &nbsp;({criteriaRuleByKey[fundRecord]})
                                                    </span>
                                                )}
                                            </label>

                                            <div className="flex-row">
                                                <div className="flex-col flex-col-padless-right flex-grow">
                                                    {recordTypesByKey &&
                                                        recordTypesByKey[fundRecord] &&
                                                        ['select', 'bool'].includes(
                                                            recordTypesByKey[fundRecord].type,
                                                        ) && (
                                                            <SelectControl
                                                                propKey={'value'}
                                                                placeholder="Waarde"
                                                                value={form.values[fundRecord]}
                                                                options={recordTypesByKey[fundRecord].options}
                                                                optionsComponent={SelectControlOptions}
                                                                onChange={(value: string) => {
                                                                    form.update({ [fundRecord]: value });
                                                                }}
                                                            />
                                                        )}

                                                    {recordTypesByKey &&
                                                        recordTypesByKey[fundRecord] &&
                                                        recordTypesByKey[fundRecord].type == 'date' && (
                                                            <DatePickerControl
                                                                value={dateParse(form.values[fundRecord])}
                                                                dateFormat="dd-MM-yyyy"
                                                                placeholder={recordTypesByKey[fundRecord]?.name}
                                                                onChange={(date) => {
                                                                    form.update({ [fundRecord]: dateFormat(date) });
                                                                }}
                                                            />
                                                        )}

                                                    {recordTypesByKey &&
                                                        recordTypesByKey[fundRecord] &&
                                                        recordTypesByKey[fundRecord].type == 'number' && (
                                                            <input
                                                                type="number"
                                                                value={form.values[fundRecord] || ''}
                                                                placeholder={recordTypesByKey[fundRecord]?.name}
                                                                onChange={(e) => {
                                                                    form.update({ [fundRecord]: e.target.value });
                                                                }}
                                                                className="form-control"
                                                            />
                                                        )}

                                                    {recordTypesByKey &&
                                                        recordTypesByKey[fundRecord] &&
                                                        !['number', 'select', 'bool', 'date'].includes(
                                                            recordTypesByKey[fundRecord].type,
                                                        ) && (
                                                            <input
                                                                type="string"
                                                                value={form.values[fundRecord] || ''}
                                                                placeholder={recordTypesByKey[fundRecord]?.name}
                                                                onChange={(e) => {
                                                                    form.update({ [fundRecord]: e.target.value });
                                                                }}
                                                                className="form-control"
                                                            />
                                                        )}
                                                </div>

                                                {fund.csv_required_keys.indexOf(fundRecord) == -1 && (
                                                    <div className="flex-col">
                                                        <button
                                                            className="button button-text button-text-muted"
                                                            onClick={() => removeExtraRecord(fundRecord)}>
                                                            <em className="mdi mdi-close" />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>

                                            <FormError error={form.errors['data.' + fundRecord]} />
                                        </div>
                                    ))}

                                    {showNewRecord && (
                                        <Fragment>
                                            <label className="form-label">Selecteer eigenschap</label>
                                            <div className="flex-row">
                                                <div className="flex-col flex-grow">
                                                    <div className="form-offset">
                                                        <SelectControl
                                                            propKey={'key'}
                                                            value={formNewRecord.values.record_type_key}
                                                            options={recordTypesAvailable}
                                                            optionsComponent={SelectControlOptions}
                                                            onChange={(record_type_key: string) => {
                                                                formNewRecord.update({ record_type_key });
                                                            }}
                                                        />
                                                    </div>
                                                </div>

                                                <div className="flex-col">
                                                    <button
                                                        type="button"
                                                        className="button button-primary"
                                                        onClick={() => formNewRecord.submit()}>
                                                        Toevoegen
                                                    </button>
                                                </div>
                                            </div>
                                        </Fragment>
                                    )}

                                    {!showNewRecord && recordTypesAvailable.length > 0 && (
                                        <div className="form-actions text-center">
                                            <button
                                                className="button button-primary"
                                                type="button"
                                                onClick={() => setShowNewRecord(true)}>
                                                <em className="mdi mdi-plus icon-start" />
                                                Eigenschap toevoegen
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {prevalidation && (
                        <div className="modal-section">
                            {prevalidationPrimaryKey && (
                                <Fragment>
                                    <div className="modal-heading text-center">
                                        {prevalidationPrimaryKey.name || prevalidationPrimaryKey.key}:
                                        <div className="text-primary">{prevalidationPrimaryKey.value}</div>
                                    </div>

                                    <div className="modal-heading text-center">
                                        Activatiecode:
                                        <div className="text-primary">{prevalidation.uid}</div>
                                    </div>
                                </Fragment>
                            )}
                        </div>
                    )}
                </div>

                {!verificationRequested && (
                    <div className="modal-footer text-center">
                        <button type="button" className="button button-default" onClick={modal.close} id="close">
                            Sluiten
                        </button>

                        {!prevalidation && (
                            <button type="submit" className="button button-primary">
                                Bevestigen
                            </button>
                        )}
                    </div>
                )}

                {verificationRequested && (
                    <div className="modal-footer text-center">
                        <button
                            type="button"
                            className="button button-default"
                            onClick={() => setVerificationRequested(false)}>
                            Sluiten
                        </button>

                        {!prevalidation && (
                            <button type="submit" className="button button-primary">
                                Bevestigen
                            </button>
                        )}
                    </div>
                )}
            </form>
        </div>
    );
}
