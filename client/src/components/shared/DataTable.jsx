import { motion } from 'framer-motion';
import { useState } from 'react';
import { MoreVertical } from 'lucide-react';

export default function DataTable({ columns, data, loading, onRowClick }) {
  const [sortField, setSortField] = useState(null);
  const [sortDir, setSortDir] = useState('asc');
  const [openMenu, setOpenMenu] = useState(null);

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

  // Filter columns based on responsive breakpoints
  const visibleColumns = columns.filter(col => {
    if (col.hideOnMobile === false) return true;
    if (col.hideOnMobile === true) return false;
    return true;
  });

  return (
    <div className="card overflow-hidden p-0">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#EAEAEA] bg-[#F9F9F9]">
              {visibleColumns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => col.sortable && handleSort(col.key)}
                  className={`px-4 py-3 text-left text-xs font-medium text-[#666666] uppercase tracking-wider sticky top-0 bg-[#F9F9F9] whitespace-nowrap ${col.sortable ? 'cursor-pointer hover:text-[#111111]' : ''} ${col.key === 'actions' ? 'w-12 text-center' : ''}`}
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
                className="border-b border-[#EAEAEA] hover:bg-[#F9F9F9] transition-colors"
              >
                {visibleColumns.map((col) => (
                  <td key={col.key} className={`px-4 py-3 text-[#111111] ${col.key === 'actions' ? 'text-center' : ''}`}>
                    {col.isActionMenu && row.actions ? (
                      <div className="relative inline-block">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenu(openMenu === row._id ? null : row._id);
                          }}
                          className="p-1.5 hover:bg-[#EAEAEA] rounded transition-colors inline-flex"
                          title="More actions"
                        >
                          <MoreVertical size={16} className="text-[#666]" />
                        </button>
                        {openMenu === row._id && (
                          <div className="absolute right-0 top-full mt-1 bg-white border border-[#EAEAEA] rounded-lg shadow-xl z-50 min-w-max">
                            {row.actions.map((action, idx) => (
                              <button
                                key={idx}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  action.onClick?.();
                                  setOpenMenu(null);
                                }}
                                className="w-full text-left px-4 py-2.5 text-sm text-[#111] hover:bg-[#F7F7F7] border-b border-[#EAEAEA] last:border-b-0 flex items-center gap-2 transition-colors whitespace-nowrap"
                              >
                                {action.icon && <span className="flex-shrink-0">{action.icon}</span>}
                                <span>{action.label}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </motion.tr>
            ))}
            {!loading && sortedData.length === 0 && (
              <tr>
                <td colSpan={visibleColumns.length} className="px-4 py-12 text-center text-[#888888]">
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
