import type { Meta, StoryObj } from '@storybook/react';
import { Field } from './Field';
import { Label } from '../labels/Label';
import { Input } from '../inputs/Input';

const meta: Meta<typeof Field> = {
  title: 'UI Kit/Fields',
  component: Field,
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
    children: 'This is a field container.',
  },
};

export const WithLabelAndInput: Story = {
  render: () => (
    <Field>
      <Label>Email Address</Label>
      <Input placeholder='Enter your email' />
    </Field>
  ),
};

export const MultipleFields: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: '16px' }}>
      <Field>
        <Label>First Name</Label>
        <Input placeholder='Enter first name' />
      </Field>
      <Field>
        <Label>Last Name</Label>
        <Input placeholder='Enter last name' />
      </Field>
      <Field>
        <Label>Email</Label>
        <Input placeholder='Enter email address' type='email' />
      </Field>
    </div>
  ),
};

export const RequiredField: Story = {
  render: () => (
    <Field>
      <Label>
        Password <span style={{ color: 'red' }}>*</span>
      </Label>
      <Input placeholder='Enter password' type='password' />
    </Field>
  ),
};
