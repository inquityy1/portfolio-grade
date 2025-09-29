import type { Meta, StoryObj } from '@storybook/react';
import { Container, PageContainer, LoadingContainer, ErrorContainer } from './Container';

const meta: Meta<typeof Container> = {
    title: 'UI Kit/Containers',
    component: Container,
    parameters: {
        layout: 'padded',
    },
    tags: ['autodocs'],
    argTypes: {
        maxWidth: {
            control: { type: 'text' },
        },
        children: {
            control: { type: 'text' },
        },
    },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        children: 'This is a default container with auto width.',
    },
};

export const WithMaxWidth: Story = {
    args: {
        maxWidth: '800px',
        children: 'This container has a maximum width of 800px.',
    },
};

export const PageContainerStory: Story = {
    render: () => (
        <PageContainer>
            <h2>Page Container</h2>
            <p>This is a page container with standard padding for page layouts.</p>
        </PageContainer>
    ),
};

export const LoadingContainerStory: Story = {
    render: () => (
        <LoadingContainer>
            <h3>Loading...</h3>
            <p>Please wait while we fetch your data.</p>
        </LoadingContainer>
    ),
};

export const ErrorContainerStory: Story = {
    render: () => (
        <ErrorContainer>
            <h3>Error</h3>
            <p>Something went wrong. Please try again later.</p>
        </ErrorContainer>
    ),
};
