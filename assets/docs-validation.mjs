/** Generated models remain visible in the reference, but their warnings are not actionable. */
export function isGeneratedWarning(message, ...context) {
  const generatedPath =
    /(?:^|[/\\])src[/\\]pinecone-generated-ts-fetch(?:-alpha)?[/\\]/;
  // Parse warnings carry a source file; validation warnings identify the definition.
  if (
    context.some(
      (value) =>
        value &&
        typeof value === 'object' &&
        generatedPath.test(value.fileName ?? ''),
    )
  )
    return true;
  const definition = message.match(
    /, defined in ([^,]+), (?:does not have any documentation|is referenced by)/,
  );
  return definition ? generatedPath.test(definition[1]) : false;
}

/** Apply the same source scope before either warning counter is incremented. */
export function scopeDocumentationWarnings(logger) {
  for (const method of ['warn', 'validationWarning']) {
    const original = logger[method].bind(logger);
    logger[method] = (message, ...context) => {
      if (!isGeneratedWarning(message, ...context))
        original(message, ...context);
    };
  }
}
