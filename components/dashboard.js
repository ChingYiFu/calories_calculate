const Dashboard = {
  chart: null,

  render() {
    var profile  = Storage.getProfile();
    var today    = Utils.today();
    var foodLogs = Storage.getFoodLogs(today);
    var exLogs   = Storage.getExerciseLogs(today);

    var bmr        = profile.bmr ? Math.round(profile.bmr) : 0;
    var foodCal    = foodLogs.reduce(function(s,l){ return s + l.calories; }, 0);
    var protein    = foodLogs.reduce(function(s,l){ return s + (l.protein || 0); }, 0);
    var exCal      = exLogs.reduce(function(s,l){ return s + l.calories_burned; }, 0);
    var total_burn = bmr + exCal;
    var balance    = foodCal - total_burn;
    var isDeficit  = balance < 0;
    var pct        = total_burn > 0 ? Math.min(100, Math.round((foodCal / total_burn) * 100)) : 0;
    var proteinGoal = profile.weight_kg ? Math.round(profile.weight_kg * 1.6) : 0;
    var proteinPct  = proteinGoal > 0 ? Math.min(100, Math.round((protein / proteinGoal) * 100)) : 0;

    var html = '<div class="screen" id="screen-dashboard">';
    html += '<div class="screen-header">';
    html += '<h2 class="screen-title">今日總覽</h2>';
    html += '<p class="screen-subtitle">' + Utils.formatDate(today) + (profile.weight_kg ? ' · ' + profile.weight_kg + ' kg' : '') + '</p>';
    html += '</div>';

    if (!profile.bmr) {
      html += '<div class="alert-card"><span>⚠️</span><div><strong>尚未設定個人資料</strong><br><small>請前往「個人資料」設定身高體重</small></div></div>';
    }

    html += '<div class="stat-grid">';
    html += '<div class="stat-card stat-bmr"><div class="stat-icon">🔥</div><div class="stat-value">' + bmr + '</div><div class="stat-label">基礎代謝 kcal</div></div>';
    html += '<div class="stat-card stat-exercise"><div class="stat-icon">⚡</div><div class="stat-value">' + exCal + '</div><div class="stat-label">運動消耗 kcal</div></div>';
    html += '<div class="stat-card stat-food"><div class="stat-icon">🍽️</div><div class="stat-value">' + foodCal + '</div><div class="stat-label">今日攝取 kcal</div></div>';
    var balClass = isDeficit ? 'stat-deficit' : 'stat-surplus';
    var balIcon  = isDeficit ? '📉' : '📈';
    var balLabel = isDeficit ? '熱量赤字 kcal' : '熱量盈餘 kcal';
    html += '<div class="stat-card ' + balClass + '"><div class="stat-icon">' + balIcon + '</div><div class="stat-value">' + (isDeficit ? '' : '+') + balance + '</div><div class="stat-label">' + balLabel + '</div></div>';
    html += '</div>';

    var fillClass = isDeficit ? 'fill-good' : 'fill-bad';
    var pctClass  = isDeficit ? 'pct-good' : 'pct-bad';
    html += '<div class="card balance-card">';
    html += '<div class="balance-header"><span class="balance-title">熱量進出比</span><span class="balance-pct ' + pctClass + '">' + pct + '%</span></div>';
    html += '<div class="progress-bar"><div class="progress-fill ' + fillClass + '" style="width:' + pct + '%"></div></div>';
    html += '<div class="progress-labels"><span>攝取 ' + foodCal + ' kcal</span><span>目標 ' + total_burn + ' kcal</span></div>';
    html += isDeficit
      ? '<div class="deficit-tag">🎯 赤字 ' + Math.abs(balance) + ' kcal — 很棒！繼續保持</div>'
      : '<div class="surplus-tag">💡 盈餘 ' + balance + ' kcal — 可以增加運動或減少飲食</div>';
    html += '</div>';

    if (proteinGoal > 0) {
      var pProtClass = proteinPct >= 100 ? 'pct-good' : '';
      html += '<div class="card balance-card">';
      html += '<div class="balance-header"><span class="balance-title">🥩 蛋白質進度</span><span class="balance-pct ' + pProtClass + '">' + proteinPct + '%</span></div>';
      html += '<div class="progress-bar"><div class="progress-fill fill-protein" style="width:' + proteinPct + '%"></div></div>';
      html += '<div class="progress-labels"><span>已攝取 ' + protein.toFixed(1) + ' g</span><span>目標 ' + proteinGoal + ' g</span></div>';
      html += proteinPct >= 100
        ? '<div class="deficit-tag">💪 蛋白質達標！</div>'
        : '<div class="surplus-tag" style="color:var(--teal)">還差 ' + (proteinGoal - protein).toFixed(1) + ' g 蛋白質</div>';
      html += '</div>';
    }

    // 喝水卡片
    html += '<div id="water-card-container">' + Water.renderCard() + '</div>';

    html += '<div class="card chart-card"><div class="card-title">近 7 日熱量趨勢</div><div class="chart-wrap"><canvas id="trend-chart"></canvas></div></div>';

    html += '<div class="quick-actions">';
    html += '<button class="quick-btn" onclick="App.navigate(\'food\')"><span class="quick-icon">🍽️</span>記錄飲食</button>';
    html += '<button class="quick-btn" onclick="App.navigate(\'exercise\')"><span class="quick-icon">🏃</span>記錄運動</button>';
    html += '<button class="quick-btn" onclick="App.navigate(\'history\')"><span class="quick-icon">📅</span>歷史紀錄</button>';
    html += '</div>';
    html += '</div>';
    return html;
  },

  afterRender() {
    Water.bindCardEvents();
    Dashboard.renderChart();
  },

  renderChart() {
    var ctx = document.getElementById('trend-chart');
    if (!ctx) return;
    if (Dashboard.chart) { Dashboard.chart.destroy(); }

    var profile     = Storage.getProfile();
    var bmr         = profile.bmr || 0;
    var days        = Utils.last7Days();
    var labels      = days.map(function(d){ return d.slice(5); });
    var foodData    = days.map(function(d){ return Storage.getFoodLogs(d).reduce(function(s,l){ return s+l.calories; },0); });
    var burnData    = days.map(function(d){
      var ex = Storage.getExerciseLogs(d).reduce(function(s,l){ return s+l.calories_burned; },0);
      return Math.round(bmr + ex);
    });
    var proteinData = days.map(function(d){ return Storage.getFoodLogs(d).reduce(function(s,l){ return s+(l.protein||0); },0); });

    Dashboard.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          { label: '攝取熱量', data: foodData, borderColor: '#FF6B35', backgroundColor: 'rgba(255,107,53,0.12)', tension: 0.4, fill: true, pointRadius: 4, pointBackgroundColor: '#FF6B35', borderWidth: 2.5, yAxisID: 'y' },
          { label: '消耗目標', data: burnData, borderColor: '#4ECDC4', backgroundColor: 'rgba(78,205,196,0.08)', tension: 0.4, fill: true, pointRadius: 4, pointBackgroundColor: '#4ECDC4', borderWidth: 2.5, borderDash: [5,3], yAxisID: 'y' },
          { label: '蛋白質(g)', data: proteinData, borderColor: '#60a5fa', backgroundColor: 'rgba(96,165,250,0.08)', tension: 0.4, fill: false, pointRadius: 4, pointBackgroundColor: '#60a5fa', borderWidth: 2, borderDash: [3,3], yAxisID: 'y2' }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { labels: { color: '#c9d1d9', font: { size: 11 }, boxWidth: 14, padding: 12 } },
          tooltip: { backgroundColor: '#1e2a3a', titleColor: '#e6edf3', bodyColor: '#c9d1d9' }
        },
        scales: {
          x:  { ticks: { color: '#8b949e', font: { size: 11 } }, grid: { color: 'rgba(139,148,158,0.15)' } },
          y:  { ticks: { color: '#8b949e', font: { size: 11 } }, grid: { color: 'rgba(139,148,158,0.15)' }, position: 'left' },
          y2: { ticks: { color: '#60a5fa', font: { size: 10 } }, grid: { display: false }, position: 'right' }
        }
      }
    });
  }
};
