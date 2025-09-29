import type { Meta, StoryObj } from '@storybook/react';
import { Alert } from './Alert';

const meta: Meta<typeof Alert> = {
    title: 'UI Kit/Alerts',
    component: Alert,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
    argTypes: {
        variant: {
            control: { type: 'select' },
            options: ['error', 'success', 'warning', 'info'],
        },
    },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        children: 'This is a default alert message.',
    },
};

export const Error: Story = {
    args: {
        variant: 'error',
        children: 'This is an error alert message.',
    },
};

export const Success: Story = {
    args: {
        variant: 'success',
        children: 'This is a success alert message.',
    },
};

export const Warning: Story = {
    args: {
        variant: 'warning',
        children: 'This is a warning alert message.',
    },
};

export const Info: Story = {
    args: {
        variant: 'info',
        children: 'This is an info alert message.',
    },
};