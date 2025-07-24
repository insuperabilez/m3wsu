// Этот скрипт будет работать в фоне и отслеживать навигацию

chrome.webNavigation.onHistoryStateUpdated.addListener(details => {
    // Проверяем, что навигация произошла на нужной нам странице (в лобби)
    // и это основной фрейм, а не какой-нибудь iframe
    if (details.frameId === 0 && (details.url.includes('/cs2/room/') || details.url.includes('/ru/cs2/room/'))) {
      // Отправляем сообщение в content.js, который уже внедрен на этой вкладке
      chrome.tabs.sendMessage(details.tabId, {
        type: "URL_CHANGED",
        url: details.url
      });
    }
  });