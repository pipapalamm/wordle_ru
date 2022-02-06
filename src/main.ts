import "./ui/main";
import { attachKeyboardProcessor } from "./keyboardProcessor";
import { Game } from "./game";
import { attachPhysicalKeyboardListeners } from "./physicalKeyboard";
import { setAttempt, setAttemptResult, rejectAttempt } from "./ui/gameField";
import {
  attachVirtualKeyboardListeners,
  setKeyboardState,
} from "./ui/virtualKeyboard";
import { notify } from "./ui/notification";
import * as modal from "./ui/modal";
import { MAX_ATTEMPTS } from "./constants";
import { calculateGameStats, loadGameStats, saveGameStats } from "./gameStats";
import { solutionForDate } from "./solutionPicker";
import { solutions } from "./solutions";
console.log("init main.ts");

const startWordDate = new Date(2022, 1, 6); // 6 марта 2022 года

const solution = solutionForDate({
  solutions,
  date: new Date(),
  startWordDate,
});

console.log(solution);
const game = new Game({
  solution,
  keyboardState: {},
  currentAttemptIndex: 0,
  maxAttempts: MAX_ATTEMPTS,
});

attachPhysicalKeyboardListeners();
attachVirtualKeyboardListeners();
const deattachKeyboardProcessor = attachKeyboardProcessor({
  typeCallback: onLetterType,
  commitCallback: onEnter,
  lettersLimitCallback: onLettersLimitCallback,
});

function onLettersLimitCallback() {
  console.log("ПЕРЕСТАНЬ НАБИРАТЬ");
}

function onLetterType(attempt: string) {
  setAttempt(attempt, game.currentAttemptIndex);
}

function onEnter(attempt: string) {
  const success = game.commitAttempt(attempt);
  return { success };
}

function updateGameStats(status: "win" | "fail") {
  const prevStats = loadGameStats();
  const newStats = calculateGameStats({ status, currentState: prevStats });
  saveGameStats(newStats);
}

game.on("attemptcommit", (event) => {
  setAttemptResult(event.attemptIndex, event.attemptResult);
  setKeyboardState(event.keyboardState);
});

game.on("notindictionary", (event) => {
  notify("Такого слова нет в игре");
  rejectAttempt(event.attemptIndex);
});

game.on("gamefail", (event) => {
  notify(event.solution);
  updateGameStats("fail");
  deattachKeyboardProcessor();
});

game.on("gamewin", (event) => {
  notify(
    ["Гениально!", "Восхитительно!", "Отлично!!", "Нормик!", "Пронесло!"][
      event.attemptIndex
    ]
  );
  modal.showModal();
  updateGameStats("win");
  deattachKeyboardProcessor();
});
