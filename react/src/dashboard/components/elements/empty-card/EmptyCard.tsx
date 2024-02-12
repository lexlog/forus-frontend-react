import React, { useMemo } from 'react';
import { NavLink } from 'react-router-dom';

interface EmptyButtonType {
    to?: string;
    type?: string;
    icon?: string;
    text?: string;
    dusk?: string;
    iconPosition?: 'start' | 'end';
    onClick?: (e: React.MouseEvent<HTMLElement>) => void;
}

export default function EmptyCard({
    title,
    description,
    textAlign,
    button = null,
    buttons = [],
}: {
    title?: string;
    description?: string;
    textAlign?: 'left' | 'center' | 'right';
    button?: EmptyButtonType;
    buttons?: Array<EmptyButtonType>;
}) {
    const descriptionLines = useMemo(() => {
        return description?.split('\n') || [];
    }, [description]);

    return (
        <div className="card">
            <div className="card-section">
                <div className={`block block-empty text-${textAlign || 'center'}`}>
                    {title && <div className="empty-title">{title}</div>}

                    {descriptionLines.map((value, index) => (
                        <div key={index} className="empty-details">
                            {value}
                        </div>
                    ))}

                    {button && (
                        <div className={'empty-actions'}>
                            <div className="button-group">
                                {[button, ...buttons].map((button, index) => (
                                    <NavLink
                                        key={index}
                                        to={button.to}
                                        onClick={button.onClick}
                                        className={`button button-${button.type || 'default'}`}
                                        data-dusk={button.dusk || 'btnEmptyBlock'}>
                                        {button.icon && button.iconPosition == 'start' && (
                                            <em className={`mdi mdi-${button.icon} icon-start`} />
                                        )}
                                        {button.text}
                                        {button.icon && button.iconPosition == 'end' && (
                                            <em className={`mdi mdi-${button.icon} icon-end`} />
                                        )}
                                    </NavLink>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
