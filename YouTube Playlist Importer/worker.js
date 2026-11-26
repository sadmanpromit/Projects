/* Side-panel lifecycle and user-initiated notification navigation. */
const ALERT_PREFIX='ytImporterRetryFailure-';
async function configurePanel(){
  try { await chrome.sidePanel.setPanelBehavior({openPanelOnActionClick:true}); }
  catch(e){ console.warn('Unable to enable side-panel action',e); }
}
chrome.runtime.onInstalled.addListener(configurePanel);
chrome.runtime.onStartup.addListener(configurePanel);
// Focus the importer-owned YouTube work tab, not whatever tab the user last
// visited. The existing side panel stays associated with the work tab/window.
chrome.notifications.onClicked.addListener((notificationId)=>{
  if(!notificationId.startsWith(ALERT_PREFIX))return;
  (async()=>{
    const {ytImporterWorkTab:target}=await chrome.storage.local.get('ytImporterWorkTab');
    if(!Number.isInteger(target?.tabId)){
      console.warn('Importer work tab no longer exists; refusing to focus an unrelated tab');return;
    }
    let tab;
    try{tab=await chrome.tabs.get(target.tabId);}catch{
      console.warn('Importer work tab was closed; refusing to focus another tab');return;
    }
    if(!tab || tab.windowId!==target.windowId ||
      !/^https:\/\/www\.youtube\.com\/watch(?:\?|$)/.test(tab.url||'')){
      console.warn('Importer work tab changed unexpectedly; not switching tabs');return;
    }
    // The side panel is already open for this work window: switch directly to
    // the correct tab so Retry current is visible. Never open on current tab.
    await chrome.windows.update(tab.windowId,{focused:true});
    await chrome.tabs.update(tab.id,{active:true});
    await chrome.storage.local.set({ytImporterRequestedTab:{tab:'home',at:Date.now()}});
    // No sidePanel.open() call: it would create a new panel on another tab.
  })().catch(e=>console.warn('Unable to focus importer work tab:',e))
    .finally(()=>chrome.notifications.clear(notificationId).catch(()=>{}));
});
