import { NavLink } from 'react-router-dom';
import React, { HTMLAttributes, ReactElement } from 'react';
import { getStateRouteUrl, useNavigateState } from './Router';

export default function StateNavLink({
    name,
    dusk = null,
    params = {},
    query = {},
    state = {},
    children,
    className,
    disabled = false,
    target,
    activeClass = 'active',
    customElement = null,
    onClick = null,
}: HTMLAttributes<HTMLAnchorElement> & {
    name: string;
    dusk?: string;
    params?: object;
    query?: object;
    state?: object;
    children: ReactElement | Array<ReactElement | string> | string;
    disabled?: boolean;
    target?: string;
    activeClass?: string;
    customElement?: string;
    onClick?: (e: React.MouseEvent) => void;
}) {
    const navigateState = useNavigateState();

    if (disabled) {
        return (
            <div data-dusk={dusk} className={className}>
                {children}
            </div>
        );
    }

    if (customElement) {
        return React.createElement(
            customElement,
            {
                className,
                'data-dusk': dusk,
                style: { cursor: 'pointer' },
                onClick: (e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    onClick?.(e);
                    navigateState(name, params, query, { state });
                },
            },
            children,
        );
    }

    return (
        <NavLink
            target={target}
            data-dusk={dusk}
            onClick={onClick}
            className={({ isActive, isPending }) =>
                ['state-nav-link', className, isPending ? 'pending' : '', isActive ? activeClass : ''].join(' ')
            }
            state={state}
            to={getStateRouteUrl(name, params, query)}>
            {children}
        </NavLink>
    );
}
