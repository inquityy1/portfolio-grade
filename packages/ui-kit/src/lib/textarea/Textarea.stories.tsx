import type { Meta, StoryObj } from '@storybook/react';
import { Textarea } from './Textarea';

const meta: Meta<typeof Textarea> = {
    title: 'UI Kit/Textareas',
    component: Textarea,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
    argTypes: {
        placeholder: {
            control: { type: 'text' },
        },
        disabled: {
            control: { type: 'boolean' },
        },
        rows: {
            control: { type: 'number', min: 1, max: 20 },
        },
        value: {
            control: { type: 'text' },
        },
    },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        placeholder: 'Enter your message...',
        rows: 4,
    },
};

export const WithValue: Story = {
    args: {
        value: 'This is pre-filled text in the textarea.',
        rows: 4,
    },
};

export const Disabled: Story = {
    args: {
        placeholder: 'This textarea is disabled',
        disabled: true,
        rows: 4,
    },
};

export const LargeTextarea: Story = {
    args: {
        placeholder: 'Enter a longer message...',
        rows: 8,
    },
};

export const SmallTextarea: Story = {
    args: {
        placeholder: 'Short message',
        rows: 1,
    },
};

export const WithLabel: Story = {
    render: () => (
        <div style={{ display: 'grid', gap: '8px' }}>
            <label style={{ color: '#e8eaed', fontSize: '0.95rem' }}>Comments</label>
            <Textarea
                placeholder="Enter your comments here..."
                rows={4}
            />
        </div>
    ),
};

export const LongPlaceholder: Story = {
    args: {
        placeholder: 'This is a very long placeholder text to demonstrate how the textarea handles longer placeholder content',
        rows: 4,
    },
};
