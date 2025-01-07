import Fund from '../../../props/models/Fund';
import React, { Fragment, useState } from 'react';
import TableEmptyValue from '../table-empty-value/TableEmptyValue';
import useTranslate from '../../../hooks/useTranslate';

export default function FundStateLabels({ fund }: { fund: Fund }) {
    const translate = useTranslate();

    const [stateLabels] = useState({
        active: 'tag-success',
        paused: 'tag-warning',
        closed: 'tag-default',
        waiting: 'tag-warning',
    });

    return (
        <Fragment>
            {!fund.archived && stateLabels[fund.state] ? (
                <span className={`tag tag-sm ${stateLabels[fund.state] || ''}`}>
                    {translate(`components.organization_funds.states.${fund.state}`)}
                </span>
            ) : (
                <TableEmptyValue />
            )}

            {fund.archived && (
                <span className="tag tag-sm tag-default">
                    {translate('components.organization_funds.states.archived')}
                </span>
            )}
        </Fragment>
    );
}
