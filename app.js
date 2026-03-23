/* ============================================
   LÁ FÉ CANTINA — APP LOGIC
   ============================================ */

/* ── ESTADO GLOBAL ── */
var products = [], sales = [], cart = [];
var payMethod = 'dinheiro', editingId = null, pdvCat = 'Todos';
var qrInlineDone = false, qrModalDone = false;
var deferredInstall = null;

/* ── PIX (carregado do localStorage ou padrão) ── */
var PIX_KEY  = localStorage.getItem('lafe_pix_key')  || 'lafecuritiba@gmail.com';
var PIX_NOME = localStorage.getItem('lafe_pix_nome') || 'Débora Assis Santos';
var PIX_DATA = localStorage.getItem('lafe_pix_data') ||
  '00020126440014br.gov.bcb.pix0122lafecuritiba@gmail.com5204000053039865802BR5919DEBORA ASSIS SANTOS6014RIO DE JANEIRO62070503***6304B102';

/* ── STORAGE ── */
function loadData() {
  try { products = JSON.parse(localStorage.getItem('lafe_products') || '[]'); } catch(e) { products = []; }
  try { sales    = JSON.parse(localStorage.getItem('lafe_sales')    || '[]'); } catch(e) { sales    = []; }
}
function saveData() {
  localStorage.setItem('lafe_products', JSON.stringify(products));
  localStorage.setItem('lafe_sales',    JSON.stringify(sales));
}
function initDemo() {
  if (products.length > 0) return;
  products = [
    { id:1, nome:'Café Expresso',   preco:4.00, estoque:50, categoria:'Bebidas'  },
    { id:2, nome:'Suco de Laranja', preco:5.00, estoque:30, categoria:'Bebidas'  },
    { id:3, nome:'Pão de Queijo',   preco:3.50, estoque:40, categoria:'Salgados' },
    { id:4, nome:'Coxinha',         preco:5.00, estoque:25, categoria:'Salgados' },
    { id:5, nome:'Brownie',         preco:6.00, estoque:20, categoria:'Doces'    },
    { id:6, nome:'Água Mineral',    preco:2.50, estoque:60, categoria:'Bebidas'  }
  ];
  saveData();
}

/* ── HELPERS ── */
function fmt(v) { return 'R$ ' + v.toFixed(2).replace('.', ','); }

function showToast(msg, type) {
  var t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast' + (type === 'error' ? ' error' : '');
  setTimeout(function () { t.classList.add('show'); }, 10);
  setTimeout(function () { t.classList.remove('show'); }, 2800);
}

function totalCart() {
  return cart.reduce(function (s, i) { return s + i.preco * i.qty; }, 0);
}

function updatePixLabels() {
  var label = PIX_KEY + ' · ' + PIX_NOME;
  var el1 = document.getElementById('qr-pix-key-label');
  var el2 = document.getElementById('modal-pix-key-label');
  if (el1) el1.textContent = label;
  if (el2) el2.textContent = label;
}

/* ── FONTE ── */
function setFontSize(size) {
  size = parseInt(size, 10);
  document.body.style.fontSize = size + 'px';
  document.getElementById('font-slider').value = size;
  document.getElementById('font-val').textContent = size + 'px';
  localStorage.setItem('lafe_font', size);
  var labels = { 13: 'Pequena', 16: 'Normal', 19: 'Grande', 22: 'Máx' };
  document.querySelectorAll('.preset-btn').forEach(function (b) {
    b.classList.toggle('active', b.textContent === (labels[size] || ''));
  });
  var pct = ((size - 12) / (22 - 12)) * 100;
  document.getElementById('font-slider').style.background =
    'linear-gradient(to right, var(--gold) 0%, var(--gold) ' + pct + '%, var(--border) ' + pct + '%)';
}

function toggleFontPanel() {
  document.getElementById('font-panel').classList.toggle('open');
}

/* ── NAVEGAÇÃO ── */
function goTo(view) {
  document.querySelectorAll('.view').forEach(function (v) { v.classList.remove('active'); });
  document.querySelectorAll('nav button').forEach(function (b) { b.classList.remove('active'); });
  document.getElementById('view-' + view).classList.add('active');
  document.getElementById('btn-' + view).classList.add('active');
  if (view === 'pdv')     { renderPDV(); renderCart(); }
  if (view === 'estoque') { renderEstoque(); }
  if (view === 'vendas')  { renderVendas(); }
}

/* ════════════════════════════════════════════
   MODAL CONFIGURAÇÕES
   ════════════════════════════════════════════ */
function openConfig(tab) {
  document.getElementById('config-modal').classList.add('open');
  switchTab(tab || 'pix');
}
function closeConfig() {
  document.getElementById('config-modal').classList.remove('open');
}

function switchTab(tab) {
  ['pix','senha','instalar'].forEach(function (t) {
    document.getElementById('cfg-' + t).style.display  = t === tab ? 'block' : 'none';
    document.getElementById('tab-' + t).classList.toggle('active', t === tab);
  });
  if (tab === 'pix')      loadPixFields();
  if (tab === 'senha')    loadSenhaState();
  if (tab === 'instalar') loadInstallState();
}

/* ── CONFIGURAÇÕES: PIX ── */
function loadPixFields() {
  document.getElementById('cfg-pix-key').value  = PIX_KEY;
  document.getElementById('cfg-pix-nome').value = PIX_NOME;
  document.getElementById('cfg-pix-data').value = PIX_DATA;
}

function salvarPix() {
  var key  = document.getElementById('cfg-pix-key').value.trim();
  var nome = document.getElementById('cfg-pix-nome').value.trim();
  var data = document.getElementById('cfg-pix-data').value.trim();
  if (!key || !data) { showToast('Preencha a chave e o código Pix!', 'error'); return; }
  PIX_KEY  = key;
  PIX_NOME = nome || key;
  PIX_DATA = data;
  localStorage.setItem('lafe_pix_key',  PIX_KEY);
  localStorage.setItem('lafe_pix_nome', PIX_NOME);
  localStorage.setItem('lafe_pix_data', PIX_DATA);
  // resetar QR para ser regenerado com novo dado
  qrInlineDone = false; qrModalDone = false;
  document.getElementById('qr-inline-wrap').innerHTML = '';
  document.getElementById('qr-modal-wrap').innerHTML  = '';
  updatePixLabels();
  showToast('Chave Pix salva! ✓');
  closeConfig();
}

/* ── CONFIGURAÇÕES: SENHA ── */
var cfgPIN = '', cfgPINStep = 1, cfgPINFirst = '', cfgPINTrocar = false;

function getSaved()  { return localStorage.getItem('lafe_pin'); }
function savePin(p)  { localStorage.setItem('lafe_pin', hashPIN(p)); }
function checkPin(p) { return getSaved() === hashPIN(p); }
function hashPIN(pin) {
  var h = 5381;
  for (var i = 0; i < pin.length; i++) { h = ((h << 5) + h) ^ pin.charCodeAt(i); h = h >>> 0; }
  return h.toString(16);
}

function loadSenhaState() {
  var has = !!getSaved();
  document.getElementById('cfg-sem-senha').style.display  = has ? 'none'  : 'block';
  document.getElementById('cfg-com-senha').style.display  = has ? 'block' : 'none';
  document.getElementById('cfg-criar-senha').style.display = 'none';
}

function cfgIniciarSenha(isTrocar) {
  cfgPINTrocar = isTrocar || false;
  cfgPIN = ''; cfgPINStep = 1; cfgPINFirst = '';
  document.getElementById('cfg-sem-senha').style.display  = 'none';
  document.getElementById('cfg-com-senha').style.display  = 'none';
  document.getElementById('cfg-criar-senha').style.display = 'block';
  document.getElementById('cfg-badge-txt').textContent = cfgPINTrocar ? 'Trocar Senha' : 'Criar Senha';
  document.getElementById('cfg-senha-title').textContent = cfgPINTrocar ? 'Nova senha' : 'Criar senha';
  document.getElementById('cfg-senha-sub').textContent   = 'Digite 4 dígitos';
  document.getElementById('cfg-sdot1').classList.add('on');
  document.getElementById('cfg-sdot2').classList.remove('on');
  cfgSetDots(0, false);
  document.getElementById('cfg-pin-err').textContent = '';
  cfgBuildPad();
}

function cfgRemoverSenha() {
  if (!confirm('Remover a senha? Estoque e Vendas ficarão sem proteção.')) return;
  localStorage.removeItem('lafe_pin');
  loadSenhaState();
  showToast('Senha removida!');
}

function cfgCancelarSenha() { loadSenhaState(); }

function cfgBuildPad() {
  var digits = ['1','2','3','4','5','6','7','8','9','','0','⌫'];
  document.getElementById('cfg-numpad').innerHTML = digits.map(function (d) {
    if (d === '') return '<div></div>';
    var val = d === '⌫' ? 'DEL' : d;
    return '<button class="num-btn" onclick="cfgNumPress(\'' + val + '\')">' + d + '</button>';
  }).join('');
}

function cfgSetDots(count, isErr) {
  document.querySelectorAll('#cfg-dots .lock-dot').forEach(function (dot, i) {
    dot.classList.remove('filled', 'error');
    if (isErr) dot.classList.add('error');
    else if (i < count) dot.classList.add('filled');
  });
}

function cfgNumPress(d) {
  if (d === 'DEL') cfgPIN = cfgPIN.slice(0, -1);
  else if (cfgPIN.length < 4) cfgPIN += d;
  cfgSetDots(cfgPIN.length, false);
  if (cfgPIN.length === 4) setTimeout(cfgPINNext, 150);
}

function cfgPINNext() {
  if (cfgPINStep === 1) {
    cfgPINFirst = cfgPIN; cfgPIN = ''; cfgPINStep = 2;
    document.getElementById('cfg-senha-title').textContent = 'Confirmar senha';
    document.getElementById('cfg-senha-sub').textContent   = 'Repita os 4 dígitos';
    document.getElementById('cfg-sdot1').classList.remove('on');
    document.getElementById('cfg-sdot2').classList.add('on');
    cfgSetDots(0, false);
    document.getElementById('cfg-pin-err').textContent = '';
  } else {
    if (cfgPIN === cfgPINFirst) {
      savePin(cfgPIN);
      loadSenhaState();
      showToast(cfgPINTrocar ? 'Senha alterada! 🔑' : 'Senha criada! 🔑');
    } else {
      cfgSetDots(4, true);
      document.getElementById('cfg-pin-err').textContent = 'Senhas diferentes. Tente novamente.';
      setTimeout(function () {
        cfgPIN = ''; cfgPINFirst = ''; cfgPINStep = 1;
        document.getElementById('cfg-senha-title').textContent = cfgPINTrocar ? 'Nova senha' : 'Criar senha';
        document.getElementById('cfg-senha-sub').textContent   = 'Digite 4 dígitos';
        document.getElementById('cfg-sdot1').classList.add('on');
        document.getElementById('cfg-sdot2').classList.remove('on');
        cfgSetDots(0, false);
        document.getElementById('cfg-pin-err').textContent = '';
      }, 1000);
    }
  }
}

/* ── CONFIGURAÇÕES: INSTALAR ── */
function loadInstallState() {
  var btn   = document.getElementById('cfg-install-btn');
  var guide = document.getElementById('cfg-install-guide');
  var msg   = document.getElementById('cfg-installed-msg');
  if (window.matchMedia('(display-mode: standalone)').matches) {
    btn.style.display   = 'none';
    guide.style.display = 'none';
    msg.style.display   = 'block';
  } else if (deferredInstall) {
    btn.style.display   = 'block';
    guide.style.display = 'none';
    msg.style.display   = 'none';
  } else {
    btn.style.display   = 'none';
    guide.style.display = 'block';
    msg.style.display   = 'none';
  }
}

function cfgDoInstall() {
  if (deferredInstall) {
    deferredInstall.prompt();
    deferredInstall.userChoice.then(function (r) {
      deferredInstall = null;
      if (r.outcome === 'accepted') {
        showToast('App instalado! ✓');
        closeConfig();
      }
    });
  }
}

/* ════════════════════════════════════════════
   MODAL SENHA (acesso a abas protegidas)
   ════════════════════════════════════════════ */
var lockTarget = null, lockPIN = '';

function buildPad(padId) {
  var digits = ['1','2','3','4','5','6','7','8','9','','0','⌫'];
  document.getElementById(padId).innerHTML = digits.map(function (d) {
    if (d === '') return '<div></div>';
    var val = d === '⌫' ? 'DEL' : d;
    return '<button class="num-btn" onclick="numPress(\'' + val + '\',\'' + padId + '\')">' + d + '</button>';
  }).join('');
}

function setDots(id, count, isErr) {
  document.querySelectorAll('#' + id + ' .lock-dot').forEach(function (dot, i) {
    dot.classList.remove('filled', 'error');
    if (isErr) dot.classList.add('error');
    else if (i < count) dot.classList.add('filled');
  });
}

function numPress(d, padId) {
  if (d === 'DEL') lockPIN = lockPIN.slice(0, -1);
  else if (lockPIN.length < 4) lockPIN += d;
  setDots('dots-enter', lockPIN.length, false);
  if (lockPIN.length === 4) setTimeout(verifyPin, 150);
}

function verifyPin() {
  if (checkPin(lockPIN)) {
    closeLock(); goTo(lockTarget); showToast('Acesso liberado ✓');
  } else {
    setDots('dots-enter', 4, true);
    document.getElementById('enter-err').textContent = 'Senha incorreta. Tente novamente.';
    setTimeout(function () {
      lockPIN = '';
      setDots('dots-enter', 0, false);
      document.getElementById('enter-err').textContent = '';
    }, 900);
  }
}

function tryAccess(view) {
  lockTarget = view; lockPIN = '';
  var hasPIN = !!getSaved();
  document.getElementById('ls-nopass').style.display = hasPIN ? 'none'  : 'block';
  document.getElementById('ls-enter').style.display  = hasPIN ? 'block' : 'none';
  if (hasPIN) {
    buildPad('numpad-enter');
    setDots('dots-enter', 0, false);
    document.getElementById('enter-err').textContent = '';
  }
  document.getElementById('lock-modal').classList.add('open');
}

function closeLock() { document.getElementById('lock-modal').classList.remove('open'); lockPIN = ''; }

/* ════════════════════════════════════════════
   PDV
   ════════════════════════════════════════════ */
function renderPDV() {
  var cats = ['Todos'];
  products.forEach(function (p) { if (cats.indexOf(p.categoria) < 0) cats.push(p.categoria); });
  document.getElementById('pdv-cats').innerHTML = cats.map(function (c) {
    return '<button class="cat-btn' + (c === pdvCat ? ' active' : '') + '" onclick="setCat(\'' + c.replace(/'/g,"\\'") + '\')">' + c + '</button>';
  }).join('');
  var search = document.getElementById('pdv-search').value.toLowerCase();
  var list = products.filter(function (p) {
    return (pdvCat === 'Todos' || p.categoria === pdvCat) && p.nome.toLowerCase().indexOf(search) >= 0;
  });
  if (!list.length) {
    document.getElementById('pdv-grid').innerHTML = '<div style="color:var(--cream-dim);grid-column:1/-1;padding:20px;">Nenhum produto encontrado</div>';
    return;
  }
  document.getElementById('pdv-grid').innerHTML = list.map(function (p) {
    return '<div class="pdv-card' + (p.estoque === 0 ? ' out-of-stock' : '') + '" onclick="addCart(' + p.id + ')">' +
      '<div class="pdv-card-name">' + p.nome + '</div>' +
      '<div class="pdv-card-price">' + fmt(p.preco) + '</div>' +
      '<div class="pdv-card-stock">' + (p.estoque === 0 ? 'Sem estoque' : 'Estoque: ' + p.estoque) + '</div>' +
    '</div>';
  }).join('');
}

function setCat(c) { pdvCat = c; renderPDV(); }

function addCart(id) {
  var p = products.find(function (x) { return x.id === id; });
  if (!p || p.estoque === 0) return;
  var item = cart.find(function (x) { return x.id === id; });
  if (item) {
    if (item.qty >= p.estoque) { showToast('Estoque insuficiente!', 'error'); return; }
    item.qty++;
  } else {
    cart.push({ id: id, nome: p.nome, preco: p.preco, qty: 1 });
  }
  renderCart();
}

function renderCart() {
  var el = document.getElementById('cart-items');
  if (!cart.length) {
    el.innerHTML = '<div style="color:var(--cream-dim);font-size:.85em;padding:20px 0;text-align:center;">Nenhum item adicionado</div>';
  } else {
    el.innerHTML = cart.map(function (item) {
      return '<div class="cart-item">' +
        '<div class="cart-item-name">' + item.nome + '</div>' +
        '<div class="cart-item-qty">' +
          '<button class="qty-btn" onclick="changeQty(' + item.id + ',-1)">&#8722;</button>' +
          '<span style="font-size:.9em;min-width:22px;text-align:center;">' + item.qty + '</span>' +
          '<button class="qty-btn" onclick="changeQty(' + item.id + ',1)">+</button>' +
        '</div>' +
        '<div class="cart-item-price">' + fmt(item.preco * item.qty) + '</div>' +
        '<button class="cart-remove" onclick="removeCart(' + item.id + ')">&#215;</button>' +
      '</div>';
    }).join('');
  }
  var total = totalCart();
  var totalEl = document.getElementById('cart-total');
  var prevTotal = totalEl._lastTotal;
  totalEl.textContent = fmt(total);
  if (prevTotal !== undefined && total !== prevTotal && cart.length > 0) {
    totalEl.classList.remove('pulse');
    void totalEl.offsetWidth;
    totalEl.classList.add('pulse');
    totalEl.addEventListener('animationend', function () { totalEl.classList.remove('pulse'); }, { once: true });
  }
  totalEl._lastTotal = total;
  document.getElementById('btn-finalizar').disabled = cart.length === 0;
  if (payMethod === 'pix') updatePixValor();
  calcTroco();
}

function changeQty(id, delta) {
  var item = cart.find(function (x) { return x.id === id; });
  if (!item) return;
  var p = products.find(function (x) { return x.id === id; });
  if (delta > 0 && item.qty >= p.estoque) { showToast('Estoque insuficiente!', 'error'); return; }
  item.qty += delta;
  if (item.qty <= 0) removeCart(id); else renderCart();
}

function removeCart(id) { cart = cart.filter(function (x) { return x.id !== id; }); renderCart(); }

function selectPay(m) {
  payMethod = m;
  document.getElementById('pay-dinheiro').classList.toggle('selected', m === 'dinheiro');
  document.getElementById('pay-pix').classList.toggle('selected', m === 'pix');
  document.getElementById('troco-area').style.display = m === 'dinheiro' ? 'block' : 'none';

  /* Limpa valor recebido e troco ao trocar forma de pagamento */
  document.getElementById('valor-recebido').value = '';
  document.getElementById('troco-result').textContent = '';

  var qrArea = document.getElementById('qr-inline-area');
  if (m === 'pix') {
    qrArea.classList.add('show');
    if (!qrInlineDone) { QRGen.render('qr-inline-wrap', PIX_DATA, 160); qrInlineDone = true; }
    updatePixValor();
  } else {
    qrArea.classList.remove('show');
  }
  calcTroco();
}

function updatePixValor() {
  var total = totalCart();
  document.getElementById('qr-pix-valor').textContent = total > 0 ? fmt(total) : '';
}

function calcTroco() {
  if (payMethod !== 'dinheiro') return;
  var total = totalCart();
  var rec   = parseFloat(document.getElementById('valor-recebido').value) || 0;
  var el    = document.getElementById('troco-result');
  if (rec > 0) {
    var troco = rec - total;
    el.textContent = troco >= 0 ? 'Troco: ' + fmt(troco) : '⚠ Valor insuficiente';
    el.style.color = troco >= 0 ? 'var(--gold)' : '#e74c3c';
  } else { el.textContent = ''; }
}

function finalizarVenda() {
  if (!cart.length) return;
  if (payMethod === 'pix') {
    if (!qrModalDone) { QRGen.render('qr-modal-wrap', PIX_DATA, 200); qrModalDone = true; }
    document.getElementById('pix-total-display').textContent = fmt(totalCart());
    document.getElementById('pix-modal').classList.add('open');
  } else {
    concluirVenda('Dinheiro');
  }
}

function closePixModal() { document.getElementById('pix-modal').classList.remove('open'); }
function confirmarPix()  { closePixModal(); concluirVenda('Pix'); }

function concluirVenda(method) {
  var total = totalCart();
  cart.forEach(function (item) {
    var p = products.find(function (x) { return x.id === item.id; });
    if (p) p.estoque -= item.qty;
  });
  sales.unshift({
    id: sales.length + 1,
    data: new Date().toLocaleString('pt-BR'),
    itens: cart.map(function (i) { return i.nome + ' x' + i.qty; }).join(', '),
    pagamento: method,
    total: total
  });
  saveData();
  cart = [];
  document.getElementById('valor-recebido').value = '';
  document.getElementById('troco-result').textContent = '';
  document.getElementById('qr-inline-area').classList.remove('show');
  document.getElementById('pay-dinheiro').classList.add('selected');
  document.getElementById('pay-pix').classList.remove('selected');
  document.getElementById('troco-area').style.display = 'block';
  payMethod = 'dinheiro';
  qrInlineDone = false; qrModalDone = false;
  renderCart(); renderPDV();
  showToast('Venda de ' + fmt(total) + ' concluída! ✓');
}

/* ════════════════════════════════════════════
   ESTOQUE
   ════════════════════════════════════════════ */
function renderEstoque() {
  var search = (document.getElementById('est-search') || { value: '' }).value.toLowerCase();
  var list = products.filter(function (p) { return p.nome.toLowerCase().indexOf(search) >= 0; });
  var grid = document.getElementById('estoque-grid');
  if (!grid) return;
  if (!list.length) { grid.innerHTML = '<div style="color:var(--cream-dim);padding:20px;">Nenhum produto</div>'; return; }
  grid.innerHTML = list.map(function (p) {
    var cls = p.estoque === 0 ? 'out' : p.estoque <= 5 ? 'low' : '';
    return '<div class="card">' +
      '<div class="card-name">' + p.nome + '</div>' +
      '<div class="card-price">' + fmt(p.preco) + '</div>' +
      '<div class="card-stock ' + cls + '">Estoque: <span>' + p.estoque + ' un</span></div>' +
      '<div style="font-size:.72em;color:var(--gold-dim);margin-top:4px;">' + p.categoria + '</div>' +
      '<div class="card-actions">' +
        '<button class="btn-sm btn-edit" onclick="openEdit(' + p.id + ')">Editar</button>' +
        '<button class="btn-sm btn-del"  onclick="delProd(' + p.id + ')">Excluir</button>' +
      '</div>' +
    '</div>';
  }).join('');
}

function salvarProduto() {
  var nome     = document.getElementById('p-nome').value.trim();
  var preco    = parseFloat(document.getElementById('p-preco').value);
  var estoque  = parseInt(document.getElementById('p-estoque').value, 10) || 0;
  var categoria= document.getElementById('p-categoria').value.trim() || 'Geral';
  if (!nome || isNaN(preco)) { showToast('Preencha nome e preço!', 'error'); return; }
  products.push({ id: Date.now(), nome: nome, preco: preco, estoque: estoque, categoria: categoria });
  saveData();
  ['p-nome','p-preco','p-estoque','p-categoria'].forEach(function (id) { document.getElementById(id).value = ''; });
  renderEstoque(); showToast('Produto adicionado!');
}

function openEdit(id) {
  var p = products.find(function (x) { return x.id === id; });
  if (!p) return;
  editingId = id;
  document.getElementById('em-nome').value      = p.nome;
  document.getElementById('em-preco').value     = p.preco;
  document.getElementById('em-estoque').value   = p.estoque;
  document.getElementById('em-categoria').value = p.categoria;
  document.getElementById('edit-modal').classList.add('open');
}

function closeEditModal() { document.getElementById('edit-modal').classList.remove('open'); editingId = null; }

function salvarEdicao() {
  var p = products.find(function (x) { return x.id === editingId; });
  if (!p) return;
  p.nome      = document.getElementById('em-nome').value.trim()           || p.nome;
  p.preco     = parseFloat(document.getElementById('em-preco').value)     || p.preco;
  p.estoque   = parseInt(document.getElementById('em-estoque').value, 10) || 0;
  p.categoria = document.getElementById('em-categoria').value.trim()      || p.categoria;
  saveData(); closeEditModal(); renderEstoque(); showToast('Produto atualizado!');
}

function delProd(id) {
  if (!confirm('Excluir este produto?')) return;
  products = products.filter(function (x) { return x.id !== id; });
  saveData(); renderEstoque(); showToast('Produto excluído!');
}

/* ════════════════════════════════════════════
   VENDAS
   ════════════════════════════════════════════ */
function renderVendas() {
  var tv = 0, tp = 0, td = 0, te = 0;
  sales.forEach(function (v) { tv += v.total; if (v.pagamento === 'Pix') tp += v.total; else td += v.total; });
  products.forEach(function (p) { te += p.estoque; });
  document.getElementById('summary-cards').innerHTML =
    '<div class="sum-card"><div class="sum-card-label">Total Arrecadado</div><div class="sum-card-value">' + fmt(tv) + '</div><div class="sum-card-sub">' + sales.length + ' venda(s)</div></div>' +
    '<div class="sum-card"><div class="sum-card-label">Recebido em Dinheiro</div><div class="sum-card-value">' + fmt(td) + '</div></div>' +
    '<div class="sum-card"><div class="sum-card-label">Recebido em Pix</div><div class="sum-card-value">' + fmt(tp) + '</div></div>' +
    '<div class="sum-card"><div class="sum-card-label">Itens em Estoque</div><div class="sum-card-value">' + te + '</div></div>';
  var tbody   = document.getElementById('sales-tbody');
  var noSales = document.getElementById('no-sales');
  if (!sales.length) { tbody.innerHTML = ''; noSales.style.display = 'block'; return; }
  noSales.style.display = 'none';
  tbody.innerHTML = sales.map(function (v) {
    return '<tr>' +
      '<td style="color:var(--gold-dim);">#' + v.id + '</td>' +
      '<td>' + v.data + '</td>' +
      '<td style="max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + v.itens + '</td>' +
      '<td><span class="badge badge-' + (v.pagamento === 'Pix' ? 'pix' : 'cash') + '">' + v.pagamento + '</span></td>' +
      '<td style="color:var(--gold);font-weight:600;">' + fmt(v.total) + '</td>' +
    '</tr>';
  }).join('');
}

function limparVendas() {
  if (!confirm('Limpar todo o histórico de vendas?')) return;
  sales = []; saveData(); renderVendas(); showToast('Histórico limpo!');
}

/* ════════════════════════════════════════════
   PWA
   ════════════════════════════════════════════ */
window.addEventListener('beforeinstallprompt', function (e) {
  e.preventDefault();
  deferredInstall = e;
  if (!localStorage.getItem('lafe_install_dismissed')) {
    setTimeout(function () { document.getElementById('install-banner').classList.add('show'); }, 2500);
  }
});

function doInstall() {
  document.getElementById('install-banner').classList.remove('show');
  if (deferredInstall) {
    deferredInstall.prompt();
    deferredInstall.userChoice.then(function () { deferredInstall = null; });
  }
}

function dismissInstall() {
  document.getElementById('install-banner').classList.remove('show');
  localStorage.setItem('lafe_install_dismissed', '1');
}

window.addEventListener('appinstalled', function () { showToast('App instalado! ✓ Abra pela tela inicial'); });

if ('serviceWorker' in navigator) {
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('./sw.js')
      .then(function (reg) { console.log('SW ativo:', reg.scope); })
      .catch(function (err) { console.warn('SW erro:', err); });
  });
}

/* ── FECHAR PAINÉIS AO CLICAR FORA ── */
document.addEventListener('click', function (e) {
  /* Painel de fonte: fecha ao clicar fora */
  var panel = document.getElementById('font-panel');
  var btn   = document.querySelector('.icon-btn');
  if (panel && !panel.contains(e.target) && btn && !btn.contains(e.target) &&
      !e.target.classList.contains('icon-btn')) {
    panel.classList.remove('open');
  }

  /* Modais: fecha ao clicar direto no overlay escuro */
  if (!e.target.classList.contains('modal-bg')) return;
  var id = e.target.id;
  if (id === 'config-modal') { closeConfig(); }
  if (id === 'edit-modal')   { closeEditModal(); }
  if (id === 'lock-modal')   { closeLock(); }
  /* Modal Pix: não fecha ao clicar fora — evita encerrar pagamento por acidente */
});

/* ════════════════════════════════════════════
   INIT
   ════════════════════════════════════════════ */
loadData();
initDemo();
setFontSize(parseInt(localStorage.getItem('lafe_font') || '16', 10));
updatePixLabels();
renderPDV();
renderCart();
