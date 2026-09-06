import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';

import ConsentBanner from '@/components/consent/ConsentBanner';
import { COOKIE_NAME } from '@/lib/consent/consent';

const BANNER_TITLE = /Valoramos tu privacidad/i;
const RESET_LABEL = /Cambiar preferencias/i;

function clearAllCookies() {
  document.cookie.split(';').forEach((part) => {
    const name = part.trim().split('=')[0];
    if (name) document.cookie = `${name}=; Path=/; Max-Age=0`;
  });
}

function setCookie(name: string, value: string) {
  document.cookie = `${name}=${value}; Path=/`;
}

describe('ConsentBanner', () => {
  afterEach(() => {
    clearAllCookies();
  });

  it('shows the Spanish banner with both actions when consent is pending', async () => {
    render(<ConsentBanner />);

    expect(await screen.findByRole('button', { name: 'Aceptar' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Rechazar' })).toBeInTheDocument();
    expect(screen.getByText(BANNER_TITLE)).toBeInTheDocument();
    expect(screen.getByText(/píxel de Meta/i)).toBeInTheDocument();
  });

  it('hides the banner and shows the reset chip when consent is accepted', async () => {
    setCookie(COOKIE_NAME, 'accepted');
    render(<ConsentBanner />);

    expect(await screen.findByRole('button', { name: RESET_LABEL })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Aceptar' })).not.toBeInTheDocument();
    expect(screen.queryByText(BANNER_TITLE)).not.toBeInTheDocument();
  });

  it('hides the banner when consent is declined', async () => {
    setCookie(COOKIE_NAME, 'declined');
    render(<ConsentBanner />);

    expect(await screen.findByRole('button', { name: RESET_LABEL })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Aceptar' })).not.toBeInTheDocument();
  });

  it('writes accepted to the cookie and hides the banner on Accept', async () => {
    const user = userEvent.setup();
    render(<ConsentBanner />);
    await user.click(await screen.findByRole('button', { name: 'Aceptar' }));

    expect(document.cookie).toContain(`${COOKIE_NAME}=accepted`);
    expect(screen.queryByRole('button', { name: 'Aceptar' })).not.toBeInTheDocument();
  });

  it('writes declined to the cookie and hides the banner on Decline', async () => {
    const user = userEvent.setup();
    render(<ConsentBanner />);
    await user.click(await screen.findByRole('button', { name: 'Rechazar' }));

    expect(document.cookie).toContain(`${COOKIE_NAME}=declined`);
    expect(screen.queryByRole('button', { name: 'Rechazar' })).not.toBeInTheDocument();
  });

  it('re-shows the banner after the reset chip clears the cookie', async () => {
    const user = userEvent.setup();
    setCookie(COOKIE_NAME, 'accepted');
    render(<ConsentBanner />);

    await user.click(await screen.findByRole('button', { name: RESET_LABEL }));

    expect(document.cookie).not.toContain(`${COOKIE_NAME}=accepted`);
    expect(await screen.findByRole('button', { name: 'Aceptar' })).toBeInTheDocument();
    expect(screen.getByText(BANNER_TITLE)).toBeInTheDocument();
  });
});
