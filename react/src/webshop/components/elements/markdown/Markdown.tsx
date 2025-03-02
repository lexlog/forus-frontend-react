import React, { useEffect, useRef } from 'react';
import classNames from 'classnames';

export default function Markdown({
    align,
    content,
    className = '',
    ariaLevel = null,
    fontSize = undefined,
    role = null,
}: {
    content: string;
    align?: 'left' | 'center' | 'right';
    className?: string;
    ariaLevel?: number;
    fontSize?: number;
    role?: string;
}) {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const tables = ref.current?.querySelectorAll('table');

        // fix empty th from markdown and convert preceding h4 to caption
        try {
            tables.forEach((table) => {
                const head = table.querySelector('tHead tr');
                const headers = [...table.querySelectorAll('tHead tr th')];
                const emptyHeaders = headers.filter((th) => th['innerText'] == '');
                const firstRow = table.querySelector('tBody tr:first-child');

                if (emptyHeaders.length > 0 && emptyHeaders.length == headers.length) {
                    [...firstRow.querySelectorAll('td')].forEach((td) => {
                        const th = document.createElement('th');
                        th.textContent = td.textContent;
                        td.replaceWith(th);
                    });
                    head.replaceWith(firstRow);
                }

                if (table.previousElementSibling?.nodeName?.toLowerCase() == 'h4') {
                    const caption = document.createElement('caption');
                    caption.textContent = table.previousElementSibling.textContent;

                    table.previousElementSibling.remove();
                    table.insertBefore(caption, table.firstElementChild);
                }

                if (table.parentNode) {
                    const wrapper = document.createElement('div');
                    wrapper.classList.add('table-wrap');
                    table.parentNode.insertBefore(wrapper, table);
                    wrapper.appendChild(table);
                }
            });
        } catch (e) {
            console.error('Could not fix table headers: ' + e.toString());
            /* empty */
        }

        // make responsive
        try {
            tables.forEach((table) => {
                const headers = [...table.querySelectorAll('tHead tr th')];
                const rows = table.querySelectorAll('tBody tr');

                headers.forEach((value, index) => {
                    rows.forEach((row) => {
                        row.querySelectorAll('td')[index].dataset.title = value.textContent;
                    });
                });

                table.classList.add('table-responsive');
            });
        } catch (e) {
            console.error('Could not apply table responsiveness: ' + e.toString());
            /* empty */
        }
    }, [content]);

    return (
        <div
            ref={ref}
            role={role}
            aria-level={ariaLevel}
            style={{ fontSize: fontSize ? `${fontSize}px` : undefined }}
            className={classNames('block', 'block-markdown', align && `block-markdown-${align}`, className)}
            dangerouslySetInnerHTML={{ __html: content }}
        />
    );
}
