'use strict';
import fs from 'fs';
import bencode from 'bencode';
import { getPeers } from './tracker.js';

const torrent = bencode.decode(fs.readFileSync('puppy.torrent'));

getPeers(torrent, (err, peers) => {
  if (err) {
    console.log(err);
    return;
  }
  console.log(peers);
})
