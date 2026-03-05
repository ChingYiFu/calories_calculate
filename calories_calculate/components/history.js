const History = {
  selectedDate: null,

  render() {
    History.selectedDate = History.selectedDate || Utils.today();
    return `
      <div class="screen" id="screen-history">
        <div class="screen-header">
          <h2 class="screen-title">歷史紀錄</h2>
          <p class="screen-subtitle">點選日期查看當天明細</p>
        </div>
        <div class="card">
          <div class="card-title">過去 30 天</div>
          <div class="history-list" id="history-list">
            ${History.renderDayList()}
          </div>
        </div>
        <div class="card" id="history-detail-card">
          ${History.renderDetail(History.selectedDate)}
        </div>
      </div>
    `;
  },

  renderDayList() {
    const days    = Utils.last30Days();
    const profile = Storage.getProfile();
    const bmr     = profile.bmr || 0;
    const today   = Utils.today();
    let html = '';

    for (let i = 0; i < days.length; i++) {
      const d        = days[i];
      const foodLogs = Storage.getFoodLogs(d);
      const exLogs   = Storage.getExerciseLogs(d);
      const cal      = foodLogs.reduce(function(s, l) { return s + l.calories; }, 0);
      const protein  = foodLogs.reduce(function(s, l) { return s + (l.protein || 0); }, 0);
      const burn     = bmr + exLogs.reduce(function(s, l) { return s + l.calories_burned; }, 0);
      const balance  = cal - burn;
      const hasData  = foodLogs.length > 0 || exLogs.length > 0;
      const isToday  = d === today;
      const isSel    = d === History.selectedDate;

      const rowClass = 'history-row' + (isSel ? ' selected' : '') + (!hasData ? ' empty-day' : '');
      const dateStr  = d.slice(5).replace('-', '/');
      const todayBadge = isToday ? '<div class="today-badge">今天</div>' : '';

      let statsHtml = '';
      if (hasData) {
        const balClass = balance < 0 ? 'deficit' : 'surplus';
        const balIcon  = balance < 0 ? '▼' : '▲';
        statsHtml = '<div class="history-stats">'
          + '<span class="h-cal">🔥 ' + cal + '</span>'
          + '<span class="h-protein">🥩 ' + protein.toFixed(0) + 'g</span>'
          + '<span class="h-balance ' + balClass + '">' + balIcon + Math.abs(balance) + '</span>'
          + '</div>';
      } else {
        statsHtml = '<div class="history-nodata">未記錄</div>';
      }

      html += '<div class="' + rowClass + '" data-date="' + d + '">'
            + '<div class="history-date-col">'
            + '<div class="history-date">' + dateStr + '</div>'
            + todayBadge
            + '</div>'
            + statsHtml
            + '</div>';
    }
    return html;
  },

  renderDetail(date) {
    const foodLogs = Storage.getFoodLogs(date);
    const exLogs   = Storage.getExerciseLogs(date);
    const profile  = Storage.getProfile();
    const bmr      = profile.bmr || 0;
    const totalCal = foodLogs.reduce(function(s, l) { return s + l.calories; }, 0);
    const totalP   = foodLogs.reduce(function(s, l) { return s + (l.protein || 0); }, 0);
    const totalEx  = exLogs.reduce(function(s, l) { return s + l.calories_burned; }, 0);
    const balance  = totalCal - (bmr + totalEx);
    const hasAny   = foodLogs.length > 0 || exLogs.length > 0;

    let html = '<div class="detail-header">'
      + '<div class="card-title">' + Utils.formatDate(date) + ' 明細</div>';

    if (hasAny) {
      const bClass = balance < 0 ? 'green' : 'red';
      const bLabel = balance < 0 ? '赤字' : '盈餘';
      html += '<div class="detail-summary">'
        + '<span class="d-pill orange">🔥 ' + totalCal + ' kcal</span>'
        + '<span class="d-pill blue">🥩 ' + totalP.toFixed(1) + 'g</span>'
        + '<span class="d-pill ' + bClass + '">' + bLabel + ' ' + Math.abs(balance) + '</span>'
        + '</div>';
    }
    html += '</div>';

    if (foodLogs.length > 0) {
      html += '<div class="detail-section-title">🍽️ 飲食</div><div class="log-list">';
      for (let i = 0; i < foodLogs.length; i++) {
        const l = foodLogs[i];
        const aiTag = l.ai ? '<span class="ai-tag">AI</span>' : '';
        const proteinStr = l.protein ? l.protein + 'g 蛋白' : '';
        html += '<div class="log-item">'
          + '<div class="log-info">'
          + '<div class="log-name">' + l.food_name + ' ' + aiTag + '</div>'
          + '<div class="log-meta">' + proteinStr + '</div>'
          + '</div>'
          + '<div class="log-cal">' + l.calories + ' kcal</div>'
          + '</div>';
      }
      html += '</div>'
        + '<div class="log-total"><span>小計</span><span>'
        + totalCal + ' kcal · ' + totalP.toFixed(1) + 'g 蛋白</span></div>';
    }

    if (exLogs.length > 0) {
      html += '<div class="detail-section-title" style="margin-top:1rem">🏃 運動</div><div class="log-list">';
      for (let i = 0; i < exLogs.length; i++) {
        const l = exLogs[i];
        const aiTag = l.ai ? '<span class="ai-tag">AI</span>' : '';
        html += '<div class="log-item">'
          + '<div class="log-info">'
          + '<div class="log-name">' + l.exercise_type + ' ' + aiTag + '</div>'
          + '<div class="log-meta">' + l.duration_minutes + ' 分鐘</div>'
          + '</div>'
          + '<div class="log-cal" style="color:var(--teal)">−' + l.calories_burned + ' kcal</div>'
          + '</div>';
      }
      html += '</div>'
        + '<div class="log-total"><span>運動消耗</span><span>−' + totalEx + ' kcal</span></div>';
    }

    if (!hasAny) {
      html += '<div class="empty-state">這天沒有任何紀錄</div>';
    }

    return html;
  },

  bindEvents() {
    document.querySelectorAll('.history-row').forEach(function(row) {
      row.addEventListener('click', function() {
        History.selectedDate = row.dataset.date;
        document.querySelectorAll('.history-row').forEach(function(r) {
          r.classList.remove('selected');
        });
        row.classList.add('selected');
        document.getElementById('history-detail-card').innerHTML =
          History.renderDetail(History.selectedDate);
        document.getElementById('history-detail-card')
          .scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      });
    });
  }
};
