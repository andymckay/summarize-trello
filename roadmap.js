var boardStore = new Map();
var cardStore = new Map();
var labelStore = new Map();
var listStore = new Map();

var boards = ['PC9kB14s', 'ZpIDuMAW', 'CR0YNhHg'];

function loadBoard(board) {
  return new Promise(function(resolve, reject) {
    let board_response = Trello.boards.get(`${board}`);
    board_response.then((board_obj) => {
      boardStore.set(board, board_obj);
    }).then(() => {
      resolve();
    });
  });
}

function loadList(board) {
  return new Promise(function(resolve, reject) {
    let lists_response = Trello.boards.get(`${board}/lists`);
    lists_response.then((lists) => {
      for (let list of lists) {
        listStore.set(list.id, {board_id: board, list: list});
      }
    }).then(() => {
      resolve();
    });
  });
}

function loadLabels(board) {
  return new Promise(function(resolve, reject) {
    let response = Trello.boards.get(`${board}/labels`);
    response.then((labels) => {
      for (let label of labels) {
        labelStore.set(label.id, {board_id: board, label: label});
      }
    }).then(() => {
      resolve();
    });
  });
}


function loadCards(board) {
  return new Promise(function(resolve, reject) {
    let cards_response = Trello.boards.get(`${board}/cards`);
    cards_response.then((cards) => {
      for (let card of cards) {
        cardStore.set(card.id, {board_id: board, card: card});
      }
    }).then(() => {
      resolve();
    });
  });
}

function populateBoard(board) {
  return new Promise(function(resolve, reject) {
    Promise.all([
      loadBoard(board),
      loadList(board),
      loadCards(board),
      loadLabels(board)
    ]).then(() => {
      resolve();
    });
  });
}

function cellLink(title, url) {
  let cell = document.createElement('td');
  let link = document.createElement('a');
  link.innerText = title;
  link.href = url;
  cell.appendChild(link);
  return cell;
}

function cell(title) {
  let cell = document.createElement('td');
  cell.innerText = title;
  return cell;
}

function addCardToTable(element, board, card) {
  let row = document.createElement('tr');
  row.id = `card-${card.id}`;
  row.appendChild(cellLink(board.name, board.url));
  row.appendChild(cellLink(card.name, card.url));
  let labels = [];
  for (let id of card.idLabels) {
    labels.push(labelStore.get(id).label.name);
  }
  row.appendChild(cell(labels.join(', ')));
  row.appendChild(cell(listStore.get(card.idList).list.name));
  element.appendChild(row);
}

function populateTable(element) {
  for (let card of cardStore.values()) {
    addCardToTable(element, boardStore.get(card.board_id), card.card);
  }
}

function filter(e) {
  let ids = [];
  let filter = e.target.dataset.value || null;
  if (filter) {
    let filter_values = filter.split(',');
    console.log('[trello] Filtering on:', filter_values);
    for (let label of labelStore.values()) {
      console.log(label.label.name);
      if (filter_values.includes(label.label.name.toLowerCase())) {
        ids.push(label.label.id);
      }
    }
  }

  console.log(ids);

  for (let card of cardStore.values()) {
    let display = document.getElementById(`card-${card.card.id}`);
    if (!filter || card.card.idLabels.filter((n) => ids.includes(n)).length) {
      display.style.display = null;
    } else {
      display.style.display = 'none';
    }
  }
}

document.addEventListener("DOMContentLoaded", (event) => {
  let populateBoards = boards.map((v) => { return populateBoard(v)});
  let element = document.getElementById('output');
  Promise.all(populateBoards).then((response) => {
    populateTable(element);
  });
});

document.getElementById("filter").addEventListener("click", filter);
