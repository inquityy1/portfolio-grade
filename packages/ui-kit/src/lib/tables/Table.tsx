import React from 'react';

export interface TableColumn<T = any> {
  key: string;
  label: string;
  render?: (value: any, item: T) => React.ReactNode;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

export interface TableProps<T = any> {
  columns: TableColumn<T>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
  className?: string;
  style?: React.CSSProperties;
  rowKey?: keyof T | ((item: T) => string);
  onRowClick?: (item: T) => void;
  theme?: 'light' | 'dark';
}

export function Table<T = any>({
  columns,
  data,
  loading = false,
  emptyMessage = 'No data found',
  className = '',
  style = {},
  rowKey = 'id' as keyof T,
  onRowClick,
  theme = 'light',
}: TableProps<T>) {
  const getRowKey = (item: T, index: number): string => {
    if (typeof rowKey === 'function') {
      return rowKey(item);
    }
    return String(item[rowKey] || index);
  };

  const isDark = theme === 'dark';
  const containerBg = isDark ? 'black' : 'white';
  const headerBg = isDark ? '#333' : '#f8f9fa';
  const headerTextColor = isDark ? 'white' : 'black';
  const rowBg = isDark ? 'black' : 'white';
  const rowBgAlt = isDark ? '#1a1a1a' : '#f8f9fa';
  const borderColor = isDark ? '#333' : '#e0e0e0';
  const textColor = isDark ? 'white' : 'black';

  return (
    <div
      className={`table-container ${className}`}
      style={{
        backgroundColor: containerBg,
        borderRadius: 8,
        overflow: 'hidden',
        border: `1px solid ${borderColor}`,
        ...style,
      }}
    >
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '14px',
        }}
      >
        <thead>
          <tr
            style={{
              backgroundColor: headerBg,
              borderBottom: `2px solid ${borderColor}`,
            }}
          >
            {columns.map(column => (
              <th
                key={column.key}
                style={{
                  padding: '12px 16px',
                  textAlign: column.align || 'left',
                  fontWeight: '600',
                  color: headerTextColor,
                  width: column.width || 'auto',
                }}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <tr
              key={getRowKey(item, index)}
              style={{
                backgroundColor: index % 2 === 0 ? rowBg : rowBgAlt,
                borderBottom: `1px solid ${borderColor}`,
                cursor: onRowClick ? 'pointer' : 'default',
              }}
              onClick={() => onRowClick?.(item)}
            >
              {columns.map(column => (
                <td
                  key={column.key}
                  style={{
                    padding: '12px 16px',
                    textAlign: column.align || 'left',
                    color: textColor,
                  }}
                >
                  {column.render
                    ? column.render((item as any)[column.key], item)
                    : String((item as any)[column.key] || '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {data.length === 0 && !loading && (
        <div
          style={{
            padding: '40px',
            textAlign: 'center',
            color: '#666',
            backgroundColor: headerBg,
          }}
        >
          {emptyMessage}
        </div>
      )}

      {loading && (
        <div
          style={{
            padding: '40px',
            textAlign: 'center',
            color: '#666',
            backgroundColor: headerBg,
          }}
        >
          Loading...
        </div>
      )}
    </div>
  );
}

export default Table;
