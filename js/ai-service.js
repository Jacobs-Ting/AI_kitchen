import {recommend,normalize} from './recipe-engine.js';

export const CONFIG={
  useMockAI:true,
  model:'gemini-3.5-flash',
  fallbackModels:['gemini-2.5-flash','gemini-1.5-flash'],
  apiEndpoint:'https://generativelanguage.googleapis.com/v1beta/models'
};

export const GEMINI_SYSTEM_PROMPT=`你是一位專業、講究食安與烹飪實務的星級主廚與家庭料理顧問。
你的任務是根據使用者冰箱現有的食材與廚房設備，設計出「合理、真實、美味且家庭易於烹調」的日常佳餚。

【最重要守則：料理必須真實合理，絕對不可天馬行空】
1. 真實合理性（絕非天馬行空）：
   - 推薦的料理必須是真實世界中合理、符合大眾常理與味覺邏輯的美味家庭或餐廳料理（例如：洋蔥炒牛肉、番茄炒蛋、蒜香時蔬、微波起司馬鈴薯、香菇雞湯、白菜燉豆腐等）。
   - 絕對嚴禁發明荒謬、怪誕、反胃、奇葩混搭或難以下嚥的黑暗料理（絕對禁止：草莓炒牛肉、西瓜排骨湯、香蕉煎蛋、可樂豆腐湯、巧克力炒青菜等荒謬搭配）。
   - 調味與食材搭配必須符合傳統料理邏輯（鹹香、醬燒、清蒸、酸甜、清炒等經典調味）。

2. 嚴格遵守烹飪方式限制：
   - 使用者選擇了哪些設備/料理方式，生成的食譜就「只能使用」這些設備！
   - 例如：若使用者「只選擇微波爐」，食譜就必須完全使用微波爐完成，不可出現鍋炒或油炸步驟。
   - 若使用者「只選擇電鍋」，食譜就必須以電鍋蒸煮完成。
   - 若使用者選擇了「快炒」，步驟應為鍋鏟快炒。

3. 嚴格遵守時間限制：
   - 若使用者指定完成時間（例如 15 分鐘以內），料理步驟必須簡潔迅速，不可安排需要長時間燉煮或長時間烘烤的菜色。

4. 嚴格排除食材與過敏原：
   - 絕對不可使用使用者列入排除或過敏的食材及其衍生製品。

5. 優先使用冰箱食材，缺料最少化：
   - 必須以使用者冰箱有的食材為主角。
   - 缺少的食材（missing）僅限家庭常見基本調味料或極易取得的輔料（如：鹽、醬油、蒜、蔥、薑、胡椒等），缺少項目盡量不超過 2~3 種。

6. 份量精準與步驟清晰：
   - 食材份量須精準符合使用者的用餐人數。
   - 料理步驟須至少 4 步，條理分明、由生到熟、包含火候或時間、熟度確認與食安提醒。
   - 語言一律使用繁體中文（台灣慣用語）。`;

export function buildGeminiPrompt(p){
  return `請根據以下條件，為我推薦 2 到 3 道合情合理、美味、家庭可實際操作的美味食譜：

【冰箱現有食材】：${p.ingredients?.length?p.ingredients.join('、'):'（未指定，請使用常見新鮮食材）'}
【指定料理方式】：${p.methods?.length?p.methods.join('、'):'快炒、燉煮'}
【用餐人數】：${p.servings||2} 人份
【料理時間限制】：${p.time?p.time+' 分鐘以內':'不限時間'}
【口味偏好】：${p.flavor||'家常'}
【排除食材/過敏原】：${p.excluded?.length?p.excluded.join('、'):'無'}

請以 JSON 陣列格式輸出（嚴禁任何 Markdown 代碼區塊外的多餘文字），格式必須嚴格符合以下結構：
[
  {
    "name": "料理名稱（如：蔥香番茄炒蛋）",
    "emoji": "適當料理Emoji（如 🍳, 🍲, 🥘, 🥣, 🍚, 🥟）",
    "cookingTime": 烹調分鐘數（數字，須在時間限制內）,
    "servings": ${p.servings||2},
    "methods": ["料理方式（必須完全包含在指定料理方式中）"],
    "flavor": ["口味偏好（如：${p.flavor||'家常'}）"],
    "ingredients": [
      { "name": "食材名稱", "amount": 數量數字, "unit": "單位（如 顆/克/湯匙/茶匙/片）" }
    ],
    "steps": [
      "步驟1：食材洗切與前處理準備...",
      "步驟2：熱鍋或設備加熱下料程序...",
      "步驟3：調味與關鍵烹煮熟度確認...",
      "步驟4：起鍋裝盤與上菜完成..."
    ],
    "tips": "主廚貼心提醒與烹調關鍵秘訣",
    "allergenNote": "過敏原與食安衛生提醒（如中心溫度需達標、生熟分開等）"
  }
]`;
}

function cleanJsonResponse(text){
  let s=String(text||'').trim();
  if(s.startsWith('```json'))s=s.replace(/^```json\s*/i,'').replace(/\s*```$/,'');
  else if(s.startsWith('```'))s=s.replace(/^```\s*/,'').replace(/\s*```$/,'');
  const start=s.indexOf('[');
  const end=s.lastIndexOf(']');
  if(start!==-1&&end!==-1&&end>start)return s.slice(start,end+1);
  return s;
}

export function parseGeminiRecipes(rawText,preferences){
  const cleaned=cleanJsonResponse(rawText);
  let parsed;
  try{
    parsed=JSON.parse(cleaned);
  }catch(err){
    throw new Error('Gemini API 回傳格式解析失敗：'+err.message);
  }
  const items=Array.isArray(parsed)?parsed:Array.isArray(parsed?.recipes)?parsed.recipes:[];
  if(!items.length)throw new Error('Gemini API 未回傳有效的食譜陣列');

  const have=new Set((preferences.ingredients||[]).map(normalize));
  const excludedSet=new Set((preferences.excluded||[]).map(normalize));

  return items.map((r,idx)=>{
    const rawIngs=Array.isArray(r.ingredients)?r.ingredients:[];
    const ingredients=rawIngs.map(i=>({
      name:String(i.name||'').trim(),
      amount:Number(i.amount)||1,
      unit:String(i.unit||'份').trim()
    })).filter(i=>i.name&&!excludedSet.has(normalize(i.name)));

    const available=ingredients.filter(i=>have.has(normalize(i.name))||[...have].some(h=>i.name.includes(h)||h.includes(i.name)));
    const missing=ingredients.filter(i=>!available.includes(i));
    const match=ingredients.length?(available.length/ingredients.length):0;

    const chosenMethods=Array.isArray(r.methods)&&r.methods.length
      ?r.methods.filter(m=>(preferences.methods||[]).includes(m))
      :[];
    const methods=chosenMethods.length?chosenMethods:[(preferences.methods&&preferences.methods[0])||'快炒'];

    const rawSteps=Array.isArray(r.steps)?r.steps:[];
    const steps=rawSteps.map(s=>String(s).trim()).filter(Boolean);
    if(steps.length<4)steps.push('確認食材熟透後盛盤享用。');

    return {
      id:`gemini_${Date.now()}_${idx+1}`,
      name:String(r.name||'主廚特製創意料理').trim(),
      emoji:String(r.emoji||'🍳').trim(),
      cookingTime:Number(r.cookingTime)||preferences.time||15,
      servings:preferences.servings||2,
      requestedServings:preferences.servings||2,
      methods,
      flavor:Array.isArray(r.flavor)?r.flavor:[preferences.flavor||'家常'],
      ingredients,
      available,
      missing,
      match,
      score:Math.round((match*40+30+20)*10)/10,
      steps,
      tips:String(r.tips||'請依實際火力與食材大小調整時間，生熟器具分開確保衛生。').trim(),
      allergenNote:String(r.allergenNote||'請自行留意食材包裝成分與潛在過敏原資訊。').trim(),
      isAI:true,
      modelName:'Gemini 3.5 Flash'
    };
  });
}

export async function callGeminiApi(prompt,apiKey,modelName='gemini-3.5-flash'){
  const modelsToTry=[modelName,...CONFIG.fallbackModels.filter(m=>m!==modelName)];
  let lastError=null;

  for(const model of modelsToTry){
    try{
      const url=`${CONFIG.apiEndpoint}/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
      const res=await fetch(url,{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
          contents:[{role:'user',parts:[{text:prompt}]}],
          systemInstruction:{parts:[{text:GEMINI_SYSTEM_PROMPT}]},
          generationConfig:{
            responseMimeType:'application/json',
            temperature:0.3
          }
        })
      });

      if(res.status===404){
        lastError=new Error(`模型 ${model} 在目前的 API 端點不可用 (404)`);
        continue;
      }

      if(!res.ok){
        const errJson=await res.json().catch(()=>({}));
        const msg=errJson.error?.message||`HTTP ${res.status} ${res.statusText}`;
        if(res.status===400||res.status===401||res.status===403){
          throw new Error(`Gemini API Key 無效或權限不足（${msg}），請檢查 API Key 設定。`);
        }
        if(res.status===429){
          throw new Error(`Gemini API 請求配額已滿或超出速率限制（${msg}），請稍候再試。`);
        }
        throw new Error(`Gemini API 呼叫失敗（${msg}）`);
      }

      const data=await res.json();
      const text=data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if(!text)throw new Error('Gemini API 未回傳有效文字內容');
      return {text,model};
    }catch(err){
      lastError=err;
      if(!err.message.includes('404'))throw err;
    }
  }

  throw lastError||new Error('所有 Gemini 模型連線嘗試皆失敗');
}

export async function mockRecipeGenerator(preferences){
  return recommend(preferences);
}

export async function remoteRecipeGenerator(preferences,apiKey){
  const key=apiKey||(preferences&&preferences.apiKey)||CONFIG.apiKey;
  if(!key){
    throw new Error('未提供 API Key，遠端 AI 服務未實作直接無金鑰呼叫。請先輸入 Gemini API Key。');
  }
  const prompt=buildGeminiPrompt(preferences);
  const {text}=await callGeminiApi(prompt,key,CONFIG.model);
  const recipes=parseGeminiRecipes(text,preferences);
  if(!recipes.length)throw new Error('Gemini 未能生成合適的食譜，請調整食材或條件後重試。');
  return recipes;
}

export async function generateRecipes(preferences,apiKey){
  const key=apiKey||(preferences&&preferences.apiKey)||CONFIG.apiKey;
  if(key)return remoteRecipeGenerator(preferences,key);
  return mockRecipeGenerator(preferences);
}
