(function(){
  'use strict';
  var cfg=window.STB_ITOP_CONFIG||{};
  function isITopOrigin(){return location.hostname==='sontienbao.com'||location.hostname.endsWith('.sontienbao.com');}
  function isLocal(){return /^(localhost|127\.0\.0\.1)$/i.test(location.hostname)||location.protocol==='file:';}
  function abs(path){if(/^https?:/i.test(path||''))return path;return (cfg.origin||location.origin)+String(path||'');}
  function samePath(path){return isITopOrigin()?String(path||''):abs(path);}
  function parseHtml(text){return new DOMParser().parseFromString(text,'text/html');}
  function csrf(doc,win){doc=doc||document;win=win||window;return (doc.querySelector('meta[name="csrf-token"]')||{}).content||(doc.querySelector('input[name="_token"]')||{}).value||win._token||'';}
  function headers(doc,win,contentType){var h={'X-Requested-With':'XMLHttpRequest','Accept':'application/json, text/javascript, */*; q=0.01'};var t=csrf(doc,win);if(t)h['X-CSRF-TOKEN']=t;if(contentType)h['Content-Type']=contentType;return h;}
  async function fetchText(url,opt){opt=opt||{};var r=await fetch(url,Object.assign({credentials:'same-origin',cache:'no-store'},opt));var text=await r.text();return {ok:r.ok,status:r.status,url:r.url,text:text,response:r};}
  async function fetchJson(url,opt){var res=await fetchText(url,opt);var data={};try{data=res.text?JSON.parse(res.text):{};}catch(e){throw new Error('iTop trả về dữ liệu không phải JSON (HTTP '+res.status+').');}if(!res.ok)throw new Error(data.message||('HTTP '+res.status));return data;}
  async function getSession(){
    if(isLocal())return {authenticated:true,mode:'local-preview',user:{name:'Local Preview'},message:'Local Preview: chưa ghi trực tiếp vào iTop.'};
    if(!isITopOrigin())return {authenticated:false,mode:'cross-origin',message:'Để dùng Admin iTop trực tiếp, hãy chạy trang này trên cùng domain sontienbao.com.'};
    try{
      var r=await fetchText(cfg.productCreateUrl||'/admin/product/create',{headers:{'X-Requested-With':'XMLHttpRequest','Accept':'text/html'}});
      var doc=parseHtml(r.text);
      var form=doc.querySelector('#post-form');
      if(r.ok&&form)return {authenticated:true,mode:'itop-live',user:{name:'iTop Admin'},csrf:csrf(doc)};
      return {authenticated:false,mode:'itop-live',message:'Chưa đăng nhập iTop hoặc phiên đã hết hạn.'};
    }catch(e){return {authenticated:false,mode:'itop-live',message:e.message};}
  }
  function dtParams(query,catId,start,length){var p=new URLSearchParams();p.set('cat_id',catId||'');p.set('draw','1');for(var i=0;i<10;i++){p.set('columns['+i+'][data]','');p.set('columns['+i+'][name]',i===2?'description.title':(i===6?'published_at_formated':''));p.set('columns['+i+'][searchable]','false');p.set('columns['+i+'][orderable]','false');p.set('columns['+i+'][search][value]','');p.set('columns['+i+'][search][regex]','false');}p.set('start',String(start||0));p.set('length',String(length||25));p.set('search[value]',query||'');p.set('search[regex]','false');p.set('_',String(Date.now()));return p;}
  async function searchProducts(query,catId,start,length){if(!isITopOrigin())throw new Error('iTop Live chỉ hoạt động khi trang nằm trên sontienbao.com.');var url=(cfg.productDatatablesUrl||'/admin/product/datatables')+'?'+dtParams(query,catId,start,length).toString();var data=await fetchJson(url,{method:'GET',headers:headers()});return {items:Array.isArray(data.data)?data.data:[],recordsTotal:Number(data.recordsTotal||0),recordsFiltered:Number(data.recordsFiltered||0)};}
  function mediaItems(data){if(Array.isArray(data))return data;return Object.keys(data||{}).filter(function(k){return /^\d+$/.test(k);}).map(function(k){return data[k];}).filter(function(x){return x&&x.id;});}
  async function listMedia(page,ipp){if(!isITopOrigin())throw new Error('Media iTop chỉ hoạt động cùng domain.');var body=new URLSearchParams({func:'load_thumbs',page:String(page||1),ipp:String(ipp||30),folder_id:''});var data=await fetchJson(cfg.mediaActionUrl||'/admin/media/action',{method:'POST',headers:headers(document,window,'application/x-www-form-urlencoded; charset=UTF-8'),body:body.toString()});return mediaItems(data);}
  async function uploadMedia(file){if(!isITopOrigin())throw new Error('Upload iTop chỉ hoạt động cùng domain.');if(!file||!/^image\//.test(file.type||''))throw new Error('Chỉ hỗ trợ tệp hình ảnh.');if(file.size>5*1024*1024)throw new Error('Ảnh lớn hơn 5 MB.');var fd=new FormData();fd.append('folder_id','');fd.append('file',file,file.name);var r=await fetch(cfg.mediaUploadUrl||'/admin/media/upload',{method:'POST',credentials:'same-origin',cache:'no-store',headers:headers(),body:fd});var text=await r.text(),data={};try{data=text?JSON.parse(text):{};}catch(e){throw new Error('Upload trả về dữ liệu lạ.');}if(!r.ok||data.success!==true)throw new Error(data.message||('Upload thất bại HTTP '+r.status));return data;}
  function setField(doc,win,name,value){var el=doc.querySelector('[name="'+name.replace(/"/g,'\\"')+'"]');if(!el)return false;if(el.type==='checkbox'){el.checked=!!value;}else{el.value=value==null?'':String(value);el.setAttribute('value',el.value);}try{el.dispatchEvent(new win.Event('input',{bubbles:true}));el.dispatchEvent(new win.Event('change',{bubbles:true}));if(win.jQuery)win.jQuery(el).trigger('input').trigger('change');}catch(e){}var display=doc.querySelector('[data-value="'+name+'"]');if(display){display.value=value==null?'':String(value);try{display.dispatchEvent(new win.Event('input',{bubbles:true}));}catch(e){}}return true;}
  function submitNativeForm(frameUrl, patch){
    return new Promise(function(resolve, reject){
      if(!isITopOrigin()){
        reject(new Error('Cập nhật iTop chỉ hoạt động cùng domain.'));
        return;
      }
      var iframe=document.createElement('iframe');
      iframe.style.cssText='position:fixed;left:-10000px;top:-10000px;width:1280px;height:900px;opacity:.01;pointer-events:none;border:0';
      var done=false;
      var timer=setTimeout(function(){ finish(new Error('Quá thời gian tải form iTop.')); },60000);
      function finish(err,val){
        if(done)return;
        done=true;
        clearTimeout(timer);
        setTimeout(function(){ try{iframe.remove();}catch(e){} },200);
        if(err)reject(err);else resolve(val);
      }
      iframe.onload=function(){
        var win,doc,form;
        try{
          win=iframe.contentWindow;
          doc=iframe.contentDocument;
          form=doc.querySelector('#post-form');
          if(!form){finish(new Error('Không thấy form iTop. Hãy đăng nhập lại Admin.'));return;}
        }catch(e){finish(e);return;}
        var tries=0;
        var wait=setInterval(function(){
          tries+=1;
          var hasAjax=!!(win.jQuery&&win.jQuery.fn&&typeof win.jQuery.fn.ajaxSubmit==='function');
          if(!hasAjax&&tries<=80)return;
          clearInterval(wait);
          try{
            Object.keys(patch||{}).forEach(function(k){
              if(k==='id'||k==='route_edit'||k==='route_update'||k==='route_remove')return;
              setField(doc,win,k,patch[k]);
            });
            if(patch&&patch.description&&win.CKEDITOR&&win.CKEDITOR.instances){
              Object.keys(win.CKEDITOR.instances).forEach(function(n){
                var inst=win.CKEDITOR.instances[n];
                if(inst&&inst.element&&inst.element.$&&inst.element.$.name==='description'){
                  inst.setData(patch.description);
                  inst.updateElement();
                }
              });
            }
            var $=win.jQuery;
            if(hasAjax){
              $(form).ajaxSubmit({
                dataType:'json',
                beforeSerialize:function(){
                  if(win.CKEDITOR&&win.CKEDITOR.instances){
                    Object.keys(win.CKEDITOR.instances).forEach(function(n){win.CKEDITOR.instances[n].updateElement();});
                  }
                  return true;
                },
                beforeSubmit:function(fd){
                  var attrs=[];
                  for(var i=fd.length-1;i>=0;i--){
                    if(String(fd[i].name||'').indexOf('attribute[')>=0){attrs.push(fd[i]);fd.splice(i,1);}
                  }
                  fd.push({name:'data_attributes',value:JSON.stringify(attrs)});
                },
                success:function(data){
                  if(typeof data==='string'){try{data=JSON.parse(data);}catch(e){}}
                  if(data&&data.success===false)finish(new Error(data.message||'iTop từ chối cập nhật'));
                  else finish(null,data||{success:true});
                },
                error:function(xhr){finish(new Error('Cập nhật iTop lỗi HTTP '+xhr.status));}
              });
            }else{
              var fd=new FormData(form);
              fetch(form.action,{
                method:'POST',credentials:'same-origin',body:fd,
                headers:{'X-Requested-With':'XMLHttpRequest','Accept':'application/json'}
              }).then(function(r){
                return r.text().then(function(t){
                  if(!r.ok)throw new Error('HTTP '+r.status);
                  var d={};try{d=JSON.parse(t);}catch(e){}
                  finish(null,d);
                });
              }).catch(function(e){finish(e);});
            }
          }catch(e){finish(e);}
        },150);
      };
      iframe.src=frameUrl;
      document.body.appendChild(iframe);
    });
  }
  function fieldValue(doc,name){var el=doc.querySelector('[name="'+String(name).replace(/"/g,'\\"')+'"]');if(!el)return undefined;if(el.type==='checkbox')return !!el.checked;return String(el.value==null?'':el.value).trim();}
  async function verifyProduct(id,patch){var r=await fetchText('/admin/product/'+id+'/edit',{headers:{Accept:'text/html'}});if(!r.ok)throw new Error('Đã lưu nhưng không mở lại được sản phẩm để xác minh.');var doc=parseHtml(r.text),check=['title','code','price','price_sale','is_published'];for(var i=0;i<check.length;i++){var k=check[i];if(!Object.prototype.hasOwnProperty.call(patch||{},k))continue;var got=fieldValue(doc,k),want=patch[k];if(k==='is_published'){if(Boolean(got)!==Boolean(want))throw new Error('iTop chưa lưu đúng trường '+k+'.');}else if(String(got==null?'':got).replace(/[,\.\s]/g,'')!==String(want==null?'':want).replace(/[,\.\s]/g,'')){throw new Error('iTop chưa lưu đúng trường '+k+'.');}}return true;}
  async function updateProduct(id,patch){var result=await submitNativeForm('/admin/product/'+id+'/edit',patch||{});await new Promise(function(resolve){setTimeout(resolve,350);});await verifyProduct(id,patch||{});return result;}
  async function createProduct(patch,catId){var url=cfg.productCreateUrl||'/admin/product/create';if(catId)url+='?cat_id='+encodeURIComponent(catId);return submitNativeForm(url,patch||{});}
  async function deleteProduct(id){if(!isITopOrigin())throw new Error('Xóa iTop chỉ hoạt động cùng domain.');var page=await fetchText('/admin/product/'+id+'/edit',{headers:{Accept:'text/html'}});var doc=parseHtml(page.text),token=csrf(doc);if(!token)throw new Error('Không lấy được CSRF token.');var body=new URLSearchParams({_method:'DELETE',_token:token});var r=await fetch('/admin/product/'+id,{method:'POST',credentials:'same-origin',headers:{'X-Requested-With':'XMLHttpRequest','Accept':'application/json, text/javascript, */*; q=0.01','Content-Type':'application/x-www-form-urlencoded; charset=UTF-8','X-CSRF-TOKEN':token},body:body.toString()});if(!r.ok)throw new Error('Xóa thất bại HTTP '+r.status);return true;}
  async function moveProduct(id,direction){if(!isITopOrigin())throw new Error('Sắp xếp iTop chỉ hoạt động cùng domain.');var u='/admin/product/'+id+'/move?direction='+encodeURIComponent(direction||'up');var r=await fetch(u,{credentials:'same-origin',headers:{'X-Requested-With':'XMLHttpRequest','Accept':'application/json, text/javascript, */*; q=0.01'}});if(!r.ok)throw new Error('Sắp xếp thất bại HTTP '+r.status);return true;}
  async function duplicateProduct(id){if(!isITopOrigin())throw new Error('Nhân bản iTop chỉ hoạt động cùng domain.');var r=await fetch('/admin/product/duplicate/'+id,{credentials:'same-origin',redirect:'follow'});if(!r.ok)throw new Error('Nhân bản thất bại HTTP '+r.status);return true;}
  function extractPublicProduct(doc,url){var out={url:url};var ld=doc.querySelectorAll('script[type="application/ld+json"]');for(var i=0;i<ld.length;i++){try{var j=JSON.parse(ld[i].textContent||'{}');var arr=Array.isArray(j)?j:[j];for(var a=0;a<arr.length;a++){var x=arr[a];if(x&&x['@type']==='Product'){out.name=x.name||out.name;out.image=Array.isArray(x.image)?x.image[0]:(x.image||out.image);var offer=Array.isArray(x.offers)?x.offers[0]:x.offers;if(offer&&offer.price!=null)out.price=Number(String(offer.price).replace(/[^0-9.]/g,''));}}}catch(e){}}out.name=out.name||(doc.querySelector('meta[property="og:title"]')||{}).content;out.image=out.image||(doc.querySelector('meta[property="og:image"]')||{}).content;return out;}
  async function syncPublicProducts(products){if(!cfg.publicProductSync||!isITopOrigin())return products;var copy=(products||[]).map(function(x){return Object.assign({},x);});await Promise.all(copy.map(async function(p){try{if(!p.url||!/^https:\/\/sontienbao\.com\//i.test(p.url))return;var u=new URL(p.url);var r=await fetchText(u.pathname+u.search,{headers:{Accept:'text/html'}});if(!r.ok)return;var live=extractPublicProduct(parseHtml(r.text),p.url);if(live.name)p.name=live.name;if(live.image)p.image=live.image;if(live.price)p.price=live.price;p.liveSynced=true;}catch(e){}}));return copy;}
  window.STB_ITOP={config:cfg,isITopOrigin:isITopOrigin,isLocal:isLocal,getSession:getSession,searchProducts:searchProducts,listMedia:listMedia,uploadMedia:uploadMedia,updateProduct:updateProduct,createProduct:createProduct,deleteProduct:deleteProduct,moveProduct:moveProduct,duplicateProduct:duplicateProduct,syncPublicProducts:syncPublicProducts,verifyProduct:verifyProduct,adminHome:cfg.adminHome||'/admin',profileUrl:cfg.profileUrl||'/admin/profile',logoutUrl:cfg.logoutUrl||'/admin/logout',productCreateUrl:cfg.productCreateUrl||'/admin/product/create'};
})();
