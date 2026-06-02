type Messages = Record<string, unknown>;

export function pickClientMessages(messages: Messages, keys: readonly string[]): Messages {
  return Object.fromEntries(keys.flatMap(key => (key in messages ? [[key, messages[key]]] : [])));
}

export function pickWebsiteMessages(messages: Messages): Messages {
  const { _meta: _ignoredMeta, portal: _ignoredPortal, cv: _ignoredCv, proposal: _ignoredProposal, ...website } =
    messages;

  return website;
}
