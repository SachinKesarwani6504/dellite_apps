import { Gender } from '@/types/auth';

export const GENDER_OPTIONS: Array<{ label: string; value: Gender; icon: string }> = [
  { label: 'Male', value: 'MALE', icon: '👨' },
  { label: 'Female', value: 'FEMALE', icon: '👩' },
  { label: 'Other', value: 'OTHER', icon: '🧑' },
];

export const DEFAULT_HOME_CITY = 'PRAYAGRAJ';

export type WorkerJobStatus = 'ONGOING' | 'COMPLETED';

export type WorkerJobCardItem = {
  id: string;
  title: string;
  category: string;
  customerName: string;
  scheduledAt: string;
  address: string;
  amountLabel: string;
  status: WorkerJobStatus;
  statusLabel: string;
  accentColor: string;
};

export const workerJobStatusTabs: Array<{ label: string; value: WorkerJobStatus }> = [
  { label: 'Ongoing', value: 'ONGOING' },
  { label: 'Completed', value: 'COMPLETED' },
];

export const workerMockJobs: Record<WorkerJobStatus, WorkerJobCardItem[]> = {
  ONGOING: [
    {
      id: 'job_ongoing_101',
      title: 'Electrician: Fan/Light',
      category: 'Home Repair',
      customerName: 'Rahul S.',
      scheduledAt: '15 Mar, 2026 . 10:00 AM',
      address: 'Civil Lines, Prayagraj',
      amountLabel: '\u20B9250/hr',
      status: 'ONGOING',
      statusLabel: 'On the Way',
      accentColor: '#F59E0B',
    },
    {
      id: 'job_ongoing_102',
      title: 'Deep Cleaning',
      category: 'Cleaning',
      customerName: 'Priya M.',
      scheduledAt: '15 Mar, 2026 . 2:00 PM',
      address: 'Tagore Town, Prayagraj',
      amountLabel: '\u20B91,500',
      status: 'ONGOING',
      statusLabel: 'In Progress',
      accentColor: '#22C55E',
    },
    {
      id: 'job_ongoing_103',
      title: 'Bathroom Plumbing Fix',
      category: 'Plumbing',
      customerName: 'Anjali Verma',
      scheduledAt: 'Tomorrow, 10:00 AM',
      address: 'Kareli, Prayagraj',
      amountLabel: '\u20B9650',
      status: 'ONGOING',
      statusLabel: 'Assigned',
      accentColor: '#3B82F6',
    },
  ],
  COMPLETED: [
    {
      id: 'job_done_201',
      title: 'Kitchen Chimney Cleaning',
      category: 'Cleaning',
      customerName: 'Aditya Gupta',
      scheduledAt: '24 Apr, 11:00 AM',
      address: 'Tagore Town, Prayagraj',
      amountLabel: '\u20B9700',
      status: 'COMPLETED',
      statusLabel: 'Completed',
      accentColor: '#6366F1',
    },
    {
      id: 'job_done_202',
      title: 'Fan Installation',
      category: 'Electrical',
      customerName: 'Shreya Mishra',
      scheduledAt: '23 Apr, 6:00 PM',
      address: 'Jhunsi, Prayagraj',
      amountLabel: '\u20B9500',
      status: 'COMPLETED',
      statusLabel: 'Completed',
      accentColor: '#6366F1',
    },
    {
      id: 'job_done_203',
      title: 'Water Tank Cleaning',
      category: 'Cleaning',
      customerName: 'Kunal Yadav',
      scheduledAt: '22 Apr, 9:30 AM',
      address: 'Phaphamau, Prayagraj',
      amountLabel: '\u20B91,100',
      status: 'COMPLETED',
      statusLabel: 'Completed',
      accentColor: '#6366F1',
    },
  ],
};
