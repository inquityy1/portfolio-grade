import type { Meta, StoryObj } from '@storybook/react';
import { Input } from './Input';

const meta: Meta<typeof Input> = {
    title: 'UI Kit/Inputs',
    component: Input,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
    argTypes: {
        type: {
            control: { type: 'select' },
            options: ['text', 'email', 'password', 'number', 'tel', 'url'],
        },
        placeholder: {
            control: { type: 'text' },
        },
        disabled: {
            control: { type: 'boolean' },
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
        placeholder: 'Enter text...',
    },
};

export const Email: Story = {
    args: {
        type: 'email',
        placeholder: 'Enter your email',
    },
};

export const Password: Story = {
    args: {
        type: 'password',
        placeholder: 'Enter password',
    },
};

export const Number: Story = {
    args: {
        type: 'number',
        placeholder: 'Enter number',
    },
};

export const Disabled: Story = {
    args: {
        placeholder: 'Disabled input',
        disabled: true,
    },
};

export const WithValue: Story = {
    args: {
        value: 'Pre-filled text',
        placeholder: 'Enter text...',
    },
};

export const LongPlaceholder: Story = {
    args: {
        placeholder: 'This is a very long placeholder text to test how the input handles longer text',
    },
};
