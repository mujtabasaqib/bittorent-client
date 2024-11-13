'use strict';
import fs from 'fs';
import bencode from 'bencode';
import crypto from 'crypto';

export function open(filePath){
  return bencode.decode(fs.readFileSync(filePath));
}

export function size(torrent){
  const size = torrent.info.files ?
    torrent.info.files.map(file => BigInt(file.length)).reduce((a, b) => a + b) :
    BigInt(torrent.info.length);

  // Convert BigInt to Buffer
  const buffer = Buffer.alloc(8);
  buffer.writeBigUInt64BE(size); 
  return buffer;
}

export function infoHash(torrent){
  const info = bencode.encode(torrent.info);
  return crypto.createHash('sha1').update(info).digest();
}