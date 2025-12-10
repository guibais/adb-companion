import { useState, useRef, useEffect } from "react";
import { Terminal as TerminalIcon, Send, Trash2, Copy } from "lucide-react";
import { Button, PageHeader } from "../components/ui";
import { useDeviceStore, useUiStore } from "../stores";

type CommandHistory = {
  command: string;
  output: string;
  timestamp: number;
};

const COMMON_COMMANDS = [
  { cmd: "getprop ro.build.version.release", label: "Android Version" },
  { cmd: "pm list packages -3", label: "List User Apps" },
  { cmd: "df -h", label: "Disk Usage" },
  { cmd: "cat /proc/meminfo", label: "Memory Info" },
  { cmd: "dumpsys battery", label: "Battery Info" },
  { cmd: "settings list global", label: "Global Settings" },
  { cmd: "wm size", label: "Screen Size" },
  { cmd: "input keyevent 26", label: "Power Button" },
  { cmd: "input keyevent 3", label: "Home Button" },
  { cmd: "input keyevent 4", label: "Back Button" },
];

export function ShellPage() {
  const { devices, tabs, activeTabId } = useDeviceStore();
  const { addToast } = useUiStore();

  const [command, setCommand] = useState("");
  const [history, setHistory] = useState<CommandHistory[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isExecuting, setIsExecuting] = useState(false);
  const outputRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const activeTab = tabs.find((t) => t.id === activeTabId);
  const activeDevice = activeTab?.deviceId
    ? devices.find((d) => d.id === activeTab.deviceId)
    : null;

  useEffect(() => {
    outputRef.current?.scrollTo({
      top: outputRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [history]);

  const executeCommand = async (cmd?: string) => {
    const commandToRun = cmd || command;
    if (!commandToRun.trim() || !activeDevice) return;

    setIsExecuting(true);
    const timestamp = Date.now();

    try {
      const output = await window.electronAPI["adb:shell"](
        activeDevice.id,
        commandToRun
      );
      setHistory((prev) => [
        ...prev,
        { command: commandToRun, output, timestamp },
      ]);
    } catch (err) {
      setHistory((prev) => [
        ...prev,
        { command: commandToRun, output: `Error: ${err}`, timestamp },
      ]);
    } finally {
      setIsExecuting(false);
      setCommand("");
      setHistoryIndex(-1);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      executeCommand();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const commands = history.map((h) => h.command);
      if (historyIndex < commands.length - 1) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        setCommand(commands[commands.length - 1 - newIndex]);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex > 0) {
        const commands = history.map((h) => h.command);
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setCommand(commands[commands.length - 1 - newIndex]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setCommand("");
      }
    }
  };

  const copyOutput = (output: string) => {
    navigator.clipboard.writeText(output);
    addToast({ type: "success", title: "Copied to clipboard" });
  };

  if (!activeDevice) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <TerminalIcon className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
          <h2 className="text-lg font-medium text-white mb-2">
            No Device Selected
          </h2>
          <p className="text-sm text-zinc-500">
            Connect a device to use the shell
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4 overflow-hidden h-full flex flex-col">
      <PageHeader title="ADB Shell">
        <Button variant="secondary" size="sm" onClick={() => setHistory([])}>
          <Trash2 className="w-4 h-4" />
          Clear
        </Button>
      </PageHeader>

      <div className="flex gap-2 flex-wrap">
        {COMMON_COMMANDS.slice(0, 6).map(({ cmd, label }) => (
          <Button
            key={cmd}
            variant="secondary"
            size="sm"
            onClick={() => executeCommand(cmd)}
            disabled={isExecuting}
          >
            {label}
          </Button>
        ))}
      </div>

      <div
        ref={outputRef}
        className="flex-1 overflow-y-auto bg-bg-secondary border border-border rounded-lg p-4 font-mono text-sm"
      >
        {history.map((item, idx) => (
          <div key={idx} className="mb-4">
            <div className="flex items-center gap-2 text-accent mb-1">
              <span className="text-zinc-600">$</span>
              <span>{item.command}</span>
              <button
                onClick={() => copyOutput(item.output)}
                className="ml-auto p-1 hover:bg-bg-tertiary rounded opacity-50 hover:opacity-100"
              >
                <Copy className="w-3 h-3" />
              </button>
            </div>
            <pre className="text-zinc-300 whitespace-pre-wrap break-all pl-4 border-l-2 border-border">
              {item.output || "(no output)"}
            </pre>
          </div>
        ))}

        {history.length === 0 && (
          <div className="text-center text-zinc-500 py-8">
            <p>Type a command below or use the quick commands above</p>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 bg-bg-secondary border border-border rounded-lg px-4 py-2">
        <span className="text-accent font-mono">$</span>
        <input
          ref={inputRef}
          type="text"
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter shell command..."
          disabled={isExecuting}
          className="flex-1 bg-transparent text-white font-mono text-sm focus:outline-none placeholder-zinc-600"
          autoFocus
        />
        <Button
          size="sm"
          onClick={() => executeCommand()}
          loading={isExecuting}
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>

      <div className="text-xs text-zinc-600">
        Press <kbd className="bg-bg-tertiary px-1.5 py-0.5 rounded">↑</kbd> /{" "}
        <kbd className="bg-bg-tertiary px-1.5 py-0.5 rounded">↓</kbd> for
        command history
      </div>
    </div>
  );
}
