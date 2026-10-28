import {test} from 'node:test';
import assert from 'node:assert/strict';
import {recommend,splitIngredients} from '../js/recipe-engine.js';
import {recipes} from '../js/recipe-data.js';
import {remoteRecipeGenerator,generateRecipes,buildGeminiPrompt,parseGeminiRecipes,GEMINI_SYSTEM_PROMPT} from '../js/ai-service.js';

const base={ingredients:['雞蛋','番茄','豆腐','牛奶','馬鈴薯'],methods:['微波爐'],servings:2,time:15,flavor:'家常',excluded:[]};

test('32道完整且唯一食譜',()=>{assert.ok(recipes.length>=30);assert.equal(new Set(recipes.map(r=>r.id)).size,recipes.length);for(const r of recipes){assert.ok(r.steps.length>=4);assert.ok(r.ingredients.length);assert.ok(r.tips)}});
test('微波限制及時間為硬性篩選',()=>{const r=recommend(base);assert.ok(r.length);assert.ok(r.every(x=>x.methods.every(m=>m==='微波爐')&&x.cookingTime<=15))});
test('排除奶類包含起司，排除蛋不會被分數抵銷',()=>{const r=recommend({...base,excluded:['牛奶','蛋']});assert.ok(r.every(x=>x.ingredients.every(i=>!['牛奶','起司','奶油','雞蛋'].includes(i.name))))});
test('空食材與空方式無結果',()=>{assert.deepEqual(recommend({...base,ingredients:[]}),[]);assert.deepEqual(recommend({...base,methods:[]}),[])});
test('分隔符、重複與別名',()=>assert.deepEqual(splitIngredients('蛋、蕃茄，雞蛋\n豆腐'),['雞蛋','番茄','豆腐']));
test('食材改變結果，缺少清單與份數存在',()=>{const a=recommend({...base,ingredients:['雞蛋']});const b=recommend({...base,ingredients:['豆腐']});assert.notEqual(a[0].id,b[0].id);assert.ok(a.every(r=>r.available.length+r.missing.length===r.ingredients.length&&r.requestedServings===2))});
test('遠端接口禁止網路呼叫',async()=>assert.rejects(remoteRecipeGenerator,/未實作/));

test('Gemini Prompt 嚴格要求真實合理不可天馬行空',()=>{
  assert.ok(GEMINI_SYSTEM_PROMPT.includes('真實合理'));
  assert.ok(GEMINI_SYSTEM_PROMPT.includes('絕對不可天馬行空'));
  const prompt=buildGeminiPrompt({...base,excluded:['蝦子']});
  assert.ok(prompt.includes('雞蛋、番茄'));
  assert.ok(prompt.includes('微波爐'));
  assert.ok(prompt.includes('蝦子'));
});

test('Gemini 回傳食譜解析與食材比對',()=>{
  const mockGeminiJson=`[
    {
      "name":"微波番茄豆腐嫩蛋",
      "emoji":"🍲",
      "cookingTime":12,
      "servings":2,
      "methods":["微波爐"],
      "flavor":["家常"],
      "ingredients":[
        {"name":"雞蛋","amount":2,"unit":"顆"},
        {"name":"番茄","amount":1,"unit":"顆"},
        {"name":"豆腐","amount":0.5,"unit":"盒"},
        {"name":"醬油","amount":1,"unit":"茶匙"}
      ],
      "steps":[
        "番茄切小塊，豆腐切丁放入微波專用碗。",
        "打入雞蛋攪拌均勻，加入少許溫水及醬油。",
        "蓋上透氣微波蓋，以中火分次微波約3-4分鐘。",
        "取出確認中心完全凝固熟透即可盛盤。"
      ],
      "tips":"番茄酸甜能提升蛋香味，微波需分次加熱以保持滑嫩口感。",
      "allergenNote":"本道含有蛋豆類製品，過敏者請留意。"
    }
  ]`;
  const result=parseGeminiRecipes(mockGeminiJson,base);
  assert.equal(result.length,1);
  const r=result[0];
  assert.equal(r.name,'微波番茄豆腐嫩蛋');
  assert.equal(r.isAI,true);
  assert.equal(r.methods[0],'微波爐');
  assert.ok(r.available.some(i=>i.name==='雞蛋'));
  assert.ok(r.missing.some(i=>i.name==='醬油'));
  assert.ok(r.steps.length>=4);
});

test('未設定 API Key 時平滑備援至本地食譜推薦',async()=>{
  const res=await generateRecipes(base);
  assert.ok(res.length>0);
  assert.ok(res.every(r=>!r.isAI));
});
