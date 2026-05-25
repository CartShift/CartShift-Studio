export type StoreAnalysisErrorType =
  | 'network'
  | 'timeout'
  | 'validation'
  | 'server'
  | 'unknown';

export type ClassifiedStoreAnalysisError = {
  type: StoreAnalysisErrorType;
  titleKey:
    | 'analyzer.errors.unknown.title'
    | 'analyzer.errors.network.title'
    | 'analyzer.errors.networkConnection.title'
    | 'analyzer.errors.timeout.title'
    | 'analyzer.errors.validation.title'
    | 'analyzer.errors.rateLimit.title'
    | 'analyzer.errors.captcha.title'
    | 'analyzer.errors.server.title';
  suggestionKey:
    | 'analyzer.errors.unknown.suggestion'
    | 'analyzer.errors.network.suggestion'
    | 'analyzer.errors.networkConnection.suggestion'
    | 'analyzer.errors.timeout.suggestion'
    | 'analyzer.errors.validation.suggestion'
    | 'analyzer.errors.rateLimit.suggestion'
    | 'analyzer.errors.captcha.suggestion'
    | 'analyzer.errors.server.suggestion';
  retryable: boolean;
};

export function classifyStoreAnalysisError(error: unknown): ClassifiedStoreAnalysisError {
  const message = error instanceof Error ? error.message : String(error);

  if (message.includes('Could not access store URL')) {
    return {
      type: 'network',
      titleKey: 'analyzer.errors.network.title',
      suggestionKey: 'analyzer.errors.network.suggestion',
      retryable: true,
    };
  }

  if (message.includes('fetch') || message.includes('network')) {
    return {
      type: 'network',
      titleKey: 'analyzer.errors.networkConnection.title',
      suggestionKey: 'analyzer.errors.networkConnection.suggestion',
      retryable: true,
    };
  }

  if (message.includes('timeout') || message.includes('timed out')) {
    return {
      type: 'timeout',
      titleKey: 'analyzer.errors.timeout.title',
      suggestionKey: 'analyzer.errors.timeout.suggestion',
      retryable: true,
    };
  }

  if (message.includes('rate limit') || message.includes('Too many')) {
    return {
      type: 'validation',
      titleKey: 'analyzer.errors.rateLimit.title',
      suggestionKey: 'analyzer.errors.rateLimit.suggestion',
      retryable: false,
    };
  }

  if (message.includes('Captcha')) {
    return {
      type: 'validation',
      titleKey: 'analyzer.errors.captcha.title',
      suggestionKey: 'analyzer.errors.captcha.suggestion',
      retryable: false,
    };
  }

  if (message.includes('Invalid URL') || message.includes('required')) {
    return {
      type: 'validation',
      titleKey: 'analyzer.errors.validation.title',
      suggestionKey: 'analyzer.errors.validation.suggestion',
      retryable: false,
    };
  }

  if (message.includes('500') || message.includes('Analysis failed')) {
    return {
      type: 'server',
      titleKey: 'analyzer.errors.server.title',
      suggestionKey: 'analyzer.errors.server.suggestion',
      retryable: true,
    };
  }

  return {
    type: 'unknown',
    titleKey: 'analyzer.errors.unknown.title',
    suggestionKey: 'analyzer.errors.unknown.suggestion',
    retryable: true,
  };
}
