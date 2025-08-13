import { Button } from '@portfolio-grade/ui-kit';
import { loginSchema } from '@portfolio-grade/shared';

export function App() {
  // quick runtime check (will throw if invalid)
  const sample = loginSchema.safeParse({ email: 'demo@example.com', password: 'supersecret' });

  return (
    <div style={{ padding: 24 }}>
      <h1>Admin</h1>
      <p>Shared schema valid: {String(sample.success)}</p>
      <Button>Shared UI Button</Button>
    </div>
  );
}

export default App;