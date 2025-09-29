import type { Meta, StoryObj } from '@storybook/react';
import { Label } from './Label';

const meta: Meta<typeof Label> = {
    title: 'UI Kit/Labels',
    component: Label,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
    argTypes: {
        children: {
            control: { type: 'text' },
        },
    },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        children: 'Default Label',
    },
};

export const FormLabel: Story = {
    args: {
        children: 'Email Address',
    },
};

export const RequiredLabel: Story = {
    render: () => (
        <Label>
            Password <span style={{ color: 'red' }}>*</span>
        </Label>
    ),
};

export const LongLabel: Story = {
    args: {
        children: 'This is a very long label text that might wrap to multiple lines',
    },
};

export const WithInput: Story = {
    render: () => (
        <div style={{ display: 'grid', gap: '8px' }}>
            <Label>Username</Label>
            <input
                type="text"
                placeholder="Enter username"
                style={{
                    padding: '8px 12px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    background: '#161a22',
                    color: '#e8eaed',
                    outline: 'none'
                }}
            />
        </div>
    ),
};
