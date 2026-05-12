import { motion } from 'framer-motion';
import { useState } from 'react';

export default function DataTable({ columns, data, loading, onRowClick }) {
  const [sortField, setSortField] = useState(null);
  const [sortDir, setSortDir] = useState('asc');

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const sortedData = sortField
    ? [...(data || [])].sort((a, b) => {
        const aVal = a[sortField] || '';
        const bVal = b[sortField] || '';
        const cmp = String(aVal).localeCompare(String(bVal));
        return sortDir === 'asc' ? cmp : -cmp;
      })
    : data || [];

  return (
    <div className="card overflow-hidden p-0">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#EAEAEA]">
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => col.sortable && handleSort(col.key)}
                  className={`px-4 py-3 text-left text-xs font-medium text-[#666666] uppercase tracking-wider sticky top-0 bg-white ${col.sortable ? 'cursor-pointer hover:text-[#111111]' : ''}`}
                >
                  {col.label}
                  {sortField === col.key && (sortDir === 'asc' ? ' ↑' : ' ↓')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedData.map((row, i) => (
              <motion.tr
                key={row._id || i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => onRowClick?.(row)}
                className="border-b border-[#EAEAEA] table-row cursor-pointer"
              >
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3 text-[#111111]">
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </motion.tr>
            ))}
            {!loading && sortedData.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center text-[#888888]">
                  No data found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
