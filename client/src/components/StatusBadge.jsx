const LABELS = {
  pending: 'Pending',
  ready_to_ship: 'Ready to ship',
  in_transit: 'In transit',
  out_for_delivery: 'Out for delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  rto: 'Returned to origin'
};

export default function StatusBadge({ status }) {
  return <span className={`badge ${status}`}>{LABELS[status] || status}</span>;
}
