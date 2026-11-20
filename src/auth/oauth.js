const API_BASE_URL = (window.DORMHIVE_API_URL ?? 'http://localhost:5000/api/v1').replace(/\/+$/, '');

export function oauthButtonsMarkup(mode = 'login') {
  if (mode !== 'login') return '';
  return `<div class="social-auth">
    <p class="oauth-divider"><span>Or sign in with</span></p>
    <div class="social-icons" role="group" aria-label="Social sign-in options">
      <button class="oauth-button oauth-google-button" type="button" data-oauth-provider="google" data-oauth-mode="login" aria-label="Continue with Google" title="Continue with Google">
      <svg class="oauth-google-icon" viewBox="0 0 48 48" aria-hidden="true">
        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
      </svg>
        <span>Continue with Google</span>
        <span class="oauth-spinner" aria-hidden="true"></span>
      </button>
    </div>
  </div>`;
}

export function bindOAuthButtons(root) {
  root.querySelectorAll('[data-oauth-provider]').forEach((button) => {
    button.addEventListener('click', () => {
      const provider = button.dataset.oauthProvider;
      const role = root.querySelector('#role')?.value ?? 'tenant';
      const mode = button.dataset.oauthMode
        ?? (root.querySelector('.container')?.classList.contains('active') ? 'register' : 'login');
      button.disabled = true;
      button.classList.add('is-loading');
      button.setAttribute('aria-busy', 'true');
      button.setAttribute('aria-label', `Connecting to ${provider}...`);
      const params = new URLSearchParams({ mode, role });
      window.location.assign(`${API_BASE_URL}/auth/${provider}/start?${params}`);
    });
  });
}
