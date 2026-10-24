(() => {
  'use strict';
  const $=id=>document.getElementById(id);
  const UI={
    chooseFile:$('chooseFile'),fileName:$('fileName'),delay:$('delay'),delayLabel:$('delayLabel'),
    added:$('addedCount'),pending:$('pendingCount'),total:$('totalCount'),bar:$('progressBar'),
    start:$('start'),stop:$('stop'),retry:$('retry'),currentTitle:$('currentTitle'),
    chip:$('statusChip'),lastUpdated:$('lastUpdated'),
    log:$('log'),exportLog:$('exportLog'),clearLog:$('clearLog'),pct:$('progressPct'),progress:$('progressBar'),
    playlistName:$('playlistName'),savePlaylist:$('savePlaylist'),playlistFeedback:$('playlistFeedback')
  };
  // The tab's 'complete' event can precede YouTube's asynchronously rendered
  // buttons/overflow menu. Give the watch page time to hydrate before the
  // first Save lookup, including after an automatic retry reload.
  const YOUTUBE_UI_SETTLE_MS = 5000; // default when no attempt override is supplied
  const DEFAULT_PLAYLIST=''; // New installs must select a playlist
  // Keep the pre-1.4 storage/IndexedDB keys below intact: existing installations
  // rely on them to restore their workbook handle, log and recovery journal.
  const LEGACY_PLAYLIST='Spotify Songs'; // One-time compatibility for existing imported workbooks
  const PREF_PLAYLIST='ytImporterTargetPlaylist';
  let targetPlaylistName=DEFAULT_PLAYLIST;
  const STATE_KEY='spotifyQueueJournal';
  const FILE_DB='spotify-songs-file-handle';
  const PROGRESS_KEY='spotifySongsRemovedRows';
  const MAX_ATTEMPTS=3; // initial attempt plus two automatic retries
  const UI_SETTLE_DELAYS=[5000,8000,12000]; // increasing rendering grace per attempt
  const RETRY_BACKOFF=[1000,2000]; // short reload spacing; no unnecessary long idle
  const PREF_DELAY='ytImporterDelaySeconds';
  const UI_TAB_KEY='ytImporterSelectedTab';
  const UI_REQUEST_KEY='ytImporterRequestedTab';
  const WORK_TAB_KEY='ytImporterWorkTab';
  let fileHandle=null,workbook=null,importRunning=false,stopRequested=false,tabId=null,logLines=[],currentFailure=false,completedIds=[];
  const now=()=>new Date().toLocaleTimeString();
  const cleanPlaylistName=value=>String(value||'').trim().replace(/\s+/g,' ');
  const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
  let audioContext=null;
  function primeAlertSound(){
    try{audioContext ||= new (window.AudioContext||window.webkitAudioContext)();audioContext.resume().catch(()=>{});}catch(e){console.warn('Audio permission not available',e);}
  }
  async function failureAlert(message,item){
    const title='YouTube Playlist Importer • Paused';
    const body=`${item?.title||'Current video'}: ${message}`.slice(0,380);
    try{
      await chrome.notifications.create('ytImporterRetryFailure-'+Date.now(),{type:'basic',iconUrl:chrome.runtime.getURL('icons/icon128.png'),title,message:body,priority:2,requireInteraction:true});
    }catch(e){log('Desktop notification unavailable: '+e.message,'error');}
    try{
      const ctx=audioContext || (audioContext=new (window.AudioContext||window.webkitAudioContext)());
      await ctx.resume();
      const start=ctx.currentTime;
      for(const [i,f] of [660,520,440].entries()){
        const o=ctx.createOscillator(),g=ctx.createGain();o.type='sine';o.frequency.value=f;
        const t=start+i*.28;g.gain.setValueAtTime(.001,t);g.gain.exponentialRampToValueAtTime(.18,t+.022);
        g.gain.exponentialRampToValueAtTime(.001,t+.23);o.connect(g);g.connect(ctx.destination);o.start(t);o.stop(t+.25);
      }
    }catch(e){log('Sound alert unavailable (Chrome may block autoplay): '+e.message,'error');}
  }
  const tabNames=['home','options','activity','about'];
  let selectedTab='home';
  function selectTab(name,{persist=true}={}){
    if(!tabNames.includes(name))return;
    selectedTab=name;
    for(const t of tabNames){
      const active=t===name;
      const button=$('tab-'+t),panel=$('view-'+t);
      button.setAttribute('aria-selected',String(active));
      button.tabIndex=active?0:-1;
      panel.hidden=!active;
    }
    if(persist)chrome.storage.local.set({[UI_TAB_KEY]:name}).catch(console.warn);
  }
  for(const button of document.querySelectorAll('#tabNav [role="tab"]')){
    button.addEventListener('click',()=>selectTab(button.dataset.tab));
    button.addEventListener('keydown',event=>{
      if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
      event.preventDefault();
      const i=tabNames.indexOf(button.dataset.tab);
      const next=event.key==='Home'?0:event.key==='End'?tabNames.length-1:
        (i+(event.key==='ArrowRight'?1:-1)+tabNames.length)%tabNames.length;
      selectTab(tabNames[next]);$('tab-'+tabNames[next]).focus();
    });
  }
  $('goOptions').addEventListener('click',()=>selectTab('options'));

  function renderLog(){
    UI.log.replaceChildren();
    const recent=logLines.slice(-60).reverse();
    if(!recent.length){UI.log.textContent='No actions yet.';return;}
    for(const row of recent){
      const el=document.createElement('div');el.className=`entry ${row.type==='error'?'error':''}`;
      el.textContent=row.message;UI.log.appendChild(el);
    }
  }
  function log(text,type='info'){
    const message=`${now()}  ${text}`;
    logLines.push({message,type});if(logLines.length>1000)logLines.shift();
    renderLog();
    chrome.storage.local.set({spotifyActivity:logLines.slice(-400)}).catch(console.warn);
  }
  function settingFeedback(message,error=false){
    UI.playlistFeedback.textContent=message;
    UI.playlistFeedback.classList.toggle('error',error);
  }
  function displayPlaylistName(){
    UI.playlistName.value=targetPlaylistName;
    settingFeedback('');
  }
  async function saveTargetPlaylist(){
    if(importRunning)return;
    const name=cleanPlaylistName(UI.playlistName.value);
    if(!name || name.length>150 || /[\x00-\x1f\x7f]/.test(name)){
      settingFeedback('Enter a playlist name (1–150 characters).',true);
      return;
    }
    if(name===targetPlaylistName){displayPlaylistName();settingFeedback('Already saved.');return;}
    const transaction=(await chrome.storage.local.get(STATE_KEY))[STATE_KEY];
    if(transaction){
      settingFeedback('Finish or recover the pending confirmed workbook write before changing playlists.',true);
      return;
    }
    try{
      await chrome.storage.local.set({[PREF_PLAYLIST]:name});
      targetPlaylistName=name;
      workbook=null;completedIds=[];currentFailure=false;
      displayPlaylistName();
      log(`Target playlist changed to: ${name}`);
      if(fileHandle && await canWrite()) await load();
      else {showWorkbook();refresh();}
      settingFeedback(`Saved. New imports target “${name}”.`);
    }catch(e){settingFeedback('Could not save target: '+String(e.message||e),true);}
  }
  function showStatus(message,kind='idle'){
    UI.chip.textContent=message;
    UI.chip.className='sr-only';
    UI.lastUpdated.textContent=now();
  }
  function refresh(){
    const items=workbook?.items||[];
    const done=completedIds.length+items.filter(x=>x.status==='added').length;
    const pending=items.filter(x=>x.status!=='added').length;
    UI.added.textContent=String(done);UI.pending.textContent=String(pending);UI.total.textContent=String(done+pending);
    UI.bar.style.width=`${done+pending?100*done/(done+pending):0}%`;
    const current=items.find(x=>x.status!=='added');
    UI.currentTitle.textContent=current?`#${done+1} · ${current.title}`:(workbook?'Every track is complete':'Waiting for a workbook');
    UI.start.disabled=!targetPlaylistName||(!workbook&&!fileHandle)||(!!workbook&&!pending)||importRunning||currentFailure;
    UI.stop.disabled=!importRunning;
    UI.retry.disabled=!workbook||importRunning||!currentFailure;
    UI.chooseFile.disabled=importRunning;
    UI.playlistName.disabled=importRunning;
    UI.savePlaylist.disabled=importRunning;
    const pct=done+pending?Math.round(100*done/(done+pending)):0;
    UI.pct.textContent=pct+'%';
    UI.progress.parentElement.setAttribute('aria-valuenow',String(pct));
  }
  function openDb(){return new Promise((resolve,reject)=>{
    const r=indexedDB.open(FILE_DB,1);
    r.onupgradeneeded=()=>r.result.createObjectStore('store');
    r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);
  });}
  async function storeHandle(value){
    const db=await openDb();
    await new Promise((resolve,reject)=>{
      const tx=db.transaction('store','readwrite');tx.objectStore('store').put(value,'source');
      tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);
    });db.close();
  }
  async function getStoredHandle(){
    const db=await openDb();
    const handle=await new Promise((resolve,reject)=>{
      const tx=db.transaction('store','readonly'),req=tx.objectStore('store').get('source');
      req.onsuccess=()=>resolve(req.result||null);req.onerror=()=>reject(req.error);
    });db.close();return handle;
  }
  async function canWrite({request=false}={}){
    if(!fileHandle)return false;
    if(await fileHandle.queryPermission({mode:'readwrite'})==='granted')return true;
    if(request && await fileHandle.requestPermission({mode:'readwrite'})==='granted')return true;
    return false;
  }
  async function readProgress(fileName){
    const saved=(await chrome.storage.local.get(PROGRESS_KEY))[PROGRESS_KEY];
    return saved?.fileName===fileName && (saved.playlist||LEGACY_PLAYLIST)===targetPlaylistName ? saved : null;
  }
  async function recordCompleted(item){
    if(!completedIds.includes(item.id))completedIds.push(item.id);
    await chrome.storage.local.set({[PROGRESS_KEY]:{
      fileName:workbook.fileName,sheetPath:workbook.sheetPath,playlist:targetPlaylistName,ids:completedIds
    }});
  }
  function showWorkbook(){
    if(!fileHandle){UI.fileName.textContent='No workbook selected. Choose your .xlsm file below.';return;}
    if(!workbook){UI.fileName.textContent=`Remembered: ${fileHandle.name} · Start queue requests access when required`;return;}
    const pending=workbook.items.filter(x=>x.status!=='added').length;
    UI.fileName.textContent=`Saved workbook: ${workbook.fileName} · ${pending} pending · ${completedIds.length} removed`;
  }
  async function load(){
    const file=await fileHandle.getFile();
    const progress=await readProgress(file.name);
    workbook=await ZipWorkbook.loadWorkbook(file,progress?.sheetPath||null);
    completedIds=(progress?.sheetPath===workbook.sheetPath ? (progress.ids||[]) : [])
      .filter(id=>!workbook.items.some(x=>x.id===id));
    showWorkbook();
    if(workbook.hasVBA)log('Workbook recognized. Each confirmed song will be deleted as a full row, shifting later rows upward.');
    if(!await canWrite())log('Workbook handle remembered. Chrome may request renewed write access before starting.');
    await recoverPending();
    refresh();
  }
  async function recoverPending(){
    const entry=(await chrome.storage.local.get(STATE_KEY))[STATE_KEY];
    if(!entry)return;
    if((entry.playlist||LEGACY_PLAYLIST)!==targetPlaylistName){
      currentFailure=true;showStatus('Wrong playlist','error');
      log('A verified save belongs to a different target playlist; no worksheet row was deleted.','error');
      return;
    }
    if(entry.fileName && (entry.fileName!==workbook.fileName || entry.sheetPath!==workbook.sheetPath)){
      currentFailure=true;showStatus('Wrong workbook','error');
      log('A verified YouTube save belongs to another workbook; it will not be written here.','error');
      return;
    }
    // Never trust the in-memory sheet after a failed write: removeTrack() can
    // have updated RAM even when Chrome refused to write the disk file.
    workbook=await ZipWorkbook.loadWorkbook(await fileHandle.getFile(),workbook.sheetPath);
    // Row shifting changes cell coordinates. Recover using entry counts as
    // well as the video URL, not the stale row/cell-derived ID alone.
    if(!Number.isSafeInteger(entry.beforeTotal) || !Number.isSafeInteger(entry.beforeUrlCount)){
      currentFailure=true;showStatus('Recovery needs review','error');
      log('Legacy transaction journal lacks row-shift counters. Please inspect the workbook before resuming.','error');return;
    }
    const currentCount=workbook.items.filter(x=>x.url===entry.url).length;
    if(workbook.items.length===entry.beforeTotal-1 && currentCount===entry.beforeUrlCount-1){
      await recordCompleted({id:entry.id});
      await chrome.storage.local.remove(STATE_KEY);
      log('Recovered previously shifted worksheet row: '+(entry.title||entry.videoId));
      showWorkbook();refresh();return;
    }
    if(workbook.items.length!==entry.beforeTotal || currentCount!==entry.beforeUrlCount){
      currentFailure=true;showStatus('Recovery needs review','error');
      log('Workbook differs from the expected pre/post-save counts; no row was deleted.','error');return;
    }
    const item=workbook.items.find(x=>x.id===entry.id);
    if(!item){
      currentFailure=true;showStatus('Recovery needs review','error');
      log('Confirmed song changed position before workbook write; no automatic row deletion.','error');return;
    }
    log('Recovered YouTube confirmation; shifting the confirmed workbook row: '+item.title);
    await persistRemoved(item,true);
  }
  async function persistRemoved(item,isRecovery=false){
    if(!await canWrite())throw new Error('Write permission missing for the saved XLSM file. Click Start or select it again.');
    const beforeTotal=workbook.items.length;
    const beforeUrlCount=workbook.items.filter(x=>x.url===item.url).length;
    ZipWorkbook.removeTrack(workbook,item);
    const blob=ZipWorkbook.serialize(workbook);
    const stream=await fileHandle.createWritable();
    try{await stream.write(blob);await stream.close();}catch(e){try{await stream.abort();}catch{}throw e;}
    const disk=await ZipWorkbook.loadWorkbook(await fileHandle.getFile(),workbook.sheetPath);
    if(disk.items.length!==beforeTotal-1 ||
       disk.items.filter(x=>x.url===item.url).length!==beforeUrlCount-1)
      throw new Error('Workbook re-read did not confirm a single shifted-row deletion. Queue paused.');
    workbook=disk;
    await recordCompleted(item);
    await chrome.storage.local.remove(STATE_KEY);
    log((isRecovery?'Recovered workbook removal: ':'Confirmed XLSM link removed: ')+item.title);
    showWorkbook();refresh();
  }
  async function chooseWorkbook(){
    if(importRunning)return;
    if(typeof window.showOpenFilePicker!=='function'){
      log('Chrome File System Access is unavailable in this browser.','error');return;
    }
    const previous=fileHandle;
    try{
      const [chosen]=await window.showOpenFilePicker({multiple:false,types:[{
        description:'Excel workbook',accept:{
          'application/vnd.ms-excel.sheet.macroEnabled.12':['.xlsm'],
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':['.xlsx']
        }
      }]});
      if(await chosen.requestPermission({mode:'readwrite'})!=='granted')
        throw new Error('Read/write access was not granted by Chrome');
      fileHandle=chosen;
      await storeHandle(chosen);
      workbook=null;currentFailure=false;
      await load();showStatus('Workbook connected','success');
      log('Selected and connected workbook: '+chosen.name);
    }catch(e){
      if(e?.name==='AbortError')return;
      if(fileHandle!==previous && !workbook){
        // Preserve the newly selected file handle for a later retry.
        showWorkbook();
      }
      log('Workbook selection: '+String(e.message||e),'error');
      showStatus('Workbook selection failed','error');
    }finally{refresh();}
  }
  async function createVideoTab(video){
    const query=new URL(video.url),id=query.searchParams.get('v');
    if(!/^[A-Za-z0-9_-]{11}$/.test(id||''))throw new Error('Invalid YouTube video ID: '+video.url);
    query.searchParams.set('autoplay','0');
    const url=query.toString();
    if(tabId!==null){
      try {
        const t=await chrome.tabs.get(tabId);
        if(t?.id){
          await chrome.tabs.update(tabId,{url,active:false,muted:true});
          // Remember THIS exact video tab for a notification click; never guess
          // the most recently focused window or the user's current tab.
          await chrome.storage.local.set({[WORK_TAB_KEY]:{tabId:t.id,windowId:t.windowId,videoId:id}});
          return {id,tabId};
        }
      } catch {tabId=null;}
    }
    const tab=await chrome.tabs.create({url,active:false});
    tabId=tab.id;
    try {await chrome.tabs.update(tabId,{muted:true});}catch{}
    await chrome.storage.local.set({[WORK_TAB_KEY]:{tabId:tab.id,windowId:tab.windowId,videoId:id}});
    return {id,tabId};
  }
  async function waitTabLoaded(tab,videoId,timeout=47000,settleMs=YOUTUBE_UI_SETTLE_MS){
    const start=Date.now();
    while(Date.now()-start<timeout){
      if(stopRequested) return; // The current transaction has not been initiated.
      let info;
      try{info=await chrome.tabs.get(tab);}catch(e){throw new Error('Background YouTube tab closed');}
      if(info.status==='complete' && new URL(info.url||'https://youtube.com').searchParams.get('v')===videoId){
        await sleep(settleMs);return;
      }
      await sleep(350);
    }
    throw new Error('YouTube video did not finish loading in the background tab');
  }
  async function runSave(tab,videoId){
    let pong;
    for(let attempt=0;attempt<6;attempt++){
      try{pong=await chrome.tabs.sendMessage(tab,{type:'SPOTIFY_PING'});if(pong?.ok&&pong.videoId===videoId)break;}catch{}
      try{await chrome.scripting.executeScript({target:{tabId:tab},files:['content.js']});}catch{}
      await sleep(1000);
    }
    if(!pong?.ok||pong.videoId!==videoId)throw new Error('Could not connect to the YouTube page controls in the background tab');
    return await chrome.tabs.sendMessage(tab,{type:'SPOTIFY_SAVE',videoId,playlist:targetPlaylistName});
  }
  async function addNext(){
    const item=workbook.items.find(x=>x.status!=='added');
    if(!item)return false;
    showStatus('Opening video','busy');refresh();
    log(`Opening #${item.index+1}: ${item.title}`);
    const {id,tabId:opened}=await createVideoTab(item);
    // Three attempts total: 5s -> 8s -> 12s for YouTube's delayed controls.
    // Retry only the YouTube step. If the previous attempt saved but failed to
    // confirm, content.js first checks membership and never toggles it off.
    let result,lastError;
    for(let attempt=0;attempt<MAX_ATTEMPTS;attempt++){
      if(stopRequested)return false;
      try{
        if(attempt){
          showStatus(`Retry ${attempt}/${MAX_ATTEMPTS-1}`,'busy');
          log(`Automatic retry ${attempt}/${MAX_ATTEMPTS-1}: wait ${UI_SETTLE_DELAYS[attempt]/1000}s for controls · ${item.title}`);
          await sleep(RETRY_BACKOFF[attempt-1]);
          if(stopRequested)return false;
          await chrome.tabs.reload(opened);
        }
        showStatus('Waiting for YouTube controls','busy');
        await waitTabLoaded(opened,id,47000,UI_SETTLE_DELAYS[attempt]);
        if(stopRequested)return false;
        showStatus('Saving to playlist','busy');
        result=await runSave(opened,id);
        if(!result?.ok||!result.verified||result.playlist!==targetPlaylistName||result.videoId!==id)
          throw new Error(result?.error||'YouTube did not independently confirm playlist membership');
        lastError=null;
        break;
      }catch(e){
        lastError=e;
        const message=String(e?.message||e);
        const requiresUser=/sign in|not a bot|captcha|unavailable|invalid youtube|video mismatch|closed/i.test(message);
        log(`YouTube attempt ${attempt+1}/${MAX_ATTEMPTS} failed — ${message}`,'error');
        if(requiresUser || attempt===MAX_ATTEMPTS-1)break;
      }
    }
    if(lastError){
      const manual=/sign in|not a bot|captcha|unavailable|invalid youtube|video mismatch|closed/i.test(String(lastError.message||lastError));
      const exhausted=new Error((manual?'YouTube needs manual attention: ':'YouTube save failed after three attempts: ')+String(lastError.message||lastError));
      exhausted.youtubeRetryFailure=true;exhausted.item=item;
      throw exhausted;
    }
    // Write a recovery marker BEFORE touching the XLSM. If file writing fails,
    // reopening the extension will sync this exact song without duplicating it.
    await chrome.storage.local.set({[STATE_KEY]:{
      id:item.id,row:item.row,cell:item.cell,url:item.url,videoId:id,verifiedAt:new Date().toISOString(),
      fileName:workbook.fileName,sheetPath:workbook.sheetPath,playlist:targetPlaylistName,title:item.title,result:result.result,
      beforeTotal:workbook.items.length,beforeUrlCount:workbook.items.filter(x=>x.url===item.url).length
    }});
    log(`YouTube confirmed: ${result.result} · ${item.title}`);
    showStatus('Removing confirmed link','busy');
    await persistRemoved(item);
    showStatus(`Verified #${item.index+1}`,'success');
    return true;
  }
  async function run(){
    if(importRunning)return;
    if(!targetPlaylistName){selectTab('options');settingFeedback('Set and save a target playlist name first.',true);return;}
    if(!fileHandle){selectTab('options');return;}
    // Start is an explicit user gesture. Chrome may prompt to reauthorize its
    // remembered handle; no redundant Grant Access control is necessary.
    if(!await canWrite({request:true})){
      showStatus('Permission required','error');
      log('Chrome declined workbook write access. Choose the file again under Options.','error');return;
    }
    if(!workbook){
      try{
        await load();
        showStatus('Workbook connected','success');
        log('Remembered workbook opened after permission was granted.');
      }catch(e){
        currentFailure=true;refresh();
        showStatus('Workbook unavailable','error');
        log('Unable to read remembered workbook: '+String(e.message||e),'error');
        return;
      }
    }
    if((await chrome.storage.local.get(STATE_KEY))[STATE_KEY]){
      try{await recoverPending();}catch(e){log('Recovery failed: '+e.message,'error');return;}
    }
    if(currentFailure){log('Resolve the current failure or press Retry.','error');return;}
    importRunning=true;stopRequested=false;refresh();
    showStatus('Running','busy');
    while(!stopRequested){
      try{
        const did=await addNext();if(!did)break;
        await sleep(Number(UI.delay.value)*1000);
      }catch(e){
        currentFailure=true;stopRequested=true;
        const message=String(e.message||e);
        log('Paused — '+message,'error');showStatus('Paused — see Activity','error');
        // Also surface write/recovery failures: manual action may be required.
        await failureAlert(message,e.item||workbook?.items.find(x=>x.status!=='added'));
        break;
      }
    }
    importRunning=false;
    if(!currentFailure){
      if(workbook.items.every(x=>x.status==='added')){
        showStatus('All complete','success');log('All entries confirmed on YouTube and removed from the workbook queue.');
      }else{showStatus('Paused');log('Queue paused. You can resume later.');}
    }
    refresh();
  }
  UI.chooseFile.addEventListener('click',chooseWorkbook);
  UI.savePlaylist.addEventListener('click',()=>saveTargetPlaylist().catch(e=>settingFeedback(String(e),true)));
  UI.playlistName.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();saveTargetPlaylist().catch(err=>settingFeedback(String(err),true));}});
  UI.playlistName.addEventListener('input',()=>settingFeedback('Press Save name to apply.'));
  UI.start.addEventListener('click',()=>{primeAlertSound();run().catch(e=>log(String(e),'error'));});
  UI.stop.addEventListener('click',()=>{stopRequested=true;showStatus('Pausing','busy');log('Pause requested — finishing the current verified write if one is in progress.');});
  UI.retry.addEventListener('click',async()=>{
    primeAlertSound();
    currentFailure=false;refresh();
    try{await recoverPending();}catch(e){currentFailure=true;log('Recovery error: '+e.message,'error');refresh();return;}
    run().catch(e=>log(e.message,'error'));
  });
  UI.delay.addEventListener('input',()=>{
    UI.delayLabel.textContent=UI.delay.value+' s';
    chrome.storage.local.set({[PREF_DELAY]:Number(UI.delay.value)}).catch(console.warn);
  });
  chrome.storage.onChanged.addListener((changes,area)=>{
    if(area==='local'&&changes[UI_REQUEST_KEY]?.newValue?.tab){
      selectTab(changes[UI_REQUEST_KEY].newValue.tab);
    }
  });
  UI.exportLog.addEventListener('click',()=>{
    const data=logLines.map(x=>x.message).join('\r\n');
    const uri=URL.createObjectURL(new Blob([data],{type:'text/plain'}));
    const a=document.createElement('a');a.href=uri;a.download='youtube-playlist-import-log.txt';a.click();setTimeout(()=>URL.revokeObjectURL(uri),30000);
  });
  UI.clearLog.addEventListener('click',async()=>{
    if(!logLines.length)return;
    if(!window.confirm('Clear the activity log? This does not reset your queue, workbook or recovery progress.'))return;
    try{
      await chrome.storage.local.remove('spotifyActivity');
      logLines=[];renderLog();
    }catch(e){settingFeedback('Could not clear log: '+String(e),true);}
  });
  (async()=>{
    const initial=await chrome.storage.local.get([UI_TAB_KEY,UI_REQUEST_KEY,'spotifyActivity',PREF_PLAYLIST]);
    // v1.4.0 had a personal default. Migrate existing workbook installations
    // without changing the target or removing already-recorded queue progress.
    let rememberedHandle=null;
    try{rememberedHandle=await getStoredHandle();}
    catch(e){console.warn('Unable to restore remembered workbook:',e);}
    const savedTarget=cleanPlaylistName(initial[PREF_PLAYLIST]);
    targetPlaylistName=savedTarget||(rememberedHandle?LEGACY_PLAYLIST:DEFAULT_PLAYLIST);
    if(!savedTarget && rememberedHandle){
      await chrome.storage.local.set({[PREF_PLAYLIST]:targetPlaylistName});
    }
    displayPlaylistName();
    const requested=initial[UI_REQUEST_KEY];
    selectTab((requested?.tab&&tabNames.includes(requested.tab))?requested.tab:(initial[UI_TAB_KEY]||'home'),{persist:false});
    if(requested?.tab)await chrome.storage.local.remove(UI_REQUEST_KEY);
    logLines=Array.isArray(initial.spotifyActivity)?initial.spotifyActivity:[];
    renderLog();
    try{
      const settings=await chrome.storage.local.get(PREF_DELAY);
      const delay=Number(settings[PREF_DELAY]);if(Number.isInteger(delay)&&delay>=2&&delay<=20){UI.delay.value=String(delay);UI.delayLabel.textContent=delay+' s';}
      fileHandle=rememberedHandle;
      if(fileHandle){
        showWorkbook();
        if(await canWrite()){await load();showStatus('Saved workbook ready','success');log('Automatically loaded remembered XLSM.');}
        else{showStatus('Workbook access needed');log('Chrome needs renewed workbook permission. Start queue will request it.');}
      }else{showStatus('Configure workbook');showWorkbook();}
    }catch(e){workbook=null;showStatus('Reconnect saved workbook','error');showWorkbook();log('Saved workbook needs renewed access: '+e.message,'error');}
    refresh();
  })();
})();
