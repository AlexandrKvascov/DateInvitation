
// НАСТРОЙКИ ПРИГЛАШЕНИЯ
// Для нового свидания достаточно менять этот объект.

const CONFIG = {
  title: 'Я хочу позвать тебя на свидание',

  intro:
    'Мы знакомы уже больше семи лет. ' +
    'И мне хочется объединить два повода: ' +
    'нашу годовщину знакомства и 31 октября.\n\n' +
    'Как насчёт провести субботу вместе?',

  yesText:
    'Тогда давай выберем, что нам больше нравится.',

  maybeText:
    'Можно просто посмотреть варианты. ' +
    'Ни к чему не обязывает.',

  tiredTitle: 'Всё хорошо',

  tiredText:
    'Я понимаю. Тогда отдохни, ничего выбирать ' +
    'не нужно. В другой раз придумаем что-нибудь.',

  options: [
    {
      title: 'Костюмы и вечер в городе',
      description:
        'Нарядиться и сходить в несколько интересных мест.'
    },
    {
      title: 'Бильярд',
      description:
        'Просто поиграть, поболтать и хорошо ' +
        'провести время.'
    },
    {
      title: 'Тихое место с кино',
      description:
        'Устроиться поудобнее и посмотреть ужастики.'
    },
    {
      title: 'Вечер дома',
      description:
        'Еда, плед и ужастики без необходимости ' +
        'куда-то ехать.'
    }
  ],

  // Сюда потом вставишь адрес Google Apps Script.
  // Токен Telegram-бота здесь НЕ указывать.
  relayUrl: 'https://script.google.com/macros/s/AKfycbwXrV62u8Rctxlr4KLuQP-CnAx8EUfVV2A-btrnhtOQK9LtCZqRC2Gzo0cMZjuoUOaS/exec'
};


// ВСПОМОГАТЕЛЬНЫЕ ПЕРЕМЕННЫЕ

const $ = id => document.getElementById(id);

let answer = null;
let chosen = -1;
let lastMessage = '';

const session =
  crypto.randomUUID
    ? crypto.randomUUID()
    : String(Date.now());


// ПЕРЕКЛЮЧЕНИЕ ЭКРАНОВ

function screen(id) {
  for (const item of ['welcome', 'choices', 'result']) {
    $(item).classList.toggle('hidden', item !== id);
  }

  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
}


// ОТПРАВКА УВЕДОМЛЕНИЯ В TELEGRAM
// Через Google Apps Script.

async function notify(event, choice = '') {
  if (!CONFIG.relayUrl) {
    $('delivery').textContent =
      'Автоуведомления пока не подключены.';
    return;
  }

  try {
    await fetch(CONFIG.relayUrl, {
      method: 'POST',
      mode: 'no-cors',
      keepalive: true,

      body: new URLSearchParams({
        source: 'date-invite',
        event,
        choice,
        session
      })
    });

    // Режим no-cors не позволяет проверить,
    // действительно ли Telegram получил сообщение.
    $('delivery').textContent =
      'Ответ передан на отправку. ' +
      'Доставка не подтверждается браузером.';

  } catch {
    $('delivery').textContent =
      'Не удалось передать ответ. ' +
      'Его можно отправить вручную.';
  }
}


// ЭКРАН РЕЗУЛЬТАТА

function showResult(
  title,
  text,
  message,
  event,
  choice = ''
) {
  lastMessage = message;

  $('result-title').textContent = title;
  $('result-text').textContent = text;
  $('delivery').textContent = '';

  screen('result');

  notify(event, choice);
}


// ПЕРВЫЙ ОТВЕТ:
// ДА / ПОДУМАЮ / УСТАЛА

function firstAnswer(value) {
  answer = value;
  chosen = -1;

  if (value === 'no') {
    showResult(
      CONFIG.tiredTitle,
      CONFIG.tiredText,
      'Я устала, в этот раз не получится.',
      'no'
    );

    return;
  }

  $('choices-text').textContent =
    value === 'yes'
      ? CONFIG.yesText
      : CONFIG.maybeText;

  $('send-choice').disabled = true;
  $('option-list').replaceChildren();

  // Формируем карточки вариантов из CONFIG.
  CONFIG.options.forEach((item, index) => {
    const button = document.createElement('button');

    button.className = 'option';
    button.type = 'button';

    const title = document.createElement('strong');
    title.textContent = item.title;

    const description = document.createElement('span');
    description.textContent = item.description;

    button.append(title, description);

    button.addEventListener('click', () => {
      chosen = index;

      document
        .querySelectorAll('.option')
        .forEach(el => {
          el.classList.toggle(
            'selected',
            el === button
          );
        });

      $('send-choice').disabled = false;
    });

    $('option-list').append(button);
  });

  screen('choices');

  // Отправляем первый ответ сразу.
  // Не требуется выбирать конкретное свидание.
  notify(value);
}


// НАЧАЛЬНАЯ ЗАГРУЗКА

$('title').textContent = CONFIG.title;
$('intro').textContent = CONFIG.intro;


// КНОПКИ ПЕРВОГО ЭКРАНА

$('yes').addEventListener('click', () => {
  firstAnswer('yes');
});

$('maybe').addEventListener('click', () => {
  firstAnswer('maybe');
});

$('no').addEventListener('click', () => {
  firstAnswer('no');
});


// НАВИГАЦИЯ

$('back').addEventListener('click', () => {
  screen('welcome');
});

$('restart').addEventListener('click', () => {
  screen('welcome');
});


// ПОДТВЕРЖДЕНИЕ ВАРИАНТА СВИДАНИЯ

$('send-choice').addEventListener('click', () => {
  if (chosen < 0) return;

  const selected = CONFIG.options[chosen].title;

  const text =
    answer === 'yes'
      ? `Я выбрала вариант «${selected}».`
      : `Мне понравился вариант «${selected}», ` +
        'но я ещё подумаю.';

  showResult(
    answer === 'yes'
      ? 'Договорились!'
      : 'Без спешки',

    answer === 'yes'
      ? `Выбран вариант: ${selected}. Я буду рад.`
      : `Вариант «${selected}» можно оставить как идею.`,

    text,
    'choice',
    selected
  );
});


// РЕЗЕРВНАЯ РУЧНАЯ ОТПРАВКА

$('manual').addEventListener('click', () => {
  if (navigator.share) {
    navigator
      .share({ text: lastMessage })
      .catch(() => {});

  } else {
    const url =
      'https://t.me/share/url?url=' +
      encodeURIComponent(location.href) +
      '&text=' +
      encodeURIComponent(lastMessage);

    window.open(url, '_blank', 'noopener');
  }
});
