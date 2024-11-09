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

  const tokens = value.trim().match(/^([0-9]+)[ ]*([smh]?)$/i);
  if (! Array.isArray(tokens)) {
    throw new Error(`Invalid timeout value: ${value}`);
  }

  const [, num, unit] = tokens;
  const numint = parseInt(num);

  switch (unit.toLocaleLowerCase()) {
    case 's': case '':
      return secondsToMs(numint);
    case 'm':
      return minutesToMs(numint);
    case 'h':
      return hoursToMs(numint);
  }

  throw new Error(`Invalid timeout unit: ${unit}`);
}

function mustBePositiveInteger(value: any): number {
  const intVal = parseInt(value, 10);

  if (! isNaN(intVal) && intVal === Number(value)) {
    if (intVal < 0) {
      throw new Error(`Expects a positive integer value but got ${intVal}`);
    }
    return intVal;
  }

  const valType = typeof value;

  throw new Error(`Expects an integer but got ${valType == 'number' ? value : valType}`);
}

export { parseTimeout, mustBePositiveInteger }
