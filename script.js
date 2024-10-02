const socket = io();
let currentGameId;
let playerChoice;

function joinGame() {
  document.getElementById('joinButton').disabled = true;
  socket.emit('joinGame');
}

socket.on('joinedGame', (data) => {
  currentGameId = data.gameId;
  document.getElementById('gameArea').style.display = 'block';
  document.getElementById('newGameButton').style.display = 'none'; // Esconde o botão de nova sala
  enableChoiceButtons(); // Habilita os botões de escolha novamente
});

socket.on('choiceRestrictions', (chosenChoice) => {
  if (chosenChoice === 'even') {
    document.getElementById('evenButton').disabled = true;
  } else if (chosenChoice === 'odd') {
    document.getElementById('oddButton').disabled = true;
  }
});

function makeChoice(choice) {
  const number = document.getElementById('number').value;
  if (!number || number < 1 || number > 10) {
    alert("Escolha um número válido entre 1 e 10!");
    return;
  }

  playerChoice = choice; // Armazena a escolha do jogador para exibir na mensagem final
  disableChoiceButtons();

  socket.emit('makeChoice', { gameId: currentGameId, choice, number });
}

socket.on('invalidChoice', (message) => {
  alert(message);
  enableChoiceButtons();
});

socket.on('gameResult', (data) => {
  console.log(data); // Para depuração
  const resultDiv = document.getElementById('result');

  // Personalizando a mensagem com base na escolha do jogador e o resultado
  const choiceText = playerChoice === 'even' ? 'Par' : 'Ímpar';
  const resultText = data.result === 'Você venceu!'
    ? `Você escolheu ${choiceText}, e a soma dos números foi ${data.sum}. Parabéns, você venceu!`
    : `Você escolheu ${choiceText}, e a soma dos números foi ${data.sum}, você perdeu!`;

  // Configura o estilo e o texto da mensagem de resultado
  resultDiv.className = data.result === 'Você venceu!' ? 'alert alert-success' : 'alert alert-danger';
  resultDiv.innerText = resultText;
  resultDiv.style.display = 'block';

  document.getElementById('newGameButton').style.display = 'block'; // Exibe o botão para nova sala
});

function startNewGame() {
  document.getElementById('result').innerText = '';
  document.getElementById('result').style.display = 'none';
  document.getElementById('joinButton').disabled = false;
  document.getElementById('gameArea').style.display = 'none';
  joinGame();
}

function disableChoiceButtons() {
  document.getElementById('evenButton').disabled = true;
  document.getElementById('oddButton').disabled = true;
}

function enableChoiceButtons() {
  document.getElementById('evenButton').disabled = false;
  document.getElementById('oddButton').disabled = false;
}