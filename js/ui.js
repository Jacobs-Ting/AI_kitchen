export const escapeHTML=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function toast(message){const el=document.querySelector('#toast');el.textContent=message;el.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove('show'),2600)}
export const methods=[['燉煮','🍲'],['電鍋','🍚'],['微波爐','♨️'],['烤箱','🥧'],['油炸','🍟'],['快炒','🍳'],['清蒸','🥟']];
export const common=['雞蛋','豆腐','牛奶','雞肉','豬肉','牛肉','番茄','洋蔥','高麗菜','馬鈴薯','紅蘿蔔','菇類','白飯','麵條'];
export function heading(step,title,sub){return `<div class="step-label">${step}</div><h2>${title}</h2><p class="sub">${sub}</p>`}
