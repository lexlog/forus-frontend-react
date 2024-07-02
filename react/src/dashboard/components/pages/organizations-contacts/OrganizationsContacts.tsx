import React, { useContext, useState } from 'react';
import useActiveOrganization from '../../../hooks/useActiveOrganization';
import { useOrganizationService } from '../../../services/OrganizationService';
import StateNavLink from '../../../modules/state_router/StateNavLink';
import useTranslate from '../../../hooks/useTranslate';
import useFormBuilder from '../../../hooks/useFormBuilder';
import FormError from '../../elements/forms/errors/FormError';
import classNames from 'classnames';
import usePushSuccess from '../../../hooks/usePushSuccess';
import usePushApiError from '../../../hooks/usePushApiError';
import { ResponseError } from '../../../props/ApiResponses';
import { mainContext } from '../../../contexts/MainContext';
import useSetProgress from '../../../hooks/useSetProgress';

export default function OrganizationsContacts() {
    const activeOrganization = useActiveOrganization();
    const { setOrganizationData } = useContext(mainContext);

    const translate = useTranslate();
    const setProgress = useSetProgress();
    const pushSuccess = usePushSuccess();
    const pushApiError = usePushApiError();

    const organizationService = useOrganizationService();

    const [shownInfoBoxes, setShownInfoBoxes] = useState<Array<string>>([]);

    const [available] = useState([
        { key: 'fund_balance_low', type: 'email' },
        { key: 'bank_connections_expiring', type: 'email' },
        { key: 'provider_applied', type: 'email' },
    ]);

    const form = useFormBuilder(
        {
            contacts: available.map((type) => ({
                ...type,
                ...activeOrganization.contacts.find((contact) => contact.key === type.key),
            })),
        },
        () => {
            setProgress(0);

            organizationService
                .update(activeOrganization.id, form.values)
                .then((res) => {
                    setOrganizationData(activeOrganization.id, { contacts: res.data.data.contacts });
                    pushSuccess('Opgeslagen!');
                })
                .catch((err: ResponseError) => {
                    form.setErrors(err.data.errors);
                    pushApiError(err);
                })
                .finally(() => {
                    form.setIsLocked(false);
                    setProgress(100);
                });
        },
    );

    return (
        <div className="card">
            <form className="form" onSubmit={form.submit}>
                <div className="card-header">
                    <div className="card-title">{translate('organization_contacts.title')}</div>
                </div>
                <div className="card-section card-section-primary">
                    <div className="row">
                        <div className="col col-lg-9 col-sm-12">
                            {form.values.contacts?.map((contact, index) => (
                                <div key={contact.key} className="form-group form-group-inline">
                                    <label className="form-label">
                                        {translate(`organization_contacts.labels.${contact.key}`)}
                                    </label>
                                    <div className="form-offset">
                                        <div className="form-group-info">
                                            <div className="form-group-info-control">
                                                <div className="flex flex-grow flex-vertical">
                                                    <input
                                                        className="form-control"
                                                        value={contact.value || ''}
                                                        type={contact.type}
                                                        onChange={(e) => {
                                                            form.values.contacts[index].value = e.target.value;
                                                            form.update({ ...form.values });
                                                        }}
                                                        placeholder={translate(
                                                            'organization_contacts.labels.' + contact.key,
                                                        )}
                                                    />
                                                    <FormError error={form.errors?.[`contacts.${index}.value`]} />
                                                </div>
                                            </div>
                                            <div className="form-group-info-button">
                                                <div
                                                    className={classNames(
                                                        'button',
                                                        'button-default',
                                                        'button-icon',
                                                        'pull-left',
                                                        shownInfoBoxes.includes(contact.key) && 'active',
                                                    )}
                                                    onClick={() => {
                                                        setShownInfoBoxes((list) => {
                                                            if (list.includes(contact.key)) {
                                                                list.splice(list.indexOf(contact.key), 1);
                                                            } else {
                                                                list.push(contact.key);
                                                            }

                                                            return [...list];
                                                        });
                                                    }}>
                                                    <em className="mdi mdi-information" />
                                                </div>
                                            </div>
                                        </div>

                                        {shownInfoBoxes.includes(contact.key) && (
                                            <div className="block block-info-box block-info-box-primary">
                                                <div className="info-box-icon mdi mdi-information" />
                                                {contact.key == 'fund_balance_low' && (
                                                    <div className="info-box-content">
                                                        <div className="block block-markdown">
                                                            <h4>Laag saldo op het fonds</h4>
                                                            <p>
                                                                Vul hier een e-mailadres in dat een notificatie krijgt
                                                                wanneer het saldo op het fonds te laag is. Dit kan ook
                                                                een e-mailadres zijn dat geen medewerker is van de
                                                                organisatie.
                                                            </p>
                                                        </div>
                                                    </div>
                                                )}

                                                {contact.key == 'bank_connections_expiring' && (
                                                    <div className="info-box-content">
                                                        <div className="block block-markdown">
                                                            <h4>Bank integratie verloopt</h4>
                                                            <p>
                                                                Vul hier een e-mailadres in dat een notificatie krijgt
                                                                wanneer de huidige bank integratie verloopt. Dit kan ook
                                                                een e-mailadres zijn dat geen medewerker is van de
                                                                organisatie.
                                                            </p>
                                                        </div>
                                                    </div>
                                                )}

                                                {contact.key == 'provider_applied' && (
                                                    <div className="info-box-content">
                                                        <div className="block block-markdown">
                                                            <h4>Aanbieder heeft zich aangemeld</h4>
                                                            <p>
                                                                Vul hier een e-mailadres in dat een notificatie krijgt
                                                                wanneer een aanbieder zich heeft aangemeld voor een
                                                                fonds. Dit kan ook een e-mailadres zijn dat geen
                                                                medewerker is van de organisatie.
                                                            </p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="card-section card-section-primary">
                    <div className="text-center">
                        <StateNavLink name={'organizations'} className="button button-default" id="cancel">
                            {translate('organization_contacts.buttons.cancel')}
                        </StateNavLink>
                        <button className="button button-primary" type="submit">
                            {translate('organization_contacts.buttons.submit')}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}
