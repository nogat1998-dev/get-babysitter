import { render } from '@testing-library/react';
import GoogleSignInButton from './GoogleSignInButton';

// Mock window.google
beforeAll(() => {
  Object.defineProperty(window, 'google', {
    value: {
      accounts: {
        id: {
          initialize: vi.fn(),
          renderButton: vi.fn(),
          revoke: vi.fn(),
        },
      },
    },
    writable: true,
  });
});

describe('GoogleSignInButton', () => {
  it('renders without crashing', () => {
    const onSuccess = vi.fn();
    const { container } = render(<GoogleSignInButton onSuccess={onSuccess} />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders a div element for the Google button', () => {
    const onSuccess = vi.fn();
    const { container } = render(<GoogleSignInButton onSuccess={onSuccess} />);
    const div = container.querySelector('div');
    expect(div).toBeInTheDocument();
  });
});
