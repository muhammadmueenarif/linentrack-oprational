"use client";
import React, { useState, useEffect } from 'react';
import { Trash, Eye } from 'lucide-react';

const Table = ({ data, columns, onDelete, onViewStore, onToggleUserType }) => {
  const [showFullContent, setShowFullContent] = useState({});

  useEffect(() => {
    console.log("Table data:", data);
    console.log("Table columns:", columns);
  }, [data, columns]);

  const toggleContent = (id, field) => {
    setShowFullContent(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: !prev[id]?.[field]
      }
    }));
  };

  const truncateContent = (content, maxLength = 4) => {
    if (typeof content !== 'string') return content;
    return content.length > maxLength ? `${content.substring(0, maxLength)}...` : content;
  };

  const getStatusDisplay = (row) => {
    const daysRemaining = parseInt(row.expiringIn);

    if (row.type === 'Demo') {
      // Only show expired status for Demo accounts
      if (daysRemaining <= 0) {
        return {
          text: 'Expired',
          className: 'bg-red-200 text-red-800'
        };
      }
      return {
        text: 'Demo',
        className: 'bg-[#E7E6F9] text-[#4640DE]'
      };
    } else if (row.type === 'Paid') {
      // Paid accounts always show as Subscriber, regardless of expiration
      return {
        text: 'Subscriber',
        className: 'bg-yellow-200 text-yellow-800'
      };
    }

    return {
      text: row.type || 'N/A',
      className: 'bg-gray-200 text-gray-800'
    };
  };

  const renderCellContent = (row, column) => {
    const cellData = row[column.key];

    switch (column.key) {
      case 'type':
        return (
          <label className="switch">
            <input
              type="checkbox"
              checked={row.type === 'Paid'}
              onChange={() => onToggleUserType(row.id, row.type)}
            />
            <span className="slider round"></span>
          </label>
        );
      case 'status': {
        const status = getStatusDisplay(row);
        return (
          <span className={`px-2 py-1 rounded-full text-xs ${status.className}`}>
            {status.text}
          </span>
        );
      }
      case 'actions':
        return (
          <div className="flex items-center space-x-2">
            <button
              className="text-[#4640DE] hover:underline"
              onClick={() => onViewStore(row)}
            >
              View Store
            </button>
            <button
              className="text-red-600 hover:text-red-800"
              onClick={() => onDelete(row.id)}
            >
              <Trash size={18} />
            </button>
          </div>
        );
      case 'password':
      case 'email':
      case 'id':
        return (
          <span
            className="cursor-pointer hover:text-blue-600"
            onClick={() => toggleContent(row.id, column.key)}
          >
            {showFullContent[row.id]?.[column.key] ? cellData : (column.key === 'password' ? '***' : truncateContent(cellData))}
          </span>
        );
      default:
        return cellData || 'N/A';
    }
  };

  if (!data || data.length === 0) {
    return <div className="text-center py-4 text-gray-500">No data available</div>;
  }

  return (
    <div className="overflow-x-auto mt-10">
      <table className="w-full bg-white rounded shadow text-sm">
        <thead className="bg-[#EDF4FF]">
          <tr>
            {columns.map((column) => (
              <th key={column.key} className="p-3 text-left font-medium">{column.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.id} className="border-b hover:bg-gray-50">
              {columns.map((column) => (
                <td key={column.key} className="p-3">
                  {renderCellContent(row, column)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Table;