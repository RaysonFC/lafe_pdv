/*!
 * QR Code Generator — Pure JavaScript
 * Baseado em qrcode-generator (MIT License, Kazuhiko Arase)
 * Adaptado para funcionar 100% offline
 */

var QRGen = (function () {
  'use strict';

  var QRMode = { MODE_8BIT: 4 };
  var QRErrorLevel = { L: 1, M: 0, Q: 3, H: 2 };

  var EXP_TABLE = new Array(256);
  var LOG_TABLE = new Array(256);
  (function () {
    for (var i = 0; i < 8; i++) EXP_TABLE[i] = 1 << i;
    for (var i = 8; i < 256; i++) EXP_TABLE[i] = EXP_TABLE[i-4] ^ EXP_TABLE[i-5] ^ EXP_TABLE[i-6] ^ EXP_TABLE[i-8];
    for (var i = 0; i < 255; i++) LOG_TABLE[EXP_TABLE[i]] = i;
  })();

  function glog(n) { if (n < 1) throw new Error('glog'); return LOG_TABLE[n]; }
  function gexp(n) { while (n < 0) n += 255; while (n >= 256) n -= 255; return EXP_TABLE[n]; }

  function Poly(num, shift) {
    var offset = 0;
    while (offset < num.length && num[offset] === 0) offset++;
    var data = new Array(num.length - offset + shift);
    for (var i = 0; i < num.length - offset; i++) data[i] = num[i + offset];
    return {
      len: function () { return data.length; },
      at:  function (i) { return data[i]; },
      mul: function (e) {
        var r = new Array(data.length + e.len() - 1);
        for (var i = 0; i < r.length; i++) r[i] = 0;
        for (var i = 0; i < data.length; i++)
          for (var j = 0; j < e.len(); j++)
            r[i+j] ^= gexp(glog(data[i]) + glog(e.at(j)));
        return Poly(r, 0);
      },
      mod: function (e) {
        if (data.length - e.len() < 0) return this;
        var ratio = glog(data[0]) - glog(e.at(0));
        var r = data.slice();
        for (var i = 0; i < e.len(); i++) r[i] ^= gexp(glog(e.at(i)) + ratio);
        return Poly(r, 0).mod(e);
      }
    };
  }

  function ecPoly(len) {
    var p = Poly([1], 0);
    for (var i = 0; i < len; i++) p = p.mul(Poly([1, gexp(i)], 0));
    return p;
  }

  // RS Block Table [count, total, data, ...]
  var RS = [[1,26,19],[1,26,16],[1,26,13],[1,26,9],[1,44,34],[1,44,28],[1,44,22],[1,44,16],[1,70,55],[1,70,44],[2,35,17],[2,35,13],[1,100,80],[2,50,32],[2,50,24],[4,25,9],[1,134,108],[2,67,43],[2,33,15,2,34,16],[2,33,11,2,34,12],[2,86,68],[4,43,27],[4,43,19],[4,43,15],[2,98,78],[4,49,31],[2,32,14,4,33,15],[4,39,13,1,40,14],[2,121,97],[2,60,38,2,61,39],[4,40,18,2,41,19],[4,40,14,2,41,15],[2,146,116],[3,58,36,2,59,37],[4,36,16,4,37,17],[4,36,12,4,37,13],[2,86,68,2,87,69],[4,69,43,1,70,44],[6,43,19,2,44,20],[6,43,15,2,44,16],[4,101,81],[1,80,50,4,81,51],[4,50,22,4,51,23],[3,36,12,8,37,13],[2,116,92,2,117,93],[6,58,36,2,59,37],[4,46,20,6,47,21],[7,42,14,4,43,15],[4,133,107],[8,59,37,1,60,38],[8,44,20,4,45,21],[12,33,11,4,34,12],[3,145,115,1,146,116],[4,64,40,5,65,41],[11,36,16,5,37,17],[11,36,12,5,37,13],[5,109,87,1,110,88],[5,65,41,5,66,42],[5,54,24,7,55,25],[11,36,12],[5,122,98,1,123,99],[7,73,45,3,74,46],[15,43,19,2,44,20],[3,45,15,13,46,16],[1,135,107,5,136,108],[10,74,46,1,75,47],[1,50,22,15,51,23],[2,42,14,17,43,15],[5,150,120,1,151,121],[9,69,43,4,70,44],[17,50,22,1,51,23],[2,42,14,19,43,15],[3,141,113,4,142,114],[3,70,44,11,71,45],[17,47,21,4,48,22],[9,39,13,16,40,14],[3,135,107,5,136,108],[3,67,41,13,68,42],[15,54,24,5,55,25],[15,43,15,10,44,16],[4,144,116,4,145,117],[17,68,42],[17,50,22,6,51,23],[19,46,16,6,47,17],[2,139,111,7,140,112],[17,74,46],[7,54,24,16,55,25],[34,37,13],[4,151,121,5,152,122],[4,75,47,14,76,48],[11,54,24,14,55,25],[16,45,15,14,46,16],[6,147,117,4,148,118],[6,73,45,14,74,46],[11,54,24,16,55,25],[30,46,16,2,47,17],[8,132,106,4,133,107],[8,75,47,13,76,48],[7,54,24,22,55,25],[22,45,15,13,46,16],[10,142,114,2,143,115],[19,74,46,4,75,47],[28,50,22,6,51,23],[33,46,16,4,47,17],[8,152,122,4,153,123],[22,73,45,3,74,46],[8,53,23,26,54,24],[12,45,15,28,46,16],[3,147,117,10,148,118],[3,73,45,23,74,46],[4,54,24,31,55,25],[11,45,15,31,46,16],[7,146,116,7,147,117],[21,73,45,7,74,46],[1,53,23,37,54,24],[19,45,15,26,46,16],[5,145,115,10,146,116],[19,75,47,10,76,48],[15,54,24,25,55,25],[23,45,15,25,46,16],[13,145,115,3,146,116],[2,74,46,29,75,47],[42,54,24,1,55,25],[23,45,15,28,46,16],[17,145,115],[10,74,46,23,75,47],[10,54,24,35,55,25],[19,45,15,35,46,16],[17,145,115,1,146,116],[14,74,46,21,75,47],[29,54,24,19,55,25],[11,45,15,46,46,16],[13,145,115,6,146,116],[14,74,46,23,75,47],[44,54,24,7,55,25],[59,46,16,1,47,17],[12,151,121,7,152,122],[12,75,47,26,76,48],[39,54,24,14,55,25],[22,45,15,41,46,16],[6,151,121,14,152,122],[6,75,47,34,76,48],[46,54,24,10,55,25],[2,45,15,64,46,16],[17,152,122,4,153,123],[29,74,46,14,75,47],[49,54,24,10,55,25],[24,45,15,46,46,16],[4,152,122,18,153,123],[13,74,46,32,75,47],[48,54,24,14,55,25],[42,45,15,32,46,16],[20,147,117,4,148,118],[40,75,47,7,76,48],[43,54,24,22,55,25],[10,45,15,67,46,16],[19,148,118,6,149,119],[18,75,47,31,76,48],[34,54,24,34,55,25],[20,45,15,61,46,16]];

  function getBlocks(type, ecLevel) {
    var offset = (type - 1) * 4 + ecLevel;
    var row = RS[offset];
    var blocks = [];
    for (var i = 0; i < row.length; i += 3)
      for (var j = 0; j < row[i]; j++)
        blocks.push({ total: row[i+1], data: row[i+2] });
    return blocks;
  }

  var ALIGN = [[],[6,18],[6,22],[6,26],[6,30],[6,34],[6,22,38],[6,24,42],[6,26,46],[6,28,50],[6,30,54],[6,32,58],[6,34,62],[6,26,46,66],[6,26,48,70],[6,26,50,74],[6,30,54,78],[6,30,56,82],[6,30,58,86],[6,34,62,90],[6,28,50,72,94],[6,26,50,74,98],[6,30,54,78,102],[6,28,54,80,106],[6,32,58,84,110],[6,30,58,86,114],[6,34,62,90,118],[6,26,50,74,98,122],[6,30,54,78,102,126],[6,26,52,78,104,130],[6,30,56,82,108,132],[6,34,60,86,112,136],[6,30,58,86,114,142],[6,34,62,90,118,146],[6,30,54,78,102,126,150],[6,24,50,76,102,128,154],[6,28,54,80,106,132,158],[6,32,58,84,110,136,162],[6,26,54,82,110,138,166],[6,30,58,86,114,142,170]];

  function bch(data, poly) {
    var d = data;
    while (Math.floor(Math.log2(d)) >= Math.floor(Math.log2(poly))) {
      d ^= poly << (Math.floor(Math.log2(d)) - Math.floor(Math.log2(poly)));
    }
    return d;
  }

  var MASKS = [
    function(r,c){return(r+c)%2===0;},
    function(r,c){return r%2===0;},
    function(r,c){return c%3===0;},
    function(r,c){return(r+c)%3===0;},
    function(r,c){return(Math.floor(r/2)+Math.floor(c/3))%2===0;},
    function(r,c){return(r*c)%2+(r*c)%3===0;},
    function(r,c){return((r*c)%2+(r*c)%3)%2===0;},
    function(r,c){return((r+c)%2+(r*c)%3)%2===0;}
  ];

  function createQR(text, ecLevelStr) {
    ecLevelStr = ecLevelStr || 'M';
    var ecLevel = QRErrorLevel[ecLevelStr];

    // Encode as UTF-8 bytes
    var bytes = [];
    for (var i = 0; i < text.length; i++) {
      var code = text.charCodeAt(i);
      if (code < 128) {
        bytes.push(code);
      } else if (code < 2048) {
        bytes.push(0xC0|(code>>6), 0x80|(code&63));
      } else {
        bytes.push(0xE0|(code>>12), 0x80|((code>>6)&63), 0x80|(code&63));
      }
    }

    // Find minimum type number
    var typeNum = 1;
    for (; typeNum <= 40; typeNum++) {
      var blocks = getBlocks(typeNum, ecLevel);
      var totalData = blocks.reduce(function(s,b){return s+b.data;}, 0);
      // 8bit mode header: 4 + 8 (or 16) bits for length + data bytes
      var lenBits = typeNum < 10 ? 8 : 16;
      var needed = Math.ceil((4 + lenBits + bytes.length * 8) / 8);
      if (needed <= totalData) break;
    }
    if (typeNum > 40) throw new Error('Data too long for QR');

    var blocks = getBlocks(typeNum, ecLevel);
    var totalData = blocks.reduce(function(s,b){return s+b.data;}, 0);

    // Build bit buffer
    var buf = [];
    var bLen = 0;
    function putBits(val, len) {
      for (var i = len - 1; i >= 0; i--) {
        var idx = bLen >> 3;
        while (buf.length <= idx) buf.push(0);
        if ((val >> i) & 1) buf[idx] |= 1 << (7 - (bLen & 7));
        bLen++;
      }
    }
    function getBit(pos) {
      return (buf[pos >> 3] >> (7 - (pos & 7))) & 1;
    }

    var lenBits2 = typeNum < 10 ? 8 : 16;
    putBits(4, 4);          // mode 8bit
    putBits(bytes.length, lenBits2);
    for (var i = 0; i < bytes.length; i++) putBits(bytes[i], 8);
    // Terminator
    var rem = totalData * 8 - bLen;
    putBits(0, Math.min(4, rem));
    while (bLen % 8) putBits(0, 1);
    var PAD = [0xEC, 0x11];
    for (var pi = 0; bLen < totalData * 8; pi++) putBits(PAD[pi & 1], 8);

    // Split into RS blocks and compute EC
    var dcData = [], ecData = [];
    var offset = 0;
    for (var bi = 0; bi < blocks.length; bi++) {
      var b = blocks[bi];
      var dc = [];
      for (var j = 0; j < b.data; j++) dc.push(buf[offset++]);
      dcData.push(dc);
      var ep = ecPoly(b.total - b.data);
      var rp = Poly(dc, b.total - b.data);
      var mp = rp.mod(ep);
      var ec = [];
      var ecLen = b.total - b.data;
      for (var j = 0; j < ecLen; j++) {
        var mi = j + mp.len() - ecLen;
        ec.push(mi >= 0 ? mp.at(mi) : 0);
      }
      ecData.push(ec);
    }

    // Interleave
    var data = [];
    var maxDC = Math.max.apply(null, dcData.map(function(d){return d.length;}));
    for (var i = 0; i < maxDC; i++)
      for (var bi = 0; bi < dcData.length; bi++)
        if (i < dcData[bi].length) data.push(dcData[bi][i]);
    var maxEC = Math.max.apply(null, ecData.map(function(d){return d.length;}));
    for (var i = 0; i < maxEC; i++)
      for (var bi = 0; bi < ecData.length; bi++)
        if (i < ecData[bi].length) data.push(ecData[bi][i]);

    // Build matrix
    var mc = typeNum * 4 + 17;
    var mat = [];
    for (var r = 0; r < mc; r++) { mat.push([]); for (var c = 0; c < mc; c++) mat[r].push(null); }

    function setRect(row, col, pattern) {
      for (var r = -1; r <= 7; r++) {
        if (row+r < 0 || mc <= row+r) continue;
        for (var c = -1; c <= 7; c++) {
          if (col+c < 0 || mc <= col+c) continue;
          mat[row+r][col+c] = (r>=0&&r<=6&&(c===0||c===6)) || (c>=0&&c<=6&&(r===0||r===6)) || (r>=2&&r<=4&&c>=2&&c<=4);
        }
      }
    }
    setRect(0,0); setRect(mc-7,0); setRect(0,mc-7);

    // Alignment
    var ap = ALIGN[typeNum-1];
    for (var ai = 0; ai < ap.length; ai++) {
      for (var aj = 0; aj < ap.length; aj++) {
        var ar = ap[ai], ac = ap[aj];
        if (mat[ar][ac] !== null) continue;
        for (var dr = -2; dr <= 2; dr++)
          for (var dc = -2; dc <= 2; dc++)
            mat[ar+dr][ac+dc] = (Math.abs(dr)===2||Math.abs(dc)===2||dr===0&&dc===0);
      }
    }

    // Timing
    for (var i = 8; i < mc-8; i++) {
      if (mat[i][6] === null) mat[i][6] = (i%2===0);
      if (mat[6][i] === null) mat[6][i] = (i%2===0);
    }
    mat[mc-8][8] = true; // dark module

    // Type info placeholder
    var TYPE_COORDS = [[0,8],[1,8],[2,8],[3,8],[4,8],[5,8],[7,8],[8,8],[8,7],[8,5],[8,4],[8,3],[8,2],[8,1],[8,0]];
    var TYPE_COORDS2 = [[8,mc-1],[8,mc-2],[8,mc-3],[8,mc-4],[8,mc-5],[8,mc-6],[8,mc-7],[mc-8,8],[mc-7,8],[mc-6,8],[mc-5,8],[mc-4,8],[mc-3,8],[mc-2,8],[mc-1,8]];
    TYPE_COORDS.forEach(function(p){mat[p[0]][p[1]]=false;});
    TYPE_COORDS2.forEach(function(p){mat[p[0]][p[1]]=false;});

    // Find best mask
    function applyMask(mask, test) {
      var m = [];
      for (var r = 0; r < mc; r++) { m.push(mat[r].slice()); }
      // write data
      var bit = 0, totalBits = data.length * 8;
      var col = mc-1;
      while (col > 0) {
        if (col === 6) col--;
        for (var dr = 0; dr < mc; dr++) {
          var row = (Math.floor((mc-1-col)/2)%2===0) ? mc-1-dr : dr;
          for (var dc2 = 0; dc2 < 2; dc2++) {
            var c2 = col - dc2;
            if (m[row][c2] !== null) continue;
            var dark = bit < totalBits ? ((data[bit>>3]>>(7-(bit&7)))&1)===1 : false;
            bit++;
            if (!test && MASKS[mask](row,c2)) dark = !dark;
            m[row][c2] = dark;
          }
        }
        col -= 2;
      }
      // apply type info
      var typeData = (ecLevel << 3) | mask;
      var typeBits = (typeData << 10) | bch(typeData << 10, 0x537);
      typeBits ^= 0x5412;
      for (var i = 0; i < 15; i++) {
        var bit2 = (typeBits >> i) & 1;
        var p1 = TYPE_COORDS[i], p2 = TYPE_COORDS2[i];
        m[p1[0]][p1[1]] = bit2 === 1;
        m[p2[0]][p2[1]] = bit2 === 1;
      }
      return m;
    }

    function penalty(m) {
      var p = 0;
      for (var r = 0; r < mc; r++) {
        for (var c = 0; c < mc; c++) {
          var s = 0;
          for (var dr = -1; dr <= 1; dr++) for (var dc = -1; dc <= 1; dc++) {
            if (r+dr<0||r+dr>=mc||c+dc<0||c+dc>=mc||dr===0&&dc===0) continue;
            if (m[r][c] === m[r+dr][c+dc]) s++;
          }
          if (s > 5) p += (s - 5);
        }
      }
      return p;
    }

    var bestMask = 0, bestP = Infinity;
    for (var mask = 0; mask < 8; mask++) {
      var tm = applyMask(mask, true);
      var pp = penalty(tm);
      if (pp < bestP) { bestP = pp; bestMask = mask; }
    }

    var finalMat = applyMask(bestMask, false);
    return { modules: finalMat, size: mc };
  }

  // Public render function
  function renderQR(containerId, text, pixelSize) {
    var container = document.getElementById(containerId);
    if (!container) return false;
    container.innerHTML = '';
    try {
      var qr = createQR(text, 'M');
      var mc = qr.size;
      var cell = Math.max(2, Math.floor(pixelSize / mc));
      var total = mc * cell;
      var canvas = document.createElement('canvas');
      canvas.width = total;
      canvas.height = total;
      var ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, total, total);
      ctx.fillStyle = '#000000';
      for (var r = 0; r < mc; r++) {
        for (var c = 0; c < mc; c++) {
          if (qr.modules[r][c]) ctx.fillRect(c*cell, r*cell, cell, cell);
        }
      }
      container.appendChild(canvas);
      return true;
    } catch (e) {
      container.innerHTML = '<p style="color:#c0392b;font-size:12px;padding:8px;">Erro ao gerar QR.<br>Informe a chave manualmente.</p>';
      return false;
    }
  }

  return { render: renderQR };
})();
