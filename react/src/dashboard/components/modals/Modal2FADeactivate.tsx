import React, { useCallback, useEffect, useState } from 'react';
import { ModalState } from '../../modules/modals/context/ModalContext';
import { useIdentity2FAService } from '../../services/Identity2FAService';
import Identity2FA from '../../props/models/Identity2FA';
import usePushDanger from '../../hooks/usePushDanger';
import usePushSuccess from '../../hooks/usePushSuccess';
import FormError from '../elements/forms/errors/FormError';
import PincodeControl from '../elements/forms/controls/PincodeControl';
import Auth2FAInfoBox from '../elements/auth2fa-info-box/Auth2FAInfoBox';
import useTimer from '../../hooks/useTimer';
import classNames from 'classnames';

export default function Modal2FADeactivate({
    modal,
    className,
    onReady,
    onCancel,
    auth2FA,
}: {
    modal: ModalState;
    className?: string;
    onReady: () => void;
    onCancel: () => void;
    auth2FA: Identity2FA;
}) {
    const [type] = useState(auth2FA.provider_type.type);
    const [errorCode, setErrorCode] = useState(null);

    const [step, setStep] = useState<string>('confirmation');
    const identity2FAService = useIdentity2FAService();

    const pushDanger = usePushDanger();
    const pushSuccess = usePushSuccess();
    const timer = useTimer();
    const { setTimer } = timer;

    const [sendingCode, setSendingCode] = useState(null);
    const [deactivating, setDeactivating] = useState(null);

    const [confirmationCode, setConfirmationCode] = useState('');

    const blockResend = useCallback(() => {
        setTimer(10);
    }, [setTimer]);

    const resendCode = useCallback(
        (notify = true) => {
            setSendingCode(true);
            blockResend();

            identity2FAService
                .send(auth2FA.uuid)
                .then(
                    () => (notify ? pushSuccess('Gelukt!', 'We hebben de code opnieuw verstuurd.') : false),
                    (res) => pushDanger('Mislukt!', res?.data?.message),
                )
                .then(() => setSendingCode(false));
        },
        [auth2FA?.uuid, blockResend, identity2FAService, pushDanger, pushSuccess],
    );

    const deactivateProvider = useCallback(() => {
        if (deactivating) {
            return;
        }

        setDeactivating(true);

        identity2FAService
            .deactivate(auth2FA.uuid, {
                key: auth2FA.provider_type.key,
                code: confirmationCode,
            })
            .then(() => {
                setStep('success');
                setErrorCode(null);
            })
            .catch((res) => {
                setErrorCode(res?.data?.errors?.code || null);
                pushDanger(
                    res.status === 404
                        ? 'Er is een fout opgetreden. Vernieuw de pagina.'
                        : res.data?.message || 'Unknown error.',
                );
            })
            .finally(() => window.setTimeout(() => setDeactivating(false), 1000));
    }, [auth2FA.provider_type.key, auth2FA.uuid, confirmationCode, deactivating, identity2FAService, pushDanger]);

    const cancel = useCallback(() => {
        onCancel?.();
        modal.close();
    }, [modal, onCancel]);

    const done = useCallback(() => {
        onReady?.();
        modal.close();
    }, [modal, onReady]);

    const onKeyDown = useCallback(
        (e) => {
            if (e.key === 'Enter' && step == 'success') {
                done();
            }
        },
        [step, done],
    );

    useEffect(() => {
        if (auth2FA.provider_type.type == 'phone') {
            resendCode(false);
        }
    }, [auth2FA, resendCode]);

    useEffect(() => {
        document.body.addEventListener('keydown', onKeyDown);

        return () => {
            document.body.removeEventListener('keydown', onKeyDown);
        };
    }, [onKeyDown]);

    return (
        <div
            className={classNames(
                'modal',
                'modal-lg',
                'modal-animated',
                'modal-2fa-setup',
                modal.loading && 'modal-loading',
                className,
            )}>
            <div className="modal-backdrop" onClick={cancel} />
            <div className="modal-window">
                {step == 'confirmation' && (
                    <form
                        className="modal-body form"
                        onSubmit={(e) => {
                            e?.preventDefault();
                            deactivateProvider();
                        }}>
                        <div className="modal-header">
                            <div className="modal-heading">Tweefactorauthenticatie uischakelen</div>
                            {<div className="modal-close mdi mdi-close" onClick={cancel} role="button" />}
                        </div>
                        <div className="modal-section">
                            <div className="modal-text text-center">
                                <strong className="text-strong">
                                    Om door te gaan, voer de tweefactorauthenticatie beveiligingscode in.
                                </strong>
                            </div>
                            <div className="modal-text text-center">
                                <div className="form-group">
                                    {type == 'phone' && (
                                        <div className="form-label">Voer de 6-cijferige SMS-code in</div>
                                    )}
                                    {type == 'authenticator' && (
                                        <div className="form-label">Voer de 6-cijferige code in vanuit de app</div>
                                    )}
                                    <div className="form-group-offset">
                                        <PincodeControl
                                            value={confirmationCode}
                                            onChange={setConfirmationCode}
                                            className={'block-pincode-compact'}
                                            valueType={'num'}
                                            blockSize={3}
                                            blockCount={2}
                                            ariaLabel={'Voer de tweefactorauthenticatiecode in voor deactivering'}
                                        />

                                        <FormError error={errorCode} />
                                    </div>
                                </div>
                            </div>
                            {type == 'phone' && (
                                <div className="modal-text text-center">
                                    <button
                                        className="button button-text button-text-primary button-sm"
                                        type="button"
                                        onClick={() => resendCode()}
                                        disabled={timer?.time > 0}>
                                        <div
                                            className={`mdi mdi-refresh icon-start ${sendingCode ? 'mdi-spin' : ''}`}
                                        />
                                        Code opnieuw verzenden
                                        {timer?.time > 0 && <span>&nbsp;({timer?.time} seconde(n))</span>}
                                    </button>
                                </div>
                            )}
                            <Auth2FAInfoBox className="flex-center" />
                        </div>
                        <div className="modal-footer">
                            <div className="button-group">
                                <button className="button button-default" type="button" onClick={cancel}>
                                    Annuleer
                                </button>
                                <button
                                    className="button button-primary"
                                    type="submit"
                                    disabled={confirmationCode?.length !== 6}>
                                    Verifieer
                                </button>
                            </div>
                        </div>
                    </form>
                )}

                {step == 'success' && (
                    <div className="modal-body">
                        <div className="modal-header">
                            <div className="modal-heading">Tweefactorauthenticatie uitschakelen</div>
                            <div className="modal-close mdi mdi-close" onClick={cancel} role="button" />
                        </div>
                        <div className="modal-section modal-section-pad form text-center">
                            <div className="modal-icon-mdi">
                                <div className="mdi mdi-check" />
                            </div>
                            <div className="modal-heading">
                                <strong>Tweefactorauthenticatie is succesvol uitgeschakeld</strong>
                            </div>
                            <div className="modal-text">
                                <small>Je tweefactorauthenticatie is succesvol uitgeschakeld</small>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <div className="button-group">
                                <button className="button button-primary" type="submit" onClick={done}>
                                    Bevestigen
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
