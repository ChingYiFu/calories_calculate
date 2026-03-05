const ExerciseLogger = {
  selectedExercise: null,
  duration: 30,

  render() {
    var today  = Utils.today();
    var logs   = Storage.getExerciseLogs(today);
    var total  = logs.reduce(function(s,l){ return s+l.calories_burned; }, 0);
    var hasKey = AI.hasKey();

    var html = '<div class="screen" id="screen-exercise">';
    html += '<div class="screen-header">';
    html += '<h2 class="screen-title">運動記錄</h2>';
    html += '<p class="screen-subtitle">' + Utils.formatDate(today) + '　今日消耗 <strong>' + total + '</strong> kcal</p>';
    html += '</div>';

    if (hasKey) {
      html += '<div class="card ai-card">';
      html += '<div class="ai-card-header"><span class="ai-badge">🤖 AI 估算</span><span class="ai-hint">描述你做的運動，Claude 幫你算</span></div>';
      html += '<div class="ai-input-row"><input type="text" id="ai-ex-input" class="form-input" placeholder="例如：游泳30分鐘、騎腳踏車上班20分鐘…"></div>';
      html += '<button class="btn btn-ai btn-full" id="ai-ex-btn"><span id="ai-ex-btn-text">✨ AI 幫我估算消耗</span></button>';
      html += '<div class="ai-result" id="ai-ex-result" style="display:none"></div>';
      html += '</div>';
    } else {
      html += '<div class="card ai-locked-card" onclick="App.navigate(\'profile\')">';
      html += '<span class="ai-lock-icon">🤖</span>';
      html += '<div class="ai-lock-text"><strong>想用 AI 估算任意運動？</strong><br><small>前往個人資料設定 API Key</small></div>';
      html += '<span class="ai-lock-arrow">›</span></div>';
    }

    html += '<div class="card"><div class="card-title">快速選擇</div><div class="exercise-grid" id="exercise-grid">';
    for (var i = 0; i < EXERCISE_DATABASE.length; i++) {
      var e = EXERCISE_DATABASE[i];
      html += '<div class="exercise-chip" data-index="' + i + '">';
      html += '<div class="exercise-icon">' + e.icon + '</div>';
      html += '<div class="exercise-name">' + e.type + '</div>';
      html += '<div class="exercise-rate">' + e.kcalPerMin + ' kcal/分</div>';
      html += '</div>';
    }
    html += '</div>';
    html += '<div class="selected-exercise-panel" id="selected-exercise-panel" style="display:none">';
    html += '<div class="selected-exercise-name" id="selected-exercise-name">—</div>';
    html += '<div class="form-group" style="margin-top:1rem"><label class="form-label">運動時間</label>';
    html += '<div class="duration-row"><button class="qty-btn" id="dur-minus">−</button><div class="qty-display"><span id="dur-value">30</span><span class="qty-unit">分鐘</span></div><button class="qty-btn" id="dur-plus">＋</button></div></div>';
    html += '<div class="cal-preview" id="ex-cal-preview">0 kcal</div>';
    html += '<button class="btn btn-primary btn-full" id="add-exercise-btn">＋ 加入今日記錄</button>';
    html += '</div></div>';

    html += '<div class="card"><div class="card-title">今日運動明細</div>';
    if (logs.length === 0) {
      html += '<div class="empty-state">尚未記錄運動 🏃</div>';
    } else {
      html += '<div class="log-list">';
      for (var j = 0; j < logs.length; j++) {
        var l = logs[j];
        var aiTag = l.ai ? '<span class="ai-tag">AI</span>' : '';
        html += '<div class="log-item">';
        html += '<div class="log-info"><div class="log-name">' + l.exercise_type + ' ' + aiTag + '</div><div class="log-meta">' + l.duration_minutes + ' 分鐘</div></div>';
        html += '<div class="log-cal" style="color:var(--teal)">−' + l.calories_burned + ' kcal</div>';
        html += '<button class="delete-btn" data-type="exercise" data-index="' + j + '">✕</button>';
        html += '</div>';
      }
      html += '</div><div class="log-total"><span>總消耗</span><span>−' + total + ' kcal</span></div>';
    }
    html += '</div></div>';
    return html;
  },

  bindEvents() {
    ExerciseLogger.selectedExercise = null;
    ExerciseLogger.duration = 30;

    var aiBtn   = document.getElementById('ai-ex-btn');
    var aiInput = document.getElementById('ai-ex-input');
    if (aiBtn)   aiBtn.addEventListener('click', function(){ ExerciseLogger.aiEstimate(); });
    if (aiInput) aiInput.addEventListener('keydown', function(e){ if (e.key === 'Enter') ExerciseLogger.aiEstimate(); });

    document.querySelectorAll('.exercise-chip').forEach(function(chip) {
      chip.addEventListener('click', function() {
        document.querySelectorAll('.exercise-chip').forEach(function(c){ c.classList.remove('active'); });
        chip.classList.add('active');
        ExerciseLogger.selectedExercise = EXERCISE_DATABASE[parseInt(chip.dataset.index)];
        ExerciseLogger.duration = 30;
        ExerciseLogger.updatePanel();
      });
    });

    var dm = document.getElementById('dur-minus');
    var dp = document.getElementById('dur-plus');
    if (dm) dm.addEventListener('click', function(){ if (ExerciseLogger.duration > 5) { ExerciseLogger.duration -= 5; ExerciseLogger.updatePanel(); } });
    if (dp) dp.addEventListener('click', function(){ ExerciseLogger.duration += 5; ExerciseLogger.updatePanel(); });

    var addBtn = document.getElementById('add-exercise-btn');
    if (addBtn) addBtn.addEventListener('click', function(){ ExerciseLogger.addExercise(); });

    document.querySelectorAll('.delete-btn[data-type="exercise"]').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var logs = Storage.getExerciseLogs(Utils.today());
        logs.splice(parseInt(btn.dataset.index), 1);
        Storage.saveExerciseLogs(Utils.today(), logs);
        Toast.show('已刪除', 'info');
        App.navigate('exercise');
      });
    });
  },

  aiEstimate: async function() {
    var input = document.getElementById('ai-ex-input');
    var desc = input ? input.value.trim() : '';
    if (!desc) { Toast.show('請描述你做的運動', 'error'); return; }
    var btn = document.getElementById('ai-ex-btn-text');
    var resultDiv = document.getElementById('ai-ex-result');
    btn.textContent = '⏳ AI 計算中…';
    document.getElementById('ai-ex-btn').disabled = true;
    resultDiv.style.display = 'none';
    try {
      var result = await AI.estimateExercise(desc);
      resultDiv.style.display = 'block';
      resultDiv.innerHTML = '<div class="ai-result-inner">'
        + '<div class="ai-result-food">' + result.exercise_type + '</div>'
        + '<div class="ai-result-cal">−' + result.calories_burned + ' <span>kcal</span></div>'
        + '<div class="ai-result-note">' + result.note + '</div>'
        + '<button class="btn btn-primary btn-full" id="ai-add-ex-btn">＋ 加入今日記錄</button>'
        + '</div>';
      document.getElementById('ai-add-ex-btn').addEventListener('click', function() {
        Storage.addExerciseLog({ date: Utils.today(), exercise_type: result.exercise_type, duration_minutes: result.duration_minutes || 0, calories_burned: result.calories_burned, ai: true });
        Toast.show(result.exercise_type + ' 消耗 ' + result.calories_burned + ' kcal', 'success');
        App.navigate('exercise');
      });
    } catch(e) {
      if (e.message === 'NO_KEY') Toast.show('請先在個人資料設定 API Key', 'error');
      else if (e.message === 'INVALID_KEY') Toast.show('API Key 無效', 'error');
      else Toast.show('估算失敗：' + e.message, 'error');
    } finally {
      btn.textContent = '✨ AI 幫我估算消耗';
      document.getElementById('ai-ex-btn').disabled = false;
    }
  },

  updatePanel() {
    var e = ExerciseLogger.selectedExercise;
    if (!e) return;
    document.getElementById('selected-exercise-panel').style.display = 'block';
    document.getElementById('selected-exercise-name').textContent = e.type;
    document.getElementById('dur-value').textContent = ExerciseLogger.duration;
    document.getElementById('ex-cal-preview').textContent = '預估消耗 ' + Math.round(e.kcalPerMin * ExerciseLogger.duration) + ' kcal';
  },

  addExercise() {
    var e = ExerciseLogger.selectedExercise;
    if (!e) { Toast.show('請先選擇運動類型', 'error'); return; }
    var entry = { date: Utils.today(), exercise_type: e.type, duration_minutes: ExerciseLogger.duration, calories_burned: Math.round(e.kcalPerMin * ExerciseLogger.duration) };
    Storage.addExerciseLog(entry);
    Toast.show(e.type + ' ' + entry.duration_minutes + '分鐘，消耗 ' + entry.calories_burned + ' kcal', 'success');
    App.navigate('exercise');
  }
};
