const FoodLogger = {
  selectedFood: null,
  amount: 1,

  render() {
    var today  = Utils.today();
    var logs   = Storage.getFoodLogs(today);
    var total  = logs.reduce(function(s,l){ return s+l.calories; }, 0);
    var totalP = logs.reduce(function(s,l){ return s+(l.protein||0); }, 0);
    var hasKey = AI.hasKey();

    var html = '<div class="screen" id="screen-food">';
    html += '<div class="screen-header">';
    html += '<h2 class="screen-title">飲食記錄</h2>';
    html += '<p class="screen-subtitle">' + Utils.formatDate(today) + '</p>';
    html += '<div class="today-summary-row"><div class="today-pill orange">🔥 ' + total + ' kcal</div><div class="today-pill blue">🥩 ' + totalP.toFixed(1) + ' g 蛋白質</div></div>';
    html += '</div>';

    if (hasKey) {
      html += '<div class="card ai-card">';
      html += '<div class="ai-card-header"><span class="ai-badge">🤖 AI 估算</span><span class="ai-hint">用自然語言描述，Claude 幫你算</span></div>';
      html += '<div class="ai-input-row"><input type="text" id="ai-food-input" class="form-input" placeholder="例如：一碗滷肉飯、麥當勞大麥克套餐…"></div>';
      html += '<button class="btn btn-ai btn-full" id="ai-food-btn"><span id="ai-food-btn-text">✨ AI 幫我估算熱量與蛋白質</span></button>';
      html += '<div class="ai-result" id="ai-food-result" style="display:none"></div>';
      html += '</div>';
    } else {
      html += '<div class="card ai-locked-card" onclick="App.navigate(\'profile\')">';
      html += '<span class="ai-lock-icon">🤖</span>';
      html += '<div class="ai-lock-text"><strong>想用 AI 估算任意食物？</strong><br><small>前往個人資料設定 API Key</small></div>';
      html += '<span class="ai-lock-arrow">›</span></div>';
    }

    html += '<div class="card"><div class="card-title">快速選擇</div><div class="food-grid" id="food-grid">';
    for (var i = 0; i < FOOD_DATABASE.length; i++) {
      var f = FOOD_DATABASE[i];
      html += '<div class="food-chip" data-index="' + i + '">';
      html += '<div class="food-chip-name">' + f.name + '</div>';
      html += '<div class="food-chip-cal">' + f.caloriesPerUnit + ' kcal</div>';
      html += '<div class="food-chip-unit">' + f.proteinPerUnit + 'g 蛋白</div>';
      html += '</div>';
    }
    html += '</div>';

    html += '<div class="selected-food-panel" id="selected-food-panel" style="display:none">';
    html += '<div class="selected-food-name" id="selected-food-name">—</div>';
    html += '<div class="amount-row"><button class="qty-btn" id="qty-minus">−</button><div class="qty-display"><span id="qty-value">1</span><span class="qty-unit" id="qty-unit"></span></div><button class="qty-btn" id="qty-plus">＋</button></div>';
    html += '<div class="macro-preview"><span class="macro-cal" id="cal-preview">0 kcal</span><span class="macro-sep">·</span><span class="macro-protein" id="protein-preview">0g 蛋白質</span></div>';
    html += '<button class="btn btn-primary btn-full" id="add-food-btn">＋ 加入今日記錄</button>';
    html += '</div>';

    html += '<div class="custom-food-row"><div class="divider-label">或手動輸入</div>';
    html += '<div class="form-row"><div class="form-group" style="flex:2"><input type="text" id="custom-food-name" class="form-input" placeholder="食物名稱"></div>';
    html += '<div class="form-group" style="flex:1"><div class="input-wrap"><input type="number" id="custom-food-cal" class="form-input" placeholder="熱量"><span class="input-unit">kcal</span></div></div></div>';
    html += '<div class="form-group"><div class="input-wrap"><input type="number" id="custom-food-protein" class="form-input" placeholder="蛋白質（可選填）" step="0.1"><span class="input-unit">g</span></div></div>';
    html += '<button class="btn btn-secondary btn-full" id="add-custom-food-btn">新增自訂食物</button>';
    html += '</div></div>';

    html += '<div class="card" id="food-log-card"><div class="card-title">今日飲食明細</div>';
    if (logs.length === 0) {
      html += '<div class="empty-state">尚未記錄任何食物 🍽️</div>';
    } else {
      html += '<div class="log-list">';
      for (var j = 0; j < logs.length; j++) {
        var l = logs[j];
        var aiTag = l.ai ? '<span class="ai-tag">AI</span>' : '';
        var metaStr = (l.amount ? l.amount : '') + (l.unit ? ' ' + l.unit : '') + (l.protein ? ' · ' + l.protein + 'g 蛋白' : '');
        html += '<div class="log-item">';
        html += '<div class="log-info"><div class="log-name">' + l.food_name + ' ' + aiTag + '</div><div class="log-meta">' + metaStr + '</div></div>';
        html += '<div class="log-cal">' + l.calories + ' kcal</div>';
        html += '<button class="delete-btn" data-type="food" data-index="' + j + '">✕</button>';
        html += '</div>';
      }
      html += '</div>';
      html += '<div class="log-total"><span>總計</span><span>' + total + ' kcal · ' + totalP.toFixed(1) + 'g 蛋白</span></div>';
    }
    html += '</div></div>';
    return html;
  },

  bindEvents() {
    FoodLogger.selectedFood = null;
    FoodLogger.amount = 1;

    var aiBtn = document.getElementById('ai-food-btn');
    var aiInput = document.getElementById('ai-food-input');
    if (aiBtn) aiBtn.addEventListener('click', function(){ FoodLogger.aiEstimate(); });
    if (aiInput) aiInput.addEventListener('keydown', function(e){ if (e.key === 'Enter') FoodLogger.aiEstimate(); });

    document.querySelectorAll('.food-chip').forEach(function(chip) {
      chip.addEventListener('click', function() {
        document.querySelectorAll('.food-chip').forEach(function(c){ c.classList.remove('active'); });
        chip.classList.add('active');
        FoodLogger.selectedFood = FOOD_DATABASE[parseInt(chip.dataset.index)];
        FoodLogger.amount = 1;
        FoodLogger.updatePanel();
      });
    });

    var qm = document.getElementById('qty-minus');
    var qp = document.getElementById('qty-plus');
    if (qm) qm.addEventListener('click', function(){ if (FoodLogger.amount > 0.5) { FoodLogger.amount = Math.round((FoodLogger.amount - 0.5)*10)/10; FoodLogger.updatePanel(); } });
    if (qp) qp.addEventListener('click', function(){ FoodLogger.amount = Math.round((FoodLogger.amount + 0.5)*10)/10; FoodLogger.updatePanel(); });

    var addBtn = document.getElementById('add-food-btn');
    var cusBtn = document.getElementById('add-custom-food-btn');
    if (addBtn) addBtn.addEventListener('click', function(){ FoodLogger.addFood(); });
    if (cusBtn) cusBtn.addEventListener('click', function(){ FoodLogger.addCustomFood(); });

    document.querySelectorAll('.delete-btn[data-type="food"]').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var logs = Storage.getFoodLogs(Utils.today());
        logs.splice(parseInt(btn.dataset.index), 1);
        Storage.saveFoodLogs(Utils.today(), logs);
        Toast.show('已刪除', 'info');
        App.navigate('food');
      });
    });
  },

  updatePanel() {
    var f = FoodLogger.selectedFood;
    if (!f) return;
    document.getElementById('selected-food-panel').style.display = 'block';
    document.getElementById('selected-food-name').textContent = f.name;
    document.getElementById('qty-value').textContent = FoodLogger.amount;
    document.getElementById('qty-unit').textContent = f.unit;
    document.getElementById('cal-preview').textContent = Math.round(FoodLogger.amount * f.caloriesPerUnit) + ' kcal';
    document.getElementById('protein-preview').textContent = (FoodLogger.amount * f.proteinPerUnit).toFixed(1) + 'g 蛋白質';
  },

  aiEstimate: async function() {
    var input = document.getElementById('ai-food-input');
    var desc = input ? input.value.trim() : '';
    if (!desc) { Toast.show('請描述你吃的食物', 'error'); return; }
    var btn = document.getElementById('ai-food-btn-text');
    var resultDiv = document.getElementById('ai-food-result');
    btn.textContent = '⏳ AI 計算中…';
    document.getElementById('ai-food-btn').disabled = true;
    resultDiv.style.display = 'none';
    try {
      var result = await AI.estimateFood(desc);
      resultDiv.style.display = 'block';
      resultDiv.innerHTML = '<div class="ai-result-inner">'
        + '<div class="ai-result-food">' + result.food_name + '</div>'
        + '<div class="ai-result-macros">'
        + '<div class="ai-macro-item orange">' + result.calories + '<span>kcal</span></div>'
        + '<div class="ai-macro-item blue">' + (result.protein || 0) + '<span>g 蛋白質</span></div>'
        + '</div>'
        + '<div class="ai-result-note">' + result.note + '</div>'
        + '<button class="btn btn-primary btn-full" id="ai-add-food-btn">＋ 加入今日記錄</button>'
        + '</div>';
      document.getElementById('ai-add-food-btn').addEventListener('click', function() {
        Storage.addFoodLog({ date: Utils.today(), food_name: result.food_name, amount: 1, unit: '', calories: result.calories, protein: result.protein || 0, ai: true });
        Toast.show('已加入 ' + result.food_name, 'success');
        App.navigate('food');
      });
    } catch(e) {
      if (e.message === 'NO_KEY') Toast.show('請先在個人資料設定 API Key', 'error');
      else if (e.message === 'INVALID_KEY') Toast.show('API Key 無效', 'error');
      else Toast.show('估算失敗：' + e.message, 'error');
    } finally {
      btn.textContent = '✨ AI 幫我估算熱量與蛋白質';
      document.getElementById('ai-food-btn').disabled = false;
    }
  },

  addFood() {
    var f = FoodLogger.selectedFood;
    if (!f) { Toast.show('請先選擇食物', 'error'); return; }
    Storage.addFoodLog({ date: Utils.today(), food_name: f.name, amount: FoodLogger.amount, unit: f.unit, calories: Math.round(FoodLogger.amount * f.caloriesPerUnit), protein: Math.round(FoodLogger.amount * f.proteinPerUnit * 10) / 10 });
    Toast.show('已加入 ' + f.name, 'success');
    App.navigate('food');
  },

  addCustomFood() {
    var name    = document.getElementById('custom-food-name').value.trim();
    var cal     = parseFloat(document.getElementById('custom-food-cal').value);
    var protein = parseFloat(document.getElementById('custom-food-protein').value) || 0;
    if (!name || !cal) { Toast.show('請填寫食物名稱與熱量', 'error'); return; }
    Storage.addFoodLog({ date: Utils.today(), food_name: name, amount: 1, unit: '', calories: cal, protein: protein });
    Toast.show('已加入 ' + name, 'success');
    App.navigate('food');
  }
};
