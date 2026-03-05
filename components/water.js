const Water = {

  getGoal() {
    return parseInt(localStorage.getItem('water_goal') || '2000');
  },

  getToday() {
    return parseInt(localStorage.getItem('water_' + Utils.today()) || '0');
  },

  add(ml) {
    var current = Water.getToday();
    localStorage.setItem('water_' + Utils.today(), current + ml);
  },

  reset() {
    localStorage.setItem('water_' + Utils.today(), '0');
  },

  setGoal(ml) {
    localStorage.setItem('water_goal', ml);
  },

  // 渲染成可嵌入 dashboard 的卡片 HTML
  renderCard() {
    var goal    = Water.getGoal();
    var current = Water.getToday();
    var pct     = Math.min(100, Math.round((current / goal) * 100));
    var remain  = Math.max(0, goal - current);
    var cups    = Math.round(current / 250);

    var statusText = '';
    var statusClass = '';
    if (pct >= 100) {
      statusText = '🎉 今日目標達成！';
      statusClass = 'deficit-tag';
    } else {
      statusText = '還差 ' + remain + ' ml（約 ' + Math.ceil(remain / 250) + ' 杯）';
      statusClass = 'surplus-tag water-remain-tag';
    }

    var quickBtns = [150, 250, 350, 500];
    var btnHtml = '';
    for (var i = 0; i < quickBtns.length; i++) {
      btnHtml += '<button class="water-quick-btn" data-ml="' + quickBtns[i] + '">+' + quickBtns[i] + 'ml</button>';
    }

    var html = '<div class="card water-card">';
    html += '<div class="water-header">';
    html += '<div class="water-title">💧 今日喝水</div>';
    html += '<button class="water-settings-btn" id="water-settings-btn">⚙️</button>';
    html += '</div>';

    html += '<div class="water-main">';
    html += '<div class="water-amount">' + current + '<span class="water-unit">ml</span></div>';
    html += '<div class="water-cups">≈ ' + cups + ' 杯</div>';
    html += '</div>';

    html += '<div class="water-progress-wrap">';
    html += '<div class="water-progress-bar">';
    html += '<div class="water-progress-fill" style="width:' + pct + '%"></div>';
    // 波浪動畫
    html += '<div class="water-wave" style="left:' + (pct - 5) + '%"></div>';
    html += '</div>';
    html += '<div class="water-pct-label">' + pct + '% / 目標 ' + goal + ' ml</div>';
    html += '</div>';

    html += '<div class="' + statusClass + '">' + statusText + '</div>';

    html += '<div class="water-quick-row" id="water-quick-row">' + btnHtml + '</div>';

    html += '<div class="water-custom-row">';
    html += '<div class="input-wrap" style="flex:1"><input type="number" id="water-custom-input" class="form-input" placeholder="自訂ml"><span class="input-unit">ml</span></div>';
    html += '<button class="btn btn-primary" id="water-custom-btn" style="width:auto;padding:0.65rem 1rem">加入</button>';
    html += '</div>';

    html += '<div class="water-settings-panel" id="water-settings-panel" style="display:none">';
    html += '<div class="divider-label">每日目標設定</div>';
    html += '<div class="water-goal-chips">';
    var goals = [1500, 2000, 2500, 3000];
    for (var g = 0; g < goals.length; g++) {
      var isActive = goals[g] === goal ? ' active' : '';
      html += '<button class="water-goal-chip' + isActive + '" data-goal="' + goals[g] + '">' + goals[g] + 'ml</button>';
    }
    html += '</div>';
    html += '<div class="water-custom-goal-row">';
    html += '<div class="input-wrap" style="flex:1"><input type="number" id="water-goal-input" class="form-input" placeholder="自訂目標" value="' + goal + '"><span class="input-unit">ml</span></div>';
    html += '<button class="btn btn-secondary" id="water-goal-save-btn" style="width:auto;padding:0.65rem 1rem">儲存</button>';
    html += '</div>';
    html += '<button class="btn btn-danger btn-full" id="water-reset-btn" style="margin-top:0.5rem">🔄 重置今日紀錄</button>';
    html += '</div>';

    html += '</div>';
    return html;
  },

  bindCardEvents() {
    // 快速加水按鈕
    document.querySelectorAll('.water-quick-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        Water.add(parseInt(btn.dataset.ml));
        Water.refreshCard();
        Toast.show('+' + btn.dataset.ml + ' ml 💧', 'success');
      });
    });

    // 自訂加水
    var customBtn = document.getElementById('water-custom-btn');
    var customInput = document.getElementById('water-custom-input');
    if (customBtn) {
      customBtn.addEventListener('click', function() {
        var ml = parseInt(customInput.value);
        if (!ml || ml <= 0) { Toast.show('請輸入有效的毫升數', 'error'); return; }
        Water.add(ml);
        customInput.value = '';
        Water.refreshCard();
        Toast.show('+' + ml + ' ml 💧', 'success');
      });
    }
    if (customInput) {
      customInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') document.getElementById('water-custom-btn').click();
      });
    }

    // 設定面板開關
    var settingsBtn = document.getElementById('water-settings-btn');
    if (settingsBtn) {
      settingsBtn.addEventListener('click', function() {
        var panel = document.getElementById('water-settings-panel');
        panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
      });
    }

    // 目標快選
    document.querySelectorAll('.water-goal-chip').forEach(function(chip) {
      chip.addEventListener('click', function() {
        document.querySelectorAll('.water-goal-chip').forEach(function(c){ c.classList.remove('active'); });
        chip.classList.add('active');
        document.getElementById('water-goal-input').value = chip.dataset.goal;
      });
    });

    // 儲存目標
    var goalSaveBtn = document.getElementById('water-goal-save-btn');
    if (goalSaveBtn) {
      goalSaveBtn.addEventListener('click', function() {
        var val = parseInt(document.getElementById('water-goal-input').value);
        if (!val || val < 100) { Toast.show('請輸入有效的目標（最少100ml）', 'error'); return; }
        Water.setGoal(val);
        Water.refreshCard();
        Toast.show('目標已設定為 ' + val + ' ml', 'success');
      });
    }

    // 重置
    var resetBtn = document.getElementById('water-reset-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', function() {
        Water.reset();
        Water.refreshCard();
        Toast.show('今日喝水紀錄已重置', 'info');
      });
    }
  },

  refreshCard() {
    var container = document.getElementById('water-card-container');
    if (!container) return;
    container.innerHTML = Water.renderCard();
    Water.bindCardEvents();
  }
};
