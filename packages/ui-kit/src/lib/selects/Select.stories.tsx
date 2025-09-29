import type { Meta, StoryObj } from '@storybook/react';
import { Select } from './Select';

const meta: Meta<typeof Select> = {
    title: 'UI Kit/Selects',
    component: Select,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
    argTypes: {
        disabled: {
            control: { type: 'boolean' },
        },
    },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    render: () => (
        <Select>
            <option value="">Choose an option...</option>
            <option value="option1">Option 1</option>
            <option value="option2">Option 2</option>
            <option value="option3">Option 3</option>
        </Select>
    ),
};

export const WithSelectedValue: Story = {
    render: () => (
        <Select defaultValue="option2">
            <option value="">Choose an option...</option>
            <option value="option1">Option 1</option>
            <option value="option2">Option 2</option>
            <option value="option3">Option 3</option>
        </Select>
    ),
};

export const Disabled: Story = {
    render: () => (
        <Select disabled>
            <option value="">Choose an option...</option>
            <option value="option1">Option 1</option>
            <option value="option2">Option 2</option>
            <option value="option3">Option 3</option>
        </Select>
    ),
};

export const ManyOptions: Story = {
    render: () => (
        <Select>
            <option value="">Choose a country...</option>
            <option value="us">United States</option>
            <option value="ca">Canada</option>
            <option value="uk">United Kingdom</option>
            <option value="de">Germany</option>
            <option value="fr">France</option>
            <option value="jp">Japan</option>
            <option value="au">Australia</option>
            <option value="br">Brazil</option>
            <option value="in">India</option>
            <option value="cn">China</option>
        </Select>
    ),
};

export const WithLabel: Story = {
    render: () => (
        <div style={{ display: 'grid', gap: '8px' }}>
            <label style={{ color: '#e8eaed', fontSize: '0.95rem' }}>Country</label>
            <Select>
                <option value="">Choose a country...</option>
                <option value="us">United States</option>
                <option value="ca">Canada</option>
                <option value="uk">United Kingdom</option>
                <option value="de">Germany</option>
            </Select>
        </div>
    ),
};
