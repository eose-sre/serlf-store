// serlf client-side API — sends form data via Formsubmit (free, no signup)
// NP-L1-022: Zero-Backend Forms

const SERLF_API = {
  endpoint: 'https://formsubmit.co/ajax/kewinjoffe@gmail.com',
  
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
      window.location.href = `mailto:kewinjoffe@gmail.com?subject=${encodeURIComponent(payload._subject)}&body=${encodeURIComponent(body)}`;
      return { ok: true, fallback: true };
    }
  }
};
