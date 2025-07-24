// --- ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ---
const playerData = new Map();
const NICKNAME_SELECTOR = '.Nickname__Name-sc-e7d5c77a-1';
const TOOLTIP_CLASS = 'faceit-helper-tooltip';
const DEFAULT_URL = 'https://docs.google.com/document/d/1Z5_3cJCqZxWljQsQYV1pUhJhT-GzG_lEAFwHHvNYhwo/export?format=txt';
let observer = null;

// --- ФУНКЦИИ-ПОМОЩНИКИ (без изменений) ---
function getTooltipId(nickname) {
    const safeNickname = nickname.replace(/[^a-zA-Z0-9_-]/g, '');
    return `faceit-helper-tooltip-for-${safeNickname}`;
}

function showTooltip(button, description, tooltipId) {
    const tooltip = document.createElement('div');
    tooltip.id = tooltipId;
    tooltip.className = TOOLTIP_CLASS;
    tooltip.textContent = description;
    document.body.appendChild(tooltip);
    const buttonRect = button.getBoundingClientRect();
    tooltip.style.left = `${buttonRect.left + window.scrollX}px`;
    tooltip.style.top = `${buttonRect.bottom + window.scrollY + 5}px`;
}

function hideAllTooltips() {
    document.querySelectorAll(`.${TOOLTIP_CLASS}`).forEach(tip => tip.remove());
}

// --- ЛОГИКА ОБРАБОТКИ ---

// --- ИЗМЕНЕНА ТОЛЬКО ЭТА ФУНКЦИЯ ---
function parseGoogleDoc(text) {
    playerData.clear();
    const plainText = text.replace(/<[^>]*>/g, '');
    const lines = plainText.split('\n');

    lines.forEach(line => {
        const separator = ' - ';
        const separatorIndex = line.indexOf(separator);

        // Если разделитель " - " найден в строке
        if (separatorIndex !== -1) {
            // Никнейм - это всё, что до ПЕРВОГО разделителя
            const nickname = line.substring(0, separatorIndex).trim();
            
            // Описание - это всё, что после ПЕРВОГО разделителя
            const description = line.substring(separatorIndex + separator.length).trim();

            // Добавляем только если и ник, и описание не пустые
            if (nickname && description) {
                playerData.set(nickname.toLowerCase(), description);
            }
        }
    });

    console.log('FACEIT Helper: Данные из Google Документа успешно загружены:');
    console.table(Object.fromEntries(playerData));
}
// --- КОНЕЦ ИЗМЕНЕНИЙ В ФУНКЦИИ ---


function processNicknames() {
    const nicknameElements = document.querySelectorAll(NICKNAME_SELECTOR);
    if (nicknameElements.length === 0) return;

    console.log(`FACEIT Helper: Найдено ${nicknameElements.length} элементов с никнеймами. Начинаем проверку...`);
    let matchesFound = 0;

    nicknameElements.forEach(nickElement => {
        if (nickElement.dataset.helperProcessed) return;
        nickElement.dataset.helperProcessed = 'true';

        const nickname = nickElement.textContent.trim();
        const nicknameLower = nickname.toLowerCase();

        if (playerData.has(nicknameLower)) {
            matchesFound++;
            const description = playerData.get(nicknameLower);
            console.log(`FACEIT Helper: Найдено совпадение для игрока "${nickname}". Описание: ${description}`);

            const infoButton = document.createElement('button');
            infoButton.textContent = 'ℹ️';
            infoButton.className = 'faceit-helper-button';

            infoButton.addEventListener('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                const tooltipId = getTooltipId(nickname);
                const existingTooltip = document.getElementById(tooltipId);
                if (existingTooltip) {
                    existingTooltip.remove();
                    return;
                }
                hideAllTooltips();
                showTooltip(infoButton, description, tooltipId);
            });
            nickElement.insertAdjacentElement('afterend', infoButton);
        }
    });

    if (matchesFound > 0) {
        if (observer) {
            observer.disconnect();
            observer = null;
            console.log('FACEIT Helper: Все игроки обработаны. Наблюдатель остановлен.');
        }
    }
}

function startObserver() {
    if (observer) observer.disconnect();
    observer = new MutationObserver(() => {
        processNicknames();
    });
    observer.observe(document.body, { childList: true, subtree: true });
    processNicknames();
}

async function initialize() {
    if (playerData.size > 0) {
        console.log("FACEIT Helper: Данные уже загружены, запускаем наблюдатель.");
        startObserver();
        return;
    }
    const result = await chrome.storage.sync.get({ googleDocUrl: DEFAULT_URL });
    if (!result.googleDocUrl) {
        console.log('FACEIT Helper: URL Google Документа не настроен.');
        return;
    }
    try {
        const response = await fetch(result.googleDocUrl);
        if (!response.ok) throw new Error(`Ошибка сети: ${response.status}`);
        const text = await response.text();
        parseGoogleDoc(text);
        startObserver();
    } catch (error) {
        console.error('FACEIT Helper: Не удалось загрузить данные из Google Документа.', error);
    }
}

// --- НОВАЯ СТРУКТУРА ЗАПУСКА ---

function main() {
    if (observer) {
        observer.disconnect();
        observer = null;
    }
    hideAllTooltips();
    document.querySelectorAll('.faceit-helper-button').forEach(el => el.remove());

    if (window.location.href.includes('/cs2/room/')) {
        console.log("FACEIT Helper: Обнаружена страница лобби. Запуск.");
        initialize();
    } else {
        console.log("FACEIT Helper: Не страница лобби. Расширение неактивно.");
    }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === "URL_CHANGED") {
        console.log("FACEIT Helper: Получено сообщение о смене URL.");
        setTimeout(main, 500);
    }
});

document.addEventListener('click', (e) => {
    if (!e.target.closest(`.${TOOLTIP_CLASS}, .faceit-helper-button`)) {
        hideAllTooltips();
    }
});

main();