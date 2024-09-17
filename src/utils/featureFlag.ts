export function featureFlag(apiVersion: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = function (...args: any[]) {
      const warnmsg = `This is a prerelease feature implemented against the ${apiVersion} version of our API.`;
      console.warn(warnmsg);

      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}
