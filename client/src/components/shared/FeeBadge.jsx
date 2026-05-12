import { getStatusColor } from '../../lib/utils';

export default function FeeBadge({ status }) {
  const color = getStatusColor(status);
  const label = status?.charAt(0).toUpperCase() + status?.slice(1);
  return (
    <span className={`badge ${color}`}>
      {status === 'pending' && '⚠ '}{label}
    </span>
  );
}
