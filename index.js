'use strict';
import fs from 'fs';
import bencode from 'bencode';

function decodeData(uint8Array) {
  return new TextDecoder('utf-8').decode(uint8Array);
}

//console.log(torrent.announce.toString('utf8'));

const torrent = bencode.decode(fs.readFileSync('puppy.torrent'));

const decodedAnnounce = decodeData(torrent.announce);
console.log(decodedAnnounce);  // decoded URL

