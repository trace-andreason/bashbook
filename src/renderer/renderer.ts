import type { ActivationFunction } from "vscode-notebook-renderer";
import { Terminal } from "xterm";
import "xterm/css/xterm.css";
import "./renderer.css";

interface TerminalState {
  term: Terminal;
  content: string;
}

const COLS = 80;
const ROWS_MAX = 30;

export const activate: ActivationFunction = (context) => {
  const map = new Map<string, TerminalState>();

  const createTerminal = (uri: string) => {
    const term = new Terminal({
      rendererType: "dom",
      cols: COLS,
      rows: 1,
    });

    if (context.postMessage) {
      term.onData((data) => {
        context.postMessage!({
          uri,
          data,
        });
      });
    }

    return term;
  };

  const getTerminal = (uri: string, create: boolean, element: HTMLElement) => {
    const has = map.has(uri);
    if (create || !has) {
      if (has) {
        const state = map.get(uri)!;
        state.content = "";
        state.term.clear();
        state.term.open(element);
      } else {
        const term = createTerminal(uri);
        term.open(element);
        map.set(uri, { term, content: "" });
      }
    }
    return map.get(uri)!;
  };

  return {
    renderOutputItem(outputItem, element) {
      const { uri, data, create } = outputItem.json();
      const state = getTerminal(uri, create, element);
      state.term.write(data);
      state.content += data;
      const lines = state.content.split("\n");
      const rows = Math.min(ROWS_MAX, lines.length);
      if (state.term.rows !== rows) {
        state.term.resize(COLS, rows);
      }
    },
  };
};
