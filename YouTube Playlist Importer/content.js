/* Runs inside the one background YouTube video tab. It never advances the queue. */
(() => {
  'use strict';
  // Legacy internal name retained to avoid changing persisted extension behavior.
  if (window.__spotifyPlaylistSaverLoaded) return;
  window.__spotifyPlaylistSaverLoaded = true;
  let TARGET = ''; // the configured target is required in every save request
  const sleep = ms => new Promise(resolve=>setTimeout(resolve,ms));
  const visible = e => !!(e && e.isConnected && e.getClientRects().length && getComputedStyle(e).visibility!=='hidden');
  const norm = s => String(s||'').replace(/\s+/g,' ').trim();
  function name(e){return norm([e.getAttribute?.('aria-label'),e.getAttribute?.('title'),e.innerText,e.textContent].filter(Boolean)[0]);}
  const exact = (x,text) => norm(x).toLocaleLowerCase()===text.toLocaleLowerCase();
  function waitFor(find,timeout=26000,label='YouTube control'){
    // YouTube populates some menus after the page's load event. Both observed
    // DOM mutations and periodic polling are needed because a delayed control
    // can become visible through style/layout changes without a childList event.
    return new Promise((resolve,reject)=>{
      let done=false,observer,timer,poller;
      const finish=(err,val)=>{if(done)return;done=true;observer?.disconnect();clearTimeout(timer);clearInterval(poller);err?reject(err):resolve(val);};
      const test=()=>{if(done)return;try{const v=find();if(v)finish(null,v);}catch(e){finish(e);}};
      observer=new MutationObserver(test);
      observer.observe(document.documentElement,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['aria-label','aria-checked','aria-pressed','aria-disabled','checked','hidden','class','style','disabled']});
      poller=setInterval(test,350);
      timer=setTimeout(()=>finish(new Error(`Timed out finding ${label}`)),timeout);
      test();
    });
  }
  function targets(selectors){return Array.from(document.querySelectorAll(selectors)).filter(visible);}
  function textExact(el,keyword){
    return exact(el.getAttribute?.('aria-label'),keyword)||exact(el.getAttribute?.('title'),keyword)||exact(el.innerText,keyword);
  }
  function click(el){
    if(!visible(el))throw new Error('Target is no longer visible');
    el.scrollIntoView({block:'nearest',inline:'nearest',behavior:'instant'});
    el.click();
  }
  function findSaveButton(){
    const root=document.querySelector('ytd-watch-metadata')||document.querySelector('ytd-video-primary-info-renderer')||document;
    const selectors='button,[role="button"],yt-button-shape button,yt-button-view-model button,ytd-button-renderer,yt-icon-button';
    const candidates=[...root.querySelectorAll(selectors)].filter(visible);
    // Prefer direct, narrow labels instead of matching another playlist's Save word.
    for(const key of ['Save','Save to playlist','Save to playlists']){
      const found=candidates.find(e=>textExact(e,key));if(found)return found;
    }
    return null;
  }
  function findMoreButton(){
    const root=document.querySelector('ytd-watch-metadata')||document.querySelector('ytd-video-primary-info-renderer')||document;
    return [...root.querySelectorAll('button,[role="button"],ytd-button-renderer')].filter(visible)
      .find(e=>/^(more actions|more|more options)$/i.test(name(e)));
  }
  const isSaveLabel = s => /^(?:Save|Save to playlist|Save to playlists)$/i.test(norm(s));
  function menuRoots(){
    // The overflow actions menu is a separate YouTube popup (not the playlist
    // picker). YouTube may reuse the host while its list is clipped/scrolled.
    const selectors='ytd-popup-container ytd-menu-popup-renderer, ytd-popup-container yt-multi-page-menu-renderer, ytd-popup-container yt-list-view-model, ytd-popup-container tp-yt-paper-listbox, ytd-popup-container [role="menu"]';
    const roots=[...document.querySelectorAll(selectors)];
    return roots.filter(root=>{
      if (!root.isConnected || !root.getClientRects().length) return false;
      for(let e=root;e && e!==document.body;e=e.parentElement){
        const style=getComputedStyle(e);
        if(style.display==='none'||style.visibility==='hidden'||e.hasAttribute('hidden'))return false;
      }
      return true;
    });
  }
  function menuHasActions(){
    return menuRoots().some(root=>
      /\b(?:Download|Report|Save|Try Premium)\b/i.test(root.textContent||''));
  }
  function scrollMenuToTop(){
    // Save normally precedes Download and Report. At the end of long videos,
    // YouTube sometimes opens the More menu scrolled to its last (Report) row.
    for(const root of menuRoots()) {
      for(const scroller of [root,...root.querySelectorAll('tp-yt-paper-listbox,yt-list-view-model,[role="menu"],#items')]){
        if(scroller.scrollTop>0)scroller.scrollTop=0;
      }
    }
  }
  function findSaveMenuItem(){
    scrollMenuToTop();
    const containers=menuRoots();
    const labelSelector='yt-formatted-string,yt-attributed-string,.ytListItemViewModelTitle,span,button,[role="menuitem"],tp-yt-paper-item';
    for(const root of containers){
      const options=[...root.querySelectorAll('ytd-menu-service-item-renderer,yt-list-item-view-model,tp-yt-paper-item,[role="menuitem"],button')];
      for(const option of options){
        // Match the short EXACT label, not the entire action group, and use
        // textContent as well as innerText: the latter can be empty when a
        // background-tab popup is clipped by YouTube's scrolling container.
        const labeled= isSaveLabel(option.getAttribute?.('aria-label')) ||
          isSaveLabel(option.getAttribute?.('title')) ||
          isSaveLabel(option.innerText) ||
          [...option.querySelectorAll(labelSelector)].some(el=>
            isSaveLabel(el.getAttribute?.('aria-label')) ||
            isSaveLabel(el.textContent) || isSaveLabel(el.innerText));
        if(!labeled)continue;
        const clickTarget=option.querySelector('tp-yt-paper-item:not([aria-disabled="true"]),button:not([disabled]),[role="menuitem"]:not([aria-disabled="true"])') || option;
        if(option.getAttribute('aria-disabled')==='true' || clickTarget.getAttribute('aria-disabled')==='true')continue;
        // Avoid a hidden, stale menu: the parent popup is rendered. Target may
        // be temporarily clipped, so first scroll it into view.
        if(!clickTarget.isConnected || !visible(clickTarget))continue;
        clickTarget.scrollIntoView({block:'nearest',inline:'nearest'});
        return clickTarget;
      }
    }
    return null;
  }
  function menuDiagnostic(){
    // For debugging; includes action LABELS only, no URLs, cookies or account data.
    const menu=menuRoots();
    const labels=menu.flatMap(root=>[...root.querySelectorAll('ytd-menu-service-item-renderer,yt-list-item-view-model,tp-yt-paper-item')]
      .map(x=>norm(x.getAttribute('aria-label') || x.innerText || x.textContent).slice(0,42)));
    return `popup=${menu.length}; actions=${[...new Set(labels)].filter(Boolean).slice(0,8).join(' / ') || 'none'}`;
  }
  async function clickMenuSave(){
    scrollMenuToTop();
    let option=findSaveMenuItem();
    if(!option){
      option=await waitFor(findSaveMenuItem,16000,'Save entry in More menu').catch(()=>null);
    }
    if(!option)return false;
    click(option);
    return true;
  }
  // YouTube's newer "Save to..." popup is a dropdown of toggleable rows,
  // not the older checkbox dialog. Scope all selections to a real save popup.
  function modernSaveDropdowns(){
    return targets('ytd-popup-container tp-yt-iron-dropdown')
      .filter(popup=>popup.querySelector('yt-list-view-model') &&
        (popup.querySelector('yt-panel-header-view-model[aria-label*="Save"]') ||
         popup.querySelector('toggleable-list-item-view-model')));
  }
  function findDialog(){
    const modern=modernSaveDropdowns()[0];
    if(modern)return modern;
    return targets('ytd-add-to-playlist-renderer,yt-add-to-playlist-renderer,yt-sheet-view-model,yt-dialog,yt-dialog-view-model,[role="dialog"]')
      .find(e=>norm(e.innerText).includes(TARGET));
  }
  function findPlaylistRow(){
    // Exact name match within the actual Save to... popup. In the 2026
    // YouTube UI aria-pressed lives on the INNER button, not its outer
    // yt-list-item-view-model host (the previous version's main bug).
    for(const dialog of modernSaveDropdowns()){
      const rows=[...dialog.querySelectorAll('toggleable-list-item-view-model')].filter(visible);
      for(const row of rows){
        const title=row.querySelector('.ytListItemViewModelTitle,.yt-list-item-view-model__text-wrapper span');
        if(!title || !exact(title.textContent,TARGET))continue;
        const button=row.querySelector('button[aria-pressed],[role="menuitem"][aria-pressed]');
        if(button && visible(button))return {row,checkbox:button,title,dialog,mode:'pressed'};
      }
    }
    // Older YouTube: a named row with an explicit checkbox.
    const dialogs=targets('ytd-add-to-playlist-renderer,yt-add-to-playlist-renderer,yt-sheet-view-model,yt-dialog,yt-dialog-view-model,[role="dialog"]');
    for(const dialog of dialogs){
      const candidates=[...dialog.querySelectorAll('#label,#title,yt-formatted-string,yt-attributed-string,span,div')]
        .filter(el=>visible(el)&&exact(el.innerText,TARGET)&&el.children.length<=3);
      for(const title of candidates){
        let row=title;
        for(let i=0;i<7 && row && row!==dialog;i++,row=row.parentElement){
          const checkbox=row.querySelector('tp-yt-paper-checkbox,yt-checkbox-view-model,input[type="checkbox"],[role="checkbox"]');
          if(checkbox && visible(checkbox))return {row,checkbox,title,dialog,mode:'checkbox'};
        }
      }
    }
    return null;
  }
  function checkboxState(checkbox){
    if(!checkbox)return null;
    // New YouTube bookmark rows use aria-pressed; never infer membership
    // merely from a bookmark icon or a decorative CSS class.
    if(checkbox.hasAttribute('aria-pressed')){
      const pressed=checkbox.getAttribute('aria-pressed');
      if(pressed==='true')return true;
      if(pressed==='false')return false;
      return null;
    }
    if(checkbox instanceof HTMLInputElement && checkbox.type==='checkbox')return checkbox.checked;
    if(checkbox.hasAttribute('aria-checked'))return checkbox.getAttribute('aria-checked')==='true';
    if(checkbox.hasAttribute('checked'))return true;
    const input=checkbox.querySelector?.('input[type="checkbox"]');
    if(input)return input.checked;
    const withRole=checkbox.querySelector?.('[role="checkbox"]');
    if(withRole?.hasAttribute('aria-checked'))return withRole.getAttribute('aria-checked')==='true';
    // YouTube's custom checkbox sometimes marks the host rather than an inner input.
    const parent=checkbox.closest?.('ytd-playlist-add-to-option-renderer,yt-list-item-view-model');
    if(parent?.hasAttribute('checked'))return true;
    // Polymer's tp-yt-paper-checkbox represents false by the absence of checked.
    if(checkbox.localName==='tp-yt-paper-checkbox')return false;
    return null;
  }
  function toastTexts(){
    return targets('tp-yt-paper-toast,yt-notification-action-renderer,ytd-notification-action-renderer,[role="status"],[role="alert"]')
      .map(el=>norm(el.innerText)).filter(Boolean);
  }
  function toastConfirms(previous=[]){
    // Screenshots of the current UI show the explicit "Saved to [target playlist]"
    // notification. Ignore unrelated playlist or generic "Saved" messages.
    return toastTexts().some(t=>{
      const m=t.match(/^(?:saved to|added to)\s+(.+)$/i);
      if(!m || previous.includes(t))return false;
      const shown=m[1].trim();
      return exact(shown,TARGET) || exact(shown.replace(/[.!]$/, ''),TARGET);
    });
  }
  async function openSave(){
    // Already in the playlist picker? Read its membership without toggling.
    const alreadyOpen=findPlaylistRow();
    if(alreadyOpen)return alreadyOpen;
    if(menuHasActions() && await clickMenuSave())
      return await waitFor(findPlaylistRow,22000,`${TARGET} playlist option`);
    const direct=findSaveButton();
    if(direct){
      click(direct);
      return await waitFor(findPlaylistRow,22000,`${TARGET} playlist option`);
    }
    const more=await waitFor(findMoreButton,30000,'More actions button');
    // If the menu is already there, don't click More and close it. If the menu
    // exists but Save is missing, close/reopen it once to repair the DOM.
    if(!menuHasActions()){click(more);await sleep(400);}
    if(await clickMenuSave())return await waitFor(findPlaylistRow,22000,`${TARGET} playlist option`);
    // One recovery attempt: YouTube occasionally leaves an incomplete or
    // bottom-scrolled popup mounted after a prior action.
    if(menuHasActions()){click(more);await sleep(250);}
    click(more);await sleep(550);
    if(await clickMenuSave())return await waitFor(findPlaylistRow,22000,`${TARGET} playlist option`);
    throw new Error('Save option unavailable after reopening More menu ('+menuDiagnostic()+')');
  }
  async function verifyByReopening(){
    const dlg=findDialog();
    if(dlg){
      // Modern YouTube uses an iron-dropdown, with no visible checkbox-dialog
      // close button. Close the popup before independently reopening it.
      if(dlg.localName==='tp-yt-iron-dropdown' && typeof dlg.close==='function')dlg.close();
      else if(dlg.localName==='tp-yt-iron-dropdown' && typeof dlg.hide==='function')dlg.hide();
      else{
        const close=[...dlg.querySelectorAll('button,[role="button"],yt-icon-button')].filter(visible)
          .find(x=>/^(close|done|cancel|x)$/i.test(name(x)));
        if(close)click(close);
        else{
          const save=findSaveButton();
          if(save)click(save); // Closing the popup does not toggle playlist membership.
        }
      }
      await sleep(450);
      if(findPlaylistRow())throw new Error('Could not close Save to playlist popup for independent verification');
    }
    const opt=await openSave();
    if(checkboxState(opt.checkbox)!==true)
      throw new Error('Playlist membership could not be verified after reopening Save dialog');
    return true;
  }
  async function saveOne(message){
    const id=new URL(location.href).searchParams.get('v');
    if(!id||message.videoId!==id)throw new Error('Video mismatch: expected '+message.videoId+', got '+id);
    if(document.body?.innerText?.includes('This video is unavailable'))throw new Error('YouTube video is unavailable');
    if(document.body?.innerText?.includes('Sign in to confirm you’re not a bot'))throw new Error('YouTube requested manual verification');
    const opt=await openSave();
    const before=checkboxState(opt.checkbox);
    if(before===true){
      return {verified:true,result:'already-added',videoId:id,playlist:TARGET};
    }
    if(before!==false)throw new Error('Playlist state is unreadable; refusing to toggle an unknown selection');
    const priorToasts=toastTexts();
    click(opt.checkbox); // Click the real aria-pressed BUTTON, not the row wrapper.
    // Only an exact fresh "Saved to [target playlist]" notification or a reopened
    // menu with aria-pressed=true counts as confirmation. No guessed successes.
    const explicitToast=await waitFor(()=>toastConfirms(priorToasts),4500,`Saved to ${TARGET} confirmation`)
      .then(()=>true).catch(()=>false);
    if(!explicitToast){
      await sleep(350);
      await verifyByReopening();
    }
    return {verified:true,result:explicitToast?'added-toast':'added-selected',videoId:id,playlist:TARGET};
  }
  chrome.runtime.onMessage.addListener((message,sender,sendResponse)=>{
    if(message?.type==='SPOTIFY_PING'){
      sendResponse({ok:true,version:'1.4.1',videoId:new URL(location.href).searchParams.get('v')});return false;
    }
    if(message?.type!=='SPOTIFY_SAVE')return false;
    if(window.__spotifySaveInProgress){sendResponse({ok:false,error:'Another save is still running'});return false;}
    const requestedTarget=norm(message.playlist);
    if(!requestedTarget || requestedTarget.length>150 || /[\x00-\x1f\x7f]/.test(requestedTarget)){
      sendResponse({ok:false,error:'Invalid target playlist name'});return false;
    }
    TARGET=requestedTarget;
    window.__spotifySaveInProgress=true;
    saveOne(message).then(r=>sendResponse({ok:true,...r})).catch(e=>sendResponse({ok:false,error:String(e?.message||e)}))
      .finally(()=>{window.__spotifySaveInProgress=false});
    return true;
  });
})();
