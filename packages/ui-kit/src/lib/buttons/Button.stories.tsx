import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';

const meta: Meta<typeof Button> = {
  title: 'UI Kit/Buttons',
  component: Button,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    children: {
      control: { type: 'text' },
    },
    disabled: {
      control: { type: 'boolean' },
    },
    type: {
      control: { type: 'select' },
      options: ['button', 'submit', 'reset'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'Click me',
  },
};

export const Disabled: Story = {
  args: {
    children: 'Disabled Button',
    disabled: true,
  },
};

export const Submit: Story = {
  args: {
    children: 'Submit Form',
    type: 'submit',
  },
};

export const Reset: Story = {
  args: {
    children: 'Reset Form',
    type: 'reset',
  },
};

export const LongText: Story = {
  args: {
    children: 'This is a button with longer text content',
  },
};

export const ShortText: Story = {
  args: {
    children: 'OK',
  },
};
