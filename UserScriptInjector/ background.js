chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'injectScript') {
    chrome.storage.local.get(['userScript'], function(result) {
      const code = result.userScript || '';
      chrome.scripting.executeScript({
        target: { tabId: sender.tab.id },
        func: new Function(code)
      });
    });
  }
});
