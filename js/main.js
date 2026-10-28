import {load,save} from './storage.js';
import {splitIngredients,normalize} from './recipe-engine.js';
import {generateRecipes} from './ai-service.js';
import {recipes} from './recipe-data.js';
import {escapeHTML as e,toast,methods,common,heading} from './ui.js';

const state=load(),panel=document.querySelector('#panel');
const recipeDialog=document.querySelector('#recipe-dialog');
const apiDialog=document.querySelector('#api-dialog');
let kitchen=null,station='ingredients',results=[],busy=false;

const system=matchMedia('(prefers-reduced-motion: reduce)');
const reduced=()=>state.reduced||system.matches;

function updateApiStatusUI(){
  const badge=document.querySelector('#api-badge');
  const btn=document.querySelector('#api-btn');
  const modeEl=document.querySelector('.mode');
  if(badge)badge.textContent=state.apiKey?'Gemini 3.5 Flash':'設定 API Key';
  if(btn)btn.classList.toggle('connected',Boolean(state.apiKey));
  if(modeEl&&!busy)modeEl.textContent=state.apiKey?'✦ Gemini 3.5 Flash 模式':'✦ 模擬推薦模式';
}

function persist(){
  if(!save(state))toast('瀏覽器無法儲存，設定仍可在本次使用。');
  document.querySelector('#favorite-count').textContent=state.favorites.length;
  updateApiStatusUI();
}

document.querySelector('#reduced').checked=state.reduced;
function motion(){document.body.classList.toggle('reduce-motion',reduced())}
motion();
system.addEventListener('change',motion);
document.querySelector('#reduced').onchange=ev=>{state.reduced=ev.target.checked;motion();persist()};

function show(id,scroll=false){
  if(busy){toast('小熊廚師正在找食譜，請稍候。');return}
  station=id;
  document.querySelectorAll('[data-station]').forEach(b=>b.classList.toggle('active',b.dataset.station===id));
  kitchen?.focus(id);
  render();
  if(scroll&&innerWidth<700)document.querySelector('aside').scrollIntoView({behavior:reduced()?'instant':'smooth',block:'start'});
}

document.querySelectorAll('[data-station]').forEach(b=>b.onclick=()=>show(b.dataset.station,true));
document.querySelector('#reset-camera').onclick=()=>kitchen?.focus('home');

const button=(text,action,cls='primary')=>`<button class="${cls}" data-action="${action}">${text}</button>`;

function findRecipe(id){
  return results.find(r=>r.id===id)||state.customRecipes?.find(r=>r.id===id)||recipes.find(r=>r.id===id);
}

function render(){
  updateApiStatusUI();
  if(station==='ingredients'){
    panel.innerHTML=heading('01 / A LITTLE FRESH START','🧊 冰箱裡有什麼？','打開冰箱，挑選手邊的食材。<br>美味的靈感，就從這裡開始。')+
      `<div class="selection-box"><div class="selection-head"><span>我的食材 · ${state.ingredients.length} 種</span>${button('清空食材','clear','text-btn')}</div><div class="chips">${state.ingredients.length?state.ingredients.map(x=>`<span class="tag">${e(x)}<button data-remove="${e(x)}" aria-label="移除${e(x)}">×</button></span>`).join(''):'<span class="empty">還沒有食材，選幾樣試試看吧！</span>'}</div></div><label class="section-label" for="ingredient-input">✎ 輸入冰箱裡的食材</label><textarea id="ingredient-input" placeholder="例如：雞蛋、番茄、洋蔥&#10;可以用逗號、頓號或換行分隔" maxlength="500"></textarea>${button('＋ 加入食材','add','chip')}<div class="section-label">或是，點選常見食材</div><div class="chips">${common.map(x=>`<button class="chip ${state.ingredients.includes(x)?'selected':''}" data-food="${x}">${x}</button>`).join('')}</div>${button('確認食材，下一步 →','confirm-food')}<p class="note">✦ 設定會自動保存在這台裝置上</p>`;
  }else if(station==='methods'){
    panel.innerHTML=heading('02 / YOUR WAY TO COOK','🍲 今天想怎麼料理？','選擇家裡能使用的方式，可以複選。<br>小熊只會推薦你能完成的料理。')+
      `<div class="method-grid">${methods.map(([m,icon])=>`<button class="${state.methods.includes(m)?'selected':''}" data-method="${m}" aria-pressed="${state.methods.includes(m)}"><b>${icon}</b>${m}</button>`).join('')}</div>${button('確認方式，下一步 →','confirm-methods')}`;
  }else if(station==='settings'){
    panel.innerHTML=heading('03 / MAKE IT YOURS','🥕 準備今天的料理','每個人的美味，都有一點不一樣。')+
      `<div class="field"><label for="servings">用餐人數</label><select id="servings">${[1,2,3,4,5].map(n=>`<option value="${n}" ${state.servings===n?'selected':''}>${n===5?'5人以上（先以5人計算）':n+'人'}</option>`).join('')}</select></div><div class="field"><label for="time">希望完成時間</label><select id="time">${[15,30,60,0].map(n=>`<option value="${n}" ${state.time===n?'selected':''}>${n?n+'分鐘內':'不限'}</option>`).join('')}</select></div><div class="field"><label for="flavor">口味偏好</label><select id="flavor">${['清淡','家常','重口味','小朋友喜歡','創意料理'].map(f=>`<option ${state.flavor===f?'selected':''}>${f}</option>`).join('')}</select></div><div class="field"><label for="excluded">不吃或過敏的食材</label><input type="text" id="excluded" value="${e(state.excluded.join('、'))}" placeholder="例如：花生、蝦、牛奶" maxlength="300"></div><p class="error">有過敏需求時，請自行確認調味料包裝及器具的交叉接觸風險。本地食譜無法完整判定所有過敏原。</p>${button('儲存設定，準備開火 →','confirm-settings')}`;
    for(const id of ['servings','time','flavor','excluded'])document.getElementById(id).onchange=ev=>{state[id]=id==='excluded'?splitIngredients(ev.target.value):['servings','time'].includes(id)?Number(ev.target.value):ev.target.value;persist()};
  }else if(station==='summary'){
    const rows=[
      ['冰箱食材',state.ingredients.join('、')||'尚未選擇'],
      ['料理方式',state.methods.join('、')||'尚未選擇'],
      ['用餐人數',state.servings+'人'+(state.servings===5?'以上':'')],
      ['料理時間',state.time?state.time+'分鐘內':'不限'],
      ['口味偏好',state.flavor],
      ['飲食限制',state.excluded.join('、')||'無'],
      ['生成引擎',state.apiKey?'✨ Gemini 3.5 Flash (AI智慧生成)':'✦ 本地食譜庫 (模擬推薦)']
    ];
    panel.innerHTML=heading('04 / A PINCH OF MAGIC','🍳 準備好開火了嗎？','看看今天的料理計畫，讓小熊為你找靈感。')+
      rows.map(([a,b])=>`<div class="summary-row"><span>${a}</span><strong>${e(b)}</strong></div>`).join('')+
      button(state.apiKey?'✨ Gemini AI 創意料理':'✨ 開始料理推薦','generate')+
      (state.apiKey
        ?`<p class="note">🟢 已連線 Gemini 3.5 Flash，料理將由 AI 即時研發。<br><button class="text-btn" data-action="open-api-modal">🔑 變更或清除 API Key</button></p>`
        :`<p class="note">✦ 目前為本地食譜模擬推薦。<br><button class="text-btn" data-action="open-api-modal">🔑 輸入 Gemini API Key 開啟 AI 即時生成 →</button></p>`);
  }else if(station==='results'){
    const isAiResult=results.some(r=>r.isAI);
    panel.innerHTML=heading(
      isAiResult?'MADE WITH GEMINI 3.5 FLASH':'MADE WITH A LITTLE MAGIC',
      '🎉 今天的創意料理完成！',
      results.length
        ?(isAiResult?'由 Gemini 3.5 Flash 依據你的食材精選出合理的私房好菜！':'為你挑了幾道好料理，缺少的食材也幫你列好了。')
        :'目前找不到符合條件的食譜。可以增加食材、延長時間，或多選一種料理方式。'
    )+cards(results)+button('調整食材與設定','restart')+button('再推薦一次','generate','chip');
  }else if(station==='favorites'){
    const allKnown=[...recipes,...(state.customRecipes||[]),...results];
    const map=new Map();for(const r of allKnown)map.set(r.id,r);
    const list=state.favorites.map(id=>map.get(id)).filter(Boolean);
    panel.innerHTML=heading('SAVED WITH LOVE','♡ 我的口袋食譜','把喜歡的味道，留給下一次。')+
      (list.length?cards(list):'<p class="empty">還沒有收藏。打開食譜，點「收藏食譜」就能留下來。</p>')+
      button('返回廚房','restart');
  }
}

function cards(list){
  return list.map((r,i)=>`<article class="recipe-card" style="animation-delay:${i*.09}s"><span class="match">${r.isAI?'<span class="ai-pill">✦ Gemini 3.5 Flash</span>':''}${r.match!==undefined?`食材符合 ${Math.round(r.match*100)}% · 還需 ${r.missing?.length||0} 種`:'♡ 已收藏'}</span><h3>${r.emoji||'🍳'} ${e(r.name)}</h3><p>◷ ${r.cookingTime} 分鐘　·　${state.servings} 人　·　${r.methods.join('、')}${r.missing?.length?`<br>需購買：${r.missing.map(i=>e(i.name)).join('、')}`:''}</p><button data-recipe="${r.id}">查看食譜 ↗</button></article>`).join('');
}

function detail(id){
  const r=findRecipe(id);
  if(!r)return;
  const factor=r.isAI?1:(state.servings/r.servings);
  const haveSet=new Set(state.ingredients.map(normalize));
  recipeDialog.querySelector('#recipe-detail').innerHTML=`<div class="step-label">${r.isAI?'✨ GEMINI 3.5 FLASH AI RECIPE':'BUBU’S RECIPE BOOK'}</div><h2>${r.emoji||'🍳'} ${e(r.name)}</h2><p class="sub">${r.cookingTime} 分鐘 · ${state.servings} 人份 · ${r.methods.join('、')}<br>${r.isAI?'✦ 由 Gemini 3.5 Flash 為您即時研發，符合家常烹飪常理與安全規範。':'份量依人數換算；增加份量可能需要延長烹調，請以熟度為準。'}</p><div class="ingredients">${r.ingredients.map(i=>`<p>${haveSet.has(normalize(i.name))||state.ingredients.some(x=>i.name.includes(x)||x.includes(i.name))?'✓ 已有':'＋ 需準備'}　${e(i.name)} <strong>${Math.round(i.amount*factor*100)/100} ${e(i.unit||'份')}</strong></p>`).join('')}<p>基本備料：水、食用油（依料理需要）。</p></div><h3>一起動手做</h3><ol>${r.steps.map(s=>`<li>${e(s)}</li>`).join('')}</ol><div class="tip">🐻 小熊廚師提醒<br>${e(r.tips)}<br>${e(r.allergenNote)}</div><div class="actions"><button data-favorite="${r.id}">${state.favorites.includes(id)?'♥ 取消收藏':'♡ 收藏食譜'}</button><button data-action="regenerate">重新推薦</button><button data-action="back">返回廚房</button></div>`;
  if(!recipeDialog.open)recipeDialog.showModal();
}

async function generate(){
  if(busy)return;
  if(!state.ingredients.length){toast('先加入至少一種食材吧！');show('ingredients');return}
  if(!state.methods.length){toast('先選擇至少一種料理方式吧！');show('methods');return}
  if(!Number.isInteger(state.servings)||state.servings<1||state.servings>5){toast('請確認用餐人數。');show('settings');return}

  busy=true;
  const isGemini=Boolean(state.apiKey);
  panel.innerHTML=`<div class="loading" role="status"><div class="bear">🐻‍❄️</div><h2>跟著小熊一起做料理</h2><p id="waiting">${isGemini?'Gemini 3.5 Flash 正在為你研發合理美味的食譜……':'正在挑選適合你的本地食譜……'}</p><span class="mode">${isGemini?'✦ Gemini 3.5 Flash 智慧生成中':'✦ 本地模擬推薦中'}</span><p class="note">看看廚房裡的小熊：拿食材 → 切菜 → 烹飪 → 上菜</p></div>`;

  if(innerWidth<700&&!reduced())document.querySelector('#scene').scrollIntoView({behavior:'smooth',block:'center'});

  try{
    results=await generateRecipes(structuredClone(state),state.apiKey);
    if(results.some(r=>r.isAI)){
      const existing=state.customRecipes||[];
      const newItems=results.filter(r=>r.isAI&&!existing.some(x=>x.id===r.id));
      state.customRecipes=[...newItems,...existing].slice(0,50);
      persist();
    }
    if(results.length&&kitchen)await kitchen.cookSequence(message=>{
      const w=document.querySelector('#waiting');
      if(w)w.textContent=message;
      document.querySelector('#scene-status')?.remove();
      toast(message);
    });
    else if(results.length)await new Promise(r=>setTimeout(r,reduced()?100:1200));

    station='results';
    render();
    if(results.length)kitchen?.showResults();
    if(results.length&&!reduced()){
      const el=document.querySelector('#celebration');
      el.textContent='✧　✦　✧';
      setTimeout(()=>el.textContent='',1800);
    }
    if(innerWidth<700)toast(results.length?'料理上桌囉！往下查看推薦食譜。':'沒有符合的食譜，請往下調整條件。');
  }catch(err){
    console.error('料理生成失敗：',err);
    panel.innerHTML=`<div class="error" style="margin-bottom:16px;"><strong>⚠️ 料理生成暫時無法完成</strong><br>${e(err.message||'請再試一次。')}${isGemini?'<br><small>提示：若為 API Key 錯誤，可點擊下方按鈕檢查設定，或切換回本地模式。</small>':''}</div>`+
      button('重試','generate')+button('🔑 設定 / 檢查 API Key','open-api-modal','chip')+button('回到料理計畫','back','text-btn');
  }finally{
    busy=false;
    kitchen?.setHeating(false);
  }
}

function add(){
  const input=document.querySelector('#ingredient-input'),items=splitIngredients(input.value);
  if(!items.length)return toast('輸入一種食材試試看。');
  state.ingredients=[...new Set([...state.ingredients,...items])].slice(0,50);
  persist();render();toast('食材已加入冰箱');
}

function openApiModal(){
  const input=document.querySelector('#api-key-input');
  if(input)input.value=state.apiKey||'';
  updateApiStatusBanner();
  if(!apiDialog.open)apiDialog.showModal();
}

function updateApiStatusBanner(){
  const banner=document.querySelector('#api-status-banner');
  if(!banner)return;
  if(state.apiKey){
    banner.className='api-status-banner connected';
    banner.innerHTML='🟢 <strong>已啟用 Gemini 3.5 Flash 智慧生成</strong><br>料理將即時經由 Google Gemini 生成，兼具合理性、實用性與美味！';
  }else{
    banner.className='api-status-banner disconnected';
    banner.innerHTML='⚪ <strong>目前為本地模擬推薦模式</strong><br>未設定 API Key 時，系統使用內建 32 道經典實體食譜庫。輸入 Key 即可解鎖真正 AI 即時生成！';
  }
}

document.body.addEventListener('click',ev=>{
  const b=ev.target.closest('button');
  if(!b)return;
  if(b.dataset.food){
    const x=b.dataset.food;
    state.ingredients=state.ingredients.includes(x)?state.ingredients.filter(i=>i!==x):[...state.ingredients,x];
    persist();render();
  }
  if(b.dataset.remove){
    state.ingredients=state.ingredients.filter(i=>i!==b.dataset.remove);
    persist();render();
  }
  if(b.dataset.method){
    const m=b.dataset.method;
    state.methods=state.methods.includes(m)?state.methods.filter(i=>i!==m):[...state.methods,m];
    persist();render();
  }
  if(b.dataset.recipe)detail(b.dataset.recipe);
  if(b.dataset.favorite){
    const id=b.dataset.favorite;
    const r=findRecipe(id);
    if(r&&r.isAI){
      state.customRecipes=state.customRecipes||[];
      if(!state.customRecipes.some(x=>x.id===r.id))state.customRecipes.unshift(r);
    }
    state.favorites=state.favorites.includes(id)?state.favorites.filter(x=>x!==id):[...state.favorites,id];
    persist();detail(id);if(station==='favorites')render();toast('收藏已更新');
  }

  const action=b.dataset.action;
  if(action==='clear'){state.ingredients=[];persist();render()}
  if(action==='add')add();
  if(action==='confirm-food'){
    const input=document.querySelector('#ingredient-input');
    if(input.value.trim()){
      state.ingredients=[...new Set([...state.ingredients,...splitIngredients(input.value)])].slice(0,50);
      persist();
    }
    if(!state.ingredients.length)return toast('請先選擇一種食材。');
    show('methods');
  }
  if(action==='confirm-methods'){
    if(!state.methods.length)return toast('請先選一種料理方式。');
    show('settings');
  }
  if(action==='confirm-settings'){
    document.querySelector('#excluded').dispatchEvent(new Event('change'));
    persist();show('summary');
  }
  if(action==='generate')generate();
  if(action==='regenerate'){recipeDialog.close();generate()}
  if(action==='restart')show('ingredients');
  if(action==='back'){recipeDialog.close();show('summary')}
  if(action==='open-api-modal')openApiModal();
});

document.querySelector('#api-btn').onclick=openApiModal;
document.querySelector('#api-close-btn').onclick=()=>apiDialog.close();
apiDialog.addEventListener('click',ev=>{
  if(ev.target===apiDialog){
    const r=apiDialog.getBoundingClientRect();
    if(ev.clientX<r.left||ev.clientX>r.right||ev.clientY<r.top||ev.clientY>r.bottom)apiDialog.close();
  }
});

document.querySelector('#save-api-btn').onclick=()=>{
  const val=(document.querySelector('#api-key-input').value||'').trim();
  state.apiKey=val;
  persist();
  render();
  apiDialog.close();
  toast(val?'Gemini 3.5 Flash 已連線啟用！':'已切換為本地模擬推薦模式。');
};

document.querySelector('#clear-api-btn').onclick=()=>{
  state.apiKey='';
  persist();
  render();
  apiDialog.close();
  toast('已清除 API Key，切換為本地模擬模式。');
};

document.querySelector('#toggle-key-btn').onclick=()=>{
  const input=document.querySelector('#api-key-input');
  const btn=document.querySelector('#toggle-key-btn');
  if(input.type==='password'){
    input.type='text';
    btn.textContent='🙈 隱藏';
  }else{
    input.type='password';
    btn.textContent='👁️ 顯示';
  }
};

recipeDialog.querySelector('.close').onclick=()=>recipeDialog.close();
recipeDialog.addEventListener('click',ev=>{
  if(ev.target===recipeDialog){
    const r=recipeDialog.getBoundingClientRect();
    if(ev.clientX<r.left||ev.clientX>r.right||ev.clientY<r.top||ev.clientY>r.bottom)recipeDialog.close();
  }
});

document.querySelector('#favorites').onclick=()=>show('favorites',true);
persist();
render();

try{
  const {createKitchen}=await import('./kitchen3d.js');
  kitchen=createKitchen(document.querySelector('#scene'),id=>show(id,true),reduced);
}catch(err){
  const status=document.querySelector('#scene-status');
  if(status)status.textContent='🧸 3D 暫時無法啟動，使用下方四個家具按鈕，一樣能完成料理。';
  console.info('3D備援模式：',err.message);
}
