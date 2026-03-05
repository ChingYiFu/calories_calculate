const ProfileComponent = {
  render() {
    var profile  = Storage.getProfile();
    var hasKey   = AI.hasKey();
    var isMale   = profile.gender === 'male';
    var isFemale = profile.gender === 'female';

    var html = '<div class="screen" id="screen-profile">';
    html += '<div class="screen-header"><h2 class="screen-title">個人資料</h2><p class="screen-subtitle">設定體型資料以計算基礎代謝率</p></div>';

    html += '<div class="card profile-card">';
    html += '<div class="form-group"><label class="form-label">性別</label><div class="radio-group">';
    html += '<label class="radio-option' + (isMale ? ' active' : '') + '" data-value="male"><input type="radio" name="gender" value="male"' + (isMale ? ' checked' : '') + '><span class="radio-icon">♂</span><span>男性</span></label>';
    html += '<label class="radio-option' + (isFemale ? ' active' : '') + '" data-value="female"><input type="radio" name="gender" value="female"' + (isFemale ? ' checked' : '') + '><span class="radio-icon">♀</span><span>女性</span></label>';
    html += '</div></div>';

    html += '<div class="form-row">';
    html += '<div class="form-group"><label class="form-label">年齡</label><div class="input-wrap"><input type="number" id="profile-age" class="form-input" placeholder="25" value="' + (profile.age || '') + '" min="10" max="100"><span class="input-unit">歲</span></div></div>';
    html += '<div class="form-group"><label class="form-label">身高</label><div class="input-wrap"><input type="number" id="profile-height" class="form-input" placeholder="170" value="' + (profile.height_cm || '') + '" min="100" max="250"><span class="input-unit">cm</span></div></div>';
    html += '</div>';

    html += '<div class="form-group"><label class="form-label">體重</label><div class="input-wrap"><input type="number" id="profile-weight" class="form-input" placeholder="70" value="' + (profile.weight_kg || '') + '" min="30" max="300" step="0.1"><span class="input-unit">kg</span></div></div>';

    if (profile.bmr) {
      html += '<div class="bmr-display"><div class="bmr-label">基礎代謝率 (BMR)</div><div class="bmr-value">' + Math.round(profile.bmr) + ' <span class="bmr-unit">kcal/天</span></div><div class="bmr-note">這是你每天維持基本生命活動所需的熱量</div></div>';
    }

    html += '<button class="btn btn-primary btn-full" id="save-profile-btn"><span>💾</span> 儲存並計算 BMR</button>';
    html += '</div>';

    html += '<div class="card api-key-card">';
    html += '<div class="api-key-header"><div class="api-key-title"><span class="ai-badge">🤖 AI 功能</span><span class="api-key-subtitle">設定後可用 AI 估算任意食物與運動熱量</span></div>';
    if (hasKey) html += '<span class="api-status-dot">●</span>';
    html += '</div>';
    html += '<div class="form-group" style="margin-top:0.8rem"><label class="form-label">Anthropic API Key</label><div class="input-wrap"><input type="password" id="api-key-input" class="form-input" placeholder="sk-ant-api03-…" value="' + (hasKey ? 'sk-ant-••••••••••••••••••' : '') + '"></div></div>';
    html += '<div class="api-key-actions"><button class="btn btn-ai" id="save-key-btn">' + (hasKey ? '🔄 更新 Key' : '✅ 儲存 Key') + '</button>';
    if (hasKey) html += '<button class="btn btn-danger" id="remove-key-btn">🗑️ 刪除</button>';
    html += '</div>';
    html += '<div class="api-key-hint"><span>📌</span><span>Key 只存在你的手機瀏覽器，不會上傳任何地方。<br>前往 <strong>console.anthropic.com</strong> 申請 API Key。</span></div>';
    html += '</div>';

    html += '<div class="card info-card"><div class="info-title">📐 Mifflin-St Jeor 公式</div><div class="info-text"><strong>男性：</strong>BMR = 10×體重 + 6.25×身高 − 5×年齡 + 5<br><strong>女性：</strong>BMR = 10×體重 + 6.25×身高 − 5×年齡 − 161</div></div>';
    html += '</div>';
    return html;
  },

  bindEvents() {
    document.querySelectorAll('.radio-option').forEach(function(label) {
      label.addEventListener('click', function() {
        document.querySelectorAll('.radio-option').forEach(function(l){ l.classList.remove('active'); });
        label.classList.add('active');
      });
    });

    var saveBtn = document.getElementById('save-profile-btn');
    if (saveBtn) saveBtn.addEventListener('click', function(){ ProfileComponent.save(); });

    var keyBtn = document.getElementById('save-key-btn');
    if (keyBtn) keyBtn.addEventListener('click', function() {
      var val = document.getElementById('api-key-input').value.trim();
      if (!val || val.indexOf('••') !== -1) { Toast.show('請輸入有效的 API Key', 'error'); return; }
      AI.saveKey(val);
      Toast.show('API Key 已儲存 🎉', 'success');
      App.navigate('profile');
    });

    var rmBtn = document.getElementById('remove-key-btn');
    if (rmBtn) rmBtn.addEventListener('click', function() {
      localStorage.removeItem('anthropic_api_key');
      Toast.show('API Key 已刪除', 'info');
      App.navigate('profile');
    });
  },

  save() {
    var gender = document.querySelector('input[name="gender"]:checked');
    gender = gender ? gender.value : 'male';
    var age    = parseFloat(document.getElementById('profile-age').value);
    var height = parseFloat(document.getElementById('profile-height').value);
    var weight = parseFloat(document.getElementById('profile-weight').value);
    if (!age || !height || !weight) { Toast.show('請填寫完整資料', 'error'); return; }
    var bmr = gender === 'male'
      ? 10 * weight + 6.25 * height - 5 * age + 5
      : 10 * weight + 6.25 * height - 5 * age - 161;
    Storage.saveProfile({ gender: gender, age: age, height_cm: height, weight_kg: weight, bmr: bmr });
    Toast.show('BMR 已計算：' + Math.round(bmr) + ' kcal', 'success');
    App.navigate('profile');
  }
};
