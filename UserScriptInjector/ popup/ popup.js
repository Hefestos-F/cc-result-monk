document.getElementById('save').addEventListener('click', () => {
  const script = document.getElementById('scriptEditor').value;
  chrome.storage.local.set({ userScript: script }, () => {
    alert('Script salvo com sucesso!');
  });
});

document.getElementById('inject').addEventListener('click', () => {
  chrome.runtime.sendMessage({ action: 'injectScript' });
});
