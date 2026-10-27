type AsyncIterableStream = { [Symbol.asyncIterator]?: unknown; getReader(): ReadableStreamDefaultReader };

/**
 * Safari has no `for await (... of readableStream)`, which pdf.js uses to read page text.
 * Adds it when missing; does nothing where the browser already supports it.
 */
export function polyfillStreamIteration(): void {
  const proto = globalThis.ReadableStream?.prototype as unknown as AsyncIterableStream | undefined;
  if (!proto || Symbol.asyncIterator in proto) return;
  Object.defineProperty(proto, Symbol.asyncIterator, {
    configurable: true,
    writable: true,
    value(this: AsyncIterableStream) {
      const reader = this.getReader();
      return {
        next: () => reader.read(),
        return: async () => {
          reader.releaseLock();
          return { done: true, value: undefined };
        },
        [Symbol.asyncIterator]() {
          return this;
        },
      };
    },
  });
}
