'use strict';

import dgram from 'dgram'
import crypto from 'crypto';
import { genId } from './util.js';
import { size, infoHash } from './torrent-parser.js';

function decodeData(uint8Array) {
  return new TextDecoder('utf-8').decode(uint8Array);
}

export function getPeers(torrent, callback) {
  const socket = dgram.createSocket('udp4');
  console.log("socket created: ",socket);
  const decodedAnnounce = decodeData(torrent.announce);
  const url = new URL(decodedAnnounce);

  //add console log statements for decoded and url
  //console.log("decodedAnnounce: ", decodedAnnounce);
  console.log("url: ", url);

  // 1. send connect request
  udpSend(socket, buildConnReq(), url); //code runs uptill here

  socket.on('message', response => {
    console.log('hello')
    console.log('response from server: ',response);
    if (respType(response) === 'connect') {
      // 2. receive and parse connect response
      const connResp = parseConnResp(response);
      console.log("reached, connection response: ", connResp);
      // 3. send announce request
      const announceReq = buildAnnounceReq(connResp.connectionId, torrent);
      udpSend(socket, announceReq, url);
    } else if (respType(response) === 'announce') {
      // 4. parse announce response
      const announceResp = parseAnnounceResp(response);
      console.log("reached, announce response: ", announceResp);
      console.log("announceResp obj: ", announceResp);
      // 5. pass peers to callback
      callback(announceResp.peers);
    }
  });

  socket.on('error', (err) => {
    console.error('Socket error:', err);
  });
  
  socket.on('close', () => {
    console.log('Socket closed');
  });
};

function udpSend(socket, message, rawUrl, callback=(err)=>{if (err) {
  console.error('Error sending message:', err);
} else {
  console.log('Message sent successfully');
}}) {
  const url = new URL(rawUrl);
  console.log("message: ", message);
  socket.send(message, 0, message.length, url.port, url.hostname, callback);
}

function respType(resp) {
  const action = resp.readUInt32BE(0);
  if (action === 0) return 'connect';
  if (action === 1) return 'announce';
}

//for parseAnnounceResp
function group(iterable, groupSize) {
  let groups = [];
  for (let i = 0; i < iterable.length; i += groupSize) {
    groups.push(iterable.slice(i, i + groupSize));
  }
  return groups;
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

  console.log("made buffer for connection request: ",buf);

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

function buildAnnounceReq(connId, torrent, port=6881) {
  const buf = Buffer.allocUnsafe(98);

  // connection id
  connId.copy(buf, 0);
  // action
  buf.writeUInt32BE(1, 8);
  // transaction id
  crypto.randomBytes(4).copy(buf, 12);
  // info hash
  infoHash(torrent).copy(buf, 16);
  // peerId
  genId().copy(buf, 36);
  // downloaded
  Buffer.alloc(8).copy(buf, 56);
  // left
  size(torrent).copy(buf, 64);
  // uploaded
  Buffer.alloc(8).copy(buf, 72);
  // event
  buf.writeUInt32BE(0, 80);
  // ip address
  buf.writeUInt32BE(0, 80);
  // key
  crypto.randomBytes(4).copy(buf, 88);
  // num want
  buf.writeInt32BE(-1, 92);
  // port
  buf.writeUInt16BE(port, 96);

  console.log("announce req buffer: ",buf);

  return buf;
}

function parseAnnounceResp(resp) {
  return {
    action: resp.readUInt32BE(0),
    transactionId: resp.readUInt32BE(4),
    leechers: resp.readUInt32BE(8),
    seeders: resp.readUInt32BE(12),
    peers: group(resp.slice(20), 6).map(address => {
      return {
        ip: address.slice(0, 4).join('.'),
        port: address.readUInt16BE(4)
      }
    })
  }
}
