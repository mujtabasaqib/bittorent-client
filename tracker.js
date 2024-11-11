'use strict';

import dgram from 'dgram'
import crypto from 'crypto';

function decodeData(uint8Array) {
  return new TextDecoder('utf-8').decode(uint8Array);
}

export function getPeers(torrent, callback) {
  const socket = dgram.createSocket('udp4');
  const decodedAnnounce = decodeData(torrent.announce);
  const url = new URL(decodedAnnounce);

  // 1. send connect request
  udpSend(socket, buildConnReq(), url);

  socket.on('message', response => {
    if (respType(response) === 'connect') {
      // 2. receive and parse connect response
      const connResp = parseConnResp(response);
      // 3. send announce request
      const announceReq = buildAnnounceReq(connResp.connectionId);
      udpSend(socket, announceReq, url);
    } else if (respType(response) === 'announce') {
      // 4. parse announce response
      const announceResp = parseAnnounceResp(response);
      // 5. pass peers to callback
      callback(announceResp.peers);
    }
  });
};

function udpSend(socket, message, rawUrl, callback=()=>{}) {
  const url = new URL(rawUrl);
  socket.send(message, 0, message.length, url.port, url.host, callback);
}

function respType(resp) {
  // ...
}

//Build connection request
function buildConnReq() {
  const buf = Buffer.alloc(16); 

  // connection id (fixed for bep message)
  buf.writeUInt32BE(0x417, 0); 
  buf.writeUInt32BE(0x27101980, 4);
  // action
  buf.writeUInt32BE(0, 8); 
  // transaction id
  crypto.randomBytes(4).copy(buf, 12); 

  return buf;
}

//Parse connection response
function parseConnResp(resp) {
  return {
    action: resp.readUInt32BE(0),
    transactionId: resp.readUInt32BE(4),
    connectionId: resp.slice(8)
  }
}

function buildAnnounceReq(connId) {
  // ...
}

function parseAnnounceResp(resp) {
  // ...
}
