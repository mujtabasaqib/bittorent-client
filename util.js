'use strict';

import { randomBytes } from 'crypto';

let id = null;

export function genId() {
  if (!id) {
    id = randomBytes(20);
    Buffer.from('-AT0001-').copy(id, 0);
  }
  return id;
}