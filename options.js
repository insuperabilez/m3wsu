// --- ДОБАВЛЕН URL ПО УМОЛЧАНИЮ ---
const DEFAULT_URL = 'https://docs.google.com/document/d/1Z5_3cJCqZxWljQsQYV1pUhJhT-GzG_lEAFwHHvNYhwo/export?format=txt';

// Сохраняет опции в chrome.storage
function save_options() {
  const url = document.getElementById('googleDocUrl').value;
  chrome.storage.sync.set({
    googleDocUrl: url
  }, function() {
    // Показываем сообщение о том, что настройки сохранены
    const status = document.getElementById('status');
    status.textContent = 'Настройки сохранены!';
    setTimeout(function() {
      status.textContent = '';
    }, 1500);
  });
}

// Загружает сохраненный URL при открытии страницы настроек
function restore_options() {
  // Используем DEFAULT_URL, если в хранилище ничего нет
  chrome.storage.sync.get({
    googleDocUrl: DEFAULT_URL
  }, function(items) {
    document.getElementById('googleDocUrl').value = items.googleDocUrl;
  });
}

document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click', save_options);