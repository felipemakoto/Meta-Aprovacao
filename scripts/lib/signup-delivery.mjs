// Inputs for the opt-in delivery rehearsal. Never accept an arbitrary URL from email.
export function testMailbox(mailbox, tag) {
  if (!/^[a-z0-9][a-z0-9._-]{0,62}@gmail\.com$/.test(mailbox ?? '') ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(tag ?? '')) {
    throw Error('invalid_test_mailbox');
  }
  const alias = mailbox.replace('@', `+t${tag.replaceAll('-', '')}@`);
  if (alias.split('@')[0].length > 64) throw Error('invalid_test_mailbox');
  return alias;
}

export function confirmationLink(value, provider, site) {
  try {
    const url = new URL(value);
    if (url.origin !== provider || url.username || url.password || url.hash || url.pathname !== '/auth/v1/verify' ||
        url.searchParams.getAll('type').length !== 1 || url.searchParams.get('type') !== 'signup' ||
        url.searchParams.getAll('token').length !== 1 || !/^[a-zA-Z0-9_-]{16,512}$/.test(url.searchParams.get('token') ?? '') ||
        url.searchParams.getAll('redirect_to').length !== 1 || url.searchParams.get('redirect_to') !== site + '/auth/confirm' ||
        [...url.searchParams.keys()].some(key => !['type', 'token', 'redirect_to'].includes(key))) throw Error();
    return url;
  } catch { throw Error('invalid_confirmation_link'); }
}

export function confirmationCallback(value, site) {
  try {
    const url = new URL(value);
    if (url.origin !== site || url.username || url.password || url.hash || url.pathname !== '/auth/confirm' ||
        [...url.searchParams.keys()].some(key => key !== 'code') || url.searchParams.getAll('code').length !== 1 ||
        !/^[a-zA-Z0-9_-]{16,512}$/.test(url.searchParams.get('code') ?? '')) throw Error();
    return url.pathname + url.search;
  } catch { throw Error('invalid_confirmation_callback'); }
}
