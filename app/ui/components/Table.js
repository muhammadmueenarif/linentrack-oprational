"use client";
import React from 'react';

const Table = ({ 
  headers, 
  data,
  actions,
  renderCell,
  rowActions = true,
  className = '',
  headerRowClassName = '',
  headerCellClassName = '',
  rowClassName = '',
  cellClassName = '',
  tableClassName = '',
  tbodyClassName = ''
}) => {
  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className={`min-w-full table-fixed border-collapse ${tableClassName}`}>
        <thead>
          <tr className={`bg-[#EDF4FF] ${headerRowClassName}`}>
            {headers.map((header, index) => (
              <th 
                key={index} 
                className={`px-6 py-3 text-left text-sm text-gray-900 ${headerCellClassName}`}
              >
                {header.label}
              </th>
            ))}
            {rowActions && <th className="px-6 py-3 text-right">Actions</th>}
          </tr>
        </thead>
        <tbody className={tbodyClassName}>
          {data.map((row, rowIndex) => (
            <tr 
              key={rowIndex} 
              className={`${rowIndex % 2 === 0 ? 'bg-[#EDF4FF]' : 'bg-white'} ${rowClassName}`}
            >
              {headers.map((header, colIndex) => (
                <td 
                  key={colIndex} 
                  className={`px-6 py-4 whitespace-nowrap text-sm text-gray-900 ${cellClassName}`}
                >
                  {renderCell ? renderCell(row, header.key) : row[header.key]}
                </td>
              ))}
              {rowActions && (
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end gap-2">
                    {actions?.map((action, actionIndex) => (
                      <button
                        key={actionIndex}
                        onClick={() => action.onClick(row)}
                        className={`px-3 py-1 rounded-md text-sm font-medium ${action.className}`}
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Table;