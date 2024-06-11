import NotificationTemplate from './NotificationTemplate';

export default interface SystemNotification {
    id?: number;
    key?: string;
    title?: string;
    order?: number;
    group?: string;
    optional?: boolean;
    editable?: boolean;
    enable_all?: boolean;
    enable_mail?: boolean;
    enable_push?: boolean;
    enable_database?: boolean;
    variables?: Array<string>;
    channels?: Array<'database' | 'mail' | 'push'>;
    templates?: Array<NotificationTemplate>;
    templates_default?: Array<NotificationTemplate>;
}
