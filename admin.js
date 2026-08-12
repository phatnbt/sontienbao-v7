(function(){
  'use strict';
  var OWNER='phatnbt',REPO='sontienbao-v7',BRANCH='main',CONTENT_FILE='v7-content.js';
  var data=JSON.parse(JSON.stringify(window.STB_V7_CONTENT||{}));
  var fileSha='',imageTarget='',dirty=false;
  var $=function(s){return document.querySelector(s)};
  var $$=function(s){return Array.prototype.slice.call(document.querySelectorAll(s));};

  function token(){try{return sessionStorage.getItem('stb-v7-github-token')||'';}catch(e){return '';}}
  function toast(text,type,sticky){
    var el=$('#toast'); if(!el)return;
    el.textContent=text; el.className='toast show '+(type||'');
    clearTimeout(toast.timer);
    if(!sticky) toast.timer=setTimeout(function(){el.classList.remove('show');},4200);
  }
  function showInline(text,type){var el=$('#message');if(!el)return;el.textContent=text;el.className='notice '+(type||'');el.classList.remove('hidden');}
  function notify(text,type,sticky){showInline(text,type);toast(text,type,sticky);}
  function setConn(ok,text){var dot=$('#connDot'),label=$('#connText');if(dot)dot.className='dot '+(ok?'ok':'warn');if(label)label.textContent=text||(ok?'Đã kết nối':'Chưa kết nối GitHub');}
  function setSaveState(state){var b=$('#saveBtn');if(!b)return;b.disabled=state==='saving';b.textContent=state==='saving'?'Đang lưu…':(dirty?'Lưu thay đổi':'Lưu lên V7');b.classList.toggle('dirty',dirty);}
  function markDirty(){dirty=true;setSaveState('idle');}
  function getPath(path){return path.split('.').reduce(function(o,k){return o==null?undefined:o[k];},data);}
  function setPath(path,val){var a=path.split('.'),o=data;for(var i=0;i<a.length-1;i++){var k=a[i],next=a[i+1];if(o[k]==null)o[k]=/^\d+$/.test(next)?[]:{};o=o[k];}o[a[a.length-1]]=val;markDirty();updatePreview(path);}
  function decode64(s){var b=atob(String(s||'').replace(/\s/g,'')),u=new Uint8Array(b.length);for(var i=0;i<b.length;i++)u[i]=b.charCodeAt(i);return new TextDecoder().decode(u);}
  function encode64(s){var u=new TextEncoder().encode(s),chunk=0x8000,b='';for(var i=0;i<u.length;i+=chunk)b+=String.fromCharCode.apply(null,u.subarray(i,i+chunk));return btoa(b);}
  async function api(path,opts){
    var t=token(); if(!t)throw new Error('Chưa có GitHub token hoặc phiên đăng nhập đã hết.');
    opts=opts||{};
    var headers=Object.assign({'Accept':'application/vnd.github+json','Authorization':'Bearer '+t,'X-GitHub-Api-Version':'2022-11-28'},opts.headers||{});
    if(opts.body&&!headers['Content-Type'])headers['Content-Type']='application/json';
    var r=await fetch('https://api.github.com'+path,Object.assign({},opts,{headers:headers}));
    var body=null; try{body=await r.json();}catch(e){}
    if(!r.ok){
      var msg=(body&&body.message)||('GitHub API '+r.status);
      if(r.status===401) msg='Token không hợp lệ hoặc đã hết hạn.';
      if(r.status===403) msg='Token chưa có quyền Contents: Read and write cho repo sontienbao-v7.';
      if(r.status===409) msg='Dữ liệu trên GitHub vừa thay đổi. Hãy bấm Tải lại rồi lưu lại.';
      throw new Error(msg);
    }
    return body;
  }
  function parseContent(text){var m=text.match(/window\.STB_V7_CONTENT\s*=\s*(\{[\s\S]*\})\s*;?\s*$/);if(!m)throw new Error('Không đọc được v7-content.js');return JSON.parse(m[1]);}
  function serialize(){data.meta=data.meta||{};data.meta.updatedAt=new Date().toISOString();data.meta.source='v7-admin';return 'window.STB_V7_CONTENT = '+JSON.stringify(data,null,2)+';\n';}

  async function connect(){
    var input=$('#token'),v=input?input.value.trim():'';
    if(v){try{sessionStorage.setItem('stb-v7-github-token',v);}catch(e){}}
    if(!token()){notify('Hãy dán Fine-grained token rồi bấm Kết nối.','error',true);return;}
    try{
      toast('Đang kiểm tra quyền GitHub…','',true);
      var repo=await api('/repos/'+OWNER+'/'+REPO);
      if(repo.permissions&&repo.permissions.push===false)throw new Error('Token chưa có quyền ghi vào repository.');
      setConn(true,'Đã kết nối • '+((repo.owner&&repo.owner.login)||OWNER));
      if(input)input.value='';
      await loadRemote(true);
      notify('Kết nối GitHub thành công. Bây giờ nút Lưu lên V7 đã sẵn sàng.','success');
    }catch(e){setConn(false,'Kết nối thất bại');notify(e.message,'error',true);}
  }

  async function loadRemote(silent){
    if(!token()){notify('Hãy kết nối GitHub trước.','error',true);scrollConnect();return;}
    try{
      toast('Đang tải dữ liệu mới nhất…','',true);
      var f=await api('/repos/'+OWNER+'/'+REPO+'/contents/'+CONTENT_FILE+'?ref='+encodeURIComponent(BRANCH));
      data=parseContent(decode64(f.content));fileSha=f.sha||'';dirty=false;render();setConn(true,'Đã kết nối GitHub');setSaveState('idle');
      if(!silent)notify('Đã tải dữ liệu mới nhất từ GitHub.','success');else toast('Đã kết nối và tải dữ liệu.','success');
    }catch(e){notify('Không tải được dữ liệu: '+e.message,'error',true);}
  }

  function scrollConnect(){var el=$('#connect');if(el)el.scrollIntoView({behavior:'smooth',block:'start'});}

  async function saveRemote(){
    if(!token()){notify('Token không còn trong phiên. Hãy kết nối GitHub lại rồi bấm Lưu.','error',true);scrollConnect();return;}
    try{
      setSaveState('saving');toast('Đang lưu nội dung lên GitHub…','',true);
      var latest=await api('/repos/'+OWNER+'/'+REPO+'/contents/'+CONTENT_FILE+'?ref='+encodeURIComponent(BRANCH));
      var body={message:'Update V7 landing content from admin',content:encode64(serialize()),branch:BRANCH,sha:latest.sha};
      var r=await api('/repos/'+OWNER+'/'+REPO+'/contents/'+CONTENT_FILE,{method:'PUT',body:JSON.stringify(body)});
      fileSha=(r.content&&r.content.sha)||latest.sha;dirty=false;renderMeta();setSaveState('idle');
      notify('Đã lưu thành công ✓ GitHub Pages đang deploy bản mới.','success');
    }catch(e){setSaveState('idle');notify('Lưu thất bại: '+e.message,'error',true);if(/token|quyền|401|403/i.test(e.message))scrollConnect();}
  }

  function renderMeta(){var u=data.meta&&data.meta.updatedAt;var el=$('#updatedText');if(el)el.textContent=u?'Cập nhật: '+new Date(u).toLocaleString('vi-VN'):'Chưa có thời gian cập nhật';}
  function bindStatic(){
    $$('[data-path]').forEach(function(el){
      var v=getPath(el.dataset.path);if(el.type==='checkbox')el.checked=!!v;else el.value=v==null?'':v;
      el.oninput=function(){var value=el.type==='checkbox'?el.checked:(el.type==='number'?Number(el.value||0):el.value);setPath(el.dataset.path,value);};
      if(el.type==='checkbox')el.onchange=el.oninput;
    });
    updateAllPreviews();renderMeta();
  }
  function src(v){if(!v)return '';if(/^https?:|^data:|^blob:/.test(v))return v;return String(v).replace(/^\//,'');}
  function updatePreview(path){var el=document.querySelector('[data-preview="'+path+'"]');if(el)el.src=src(getPath(path))||'assets/logo-tien-bao.png';}
  function updateAllPreviews(){$$('[data-preview]').forEach(function(el){updatePreview(el.dataset.preview);});}

  function renderCategories(){
    var root=$('#categoryList');if(!root)return;root.innerHTML='';
    (data.categories||[]).forEach(function(c,i){
      var box=document.createElement('div');box.className='item';
      box.innerHTML='<div class="itemhead"><b>'+(c.name||('Danh mục '+(i+1)))+'</b><label class="check"><input type="checkbox" data-cat-enable="'+i+'"> Hiển thị</label></div><div class="grid"><div class="field"><label>Tên</label><input data-cat="'+i+'" data-key="name"></div><div class="field"><label>Link</label><input data-cat="'+i+'" data-key="url"></div><div class="field full"><label>Mô tả</label><input data-cat="'+i+'" data-key="description"></div><div class="field full"><label>Ảnh</label><div class="imgrow"><img class="preview" data-cat-preview="'+i+'"><div><input data-cat="'+i+'" data-key="image"><div class="uploadline"><button class="ghost catUpload" data-index="'+i+'">Tải ảnh lên GitHub</button></div></div></div></div></div>';
      root.appendChild(box);
      var en=box.querySelector('[data-cat-enable]');en.checked=c.enabled!==false;en.onchange=function(){data.categories[i].enabled=en.checked;markDirty();};
      box.querySelectorAll('[data-cat]').forEach(function(el){var k=el.dataset.key;el.value=c[k]||'';el.oninput=function(){data.categories[i][k]=el.value;markDirty();if(k==='image')box.querySelector('[data-cat-preview]').src=src(el.value);};});
      box.querySelector('[data-cat-preview]').src=src(c.image)||'assets/logo-tien-bao.png';
      box.querySelector('.catUpload').onclick=function(e){e.preventDefault();imageTarget='categories.'+i+'.image';$('#filePicker').click();};
    });
  }

  function renderFaq(){
    var root=$('#faqList');if(!root)return;root.innerHTML='';
    (data.faqs||[]).forEach(function(f,i){
      var box=document.createElement('div');box.className='item';
      box.innerHTML='<div class="itemhead"><b>FAQ '+(i+1)+'</b><label class="check"><input type="checkbox" data-faq-enable> Hiển thị</label><button class="danger mini" data-remove>Xóa</button></div><div class="grid one"><div class="field"><label>Câu hỏi</label><input data-faq-key="question"></div><div class="field"><label>Trả lời</label><textarea data-faq-key="answer"></textarea></div></div>';
      root.appendChild(box);
      var en=box.querySelector('[data-faq-enable]');en.checked=f.enabled!==false;en.onchange=function(){data.faqs[i].enabled=en.checked;markDirty();};
      box.querySelectorAll('[data-faq-key]').forEach(function(el){var k=el.dataset.faqKey;el.value=f[k]||'';el.oninput=function(){data.faqs[i][k]=el.value;markDirty();};});
      box.querySelector('[data-remove]').onclick=function(){if(confirm('Xóa FAQ này?')){data.faqs.splice(i,1);markDirty();renderFaq();}};
    });
  }

  function render(){
    if(!data.banners||!data.banners.length)data.banners=[{id:'banner-1',enabled:true,title:'',subtitle:'',ctaLabel:'',ctaUrl:'#calculator',image:''}];
    if(!data.popups||!data.popups.length)data.popups=[{id:'popup-v7-admin',name:'Popup V7',template:'announcement',enabled:false,status:'published',eyebrow:'THÔNG BÁO',title:'',body:'',highlight:'',image:'',ctaLabel:'Xem chi tiết',ctaUrl:'https://sontienbao.com/',secondaryLabel:'Để sau',frequency:'session',delay:1100,position:'center',width:760,animation:'rise'}];
    bindStatic();renderCategories();renderFaq();setSaveState('idle');
  }

  function fileBase64(file){return new Promise(function(resolve,reject){var r=new FileReader();r.onload=function(){var s=String(r.result||'');resolve(s.split(',')[1]||'');};r.onerror=reject;r.readAsDataURL(file);});}
  function slug(s){return String(s||'image').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9.]+/g,'-').replace(/^-+|-+$/g,'');}
  async function uploadImage(file,target){
    if(!token()){notify('Hãy kết nối GitHub trước khi tải ảnh.','error',true);scrollConnect();return;}
    if(!file)return;if(file.size>8*1024*1024){notify('Ảnh lớn hơn 8MB. Hãy nén ảnh trước khi tải lên.','error',true);return;}
    try{toast('Đang tải ảnh '+file.name+'…','',true);var name=Date.now()+'-'+slug(file.name);var path='assets/admin/'+name;await api('/repos/'+OWNER+'/'+REPO+'/contents/'+path,{method:'PUT',body:JSON.stringify({message:'Upload V7 admin image',content:await fileBase64(file),branch:BRANCH})});setPath(target,path);render();notify('Đã tải ảnh. Bấm “Lưu thay đổi” để áp dụng ảnh vào V7.','success');}catch(e){notify('Tải ảnh thất bại: '+e.message,'error',true);}
  }

  function bindButtons(){
    $('#connectBtn').onclick=connect;
    $('#saveBtn').onclick=function(e){e.preventDefault();saveRemote();};
    $('#loadBtn').onclick=function(e){e.preventDefault();loadRemote(false);};
    $('#reloadBtn').onclick=function(e){e.preventDefault();loadRemote(false);};
    $('#disconnectBtn').onclick=function(){try{sessionStorage.removeItem('stb-v7-github-token');}catch(e){}setConn(false,'Đã ngắt kết nối');notify('Đã xóa token khỏi phiên trình duyệt.','');};
    $('#addFaq').onclick=function(){data.faqs=data.faqs||[];data.faqs.push({id:'faq-'+Date.now(),question:'Câu hỏi mới',answer:'Nhập câu trả lời tại đây.',enabled:true});markDirty();renderFaq();};
    $$('.imageUpload').forEach(function(b){b.onclick=function(e){e.preventDefault();imageTarget=b.dataset.target;$('#filePicker').click();};});
    $('#filePicker').onchange=function(){var f=this.files&&this.files[0];this.value='';if(f&&imageTarget)uploadImage(f,imageTarget);};
  }

  window.addEventListener('error',function(e){toast('Lỗi Admin: '+(e.message||'Không xác định'),'error',true);});
  render();bindButtons();
  if(token()){setConn(true,'Đang kiểm tra phiên GitHub…');connect();}else{setConn(false,'Chưa kết nối GitHub');}
})();
