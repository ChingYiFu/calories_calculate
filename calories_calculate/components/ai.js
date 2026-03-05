const AI = {
  getKey()      { return localStorage.getItem('anthropic_api_key') || ''; },
  saveKey(key)  { localStorage.setItem('anthropic_api_key', key.trim()); },
  hasKey()      { return !!AI.getKey(); },

  async estimateFood(foodDescription) {
    const key = AI.getKey();
    if (!key) throw new Error('NO_KEY');
    const prompt = `你是一位營養師。使用者描述了他吃的食物，請估算熱量與蛋白質。

食物描述：「${foodDescription}」

請用以下 JSON 格式回答，只回 JSON，不要其他文字：
{
  "food_name": "食物名稱（簡潔）",
  "calories": 數字（整數kcal）,
  "protein": 數字（公克，保留一位小數）,
  "note": "簡短說明（一句話）"
}`;
    return await AI._call(key, prompt);
  },

  async estimateExercise(exerciseDescription) {
    const key = AI.getKey();
    if (!key) throw new Error('NO_KEY');
    const prompt = `你是一位健身教練。使用者描述了他做的運動，請估算消耗熱量。

運動描述：「${exerciseDescription}」

請用以下 JSON 格式回答，只回 JSON，不要其他文字：
{
  "exercise_type": "運動名稱（簡潔）",
  "duration_minutes": 數字（分鐘整數）,
  "calories_burned": 數字（整數kcal）,
  "note": "簡短說明（一句話）"
}`;
    return await AI._call(key, prompt);
  },

  async _call(apiKey, prompt) {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 256,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      if (response.status === 401) throw new Error('INVALID_KEY');
      throw new Error(err.error?.message || `API 錯誤 ${response.status}`);
    }

    const data = await response.json();
    const text = data.content?.[0]?.text || '';
    const clean = text.replace(/```json|```/g, '').trim();
    return JSON.parse(clean);
  }
};
