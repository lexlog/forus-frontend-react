import React, { useContext, useEffect, useMemo, useState } from 'react';
import { pushNotificationContext } from '../context/PushNotificationsContext';
import StateNavLink from '../../../../webshop/modules/state_router/StateNavLink';
import classNames from 'classnames';
import { clickOnKeyEnter } from '../../../helpers/wcag';

export default function PushNotificationsGroup({
    group = 'default',
    className = '',
    showConfig = true,
    maxVisibleCount = 3,
}: {
    group?: string;
    className?: string;
    showConfig?: boolean;
    maxVisibleCount?: number;
}) {
    const { notifications, popNotification, getDismissTimeValue } = useContext(pushNotificationContext);

    const [showAll, setShowAll] = useState(false);

    const dismissTime = useMemo<number>(() => {
        return getDismissTimeValue(group);
    }, [getDismissTimeValue, group]);

    const notificationsList = useMemo(() => {
        return notifications.filter((notification) => notification.group === group);
    }, [notifications, group]);

    const shownNotifications = useMemo(
        () => notificationsList.slice(0, showAll ? notificationsList.length : maxVisibleCount),
        [maxVisibleCount, notificationsList, showAll],
    );

    useEffect(() => {
        if (notificationsList?.length <= maxVisibleCount) {
            setShowAll(false);
        }
    }, [maxVisibleCount, notificationsList]);

    if (shownNotifications?.length < 1) {
        return null;
    }

    return (
        <div
            className={classNames(
                'block block-push-notifications',
                showAll && 'block-push-notifications-show-all',
                className,
            )}>
            {showConfig && notificationsList.length > 0 && (
                <div className="notification-setting">
                    {dismissTime
                        ? `Automatisch sluiten na ${dismissTime} seconden`
                        : 'Automatisch sluiten is uitgeschakeld'}
                    <div className="notification-setting-separator" />
                    <StateNavLink name={'preferences-notifications'} params={{ section: 'push' }} target={'_blank'}>
                        Aanpassen
                    </StateNavLink>
                </div>
            )}
            <div className={'notification-list'} role="alert">
                {shownNotifications?.map((notification) => (
                    <div
                        key={notification.id}
                        className={classNames('notification', `notification-${notification.type}`)}
                        role="status"
                        data-dusk={`${notification.type}Notification`}>
                        {notification.icon && <em className={`notification-icon mdi mdi-${notification.icon}`} />}

                        <div className="notification-content">
                            {notification.imageSrc && (
                                <div className="notification-image">
                                    <img src={notification.imageSrc} alt="notification" />
                                </div>
                            )}

                            <div className="notification-details">
                                {notification.title && (
                                    <strong className={'notification-title'}>{notification.title}</strong>
                                )}

                                {notification.message && (
                                    <span className={'notification-description'}>{notification.message}</span>
                                )}
                            </div>
                        </div>

                        {showConfig && (
                            <div className="notification-setting-inline">
                                {dismissTime
                                    ? `Automatisch sluiten na ${dismissTime} seconden`
                                    : 'Automatisch sluiten is uitgeschakeld'}

                                <StateNavLink name={'preferences-notifications'} params={{ section: 'push' }}>
                                    Aanpassen
                                </StateNavLink>
                            </div>
                        )}

                        {notification.button && (
                            <div className="notification-button">
                                <div
                                    className="button button-primary button-sm"
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={clickOnKeyEnter}
                                    onClick={notification.button.onClick}>
                                    <em className={`mdi mdi-${notification.button.icon}`} aria-hidden="true" />
                                    {notification.button.text}
                                </div>
                            </div>
                        )}

                        <div
                            className="notification-close mdi mdi-close"
                            role="button"
                            tabIndex={0}
                            onKeyDown={clickOnKeyEnter}
                            onClick={() => popNotification(notification.id)}
                        />
                    </div>
                ))}
            </div>

            {notificationsList?.length > maxVisibleCount && (
                <div className="notification-show-all" tabIndex={0} onClick={() => setShowAll(!showAll)}>
                    {showAll
                        ? `Hide +${notificationsList.length - maxVisibleCount} notifications`
                        : `Show +${notificationsList.length - maxVisibleCount} notifications`}

                    <em className={classNames('mdi', showAll ? 'mdi-chevron-up' : 'mdi-chevron-down')} />
                </div>
            )}
        </div>
    );
}
