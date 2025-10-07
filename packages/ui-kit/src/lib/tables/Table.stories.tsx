import type { Meta, StoryObj } from '@storybook/react';
import { Table } from './Table';

const meta: Meta<typeof Table> = {
  title: 'UI Kit/Tables',
  component: Table,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    theme: {
      control: { type: 'select' },
      options: ['light', 'dark'],
    },
    loading: {
      control: { type: 'boolean' },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const sampleData = [
  { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Admin' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'User' },
  { id: 3, name: 'Bob Johnson', email: 'bob@example.com', role: 'User' },
  { id: 4, name: 'Alice Brown', email: 'alice@example.com', role: 'Editor' },
];

const columns = [
  { key: 'id', label: 'ID', width: '80px' },
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email' },
  { key: 'role', label: 'Role', align: 'center' as const },
];

export const Default: Story = {
  args: {
    columns,
    data: sampleData,
  },
};

export const DarkTheme: Story = {
  args: {
    columns,
    data: sampleData,
    theme: 'dark',
  },
};

export const Loading: Story = {
  args: {
    columns,
    data: [],
    loading: true,
  },
};

export const Empty: Story = {
  args: {
    columns,
    data: [],
    emptyMessage: 'No users found',
  },
};

export const WithCustomRender: Story = {
  args: {
    columns: [
      { key: 'id', label: 'ID', width: '80px' },
      { key: 'name', label: 'Name' },
      { key: 'email', label: 'Email' },
      {
        key: 'role',
        label: 'Role',
        align: 'center' as const,
        render: value => (
          <span
            style={{
              padding: '4px 8px',
              borderRadius: '4px',
              backgroundColor: value === 'Admin' ? '#ff6b6b' : '#4ecdc4',
              color: 'white',
              fontSize: '12px',
            }}
          >
            {value}
          </span>
        ),
      },
    ],
    data: sampleData,
  },
};

export const ClickableRows: Story = {
  args: {
    columns,
    data: sampleData,
    onRowClick: item => alert(`Clicked on ${item.name}`),
  },
};
