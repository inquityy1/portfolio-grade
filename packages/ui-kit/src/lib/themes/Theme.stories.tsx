import type { Meta, StoryObj } from '@storybook/react';
import { UIProvider, theme } from './Theme';
import { Card, CardContent } from '../cards/Card';
import { Button } from '../buttons/Button';
import { Input } from '../inputs/Input';
import { Alert } from '../alerts/Alert';

const meta: Meta<typeof UIProvider> = {
  title: 'UI Kit/Themes',
  component: UIProvider,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const DefaultTheme: Story = {
  render: () => (
    <UIProvider>
      <div style={{ padding: '20px', background: theme.colors.bg, minHeight: '100vh' }}>
        <h1 style={{ color: theme.colors.text, marginBottom: '20px' }}>Default Theme</h1>

        <div style={{ display: 'grid', gap: '20px', maxWidth: '600px' }}>
          <Card>
            <CardContent>
              <h3 style={{ color: theme.colors.text, marginTop: 0 }}>Theme Colors</h3>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '10px',
                }}
              >
                <div
                  style={{
                    padding: '10px',
                    background: theme.colors.surface,
                    borderRadius: theme.radius.md,
                    border: `1px solid ${theme.colors.border}`,
                  }}
                >
                  <strong style={{ color: theme.colors.text }}>Surface</strong>
                  <div style={{ color: theme.colors.text, fontSize: '12px' }}>
                    {theme.colors.surface}
                  </div>
                </div>
                <div
                  style={{
                    padding: '10px',
                    background: theme.colors.primary,
                    borderRadius: theme.radius.md,
                  }}
                >
                  <strong style={{ color: 'white' }}>Primary</strong>
                  <div style={{ color: 'white', fontSize: '12px' }}>{theme.colors.primary}</div>
                </div>
                <div
                  style={{
                    padding: '10px',
                    background: theme.colors.border,
                    borderRadius: theme.radius.md,
                  }}
                >
                  <strong style={{ color: theme.colors.text }}>Border</strong>
                  <div style={{ color: theme.colors.text, fontSize: '12px' }}>
                    {theme.colors.border}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <h3 style={{ color: theme.colors.text, marginTop: 0 }}>Components with Theme</h3>
              <div style={{ display: 'grid', gap: '15px' }}>
                <div>
                  <label
                    style={{ color: theme.colors.text, display: 'block', marginBottom: '5px' }}
                  >
                    Input Field
                  </label>
                  <Input placeholder='Type something...' />
                </div>
                <div>
                  <Button>Primary Button</Button>
                </div>
                <Alert variant='success'>Success message with theme colors</Alert>
                <Alert variant='error'>Error message with theme colors</Alert>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <h3 style={{ color: theme.colors.text, marginTop: 0 }}>Spacing System</h3>
              <div style={{ display: 'grid', gap: '10px' }}>
                <div
                  style={{
                    padding: theme.spacing(1),
                    background: theme.colors.surface,
                    borderRadius: theme.radius.md,
                    border: `1px solid ${theme.colors.border}`,
                  }}
                >
                  <span style={{ color: theme.colors.text }}>spacing(1) = {theme.spacing(1)}</span>
                </div>
                <div
                  style={{
                    padding: theme.spacing(2),
                    background: theme.colors.surface,
                    borderRadius: theme.radius.md,
                    border: `1px solid ${theme.colors.border}`,
                  }}
                >
                  <span style={{ color: theme.colors.text }}>spacing(2) = {theme.spacing(2)}</span>
                </div>
                <div
                  style={{
                    padding: theme.spacing(3),
                    background: theme.colors.surface,
                    borderRadius: theme.radius.md,
                    border: `1px solid ${theme.colors.border}`,
                  }}
                >
                  <span style={{ color: theme.colors.text }}>spacing(3) = {theme.spacing(3)}</span>
                </div>
                <div
                  style={{
                    padding: theme.spacing(4),
                    background: theme.colors.surface,
                    borderRadius: theme.radius.md,
                    border: `1px solid ${theme.colors.border}`,
                  }}
                >
                  <span style={{ color: theme.colors.text }}>spacing(4) = {theme.spacing(4)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <h3 style={{ color: theme.colors.text, marginTop: 0 }}>Border Radius</h3>
              <div style={{ display: 'grid', gap: '10px' }}>
                <div
                  style={{
                    padding: '20px',
                    background: theme.colors.surface,
                    borderRadius: theme.radius.md,
                    border: `1px solid ${theme.colors.border}`,
                  }}
                >
                  <span style={{ color: theme.colors.text }}>Medium Radius: {theme.radius.md}</span>
                </div>
                <div
                  style={{
                    padding: '20px',
                    background: theme.colors.surface,
                    borderRadius: theme.radius.lg,
                    border: `1px solid ${theme.colors.border}`,
                  }}
                >
                  <span style={{ color: theme.colors.text }}>Large Radius: {theme.radius.lg}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </UIProvider>
  ),
};

export const ThemeValues: Story = {
  render: () => (
    <UIProvider>
      <div style={{ padding: '20px', background: theme.colors.bg, minHeight: '100vh' }}>
        <h1 style={{ color: theme.colors.text, marginBottom: '20px' }}>Theme Configuration</h1>

        <Card>
          <CardContent>
            <h2 style={{ color: theme.colors.text, marginTop: 0 }}>Current Theme Values</h2>
            <pre
              style={{
                background: theme.colors.surface,
                padding: theme.spacing(3),
                borderRadius: theme.radius.md,
                border: `1px solid ${theme.colors.border}`,
                color: theme.colors.text,
                overflow: 'auto',
                fontSize: '14px',
              }}
            >
              {JSON.stringify(theme, null, 2)}
            </pre>
          </CardContent>
        </Card>
      </div>
    </UIProvider>
  ),
};
