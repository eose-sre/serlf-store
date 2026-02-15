// serlf OAuth Authentication Module
// Handles Google OAuth, session management, and auth state

const SERLF_AUTH = {
  // Admin emails (full access)
  ADMIN_EMAILS: ['kewinjoffe@gmail.com', 'kewin.joffe@gmail.com'],
  
  // Session key
  SESSION_KEY: 'serlf_session',
  
  /**
   * Check if user is authenticated
   * @returns {boolean}
   */
  isAuthenticated() {
    const session = this.getSession();
    if (!session) return false;
    
    // Check if token is expired
    if (session.expires && Date.now() > session.expires) {
      this.logout();
      return false;
    }
    
    return true;
  },
  
  /**
   * Get current user session
   * @returns {Object|null} User session object or null
   */
  getSession() {
    try {
      const session = sessionStorage.getItem(this.SESSION_KEY);
      return session ? JSON.parse(session) : null;
    } catch (e) {
      console.warn('Invalid session data:', e);
      sessionStorage.removeItem(this.SESSION_KEY);
      return null;
    }
  },
  
  /**
   * Get current user info
   * @returns {Object|null} User object with name, email, picture
   */
  getUser() {
    const session = this.getSession();
    if (!session) return null;
    
    return {
      name: session.name,
      email: session.email,
      picture: session.picture,
      given_name: session.given_name,
      family_name: session.family_name
    };
  },
  
  /**
   * Check if current user is admin
   * @param {string} [email] - Email to check (optional, uses current user if not provided)
   * @returns {boolean}
   */
  isAdmin(email = null) {
    if (!email) {
      const user = this.getUser();
      if (!user) return false;
      email = user.email;
    }
    
    return this.ADMIN_EMAILS.includes(email.toLowerCase());
  },
  
  /**
   * Store user session
   * @param {Object} userData - User data from Google OAuth
   */
  setSession(userData) {
    try {
      const session = {
        name: userData.name,
        email: userData.email,
        picture: userData.picture,
        given_name: userData.given_name,
        family_name: userData.family_name,
        created: Date.now(),
        expires: userData.exp ? userData.exp * 1000 : (Date.now() + (24 * 60 * 60 * 1000)), // 24 hours default
        token: userData.token || null
      };
      
      sessionStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
      console.log('Session created for:', userData.email);
    } catch (e) {
      console.error('Failed to store session:', e);
    }
  },
  
  /**
   * Clear session and redirect to login
   */
  logout() {
    sessionStorage.removeItem(this.SESSION_KEY);
    window.location.href = '/login.html';
  },
  
  /**
   * Require authentication - redirect to login if not authenticated
   */
  requireAuth() {
    if (!this.isAuthenticated()) {
      // Store the current page to redirect back after login
      sessionStorage.setItem('serlf_redirect', window.location.href);
      window.location.href = '/login.html';
      return false;
    }
    return true;
  },
  
  /**
   * Get redirect URL after successful login
   * @returns {string}
   */
  getRedirectUrl() {
    const redirect = sessionStorage.getItem('serlf_redirect');
    sessionStorage.removeItem('serlf_redirect');
    return redirect || '/portal.html';
  },
  
  /**
   * Decode JWT token (simple base64 decode, no verification)
   * @param {string} token - JWT token
   * @returns {Object|null} Decoded payload or null
   */
  decodeJWT(token) {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      
      const payload = parts[1];
      // Add padding if needed
      const padded = payload + '='.repeat((4 - payload.length % 4) % 4);
      const decoded = atob(padded.replace(/-/g, '+').replace(/_/g, '/'));
      
      return JSON.parse(decoded);
    } catch (e) {
      console.error('Failed to decode JWT:', e);
      return null;
    }
  },
  
  /**
   * Validate Google JWT token
   * @param {string} token - JWT token from Google
   * @returns {Object|null} Validated user data or null
   */
  validateGoogleToken(token) {
    const decoded = this.decodeJWT(token);
    if (!decoded) return null;
    
    // Basic validation
    if (!decoded.email || !decoded.name) {
      console.warn('Invalid token: missing required fields');
      return null;
    }
    
    // Check if token is expired
    if (decoded.exp && Date.now() > decoded.exp * 1000) {
      console.warn('Token expired');
      return null;
    }
    
    // Check issuer (optional, for extra security)
    if (decoded.iss && !['accounts.google.com', 'https://accounts.google.com'].includes(decoded.iss)) {
      console.warn('Invalid token issuer:', decoded.iss);
      return null;
    }
    
    return decoded;
  }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SERLF_AUTH;
}