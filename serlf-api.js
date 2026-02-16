// serlf client-side API — sends form data via Formsubmit (free, no signup)
// NP-L1-022: Zero-Backend Forms

const SERLF_OWNERS = [process.env.ADMIN_EMAIL || 'info@eose.ca'];

const SERLF_AUTH = {
  get() {
    try {
      var auth = JSON.parse(localStorage.getItem('serlf_auth'));
      if (auth && auth.expires > Date.now()) return auth;
      localStorage.removeItem('serlf_auth');
    } catch(e) {}
    return null;
  },
  isOwner() {
    var auth = this.get();
    return auth && SERLF_OWNERS.includes(auth.email.toLowerCase());
  },
  isSubscriber() {
    var auth = this.get();
    return !!auth;
  },
  email() {
    var auth = this.get();
    return auth ? auth.email : null;
  },
  name() {
    var auth = this.get();
    return auth ? (auth.name || auth.email.split('@')[0]) : null;
  }
};

const SERLF_API = {
  endpoint: 'https://formsubmit.co/ajax/info@eose.ca',
  
  async submit(product, data) {
    const auth = JSON.parse(localStorage.getItem('serlf_auth') || '{}');
    const payload = {
      _subject: `serlf ${product} — New Request`,
      _template: 'box',
      product: product,
      customer_email: auth.email || 'unknown',
      customer_name: auth.name || 'unknown',
      submitted_at: new Date().toISOString(),
      ...data
    };

    try {
      const res = await fetch(SERLF_API.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      return { ok: json.success !== false, data: json };
    } catch(e) {
      // Fallback: mailto
      const body = Object.entries(payload).map(([k,v]) => `${k}: ${v}`).join('\n');
      window.location.href = `mailto:info@eose.ca?subject=${encodeURIComponent(payload._subject)}&body=${encodeURIComponent(body)}`;
      return { ok: true, fallback: true };
    }
  }
};
