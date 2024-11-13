'use strict';
import { getPeers } from './tracker.js';
import { open } from './torrent-parser.js';

const torrent = open('puppy.torrent');

getPeers(torrent, (err, peers) => {
  if (err) {
    console.log(err);
    return;
  }
  console.log('list of peers:', peers);
})
