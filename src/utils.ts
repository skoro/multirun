function secondsToMs(value: number): number {
  return 1000 * value;
}

function minutesToMs(value: number): number {
  return secondsToMs(value * 60);
}

function hoursToMs(value: number): number {
  return secondsToMs(value * 60);
}

function parseTimeout(value: string | number): number {
  if (typeof value === 'number') {
    return secondsToMs(value);
  }
  else if (typeof value !== 'string') {
    throw new Error(`Timeout value must be string or number but got ${typeof value}.`);
  }

  const tokens = value.trim().match('/^([0-9]+)[ ]*([smh]?)$/i');
  if (! Array.isArray(tokens)) {
    throw new Error(`Invalid timeout value: ${value}`);
  }

  const [, num, unit] = tokens;
  const numint = parseInt(num);

  switch (unit.toLocaleLowerCase()) {
    case 's':
      return secondsToMs(numint);
    case 'm':
      return minutesToMs(numint);
    case 'h':
      return hoursToMs(numint);
  }

  throw new Error(`Invalid timeout unit: ${unit}`);
}

export { parseTimeout }
