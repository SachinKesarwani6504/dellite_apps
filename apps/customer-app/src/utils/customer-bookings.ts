export type CustomerBookingStatus = 'ONGOING' | 'COMPLETED';

export type CustomerBookingListItem = {
  id: string;
  serviceTitle: string;
  category: string;
  workerName: string;
  slotLabel: string;
  address: string;
  amountLabel?: string;
  status: CustomerBookingStatus;
  statusLabel: string;
  accentColor: string;
};

export const customerBookingTabs: Array<{ label: string; value: CustomerBookingStatus }> = [
  { label: 'Ongoing', value: 'ONGOING' },
  { label: 'Completed', value: 'COMPLETED' },
];

export const customerBookingsByStatus: Record<CustomerBookingStatus, CustomerBookingListItem[]> = {
  ONGOING: [
    {
      id: 'booking_ongoing_101',
      serviceTitle: 'AC General Service',
      category: 'Home Repair',
      workerName: 'Ravi Kumar',
      slotLabel: 'Today, 4:00 PM - 6:00 PM',
      address: 'Civil Lines, Prayagraj',
      amountLabel: '\u20B9250/hr',
      status: 'ONGOING',
      statusLabel: 'On the Way',
      accentColor: '#F59E0B',
    },
    {
      id: 'booking_ongoing_102',
      serviceTitle: 'Bathroom Plumbing Repair',
      category: 'Plumbing',
      workerName: 'Imran Ali',
      slotLabel: 'Tomorrow, 10:00 AM - 12:00 PM',
      address: 'Naini, Prayagraj',
      amountLabel: '\u20B9650',
      status: 'ONGOING',
      statusLabel: 'In Progress',
      accentColor: '#22C55E',
    },
    {
      id: 'booking_ongoing_103',
      serviceTitle: 'Deep Home Cleaning',
      category: 'Cleaning',
      workerName: 'Sneha Patel',
      slotLabel: 'Tomorrow, 2:00 PM - 5:00 PM',
      address: 'Kareli, Prayagraj',
      amountLabel: '\u20B91,200',
      status: 'ONGOING',
      statusLabel: 'Assigned',
      accentColor: '#3B82F6',
    },
  ],
  COMPLETED: [
    {
      id: 'booking_done_201',
      serviceTitle: 'Kitchen Chimney Cleaning',
      category: 'Cleaning',
      workerName: 'Ajay Yadav',
      slotLabel: '24 Apr, 11:00 AM',
      address: 'Tagore Town, Prayagraj',
      amountLabel: '\u20B9700',
      status: 'COMPLETED',
      statusLabel: 'Completed',
      accentColor: '#6366F1',
    },
    {
      id: 'booking_done_202',
      serviceTitle: 'Sofa Shampoo Cleaning',
      category: 'Cleaning',
      workerName: 'Pooja Verma',
      slotLabel: '23 Apr, 6:00 PM',
      address: 'Jhunsi, Prayagraj',
      amountLabel: '\u20B9800',
      status: 'COMPLETED',
      statusLabel: 'Completed',
      accentColor: '#6366F1',
    },
    {
      id: 'booking_done_203',
      serviceTitle: 'Water Tank Cleaning',
      category: 'Cleaning',
      workerName: 'Nitesh Singh',
      slotLabel: '21 Apr, 9:00 AM',
      address: 'Phaphamau, Prayagraj',
      amountLabel: '\u20B91,000',
      status: 'COMPLETED',
      statusLabel: 'Completed',
      accentColor: '#6366F1',
    },
  ],
};

export function findCustomerBookingById(bookingId: string) {
  return Object.values(customerBookingsByStatus)
    .flat()
    .find(booking => booking.id === bookingId) ?? null;
}
