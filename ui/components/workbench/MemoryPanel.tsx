"use client";

import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/FormControls";
import { Panel } from "@/components/ui/Panel";
import type { MemoryState } from "@/types/byteos";

export function MemoryPanel({
  memory,
  onSave
}: {
  memory: MemoryState;
  onSave: (memory: MemoryState) => void;
}) {
  const [fact, setFact] = useState("");
  const [todo, setTodo] = useState("");

  function addFact() {
    const value = fact.trim();
    if (!value) return;
    onSave({ ...memory, facts: [...memory.facts, value] });
    setFact("");
  }

  function addTodo() {
    const value = todo.trim();
    if (!value) return;
    onSave({ ...memory, todos: [...memory.todos, { text: value, done: false }] });
    setTodo("");
  }

  return (
    <div className="grid grid-cols-2 gap-5 animate-fade-in">
      <Panel title="Facts" eyebrow="Long-Term Context">
        <div className="grid gap-3">
          <div className="grid max-h-[420px] gap-2 overflow-auto">
            {memory.facts.length === 0 ? (
              <p className="rounded-workbench border border-dashed border-workbench-line p-5 text-sm text-workbench-muted">
                No facts yet. Add things ByteOS should remember about you.
              </p>
            ) : (
              memory.facts.map((item, index) => (
                <div key={`${item}-${index}`} className="flex items-center justify-between gap-3 rounded-workbench border border-workbench-line bg-[#101720] p-3 text-sm">
                  <span>{item}</span>
                  <Button
                    variant="ghost"
                    icon={<Trash2 size={15} />}
                    onClick={() => onSave({ ...memory, facts: memory.facts.filter((_, itemIndex) => itemIndex !== index) })}
                  >
                    Remove
                  </Button>
                </div>
              ))
            )}
          </div>
          <div className="grid grid-cols-[1fr_auto] gap-2">
            <Input value={fact} onChange={(event) => setFact(event.target.value)} placeholder="I am learning Python from zero" />
            <Button variant="primary" icon={<Plus size={16} />} onClick={addFact}>Add</Button>
          </div>
        </div>
      </Panel>

      <Panel title="Todos" eyebrow="Task Memory">
        <div className="grid gap-3">
          <div className="grid max-h-[420px] gap-2 overflow-auto">
            {memory.todos.length === 0 ? (
              <p className="rounded-workbench border border-dashed border-workbench-line p-5 text-sm text-workbench-muted">
                No todos yet. Add tasks ByteOS can keep in context.
              </p>
            ) : (
              memory.todos.map((item, index) => (
                <div key={`${item.text}-${index}`} className="flex items-center justify-between gap-3 rounded-workbench border border-workbench-line bg-[#101720] p-3 text-sm">
                  <button
                    className="text-left"
                    onClick={() => onSave({
                      ...memory,
                      todos: memory.todos.map((todoItem, itemIndex) => itemIndex === index ? { ...todoItem, done: !todoItem.done } : todoItem)
                    })}
                  >
                    <span className={item.done ? "text-workbench-muted line-through" : ""}>{item.done ? "[x]" : "[ ]"} {item.text}</span>
                  </button>
                  <Button
                    variant="ghost"
                    icon={<Trash2 size={15} />}
                    onClick={() => onSave({ ...memory, todos: memory.todos.filter((_, itemIndex) => itemIndex !== index) })}
                  >
                    Remove
                  </Button>
                </div>
              ))
            )}
          </div>
          <div className="grid grid-cols-[1fr_auto] gap-2">
            <Input value={todo} onChange={(event) => setTodo(event.target.value)} placeholder="Build ByteOS desktop app" />
            <Button variant="primary" icon={<Plus size={16} />} onClick={addTodo}>Add</Button>
          </div>
        </div>
      </Panel>
    </div>
  );
}
